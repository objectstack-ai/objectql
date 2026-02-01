# ObjectQL 微内核与插件架构开发计划
# ObjectQL Microkernel & Plugin Architecture Development Plan

**日期**: 2026年2月1日  
**版本**: 1.0  
**状态**: ✅ 软件包扫描完成 - 规划阶段

---

## 执行摘要

本文档提供 ObjectQL 单体仓库中所有软件包的全面扫描，分析它们与 ObjectStack 标准协议的符合性，并概述增强微内核和基于插件架构的完整开发计划。

**关键发现：**
- ✅ 33个软件包全部已清点和分类
- ✅ 微内核架构已经建立（RuntimePlugin接口）
- ✅ 8个数据驱动程序全部功能正常
- ✅ 3个协议插件（GraphQL、OData、JSON-RPC）
- ✅ 4个基础插件（Security、Validator、Formula、AI Agent）
- ⚠️ 需要改进：插件依赖解析、TCK应用、文档完善

---

## 一、软件包清单（33个软件包）

### 1. 基础层（Foundation Layer）- 7个包

| 软件包 | 版本 | 状态 | 说明 |
|-------|------|------|------|
| @objectql/types | 4.0.2 | ✅ 生产就绪 | 纯TypeScript接口定义（零依赖） |
| @objectql/core | 4.0.2 | ✅ 生产就绪 | 运行时引擎与插件架构 |
| @objectql/platform-node | 4.0.2 | ✅ 生产就绪 | Node.js平台工具 |
| @objectql/plugin-security | 4.0.2 | ✅ 生产就绪 | RBAC、FLS、RLS安全插件 |
| @objectql/plugin-validator | 4.0.2 | ✅ 生产就绪 | 数据验证引擎 |
| @objectql/plugin-formula | 4.0.2 | ✅ 生产就绪 | 公式计算引擎 |
| @objectql/plugin-ai-agent | 4.0.2 | ✅ 生产就绪 | AI代码生成 |

### 2. 驱动层（Driver Layer）- 8个包

| 软件包 | 版本 | 状态 | 支持数据库 |
|-------|------|------|----------|
| @objectql/driver-memory | 4.0.2 | ✅ 生产就绪 | 内存（Mingo引擎） |
| @objectql/driver-sql | 4.0.2 | ✅ 生产就绪 | PostgreSQL、MySQL、SQLite |
| @objectql/driver-mongo | 4.0.2 | ✅ 生产就绪 | MongoDB |
| @objectql/driver-redis | 4.1.0 | ✅ 生产就绪 | Redis（新增distinct/aggregate） |
| @objectql/driver-excel | 4.0.2 | ✅ 生产就绪 | Excel文件 (.xlsx) |
| @objectql/driver-fs | 4.0.2 | ✅ 生产就绪 | JSON文件存储 |
| @objectql/driver-localstorage | 4.0.2 | ✅ 生产就绪 | 浏览器LocalStorage |
| @objectql/sdk | 4.0.2 | ✅ 生产就绪 | 远程HTTP驱动 |

### 3. 协议层（Protocol Layer）- 3个包

| 软件包 | 版本 | 符合度 | 缺失功能 |
|-------|------|--------|---------|
| @objectql/protocol-graphql | 4.0.2 | 85% | 订阅、联邦 |
| @objectql/protocol-odata-v4 | 4.0.2 | 80% | $expand、$batch |
| @objectql/protocol-json-rpc | 4.0.2 | 90% | 高级功能 |

### 4. 运行时层（Runtime Layer）- 1个包

| 软件包 | 版本 | 状态 | 功能 |
|-------|------|------|------|
| @objectql/server | 4.0.2 | ✅ 95% | HTTP服务器、REST API |

### 5. 工具层（Tools Layer）- 4个包

| 软件包 | 版本 | 状态 | 功能 |
|-------|------|------|------|
| @objectql/cli | 4.0.2 | ✅ 完整 | 命令行工具 |
| @objectql/create | 4.0.2 | ✅ 完整 | 项目脚手架 |
| vscode-objectql | 4.0.2 | ✅ 90% | VS Code扩展 |
| @objectql/driver-tck | 4.0.0 | ✅ 新增 | 驱动兼容性测试 |

### 6. 示例（Examples）- 8个包

- ✅ 快速开始：hello-world
- ✅ 展示案例：project-tracker、enterprise-erp
- ✅ 集成示例：multi-protocol-server、browser、express-server
- ✅ 驱动示例：excel-demo、fs-demo

---

## 二、微内核架构分析

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                     ObjectKernel                              │
│                    (微内核核心)                                 │
├──────────────────────────────────────────────────────────────┤
│  • 元数据注册表      (Schema Management)                       │
│  • 钩子管理器        (Lifecycle Events)                        │
│  • 操作管理器        (Custom Operations)                       │
│  • 插件加载器        (Dynamic Loading)                         │
│  • 上下文管理        (Request Context)                         │
│  • 驱动协调器        (Data Source Coordination)               │
└───────────────────┬──────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   ┌────▼─────┐         ┌──────▼───────┐
   │ 插件层   │         │   驱动层     │
   └────┬─────┘         └──────┬───────┘
        │                      │
        └──────────┬───────────┘
                   │
            ┌──────▼──────┐
            │  可扩展插件  │
            └─────────────┘
```

### 2.2 插件生命周期

```typescript
interface RuntimePlugin {
  name: string;                    // 唯一标识符
  version?: string;                // 语义化版本
  
  // 阶段1：安装（内核初始化时）
  install?(ctx: RuntimeContext): Promise<void>;
  
  // 阶段2：启动（内核启动时）
  onStart?(ctx: RuntimeContext): Promise<void>;
  
  // 阶段3：停止（内核关闭时）
  onStop?(ctx: RuntimeContext): Promise<void>;
}
```

**生命周期顺序：**
1. **install()** - 注册钩子、加载配置、设置元数据
2. **onStart()** - 启动服务器、连接外部服务
3. **onStop()** - 清理资源、断开连接

### 2.3 钩子系统

| 钩子名称 | 时机 | 用途 | 示例 |
|---------|------|------|------|
| **beforeQuery** | 查询前 | 查询修改、安全检查 | RLS过滤 |
| **afterQuery** | 查询后 | 结果转换、字段级安全 | 字段遮蔽 |
| **beforeMutation** | 修改前 | 权限检查、验证 | RBAC强制 |
| **afterMutation** | 修改后 | 副作用、审计日志 | 通知 |

---

## 三、协议合规性评估

### 3.1 与 @objectstack/spec 协议对照

| 规范领域 | 符合度 | 状态 | 备注 |
|---------|-------|------|------|
| 对象定义架构 | 95% | ✅ 优秀 | 文件名推断对象名（v4.0+） |
| 字段类型系统 | 100% | ✅ 完整 | 20+字段类型全部实现 |
| 查询AST协议 | 100% | ✅ 完整 | where、orderBy、offset、limit |
| 验证架构 | 100% | ✅ 完整 | 所有验证类型已实现 |
| 权限架构 | 100% | ✅ 完整 | RBAC、FLS、RLS完整实现 |
| 钩子/操作协议 | 100% | ✅ 完整 | 所有生命周期钩子支持 |
| 驱动接口 | 100% | ✅ 完整 | v4.0接口标准化 |
| 插件接口 | 100% | ✅ 完整 | RuntimePlugin标准化 |
| 错误处理 | 85% | ⚠️ 良好 | ObjectQLError已实现 |
| 事务协议 | 70% | ⚠️ 部分 | SQL驱动支持，需标准化 |

### 3.2 分类合规性

#### A. 数据定义层 - 98%
- ✅ YAML优先的元数据
- ✅ 完整的字段类型覆盖
- ✅ 关系定义（lookup、master_detail）
- ⚠️ 缺失：组合字段类型、字段级加密

#### B. 查询执行层 - 95%
- ✅ QueryAST在所有驱动中全面实现
- ✅ FilterCondition支持20+操作符
- ✅ 聚合支持（count、sum、avg、min、max）
- ⚠️ 缺失：全文搜索标准化、地理空间查询

#### C. 验证与业务逻辑层 - 100%
- ✅ 字段级验证
- ✅ 跨字段验证
- ✅ 状态机验证
- ✅ 业务规则验证
- ✅ 唯一性验证
- ✅ 多语言错误消息

#### D. 安全与权限层 - 100%
- ✅ 基于角色的访问控制（RBAC）
- ✅ 字段级安全（FLS）
- ✅ 行级安全（RLS）
- ✅ 权限预编译和缓存
- ✅ AST级查询修改
- ✅ 审计日志

#### E. 运行时与插件层 - 95%
- ✅ 标准化的RuntimePlugin接口
- ✅ 插件生命周期管理
- ✅ 钩子系统
- ⚠️ 缺失：插件依赖解析、版本兼容性检查

---

## 四、微内核设计原则

### 4.1 核心哲学

1. **最小核心**
   - 内核只处理：元数据注册表、钩子调度、插件生命周期
   - 所有业务逻辑存在于插件中
   - 核心对特定功能无感知

2. **消息传递架构**
   - 插件通过钩子通信（事件驱动）
   - 没有直接的插件间依赖
   - Context对象携带请求状态

3. **协议驱动**
   - 每个插件实现`RuntimePlugin`接口
   - 驱动实现`DriverInterface`
   - 协议实现协议特定标准 + `RuntimePlugin`

4. **关注点分离**
   ```
   类型层    → 定义契约（零逻辑）
   核心层    → 编排插件（无业务逻辑）
   插件层    → 实现功能（所有业务逻辑）
   驱动层    → 数据访问（数据库特定逻辑）
   协议层    → API适配器（协议特定逻辑）
   ```

5. **依赖倒置**
   - 高层模块（核心）依赖抽象（类型）
   - 低层模块（插件）依赖抽象（类型）
   - 无实现依赖

### 4.2 插件分类

| 类别 | 用途 | 示例 | 接口 |
|------|------|------|------|
| **基础插件** | 核心功能 | Security、Validator、Formula | RuntimePlugin |
| **协议插件** | API适配器 | GraphQL、OData、JSON-RPC | RuntimePlugin + 协议特定 |
| **数据驱动** | 数据访问 | SQL、MongoDB、Redis | DriverInterface |
| **工具插件** | 开发工具 | CLI、VS Code扩展 | 自定义接口 |
| **业务插件** | 领域逻辑 | CRM、ERP、行业特定 | RuntimePlugin |

---

## 五、开发路线图

### 阶段1：核心微内核增强 - 2026年Q1

**任务：**
- [ ] 插件依赖解析
- [ ] 版本兼容性检查
- [ ] 插件注册表增强
- [ ] 热插件重载（开发模式）

**交付成果：**
- 增强的`PluginLoader`类
- 插件依赖解析器工具
- 热重载开发模式
- 文档："高级插件开发指南"

**验收标准：**
- 插件可以声明依赖，加载顺序被遵守
- 启动时检测版本冲突
- 开发模式支持热重载，延迟<1秒

---

### 阶段2：驱动层标准化 - 2026年Q1-Q2

**任务：**
- [ ] 将TCK应用于所有驱动
  - Memory驱动（参考实现）
  - SQL驱动
  - MongoDB驱动
  - Excel、FS、LocalStorage、Redis驱动

- [ ] 共享驱动工具包
  - 创建`@objectql/driver-utils`
  - 提取常见的QueryAST解析逻辑
  - 提取常见的FilterCondition评估
  - 提取常见的错误处理

- [ ] 事务协议标准化
  - 定义标准事务接口
  - 在所有支持的驱动中实现事务支持
  - 添加事务TCK测试

**交付成果：**
- 所有驱动通过TCK测试（每个30+测试）
- `@objectql/driver-utils`包创建
- 事务协议在`@objectstack/spec`中记录

**验收标准：**
- 所有驱动100% TCK通过率
- 驱动中的代码重复减少>50%
- SQL、MongoDB驱动中的事务支持

---

### 阶段3：协议层增强 - 2026年Q2

**任务：**

#### 3.1 协议TCK创建
- [ ] 设计协议测试契约
- [ ] 定义必需操作（CRUD、元数据、错误处理）
- [ ] 创建标准化测试套件
- [ ] 添加性能基准

#### 3.2 GraphQL协议增强
- [ ] WebSocket订阅
  - 完整实现GraphQL订阅
  - 实时更改通知
  - 连接生命周期管理
  
- [ ] 联邦支持
  - Apollo Federation兼容性
  - 子图架构生成

#### 3.3 OData V4协议增强
- [ ] $expand实现
  - 嵌套实体扩展
  - 多级扩展
  
- [ ] $batch操作
  - 批量读操作
  - 批量写操作
  - 批量中的事务支持

**交付成果：**
- 协议TCK包（`@objectql/protocol-tck`）
- GraphQL协议升级至95%合规性
- OData V4协议升级至95%合规性

**验收标准：**
- 所有协议通过协议TCK
- GraphQL订阅在生产中工作
- OData V4支持$expand和$batch

---

### 阶段4：插件生态系统扩展 - 2026年Q2-Q3

**任务：**

#### 4.1 新基础插件
- [ ] 缓存插件（`@objectql/plugin-cache`）
- [ ] 监控插件（`@objectql/plugin-monitoring`）
- [ ] 速率限制插件（`@objectql/plugin-rate-limit`）
- [ ] 审计跟踪插件（`@objectql/plugin-audit`）

#### 4.2 新协议插件
- [ ] gRPC协议插件（`@objectql/protocol-grpc`）
- [ ] REST API 2.0插件（`@objectql/protocol-rest-v2`）

#### 4.3 新数据驱动
- [ ] Elasticsearch驱动（`@objectql/driver-elasticsearch`）
- [ ] Neo4j驱动（`@objectql/driver-neo4j`）
- [ ] DynamoDB驱动（`@objectql/driver-dynamodb`）

**交付成果：**
- 4个新基础插件
- 2个新协议插件
- 3个新数据库驱动
- 每个的文档和示例

**验收标准：**
- 所有插件实现`RuntimePlugin`
- 所有插件测试覆盖率>80%
- 所有驱动通过TCK
- 所有协议通过协议TCK

---

### 阶段5：开发体验增强 - 2026年Q3

**任务：**

#### 5.1 插件开发工具包（PDK）
- [ ] 创建`@objectql/pdk`包
  - 插件脚手架CLI
  - 插件测试工具
  - 插件调试工具
  - 插件模板生成器

- [ ] 插件开发模板
  - 基础插件模板
  - 协议插件模板
  - 驱动插件模板
  - 业务插件模板

- [ ] 插件市场后端
  - 插件注册服务
  - 插件发现API
  - 版本管理

#### 5.2 增强文档
- [ ] 插件开发指南
  - 分步教程
  - 最佳实践
  - 常见模式
  
- [ ] API参考生成
  - 从TypeScript类型自动生成
  - 交互式API浏览器
  
- [ ] 视频教程
  - "构建您的第一个插件"系列
  - "微内核架构深度解析"
  - "高级钩子模式"

**交付成果：**
- `@objectql/pdk`包
- 插件模板仓库
- 插件市场（alpha版本）
- 全面的插件开发文档
- 10+视频教程

**验收标准：**
- 开发人员可以在<30分钟内创建插件
- PDK支持所有插件类型
- 文档覆盖100%的插件API

---

### 阶段6：生产就绪与性能 - 2026年Q4

**任务：**

#### 6.1 性能优化
- [ ] 插件加载性能
  - 延迟插件加载
  - 插件预编译
  - 启动时间优化（目标：<500ms）

- [ ] 钩子性能
  - 钩子执行分析
  - 钩子优先级优化
  - 并行钩子执行（在安全的情况下）

- [ ] 查询性能
  - 查询计划缓存
  - 查询优化规则
  - 基准套件（100k、1M、10M记录）

#### 6.2 生产监控与可观察性
- [ ] 分布式追踪
  - OpenTelemetry集成
  - 追踪上下文传播
  
- [ ] 健康检查
  - 插件健康端点
  - 驱动健康检查
  
- [ ] 错误报告
  - Sentry集成
  - 错误聚合

**交付成果：**
- 性能基准报告
- 可观察性堆栈（Prometheus + Grafana + Jaeger）
- 生产部署指南

**验收标准：**
- 内核启动时间<500ms（10个插件）
- 查询延迟<10ms（内存驱动，简单查询）
- 支持10k请求/秒（启用缓存）

---

## 六、插件开发指南

### 6.1 插件结构

**推荐目录结构：**
```
@myorg/my-plugin/
├── src/
│   ├── index.ts              # 插件入口点
│   ├── plugin.ts             # RuntimePlugin实现
│   ├── config.ts             # 配置架构
│   ├── hooks/                # 钩子实现
│   ├── utils/                # 工具函数
│   └── types/                # TypeScript类型
├── test/
│   ├── unit/                 # 单元测试
│   └── integration/          # 集成测试
├── examples/                 # 使用示例
├── docs/                     # 文档
│   ├── README.md
│   ├── API.md
│   └── CHANGELOG.md
├── package.json
├── tsconfig.json
└── LICENSE
```

### 6.2 插件实现模板

```typescript
import { RuntimePlugin, RuntimeContext, ObjectQLError } from '@objectql/types';

export class MyPlugin implements RuntimePlugin {
  name = '@myorg/my-plugin';
  version = '1.0.0';
  
  private config: any;
  
  async install(ctx: RuntimeContext): Promise<void> {
    // 1. 验证配置
    // 2. 检查依赖
    // 3. 注册钩子
    ctx.engine.hooks.register('beforeQuery', this.onBeforeQuery.bind(this));
    
    console.log(`[${this.name}] Plugin installed`);
  }
  
  async onStart(ctx: RuntimeContext): Promise<void> {
    // 1. 连接外部服务
    // 2. 启动后台进程
    console.log(`[${this.name}] Plugin started`);
  }
  
  async onStop(ctx: RuntimeContext): Promise<void> {
    // 清理资源
    console.log(`[${this.name}] Plugin stopped`);
  }
  
  private async onBeforeQuery(context: any): Promise<void> {
    // 钩子逻辑
  }
}

export default MyPlugin;
```

### 6.3 插件开发契约

**所有插件必须（MUST）：**
1. ✅ 实现`RuntimePlugin`接口
2. ✅ 有唯一名称遵循`@scope/package`约定
3. ✅ 使用语义化版本
4. ✅ 在`install()`阶段注册所有钩子
5. ✅ 在`onStart()`阶段启动服务
6. ✅ 在`onStop()`阶段清理资源
7. ✅ 优雅地处理错误（使用`ObjectQLError`）
8. ✅ 提供TypeScript类型
9. ✅ 包含单元测试
10. ✅ 记录钩子注册和副作用

**所有插件应该（SHOULD）：**
1. ✅ 声明依赖（package.json中的peerDependencies）
2. ✅ 在`install()`中验证兼容性
3. ✅ 提供配置架构
4. ✅ 支持国际化
5. ✅ 包含集成测试
6. ✅ 提供示例

---

## 七、测试与验证标准

### 7.1 插件测试要求

**所有插件必须有：**
- ✅ 单元测试（>80%覆盖率）
- ✅ 集成测试
- ✅ 生命周期测试（install/start/stop）
- ✅ 钩子执行测试
- ✅ 错误处理测试

**推荐测试工具：**
- 单元测试：Vitest或Jest
- 集成测试：Supertest（用于协议插件）
- 类型测试：tsd
- 覆盖率：c8或nyc

### 7.2 驱动测试要求（TCK）

**所有驱动必须通过：**
- ✅ 核心CRUD操作（7个测试）
- ✅ 查询操作（11个测试）
- ✅ 边缘情况和错误处理（5个测试）

**可选TCK部分：**
- Distinct操作（2个测试）
- 聚合操作（2个测试）
- 批量操作（3个测试）
- 事务操作（5个测试）

### 7.3 性能测试标准

**性能目标：**
| 指标 | 目标 | 测量 |
|------|------|------|
| 内核启动 | <500ms | 10个插件 |
| 简单查询（内存） | <10ms | 单记录检索 |
| 钩子开销 | <1ms | 每个钩子执行 |
| 内存占用 | <100MB | 基础内核+5个插件 |
| 吞吐量 | 10k req/s | 启用缓存 |

---

## 八、成功指标

### 8.1 采用指标

| 指标 | 当前 | 目标（2026年Q4） |
|------|------|-----------------|
| 总包数 | 33 | 50+ |
| 基础插件 | 4 | 8+ |
| 协议插件 | 3 | 5+ |
| 数据库驱动 | 8 | 12+ |
| 社区插件 | 0 | 10+ |
| NPM周下载量 | 500 | 5,000+ |

### 8.2 质量指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 测试覆盖率 | 75% | 90%+ |
| TCK通过率（驱动） | 12.5% | 100% |
| 协议合规性 | 85%平均 | 95%+平均 |
| 文档覆盖率 | 60% | 100% |
| 零安全漏洞 | ✅ | ✅ |

### 8.3 性能指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 内核启动时间 | ~200ms | <500ms（10个插件） |
| 查询延迟（内存） | ~5ms | <10ms |
| 吞吐量 | 未知 | 10k req/s |
| 内存占用 | ~50MB | <100MB（基础+5插件） |

---

## 九、下一步行动

### 立即行动：
1. 审查并批准此开发计划
2. 将团队分配到每个阶段
3. 设置项目跟踪（GitHub Projects）
4. 为阶段1任务创建详细工单
5. 安排启动会议

### 第1周目标：
- [ ] 实现`PluginDependencyResolver`
- [ ] 添加插件版本兼容性检查
- [ ] 创建插件依赖文档
- [ ] 编写新功能的单元测试

### 第1个月目标：
- [ ] 完成阶段1（插件系统增强）
- [ ] 开始阶段2（驱动层标准化）
- [ ] 将TCK应用于3个驱动（Memory、SQL、MongoDB）

---

## 十、结论

### 当前状态总结

**优势：**
- ✅ 扎实的微内核基础（RuntimePlugin接口）
- ✅ 优秀的关注点分离
- ✅ 生产就绪的基础插件
- ✅ 全面的驱动生态系统（8个驱动）
- ✅ 强大的协议层（3个协议）
- ✅ 优秀的开发工具
- ✅ 清晰的依赖图，零循环依赖

**改进领域：**
- ⚠️ 插件依赖解析尚未实现
- ⚠️ TCK尚未应用于所有驱动
- ⚠️ 协议功能不完整
- ⚠️ 缺少插件开发工具包（PDK）
- ⚠️ 有限的插件生态系统

### 战略建议

1. **优先考虑插件系统增强（阶段1）**
2. **完成驱动标准化（阶段2）**
3. **投资插件开发工具包（阶段5）**
4. **构建插件市场（阶段5）**
5. **专注于文档和示例**

---

**文档版本**: 1.0  
**最后更新**: 2026年2月1日  
**作者**: ObjectQL架构团队  
**状态**: ✅ 准备审查

---

**文档结束**
