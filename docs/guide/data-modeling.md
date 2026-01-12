# Data Modeling Guide

Data modeling in ObjectQL is **Metadata-First**. You define your application's schema using `*.object.yml` files (or JSON), and ObjectQL handles validation, database mapping, and type generation.

## 1. The Object Definition

**ObjectQL uses filename-based identification.** The object name is automatically inferred from the filename (without the `.object.yml` extension), eliminating redundancy.

**File naming:** `<object_name>.object.yml`

```yaml
# File: product.object.yml
# Object name "product" is automatically inferred from filename!

label: Product
description: "Catalog items for sale"
icon: standard:product

fields:
  name:
    type: text
    required: true
    label: Product Name
  
  price:
    type: currency
    scale: 2
    label: Price
    
  category:
    type: select
    options:
      - electronics
      - furniture
      - clothing
```

**Note:** The redundant `name: product` property is no longer needed - it's automatically inferred from the filename!

## 2. Fields & Relationships

ObjectQL supports rich field types that automate UI rendering and validation.

### Core Types
*   **Text**: `text`, `textarea`, `markdown`, `html`
*   **Numbers**: `number`, `currency`, `percent`
*   **Flags**: `boolean`
*   **Media**: `image`, `file`, `avatar`

### Relationships
*   **Lookup**: A loose foreign key. Can be optional.
    ```yaml
    created_by: { type: lookup, reference_to: user }
    ```
*   **Master-Detail**: A strong parent-child bond. Deleting the parent cascades to the child.
    ```yaml
    order_id: { type: master_detail, reference_to: order }
    ```

### Specialized Types
*   **Vector**: Stores embeddings (arrays of floats) for AI search.
    ```yaml
    embedding: { type: vector, dimension: 1536, index: true }
    ```

## 3. Indexes & Constraints

Optimize query performance and ensure data integrity.

### Field-Level Shortcuts
Use these for simple, single-column definitions.

```yaml
fields:
  sku:
    type: text
    unique: true  # Enforce uniqueness
  
  status:
    type: select
    index: true   # Speed up filters
```

### Composite Indexes
Define these at the root of your object file for multi-column optimizations (e.g., sorting by Date within a Category).

```yaml
indexes:
  category_date_idx:
    fields: [category, created_at]
  
  unique_product_variant:
    fields: [product_id, color, size]
    unique: true
```

## 4. Internationalization (i18n)

ObjectQL adopts a "clean schema, external translation" philosophy.

*   **Schema**: Keep `*.object.yml` clean and technical (usually English keys/labels).
*   **Metadata Translations**: Store UI labels in `i18n/[lang]/[object].json`.
*   **Data Translations**: If you need to translate record content (like a Product Name), we recommend modeling it explicitly (e.g., a `ProductTranslation` table) rather than complicating the core column types.

## 5. Extending Objects

ObjectQL supports a powerful **Schema Merging** capability. This allows you to extend or modify objects defined in external packages (like plugins or standard libraries) without touching their source code.

This mechanism works by defining a new `.object.yml` file with the **same object name**.

### How it works

When ObjectQL loads schemas, if it encounters multiple definitions for the same object (e.g., `user`), it merges them together. The priority depends on the loading order (usually Application layer overrides Package/Plugin layer).

### Example: Extending the User Object

Suppose a plugin defines a basic `user` object. You want to add a `phone` field and enforce that `email` is required.

**Original Definition (in Plugin):**
```yaml
# node_modules/@objectql/plugin-auth/user.object.yml
name: user
fields:
  name: { type: text }
  email: { type: text }
```

**Your Extension (in App):**
```yaml
# src/objects/user-extension.object.yml
name: user                 # Must match exactly
label: System User (Ext)   # Overrides the label

fields:
  # 1. Modify existing field
  email:
    required: true

  # 2. Add new field
  phone:
    type: text
    label: Mobile Phone
    unique: true
```

### Merge Rules

| Component | Behavior |
| :--- | :--- |
| **Top-level Props** | **Override**. (`label`, `icon`, `description` in your file replace the original). |
| **Fields** | **Deep Merge**. Existing fields are updated (properties merged), new fields are added. |
| **Actions** | **Merge**. You can add new actions or override existing ones. |
| **Indexes** | **Merge**. New indexes are added. |

