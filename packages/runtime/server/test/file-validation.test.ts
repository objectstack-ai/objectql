import { validateFile } from '../src/file-handler';
import { FieldConfig } from '@objectql/types';

describe('File Validation', () => {
    describe('validateFile', () => {
        it('should pass validation when no field config is provided', () => {
            const file = {
                filename: 'test.pdf',
                mimeType: 'application/pdf',
                buffer: Buffer.from('test content')
            };

            const result = validateFile(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should validate file size limits', () => {
            const file = {
                filename: 'test.pdf',
                mimeType: 'application/pdf',
                buffer: Buffer.from('a'.repeat(1000)) // 1000 bytes
            };

            const fieldConfig: FieldConfig = {
                type: 'file',
                max_size: 500 // 500 bytes max
            };

            const result = validateFile(file, fieldConfig);

            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('FILE_TOO_LARGE');
            expect(result.error?.message).toContain('exceeds maximum');
        });

        it('should validate minimum file size', () => {
            const file = {
                filename: 'test.pdf',
                mimeType: 'application/pdf',
                buffer: Buffer.from('small')
            };

            const fieldConfig: FieldConfig = {
                type: 'file',
                min_size: 100 // 100 bytes minimum
            };

            const result = validateFile(file, fieldConfig);

            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('FILE_TOO_SMALL');
            expect(result.error?.message).toContain('below minimum');
        });

        it('should validate accepted file extensions', () => {
            const file = {
                filename: 'test.exe',
                mimeType: 'application/x-msdownload',
                buffer: Buffer.from('test content')
            };

            const fieldConfig: FieldConfig = {
                type: 'file',
                accept: ['.pdf', '.jpg', '.png']
            };

            const result = validateFile(file, fieldConfig);

            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('FILE_TYPE_NOT_ALLOWED');
            expect(result.error?.message).toContain('not allowed');
        });

        it('should accept file when extension is in allowed list', () => {
            const file = {
                filename: 'document.pdf',
                mimeType: 'application/pdf',
                buffer: Buffer.from('test content')
            };

            const fieldConfig: FieldConfig = {
                type: 'file',
                accept: ['.pdf', '.docx']
            };

            const result = validateFile(file, fieldConfig);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should handle case-insensitive extension matching', () => {
            const file = {
                filename: 'document.PDF',
                mimeType: 'application/pdf',
                buffer: Buffer.from('test content')
            };

            const fieldConfig: FieldConfig = {
                type: 'file',
                accept: ['.pdf']
            };

            const result = validateFile(file, fieldConfig);

            expect(result.valid).toBe(true);
        });

        it('should pass all validations for valid file', () => {
            const file = {
                filename: 'receipt.jpg',
                mimeType: 'image/jpeg',
                buffer: Buffer.from('a'.repeat(500))
            };

            const fieldConfig: FieldConfig = {
                type: 'image',
                accept: ['.jpg', '.jpeg', '.png'],
                max_size: 1000,
                min_size: 100
            };

            const result = validateFile(file, fieldConfig);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });
});
