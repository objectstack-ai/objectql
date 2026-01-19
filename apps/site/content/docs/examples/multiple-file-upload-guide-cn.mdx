# 附件字段多选功能说明

## 概述

ObjectQL 附件字段**完全支持多选功能**，允许在单个附件字段上传和存储多个文件。通过设置 `multiple: true` 属性即可启用。

## 字段定义

### 多个文件附件

```yaml
# expense.object.yml
name: expense
fields:
  supporting_docs:
    type: file
    label: 支持文件
    multiple: true              # 启用多选
    accept: ['.pdf', '.docx', '.xlsx']
    max_size: 10485760          # 每个文件最大 10MB
```

### 多个图片附件（图库）

```yaml
# product.object.yml
name: product
fields:
  gallery:
    type: image
    label: 产品图库
    multiple: true              # 启用多选
    accept: ['.jpg', '.png', '.webp']
    max_size: 5242880           # 每个图片最大 5MB
    max_width: 2000
    max_height: 2000
```

## 数据结构

启用 `multiple: true` 后，字段存储的是**数组格式**：

```json
{
  "id": "exp_001",
  "expense_number": "EXP-2024-001",
  "supporting_docs": [
    {
      "id": "file_001",
      "name": "invoice.pdf",
      "url": "https://cdn.example.com/files/invoice.pdf",
      "size": 123456,
      "type": "application/pdf",
      "original_name": "发票.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "file_002",
      "name": "contract.pdf",
      "url": "https://cdn.example.com/files/contract.pdf",
      "size": 234567,
      "type": "application/pdf",
      "original_name": "合同.pdf",
      "uploaded_at": "2024-01-15T10:31:00Z"
    },
    {
      "id": "file_003",
      "name": "receipt.pdf",
      "url": "https://cdn.example.com/files/receipt.pdf",
      "size": 156789,
      "type": "application/pdf",
      "original_name": "收据.pdf",
      "uploaded_at": "2024-01-15T10:32:00Z"
    }
  ]
}
```

## 上传方式

### 方式一：批量上传 API（推荐）

使用 `/api/files/upload/batch` 端点一次性上传多个文件：

```javascript
// HTML
<input type="file" id="fileInput" multiple accept=".pdf,.docx,.xlsx">

// JavaScript
async function uploadMultipleFiles() {
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    
    // 添加所有选中的文件
    for (const file of fileInput.files) {
        formData.append('files', file);
    }
    
    formData.append('object', 'expense');
    formData.append('field', 'supporting_docs');
    
    // 批量上传
    const uploadRes = await fetch('/api/files/upload/batch', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    });
    
    const uploadedFiles = (await uploadRes.json()).data;
    // uploadedFiles 是包含所有文件元数据的数组
    
    return uploadedFiles;
}
```

**cURL 示例：**

```bash
curl -X POST http://localhost:3000/api/files/upload/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@invoice.pdf" \
  -F "files=@contract.pdf" \
  -F "files=@receipt.pdf" \
  -F "object=expense" \
  -F "field=supporting_docs"
```

**响应：**

```json
{
  "data": [
    {
      "id": "file_001",
      "name": "invoice.pdf",
      "url": "https://cdn.example.com/files/uploads/expense/file_001.pdf",
      "size": 123456,
      "type": "application/pdf",
      "original_name": "invoice.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "file_002",
      "name": "contract.pdf",
      "url": "https://cdn.example.com/files/uploads/expense/file_002.pdf",
      "size": 234567,
      "type": "application/pdf",
      "original_name": "contract.pdf",
      "uploaded_at": "2024-01-15T10:30:01Z"
    },
    {
      "id": "file_003",
      "name": "receipt.pdf",
      "url": "https://cdn.example.com/files/uploads/expense/file_003.pdf",
      "size": 156789,
      "type": "application/pdf",
      "original_name": "receipt.pdf",
      "uploaded_at": "2024-01-15T10:30:02Z"
    }
  ]
}
```

### 方式二：并行上传多个单文件

使用 `/api/files/upload` 端点配合 `Promise.all` 并行上传：

```javascript
async function uploadMultipleFilesSeparately(files) {
    // 并行上传所有文件
    const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('object', 'product');
        formData.append('field', 'gallery');
        
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });
        
        return (await response.json()).data;
    });
    
    // 等待所有上传完成
    const uploadedFiles = await Promise.all(uploadPromises);
    
    return uploadedFiles;
}

// 使用
const fileInput = document.getElementById('gallery-input');
const uploadedImages = await uploadMultipleFilesSeparately(fileInput.files);
```

## 创建记录

上传完成后，将文件数组传入创建或更新操作：

```javascript
// 步骤 1：上传多个文件
const uploadedFiles = await uploadMultipleFiles();

// 步骤 2：创建记录，包含所有附件
const createRes = await fetch('/api/objectql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
        op: 'create',
        object: 'expense',
        args: {
            expense_number: 'EXP-2024-001',
            amount: 1250.00,
            description: '办公用品采购',
            supporting_docs: uploadedFiles  // 传入文件数组
        }
    })
});

const expense = (await createRes.json());
```

## 更新操作

### 替换所有附件

```javascript
// 上传新的文件集合
const newFiles = await uploadMultipleFiles();

// 替换整个数组
await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'update',
        object: 'expense',
        args: {
            id: 'exp_001',
            data: {
                supporting_docs: newFiles  // 完全替换
            }
        }
    })
});
```

### 追加新附件

```javascript
// 获取当前记录
const current = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'findOne',
        object: 'expense',
        args: 'exp_001'
    })
}).then(r => r.json());

// 上传新文件
const newFiles = await uploadMultipleFiles();

// 追加到现有数组
await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'update',
        object: 'expense',
        args: {
            id: 'exp_001',
            data: {
                supporting_docs: [
                    ...(current.supporting_docs || []),
                    ...newFiles
                ]
            }
        }
    })
});
```

### 删除特定附件

```javascript
// 获取当前记录
const current = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'findOne',
        object: 'expense',
        args: 'exp_001'
    })
}).then(r => r.json());

// 过滤掉要删除的附件（按 id）
const updatedDocs = current.supporting_docs.filter(
    doc => doc.id !== 'file_002'  // 删除 id 为 file_002 的附件
);

// 更新记录
await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'update',
        object: 'expense',
        args: {
            id: 'exp_001',
            data: {
                supporting_docs: updatedDocs
            }
        }
    })
});
```

## 查询操作

### 查询包含附件的记录

```javascript
const expensesWithDocs = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'find',
        object: 'expense',
        args: {
            filters: [['supporting_docs', '!=', null]],
            fields: ['id', 'expense_number', 'supporting_docs']
        }
    })
}).then(r => r.json());

// 遍历结果
expensesWithDocs.items.forEach(expense => {
    console.log(`报销单 ${expense.expense_number}:`);
    console.log(`- 附件数量: ${expense.supporting_docs?.length || 0}`);
    expense.supporting_docs?.forEach(doc => {
        console.log(`  - ${doc.original_name} (${doc.size} bytes)`);
    });
});
```

## 完整示例：产品图库

```javascript
/**
 * 完整示例：创建产品并上传多张图片
 */
async function createProductWithGallery(productData, imageFiles) {
    try {
        // 步骤 1：批量上传图片
        const formData = new FormData();
        for (const file of imageFiles) {
            formData.append('files', file);
        }
        formData.append('object', 'product');
        formData.append('field', 'gallery');
        
        const uploadRes = await fetch('/api/files/upload/batch', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken()
            },
            body: formData
        });
        
        if (!uploadRes.ok) {
            throw new Error('文件上传失败');
        }
        
        const uploadedImages = (await uploadRes.json()).data;
        
        // 步骤 2：创建产品记录
        const createRes = await fetch('/api/objectql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getAuthToken()
            },
            body: JSON.stringify({
                op: 'create',
                object: 'product',
                args: {
                    ...productData,
                    gallery: uploadedImages  // 图片数组
                }
            })
        });
        
        if (!createRes.ok) {
            throw new Error('产品创建失败');
        }
        
        const product = (await createRes.json());
        
        console.log('产品创建成功:', {
            id: product.id,
            name: product.name,
            图片数量: product.gallery.length
        });
        
        return product;
        
    } catch (error) {
        console.error('操作失败:', error);
        throw error;
    }
}

// HTML
// <input type="file" id="gallery-input" multiple accept="image/*">

// 使用
const fileInput = document.getElementById('gallery-input');
const product = await createProductWithGallery({
    name: '高端笔记本电脑',
    price: 9999.99,
    description: '超轻薄设计，高性能处理器'
}, fileInput.files);
```

## React 组件示例

```tsx
import React, { useState } from 'react';

interface MultiFileUploadProps {
    objectName: string;
    fieldName: string;
    onSuccess?: (files: any[]) => void;
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
    objectName,
    fieldName,
    onSuccess
}) => {
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(selectedFiles);
        setError(null);
    };
    
    const handleUpload = async () => {
        if (files.length === 0) {
            setError('请选择文件');
            return;
        }
        
        setUploading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('object', objectName);
            formData.append('field', fieldName);
            
            const response = await fetch('/api/files/upload/batch', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('上传失败');
            }
            
            const { data: uploadedFiles } = await response.json();
            
            onSuccess?.(uploadedFiles);
            setFiles([]);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : '上传失败');
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div className="multi-file-upload">
            <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
            />
            
            {files.length > 0 && (
                <div className="file-list">
                    <p>已选择 {files.length} 个文件：</p>
                    <ul>
                        {files.map((file, index) => (
                            <li key={index}>
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
            >
                {uploading ? '上传中...' : `上传 ${files.length} 个文件`}
            </button>
            
            {error && <p className="error">{error}</p>}
        </div>
    );
};
```

## 验证规则

多选字段的验证规则：

- `max_size`: 限制**每个文件**的最大大小
- `min_size`: 限制**每个文件**的最小大小
- `accept`: 限制允许的文件类型（对所有文件生效）
- 数组长度：通过应用层逻辑控制（ObjectQL 默认不限制）

## 总结

ObjectQL 的附件字段**完全支持多选功能**：

✅ **字段定义简单** - 只需设置 `multiple: true`  
✅ **两种上传方式** - 批量上传 API 或并行单文件上传  
✅ **数据格式统一** - 单选为对象，多选为数组  
✅ **灵活的更新操作** - 支持替换、追加、删除  
✅ **完整的查询支持** - 可以查询、过滤包含附件的记录  

**相关文档：**
- [附件 API 完整文档](../api/attachments.md)
- [附件关联指南](./attachment-association-guide-cn.md)
- [文件上传示例](./file-upload-example.md)
