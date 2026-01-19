# 附件如何与对象记录关联

本文档详细说明在 ObjectQL 中如何将文件附件与对象记录关联，包括两种主要方案和最佳实践。

## 目录

1. [方案一：嵌入式附件（推荐）](#方案一嵌入式附件推荐)
2. [方案二：独立附件对象](#方案二独立附件对象)
3. [方案对比](#方案对比)
4. [实际应用示例](#实际应用示例)
5. [查询与检索](#查询与检索)
6. [最佳实践](#最佳实践)

---

## 方案一：嵌入式附件（推荐）

### 设计思路

将附件元数据直接存储在对象的字段中，作为 JSON 格式保存在数据库。

### 对象定义

```yaml
# expense.object.yml
name: expense
label: 报销单
fields:
  expense_number:
    type: text
    required: true
    label: 报销单号
  
  amount:
    type: number
    required: true
    label: 金额
  
  # 单个附件字段
  receipt:
    type: file
    label: 收据
    accept: ['.pdf', '.jpg', '.png']
    max_size: 5242880  # 5MB
  
  # 多个附件字段
  supporting_docs:
    type: file
    label: 支持文件
    multiple: true
    accept: ['.pdf', '.docx', '.xlsx']
```

### 数据结构

数据库中存储的格式：

```json
{
  "id": "exp_001",
  "expense_number": "EXP-2024-001",
  "amount": 125.50,
  "receipt": {
    "id": "abc123",
    "name": "receipt.pdf",
    "url": "https://cdn.example.com/files/receipt.pdf",
    "size": 245760,
    "type": "application/pdf",
    "original_name": "收据.pdf",
    "uploaded_at": "2024-01-15T10:30:00Z"
  },
  "supporting_docs": [
    {
      "id": "def456",
      "name": "invoice.pdf",
      "url": "https://cdn.example.com/files/invoice.pdf",
      "size": 123456,
      "type": "application/pdf"
    },
    {
      "id": "ghi789",
      "name": "contract.pdf",
      "url": "https://cdn.example.com/files/contract.pdf",
      "size": 234567,
      "type": "application/pdf"
    }
  ]
}
```

### 完整操作流程

#### 1. 上传文件

```javascript
// 步骤 1：上传文件到服务器
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('object', 'expense');  // 关联的对象名
formData.append('field', 'receipt');   // 关联的字段名

const uploadRes = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    body: formData
});

const uploadedFile = (await uploadRes.json()).data;
// {
//   id: "abc123",
//   name: "abc123.pdf",
//   url: "https://cdn.example.com/files/uploads/expense/abc123.pdf",
//   size: 245760,
//   type: "application/pdf",
//   original_name: "收据.pdf",
//   uploaded_at: "2024-01-15T10:30:00Z"
// }
```

#### 2. 创建记录（附带附件）

```javascript
// 步骤 2：创建报销单记录，将文件元数据存入
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
            amount: 125.50,
            description: '办公用品采购',
            receipt: uploadedFile  // 直接传入文件元数据
        }
    })
});

const expense = (await createRes.json());
```

#### 3. 更新附件

```javascript
// 更新单个附件：上传新文件后替换
const newFile = await uploadFile(newFileInput.files[0]);

await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'update',
        object: 'expense',
        args: {
            id: 'exp_001',
            data: {
                receipt: newFile  // 替换整个附件
            }
        }
    })
});
```

#### 4. 添加多个附件

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
const newDoc = await uploadFile(fileInput.files[0]);

// 追加到数组
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
                    newDoc
                ]
            }
        }
    })
});
```

### 优点

✅ **简单直观** - 附件与记录一起存储，查询方便  
✅ **性能好** - 无需额外的 JOIN 操作  
✅ **数据完整性** - 附件随记录一起删除  
✅ **适合大多数场景** - 满足 90% 的业务需求  

### 缺点

❌ 不适合需要共享附件的场景  
❌ 无法独立查询所有附件  

---

## 方案二：独立附件对象

### 设计思路

创建独立的 `attachment` 对象，通过 `related_to` 和 `related_id` 字段关联到其他对象的记录。

### 对象定义

```yaml
# attachment.object.yml
name: attachment
label: 附件
fields:
  name:
    type: text
    required: true
    label: 文件名
    index: true
  
  file_url:
    type: file
    required: true
    label: 文件URL
  
  file_size:
    type: number
    label: 文件大小（字节）
  
  file_type:
    type: text
    label: MIME类型
    index: true
  
  # 关联字段
  related_to:
    type: text
    label: 关联对象名
    index: true
  
  related_id:
    type: text
    label: 关联记录ID
    index: true
  
  uploaded_by:
    type: lookup
    reference_to: user
    label: 上传者
  
  description:
    type: textarea
    label: 描述

indexes:
  # 复合索引：快速查询某个记录的所有附件
  related_composite_idx:
    fields: [related_to, related_id]
```

### 完整操作流程

#### 1. 上传文件并创建附件记录

```javascript
// 步骤 1：上传文件
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('object', 'attachment');
formData.append('field', 'file_url');

const uploadRes = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData
});

const uploadedFile = (await uploadRes.json()).data;

// 步骤 2：创建附件记录
const attachmentRes = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'create',
        object: 'attachment',
        args: {
            name: uploadedFile.original_name,
            file_url: uploadedFile,
            file_size: uploadedFile.size,
            file_type: uploadedFile.type,
            related_to: 'expense',      // 关联的对象名
            related_id: 'exp_001',      // 关联的记录ID
            description: '报销收据'
        }
    })
});

const attachment = (await attachmentRes.json());
```

#### 2. 查询某个记录的所有附件

```javascript
// 查询报销单 exp_001 的所有附件
const attachments = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'find',
        object: 'attachment',
        args: {
            filters: [
                ['related_to', '=', 'expense'],
                ['related_id', '=', 'exp_001']
            ],
            sort: 'created_at desc'
        }
    })
}).then(r => r.json());

console.log('找到附件：', attachments.items.length);
```

#### 3. 删除附件

```javascript
// 删除单个附件
await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'delete',
        object: 'attachment',
        args: { id: 'att_123' }
    })
});
```

#### 4. 批量上传

```javascript
async function uploadMultipleAttachments(files, relatedTo, relatedId) {
    const attachments = [];
    
    for (const file of files) {
        // 上传文件
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });
        const uploadedFile = (await uploadRes.json()).data;
        
        // 创建附件记录
        const attachmentRes = await fetch('/api/objectql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                op: 'create',
                object: 'attachment',
                args: {
                    name: uploadedFile.original_name,
                    file_url: uploadedFile,
                    file_size: uploadedFile.size,
                    file_type: uploadedFile.type,
                    related_to: relatedTo,
                    related_id: relatedId
                }
            })
        });
        
        attachments.push((await attachmentRes.json()));
    }
    
    return attachments;
}

// 使用示例
await uploadMultipleAttachments(
    fileInput.files,
    'expense',
    'exp_001'
);
```

### 优点

✅ **灵活性高** - 附件可以被多个记录共享  
✅ **独立管理** - 可以单独查询、统计所有附件  
✅ **扩展性好** - 易于添加附件相关的功能（如标签、分类）  
✅ **适合复杂场景** - 如文档管理系统、知识库  

### 缺点

❌ 查询复杂 - 需要额外的查询来获取附件  
❌ 性能开销 - 需要 JOIN 或多次查询  
❌ 数据一致性 - 删除主记录时需要手动清理附件  

---

## 方案对比

| 特性 | 嵌入式附件 | 独立附件对象 |
|------|-----------|-------------|
| **实现难度** | ⭐ 简单 | ⭐⭐⭐ 较复杂 |
| **查询性能** | ⭐⭐⭐ 快 | ⭐⭐ 中等 |
| **灵活性** | ⭐⭐ 中等 | ⭐⭐⭐ 高 |
| **附件共享** | ❌ 不支持 | ✅ 支持 |
| **数据一致性** | ✅ 自动 | ⚠️ 需手动维护 |
| **适用场景** | 简单附件需求 | 复杂文档管理 |

### 选择建议

**使用嵌入式附件（方案一）如果：**
- 附件数量少（1-10 个）
- 附件与记录一对一或一对多
- 不需要共享附件
- 追求简单和性能

**使用独立附件对象（方案二）如果：**
- 需要独立管理附件
- 附件需要被多个记录引用
- 需要复杂的附件查询和统计
- 构建文档管理系统或知识库

---

## 实际应用示例

### 示例 1：报销系统（嵌入式）

```yaml
# expense.object.yml
name: expense
fields:
  expense_number:
    type: text
    required: true
  amount:
    type: number
    required: true
  receipt:
    type: file
    label: 收据
    accept: ['.pdf', '.jpg', '.png']
    max_size: 5242880
```

```javascript
// 使用
const expense = await createExpense({
    expense_number: 'EXP-001',
    amount: 125.50,
    receipt: uploadedFile
});
```

### 示例 2：客户管理系统（独立附件）

```yaml
# account.object.yml
name: account
fields:
  name:
    type: text
    required: true
  industry:
    type: select
    options: ['IT', '制造', '金融']

# attachment.object.yml
name: attachment
fields:
  related_to:
    type: text
    index: true
  related_id:
    type: text
    index: true
  file_url:
    type: file
```

```javascript
// 上传客户合同
await createAttachment({
    related_to: 'account',
    related_id: 'acc_001',
    file_url: contractFile,
    name: '服务合同',
    category: 'contract'
});

// 查询客户的所有文件
const files = await findAttachments({
    filters: [
        ['related_to', '=', 'account'],
        ['related_id', '=', 'acc_001']
    ]
});
```

### 示例 3：产品图库（嵌入式多图）

```yaml
# product.object.yml
name: product
fields:
  name:
    type: text
    required: true
  gallery:
    type: image
    label: 产品图库
    multiple: true
    max_size: 2097152  # 2MB per image
```

```javascript
// 批量上传产品图片
const images = await Promise.all(
    Array.from(fileInput.files).map(file => uploadFile(file))
);

const product = await createProduct({
    name: '高端笔记本电脑',
    gallery: images
});
```

---

## 查询与检索

### 嵌入式附件查询

```javascript
// 查询有附件的记录
const expensesWithReceipt = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'find',
        object: 'expense',
        args: {
            filters: [['receipt', '!=', null]]
        }
    })
}).then(r => r.json());

// 查询没有附件的记录
const expensesWithoutReceipt = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'find',
        object: 'expense',
        args: {
            filters: [['receipt', '=', null]]
        }
    })
}).then(r => r.json());
```

### 独立附件对象查询

```javascript
// 查询某个对象类型的所有附件
const expenseAttachments = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'find',
        object: 'attachment',
        args: {
            filters: [['related_to', '=', 'expense']],
            sort: 'created_at desc'
        }
    })
}).then(r => r.json());

// 统计附件数量
const count = await fetch('/api/objectql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        op: 'count',
        object: 'attachment',
        args: {
            filters: [
                ['related_to', '=', 'expense'],
                ['related_id', '=', 'exp_001']
            ]
        }
    })
}).then(r => r.json());

console.log('附件数量：', count.count);
```

---

## 最佳实践

### 1. 选择合适的方案

```javascript
// ✅ 推荐：简单场景使用嵌入式
const expense = {
    expense_number: 'EXP-001',
    receipt: uploadedFile  // 直接嵌入
};

// ✅ 推荐：复杂场景使用独立对象
const attachment = {
    related_to: 'expense',
    related_id: 'exp_001',
    file_url: uploadedFile
};
```

### 2. 文件上传验证

```javascript
// 客户端验证
function validateFile(file, fieldConfig) {
    // 检查文件类型
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    if (!fieldConfig.accept.includes(ext)) {
        throw new Error(`不支持的文件类型：${ext}`);
    }
    
    // 检查文件大小
    if (file.size > fieldConfig.max_size) {
        throw new Error(`文件过大：${file.size} 字节`);
    }
}
```

### 3. 错误处理

```javascript
async function uploadAndCreateExpense(expenseData, file) {
    try {
        // 上传文件
        const uploadedFile = await uploadFile(file);
        
        // 创建记录
        const expense = await createExpense({
            ...expenseData,
            receipt: uploadedFile
        });
        
        return expense;
    } catch (error) {
        // 如果创建失败，应该清理已上传的文件
        if (uploadedFile) {
            await deleteFile(uploadedFile.id);
        }
        throw error;
    }
}
```

### 4. 数据清理

```javascript
// 删除记录时清理附件（独立附件对象）
async function deleteExpenseWithAttachments(expenseId) {
    // 查询关联的附件
    const attachments = await findAttachments({
        filters: [
            ['related_to', '=', 'expense'],
            ['related_id', '=', expenseId]
        ]
    });
    
    // 删除附件记录
    for (const attachment of attachments.items) {
        await deleteAttachment(attachment.id);
    }
    
    // 删除主记录
    await deleteExpense(expenseId);
}
```

### 5. 性能优化

```javascript
// ✅ 批量上传优化
async function batchUpload(files) {
    // 并行上传
    const uploads = files.map(file => uploadFile(file));
    return await Promise.all(uploads);
}

// ✅ 分页查询附件
const attachments = await findAttachments({
    filters: [['related_to', '=', 'expense']],
    limit: 20,
    skip: 0,
    sort: 'created_at desc'
});
```

---

## 总结

ObjectQL 提供了两种灵活的附件关联方案：

1. **嵌入式附件**（推荐用于大多数场景）
   - 将附件元数据存储在字段中
   - 简单、高效、易于维护

2. **独立附件对象**（用于复杂场景）
   - 创建专门的 attachment 对象
   - 通过 related_to/related_id 关联
   - 适合文档管理系统

选择合适的方案取决于具体的业务需求。对于简单的附件需求，嵌入式方案足够；对于需要复杂附件管理的系统，使用独立附件对象更合适。

**相关文档：**
- [附件 API 文档](../api/attachments.md)
- [文件上传示例](./file-upload-example.md)
- [S3 集成指南](./s3-integration-guide-cn.md)
