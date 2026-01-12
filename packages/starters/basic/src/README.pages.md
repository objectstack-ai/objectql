# Page Examples

This directory contains example page definitions demonstrating ObjectQL's page metadata capabilities.

## Available Pages

### 1. Dashboard (`dashboard.page.yml`)
A comprehensive dashboard page showing:
- KPI metrics (total projects, active tasks, etc.)
- Charts (pie chart, line chart)
- Data grid with recent tasks
- Grid-based layout for flexible positioning
- Real-time updates enabled

**Layout:** Dashboard (grid-based)
**Use Case:** Overview and monitoring

### 2. Project Detail (`project_detail.page.yml`)
A two-column detail page featuring:
- Main content area with editable form
- Sidebar with metrics and activity timeline
- Task list for the project
- Quick action buttons
- Responsive design that stacks on mobile

**Layout:** Two Column
**Use Case:** Viewing and editing individual records

### 3. Create Project Wizard (`create_project_wizard.page.yml`)
A multi-step wizard for creating projects:
- Step 1: Basic information
- Step 2: Team and resources
- Step 3: Timeline and milestones
- Step 4: Review and confirmation
- State management with draft saving

**Layout:** Wizard (multi-step)
**Use Case:** Guided data entry processes

### 4. Landing Page (`landing.page.yml`)
A custom landing page with:
- Hero section with CTA
- Features grid
- Statistics display
- Canvas layout for absolute positioning
- Public access (no authentication)

**Layout:** Canvas (free-form)
**Use Case:** Marketing and public pages

## Loading Pages

Pages are automatically loaded by ObjectQL when scanning the directory:

```typescript
import { ObjectQL } from '@objectql/core';

const app = new ObjectQL({
  source: './src'
});

await app.init();

// Access loaded pages
const pages = app.registry.list('page');
```

## Using Pages in Navigation

Reference pages in your application navigation:

```yaml
# demo.app.yml
navigation:
  - type: page
    name: dashboard
    label: Dashboard
    path: /dashboard
  
  - type: page
    name: create_project_wizard
    label: New Project
    path: /projects/new
```

## Best Practices Demonstrated

1. **Descriptive IDs**: Components use clear, descriptive identifiers
2. **Data Binding**: Examples use `{{}}` syntax for dynamic values
3. **Responsive Design**: Pages include responsive configurations
4. **Access Control**: Different permission levels shown
5. **AI Context**: All pages include AI context for understanding
6. **State Management**: Wizard demonstrates state handling
7. **Component Composition**: Nested components for complex UIs

## Documentation

- [Page Metadata Guide](../../../docs/guide/page-metadata.md)
- [Page Specification](../../../docs/spec/page.md)
- [Data Modeling](../../../docs/guide/data-modeling.md)

## Contributing

When adding new page examples:
1. Follow the naming convention: `[name].page.yml`
2. Include all standard fields (name, label, layout)
3. Add helpful comments in YAML
4. Provide AI context
5. Configure appropriate permissions
6. Test responsive behavior
