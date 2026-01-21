# ObjectQL 迁移到 @objectstack/runtime 架构

## 概述

本文档详细说明了将 ObjectQL 仓库从独立 ORM 框架转变为基于 @objectstack/runtime 架构的**插件生态系统**的全面迁移计划。

**核心原则**：该仓库将成为 ObjectStack 框架的查询相关插件扩展集合，专注于增强查询能力、多数据库驱动程序和开发工具。

---

## 现状分析

### 仓库概览
- **TypeScript 源文件总数**：97 个源文件
- **包数量**：12 个包，分为 4 层
- **当前依赖**：已使用 @objectstack/spec (0.2.0), @objectstack/runtime (0.1.1), @objectstack/objectql (0.1.1)

### 包结构

#### 基础层 (Foundation Layer)
1. **@objectql/types** (376KB)
   - 类型定义和接口
   - 当前依赖 @objectstack/spec
   - 包含可能与 @objectstack 重叠的 ObjectQL 特定类型

2. **@objectql/core** (352KB)
   - 主运行时引擎
   - 包括：Repository、Validator、FormulaEngine、App、AI Agent
   - 已从 @objectstack/runtime 和 @objectstack/objectql 导入类型
   - 需要重构以避免重复基础运行时功能

3. **@objectql/platform-node** (132KB)
   - Node.js 平台工具
   - 文件系统集成、YAML 加载、插件管理
   - 使用 @objectstack/spec

#### 驱动层 (9 个驱动)
- **@objectql/driver-sql** (116KB) - PostgreSQL、MySQL、SQLite、SQL Server
- **@objectql/driver-mongo** (92KB) - MongoDB 聚合管道
- **@objectql/driver-memory** (80KB) - 通用内存驱动
- **@objectql/driver-localstorage** (84KB) - 浏览器存储
- **@objectql/driver-fs** (96KB) - 文件系统 JSON 存储
- **@objectql/driver-excel** (120KB) - Excel 文件支持
- **@objectql/driver-redis** (68KB) - Redis 键值存储
- **@objectql/driver-sdk** (76KB) - 远程 HTTP 驱动

#### 运行时层
- **@objectql/server** (288KB) - 带 GraphQL 和 REST 的 HTTP 服务器

#### 工具层
- **@objectql/cli** (256KB) - 命令行界面
- **@objectql/create** (44KB) - 项目脚手架
- **vscode-objectql** (308KB) - VS Code 扩展

---

## 目标架构

### 新定位

```
┌─────────────────────────────────────────────────────────────┐
│                    @objectstack/runtime                      │
│        (核心运行时、基础查询引擎、插件系统)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  ObjectQL 插件生态系统                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 查询引擎扩展  │  │   数据驱动    │  │  开发工具     │      │
│  │              │  │  SQL/Mongo/  │  │  CLI/VSCode  │      │
│  │              │  │   Memory...  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 包转换

| 当前包 | 新角色 | 需要的变更 |
|-------|--------|-----------|
| @objectql/types | 查询类型扩展 | 删除与 @objectstack/types 重叠的部分，仅保留查询特定类型 |
| @objectql/core | 查询引擎插件 | 提取运行时逻辑，保留 Repository/Validator/Formula 作为插件 |
| @objectql/platform-node | 平台适配器插件 | 与 @objectstack 插件加载机制对齐 |
| @objectql/driver-* | 驱动插件 | 实现 @objectstack DriverInterface |
| @objectql/server | 服务器插件 | 扩展 @objectstack/runtime 服务器 |
| @objectql/cli | CLI 插件 | 与 @objectstack 项目配合工作 |
| vscode-objectql | 编辑器扩展 | 引用 @objectstack/spec |

---

## 迁移策略

### 阶段 1：依赖对齐（第 1-2 周）

**目标**：更新所有包以使用最新的 @objectstack/* 版本

**任务**：
1. 更新所有包的 package.json 文件
   ```json
   {
     "peerDependencies": {
       "@objectstack/runtime": "^0.2.0",
       "@objectstack/spec": "^0.2.0",
       "@objectstack/objectql": "^0.2.0"
     }
   }
   ```

2. 运行依赖审计
   ```bash
   pnpm update @objectstack/runtime @objectstack/spec @objectstack/objectql
   pnpm install
   ```

3. 修复 API 更改导致的编译错误

**成功标准**：
- ✅ 所有包成功构建
- ✅ 无重复类型定义
- ✅ 测试通过新依赖

---

### 阶段 2：类型整合（第 2-3 周）

**目标**：消除 @objectql/types 和 @objectstack 之间的类型重复

**任务**：

1. **审计类型重叠**
   - 创建映射文档：ObjectQL 类型 → @objectstack 等效类型
   - 识别要保留的 ObjectQL 特定类型（查询扩展、仓储模式）

2. **重构 @objectql/types**
   ```typescript
   // 之前
   export interface ObjectConfig { ... }
   export interface QueryFilter { ... }
   
   // 之后
   export type { ServiceObject as ObjectConfig } from '@objectstack/spec';
   export interface QueryExtensions {
     // 仅 ObjectQL 特定的查询增强
   }
   ```

3. **更新整个代码库的导入**
   - 在适用的地方用 `@objectstack/spec` 替换 `@objectql/types` 导入
   - 使用查找/替换并验证

**成功标准**：
- ✅ @objectql/types 仅导出 ObjectQL 特定扩展
- ✅ 无重复接口
- ✅ 所有包编译和测试通过

---

### 阶段 3：核心引擎重构（第 3-5 周）

**目标**：将 @objectql/core 转换为 @objectstack/runtime 的插件

**当前核心组件**：
- `app.ts` - 主 ObjectQL 应用类
- `repository.ts` - CRUD 操作包装器
- `validator.ts` - 验证引擎
- `formula-engine.ts` - 公式计算
- `ai-agent.ts` - AI 集成
- `hook.ts` - 生命周期钩子
- `action.ts` - 自定义操作

**重构计划**：

1. **App.ts → 插件注册**
   ```typescript
   // 之前：独立应用
   export class ObjectQL implements IObjectQL {
     constructor(config: ObjectQLConfig) { ... }
   }
   
   // 之后：ObjectStack 插件
   import { ObjectStackKernel, Plugin } from '@objectstack/runtime';
   
   export class ObjectQLPlugin implements Plugin {
     name = '@objectql/query-extensions';
     
     install(kernel: ObjectStackKernel) {
       // 注册仓储模式
       // 注册验证器
       // 注册公式引擎
     }
   }
   ```

2. **仓储模式作为插件**
   - 将 Repository 模式保留为 ObjectQL 增强
   - 在 @objectstack/runtime 中注册为中间件
   - 保持 API 兼容性

3. **验证器作为插件**
   - 与 @objectstack 验证系统集成
   - 保留 ObjectQL 特定验证规则

4. **公式引擎作为插件**
   - 注册为 @objectstack 公式提供者
   - 保持与现有公式的兼容性

**成功标准**：
- ✅ ObjectQL 作为 @objectstack/runtime 的插件工作
- ✅ 通过兼容层维护现有 API
- ✅ 所有核心功能可通过插件系统访问

---

### 阶段 4：驱动迁移（第 5-7 周）

**目标**：确保所有驱动实现 @objectstack DriverInterface

**每个驱动的迁移**：

1. **SQL 驱动**
   ```typescript
   // 实现标准接口
   import { DriverInterface, QueryAST } from '@objectstack/spec';
   
   export class SQLDriver implements DriverInterface {
     async execute(ast: QueryAST): Promise<any> {
       // 使用 @objectstack/objectql 进行 AST 解析
       // 保留 Knex 作为实现细节
     }
   }
   ```

2. **针对 @objectstack/objectql 测试**
   - 确保查询 AST 兼容性
   - 验证所有 CRUD 操作
   - 测试事务和高级查询

3. **文档更新**
   - 展示驱动与 @objectstack/runtime 的使用
   - 提供迁移示例

**优先级顺序**：
1. SQL（最常用）
2. Memory（测试）
3. MongoDB
4. SDK（远程）
5. 其他（LocalStorage、FS、Excel、Redis）

**成功标准**：
- ✅ 每个驱动通过 @objectstack 兼容性测试
- ✅ 驱动与 @objectstack/objectql 查询引擎一起工作
- ✅ 现有驱动 API 无破坏性更改

---

### 阶段 5：运行时和工具更新（第 7-8 周）

**目标**：更新运行时和开发工具以集成 @objectstack

**@objectql/server**：
1. 扩展 @objectstack/runtime 服务器适配器
2. 保留 GraphQL 和 REST 作为插件层
3. 更新示例应用以使用新架构

**@objectql/cli**：
1. 添加 @objectstack 项目检测
2. 更新脚手架模板
3. 添加迁移命令：`objectql migrate to-objectstack`

**VSCode 扩展**：
1. 更新 JSON 架构以引用 @objectstack/spec
2. 为 @objectstack + ObjectQL 插件添加 IntelliSense
3. 更新代码片段

**成功标准**：
- ✅ 服务器在 @objectstack/runtime 上运行
- ✅ CLI 创建 @objectstack 兼容项目
- ✅ VSCode 扩展提供完整支持

---

### 阶段 6：文档和示例（第 8-9 周）

**目标**：完成插件架构的文档

**文档更新**：

1. **README.md**
   ```markdown
   # ObjectQL - ObjectStack 的查询插件生态系统
   
   ObjectQL 为 @objectstack/runtime 框架提供高级查询功能、
   多数据库驱动程序和开发工具作为插件。
   ```

2. **迁移指南** (MIGRATION_GUIDE.md)
   - 为现有 ObjectQL 用户提供分步指南
   - 之前/之后的代码示例
   - 破坏性更改和解决方法

3. **插件开发指南**
   - 如何创建 ObjectQL 插件
   - 驱动开发指南
   - 与 @objectstack 集成

**示例更新**：
1. 更新所有示例以使用 @objectstack/runtime
2. 展示 ObjectQL 作为插件扩展
3. 演示驱动使用

**成功标准**：
- ✅ 所有文档反映插件架构
- ✅ 示例与 @objectstack/runtime 一起工作
- ✅ 迁移指南经实际用户测试

---

### 阶段 7：测试和验证（第 9-10 周）

**目标**：新架构的全面测试

**测试类别**：

1. **集成测试**
   ```typescript
   describe('@objectstack/runtime + ObjectQL', () => {
     test('加载 ObjectQL 插件', async () => {
       const kernel = new ObjectStackKernel();
       kernel.use(new ObjectQLPlugin());
       await kernel.init();
       // 验证插件已加载
     });
   });
   ```

2. **驱动兼容性测试**
   - 使用 @objectstack/objectql 测试每个驱动
   - 验证查询 AST 转换
   - 性能基准

3. **向后兼容性测试**
   - 确保现有代码通过兼容层工作
   - 记录破坏性更改

4. **端到端测试**
   - 完整的应用场景
   - 多驱动场景
   - 实际用例

**成功标准**：
- ✅ 100% 的现有测试通过
- ✅ 新的集成测试通过
- ✅ 性能在先前版本的 5% 以内

---

### 阶段 8：发布和版本（第 10-11 周）

**目标**：发布基于插件的架构

**预发布**：
1. 更新所有包版本到 4.0.0（主版本升级）
2. 更新所有包的 CHANGELOG.md
3. 为独立使用创建弃用通知
4. 准备迁移工具

**发布流程**：
1. 发布 @objectql/types@4.0.0
2. 发布 @objectql/core@4.0.0
3. 发布所有 drivers@4.0.0
4. 发布 tools@4.0.0
5. 更新文档网站

**发布后**：
1. 监控 GitHub issues
2. 提供迁移支持
3. 更新示例和模板

**成功标准**：
- ✅ 所有包成功发布
- ✅ 第一周无关键错误
- ✅ 社区积极反馈

---

## 风险评估和缓解

### 高风险领域

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 破坏现有应用 | 高 | 维护兼容层，提供迁移工具 |
| @objectstack API 更改 | 高 | 使用 peer dependencies，版本固定 |
| 驱动不兼容 | 中 | 全面测试，分阶段推出 |
| 性能下降 | 中 | 基准测试，优化通道 |
| 文档缺口 | 低 | 用户测试，反馈循环 |

### 回滚计划

如果出现关键问题：
1. 维护 v3.x 分支 6 个月
2. 提供自动回滚工具
3. 与社区明确沟通

---

## 成功指标

### 技术指标
- ✅ 所有 97 个源文件成功迁移
- ✅ 零重复类型定义
- ✅ 所有 9 个驱动实现 DriverInterface
- ✅ 测试覆盖率保持在 80%+
- ✅ 构建时间 < 30 秒
- ✅ 性能在 v3.x 的 5% 以内

### 社区指标
- ✅ 50+ 用户使用迁移指南
- ✅ 第一个月 < 5 个关键错误
- ✅ 早期采用者的积极反馈
- ✅ 3+ 个社区插件贡献

---

## 时间表总结

| 阶段 | 持续时间 | 交付成果 |
|------|---------|----------|
| 1. 依赖对齐 | 2 周 | 更新的依赖项，干净的构建 |
| 2. 类型整合 | 1 周 | 去重的类型 |
| 3. 核心重构 | 2 周 | 基于插件的核心 |
| 4. 驱动迁移 | 2 周 | 兼容的驱动 |
| 5. 运行时和工具 | 1 周 | 更新的工具 |
| 6. 文档 | 1 周 | 完整的文档 |
| 7. 测试 | 1 周 | 验证的系统 |
| 8. 发布 | 1 周 | 发布 v4.0 |

**总持续时间**：11 周

---

## 下一步

1. **立即**（本周）：
   - [ ] 审查并批准此迁移计划
   - [ ] 设置项目跟踪（GitHub Projects/Issues）
   - [ ] 创建功能分支：`feature/objectstack-migration`

2. **阶段 1 启动**（下周）：
   - [ ] 更新根 package.json
   - [ ] 更新所有工作区依赖项
   - [ ] 运行初始构建和测试验证

3. **沟通**：
   - [ ] 向社区宣布迁移计划
   - [ ] 创建 RFC 以获取反馈
   - [ ] 设置迁移支持渠道

---

## 附录

### 关键 @objectstack 包

- **@objectstack/runtime** (0.2.0): 核心运行时和插件系统
- **@objectstack/spec** (0.2.0): 协议规范和类型
- **@objectstack/objectql** (0.2.0): 基础查询引擎
- **@objectstack/types** (0.2.0): TypeScript 类型定义

### 参考链接

- ObjectStack Runtime: https://www.npmjs.com/package/@objectstack/runtime
- ObjectStack Spec: https://www.npmjs.com/package/@objectstack/spec
- ObjectStack ObjectQL: https://www.npmjs.com/package/@objectstack/objectql

### 联系与支持

有关此迁移的问题：
- GitHub Issues: https://github.com/objectstack-ai/objectql/issues
- 讨论：在 discussions 标签中创建 RFC
- 电子邮件：maintainers@objectstack.com（如果可用）

---

**文档版本**：1.0  
**最后更新**：2026-01-21  
**状态**：草稿 - 等待审查
