# 如何使用 AWS S3 存储附件

本指南详细说明如何将 ObjectQL 文件附件存储到 AWS S3，包括完整的实现代码和最佳实践。

## 目录

1. [为什么选择 S3](#为什么选择-s3)
2. [架构设计](#架构设计)
3. [实现方案](#实现方案)
4. [配置说明](#配置说明)
5. [使用示例](#使用示例)
6. [高级功能](#高级功能)
7. [最佳实践](#最佳实践)

---

## 为什么选择 S3

使用 AWS S3 存储文件附件有以下优势：

✅ **可扩展性** - 无限存储容量，无需管理磁盘空间  
✅ **高可用性** - 99.99% 可用性 SLA，自动多区域备份  
✅ **高性能** - 与 CloudFront CDN 集成，全球加速访问  
✅ **成本优化** - 按需付费，支持生命周期管理和存储分层  
✅ **安全性** - 支持加密、访问控制、签名 URL 等安全特性  
✅ **易于维护** - 无需管理服务器，AWS 负责基础设施  

---

## 架构设计

### 存储接口抽象

ObjectQL 通过 `IFileStorage` 接口实现存储抽象：

```typescript
interface IFileStorage {
    save(file: Buffer, filename: string, mimeType: string, options?: FileStorageOptions): Promise<AttachmentData>;
    get(fileId: string): Promise<Buffer | null>;
    delete(fileId: string): Promise<boolean>;
    getPublicUrl(fileId: string): string;
}
```

### S3 集成架构

```
┌─────────────┐
│   客户端    │
│  (Browser)  │
└──────┬──────┘
       │ ① 上传文件
       ▼
┌─────────────┐
│  ObjectQL   │
│   Server    │──┐
└──────┬──────┘  │ ② 调用 S3FileStorage
       │         │
       │         ▼
       │    ┌─────────────┐
       │    │ S3FileStorage│
       │    │  implements  │
       │    │ IFileStorage │
       │    └──────┬───────┘
       │           │ ③ 上传到 S3
       │           ▼
       │    ┌─────────────┐
       │    │   AWS S3    │
       │    │   Bucket    │
       │    └──────┬──────┘
       │           │
       │           │ ④ 返回 URL
       ▼           ▼
   ┌─────────────────────┐
   │    Database         │
   │ (存储文件元数据)    │
   └─────────────────────┘
```

---

## 实现方案

### 1. 安装依赖

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

或使用 pnpm:

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. 创建 S3FileStorage 类

完整实现代码请参考：[s3-storage-implementation.ts](./s3-storage-implementation.ts)

核心特性：
- ✅ 实现 `IFileStorage` 接口
- ✅ 支持公开和私有访问模式
- ✅ 集成 CloudFront CDN
- ✅ 生成签名 URL（临时访问）
- ✅ 支持客户端直传 S3
- ✅ 自动组织文件夹结构

### 3. 关键实现细节

#### 文件上传到 S3

```typescript
async save(file: Buffer, filename: string, mimeType: string, options?: FileStorageOptions): Promise<AttachmentData> {
    // 生成唯一 ID
    const id = crypto.randomBytes(16).toString('hex');
    const ext = filename.substring(filename.lastIndexOf('.'));
    
    // 构建 S3 key（文件路径）
    const folder = options?.folder || 'uploads';
    const objectPath = options?.object ? `${options.object}/` : '';
    const key = `${this.basePrefix}/${folder}/${objectPath}${id}${ext}`;

    // 上传到 S3
    const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
        ACL: this.publicRead ? 'public-read' : 'private',
        Metadata: {
            'original-filename': filename,
            'uploaded-by': options?.userId || 'unknown'
        }
    });

    await this.s3Client.send(command);

    return {
        id: key,
        name: `${id}${ext}`,
        url: this.getPublicUrl(key),
        size: file.length,
        type: mimeType,
        original_name: filename,
        uploaded_at: new Date().toISOString()
    };
}
```

#### 文件下载

```typescript
async get(fileId: string): Promise<Buffer | null> {
    const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileId
    });

    const response = await this.s3Client.send(command);
    
    // 将流转换为 Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
}
```

---

## 配置说明

### 环境变量配置

创建 `.env` 文件：

```bash
# AWS 凭证
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1

# S3 配置
S3_BUCKET=my-objectql-uploads
S3_BASE_PREFIX=objectql-uploads

# CloudFront（可选）
CLOUDFRONT_DOMAIN=https://d123456.cloudfront.net

# 访问控制
S3_PUBLIC_READ=false
S3_SIGNED_URL_EXPIRY=3600
```

### 配置类型

```typescript
interface S3StorageConfig {
    bucket: string;              // S3 存储桶名称
    region: string;              // AWS 区域
    accessKeyId?: string;        // 访问密钥 ID（可选，使用 IAM 角色时）
    secretAccessKey?: string;    // 访问密钥（可选）
    basePrefix?: string;         // 文件路径前缀
    cloudFrontDomain?: string;   // CloudFront 域名
    publicRead?: boolean;        // 是否公开读取
    signedUrlExpiry?: number;    // 签名 URL 过期时间（秒）
}
```

---

## 使用示例

### 基础使用

```typescript
import { ObjectQL } from '@objectql/core';
import { createNodeHandler } from '@objectql/server';
import { S3FileStorage } from './s3-storage-implementation';

const app = new ObjectQL({ /* ... */ });

// 配置 S3 存储
const storage = new S3FileStorage({
    bucket: process.env.S3_BUCKET!,
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    basePrefix: process.env.S3_BASE_PREFIX,
    cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN,
    publicRead: process.env.S3_PUBLIC_READ === 'true'
});

// 创建 HTTP 处理器
const handler = createNodeHandler(app, { fileStorage: storage });

// 启动服务器
const server = http.createServer(handler);
server.listen(3000);
```

### 使用 IAM 角色（推荐）

在 EC2、ECS 或 Lambda 上运行时，推荐使用 IAM 角色而不是硬编码凭证：

```typescript
const storage = new S3FileStorage({
    bucket: 'my-objectql-uploads',
    region: 'us-east-1',
    // 不提供 accessKeyId 和 secretAccessKey
    // SDK 会自动使用 IAM 角色
    publicRead: false
});
```

需要的 IAM 权限：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-objectql-uploads/*",
        "arn:aws:s3:::my-objectql-uploads"
      ]
    }
  ]
}
```

### 集成 CloudFront CDN

使用 CloudFront 加速全球访问：

```typescript
const storage = new S3FileStorage({
    bucket: 'my-objectql-uploads',
    region: 'us-east-1',
    cloudFrontDomain: 'https://d123456.cloudfront.net',
    publicRead: true  // CloudFront 需要
});
```

文件 URL 将是：
```
https://d123456.cloudfront.net/objectql-uploads/expense/abc123.pdf
```

而不是：
```
https://my-objectql-uploads.s3.us-east-1.amazonaws.com/objectql-uploads/expense/abc123.pdf
```

---

## 高级功能

### 1. 签名 URL（临时访问）

对于私有文件，生成临时访问链接：

```typescript
const storage = new S3FileStorage({
    bucket: 'my-objectql-uploads',
    region: 'us-east-1',
    publicRead: false,  // 私有访问
    signedUrlExpiry: 3600  // 1小时过期
});

// 获取签名 URL
const fileId = 'objectql-uploads/expense/abc123.pdf';
const signedUrl = await storage.getSignedUrl(fileId, 7200); // 2小时有效

// 返回给客户端
res.json({ downloadUrl: signedUrl });
```

### 2. 客户端直传 S3

避免文件经过服务器，直接上传到 S3：

```typescript
// 服务器端：生成上传凭证
const uploadCredentials = await storage.getSignedUploadUrl(
    'receipt.pdf',
    'application/pdf',
    { object: 'expense', userId: 'user_123' }
);

// 返回给客户端
res.json(uploadCredentials);
// {
//   url: "https://...",
//   key: "objectql-uploads/expense/abc123.pdf",
//   fields: { "Content-Type": "application/pdf" }
// }
```

```javascript
// 客户端：直接上传到 S3
const formData = new FormData();
formData.append('key', uploadCredentials.key);
Object.entries(uploadCredentials.fields).forEach(([k, v]) => {
    formData.append(k, v);
});
formData.append('file', fileInput.files[0]);

await fetch(uploadCredentials.url, {
    method: 'PUT',
    body: formData
});

// 然后创建 ObjectQL 记录
await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'create',
        object: 'expense',
        args: {
            receipt: {
                id: uploadCredentials.key,
                url: `https://d123456.cloudfront.net/${uploadCredentials.key}`,
                // ... 其他元数据
            }
        }
    })
});
```

### 3. 文件夹组织

S3FileStorage 自动组织文件夹结构：

```
my-objectql-uploads/
├── objectql-uploads/          # basePrefix
│   ├── uploads/               # 默认文件夹
│   │   ├── expense/           # 按对象类型
│   │   │   ├── abc123.pdf
│   │   │   └── def456.jpg
│   │   └── product/
│   │       ├── img001.jpg
│   │       └── img002.jpg
│   └── avatars/               # 自定义文件夹
│       └── user_123.jpg
```

### 4. 生命周期管理

配置 S3 生命周期策略自动管理文件：

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldFiles",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 180,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "objectql-uploads/temp/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

---

## 最佳实践

### 1. 安全性

**✅ 推荐做法：**

```typescript
// 使用 IAM 角色
const storage = new S3FileStorage({
    bucket: 'my-objectql-uploads',
    region: 'us-east-1',
    publicRead: false  // 默认私有
});

// 对需要公开的文件，使用签名 URL
const url = await storage.getSignedUrl(fileId);
```

**❌ 避免：**

```typescript
// 不要在代码中硬编码凭证
const storage = new S3FileStorage({
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',  // ❌ 危险
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'  // ❌ 危险
});
```

### 2. 性能优化

```typescript
// 使用 CloudFront CDN
const storage = new S3FileStorage({
    bucket: 'my-objectql-uploads',
    region: 'us-east-1',
    cloudFrontDomain: 'https://d123456.cloudfront.net',
    publicRead: true
});

// 配置 CloudFront 缓存策略
// - Cache-Control: max-age=31536000 (1年)
// - 启用 Gzip 压缩
// - 使用边缘位置
```

### 3. 成本优化

```typescript
// 1. 使用智能分层存储
// 在 S3 控制台启用 Intelligent-Tiering

// 2. 定期清理未使用的文件
async function cleanupOrphanedFiles() {
    // 查询数据库中的所有文件引用
    const usedFiles = await db.query('SELECT file_url FROM attachments');
    
    // 列出 S3 中的所有文件
    // 删除未引用的文件
}

// 3. 压缩图片
// 在上传前使用 sharp 库压缩
import sharp from 'sharp';

const compressedBuffer = await sharp(originalBuffer)
    .resize(1920, 1080, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
```

### 4. 监控与日志

```typescript
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: 'us-east-1',
    logger: console,  // 启用日志
});

// CloudWatch 监控指标
// - NumberOfObjects
// - BucketSizeBytes
// - AllRequests
// - 4xxErrors, 5xxErrors
```

### 5. 跨区域复制

为灾难恢复配置跨区域复制：

```json
{
  "Role": "arn:aws:iam::123456789:role/s3-replication-role",
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "DeleteMarkerReplication": { "Status": "Enabled" },
      "Destination": {
        "Bucket": "arn:aws:s3:::my-objectql-uploads-backup",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": { "Minutes": 15 }
        }
      }
    }
  ]
}
```

---

## 故障排查

### 常见问题

**1. AccessDenied 错误**

```
Error: Access Denied
```

解决方案：
- 检查 IAM 权限是否正确
- 确认 S3 bucket 策略允许访问
- 验证 AWS 凭证是否有效

**2. NoSuchBucket 错误**

```
Error: The specified bucket does not exist
```

解决方案：
- 确认 bucket 名称正确
- 检查 region 配置是否匹配
- 在 AWS 控制台创建 bucket

**3. 上传缓慢**

解决方案：
- 使用客户端直传 S3
- 启用 S3 Transfer Acceleration
- 选择地理位置更近的 region

**4. 文件无法访问**

解决方案：
- 检查 ACL 设置（public-read vs private）
- 对私有文件使用签名 URL
- 验证 CloudFront 分发配置

---

## 总结

通过实现 `IFileStorage` 接口，ObjectQL 可以无缝集成 AWS S3 存储。关键要点：

✅ **简单集成** - 只需实现 4 个方法  
✅ **灵活配置** - 支持公开/私有访问、CDN、签名 URL  
✅ **生产就绪** - 内置错误处理、元数据管理  
✅ **可扩展** - 支持客户端直传、生命周期管理  

完整代码示例：[s3-storage-implementation.ts](./s3-storage-implementation.ts)

---

**相关文档：**
- [AWS S3 官方文档](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [ObjectQL 附件 API 文档](../api/attachments.md)
