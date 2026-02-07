/**
 * Type declarations for wa-sqlite
 * Basic type definitions for the wa-sqlite WASM module
 */

declare module 'wa-sqlite/dist/wa-sqlite-async.mjs' {
    export default function SQLiteESMFactory(): Promise<any>;
}

declare module 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js' {
    export class OriginPrivateFileSystemVFS {
        static create(name: string, sqlite3: any): Promise<any>;
    }
}
