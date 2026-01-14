import { MemoryFileStorage } from '../src/storage';
import { AttachmentData } from '../src/types';

describe('MemoryFileStorage', () => {
    let storage: MemoryFileStorage;

    beforeEach(() => {
        storage = new MemoryFileStorage({
            baseUrl: 'http://localhost:3000/api/files'
        });
    });

    afterEach(() => {
        storage.clear();
    });

    describe('save', () => {
        it('should save a file and return attachment metadata', async () => {
            const fileBuffer = Buffer.from('test file content');
            const filename = 'test.txt';
            const mimeType = 'text/plain';

            const result = await storage.save(fileBuffer, filename, mimeType);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result.url).toContain('http://localhost:3000/api/files');
            expect(result.size).toBe(fileBuffer.length);
            expect(result.type).toBe(mimeType);
            expect(result.original_name).toBe(filename);
            expect(result).toHaveProperty('uploaded_at');
        });

        it('should include user ID when provided', async () => {
            const fileBuffer = Buffer.from('test file content');
            const filename = 'test.txt';
            const mimeType = 'text/plain';
            const userId = 'user_123';

            const result = await storage.save(fileBuffer, filename, mimeType, { userId });

            expect(result.uploaded_by).toBe(userId);
        });

        it('should preserve file extension in stored filename', async () => {
            const fileBuffer = Buffer.from('test file content');
            const filename = 'document.pdf';
            const mimeType = 'application/pdf';

            const result = await storage.save(fileBuffer, filename, mimeType);

            expect(result.name).toMatch(/\.pdf$/);
        });
    });

    describe('get', () => {
        it('should retrieve a saved file', async () => {
            const fileBuffer = Buffer.from('test file content');
            const filename = 'test.txt';
            const mimeType = 'text/plain';

            const attachment = await storage.save(fileBuffer, filename, mimeType);
            const retrieved = await storage.get(attachment.id!);

            expect(retrieved).not.toBeNull();
            expect(retrieved!.toString()).toBe(fileBuffer.toString());
        });

        it('should return null for non-existent file', async () => {
            const result = await storage.get('non_existent_id');
            expect(result).toBeNull();
        });
    });

    describe('delete', () => {
        it('should delete a file', async () => {
            const fileBuffer = Buffer.from('test file content');
            const filename = 'test.txt';
            const mimeType = 'text/plain';

            const attachment = await storage.save(fileBuffer, filename, mimeType);
            const deleted = await storage.delete(attachment.id!);

            expect(deleted).toBe(true);

            const retrieved = await storage.get(attachment.id!);
            expect(retrieved).toBeNull();
        });

        it('should return false when deleting non-existent file', async () => {
            const result = await storage.delete('non_existent_id');
            expect(result).toBe(false);
        });
    });

    describe('getPublicUrl', () => {
        it('should generate a public URL', () => {
            const filePath = 'uploads/test.txt';
            const url = storage.getPublicUrl(filePath);

            expect(url).toBe('http://localhost:3000/api/files/uploads/test.txt');
        });
    });
});
