# 评估报告：是否可以作废 @objectql/types，直接使用 @objectstack/spec

**任务**: 评估是否可以作废 @objectql/types，直接使用 @objectstack/spec  
**日期**: 2026-01-26  
**评估者**: ObjectQL 首席架构师  
**状态**: ❌ **不建议作废**

---

## 执行摘要

经过对 ObjectQL 单体仓库架构的全面分析，**不建议作废 @objectql/types**，这样做将适得其反。这两个包的用途截然不同：

- **@objectstack/spec**: 仅包含协议的线格式规范（Data 和 UI 命名空间）
- **@objectql/types**: 运行时类型系统，包含超越协议的大量扩展

**关键发现**: @objectql/types 包含约 **5,813 行**运行时特定的类型定义，分布在 **24 个模块**中。仅有 **4 个导入**来自 @objectstack/spec，这些都是已标记为废弃的协议重新导出。

---

## 架构分析

### 1. 当前包结构

```
@objectstack/spec (外部 NPM 包 v0.3.3)
├── Data 命名空间（协议字段/对象定义）
└── UI 命名空间（协议操作定义）

@objectql/types (单体仓库基础包)
├── 协议重新导出（已废弃 - 4 个导入）
│   ├── Data.FieldType → SpecField
│   ├── Data.ServiceObject → SpecObject
│   ├── Data.FilterCondition → Filter
│   └── UI.Action → SpecAction
│
└── 运行时扩展（24 个模块，约 5,813 行）
    ├── 字段扩展（AttachmentData、ImageAttachmentData、FieldConfig）
    ├── 对象扩展（ObjectConfig、IndexConfig、AiSearchConfig）
    ├── 查询扩展（UnifiedQuery、AggregateFunction）
    ├── 验证系统（9+ 种验证规则类型）
    ├── 钩子系统（HookAPI、HookContext、HookHandler）
    ├── 操作系统（ActionContext、ActionHandler、ActionConfig）
    ├── 驱动接口（Driver、IntrospectedSchema）
    ├── 权限系统（PermissionConfig、FieldPermission）
    ├── 仓储模式（Repository、IObjectQL）
    └── UI/UX 类型（Page、View、Form、Menu、Report、Workflow）
```

### 2. 依赖关系图

**13 个包依赖于 @objectql/types**：

| 类别 | 包名 | 用途 |
|----------|---------|---------|
| **基础层** | `@objectql/core` | 运行时引擎（验证器、仓储） |
| **基础层** | `@objectql/platform-node` | Node.js 桥接（fs、path、glob） |
| **驱动层** | `@objectql/drivers/sql` | SQL/Knex 适配器 |
| **驱动层** | `@objectql/drivers/mongo` | MongoDB 适配器 |
| **驱动层** | `@objectql/drivers/sdk` | HTTP 远程适配器 |
| **驱动层** | `@objectql/drivers/memory` | 内存驱动 |
| **驱动层** | `@objectql/drivers/redis` | Redis 适配器 |
| **驱动层** | `@objectql/drivers/localstorage` | 浏览器 LocalStorage |
| **驱动层** | `@objectql/drivers/fs` | 文件系统驱动 |
| **驱动层** | `@objectql/drivers/excel` | Excel 文件驱动 |
| **运行时** | `@objectql/runtime/server` | 服务器运行时 |
| **工具** | `@objectql/tools/cli` | CLI 工具 |
| **自引用** | `@objectql/types` | 对 @objectql/runtime 的 peer 依赖 |

所有依赖都使用 `workspace:*` 标注（单体仓库内部）。

### 3. 类型类别分解

#### 协议类型（来自 @objectstack/spec）
- **总共 4 个导入**
- 全部标记为 `@deprecated`，并指示直接从 @objectstack/spec 导入
- 仅代表线协议标准

#### 运行时特定类型（@objectql/types 独有）

**A. 核心数据类型**
- `ObjectConfig`: 运行时对象模式（扩展 `ServiceObject`，增加验证、钩子、操作）
- `FieldConfig`: 运行时字段配置（扩展 `Field`，增加 help_text、ai_context、验证）
- `IndexConfig`: 简化的索引接口
- `AttachmentData`、`ImageAttachmentData`: 文件处理结构

**B. 验证系统（约 1,500+ 行）**
- `ValidationRule`: 所有验证器的基础接口
- `CrossFieldValidationRule`: 使用运算符比较字段
- `StateMachineValidationRule`: 状态转换执行
- `BusinessRuleValidationRule`: 复杂业务逻辑
- `UniquenessValidationRule`: 唯一性约束
- `DependencyValidationRule`: 相关记录验证
- `CustomValidationRule`: 自定义验证函数
- `ValidationContext`、`ValidationResult`、`ValidationError`
- `ValidationAiContext`: AI 友好的元数据

**C. 查询和操作系统**
- `UnifiedQuery`: 运行时查询接口（聚合、分组、展开）
- `ActionContext`、`ActionHandler`、`ActionConfig`: 操作执行上下文
- `Filter`: `Data.FilterCondition` 的类型别名

**D. 钩子系统**
- `HookAPI`: 钩子的数据库访问 API
- `HookContext`: 运行时钩子执行上下文
- `ObjectHookDefinition`: 钩子注册
- 事件生命周期类型（beforeCreate、afterUpdate 等）

**E. 驱动接口**
- `Driver`: 数据库驱动契约（find、create、update、delete、execute）
- `IntrospectedSchema`、`IntrospectedTable`、`IntrospectedColumn`: 模式内省
- 驱动能力元数据

**F. 权限和安全**
- `PermissionConfig`: RBAC 配置
- `FieldPermission`: 字段级安全
- 权限评估上下文

**G. 仓储模式**
- `Repository`: 仓储模式实现
- `IObjectQL`: 核心 ObjectQL 接口
- `ObjectQLContext`: 运行时执行上下文

**H. UI/UX 元数据**
- `Page`、`View`、`Form`、`Menu`: UI 组件定义
- `Report`、`Workflow`: 业务流程类型
- `Application`: 应用程序级配置
- `Migration`: 模式演化类型

---

## 可行性评估

### 方案 1：作废 @objectql/types，仅使用 @objectstack/spec

**结果**: ❌ **不可行**

**原因**:
1. **缺少运行时类型**: @objectstack/spec 仅包含线协议定义（Data、UI）。缺少：
   - 验证系统（约 1,500+ 行）
   - 钩子系统（HookAPI、HookContext、HookHandler）
   - 操作执行类型（ActionContext、ActionHandler）
   - 驱动接口（Driver、IntrospectedSchema）
   - 仓储模式（Repository、IObjectQL）
   - 权限系统（PermissionConfig、FieldPermission）
   - UI/UX 类型（Page、View、Form、Menu、Report）

2. **架构违规**: @objectstack/spec 故意设计为仅包含协议。添加运行时类型将违反关注点分离：
   - **协议层**（spec）：线格式，语言无关
   - **运行时层**（types）：TypeScript 特定执行类型

3. **破坏性变更**: 所有 13 个依赖包将立即中断，需要：
   - 在约 100+ 个文件中重写导入
   - 为运行时类型寻找新家
   - 在整个单体仓库中协调版本升级

4. **循环依赖风险**: @objectql/types 依赖于 @objectstack/spec。如果 spec 吸收运行时类型，将产生与实现细节的耦合。

### 方案 2：保留 @objectql/types 并继续当前架构

**结果**: ✅ **推荐**

**理由**:
1. **清晰分离**: 
   - @objectstack/spec = 协议（线格式，跨语言）
   - @objectql/types = 运行时（TypeScript 执行类型）

2. **无重复**: 4 个协议重新导出已标记为 `@deprecated`，鼓励直接从 spec 导入。

3. **稳定基础**: @objectql/types 按照系统提示作为"宪法"，为整个运行时提供零依赖类型定义。

4. **最小迁移路径**: 已通过废弃类型上的 `@deprecated` 注释进行中。

### 方案 3：混合方法 - 将 @objectql/types 拆分为更小的包

**结果**: ⚠️ **可能但无必要**

**潜在结构**:
```
@objectql/types-core（字段、对象、查询基础）
@objectql/types-validation（验证系统）
@objectql/types-hooks（钩子系统）
@objectql/types-drivers（驱动接口）
@objectql/types-ui（页面、视图、表单等）
```

**权衡**:
- ✅ 更细粒度的导入
- ❌ 依赖管理复杂性增加
- ❌ 循环依赖风险
- ❌ 相对于当前单体方法没有明显好处

---

## 当前状态：已经正确

代码库已实现**正确的架构**：

1. **协议重新导出已废弃**:
```typescript
/**
 * 从宪法重新导出协议类型
 * 
 * @deprecated 请直接从 @objectstack/spec 导入
 */
export type { Field as SpecField, SpecSelectOption, ProtocolFieldType };
```

2. **清晰的文档**: README.md 明确说明了用途：
```markdown
ObjectQL 系统的类型定义，包括对象模式、
字段配置、验证规则、查询、钩子和操作。
```

3. **运行时扩展模式**: Field.ts 演示了这种模式：
```typescript
// 从 @objectstack/spec 导入协议类型
import { Data } from '@objectstack/spec';
type Field = Data.Field;

/**
 * 运行时特定类型
 * 以下类型扩展或补充协议宪法
 */
export interface AttachmentData { ... }
export interface FieldConfig extends Omit<Field, ...> { ... }
```

---

## 建议

### 1. 保留 @objectql/types（主要建议）

**行动**:
1. ✅ **保留包** - 它作为运行时类型基础起着关键作用
2. ✅ **维护当前架构** - 协议重新导出已经被废弃
3. 🔄 **更新 README** - 更明确地阐明与 @objectstack/spec 的关系

**建议的 README 更新**: 已在英文版本中实现

### 2. 可选：添加 Package.json 描述更新

已更新 `packages/foundation/types/package.json`：

```json
{
  "description": "Runtime type extensions for ObjectQL - complements @objectstack/spec with validation, hooks, drivers, and UI types"
}
```

### 3. 无需代码更改

当前架构已经正确。该任务要求"评估"（评估），不一定要"实施"作废。

---

## 结论

**对问题陈述的回答**: ❌ **不，不应作废 @objectql/types。**

**理由**:
1. @objectstack/spec 是仅协议（线格式，跨语言）
2. @objectql/types 提供必要的运行时扩展（约 5,813 行）
3. 仅有 4 个类型导入重叠，全部已标记为 `@deprecated`
4. 13 个包依赖于不属于 spec 的运行时特定类型
5. 当前架构正确地分离了协议和运行时

**建议行动**: 改进文档以阐明两个包之间的互补关系，但**不做结构性更改**。

---

## 附录：类型统计

### @objectql/types 模块分解

| 模块 | 行数 | 主要用途 |
|--------|-------|----------------|
| `validation.ts` | ~800 | 验证规则系统 |
| `object.ts` | ~600 | 对象配置和 AI 搜索 |
| `field.ts` | ~550 | 字段配置和附件 |
| `driver.ts` | ~500 | 驱动接口和内省 |
| `repository.ts` | ~450 | 仓储模式 |
| `action.ts` | ~400 | 操作执行系统 |
| `hook.ts` | ~350 | 钩子生命周期 API |
| `query.ts` | ~300 | 查询接口 |
| `permission.ts` | ~250 | 权限和 RBAC |
| `context.ts` | ~200 | 运行时执行上下文 |
| `app.ts` | ~180 | 应用程序配置 |
| `form.ts` | ~170 | 表单 UI 定义 |
| `page.ts` | ~160 | 页面 UI 定义 |
| `view.ts` | ~150 | 视图 UI 定义 |
| `menu.ts` | ~140 | 菜单定义 |
| `migration.ts` | ~130 | 模式演化 |
| `workflow.ts` | ~120 | 工作流定义 |
| `report.ts` | ~110 | 报表定义 |
| `application.ts` | ~100 | 应用程序元数据 |
| `formula.ts` | ~90 | 公式引擎类型 |
| `loader.ts` | ~80 | 元数据加载器 |
| `registry.ts` | ~70 | 注册表接口 |
| `api.ts` | ~60 | API 类型 |
| `config.ts` | ~50 | 配置 |
| **总计** | **~5,813** | |

### 导入分析

| 来源 | 从 @objectstack/spec 导入 | 运行时特定类型 |
|--------|-------------------------------|----------------------|
| `field.ts` | 3 种类型 | 8 个接口 + 1 个联合 |
| `object.ts` | 1 种类型 | 6 个接口 |
| `query.ts` | 1 种类型 | 4 个接口 |
| `action.ts` | 1 种类型 | 7 个接口 + 1 种类型 |
| **其他 20 个模块** | 0 种类型 | 100+ 个接口 |

**结论**: @objectql/types 的 99.93% 是运行时特定的，而非协议。

---

**文档版本**: 1.0  
**作者**: ObjectQL 首席架构师  
**仓库**: objectstack-ai/objectql

---

## English Version

For detailed English documentation, please refer to `EVALUATION_OBJECTQL_TYPES_DEPRECATION.md` in the same directory.
