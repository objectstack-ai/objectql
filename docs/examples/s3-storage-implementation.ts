import { IFileStorage, AttachmentData, FileStorageOptions } from '@objectql/server';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

/**
 * AWS S3 Storage Configuration
 */
export interface S3StorageConfig {
    /** S3 Bucket name */
    bucket: string;
    /** AWS Region (e.g., 'us-east-1', 'ap-southeast-1') */
    region: string;
    /** AWS Access Key ID (optional if using IAM roles) */
    accessKeyId?: string;
    /** AWS Secret Access Key (optional if using IAM roles) */
    secretAccessKey?: string;
    /** Base path/prefix for all files (optional) */
    basePrefix?: string;
    /** CloudFront distribution domain (optional, for CDN) */
    cloudFrontDomain?: string;
    /** Enable public read access (default: false) */
    publicRead?: boolean;
    /** Signed URL expiration time in seconds (default: 3600) */
    signedUrlExpiry?: number;
}

/**
 * AWS S3 Storage Implementation for ObjectQL
 * 
 * @example
 * ```typescript
 * const storage = new S3FileStorage({
 *     bucket: 'my-objectql-uploads',
 *     region: 'us-east-1',
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *     cloudFrontDomain: 'https://d123456.cloudfront.net', // optional
 *     publicRead: true
 * });
 * 
 * const handler = createNodeHandler(app, { fileStorage: storage });
 * ```
 */
export class S3FileStorage implements IFileStorage {
    private s3Client: S3Client;
    private bucket: string;
    private basePrefix: string;
    private cloudFrontDomain?: string;
    private publicRead: boolean;
    private signedUrlExpiry: number;

    constructor(config: S3StorageConfig) {
        this.bucket = config.bucket;
        this.basePrefix = config.basePrefix || 'objectql-uploads';
        this.cloudFrontDomain = config.cloudFrontDomain;
        this.publicRead = config.publicRead ?? false;
        this.signedUrlExpiry = config.signedUrlExpiry ?? 3600;

        // Initialize S3 Client
        this.s3Client = new S3Client({
            region: config.region,
            credentials: config.accessKeyId && config.secretAccessKey ? {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            } : undefined // Use IAM role if credentials not provided
        });
    }

    async save(
        file: Buffer,
        filename: string,
        mimeType: string,
        options?: FileStorageOptions
    ): Promise<AttachmentData> {
        // Generate unique file ID
        const id = crypto.randomBytes(16).toString('hex');
        const ext = filename.substring(filename.lastIndexOf('.'));
        
        // Build S3 key with organized structure
        const folder = options?.folder || 'uploads';
        const objectPath = options?.object ? `${options.object}/` : '';
        const key = `${this.basePrefix}/${folder}/${objectPath}${id}${ext}`;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file,
            ContentType: mimeType,
            ACL: this.publicRead ? 'public-read' : 'private',
            Metadata: {
                'original-filename': filename,
                'uploaded-by': options?.userId || 'unknown',
                'object-type': options?.object || 'general'
            }
        });

        await this.s3Client.send(command);

        // Generate public URL
        const url = this.getPublicUrl(key);

        return {
            id: key, // Use S3 key as ID for easy retrieval
            name: `${id}${ext}`,
            url,
            size: file.length,
            type: mimeType,
            original_name: filename,
            uploaded_at: new Date().toISOString(),
            uploaded_by: options?.userId
        };
    }

    async get(fileId: string): Promise<Buffer | null> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileId
            });

            const response = await this.s3Client.send(command);
            
            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            if (response.Body) {
                const stream = response.Body as any;
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
            }
            
            return Buffer.concat(chunks);
        } catch (error: any) {
            if (error.name === 'NoSuchKey') {
                return null;
            }
            throw error;
        }
    }

    async delete(fileId: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: fileId
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            return false;
        }
    }

    getPublicUrl(fileId: string): string {
        // Use CloudFront if configured
        if (this.cloudFrontDomain) {
            return `${this.cloudFrontDomain}/${fileId}`;
        }

        // Use S3 direct URL if public
        if (this.publicRead) {
            const region = this.s3Client.config.region;
            return `https://${this.bucket}.s3.${region}.amazonaws.com/${fileId}`;
        }

        // For private files, return placeholder (actual signed URL should be generated on demand)
        return `s3://${this.bucket}/${fileId}`;
    }

    /**
     * Generate a signed URL for temporary access to a private file
     * @param fileId S3 key of the file
     * @param expiresIn Expiration time in seconds (default: configured expiry)
     */
    async getSignedUrl(fileId: string, expiresIn?: number): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: fileId
        });

        const url = await getSignedUrl(
            this.s3Client,
            command,
            { expiresIn: expiresIn || this.signedUrlExpiry }
        );

        return url;
    }

    /**
     * Get signed upload URL for direct client-to-S3 uploads
     * @param filename Original filename
     * @param mimeType File MIME type
     * @param options Storage options
     */
    async getSignedUploadUrl(
        filename: string,
        mimeType: string,
        options?: FileStorageOptions
    ): Promise<{ url: string; key: string; fields: Record<string, string> }> {
        const id = crypto.randomBytes(16).toString('hex');
        const ext = filename.substring(filename.lastIndexOf('.'));
        
        const folder = options?.folder || 'uploads';
        const objectPath = options?.object ? `${options.object}/` : '';
        const key = `${this.basePrefix}/${folder}/${objectPath}${id}${ext}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: mimeType,
            ACL: this.publicRead ? 'public-read' : 'private'
        });

        const url = await getSignedUrl(
            this.s3Client,
            command,
            { expiresIn: 3600 } // 1 hour
        );

        return {
            url,
            key,
            fields: {
                'Content-Type': mimeType
            }
        };
    }
}
