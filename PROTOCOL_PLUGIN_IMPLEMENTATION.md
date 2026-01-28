# ObjectStack Protocol Plugin Implementation Guide

## 概述 (Overview)

根据问题陈述中的要求，本实现演示了如何按照 ObjectStack 架构规范创建协议插件。

According to the requirements in the problem statement, this implementation demonstrates how to create protocol plugins following the ObjectStack architectural specifications.

## 实现的组件 (Implemented Components)

### 1. ObjectStackRuntimeProtocol 桥接层 (Bridge Layer)

**位置 (Location)**: `packages/objectstack/runtime/src/index.ts`

这是协议插件与内核之间的标准桥接器，将外部协议请求转换为内核可理解的操作。

This is the standard bridge between protocol plugins and the kernel, converting external protocol requests into kernel-understandable operations.

**核心方法 (Core Methods)**:

#### 元数据方法 (Metadata Methods)
```typescript
getMetaTypes(): string[]                    // 获取所有对象类型
getMetaItem(objectName): unknown           // 获取对象元数据
getAllMetaItems(metaType): Map             // 获取所有元数据
hasObject(objectName): boolean             // 检查对象是否存在
```

#### 数据查询方法 (Data Query Methods)
```typescript
findData(objectName, query?): Promise<{value, count}>  // 查询多条记录
getData(objectName, id): Promise<any>                  // 获取单条记录
countData(objectName, filters?): Promise<number>       // 计数
```

#### 数据修改方法 (Data Mutation Methods)
```typescript
createData(objectName, data): Promise<any>            // 创建记录
updateData(objectName, id, data): Promise<any>        // 更新记录
deleteData(objectName, id): Promise<boolean>          // 删除记录
```

#### 视图和动作方法 (View & Action Methods)
```typescript
getViewConfig(objectName, viewType?): unknown         // 获取视图配置
executeAction(actionName, params?): Promise<any>      // 执行动作
getActions(): string[]                                // 列出所有动作
```

### 2. OData V4 协议插件 (OData V4 Protocol Plugin)

**位置 (Location)**: `packages/protocols/odata-v4/`

实现了完整的 OData V4 规范，提供 RESTful API 风格的数据访问。

Implements full OData V4 specification, providing RESTful API style data access.

**功能特性 (Features)**:
- ✅ 服务文档 (`/`) - Service Document
- ✅ 元数据文档 (`/$metadata`) - Metadata Document (EDMX)
- ✅ 实体集查询 (`/EntitySet`) - Entity Set Queries
- ✅ 查询选项 (`$filter`, `$select`, `$orderby`, `$top`, `$skip`) - Query Options
- ✅ 单实体获取 (`/EntitySet('id')`) - Single Entity Retrieval
- ✅ CRUD 操作 (GET, POST, PUT/PATCH, DELETE) - CRUD Operations
- ✅ CORS 支持 - CORS Support

**使用示例 (Usage Example)**:
```typescript
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';

const kernel = new ObjectStackKernel([
  new ODataV4Plugin({
    port: 8080,
    basePath: '/odata',
    namespace: 'MyApp',
    enableCORS: true
  })
]);
```

**端点示例 (Endpoint Examples)**:
- `GET /odata/` - 服务文档 (Service document)
- `GET /odata/$metadata` - EDMX 元数据 (EDMX metadata)
- `GET /odata/users` - 查询所有用户 (Query all users)
- `GET /odata/users('123')` - 获取单个用户 (Get single user)
- `POST /odata/users` - 创建用户 (Create user)
- `PUT /odata/users('123')` - 更新用户 (Update user)
- `DELETE /odata/users('123')` - 删除用户 (Delete user)

### 3. JSON-RPC 2.0 协议插件 (JSON-RPC 2.0 Protocol Plugin)

**位置 (Location)**: `packages/protocols/json-rpc/`

实现了完整的 JSON-RPC 2.0 规范，提供 RPC 风格的数据访问。

Implements full JSON-RPC 2.0 specification, providing RPC style data access.

**功能特性 (Features)**:
- ✅ 完整 JSON-RPC 2.0 规范 - Full JSON-RPC 2.0 Specification
- ✅ 批量请求 - Batch Requests
- ✅ 通知支持 - Notification Support
- ✅ 内省方法 - Introspection Methods
- ✅ CRUD 方法 - CRUD Methods
- ✅ 元数据方法 - Metadata Methods
- ✅ 动作方法 - Action Methods

**使用示例 (Usage Example)**:
```typescript
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

const kernel = new ObjectStackKernel([
  new JSONRPCPlugin({
    port: 9000,
    basePath: '/rpc',
    enableCORS: true,
    enableIntrospection: true
  })
]);
```

**可用的 RPC 方法 (Available RPC Methods)**:
- `object.find(objectName, query)` - 查询记录 (Find records)
- `object.get(objectName, id)` - 获取记录 (Get record)
- `object.create(objectName, data)` - 创建记录 (Create record)
- `object.update(objectName, id, data)` - 更新记录 (Update record)
- `object.delete(objectName, id)` - 删除记录 (Delete record)
- `object.count(objectName, filters)` - 计数 (Count records)
- `metadata.list()` - 列出对象 (List objects)
- `metadata.get(objectName)` - 获取元数据 (Get metadata)
- `action.execute(actionName, params)` - 执行动作 (Execute action)
- `system.listMethods()` - 列出方法 (List methods)
- `system.describe(method)` - 描述方法 (Describe method)

**请求示例 (Request Example)**:
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "object.find",
    "params": ["users", {"where": {"active": true}}],
    "id": 1
  }'
```

### 4. 多协议服务器示例 (Multi-Protocol Server Example)

**位置 (Location)**: `examples/protocols/multi-protocol-server/`

演示如何在同一个内核上同时运行多个协议插件。

Demonstrates how to run multiple protocol plugins on the same kernel simultaneously.

**运行示例 (Run Example)**:
```bash
cd examples/protocols/multi-protocol-server
pnpm install
pnpm start
```

## 架构合规性 (Architecture Compliance)

### ✅ 遵循的架构规则 (Followed Architectural Rules)

1. **插件接口 (Plugin Interface)**
   - ✅ 所有协议实现 `RuntimePlugin` 接口
   - All protocols implement `RuntimePlugin` interface

2. **桥接层 (Bridge Layer)**
   - ✅ 实例化 `ObjectStackRuntimeProtocol` 类
   - Instantiate `ObjectStackRuntimeProtocol` class
   - ✅ 将外部协议请求转换为内核操作
   - Convert external protocol requests to kernel operations

3. **无直接数据库访问 (No Direct DB Access)**
   - ✅ 插件严禁直接连接数据库
   - Plugins forbidden from direct database connection
   - ✅ 所有数据交互通过协议桥接方法
   - All data interactions through protocol bridge methods

4. **生命周期 (Lifecycle)**
   - ✅ 在 `install` 钩子中初始化桥接层
   - Initialize bridge layer in `install` hook
   - ✅ 在 `onStart` 钩子中启动服务
   - Start service in `onStart` hook
   - ✅ 在 `onStop` 钩子中清理资源
   - Cleanup resources in `onStop` hook

### 代码模式 (Code Pattern)

```typescript
export class MyProtocolPlugin implements RuntimePlugin {
  name = '@objectql/protocol-my-protocol';
  private protocol?: ObjectStackRuntimeProtocol;

  // 1. 安装阶段：初始化桥接器
  // Install phase: Initialize bridge
  async install(ctx: RuntimeContext): Promise<void> {
    const { ObjectStackRuntimeProtocol } = await import('@objectstack/runtime');
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  // 2. 启动阶段：启动协议服务器
  // Start phase: Start protocol server
  async onStart(ctx: RuntimeContext): Promise<void> {
    // 使用 this.protocol 的方法与内核交互
    // Use this.protocol methods to interact with kernel
    const objects = this.protocol!.getMetaTypes();
    const data = await this.protocol!.findData('users', {});
  }

  // 3. 停止阶段：清理资源
  // Stop phase: Cleanup resources
  async onStop(ctx: RuntimeContext): Promise<void> {
    // 关闭连接，释放资源
    // Close connections, release resources
  }
}
```

## 关键设计决策 (Key Design Decisions)

### 1. 桥接层设计 (Bridge Layer Design)

**问题 (Problem)**: 如何在不让协议直接访问数据库的情况下提供数据访问？

How to provide data access without letting protocols directly access the database?

**解决方案 (Solution)**: 创建 `ObjectStackRuntimeProtocol` 作为标准化的 API 层

Create `ObjectStackRuntimeProtocol` as a standardized API layer

**优势 (Benefits)**:
- ✅ 关注点分离 - Separation of concerns
- ✅ 类型安全 - Type safety
- ✅ 一致性保证 - Consistency guarantee
- ✅ 易于测试 - Easy to test

### 2. 插件生命周期 (Plugin Lifecycle)

**阶段 (Phases)**:
1. `install` - 注册组件，初始化状态 (Register components, initialize state)
2. `onStart` - 启动后台进程，连接服务 (Start background processes, connect services)
3. `onStop` - 清理资源，断开连接 (Cleanup resources, disconnect services)

### 3. 协议无关性 (Protocol Agnosticism)

桥接层不知道也不关心使用它的协议类型，这使得：

The bridge layer doesn't know or care about the protocol type using it, which enables:

- ✅ 添加新协议无需修改内核 - Add new protocols without modifying kernel
- ✅ 多协议共存 - Multiple protocols coexist
- ✅ 协议可替换 - Protocols are replaceable

## 测试策略 (Testing Strategy)

### 单元测试 (Unit Tests)
```typescript
describe('ObjectStackRuntimeProtocol', () => {
  it('should get metadata types', () => {
    const protocol = new ObjectStackRuntimeProtocol(mockKernel);
    expect(protocol.getMetaTypes()).toEqual(['users', 'projects']);
  });

  it('should find data', async () => {
    const protocol = new ObjectStackRuntimeProtocol(mockKernel);
    const result = await protocol.findData('users', {});
    expect(result.value).toHaveLength(2);
  });
});
```

### 集成测试 (Integration Tests)
```typescript
describe('ODataV4Plugin', () => {
  it('should serve metadata document', async () => {
    const response = await fetch('http://localhost:8080/odata/$metadata');
    expect(response.headers.get('content-type')).toBe('application/xml');
  });

  it('should query entity set', async () => {
    const response = await fetch('http://localhost:8080/odata/users');
    const data = await response.json();
    expect(data.value).toBeInstanceOf(Array);
  });
});
```

## 扩展指南 (Extension Guide)

### 创建新协议插件 (Creating a New Protocol Plugin)

#### 步骤 1: 创建包结构 (Create Package Structure)
```bash
packages/protocols/my-protocol/
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

#### 步骤 2: 实现 RuntimePlugin (Implement RuntimePlugin)
```typescript
import type { RuntimePlugin, RuntimeContext, ObjectStackRuntimeProtocol } from '@objectstack/runtime';

export class MyProtocolPlugin implements RuntimePlugin {
  name = '@objectql/protocol-my-protocol';
  version = '0.1.0';
  
  private protocol?: ObjectStackRuntimeProtocol;

  async install(ctx: RuntimeContext): Promise<void> {
    const { ObjectStackRuntimeProtocol } = await import('@objectstack/runtime');
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  async onStart(ctx: RuntimeContext): Promise<void> {
    // 实现你的协议服务器
    // Implement your protocol server
  }

  async onStop(ctx: RuntimeContext): Promise<void> {
    // 清理资源
    // Cleanup resources
  }
}
```

#### 步骤 3: 使用桥接方法 (Use Bridge Methods)
```typescript
// 只使用 this.protocol 的方法，不直接访问数据库
// Only use this.protocol methods, never access database directly

const objects = this.protocol.getMetaTypes();
const data = await this.protocol.findData('users', query);
await this.protocol.createData('users', newUser);
```

## 最佳实践 (Best Practices)

1. **类型安全 (Type Safety)**
   - 使用 TypeScript strict 模式
   - Use TypeScript strict mode
   - 避免使用 `any` 类型
   - Avoid using `any` type

2. **错误处理 (Error Handling)**
   - 提供有意义的错误消息
   - Provide meaningful error messages
   - 使用协议特定的错误格式
   - Use protocol-specific error formats

3. **配置化 (Configuration)**
   - 通过构造函数接受配置
   - Accept configuration through constructor
   - 提供合理的默认值
   - Provide reasonable defaults

4. **文档化 (Documentation)**
   - 记录所有公开的端点
   - Document all public endpoints
   - 提供使用示例
   - Provide usage examples

5. **测试 (Testing)**
   - 编写单元测试
   - Write unit tests
   - 编写集成测试
   - Write integration tests

## 总结 (Summary)

本实现完全遵循问题陈述中的架构要求：

This implementation fully complies with the architectural requirements in the problem statement:

✅ 所有协议实现 RuntimePlugin 接口
✅ All protocols implement RuntimePlugin interface

✅ 使用 ObjectStackRuntimeProtocol 桥接层
✅ Use ObjectStackRuntimeProtocol bridge layer

✅ 无直接数据库访问
✅ No direct database access

✅ 生命周期管理正确
✅ Correct lifecycle management

✅ 类型安全的 TypeScript 实现
✅ Type-safe TypeScript implementation

✅ 提供完整的示例和文档
✅ Provide complete examples and documentation

## 许可证 (License)

MIT
