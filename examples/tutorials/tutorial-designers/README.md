# ObjectQL Designers Tutorial

This tutorial demonstrates how to use the dedicated **Form Designer** and **Page Layout Designer** configurations in ObjectQL.

## Overview

ObjectQL provides specialized designer configurations to improve the design-time experience when creating forms and page layouts. These designers separate design concerns from runtime metadata, making it easier for both AI agents and UI tools to create user-friendly interfaces.

## What's New?

Instead of directly editing form or page configurations, you now have access to dedicated designer configurations that provide:

1. **Form Designer** (`*.designer.yml`):
   - Organized field management with categorization
   - Intelligent field grouping strategies
   - Design system integration (colors, spacing, typography)
   - Accessibility and UX best practices built-in
   - AI-assisted field placement and validation
   - Progressive disclosure and mobile optimization

2. **Page Layout Designer** (`*.layout.designer.yml`):
   - Visual grid-based layout system
   - Drag-and-drop component palette
   - Pre-built layout templates
   - Responsive design tools
   - Collaboration features
   - Real-time preview and versioning

## File Naming Conventions

| Pattern | Purpose |
|---------|---------|
| `*.designer.yml` | Form designer configuration |
| `*.layout.designer.yml` | Page layout designer configuration |
| `*.form.yml` | Generated/runtime form configuration |
| `*.page.yml` | Generated/runtime page configuration |

## Form Designer Example

See [`project_form.designer.yml`](./project_form.designer.yml) for a complete example.

### Key Features

1. **Field Organization with Metadata**:
```yaml
available_fields:
  - name: project_name
    label: Project Name
    category: basic_info
    weight: 100  # Higher weight = more important
    placement_hints:
      preferred_column: 1
      prominent: true
    ai_hints:
      importance: 1.0
      common_tasks:
        - "Create new project"
```

2. **Intelligent Section Design**:
```yaml
sections:
  - id: basic_info
    label: Basic Information
    priority: 100
    columns: 2
    icon: info
    emphasized: true
    fields:
      - name
      - description
```

3. **Design System Integration**:
```yaml
design_system:
  palette:
    primary: "#3b82f6"
    success: "#10b981"
  spacing:
    md: "16px"
  typography:
    font_family: "Inter, system-ui, sans-serif"
```

4. **UX Best Practices**:
```yaml
validation_ux:
  show_errors: on_blur
  error_style: inline

auto_save:
  enabled: true
  interval: 30

progressive_disclosure:
  enabled: true
  show_advanced: false
```

## Page Layout Designer Example

See [`project_dashboard.layout.designer.yml`](./project_dashboard.layout.designer.yml) for a complete example.

### Key Features

1. **Grid-Based Layout System**:
```yaml
grid:
  columns: 12
  rows: 0  # Infinite
  cell_width: 80
  cell_height: 80
  gap: "16px"
  snap_to_grid: true
```

2. **Component Palette with Categories**:
```yaml
component_palette:
  categories:
    - id: data_display
      label: Data Display
      components:
        - id: projects_grid
          type: data_grid
          constraints:
            min_width: 4
            min_height: 4
            resizable: true
```

3. **Pre-Built Templates**:
```yaml
templates:
  - id: executive_dashboard
    name: Executive Dashboard
    description: High-level overview with key metrics
    components:
      - id: active_projects_metric
        grid:
          x: 0
          y: 0
          w: 3
          h: 2
```

4. **Responsive Design**:
```yaml
responsive:
  enabled: true
  breakpoints:
    - name: mobile
      width: 375
    - name: desktop
      width: 1920
```

## Benefits Over Direct Form/Page Configuration

### Before (Direct Configuration)
```yaml
# project.form.yml - Hard to design visually
name: project_form
object: project
layout: two_column
sections:
  - fields: [name, description, status, priority]
```

### After (Designer Configuration)
```yaml
# project_form.designer.yml - Design-focused
name: project_form_designer
object: project
grouping_strategy: by_section
design_system:
  palette: {...}
available_fields:
  - name: name
    weight: 100
    category: basic_info
    placement_hints:
      prominent: true
```

**Key Improvements**:
- ✅ Visual organization with weights and categories
- ✅ Design intent and persona documentation
- ✅ AI-friendly metadata for automated generation
- ✅ Built-in UX best practices
- ✅ Responsive and accessible by default
- ✅ Template-based quick starts

## AI-Assisted Design

Both designers include `ai_context` sections to help AI agents generate better designs:

```yaml
ai_context:
  user_tasks:
    - "Quickly create a new project"
    - "Update project status"
  data_patterns:
    - "Required fields: name, status, owner"
  dependencies:
    - field: end_date
      depends_on: [start_date]
      condition:
        operator: ">"
        compare_to: start_date
```

## Usage in ObjectQL Applications

### 1. Create a Designer Configuration

```yaml
# src/designers/contact_form.designer.yml
name: contact_form_designer
label: Contact Form Designer
object: contact
form_type: create
# ... rest of configuration
```

### 2. Generate Runtime Configuration

The designer configuration can be used to generate the actual form/page configuration:

```typescript
import { FormDesignerConfig } from '@objectql/types';

// Load designer config
const designer = loadDesigner('contact_form.designer.yml');

// Generate optimized form config
const formConfig = generateFormFromDesigner(designer);

// Use the generated form
app.registerForm(formConfig);
```

### 3. Visual Designer Tools

Designer configurations are perfect for visual design tools:
- Drag-and-drop field placement
- WYSIWYG form preview
- Component palette browser
- Grid-based layout editor
- Real-time responsive preview

## Best Practices

1. **Use Designers for Complex Forms**:
   - Forms with 10+ fields
   - Multi-section forms
   - Wizard-style forms
   - Forms requiring responsive design

2. **Use Designers for Dashboard Pages**:
   - Data-heavy pages
   - Pages with multiple components
   - Pages requiring different layouts for different users

3. **Keep Runtime Configs Simple**:
   - Simple forms can skip the designer
   - Auto-generated forms from objects

4. **Leverage AI Context**:
   - Document user tasks and patterns
   - Define field dependencies
   - Specify validation requirements

5. **Design System Consistency**:
   - Define design system once
   - Reuse across all designers
   - Maintain brand consistency

## Integration with Object UI

These designer configurations are designed to work seamlessly with Object UI (the React/Tailwind renderer):

- Form Designer → Object UI Form Components
- Layout Designer → Object UI Page Layouts
- Design System → Tailwind CSS Theme

## Next Steps

1. Explore the example files in this directory
2. Create your own designer configurations
3. Experiment with different grouping strategies and layouts
4. Build visual design tools on top of these metadata types
5. Integrate with AI agents for automated form/page generation

## Related Documentation

- [Form Metadata Types](../../../packages/foundation/types/src/form.ts)
- [Page Metadata Types](../../../packages/foundation/types/src/page.ts)
- [Designer Metadata Types](../../../packages/foundation/types/src/designer.ts)
- [ObjectQL Architecture](../../../README.md)

## Feedback

This is a new addition to ObjectQL. We welcome feedback on:
- Designer API ergonomics
- Missing features
- Integration with visual tools
- AI generation capabilities

Please open an issue on GitHub with your suggestions!
