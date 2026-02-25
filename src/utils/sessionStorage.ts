/**
 * Session persistence utility using IndexedDB + localStorage.
 * 
 * - IndexedDB stores the PDF file (can be up to 20MB, too large for localStorage)
 * - localStorage stores annotations, current page, and font settings
 * 
 * Automatically saves state on every change and restores on page load.
 */

const DB_NAME = 'pdf-editor-session';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const ANNOTATIONS_KEY = 'pdf-editor-annotations';
const SETTINGS_KEY = 'pdf-editor-settings';

interface SavedSettings {
    currentPage: number;
    fontSize: number;
    fontColor: string;
    fileName: string;
}

// ── IndexedDB helpers ──

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Save PDF file bytes to IndexedDB */
export async function savePdfFile(file: File): Promise<void> {
    try {
        const db = await openDB();
        const arrayBuffer = await file.arrayBuffer();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        // Store the raw bytes + metadata
        store.put({ bytes: arrayBuffer, name: file.name, type: file.type }, 'current-pdf');
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    } catch (e) {
        console.warn('Failed to save PDF to IndexedDB:', e);
    }
}

/** Load PDF file from IndexedDB */
export async function loadSavedPdfFile(): Promise<File | null> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('current-pdf');
        const result = await new Promise<{ bytes: ArrayBuffer; name: string; type: string } | undefined>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        db.close();

        if (!result) return null;
        return new File([result.bytes], result.name, { type: result.type });
    } catch (e) {
        console.warn('Failed to load PDF from IndexedDB:', e);
        return null;
    }
}

/** Clear saved PDF from IndexedDB */
export async function clearSavedPdfFile(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('current-pdf');
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    } catch (e) {
        console.warn('Failed to clear IndexedDB:', e);
    }
}

// ── localStorage helpers ──

/** Save annotations to localStorage */
export function saveAnnotations(annotations: unknown[]): void {
    try {
        localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
    } catch (e) {
        console.warn('Failed to save annotations:', e);
    }
}

/** Load annotations from localStorage */
export function loadSavedAnnotations(): unknown[] | null {
    try {
        const data = localStorage.getItem(ANNOTATIONS_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('Failed to load annotations:', e);
        return null;
    }
}

/** Save editor settings to localStorage */
export function saveSettings(settings: SavedSettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

/** Load editor settings from localStorage */
export function loadSavedSettings(): SavedSettings | null {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('Failed to load settings:', e);
        return null;
    }
}

/** Clear all saved session data */
export async function clearSession(): Promise<void> {
    localStorage.removeItem(ANNOTATIONS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    await clearSavedPdfFile();
}
