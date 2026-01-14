import { IFileStorage, AttachmentData, FileStorageOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Local filesystem storage implementation for file attachments
 */
export class LocalFileStorage implements IFileStorage {
    private baseDir: string;
    private baseUrl: string;

    constructor(options: { baseDir: string; baseUrl: string }) {
        this.baseDir = options.baseDir;
        this.baseUrl = options.baseUrl;
        
        // Ensure base directory exists
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async save(file: Buffer, filename: string, mimeType: string, options?: FileStorageOptions): Promise<AttachmentData> {
        // Generate unique ID for the file
        const id = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const storedFilename = `${id}${ext}`;
        
        // Determine storage path
        let folder = options?.folder || 'uploads';
        if (options?.object) {
            folder = path.join(folder, options.object);
        }
        
        const folderPath = path.join(this.baseDir, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const filePath = path.join(folderPath, storedFilename);
        
        // Write file to disk (async for better performance)
        await fs.promises.writeFile(filePath, file);
        
        // Generate public URL
        const url = this.getPublicUrl(path.join(folder, storedFilename));
        
        const attachmentData: AttachmentData = {
            id,
            name: storedFilename,
            url,
            size: file.length,
            type: mimeType,
            original_name: filename,
            uploaded_at: new Date().toISOString(),
            uploaded_by: options?.userId
        };
        
        return attachmentData;
    }

    async get(fileId: string): Promise<Buffer | null> {
        try {
            // Search for file in the upload directory
            const found = this.findFile(this.baseDir, fileId);
            if (!found) {
                return null;
            }
            // Use async read for better performance
            return await fs.promises.readFile(found);
        } catch (error) {
            console.error('Error reading file:', error);
            return null;
        }
    }

    async delete(fileId: string): Promise<boolean> {
        try {
            const found = this.findFile(this.baseDir, fileId);
            if (!found) {
                return false;
            }
            // Use async unlink for better performance
            await fs.promises.unlink(found);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    getPublicUrl(filePath: string): string {
        // Normalize path separators for URLs
        const normalizedPath = filePath.replace(/\\/g, '/');
        return `${this.baseUrl}/${normalizedPath}`;
    }

    /**
     * Recursively search for a file by ID
     */
    private findFile(dir: string, fileId: string): string | null {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                const found = this.findFile(filePath, fileId);
                if (found) {
                    return found;
                }
            } else if (file.startsWith(fileId)) {
                return filePath;
            }
        }
        
        return null;
    }
}

/**
 * Memory storage implementation for testing
 */
export class MemoryFileStorage implements IFileStorage {
    private files = new Map<string, { buffer: Buffer; metadata: AttachmentData }>();
    private baseUrl: string;

    constructor(options: { baseUrl: string }) {
        this.baseUrl = options.baseUrl;
    }

    async save(file: Buffer, filename: string, mimeType: string, options?: FileStorageOptions): Promise<AttachmentData> {
        const id = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(filename);
        const storedFilename = `${id}${ext}`;
        
        const attachmentData: AttachmentData = {
            id,
            name: storedFilename,
            url: this.getPublicUrl(storedFilename),
            size: file.length,
            type: mimeType,
            original_name: filename,
            uploaded_at: new Date().toISOString(),
            uploaded_by: options?.userId
        };
        
        this.files.set(id, { buffer: file, metadata: attachmentData });
        
        return attachmentData;
    }

    async get(fileId: string): Promise<Buffer | null> {
        const entry = this.files.get(fileId);
        return entry ? entry.buffer : null;
    }

    async delete(fileId: string): Promise<boolean> {
        return this.files.delete(fileId);
    }

    getPublicUrl(filePath: string): string {
        return `${this.baseUrl}/${filePath}`;
    }

    clear(): void {
        this.files.clear();
    }
}
