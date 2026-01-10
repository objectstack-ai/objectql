# Visual Multi-Table Reporting Guide

## Overview

ObjectQL's Visual Reporting System enables users to create sophisticated multi-table reports through an intuitive visual interface, similar to Salesforce Reports and other low-code platforms. Users can define complex data queries spanning multiple related objects without writing code.

## Key Features

### 1. **Visual Report Builder**
- Drag-and-drop interface for selecting objects and fields
- Visual relationship path selection for multi-table joins
- Interactive filter builder
- Grouping and aggregation configuration
- Real-time preview

### 2. **Report Types**

#### Tabular Reports
Simple list-style reports displaying records in rows with customizable columns.

**Use Cases:**
- Contact lists with account information
- Task lists with project and owner details
- Order lists with customer and product information

#### Summary Reports
Reports with grouping, subtotals, and aggregations.

**Use Cases:**
- Sales by region and product category
- Tasks by status and priority
- Projects by owner with budget totals

#### Matrix Reports
Cross-tabulated reports showing data across two dimensions.

**Use Cases:**
- Sales by month and region
- Task count by assignee and status
- Budget allocation by department and quarter

### 3. **Multi-Table Join Capabilities**

ObjectQL reports can traverse relationships defined in object metadata:

```yaml
# Example: Tasks object with project relationship
fields:
  project:
    type: lookup
    reference_to: projects
```

Users can select fields from:
- The primary object (e.g., Tasks)
- Related objects via lookup fields (e.g., Project name, Project owner)
- Related child objects (e.g., Task comments, Task attachments)

**Relationship Paths:**
```
Tasks → Project → Owner (User)
Tasks → Assignee (User) → Manager (User)
```

## Report Definition Format

Reports are defined in YAML format (`.report.yml`) with the following structure:

```yaml
name: tasks_by_project
label: Tasks by Project and Status
description: Summary of tasks grouped by project and status
type: summary  # tabular | summary | matrix

# Primary object to query
object: tasks

# Fields to display (can include relationship paths)
columns:
  - field: name
    label: Task Name
  - field: project.name
    label: Project
  - field: project.owner
    label: Project Owner
  - field: priority
    label: Priority
  - field: assigned_to
    label: Assignee
  - field: due_date
    label: Due Date
  - field: completed
    label: Status

# Filters (same format as UnifiedQuery filters)
filters:
  - - completed
    - "="
    - false
  - and
  - - due_date
    - ">="
    - "2024-01-01"

# Grouping configuration (for summary reports)
groupings:
  - field: project.name
    label: Project
    sort: asc
  - field: priority
    label: Priority
    sort: desc

# Aggregations (for summary reports)
aggregations:
  - field: estimated_hours
    function: sum
    label: Total Estimated Hours
  - field: id
    function: count
    label: Task Count

# Sorting
sort:
  - - project.name
    - asc
  - - priority
    - desc

# Chart configuration (optional)
chart:
  type: bar  # bar | line | pie | donut
  groupBy: priority
  measure: id
  aggregation: count
```

## Visual Builder Components

### 1. Object Selector
```tsx
<ObjectSelector
  objects={availableObjects}
  selectedObject="tasks"
  onSelect={handleObjectSelect}
/>
```

### 2. Field Picker
```tsx
<FieldPicker
  object={selectedObject}
  selectedFields={columns}
  onFieldSelect={handleFieldSelect}
  allowRelationships={true}
  maxDepth={3}  // How many levels deep to traverse relationships
/>
```

### 3. Relationship Path Visualizer
```tsx
<RelationshipPath
  startObject="tasks"
  endField="project.owner.manager.name"
  path={[
    { object: 'tasks', field: 'project' },
    { object: 'projects', field: 'owner' },
    { object: 'users', field: 'manager' },
    { object: 'users', field: 'name' }
  ]}
/>
```

### 4. Filter Builder
```tsx
<FilterBuilder
  object={selectedObject}
  filters={reportFilters}
  onChange={handleFilterChange}
  allowRelationshipFilters={true}
/>
```

### 5. Grouping Configuration
```tsx
<GroupingConfig
  availableFields={columns}
  groupings={reportGroupings}
  onChange={handleGroupingChange}
/>
```

### 6. Report Preview
```tsx
<ReportPreview
  definition={reportDefinition}
  data={previewData}
  loading={isLoadingPreview}
/>
```

## Implementation Architecture

### Backend Components

#### 1. Report Metadata Loader
Loads and validates report definitions from `.report.yml` files.

```typescript
// packages/metadata/src/types/report.ts
export interface ReportDefinition {
  name: string;
  label: string;
  type: 'tabular' | 'summary' | 'matrix';
  object: string;
  columns: ReportColumn[];
  filters?: FilterExpression;
  groupings?: GroupingConfig[];
  aggregations?: AggregationConfig[];
  sort?: SortConfig[];
  chart?: ChartConfig;
}

export interface ReportColumn {
  field: string;  // Can be "field" or "object.field" for relationships
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}
```

#### 2. Report Query Compiler
Converts report definitions into ObjectQL UnifiedQuery format.

```typescript
// packages/core/src/report-compiler.ts
export class ReportCompiler {
  compile(report: ReportDefinition): UnifiedQuery {
    const query: UnifiedQuery = {
      object: report.object,
      fields: this.extractFields(report.columns),
      filters: report.filters,
      sort: report.sort
    };

    // Add relationship expansions
    const expansions = this.buildExpansions(report.columns);
    if (Object.keys(expansions).length > 0) {
      query.expand = expansions;
    }

    // Add grouping and aggregations
    if (report.groupings) {
      query.groupBy = report.groupings.map(g => g.field);
    }
    if (report.aggregations) {
      query.aggregate = this.buildAggregations(report.aggregations);
    }

    return query;
  }

  private buildExpansions(columns: ReportColumn[]): Record<string, any> {
    const expansions: Record<string, any> = {};
    
    for (const column of columns) {
      if (column.field.includes('.')) {
        const [relationField, ...rest] = column.field.split('.');
        if (!expansions[relationField]) {
          expansions[relationField] = { fields: [] };
        }
        // Handle nested relationships recursively
        if (rest.length > 0) {
          // Add nested expansion logic
        } else {
          expansions[relationField].fields.push(rest[0]);
        }
      }
    }
    
    return expansions;
  }
}
```

#### 3. Report API Endpoints

```typescript
// packages/api/src/index.ts additions
router.get('/api/reports', async (req, res) => {
  const reports = await objectQL.listReports();
  res.json(reports);
});

router.get('/api/reports/:reportName', async (req, res) => {
  const report = await objectQL.getReport(req.params.reportName);
  res.json(report);
});

router.post('/api/reports/:reportName/run', async (req, res) => {
  const report = await objectQL.getReport(req.params.reportName);
  const compiler = new ReportCompiler();
  const query = compiler.compile(report);
  const results = await objectQL.find(query);
  res.json(results);
});

router.post('/api/reports/:reportName/preview', async (req, res) => {
  // Run report with sample data (limited to 10 rows)
  const report = await objectQL.getReport(req.params.reportName);
  const compiler = new ReportCompiler();
  const query = { ...compiler.compile(report), top: 10 };
  const results = await objectQL.find(query);
  res.json(results);
});
```

### Frontend Components

#### 1. Report Builder Page
```tsx
// packages/ui/src/components/report/ReportBuilder.tsx
export function ReportBuilder({ reportName }: { reportName?: string }) {
  const [report, setReport] = useState<ReportDefinition | null>(null);
  const [selectedObject, setSelectedObject] = useState('');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<FilterExpression>([]);
  const [previewData, setPreviewData] = useState(null);

  return (
    <div className="report-builder">
      <ReportBuilderHeader 
        report={report}
        onSave={handleSave}
        onRun={handleRun}
      />
      
      <div className="report-builder-main">
        <div className="report-builder-sidebar">
          <ObjectSelector
            value={selectedObject}
            onChange={setSelectedObject}
          />
          <FieldPicker
            object={selectedObject}
            selectedFields={columns}
            onFieldSelect={handleFieldSelect}
          />
        </div>
        
        <div className="report-builder-canvas">
          <Tabs>
            <Tab label="Columns">
              <ColumnConfiguration
                columns={columns}
                onChange={setColumns}
              />
            </Tab>
            <Tab label="Filters">
              <FilterBuilder
                filters={filters}
                onChange={setFilters}
              />
            </Tab>
            <Tab label="Grouping">
              <GroupingConfiguration
                columns={columns}
                groupings={report?.groupings}
                onChange={handleGroupingChange}
              />
            </Tab>
            <Tab label="Chart">
              <ChartConfiguration
                chart={report?.chart}
                onChange={handleChartChange}
              />
            </Tab>
          </Tabs>
        </div>
        
        <div className="report-builder-preview">
          <h3>Preview</h3>
          <ReportPreview data={previewData} />
        </div>
      </div>
    </div>
  );
}
```

#### 2. Relationship Path Selector
```tsx
// packages/ui/src/components/report/RelationshipPathSelector.tsx
export function RelationshipPathSelector({
  startObject,
  onPathSelect
}: RelationshipPathSelectorProps) {
  const [currentPath, setCurrentPath] = useState<PathSegment[]>([]);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);

  const handleFieldSelect = (field: Field) => {
    if (field.type === 'lookup') {
      // Add to path and load next level
      setCurrentPath([...currentPath, {
        object: getCurrentObject(),
        field: field.name,
        targetObject: field.reference_to
      }]);
    } else {
      // Terminal field, return complete path
      onPathSelect([...currentPath, {
        object: getCurrentObject(),
        field: field.name
      }]);
    }
  };

  return (
    <div className="relationship-path-selector">
      <div className="path-breadcrumb">
        {currentPath.map((segment, index) => (
          <span key={index}>
            {segment.object} → 
          </span>
        ))}
      </div>
      <FieldList
        fields={availableFields}
        onSelect={handleFieldSelect}
      />
    </div>
  );
}
```

## Usage Examples

### Example 1: Simple Tabular Report

```yaml
# reports/active_tasks.report.yml
name: active_tasks
label: Active Tasks
type: tabular
object: tasks

columns:
  - field: name
    label: Task Name
  - field: project.name
    label: Project
  - field: assigned_to
    label: Assignee
  - field: due_date
    label: Due Date
  - field: priority
    label: Priority

filters:
  - - completed
    - "="
    - false

sort:
  - - due_date
    - asc
```

### Example 2: Summary Report with Grouping

```yaml
# reports/tasks_by_project_status.report.yml
name: tasks_by_project_status
label: Tasks by Project and Status
type: summary
object: tasks

columns:
  - field: project.name
    label: Project
  - field: priority
    label: Priority
  - field: id
    label: Task Count

groupings:
  - field: project.name
    sort: asc
  - field: priority
    sort: desc

aggregations:
  - field: id
    function: count
    label: Count
  - field: estimated_hours
    function: sum
    label: Total Hours

chart:
  type: bar
  groupBy: priority
  measure: id
  aggregation: count
```

### Example 3: Matrix Report

```yaml
# reports/tasks_matrix.report.yml
name: tasks_matrix
label: Tasks by Assignee and Priority
type: matrix
object: tasks

rowGrouping:
  field: assigned_to
  label: Assignee

columnGrouping:
  field: priority
  label: Priority

measure:
  field: id
  function: count
  label: Task Count

filters:
  - - completed
    - "="
    - false
```

## Best Practices

### 1. **Limit Relationship Depth**
For performance, limit relationship traversal to 3-4 levels deep:
```
Tasks → Project → Owner → Manager (3 levels)
```

### 2. **Index Relationship Fields**
Ensure lookup fields are indexed for optimal join performance:
```yaml
fields:
  project:
    type: lookup
    reference_to: projects
    index: true
```

### 3. **Use Filters Strategically**
Apply filters at the lowest level possible to reduce data transfer:
```yaml
expand:
  project:
    fields: ['name', 'owner']
    filters:  # Filter projects, not tasks
      - - status
        - "="
        - "active"
```

### 4. **Optimize Column Selection**
Only select columns you need to display:
```yaml
# Good - specific fields
columns:
  - field: name
  - field: project.name
  - field: due_date

# Bad - selecting all fields
columns: ['*']
```

### 5. **Cache Report Results**
For large reports, implement caching:
```typescript
const cacheKey = `report:${reportName}:${JSON.stringify(params)}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const results = await runReport(reportName, params);
await cache.set(cacheKey, results, 300); // 5 min TTL
return results;
```

## Security Considerations

### 1. **Object-Level Security**
Reports respect object-level permissions defined in metadata.

### 2. **Field-Level Security**
Users can only see fields they have permission to access.

### 3. **Record-Level Security**
Apply filters based on user context:
```typescript
// Automatically inject user-based filters
if (userRole !== 'admin') {
  query.filters = [
    ...query.filters,
    'and',
    ['owner', '=', currentUserId]
  ];
}
```

### 4. **Report Access Control**
Define who can view/edit reports:
```yaml
# reports/sensitive_report.report.yml
permissions:
  view: ['admin', 'manager']
  edit: ['admin']
```

## Performance Optimization

### 1. **Query Optimization**
- Use indexes on filter and join fields
- Limit result sets with `top` parameter
- Use pagination for large result sets

### 2. **Caching Strategy**
- Cache report definitions
- Cache frequently accessed report results
- Implement incremental refresh for real-time data

### 3. **Async Report Generation**
For large reports, generate asynchronously:
```typescript
router.post('/api/reports/:name/generate', async (req, res) => {
  const jobId = await queueReportGeneration(req.params.name);
  res.json({ jobId, status: 'queued' });
});

router.get('/api/reports/jobs/:jobId', async (req, res) => {
  const status = await getReportJobStatus(req.params.jobId);
  res.json(status);
});
```

## Future Enhancements

- [ ] Scheduled report generation
- [ ] Email delivery of reports
- [ ] Dashboard integration
- [ ] Custom formulas in reports
- [ ] Report templates marketplace
- [ ] Collaboration features (share, comment)
- [ ] Version control for report definitions
- [ ] A/B testing different report configurations
- [ ] Mobile-optimized report viewer

## See Also

- [Query Language Specification](../spec/query-language.md)
- [Metadata Format](../spec/metadata-format.md)
- [AI Integration Guide](./ai-integration.md)
- [Data Modeling Guide](./data-modeling.md)
