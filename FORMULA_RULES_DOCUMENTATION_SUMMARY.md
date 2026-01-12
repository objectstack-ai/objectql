# ObjectQL 公式和规则语法文档 - 完成总结

## 需求回顾

用户问题：**目前项目使用的公式，规则的语法是什么，更新文档给我确认**

## 已完成的工作

### 📝 新增文档文件

1. **英文完整指南** (`docs/guide/formulas-and-rules.md` - 16KB)
   - 公式语法详细说明
   - 验证规则完整语法
   - 权限规则语法
   - 表达式求值机制
   - 常用操作符参考
   - 最佳实践和性能优化
   - 50+ 实际示例

2. **中文完整指南** (`docs/guide/formulas-and-rules.zh-CN.md` - 12KB)
   - 与英文版内容完全对应
   - 适合中文用户阅读
   - 所有示例和说明均已翻译

3. **快速参考卡** (`docs/guide/formulas-and-rules-quick-ref.md` - 5KB)
   - 浓缩的语法参考
   - 常用模式速查
   - 开发者快速查找工具

### 🔄 更新的文件

- `docs/.vitepress/config.mts` - 添加了新文档到导航菜单
- `README.md` - 添加了公式功能说明和文档链接

## 语法总结

### 📊 公式语法 (Formula Syntax)

ObjectQL 使用 **JavaScript 风格的表达式**来定义计算字段：

#### 基本结构
```yaml
calculated_field:
  type: formula
  expression: "field1 + field2"
  data_type: number  # 结果类型
```

#### 支持的操作
- ✅ **算术运算**: `+`, `-`, `*`, `/`, `%`
- ✅ **字符串连接**: `first_name + ' ' + last_name`
- ✅ **条件表达式**: `score > 80 ? 'High' : 'Low'`
- ✅ **日期计算**: `$today - created_date`
- ✅ **查找引用**: `customer.account.owner.name` (点表示法)
- ✅ **复杂逻辑**: JavaScript if/else 语句

#### 特殊变量
- `$today` - 当前日期
- `$now` - 当前时间戳
- `$current_user.id` - 当前用户ID
- `$current_user.name` - 当前用户名

### ✅ 验证规则语法 (Validation Rules Syntax)

#### 规则类型

1. **字段验证** (Field Validation)
```yaml
fields:
  email:
    type: email
    required: true
    validation:
      format: email
      min_length: 5
      max_length: 100
      pattern: "^[a-zA-Z0-9@.]+$"
```

2. **跨字段验证** (Cross-Field Validation)
```yaml
rules:
  - name: valid_date_range
    type: cross_field
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message: "结束日期必须晚于开始日期"
```

3. **条件验证** (Conditional Validation)
```yaml
rules:
  - name: high_budget_requires_description
    type: conditional
    condition:
      field: budget
      operator: ">"
      value: 10000
    rule:
      field: description
      operator: "not_empty"
    message: "高预算项目需要填写描述"
```

4. **状态机** (State Machine)
```yaml
rules:
  - name: status_transition
    type: state_machine
    field: status
    transitions:
      planning:
        allowed_next: [active, cancelled]
      active:
        allowed_next: [completed, cancelled]
      completed:
        allowed_next: []
        is_terminal: true
```

5. **业务规则** (Business Rules)
```yaml
rules:
  - name: budget_within_limits
    type: business_rule
    constraint:
      expression: "budget <= department.budget_limit OR executive_approval = true"
```

6. **自定义验证** (Custom Validation)
```yaml
rules:
  - name: credit_check
    type: custom
    validator: |
      async function validate(record, context) {
        // JavaScript 验证逻辑
        return record.amount <= customer.credit_limit;
      }
```

### 🔒 权限规则语法 (Permission Rules)

```yaml
rules:
  - name: owner_full_access
    condition:
      field: owner_id
      operator: "="
      value: $current_user.id
    permissions:
      read: true
      create: true
      update: true
      delete: true
```

### 📐 支持的操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `=` | 等于 | `field: status, operator: "=", value: "active"` |
| `!=` | 不等于 | `field: status, operator: "!=", value: null` |
| `>` | 大于 | `field: amount, operator: ">", value: 1000` |
| `>=` | 大于等于 | `field: end_date, operator: ">=", compare_to: start_date` |
| `<` | 小于 | `field: age, operator: "<", value: 18` |
| `<=` | 小于等于 | `field: discount, operator: "<=", value: 1` |
| `in` | 在列表中 | `field: status, operator: "in", value: ["active", "pending"]` |
| `not_in` | 不在列表中 | `field: status, operator: "not_in", value: ["deleted"]` |
| `contains` | 包含 | `field: tags, operator: "contains", value: "urgent"` |
| `not_empty` | 非空 | `field: description, operator: "not_empty"` |

### 🔗 逻辑操作符

```yaml
# AND - 所有条件都必须满足
condition:
  all_of:
    - field: status
      operator: "="
      value: active
    - field: amount
      operator: ">"
      value: 1000

# OR - 任一条件满足即可
condition:
  any_of:
    - field: priority
      operator: "="
      value: high
    - field: amount
      operator: ">"
      value: 10000

# NOT - 条件不能满足
condition:
  none_of:
    - field: status
      operator: "="
      value: deleted
```

## 实际示例

### 示例 1: 计算利润
```yaml
profit:
  type: formula
  expression: "revenue - cost"
  data_type: currency
```

### 示例 2: 日期验证
```yaml
rules:
  - name: valid_date_range
    type: cross_field
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message: "结束日期必须在开始日期之后"
```

### 示例 3: 条件必填
```yaml
rules:
  - name: description_required_for_high_budget
    type: conditional
    condition:
      field: budget
      operator: ">"
      value: 10000
    rule:
      field: description
      operator: "not_empty"
    message: "预算超过 $10,000 的项目需要填写描述"
```

### 示例 4: 状态流转
```yaml
rules:
  - name: order_workflow
    type: state_machine
    field: status
    transitions:
      draft: [submitted, cancelled]
      submitted: [approved, rejected]
      approved: [processing, cancelled]
      processing: [shipped, cancelled]
      shipped: [delivered]
      delivered: []  # 终态
```

## 如何访问文档

### 在线浏览
启动文档服务器：
```bash
cd /home/runner/work/objectql/objectql
pnpm run docs:dev
```
然后访问：http://localhost:5173/guide/formulas-and-rules

### 直接阅读文件
- **完整英文指南**: `docs/guide/formulas-and-rules.md`
- **完整中文指南**: `docs/guide/formulas-and-rules.zh-CN.md`
- **快速参考**: `docs/guide/formulas-and-rules-quick-ref.md`

### 从主 README 链接
主 README 已更新，包含指向新文档的链接。

## 验证结果

✅ **文档构建成功**
```bash
pnpm run docs:build
# ✓ building client + server bundles...
# ✓ rendering pages...
# build complete in 8.19s.
```

✅ **导航菜单已更新**
- 文档已添加到 VitePress 导航
- 位于 "Guide" > "Data & Logic Layers" 部分

✅ **内容完整性**
- 涵盖所有公式语法
- 涵盖所有验证规则类型
- 包含权限规则语法
- 提供 50+ 实际示例
- 包含最佳实践建议

## 代码库中的实际用法

文档中的所有示例都基于项目实际使用的语法：

1. **公式示例来源**:
   - `packages/starters/basic/src/modules/kitchen-sink/kitchen_sink.object.yml`
   - `packages/drivers/sql/test/schema.test.ts`

2. **验证规则示例来源**:
   - `packages/starters/basic/src/modules/projects/projects.validation.yml`
   - `packages/foundation/core/test/validator.test.ts`

3. **权限规则示例来源**:
   - `docs/spec/permission.md`
   - `packages/starters/basic/src/modules/projects/projects.permission.yml`

## 总结

本次更新完整记录了 ObjectQL 项目中使用的公式和规则语法，包括：

✅ **公式语法**: JavaScript 风格表达式，支持算术、字符串、条件、日期、查找等操作
✅ **验证规则**: 6 种规则类型（字段、跨字段、条件、状态机、业务规则、自定义）
✅ **权限规则**: 基于条件的访问控制
✅ **操作符**: 完整的比较和逻辑操作符列表
✅ **示例代码**: 50+ 实际可用的示例
✅ **最佳实践**: 性能优化和错误处理建议

文档已成功构建并集成到项目文档系统中，用户可以随时查阅。
