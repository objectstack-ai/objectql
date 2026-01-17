# Report Definition

Reports define analytics, visualizations, and data exports for business intelligence and decision-making. They provide aggregated views, charts, and formatted output of your data.

**File Naming Convention:** `<report_name>.report.yml`

The filename (without the `.report.yml` extension) automatically becomes the report's identifier. This eliminates the need for a redundant `name` property inside the file.

**Examples:**
- `sales_summary.report.yml` → Report identifier: `sales_summary`
- `revenue_forecast.report.yml` → Report identifier: `revenue_forecast`
- `inventory_status.report.yml` → Report identifier: `inventory_status`

Files should use **snake_case** for multi-word names.

## 1. Root Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Human-readable report title. |
| `description` | `string` | Optional | Internal description of report purpose. |
| `type` | `string` | **Required** | Report type: `tabular`, `summary`, `matrix`, `chart`, `dashboard`. |
| `object` | `string` | Conditional | Primary object for the report. Required for most types. |
| `data_source` | `object` | **Required** | Query configuration for report data. |
| `columns` | `array` | Conditional | Columns to display (for tabular reports). |
| `grouping` | `object` | Optional | Grouping configuration. |
| `aggregations` | `object` | Optional | Aggregate calculations. |
| `filters` | `array` | Optional | Default filters for the report. |
| `parameters` | `object` | Optional | User-configurable parameters. |
| `sorting` | `array` | Optional | Default sort order. |
| `visualization` | `object` | Optional | Chart/graph configuration. |
| `format` | `object` | Optional | Formatting and styling options. |
| `schedule` | `object` | Optional | Automated report generation schedule. |
| `export` | `object` | Optional | Export configuration (PDF, Excel, CSV). |
| `permissions` | `object` | Optional | Access control for the report. |
| `ai_context` | `object` | Optional | AI-friendly context. |

## 2. Report Types

### 2.1 Tabular Report

Simple list of records with columns.

```yaml
# File: customer_list.report.yml

label: Customer List Report
type: tabular
object: customer
description: Complete list of all customers with contact details

# Data source
data_source:
  object: customer
  fields:
    - name
    - email
    - phone
    - industry
    - status
    - created_at

# Columns
columns:
  - field: name
    label: Customer Name
    width: 200
  
  - field: email
    label: Email Address
    width: 250
  
  - field: phone
    label: Phone
    width: 150
    format: phone
  
  - field: industry
    label: Industry
    width: 150
  
  - field: status
    label: Status
    width: 100
  
  - field: created_at
    label: Created Date
    width: 150
    format: date

# Default filters
filters:
  - field: status
    operator: "="
    value: active

# Sorting
sorting:
  - field: name
    direction: asc

# Export options
export:
  formats: [pdf, excel, csv]

ai_context:
  intent: "Complete customer list for marketing and outreach"
  domain: crm
```

### 2.2 Summary Report

Aggregated data grouped by dimensions.

```yaml
# File: sales_by_region.report.yml

label: Sales by Region
type: summary
object: order
description: Total sales aggregated by region and sales rep

# Data source
data_source:
  object: order
  fields:
    - region
    - sales_rep.name
    - amount
    - status
  filters:
    - field: status
      operator: "="
      value: completed

# Grouping
grouping:
  # Primary grouping
  - field: region
    label: Region
    sort: asc
  
  # Secondary grouping
  - field: sales_rep.name
    label: Sales Representative
    sort: asc

# Aggregations
aggregations:
  # Count orders
  order_count:
    function: count
    label: Number of Orders
  
  # Sum amount
  total_sales:
    field: amount
    function: sum
    label: Total Sales
    format: currency
  
  # Average order value
  avg_order_value:
    field: amount
    function: avg
    label: Average Order Value
    format: currency
  
  # Min/Max
  smallest_order:
    field: amount
    function: min
    format: currency
  
  largest_order:
    field: amount
    function: max
    format: currency

# Parameters
parameters:
  date_range:
    type: date_range
    label: Date Range
    default: this_quarter
    filter:
      field: order_date
      operator: between

# Visualization
visualization:
  type: bar_chart
  x_axis: region
  y_axis: total_sales
  series: sales_rep.name

ai_context:
  intent: "Analyze sales performance by geographic region and rep"
  domain: sales
```

### 2.3 Matrix Report

Two-dimensional grouped data.

```yaml
# File: product_sales_matrix.report.yml

label: Product Sales Matrix
type: matrix
object: order_item
description: Sales by product and quarter

# Data source
data_source:
  object: order_item
  fields:
    - product.name
    - order.order_date
    - quantity
    - total_amount

# Matrix configuration
matrix:
  # Rows
  rows:
    - field: product.name
      label: Product
      sort: asc
  
  # Columns (time periods)
  columns:
    - field: order.order_date
      label: Quarter
      group_by: quarter
      format: Q# YYYY
  
  # Values (aggregations)
  values:
    - field: quantity
      function: sum
      label: Units Sold
    
    - field: total_amount
      function: sum
      label: Revenue
      format: currency

# Row subtotals
row_totals: true

# Column subtotals
column_totals: true

# Grand total
grand_total: true

ai_context:
  intent: "Cross-tabulation of product sales by time period"
  domain: sales
```

### 2.4 Chart Report

Visual data representation.

```yaml
# File: revenue_trend.report.yml

label: Revenue Trend
type: chart
object: order
description: Monthly revenue trend with year-over-year comparison

# Data source
data_source:
  object: order
  fields:
    - order_date
    - amount
    - status
  filters:
    - field: status
      operator: "="
      value: completed
    - and
    - field: order_date
      operator: ">="
      value: $start_of_last_year

# Chart configuration
visualization:
  chart_type: line # line, bar, pie, donut, area, scatter
  
  # X-axis (time)
  x_axis:
    field: order_date
    group_by: month
    label: Month
    format: MMM YYYY
  
  # Y-axis (metric)
  y_axis:
    field: amount
    function: sum
    label: Revenue
    format: currency
  
  # Series (for comparison)
  series:
    field: order_date
    group_by: year
    label: Year
  
  # Chart options
  options:
    show_legend: true
    show_grid: true
    show_data_labels: false
    smooth: true
    fill: true
    colors: [#3498db, #2ecc71, #f39c12]

# Parameters
parameters:
  time_period:
    type: select
    label: Time Period
    options:
      - value: last_6_months
        label: Last 6 Months
      - value: last_12_months
        label: Last 12 Months
      - value: last_2_years
        label: Last 2 Years
    default: last_12_months

ai_context:
  intent: "Visualize revenue trends and identify patterns"
  domain: sales
```

### 2.5 Dashboard Report

Multiple visualizations and metrics.

```yaml
# File: executive_dashboard.report.yml

label: Executive Dashboard
type: dashboard
description: High-level business metrics and KPIs

# Dashboard layout
layout:
  columns: 12
  gap: 16

# Widgets
widgets:
  # KPI: Total Revenue
  - type: metric
    title: Total Revenue
    position: { row: 0, col: 0, width: 3, height: 2 }
    data_source:
      object: order
      aggregation:
        field: amount
        function: sum
      filters:
        - field: status
          operator: "="
          value: completed
        - and
        - field: order_date
          operator: ">="
          value: $start_of_quarter
    format: currency
    comparison:
      previous_period: true
      show_trend: true
  
  # KPI: New Customers
  - type: metric
    title: New Customers
    position: { row: 0, col: 3, width: 3, height: 2 }
    data_source:
      object: customer
      aggregation:
        function: count
      filters:
        - field: created_at
          operator: ">="
          value: $start_of_month
    comparison:
      previous_period: true
  
  # Chart: Revenue by Region
  - type: chart
    title: Revenue by Region
    position: { row: 2, col: 0, width: 6, height: 4 }
    data_source:
      object: order
      fields: [region, amount]
      filters:
        - field: status
          operator: "="
          value: completed
    visualization:
      chart_type: pie
      dimension: region
      metric:
        field: amount
        function: sum
  
  # Chart: Sales Trend
  - type: chart
    title: Sales Trend
    position: { row: 2, col: 6, width: 6, height: 4 }
    data_source:
      object: order
      fields: [order_date, amount]
    visualization:
      chart_type: line
      x_axis:
        field: order_date
        group_by: month
      y_axis:
        field: amount
        function: sum
  
  # Table: Top Products
  - type: table
    title: Top 10 Products
    position: { row: 6, col: 0, width: 6, height: 4 }
    data_source:
      object: order_item
      fields:
        - product.name
        - quantity
        - total_amount
      limit: 10
      sort:
        - field: total_amount
          direction: desc
  
  # Table: Pipeline
  - type: table
    title: Sales Pipeline
    position: { row: 6, col: 6, width: 6, height: 4 }
    data_source:
      object: opportunity
      fields:
        - name
        - stage
        - amount
        - close_date
      filters:
        - field: is_closed
          operator: "="
          value: false

# Refresh interval (seconds)
refresh_interval: 300

# Parameters
parameters:
  region_filter:
    type: multiselect
    label: Regions
    options_from: regions
    default: all

ai_context:
  intent: "Executive dashboard showing key business metrics"
  domain: business_intelligence
```

## 3. Data Source Configuration

### 3.1 Single Object

```yaml
data_source:
  object: customer
  fields:
    - name
    - email
    - status
  filters:
    - field: status
      operator: "="
      value: active
```

### 3.2 Joined Objects

```yaml
data_source:
  object: order
  fields:
    - order_number
    - amount
    - customer.name
    - customer.industry
    - sales_rep.name
  joins:
    - object: customer
      type: left
      on:
        local: customer_id
        foreign: id
    
    - object: user
      alias: sales_rep
      type: left
      on:
        local: sales_rep_id
        foreign: id
```

### 3.3 Custom Query

```yaml
data_source:
  type: custom_query
  query: |
    SELECT 
      c.name,
      COUNT(o.id) as order_count,
      SUM(o.amount) as total_spent
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.status = 'active'
    GROUP BY c.id, c.name
```

## 4. Filters and Parameters

### 4.1 Static Filters

```yaml
filters:
  - field: status
    operator: "="
    value: completed
  
  - and
  
  - field: amount
    operator: ">"
    value: 1000
```

### 4.2 User Parameters

```yaml
parameters:
  # Date range parameter
  date_range:
    type: date_range
    label: Report Period
    default: this_month
    filter:
      field: order_date
      operator: between
  
  # Select parameter
  region:
    type: select
    label: Region
    options:
      - All Regions
      - North
      - South
      - East
      - West
    default: All Regions
    filter:
      field: region
      operator: "="
      skip_if: All Regions
  
  # Multi-select parameter
  product_categories:
    type: multiselect
    label: Product Categories
    options_from:
      object: product
      field: category
      distinct: true
    filter:
      field: product.category
      operator: in
  
  # Number parameter
  min_amount:
    type: number
    label: Minimum Amount
    default: 0
    filter:
      field: amount
      operator: ">="
```

## 5. Formatting

### 5.1 Column Formatting

```yaml
columns:
  - field: amount
    label: Revenue
    format: currency
    alignment: right
  
  - field: conversion_rate
    label: Conversion %
    format: percent
    decimals: 2
  
  - field: order_date
    label: Date
    format: date
    pattern: MM/DD/YYYY
  
  - field: status
    label: Status
    format: badge
    color_map:
      active: green
      pending: yellow
      cancelled: red
```

### 5.2 Conditional Formatting

```yaml
columns:
  - field: revenue
    label: Revenue
    format: currency
    conditional_format:
      # Highlight high revenue
      - condition:
          operator: ">"
          value: 100000
        style:
          background: green
          color: white
          bold: true
      
      # Highlight low revenue
      - condition:
          operator: "<"
          value: 10000
        style:
          background: red
          color: white
```

## 6. Export Configuration

```yaml
export:
  # Supported formats
  formats:
    - pdf
    - excel
    - csv
    - json
  
  # PDF options
  pdf:
    page_size: letter # letter, legal, a4
    orientation: portrait # portrait, landscape
    header: Company Name - {report_title}
    footer: Page {page} of {total_pages}
    include_logo: true
  
  # Excel options
  excel:
    sheet_name: Report Data
    include_filters: true
    freeze_header: true
    auto_filter: true
  
  # CSV options
  csv:
    delimiter: ","
    encoding: utf-8
    include_headers: true
```

## 7. Scheduling

```yaml
schedule:
  # Enable scheduled generation
  enabled: true
  
  # Frequency
  frequency: daily # daily, weekly, monthly, quarterly
  
  # Time
  time: "08:00"
  timezone: America/New_York
  
  # Days (for weekly)
  days: [monday, friday]
  
  # Day of month (for monthly)
  day_of_month: 1 # 1-31, or 'last'
  
  # Recipients
  recipients:
    - email: manager@company.com
      format: pdf
    
    - email: analyst@company.com
      format: excel
  
  # Subject
  email_subject: "{report_title} - {date}"
  
  # Message
  email_body: |
    Please find attached the {report_title} for {date}.
```

## 8. Complete Examples

### Example 1: Sales Performance Report

```yaml
# File: sales_performance.report.yml

label: Sales Performance Report
type: summary
object: order
description: Comprehensive sales analysis by rep and product

data_source:
  object: order
  fields:
    - sales_rep.name
    - product.category
    - amount
    - quantity
    - order_date
  filters:
    - field: status
      operator: "="
      value: completed

grouping:
  - field: sales_rep.name
    label: Sales Representative
  
  - field: product.category
    label: Product Category

aggregations:
  order_count:
    function: count
    label: Orders
  
  units_sold:
    field: quantity
    function: sum
    label: Units
  
  total_revenue:
    field: amount
    function: sum
    label: Revenue
    format: currency
  
  avg_order_value:
    field: amount
    function: avg
    label: Avg Order
    format: currency

parameters:
  quarter:
    type: select
    label: Quarter
    options:
      - Q1 2026
      - Q2 2026
      - Q3 2026
      - Q4 2026
    default: Q1 2026

sorting:
  - field: total_revenue
    direction: desc

export:
  formats: [pdf, excel]

schedule:
  enabled: true
  frequency: monthly
  day_of_month: 1
  recipients:
    - email: sales@company.com

ai_context:
  intent: "Monthly sales performance analysis by rep and product"
  domain: sales
```

### Example 2: Inventory Status Report

```yaml
# File: inventory_status.report.yml

label: Inventory Status Report
type: tabular
object: product
description: Current inventory levels with reorder alerts

data_source:
  object: product
  fields:
    - sku
    - name
    - category
    - quantity_on_hand
    - quantity_committed
    - quantity_available
    - reorder_point
    - reorder_quantity
    - unit_cost
    - total_value

columns:
  - field: sku
    label: SKU
    width: 100
  
  - field: name
    label: Product
    width: 250
  
  - field: category
    label: Category
    width: 150
  
  - field: quantity_available
    label: Available
    width: 100
    alignment: right
    conditional_format:
      - condition:
          field: quantity_available
          operator: "<="
          compare_to: reorder_point
        style:
          background: red
          color: white
          bold: true
  
  - field: reorder_point
    label: Reorder Point
    width: 100
    alignment: right
  
  - field: total_value
    label: Total Value
    width: 150
    format: currency
    alignment: right

filters:
  - field: is_active
    operator: "="
    value: true

sorting:
  - field: quantity_available
    direction: asc

export:
  formats: [excel, pdf]

ai_context:
  intent: "Monitor inventory levels and identify reorder needs"
  domain: inventory_management
```

### Example 3: Customer Lifetime Value

```yaml
# File: customer_ltv.report.yml

label: Customer Lifetime Value Report
type: summary
object: customer
description: Customer value analysis with segmentation

data_source:
  object: customer
  fields:
    - name
    - industry
    - tier
    - created_at
    - orders.count
    - orders.amount_sum
    - orders.last_order_date

grouping:
  - field: tier
    label: Customer Tier
  
  - field: industry
    label: Industry

aggregations:
  customer_count:
    function: count
    label: Customers
  
  total_revenue:
    field: orders.amount_sum
    function: sum
    label: Total Revenue
    format: currency
  
  avg_customer_value:
    field: orders.amount_sum
    function: avg
    label: Avg Customer Value
    format: currency
  
  avg_order_count:
    field: orders.count
    function: avg
    label: Avg Orders per Customer
    decimals: 1

# Visualization
visualization:
  type: bar_chart
  x_axis: tier
  y_axis: avg_customer_value
  series: industry

parameters:
  cohort_year:
    type: select
    label: Customer Cohort
    options:
      - 2024
      - 2025
      - 2026
    filter:
      field: created_at
      operator: ">="
      value: ${value}-01-01

ai_context:
  intent: "Analyze customer lifetime value by tier and industry"
  domain: analytics
```

## 9. Best Practices

### 9.1 Performance

- **Limit data**: Use filters to reduce dataset size
- **Index fields**: Ensure filtered/grouped fields have indexes
- **Aggregate at database**: Use database aggregations, not application-level
- **Cache results**: Cache frequently run reports

### 9.2 Usability

- **Clear naming**: Use descriptive report and column names
- **Appropriate format**: Choose the right report type for the data
- **Default filters**: Set sensible default filters
- **Visual hierarchy**: Use grouping and formatting effectively

### 9.3 Accuracy

- **Validate logic**: Test calculations and aggregations
- **Document assumptions**: Explain any business logic
- **Handle nulls**: Account for missing data
- **Date boundaries**: Be clear about date range inclusivity

### 9.4 Security

- **Row-level security**: Respect object permissions
- **Field-level security**: Honor field permissions
- **Parameter validation**: Validate user input
- **Audit access**: Log report access for sensitive data

## See Also

- [Objects](./object.md) - Data model definitions
- [Query Language](./query-language.md) - Query syntax
- [Views](./view.md) - Saved data views
- [Permissions](./permission.md) - Access control
