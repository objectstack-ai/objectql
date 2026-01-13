# 组件集成指南 / Component Integration Guide

[English](#english) | [中文](#中文)

---

## 中文

### ObjectQL 组件包集成指南

这是 ObjectQL 推荐的标准组件集成方式。通过元数据驱动的组件包系统，支持应用市场分发、版本管理和动态加载。

## ✅ 推荐方法：元数据驱动的组件包

### 为什么选择这种方式？

- **应用市场集成** - 组件可以发布到 ObjectQL 应用市场，用户一键安装
- **版本管理** - 支持语义化版本控制，自动更新
- **元数据驱动** - 通过 YAML 配置使用组件，无需编写代码
- **动态加载** - 按需加载组件，优化性能
- **类型安全** - 完整的 TypeScript 支持
- **隔离性** - 组件包相互独立，避免冲突

### 开发者：如何发布组件包

#### 1. 创建组件包

按照 [Component Package Specification](../../../docs/spec/component-package.md) 创建组件包。

完整示例见：[awesome-components](../../../examples/component-packages/awesome-components/)

#### 2. 构建 UMD 包

```bash
npm run build
# 生成 dist/index.umd.js（浏览器可用）
# 生成 dist/index.esm.js（模块打包器）
# 生成 dist/index.d.ts（TypeScript 类型）
```

#### 3. 发布

```bash
# 发布到 npm
npm publish --access public

# 发布到 ObjectQL 应用市场
objectql publish --package ./objectql.package.json
```

### 用户：如何安装和使用

#### 安装方式 1：ObjectQL Studio（推荐）

1. 打开 ObjectQL Studio
2. 导航到 **Marketplace** → **Components**
3. 搜索组件包
4. 点击 **Install**

组件自动安装并注册，立即可用。

#### 安装方式 2：命令行

```bash
# 从应用市场安装
objectql install @mycompany/awesome-components
```

#### 安装方式 3：配置文件

```json
// objectql.config.json
{
  "packages": [
    {
      "name": "@mycompany/awesome-components",
      "version": "^1.0.0",
      "enabled": true
    }
  ]
}
```

运行 `objectql install` 自动安装所有声明的包。

### 使用已安装的组件

#### 在页面元数据中使用（推荐）

```yaml
# dashboard.page.yml
name: dashboard

components:
  - id: projects_table
    component: my_table  # 引用已安装包中的组件
    props:
      object: projects
      columns:
        - field: name
          label: 项目名称
        - field: status
          label: 状态
          renderer: badge
      sortable: true
```

ObjectQL 自动：
1. 解析元数据
2. 加载组件 UMD 模块
3. 渲染组件
4. 处理数据绑定

### 组件包的生命周期

```
开发组件包 → 构建 UMD → 发布到 npm → 注册到市场 
    ↓
用户安装 → 自动注册 → 元数据引用 → 动态加载 → 渲染组件
```

### 版本管理

```bash
# 检查更新
objectql check-updates

# 更新所有包
objectql update

# 更新特定包
objectql update @mycompany/awesome-components
```

### 常见问题

**Q: 组件包必须是 UMD 格式吗？**  
A: 是的。UMD 格式支持浏览器直接加载，也兼容模块打包器。ObjectQL 使用 UMD 实现动态加载。

**Q: 可以同时安装多个版本吗？**  
A: 不建议。每个包应该只安装一个版本。

**Q: 如何卸载组件包？**  
A: `objectql uninstall @mycompany/awesome-components` 或在 Studio UI 中卸载。

## 完整示例

查看完整的组件包示例：
- [示例包源代码](../../../examples/component-packages/awesome-components/)
- [组件包规范](../../../docs/spec/component-package.md)

---

## English

### ObjectQL Component Package Integration Guide

This is the recommended standard for integrating components in ObjectQL. The metadata-driven component package system supports marketplace distribution, version management, and dynamic loading.

## ✅ Recommended: Metadata-Driven Component Packages

### Why This Approach?

- **Marketplace Integration** - Publish to ObjectQL marketplace, one-click install
- **Version Management** - Semantic versioning, automatic updates
- **Metadata-Driven** - Use components via YAML, no coding required
- **Dynamic Loading** - Load on demand, optimized performance
- **Type Safety** - Full TypeScript support
- **Isolation** - Packages are independent, avoid conflicts

### For Developers: Publishing

#### 1. Create Component Package

Follow the [Component Package Specification](../../../docs/spec/component-package.md).

See complete example: [awesome-components](../../../examples/component-packages/awesome-components/)

#### 2. Build UMD Bundle

```bash
npm run build
```

#### 3. Publish

```bash
npm publish --access public
objectql publish --package ./objectql.package.json
```

### For Users: Installation

#### Method 1: ObjectQL Studio (Recommended)

1. Open ObjectQL Studio
2. Navigate to **Marketplace** → **Components**
3. Search and click **Install**

#### Method 2: Command Line

```bash
objectql install @mycompany/awesome-components
```

### Using Installed Components

```yaml
# dashboard.page.yml
components:
  - id: projects_table
    component: my_table
    props:
      object: projects
      sortable: true
```

## Complete Example

- [Example Package](../../../examples/component-packages/awesome-components/)
- [Package Spec](../../../docs/spec/component-package.md)
