# Data API 规范合规性分析 - 中文摘要

## 文档信息
- **创建日期**: 2026-02-03
- **版本**: 1.0
- **规范参考**: @objectstack/spec v0.9.0
- **分析范围**: Data API 协议与驱动实现

---

## 执行摘要

本文档对 ObjectQL 代码库与 `@objectstack/spec` zod 协议中 Data API 相关要求的合规性进行了全面分析。分析涵盖了所有协议实现（REST、GraphQL、OData v4、JSON-RPC）以及所有驱动实现（SQL、MongoDB、Redis、基于内存的驱动、SDK）。

### 核心发现

✅ **优势：**
- 所有驱动都完整实现了 QueryAST 和 FilterCondition 支持
- 所有协议都提供了 CRUD 操作
- 良好的关注点分离（协议 → 引擎 → 驱动）
- 驱动层有良好的测试覆盖率

❌ **关键差距：**
- **协议边界缺少 zod schema 验证**
- 缺少操作：GraphQL count、OData $count、GraphQL 聚合
- 批量操作实现不完整
- 缺少正式的规范合规性验证

---

## 1. 协议层分析总结

### 1.1 REST 协议 (`packages/protocols/rest`)

**当前实现状态：**
- ✅ 完整的 CRUD 操作（find, findOne, create, update, delete）
- ✅ Count 操作
- ✅ 批量操作（createMany, updateMany, deleteMany）
- ✅ 自定义动作（action）
- ✅ OpenAPI 3.0 规范生成

**规范合规性问题：**
- ❌ **没有 zod schema 验证** - 未导入 @objectstack/spec
- ⚠️ 仅有 TypeScript 类型，无运行时验证
- ❌ 响应未经验证（鸭子类型）
- ⚠️ 错误代码未与规范对齐

---

### 1.2 GraphQL 协议 (`packages/protocols/graphql`)

**当前实现状态：**
- ✅ Apollo Server 4 自动生成 schema
- ✅ 查询、变更、订阅
- ✅ DataLoader 防止 N+1 问题
- ✅ Federation 支持

**规范合规性问题：**
- ⚠️ 有 @objectstack/spec ^0.9.0 依赖但未使用 zod
- ❌ **缺少 count 查询**
- ❌ **缺少聚合函数**（sum、avg、min、max）
- ❌ 不支持批量查询

---

### 1.3 OData v4 协议 (`packages/protocols/odata-v4`)

**当前实现状态：**
- ✅ 符合规范的查询选项（$filter, $select, $orderby, $top, $skip, $expand）
- ✅ 服务文档和 $metadata 端点
- ⚠️ $batch 端点（基础的 changesets）

**规范合规性问题：**
- ❌ **缺少 $count 端点**
- ⚠️ $batch 错误处理有限
- ⚠️ ETags 实现不明确
- ⚠️ $search 全文搜索部分实现
- ⚠️ 有规范依赖但使用有限

---

### 1.4 JSON-RPC 协议 (`packages/protocols/json-rpc`)

**当前实现状态：**
- ✅ JSON-RPC 2.0 合规
- ✅ 13 个注册方法
- ✅ 批量请求支持（带调用链）

**已注册方法：**
- 对象操作：object.{find, get, create, update, delete, count}
- 元数据操作：metadata.{list, get, getAll}
- 动作操作：action.{execute, list}
- 系统操作：system.{listMethods, describe}
- 会话操作（可选）：session.{create, get, set, destroy}

**规范合规性问题：**
- ⚠️ SSE 进度通知（Hono 适配器中标记为 TODO）
- ⚠️ 有规范依赖但未强制执行
- ✅ 标准 JSON-RPC 错误代码

---

## 2. 驱动层分析总结

### 所有驱动对比

| 驱动 | QueryAST | FilterCondition | 规范导入 | 状态 |
|------|----------|----------------|----------|------|
| SQL | ✅ 完整 | ✅ 完整 | ⚠️ 间接 | 生产就绪 |
| MongoDB | ✅ 完整 | ✅ 原生 | ⚠️ 间接 | 生产就绪 |
| Redis | ✅ 完整 | ✅ 完整 | ⚠️ 间接 | 生产就绪 |
| Memory | ✅ Mingo | ✅ Mingo | ⚠️ 间接 | 生产就绪 |
| Excel | ✅ 继承 | ✅ 继承 | ⚠️ 间接 | 生产就绪 |
| LocalStorage | ✅ 继承 | ✅ 继承 | ⚠️ 间接 | 生产就绪 |
| FileSystem | ✅ 继承 | ✅ 继承 | ⚠️ 间接 | 生产就绪 |
| SDK (远程) | ✅ 完整 | ✅ 通过 QueryAST | ⚠️ 间接 | 生产就绪 |

**注意：** 所有驱动通过 `@objectql/types` 间接依赖 `@objectstack/spec`，但不直接使用 zod schemas 进行验证。

### 驱动实现要点

**SQL 驱动：**
- 基于 Knex.js（多数据库抽象）
- 支持 PostgreSQL、MySQL、SQLite、MSSQL、Oracle
- 完整的 QueryAST → SQL 转换
- 支持事务、联接、窗口函数、子查询

**MongoDB 驱动：**
- 原生 MongoDB 驱动 + 聚合管道
- 完整的 QueryAST → 聚合管道转换
- 支持变更流（Change Streams）实时更新
- 原生 FilterCondition 支持

**Redis 驱动：**
- 基于键扫描的 QueryAST 实现
- 自动重试 + 指数退避
- 连接健康监控
- 适合缓存和中小型数据集

**基于内存的驱动（Memory/Excel/FS/LocalStorage）：**
- 基于 Mingo（类 MongoDB 查询引擎）
- 高性能内存操作
- 原子事务、线程安全
- Excel/FS/LocalStorage 继承 MemoryDriver

**SDK 驱动（远程 HTTP 客户端）：**
- 通用 HTTP 客户端
- 支持浏览器、Node.js、Deno、边缘运行时
- 提供 `DataApiClient` 和 `MetadataApiClient`
- executeQuery() 支持 QueryAST

---

## 3. 关键差距与建议

### 3.1 缺少 Zod 验证（**最高优先级** 🔴）

**现状：**
- 所有包依赖 @objectstack/spec v0.9.0
- **没有任何包使用 zod schemas 进行运行时验证**
- 验证是鸭子类型或在引擎层处理

**影响：**
- 无法保证 API 请求符合规范
- 无法保证驱动实现遵循协议
- 运行时错误而非验证错误
- 开发者体验差（没有清晰的错误消息）

**建议的实现方式：**
```typescript
// 示例：REST 协议应该这样验证
import { z } from 'zod';
import { Api } from '@objectstack/spec';

// 验证传入请求
const validatedRequest = Api.RestServer.RequestSchema.parse(req.body);

// 验证传出响应
const validatedResponse = Api.RestServer.ResponseSchema.parse(response);
```

---

### 3.2 缺少操作（**高优先级** 🔴）

**GraphQL 协议缺少：**
```graphql
# 缺少 count 操作
type Query {
  countAccounts(where: FilterCondition): Int!
  countOrders(where: FilterCondition): Int!
}

# 缺少聚合操作
type Query {
  aggregateOrders(
    where: FilterCondition
    groupBy: [String!]
    aggregations: [AggregationNode!]!
  ): [AggregateResult!]!
}
```

**OData v4 协议缺少：**
```
GET /odata/Accounts/$count
GET /odata/Accounts?$count=true
```

---

### 3.3 批量操作不完整（**中优先级** 🟡）

**JSON-RPC：**
- SSE 进度通知在 Hono 适配器中标记为"TODO"
- 调用链工作但需要更好的文档

**OData：**
- $batch changesets 错误处理有限
- 需要在 changeset 失败时事务回滚

**GraphQL：**
- 不支持批量查询（所有查询必须在单个请求中）

---

## 4. 开发路线图

### 第 1 阶段：Zod 验证集成（优先级：**高** 🔴）

**时间线：** 2-3 周

**任务清单：**
1. **REST 协议验证**
   - [ ] 导入 `@objectstack/spec/api` schemas
   - [ ] 创建验证中间件
   - [ ] 使用 `RestApiConfigSchema` 验证请求体
   - [ ] 使用规范 schemas 验证响应
   - [ ] 为验证失败添加错误映射
   - [ ] 编写集成测试

2. **GraphQL 协议验证**
   - [ ] 为 GraphQL 输入添加 zod 验证
   - [ ] 验证解析器参数
   - [ ] 将 GraphQL 错误映射到规范错误代码
   - [ ] 编写集成测试

3. **OData v4 协议验证**
   - [ ] 验证查询字符串参数
   - [ ] 验证请求体
   - [ ] 验证 $batch 请求
   - [ ] 编写集成测试

4. **JSON-RPC 协议验证**
   - [ ] 验证方法参数
   - [ ] 验证批量请求
   - [ ] 验证响应
   - [ ] 编写集成测试

**交付成果：**
- 所有协议使用 zod 验证请求/响应
- 全面的错误消息
- 100% 验证测试覆盖率

---

### 第 2 阶段：缺失操作（优先级：**高** 🔴）

**时间线：** 2-3 周

**任务清单：**
1. **GraphQL Count 操作**
   - [ ] 添加 count 查询解析器
   - [ ] 为所有对象生成 count 查询
   - [ ] 添加测试

2. **OData $count 端点**
   - [ ] 实现 `GET /odata/{object}/$count`
   - [ ] 实现 `?$count=true` 查询参数
   - [ ] 添加测试

3. **GraphQL 聚合**
   - [ ] 设计聚合解析器 schema
   - [ ] 实现聚合解析器
   - [ ] 支持 groupBy + aggregations
   - [ ] 添加测试

**交付成果：**
- 所有对象的 GraphQL count 查询
- OData $count 端点
- GraphQL 聚合查询
- 完整测试覆盖率

---

### 第 3 阶段：批量操作（优先级：**中** 🟡）

**时间线：** 1-2 周

**任务清单：**
1. **JSON-RPC SSE 进度**
   - [ ] 为 Hono 完成 SSE 实现
   - [ ] 添加进度回调
   - [ ] 文档使用方法
   - [ ] 添加测试

2. **OData $batch 增强**
   - [ ] 改进 changeset 错误处理
   - [ ] 添加事务回滚
   - [ ] 添加原子批量操作
   - [ ] 添加测试

3. **文档**
   - [ ] 文档批量操作使用方法
   - [ ] 文档调用链（JSON-RPC）
   - [ ] 添加示例

---

### 第 4 阶段：文档与测试（优先级：**中** 🟡）

**时间线：** 1-2 周

**任务清单：**
1. **协议合规性文档**
   - [ ] 为每个协议文档规范合规性
   - [ ] 创建对比矩阵
   - [ ] 添加迁移指南

2. **集成测试**
   - [ ] 为协议添加 TCK 测试
   - [ ] 为驱动添加 TCK 测试
   - [ ] 添加端到端测试

3. **API 文档**
   - [ ] 更新 OpenAPI 规范
   - [ ] 更新 GraphQL schema 文档
   - [ ] 更新 OData 元数据

---

### 第 5 阶段：类型安全（优先级：**低** ⚪）

**时间线：** 1 周

**任务清单：**
1. **驱动验证**
   - [ ] 添加运行时驱动验证
   - [ ] 验证方法签名
   - [ ] 添加类型守卫

2. **元数据验证**
   - [ ] 根据规范 schemas 验证元数据
   - [ ] 为字段定义添加运行时检查
   - [ ] 添加类型守卫

---

## 5. 成功标准

### 第 1 阶段成功标准
✅ 所有协议使用 zod schemas 验证请求/响应  
✅ 所有验证错误映射到规范错误代码  
✅ 100% 验证测试覆盖率  
✅ 没有因无效数据导致的运行时错误  

### 第 2 阶段成功标准
✅ GraphQL count 查询适用于所有对象  
✅ OData $count 端点返回正确计数  
✅ GraphQL 聚合支持所有聚合函数  
✅ 所有新操作都有测试  

### 第 3 阶段成功标准
✅ JSON-RPC SSE 进度在 Hono 中工作  
✅ OData $batch 正确处理错误  
✅ 所有批量操作都有文档  
✅ 批量操作有集成测试  

### 第 4 阶段成功标准
✅ 所有协议的规范合规性都有文档  
✅ TCK 测试套件通过所有协议/驱动  
✅ API 文档是最新的  

### 第 5 阶段成功标准
✅ 运行时驱动验证防止无效驱动  
✅ 元数据验证捕获 schema 错误  
✅ 类型守卫防止类型错误  

---

## 6. 结论

ObjectQL 代码库展示了强大的架构基础，具有全面的驱动支持和多种协议实现。然而，当前实现与正式的 `@objectstack/spec` zod 协议要求之间存在显著差距。

**关键要点：**
1. **高优先级：** 在所有协议边界集成 zod 验证
2. **高优先级：** 实现缺失的操作（count、聚合）
3. **中优先级：** 完成批量操作实现
4. **中优先级：** 添加全面的文档和测试
5. **低优先级：** 添加运行时类型安全改进

提议的 5 阶段开发计划提供了一条清晰的前进道路，以在保持向后兼容性并最小化破坏性变更的同时实现完全的规范合规性。

---

**详细分析文档（英文）：** 请参阅 `docs/DATA_API_SPEC_COMPLIANCE_ANALYSIS.md`

**相关文档：**
- `docs/DEVELOPMENT_ROADMAP_v0.9.0.md` - ObjectQL v0.9.0 开发路线图
- `docs/MIGRATION_GUIDE_v0.9.0.md` - v0.9.0 迁移指南
- `docs/adr/ADR-001-plugin-validation-and-logging.md` - Zod 验证决策记录
