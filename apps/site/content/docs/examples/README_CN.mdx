# 附件 API 实现文档

## 概述

本次实现为 ObjectQL 添加了完整的文件上传、下载和管理功能。实现包括：

1. **文件存储抽象层** - 支持本地文件系统和内存存储，可扩展支持 S3、OSS 等云存储
2. **多部分表单数据解析** - 原生支持 multipart/form-data 文件上传
3. **文件验证** - 基于字段配置的文件类型、大小验证
4. **REST API 端点** - `/api/files/upload`、`/api/files/upload/batch`、`/api/files/:fileId`
5. **完整测试覆盖** - 单元测试和集成测试示例

## 快速导航

📖 **核心指南**
- [附件字段如何实现多选？](./multiple-file-upload-guide-cn.md) - **多文件上传完整指南**
- [如何将附件与记录关联？](./attachment-association-guide-cn.md)
- [如何使用 AWS S3 存储？](./s3-integration-guide-cn.md)
- [文件上传示例代码](./file-upload-example.md)

## 架构设计

### 1. 类型定义 (`types.ts`)

```typescript
// 附件元数据
interface AttachmentData {
    id?: string;
    name: string;
    url: string;
    size: number;
    type: string;
    original_name?: string;
    uploaded_at?: string;
    uploaded_by?: string;
}

// 文件存储接口
interface IFileStorage {
    save(file: Buffer, filename: string, mimeType: string, options?: FileStorageOptions): Promise<AttachmentData>;
    get(fileId: string): Promise<Buffer | null>;
    delete(fileId: string): Promise<boolean>;
    getPublicUrl(fileId: string): string;
}
```

### 2. 存储实现 (`storage.ts`)

#### LocalFileStorage - 本地文件系统存储

```typescript
const storage = new LocalFileStorage({
    baseDir: './uploads',  // 文件存储目录
    baseUrl: 'http://localhost:3000/api/files'  // 公开访问 URL
});
```

特性：
- 自动创建存储目录
- 按对象类型组织文件夹结构
- 生成唯一文件 ID
- 递归搜索文件

#### MemoryFileStorage - 内存存储（测试用）

```typescript
const storage = new MemoryFileStorage({
    baseUrl: 'http://localhost:3000/api/files'
});
```

特性：
- 轻量级，适合测试
- 无磁盘 I/O
- 可清空所有文件

### 3. 文件处理器 (`file-handler.ts`)

#### 多部分表单解析

```typescript
const { fields, files } = await parseMultipart(req, boundary);
```

支持：
- 标准 multipart/form-data 格式
- 多文件上传
- 表单字段和文件混合

#### 文件验证

```typescript
const validation = validateFile(file, fieldConfig);
```

验证规则：
- `max_size` - 最大文件大小
- `min_size` - 最小文件大小
- `accept` - 允许的文件扩展名（如 `['.pdf', '.jpg']`）

错误响应：
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "文件大小超出限制",
    "details": { ... }
  }
}
```

### 4. HTTP 端点 (`adapters/node.ts`)

#### POST /api/files/upload - 单文件上传

请求：
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@receipt.pdf" \
  -F "object=expense" \
  -F "field=receipt"
```

响应：
```json
{
  "data": {
    "id": "abc123...",
    "name": "abc123.pdf",
    "url": "http://localhost:3000/api/files/uploads/expense/abc123.pdf",
    "size": 245760,
    "type": "application/pdf",
    "original_name": "receipt.pdf",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/files/upload/batch - 批量上传

请求：
```bash
curl -X POST http://localhost:3000/api/files/upload/batch \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "object=product" \
  -F "field=gallery"
```

响应：
```json
{
  "data": [
    { "id": "...", "name": "...", "url": "..." },
    { "id": "...", "name": "...", "url": "..." }
  ]
}
```

#### GET /api/files/:fileId - 文件下载

请求：
```bash
curl http://localhost:3000/api/files/abc123 --output file.pdf
```

## 使用示例

### 服务器端设置

```typescript
import { ObjectQL } from '@objectql/core';
import { createNodeHandler, LocalFileStorage } from '@objectql/server';
import * as http from 'http';

const app = new ObjectQL({ /* ... */ });

// 定义带附件字段的对象
app.registerObject({
    name: 'expense',
    fields: {
        receipt: {
            type: 'file',
            accept: ['.pdf', '.jpg', '.png'],
            max_size: 5242880  // 5MB
        }
    }
});

await app.init();

// 配置文件存储
const fileStorage = new LocalFileStorage({
    baseDir: './uploads',
    baseUrl: 'http://localhost:3000/api/files'
});

// 创建 HTTP 服务器
const handler = createNodeHandler(app, { fileStorage });
const server = http.createServer(handler);
server.listen(3000);
```

### 客户端上传

```typescript
// 上传文件
const formData = new FormData();
formData.append('file', file);
formData.append('object', 'expense');
formData.append('field', 'receipt');

const uploadRes = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData
});

const { data: uploadedFile } = await uploadRes.json();

// 创建记录
await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'create',
        object: 'expense',
        args: {
            expense_number: 'EXP-001',
            amount: 125.50,
            receipt: uploadedFile
        }
    })
});
```

### React 组件

```tsx
function FileUpload() {
    const [file, setFile] = useState<File | null>(null);
    
    const handleUpload = async () => {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });
        
        const { data } = await res.json();
        console.log('上传成功:', data);
    };
    
    return (
        <div>
            <input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
            <button onClick={handleUpload}>上传</button>
        </div>
    );
}
```

## 测试

### 运行单元测试

```bash
cd packages/runtime/server
pnpm test
```

测试覆盖：
- ✅ 文件存储（保存、获取、删除）
- ✅ 文件验证（大小、类型）
- ✅ 多部分表单解析
- ✅ 集成测试示例

### 集成测试示例

```bash
pnpm test file-upload-integration.example.ts
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OBJECTQL_UPLOAD_DIR` | 文件存储目录 | `./uploads` |
| `OBJECTQL_BASE_URL` | 文件访问基础 URL | `http://localhost:3000/api/files` |

## 扩展性

### 自定义存储后端

```typescript
import { IFileStorage } from '@objectql/server';

class CustomStorage implements IFileStorage {
    async save(file: Buffer, filename: string, mimeType: string) {
        // 实现自定义存储逻辑（如上传到 S3/OSS）
        // ...
        return attachmentData;
    }
    
    async get(fileId: string): Promise<Buffer | null> {
        // 实现文件获取逻辑
        // ...
    }
    
    async delete(fileId: string): Promise<boolean> {
        // 实现文件删除逻辑
        // ...
    }
    
    getPublicUrl(fileId: string): string {
        // 生成公开访问 URL
        return `https://cdn.example.com/${fileId}`;
    }
}

// 使用自定义存储
const storage = new CustomStorage();
const handler = createNodeHandler(app, { fileStorage: storage });
```

## 文档更新

1. **API 文档** (`docs/api/attachments.md`)
   - 添加服务器实现章节
   - 环境变量配置说明
   - 自定义存储示例

2. **使用示例** (`docs/examples/file-upload-example.md`)
   - 完整的服务器设置代码
   - cURL 命令示例
   - JavaScript/TypeScript 客户端代码
   - React 组件示例

## 文件清单

### 新增文件
- `packages/runtime/server/src/storage.ts` - 存储实现
- `packages/runtime/server/src/file-handler.ts` - 文件处理器
- `packages/runtime/server/test/storage.test.ts` - 存储测试
- `packages/runtime/server/test/file-validation.test.ts` - 验证测试
- `packages/runtime/server/test/file-upload-integration.example.ts` - 集成示例
- `docs/examples/file-upload-example.md` - 使用示例
- `docs/examples/README_CN.md` - 本文档

### 修改文件
- `packages/runtime/server/src/types.ts` - 添加附件相关类型
- `packages/runtime/server/src/adapters/node.ts` - 添加文件端点
- `packages/runtime/server/src/index.ts` - 导出新模块
- `docs/api/attachments.md` - 更新实现文档

## 后续计划

- [ ] 实现缩略图生成端点 `/api/files/:fileId/thumbnail`
- [ ] 添加图片预览端点 `/api/files/:fileId/preview`
- [ ] 支持图片尺寸调整
- [ ] 集成第三方云存储（S3、OSS、COS）
- [ ] 添加文件访问权限控制
- [ ] 支持签名 URL（临时访问链接）
