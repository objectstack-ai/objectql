# 前端组件元数据规范 / Frontend Component Metadata Specification

[English](#english) | [中文](#中文)

---

## 中文

### 概述

ObjectQL 前端组件元数据规范为用户提供了强大的组件自定义能力，允许：

1. **使用内置组件** - 开箱即用的生产级组件（ObjectTable、ObjectForm 等）
2. **覆盖内置组件** - 用自定义实现替换任何内置组件
3. **创建新组件** - 开发全新的组件类型
4. **共享组件库** - 打包和分享组件集合

### 核心组件类型

#### 数据展示组件

| 组件名 | 用途 | 主要功能 |
|:---|:---|:---|
| `ObjectTable` | 表格显示记录 | 排序、筛选、分页、行内编辑 |
| `ObjectList` | 列表显示记录 | 卡片式布局、响应式设计 |
| `ObjectCardList` | 卡片显示记录 | 网格布局、自定义卡片模板 |
| `ObjectDetail` | 显示单条记录 | 字段分组、关联列表、操作 |
| `RelatedList` | 显示关联记录 | 嵌入式表格/列表、行内创建 |

#### 数据录入组件

| 组件名 | 用途 | 主要功能 |
|:---|:---|:---|
| `ObjectForm` | 创建/编辑记录 | 分组、标签页、验证、向导 |
| `QuickCreateForm` | 快速创建记录 | 最小字段、模态框 |
| `FieldInput` | 单字段输入 | 类型特定渲染、验证 |
| `LookupField` | 引用其他对象 | 搜索、自动完成、行内创建 |

#### 布局组件

| 组件名 | 用途 | 主要功能 |
|:---|:---|:---|
| `GridLayout` | 网格布局 | 响应式、拖放 |
| `Section` | 内容分组 | 可折叠、条件显示 |
| `TabContainer` | 标签页导航 | 懒加载、状态管理 |
| `Modal` | 模态对话框 | 尺寸变体、动画 |
| `Drawer` | 侧边面板 | 位置（左/右）、遮罩层 |

#### 可视化组件

| 组件名 | 用途 | 主要功能 |
|:---|:---|:---|
| `Chart` | 数据可视化 | 柱状图、折线图、饼图、面积图 |
| `Metric` | 显示 KPI | 趋势指示、对比 |
| `KanbanBoard` | 看板视图 | 拖放、WIP 限制 |
| `Calendar` | 日历视图 | 日/周/月视图、事件 |
| `Timeline` | 时间轴/甘特图 | 项目时间轴、依赖关系 |

### 三种自定义方式

#### 1. 配置式自定义（最简单）

通过配置使用内置组件：

```yaml
# project_list.page.yml
components:
  - id: projects_table
    component: ObjectTable
    props:
      object: projects
      theme: dark
      density: compact
```

**优点：** 无需编码，最快速
**缺点：** 仅限于内置配置选项

#### 2. 组件覆盖（推荐）

用自定义实现替换内置组件：

```yaml
# ObjectTable.component.yml
name: ObjectTable  # 与内置组件同名
extends: ObjectTable
implementation: ./components/MyEnhancedTable.tsx

props:
  - name: object
    type: string
    required: true
  
  # 添加自定义属性
  - name: advancedSearch
    type: boolean
    default: true
```

**优点：** 完全控制、自动应用到整个应用
**缺点：** 需要实现代码、需维护兼容性

#### 3. 创建新组件（最灵活）

创建全新的组件类型：

```yaml
# kanban_board.component.yml
name: kanban_board
label: 看板
category: visualization
implementation: ./components/KanbanBoard.tsx

props:
  - name: object
    type: string
    required: true
  - name: groupBy
    type: string
    required: true
```

**优点：** 完全自由、可解决独特问题
**缺点：** 工作量最大、需处理所有边界情况

### 快速开始示例

#### 创建自定义表格组件

**步骤 1：** 创建组件元数据文件

```yaml
# src/components/custom_table.component.yml
name: custom_table
label: 自定义数据表格
category: data_display
implementation: ./CustomTable.tsx
framework: react

props:
  - name: object
    type: string
    required: true
  - name: columns
    type: array
  - name: exportable
    type: boolean
    default: true

events:
  - name: onRowClick
    payload: "{ row: Record, index: number }"
```

**步骤 2：** 实现组件

```tsx
// src/components/CustomTable.tsx
export function CustomTable({ object, columns, exportable, onRowClick }) {
  // 你的自定义实现
  return <div>自定义表格</div>;
}
```

**步骤 3：** 在页面中使用

```yaml
# dashboard.page.yml
components:
  - id: projects
    component: custom_table
    props:
      object: projects
      exportable: true
```

#### 覆盖内置组件

要替换内置的 `ObjectTable`：

```yaml
# src/components/ObjectTable.component.yml
name: ObjectTable  # 必须与内置组件完全同名
extends: ObjectTable
implementation: ./MyEnhancedTable.tsx

# 支持所有原始属性 + 新增属性
props:
  - name: object
    type: string
    required: true
  - name: exportFormats  # 新增
    type: array
    default: [csv, excel]
```

之后，整个应用中所有使用 `ObjectTable` 的地方都会自动使用你的实现！

### 组件元数据结构

完整的组件元数据包括：

```yaml
name: 组件名称
label: 显示标签
description: 组件描述
category: 组件类别
version: 版本号（语义化版本）
author: 作者

# 实现
implementation: 组件文件路径
framework: react | vue | svelte | web-component

# 属性定义
props:
  - name: 属性名
    type: string | number | boolean | object | array
    description: 描述
    required: true/false
    default: 默认值

# 事件定义
events:
  - name: 事件名
    description: 事件描述
    payload: 载荷类型

# 公共方法
methods:
  - name: 方法名
    description: 方法描述
    parameters: [...]
    returns: 返回类型

# AI 上下文
ai_context:
  purpose: 组件用途
  use_cases: [使用场景列表]
  best_practices: [最佳实践列表]

# 使用示例
examples:
  - title: 示例标题
    code: |
      代码示例
```

### 文件组织

```
src/
  components/              # 自定义组件
    *.component.yml       # 组件元数据
    *.tsx                 # 组件实现
  
  pages/                  # 使用组件的页面
    *.page.yml
```

### 主要优势

1. **完全可定制** - 替换任何内置组件
2. **类型安全** - 完整的 TypeScript 支持
3. **元数据驱动** - 通过 YAML/JSON 定义
4. **AI 友好** - 结构化元数据便于 LLM 理解
5. **框架无关** - 支持 React、Vue、Svelte 等
6. **可共享** - 打包为组件库共享

### 相关文档

- [完整组件规范](./component.md) - 详细的组件元数据规范
- [组件自定义指南](../guide/component-customization.md) - 分步教程
- [示例组件](../../packages/starters/basic/src/components/) - 完整示例

---

## English

### Overview

ObjectQL's frontend component metadata specification provides powerful component customization capabilities, allowing you to:

1. **Use built-in components** - Production-ready components out of the box (ObjectTable, ObjectForm, etc.)
2. **Override built-in components** - Replace any built-in component with custom implementation
3. **Create new components** - Develop entirely new component types
4. **Share component libraries** - Package and share component collections

### Core Component Types

#### Data Display Components

| Component | Purpose | Key Features |
|:---|:---|:---|
| `ObjectTable` | Display records in table | Sorting, filtering, pagination, inline editing |
| `ObjectList` | Display records as list | Card-based layout, responsive design |
| `ObjectCardList` | Display records as cards | Grid layout, customizable card templates |
| `ObjectDetail` | Display single record | Field groups, related lists, actions |
| `RelatedList` | Display related records | Embedded table/list, inline creation |

#### Data Entry Components

| Component | Purpose | Key Features |
|:---|:---|:---|
| `ObjectForm` | Create/edit records | Sections, tabs, validation, wizards |
| `QuickCreateForm` | Fast record creation | Minimal fields, modal-based |
| `FieldInput` | Single field input | Type-specific rendering, validation |
| `LookupField` | Reference another object | Search, autocomplete, inline creation |

#### Layout Components

| Component | Purpose | Key Features |
|:---|:---|:---|
| `GridLayout` | Grid-based layout | Responsive, drag-and-drop |
| `Section` | Group content | Collapsible, conditional visibility |
| `TabContainer` | Tab-based navigation | Lazy loading, state management |
| `Modal` | Modal dialogs | Size variants, animations |
| `Drawer` | Side panel | Position (left/right), overlay |

#### Visualization Components

| Component | Purpose | Key Features |
|:---|:---|:---|
| `Chart` | Data visualization | Bar, line, pie, area charts |
| `Metric` | Display KPI | Trend indicators, comparisons |
| `KanbanBoard` | Kanban view | Drag-and-drop, WIP limits |
| `Calendar` | Calendar view | Day/week/month views, events |
| `Timeline` | Timeline/Gantt | Project timelines, dependencies |

### Three Ways to Customize

#### 1. Configuration-Based Customization (Easiest)

Use built-in components with custom configuration:

```yaml
# project_list.page.yml
components:
  - id: projects_table
    component: ObjectTable
    props:
      object: projects
      theme: dark
      density: compact
```

**Pros:** No code required, fastest approach
**Cons:** Limited to built-in options

#### 2. Component Override (Recommended)

Replace built-in components with custom implementation:

```yaml
# ObjectTable.component.yml
name: ObjectTable  # Same name as built-in
extends: ObjectTable
implementation: ./components/MyEnhancedTable.tsx

props:
  - name: object
    type: string
    required: true
  
  # Add custom props
  - name: advancedSearch
    type: boolean
    default: true
```

**Pros:** Full control, automatically used throughout app
**Cons:** Requires implementation, must maintain compatibility

#### 3. New Component Creation (Most Flexible)

Create completely new component types:

```yaml
# kanban_board.component.yml
name: kanban_board
label: Kanban Board
category: visualization
implementation: ./components/KanbanBoard.tsx

props:
  - name: object
    type: string
    required: true
  - name: groupBy
    type: string
    required: true
```

**Pros:** Complete freedom, solve unique problems
**Cons:** Most effort, handle all edge cases

### Quick Start Example

#### Create Custom Table Component

**Step 1:** Create component metadata

```yaml
# src/components/custom_table.component.yml
name: custom_table
label: Custom Data Table
category: data_display
implementation: ./CustomTable.tsx
framework: react

props:
  - name: object
    type: string
    required: true
  - name: columns
    type: array
  - name: exportable
    type: boolean
    default: true

events:
  - name: onRowClick
    payload: "{ row: Record, index: number }"
```

**Step 2:** Implement the component

```tsx
// src/components/CustomTable.tsx
export function CustomTable({ object, columns, exportable, onRowClick }) {
  // Your custom implementation
  return <div>Custom Table</div>;
}
```

**Step 3:** Use in pages

```yaml
# dashboard.page.yml
components:
  - id: projects
    component: custom_table
    props:
      object: projects
      exportable: true
```

#### Override Built-in Component

To replace built-in `ObjectTable`:

```yaml
# src/components/ObjectTable.component.yml
name: ObjectTable  # Must match built-in name exactly
extends: ObjectTable
implementation: ./MyEnhancedTable.tsx

# Support all original props + new ones
props:
  - name: object
    type: string
    required: true
  - name: exportFormats  # New
    type: array
    default: [csv, excel]
```

Now, all uses of `ObjectTable` throughout your app automatically use your implementation!

### Component Metadata Structure

Complete component metadata includes:

```yaml
name: Component name
label: Display label
description: Component description
category: Component category
version: Version (semver)
author: Author

# Implementation
implementation: Component file path
framework: react | vue | svelte | web-component

# Props definition
props:
  - name: Prop name
    type: string | number | boolean | object | array
    description: Description
    required: true/false
    default: Default value

# Events definition
events:
  - name: Event name
    description: Event description
    payload: Payload type

# Public methods
methods:
  - name: Method name
    description: Method description
    parameters: [...]
    returns: Return type

# AI context
ai_context:
  purpose: Component purpose
  use_cases: [Use case list]
  best_practices: [Best practice list]

# Examples
examples:
  - title: Example title
    code: |
      Code example
```

### File Organization

```
src/
  components/              # Custom components
    *.component.yml       # Component metadata
    *.tsx                 # Component implementation
  
  pages/                  # Pages using components
    *.page.yml
```

### Key Benefits

1. **Fully Customizable** - Replace any built-in component
2. **Type Safe** - Full TypeScript support
3. **Metadata-Driven** - Defined via YAML/JSON
4. **AI-Friendly** - Structured metadata for LLM understanding
5. **Framework Agnostic** - Supports React, Vue, Svelte, etc.
6. **Shareable** - Package as component libraries

### Related Documentation

- [Complete Component Specification](./component.md) - Detailed component metadata spec
- [Component Customization Guide](../guide/component-customization.md) - Step-by-step tutorial
- [Example Components](../../packages/starters/basic/src/components/) - Complete examples
