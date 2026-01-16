# @objectql/driver-fs

ObjectQL 文件系统驱动 - 基于 JSON 文件的持久化存储，每个表一个文件。

## 特性

✅ **持久化存储** - 数据在进程重启后保留  
✅ **每表一文件** - 每个对象类型存储在独立的 JSON 文件中（例如：`users.json`、`projects.json`）  
✅ **人类可读** - 格式化的 JSON，便于检查和调试  
✅ **原子写入** - 临时文件 + 重命名策略防止数据损坏  
✅ **备份支持** - 写入时自动创建备份文件（`.bak`）  
✅ **完整查询支持** - 过滤、排序、分页、字段投影  
✅ **零数据库配置** - 无需外部依赖或数据库安装

## 安装

```bash
npm install @objectql/driver-fs
```

## 快速开始

```typescript
import { ObjectQL } from '@objectql/core';
import { FileSystemDriver } from '@objectql/driver-fs';

// 1. 初始化驱动
const driver = new FileSystemDriver({
    dataDir: './data' // JSON 文件存储目录
});

// 2. 初始化 ObjectQL
const app = new ObjectQL({
    datasources: {
        default: driver
    }
});

// 3. 定义对象
app.registerObject({
    name: 'users',
    fields: {
        name: { type: 'text', required: true },
        email: { type: 'email' },
        age: { type: 'number' }
    }
});

await app.init();

// 4. 使用 API
const ctx = app.createContext({ isSystem: true });
const users = ctx.object('users');

// 创建
await users.create({ name: 'Alice', email: 'alice@example.com', age: 30 });

// 查询
const allUsers = await users.find({});
console.log(allUsers);

// 带过滤条件查询
const youngUsers = await users.find({
    filters: [['age', '<', 25]]
});
```

## 配置选项

```typescript
interface FileSystemDriverConfig {
    /** JSON 文件存储目录路径 */
    dataDir: string;
    
    /** 启用格式化 JSON 以提高可读性（默认：true） */
    prettyPrint?: boolean;
    
    /** 启用写入时备份文件（默认：true） */
    enableBackup?: boolean;
    
    /** 启用严格模式（缺失对象时抛出错误）（默认：false） */
    strictMode?: boolean;
    
    /** 初始数据（可选） */
    initialData?: Record<string, any[]>;
}
```

### 配置示例

```typescript
const driver = new FileSystemDriver({
    dataDir: './data',
    prettyPrint: true,      // 人类可读的 JSON
    enableBackup: true,     // 创建 .bak 备份文件
    strictMode: false,      // 优雅处理缺失记录
    initialData: {          // 预加载初始数据
        users: [
            { id: 'admin', name: '管理员', role: 'admin' }
        ]
    }
});
```

## 文件存储格式

每个对象类型存储在独立的 JSON 文件中：

```
./data/
  ├── users.json
  ├── users.json.bak      (备份)
  ├── projects.json
  ├── projects.json.bak
  └── tasks.json
```

### 文件内容示例（`users.json`）

```json
[
  {
    "id": "users-1234567890-1",
    "name": "Alice",
    "email": "alice@example.com",
    "age": 30,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "users-1234567891-2",
    "name": "Bob",
    "email": "bob@example.com",
    "age": 25,
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
]
```

## API 示例

### CRUD 操作

```typescript
const ctx = app.createContext({ isSystem: true });
const products = ctx.object('products');

// 创建
const product = await products.create({
    name: '笔记本电脑',
    price: 1000,
    category: '电子产品'
});

// 查询单个
const found = await products.findOne(product.id);

// 更新
await products.update(product.id, { price: 950 });

// 删除
await products.delete(product.id);
```

### 查询操作

```typescript
// 过滤
const electronics = await products.find({
    filters: [['category', '=', '电子产品']]
});

// 多条件 OR 查询
const results = await products.find({
    filters: [
        ['price', '<', 500],
        'or',
        ['category', '=', '促销']
    ]
});

// 排序
const sorted = await products.find({
    sort: [['price', 'desc']]
});

// 分页
const page1 = await products.find({
    limit: 10,
    skip: 0
});

// 字段投影
const names = await products.find({
    fields: ['name', 'price']
});
```

### 批量操作

```typescript
// 批量创建
await products.createMany([
    { name: '商品 1', price: 10 },
    { name: '商品 2', price: 20 },
    { name: '商品 3', price: 30 }
]);

// 批量更新
await products.updateMany(
    [['category', '=', '电子产品']], // 过滤条件
    { onSale: true }                  // 更新数据
);

// 批量删除
await products.deleteMany([
    ['price', '<', 10]
]);

// 计数
const count = await products.count({
    filters: [['category', '=', '电子产品']]
});

// 去重值
const categories = await products.distinct('category');
```

## 支持的查询操作符

- **相等性**：`=`、`==`、`!=`、`<>`
- **比较**：`>`、`>=`、`<`、`<=`
- **成员**：`in`、`nin`（不在其中）
- **字符串匹配**：`like`、`contains`、`startswith`、`endswith`
- **范围**：`between`

## 使用场景

### ✅ 适用于

- **小到中等数据集**（每个对象 < 10k 条记录）
- **开发和原型设计**，需要持久化数据
- **配置存储**（设置、元数据）
- **嵌入式应用**（Electron、Tauri）
- **无需数据库**的场景（无需数据库配置）
- **人类可读数据**（易于调试和修改）

### ❌ 不推荐用于

- **大型数据集**（每个对象 > 10k 条记录）
- **高并发写入**（多进程同时写入）
- **生产环境高流量应用**（使用 SQL/MongoDB 驱动替代）
- **复杂事务**（使用支持事务的 SQL 驱动）

## 性能特征

- **读性能**：过滤查询 O(n)，简单查找速度快
- **写性能**：O(n) - 每次更新重写整个文件
- **存储格式**：人类可读的 JSON（比二进制格式大）
- **并发**：单进程安全，多进程需要外部锁

## 数据安全

### 原子写入

驱动使用临时文件 + 重命名策略防止损坏：

1. 将新数据写入 `{file}.tmp`
2. 重命名 `{file}.tmp` → `{file}`（原子操作）
3. 如果进程在写入过程中崩溃，原始文件保持完整

### 备份文件

当 `enableBackup: true` 时，驱动创建 `.bak` 文件：

```
users.json      ← 当前数据
users.json.bak  ← 上一版本
```

从备份恢复：

```bash
cp data/users.json.bak data/users.json
```

## 高级用法

### 自定义 ID 生成

```typescript
// 使用自己的 ID
await products.create({
    id: 'PROD-001',
    name: '自定义产品'
});

// 或使用 _id（MongoDB 风格）
await products.create({
    _id: '507f1f77bcf86cd799439011',
    name: 'Mongo 风格产品'
});
```

### 加载初始数据

方法 1：在配置中提供

```typescript
const driver = new FileSystemDriver({
    dataDir: './data',
    initialData: {
        users: [
            { id: 'admin-001', name: '管理员', role: 'admin' }
        ],
        settings: [
            { key: 'theme', value: 'dark' }
        ]
    }
});
```

方法 2：预创建 JSON 文件

```json
// ./data/users.json
[
  {
    "id": "admin-001",
    "name": "管理员",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

驱动将在启动时加载此数据。

### 多个数据目录

```typescript
// 开发环境
const devDriver = new FileSystemDriver({
    dataDir: './data/dev'
});

// 测试环境
const testDriver = new FileSystemDriver({
    dataDir: './data/test'
});
```

### 工具方法

```typescript
// 清除特定对象的所有数据
await driver.clear('users');

// 清除所有对象的数据
await driver.clearAll();

// 使缓存失效
driver.invalidateCache('users');

// 获取缓存大小
const size = driver.getCacheSize();
```

## 与其他驱动的对比

| 特性 | FileSystem | Memory | SQL | MongoDB |
|------|-----------|--------|-----|---------|
| 持久化 | ✅ 是 | ❌ 否 | ✅ 是 | ✅ 是 |
| 需要配置 | ❌ 否 | ❌ 否 | ✅ 是 | ✅ 是 |
| 人类可读 | ✅ 是 | ❌ 否 | ❌ 否 | ⚠️ 部分 |
| 性能（大数据） | ⚠️ 慢 | ✅ 快 | ✅ 快 | ✅ 快 |
| 事务 | ❌ 否 | ❌ 否 | ✅ 是 | ✅ 是 |
| 最适合 | 开发/配置 | 测试 | 生产 | 生产 |

## 故障排除

### 文件损坏

如果 JSON 文件损坏，从备份恢复：

```bash
cp data/users.json.bak data/users.json
```

### 权限问题

确保进程具有读/写权限：

```bash
chmod 755 ./data
```

### 文件过大

如果文件变得太大（> 1MB），考虑：

1. 将数据拆分为多个对象类型
2. 在生产环境使用 SQL/MongoDB 驱动
3. 实施数据归档策略

## 许可证

MIT

## 贡献

欢迎贡献！请在 GitHub 上开启 issue 或 PR。

## 相关包

- [@objectql/core](https://www.npmjs.com/package/@objectql/core) - ObjectQL 核心引擎
- [@objectql/driver-sql](https://www.npmjs.com/package/@objectql/driver-sql) - SQL 驱动（PostgreSQL、MySQL、SQLite）
- [@objectql/driver-mongo](https://www.npmjs.com/package/@objectql/driver-mongo) - MongoDB 驱动
- [@objectql/driver-memory](https://www.npmjs.com/package/@objectql/driver-memory) - 内存驱动
