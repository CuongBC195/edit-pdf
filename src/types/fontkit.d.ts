declare module 'fontkit' {
    export function create(buffer: Buffer | ArrayBuffer | Uint8Array, postscriptName?: string): any;
    export function registerFormat(format: any): void;
    export let logErrors: boolean;
    export let defaultLanguage: string;
    export function setDefaultLanguage(lang?: string): void;
}
