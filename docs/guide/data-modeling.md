# Data Modeling Guide

Data modeling in ObjectQL is **Metadata-First**. You define your application's schema using `*.object.yml` files (or JSON), and ObjectQL handles validation, database mapping, and type generation.

## 1. The Object Definition

Each file represents one business entity. By convention, name the file `[object_name].object.yml`.

```yaml
# objects/product.object.yml
name: product
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

