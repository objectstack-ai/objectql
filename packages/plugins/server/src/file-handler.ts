/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { IFileStorage, AttachmentData, ErrorCode } from './types';
import { IObjectQL, FieldConfig } from '@objectql/types';

/**
 * Parse multipart/form-data request
 */
export function parseMultipart(
    req: IncomingMessage,
    boundary: string
): Promise<{ fields: Record<string, string>; files: Array<{ fieldname: string; filename: string; mimeType: string; buffer: Buffer }> }> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('error', reject);
        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const result = parseMultipartBuffer(buffer, boundary);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    });
}

function parseMultipartBuffer(
    buffer: Buffer,
    boundary: string
): { fields: Record<string, string>; files: Array<{ fieldname: string; filename: string; mimeType: string; buffer: Buffer }> } {
    const fields: Record<string, string> = {};
    const files: Array<{ fieldname: string; filename: string; mimeType: string; buffer: Buffer }> = [];
    
    const delimiter = Buffer.from(`--${boundary}`);
    const parts = splitBuffer(buffer, delimiter);
    
    for (const part of parts) {
        if (part.length === 0 || part.toString().trim() === '--') {
            continue;
        }
        
        // Find header/body separator (double CRLF)
        const headerEnd = findSequence(part, Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;
        
        const headerSection = part.slice(0, headerEnd).toString();
        const bodySection = part.slice(headerEnd + 4);
        
        // Parse Content-Disposition header
        const dispositionMatch = headerSection.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i);
        if (!dispositionMatch) continue;
        
        const fieldname = dispositionMatch[1];
        const filename = dispositionMatch[2];
        
        if (filename) {
            // This is a file upload
            const contentTypeMatch = headerSection.match(/Content-Type: (.+)/i);
            const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
            
            // Remove trailing CRLF from body
            let fileBuffer = bodySection;
            if (fileBuffer.length >= 2 && fileBuffer[fileBuffer.length - 2] === 0x0d && fileBuffer[fileBuffer.length - 1] === 0x0a) {
                fileBuffer = fileBuffer.slice(0, -2);
            }
            
            files.push({ fieldname, filename, mimeType, buffer: fileBuffer });
        } else {
            // This is a regular form field
            let value = bodySection.toString('utf-8');
            if (value.endsWith('\r\n')) {
                value = value.slice(0, -2);
            }
            fields[fieldname] = value;
        }
    }
    
    return { fields, files };
}

function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
    const parts: Buffer[] = [];
    let start = 0;
    let pos = 0;
    
    while (pos <= buffer.length - delimiter.length) {
        let match = true;
        for (let i = 0; i < delimiter.length; i++) {
            if (buffer[pos + i] !== delimiter[i]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            if (pos > start) {
                parts.push(buffer.slice(start, pos));
            }
            pos += delimiter.length;
            start = pos;
        } else {
            pos++;
        }
    }
    
    if (start < buffer.length) {
        parts.push(buffer.slice(start));
    }
    
    return parts;
}

function findSequence(buffer: Buffer, sequence: Buffer): number {
    for (let i = 0; i <= buffer.length - sequence.length; i++) {
        let match = true;
        for (let j = 0; j < sequence.length; j++) {
            if (buffer[i + j] !== sequence[j]) {
                match = false;
                break;
            }
        }
        if (match) return i;
    }
    return -1;
}

/**
 * Validate uploaded file against field configuration
 */
export function validateFile(
    file: { filename: string; mimeType: string; buffer: Buffer },
    fieldConfig?: FieldConfig,
    objectName?: string,
    fieldName?: string
): { valid: boolean; error?: { code: string; message: string; details?: any } } {
    // If no field config provided, allow the upload
    if (!fieldConfig) {
        return { valid: true };
    }
    
    const fileSize = file.buffer.length;
    const fileName = file.filename;
    const mimeType = file.mimeType;
    
    // Validate file size
    if (fieldConfig.max_size && fileSize > fieldConfig.max_size) {
        return {
            valid: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: `File size (${fileSize} bytes) exceeds maximum allowed size (${fieldConfig.max_size} bytes)`,
                details: {
                    file: fileName,
                    size: fileSize,
                    max_size: fieldConfig.max_size
                }
            }
        };
    }
    
    if (fieldConfig.min_size && fileSize < fieldConfig.min_size) {
        return {
            valid: false,
            error: {
                code: 'FILE_TOO_SMALL',
                message: `File size (${fileSize} bytes) is below minimum required size (${fieldConfig.min_size} bytes)`,
                details: {
                    file: fileName,
                    size: fileSize,
                    min_size: fieldConfig.min_size
                }
            }
        };
    }
    
    // Validate file type/extension
    if (fieldConfig.accept && Array.isArray(fieldConfig.accept) && fieldConfig.accept.length > 0) {
        const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        const acceptedExtensions = fieldConfig.accept.map(ext => ext.toLowerCase());
        
        if (!acceptedExtensions.includes(fileExt)) {
            return {
                valid: false,
                error: {
                    code: 'FILE_TYPE_NOT_ALLOWED',
                    message: `File type '${fileExt}' is not allowed. Allowed types: ${acceptedExtensions.join(', ')}`,
                    details: {
                        file: fileName,
                        extension: fileExt,
                        allowed: acceptedExtensions
                    }
                }
            };
        }
    }
    
    return { valid: true };
}

/**
 * Send error response
 */
export function sendError(res: ServerResponse, statusCode: number, code: string, message: string, details?: any) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify({
        error: {
            code,
            message,
            details
        }
    }));
}

/**
 * Send success response
 */
export function sendSuccess(res: ServerResponse, data: any) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ data }));
}

/**
 * Extract user ID from authorization header
 * @internal This is a placeholder implementation. In production, integrate with actual auth middleware.
 */
function extractUserId(authHeader: string | undefined): string | undefined {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return undefined;
    }
    
    // TODO: In production, decode JWT or validate token properly
    // This is a placeholder implementation
    console.warn('[Security] File upload authentication is using placeholder implementation. Integrate with actual auth system.');
    return 'user_from_token';
}

/**
 * Create file upload handler
 */
export function createFileUploadHandler(storage: IFileStorage, app: IObjectQL) {
    return async (req: IncomingMessage, res: ServerResponse) => {
        try {
            // Check content type
            const contentType = req.headers['content-type'];
            if (!contentType || !contentType.startsWith('multipart/form-data')) {
                sendError(res, 400, ErrorCode.INVALID_REQUEST, 'Content-Type must be multipart/form-data');
                return;
            }
            
            // Extract boundary
            const boundaryMatch = contentType.match(/boundary=(.+)/);
            if (!boundaryMatch) {
                sendError(res, 400, ErrorCode.INVALID_REQUEST, 'Missing boundary in Content-Type');
                return;
            }
            
            const boundary = boundaryMatch[1];
            
            // Parse multipart data
            const { fields, files } = await parseMultipart(req, boundary);
            
            if (files.length === 0) {
                sendError(res, 400, ErrorCode.INVALID_REQUEST, 'No file provided');
                return;
            }
            
            // Get field configuration if object and field are specified
            let fieldConfig: FieldConfig | undefined;
            if (fields.object && fields.field) {
                const objectConfig = (app as any).getObject(fields.object);
                if (objectConfig && objectConfig.fields) {
                    fieldConfig = objectConfig.fields[fields.field];
                }
            }
            
            // Single file upload
            const file = files[0];
            
            // Validate file
            const validation = validateFile(file, fieldConfig, fields.object, fields.field);
            if (!validation.valid) {
                sendError(res, 400, validation.error!.code, validation.error!.message, validation.error!.details);
                return;
            }
            
            // Extract user ID from authorization header
            const userId = extractUserId(req.headers.authorization);
            
            // Save file
            const attachmentData = await storage.save(
                file.buffer,
                file.filename,
                file.mimeType,
                {
                    folder: fields.folder,
                    object: fields.object,
                    field: fields.field,
                    userId
                }
            );
            
            sendSuccess(res, attachmentData);
        } catch (error) {
            console.error('File upload error:', error);
            sendError(res, 500, ErrorCode.INTERNAL_ERROR, 'File upload failed');
        }
    };
}

/**
 * Create batch file upload handler
 */
export function createBatchFileUploadHandler(storage: IFileStorage, app: IObjectQL) {
    return async (req: IncomingMessage, res: ServerResponse) => {
        try {
            // Check content type
            const contentType = req.headers['content-type'];
            if (!contentType || !contentType.startsWith('multipart/form-data')) {
                sendError(res, 400, ErrorCode.INVALID_REQUEST, 'Content-Type must be multipart/form-data');
                return;
            }
            
            // Extract boundary
            const boundaryMatch = contentType.match(/boundary=(.+)/);
            if (!boundaryMatch) {
                sendError(res, 400, ErrorCode.INVALID_REQUEST, 'Missing boundary in Content-Type');
                return;
            }
            
            const boundary = boundaryMatch[1];
            
            // Parse multipart data
            const { fields, files } = await parseMultipart(req, boundary);
            
            if (files.length === 0) {
                sendError(res, 400, ErrorCode.INVALID_REQUEST, 'No files provided');
                return;
            }
            
            // Get field configuration if object and field are specified
            let fieldConfig: FieldConfig | undefined;
            if (fields.object && fields.field) {
                const objectConfig = (app as any).getObject(fields.object);
                if (objectConfig && objectConfig.fields) {
                    fieldConfig = objectConfig.fields[fields.field];
                }
            }
            
            // Extract user ID from authorization header
            const userId = extractUserId(req.headers.authorization);
            
            // Upload all files
            const uploadedFiles: AttachmentData[] = [];
            
            for (const file of files) {
                // Validate each file
                const validation = validateFile(file, fieldConfig, fields.object, fields.field);
                if (!validation.valid) {
                    sendError(res, 400, validation.error!.code, validation.error!.message, validation.error!.details);
                    return;
                }
                
                // Save file
                const attachmentData = await storage.save(
                    file.buffer,
                    file.filename,
                    file.mimeType,
                    {
                        folder: fields.folder,
                        object: fields.object,
                        field: fields.field,
                        userId
                    }
                );
                
                uploadedFiles.push(attachmentData);
            }
            
            sendSuccess(res, uploadedFiles);
        } catch (error) {
            console.error('Batch file upload error:', error);
            sendError(res, 500, ErrorCode.INTERNAL_ERROR, 'Batch file upload failed');
        }
    };
}

/**
 * Create file download handler
 */
export function createFileDownloadHandler(storage: IFileStorage) {
    return async (req: IncomingMessage, res: ServerResponse, fileId: string) => {
        try {
            const file = await storage.get(fileId);
            
            if (!file) {
                sendError(res, 404, ErrorCode.NOT_FOUND, 'File not found');
                return;
            }
            
            // Set appropriate headers
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', file.length);
            res.statusCode = 200;
            res.end(file);
        } catch (error) {
            console.error('File download error:', error);
            sendError(res, 500, ErrorCode.INTERNAL_ERROR, 'File download failed');
        }
    };
}
