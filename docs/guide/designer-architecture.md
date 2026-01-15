# Designer Architecture Guide

## Overview

The ObjectQL Designer Architecture provides a dedicated metadata layer for designing user interfaces, separating design-time concerns from runtime execution. This guide explains the architecture, design decisions, and usage patterns.

## Problem Statement

The original issue stated: "目前的设计器不好用，重新思考哪些东西可以设计，比如我需要专用的表单设计器和页面布局设计器"

Translation: "The current designer is not user-friendly. Rethink what can be designed, for example, I need a dedicated form designer and page layout designer."

## Solution Architecture

### Design Philosophy

1. **Separation of Concerns**: Design-time metadata vs. runtime configuration
2. **AI-Friendly**: Structured metadata optimized for LLM generation
3. **User-Friendly**: Intuitive configuration focused on designer UX
4. **Type-Safe**: Pure TypeScript interfaces in `@objectql/types`

### Architecture Layers

```
┌─────────────────────────────────────────────────┐
│          Design-Time Layer                      │
│  (FormDesignerConfig, LayoutDesignerConfig)    │
│  - Field organization & grouping                │
│  - Visual layout configuration                  │
│  - Design system integration                    │
│  - AI generation hints                          │
└─────────────────────────────────────────────────┘
                      ↓
              Generation/Compilation
                      ↓
┌─────────────────────────────────────────────────┐
│           Runtime Layer                         │
│       (FormConfig, PageConfig)                  │
│  - Executable form/page definitions             │
│  - Optimized for rendering                      │
│  - No design metadata overhead                  │
└─────────────────────────────────────────────────┘
```

## Core Components

### 1. Form Designer (`FormDesignerConfig`)

**Purpose**: Dedicated configuration for designing forms with enhanced UX.

**Key Features**:
- **Field Organization**: Categorization, weighting, placement hints
- **Grouping Strategies**: by_type, by_section, by_frequency, alphabetical, custom
- **Design System Integration**: Colors, spacing, typography
- **UX Best Practices**: Validation UX, auto-save, progressive disclosure
- **Accessibility**: ARIA labels, keyboard navigation, screen readers
- **Mobile Optimization**: Responsive layouts, touch targets
- **AI Context**: User tasks, data patterns, field dependencies

**Example Structure**:
```typescript
interface FormDesignerConfig {
  name: string;
  object: string;
  form_type: 'create' | 'edit' | 'view' | 'wizard';
  
  // Design-time metadata
  available_fields: FormDesignerField[];
  grouping_strategy: FormDesignerGroupingStrategy;
  sections: FormDesignerSection[];
  
  // Design system
  design_system: DesignSystem;
  
  // UX configuration
  validation_ux: {...};
  auto_save: {...};
  progressive_disclosure: {...};
  
  // AI assistance
  ai_context: {...};
}
```

### 2. Layout Designer (`LayoutDesignerConfig`)

**Purpose**: Specialized configuration for designing page layouts with drag-and-drop.

**Key Features**:
- **Grid System**: Configurable columns, rows, cell sizes
- **Component Palette**: Categorized, reusable components
- **Templates**: Pre-built layouts for quick starts
- **Responsive Design**: Breakpoint configuration and preview
- **Collaboration**: Real-time editing, cursors, comments
- **Version Control**: History tracking, auto-save
- **AI Assistance**: Placement suggestions, color schemes

**Example Structure**:
```typescript
interface LayoutDesignerConfig {
  name: string;
  page: string;
  
  // Grid configuration
  grid: LayoutGrid;
  
  // Component library
  component_palette: {
    categories: ComponentCategory[];
    components: LayoutDesignerComponent[];
  };
  
  // Quick start templates
  templates: LayoutTemplate[];
  
  // Design system
  design_system: DesignSystem;
  
  // Responsive configuration
  responsive: {...};
  
  // AI assistance
  ai_assistance: {...};
}
```

### 3. Design System (`DesignSystem`)

**Purpose**: Shared design tokens for consistent theming.

**Components**:
- **Palette**: Colors for primary, secondary, success, error, etc.
- **Spacing**: Standardized spacing scale (xs, sm, md, lg, xl)
- **Typography**: Font families, sizes, weights
- **Border Radius**: Rounded corners (sm, md, lg, full)
- **Shadows**: Elevation system (sm, md, lg, xl)

**Example**:
```yaml
design_system:
  palette:
    primary: "#3b82f6"
    success: "#10b981"
    error: "#ef4444"
  spacing:
    sm: "8px"
    md: "16px"
    lg: "24px"
  typography:
    font_family: "Inter, system-ui, sans-serif"
    base_size: "16px"
```

## File Naming Conventions

Following ObjectQL's metadata-driven patterns:

| Pattern | Purpose | Example |
|---------|---------|---------|
| `*.designer.yml` | Form designer configuration | `project_form.designer.yml` |
| `*.layout.designer.yml` | Page layout designer | `dashboard.layout.designer.yml` |
| `*.form.yml` | Generated/runtime form config | `project_form.yml` |
| `*.page.yml` | Generated/runtime page config | `dashboard.page.yml` |

## Design-Time to Runtime Flow

### 1. Form Designer → Form Config

```typescript
// Design-time (project_form.designer.yml)
const designer: FormDesignerConfig = {
  name: "project_form_designer",
  object: "project",
  available_fields: [
    {
      name: "project_name",
      weight: 100,
      category: "basic_info",
      placement_hints: {
        prominent: true,
        preferred_column: 1
      }
    }
  ],
  grouping_strategy: "by_section",
  sections: [...]
};

// Generation process
const formConfig = generateFormFromDesigner(designer);

// Runtime (project_form.yml)
const form: FormConfig = {
  name: "project_form",
  object: "project",
  layout: "two_column",
  sections: [
    {
      label: "Basic Information",
      fields: ["project_name", "description"]
    }
  ]
};
```

### 2. Layout Designer → Page Config

```typescript
// Design-time (dashboard.layout.designer.yml)
const designer: LayoutDesignerConfig = {
  name: "dashboard_designer",
  page: "project_dashboard",
  grid: {
    columns: 12,
    cell_width: 80,
    cell_height: 80
  },
  component_palette: {...},
  templates: [...]
};

// Generation process
const pageConfig = generatePageFromDesigner(designer);

// Runtime (dashboard.page.yml)
const page: PageConfig = {
  name: "project_dashboard",
  layout: "dashboard",
  components: [
    {
      id: "metrics_panel",
      type: "metric",
      grid: { x: 0, y: 0, w: 3, h: 2 }
    }
  ]
};
```

## AI-Assisted Generation

### Form Designer AI Context

```yaml
ai_context:
  # User tasks this form should support
  user_tasks:
    - "Quickly create a new project"
    - "Update project status and timeline"
  
  # Common data patterns
  data_patterns:
    - "Required fields: name, status, owner"
    - "Date range validation: end_date must be after start_date"
  
  # Field dependencies
  dependencies:
    - field: end_date
      depends_on: [start_date]
      condition:
        operator: ">"
        compare_to: start_date
  
  # Suggested validations
  suggested_validations:
    - "Project name must be unique"
    - "End date must be after start date"
```

**How AI Uses This**:
1. Understand user intent and tasks
2. Generate appropriate field groupings
3. Suggest validation rules
4. Optimize field ordering based on importance
5. Create logical sections based on data patterns

### Layout Designer AI Assistance

```yaml
ai_assistance:
  enabled: true
  suggest_placement: true    # Suggest component positions
  suggest_colors: true       # Suggest color schemes
  suggest_breakpoints: true  # Suggest responsive breakpoints
```

**AI Capabilities**:
- Analyze component relationships
- Suggest optimal grid placements
- Generate responsive breakpoints
- Recommend color schemes based on brand
- Predict user interaction flows

## Integration Points

### 1. Visual Designer Tools

Designer configurations are perfect for visual design tools:

```typescript
// Load designer configuration
const designer = loadDesigner('project_form.designer.yml');

// Render in visual editor
<FormDesignerUI config={designer}>
  <FieldPalette fields={designer.available_fields} />
  <Canvas sections={designer.sections} />
  <PropertiesPanel />
</FormDesignerUI>

// Export generated form
const formConfig = exportFormConfig();
```

### 2. CLI Tools

```bash
# Generate form from designer
objectql designer generate project_form.designer.yml --output project_form.yml

# Validate designer configuration
objectql designer validate project_form.designer.yml

# Preview form in terminal
objectql designer preview project_form.designer.yml
```

### 3. Object UI Integration

Designer configurations map directly to Object UI components:

```typescript
import { FormDesignerConfig } from '@objectql/types';
import { ObjectForm } from '@object-ui/react';

// Use designer to render form
<ObjectForm designer={formDesigner} />

// Or use generated config
<ObjectForm config={formConfig} />
```

## Best Practices

### 1. Form Designer Best Practices

**Field Organization**:
- Use meaningful categories
- Assign weights based on importance
- Provide placement hints for common layouts
- Group related fields together

**UX Configuration**:
```yaml
validation_ux:
  show_errors: on_blur      # Don't overwhelm users
  error_style: inline       # Keep errors contextual
  show_success: true        # Provide positive feedback

auto_save:
  enabled: true
  interval: 30              # Balance UX and server load
  strategy: debounce        # Prevent excessive saves

progressive_disclosure:
  enabled: true
  show_advanced: false      # Hide complexity
  complexity_threshold: 0.7 # Show 30% of fields initially
```

**Accessibility**:
```yaml
accessibility:
  aria_labels: auto         # Generate ARIA labels
  keyboard_nav: true        # Enable keyboard shortcuts
  screen_reader: true       # Optimize for screen readers
  high_contrast: true       # Support high contrast mode
```

### 2. Layout Designer Best Practices

**Grid Configuration**:
```yaml
grid:
  columns: 12               # Standard 12-column grid
  snap_to_grid: true        # Ensure alignment
  gap: "16px"               # Consistent spacing
```

**Component Organization**:
- Categorize components logically
- Define minimum/maximum sizes
- Enable appropriate constraints
- Configure responsive behavior

**Templates**:
- Provide templates for common use cases
- Include use case documentation
- Create role-specific templates (executive, operational, team)

### 3. Design System Best Practices

**Consistency**:
- Define once, use everywhere
- Follow established design standards (Material, Tailwind, etc.)
- Use semantic color names (primary, success, error)

**Scalability**:
- Use relative units (rem, em) for sizing
- Define spacing scales (xs to xxl)
- Create reusable shadow definitions

## Migration Guide

### From Direct Configuration to Designer

**Before** (Direct Form Configuration):
```yaml
# project.form.yml
name: project_form
object: project
layout: two_column
sections:
  - fields: [name, description, status, priority]
```

**After** (Form Designer):
```yaml
# project_form.designer.yml
name: project_form_designer
object: project
grouping_strategy: by_section
available_fields:
  - name: name
    weight: 100
    category: basic_info
  - name: description
    weight: 90
    category: basic_info
  - name: status
    weight: 85
    category: tracking
sections:
  - id: basic_info
    label: Basic Information
    fields: [name, description]
  - id: tracking
    label: Status & Priority
    fields: [status, priority]
```

**Benefits**:
- ✅ Explicit field importance (weight)
- ✅ Categorization for organization
- ✅ Design system integration
- ✅ AI-friendly metadata
- ✅ UX best practices built-in

## Advanced Features

### 1. Component Constraints

```typescript
interface LayoutDesignerComponent {
  constraints?: {
    min_width: number;      // Minimum grid units
    max_width: number;      // Maximum grid units
    resizable: boolean;     // Can user resize?
    movable: boolean;       // Can user move?
  };
}
```

### 2. Responsive Behavior

```typescript
interface LayoutDesignerComponent {
  responsive_behavior?: {
    mobile_strategy: 'hide' | 'stack' | 'collapse' | 'replace';
    breakpoints: {
      mobile?: Partial<PageComponent>;
      tablet?: Partial<PageComponent>;
      desktop?: Partial<PageComponent>;
    };
  };
}
```

### 3. Data Binding

```typescript
interface LayoutDesignerComponent {
  data_binding?: {
    source: string;                    // Page-level data source
    field_mappings: Record<string, string>;
    refresh: 'manual' | 'auto' | 'realtime';
  };
}
```

### 4. Collaboration Features

```yaml
collaboration:
  realtime: true            # Enable real-time editing
  show_cursors: true        # Show other users' cursors
  comments: true            # Enable inline comments
```

### 5. Version Control

```yaml
versioning:
  enabled: true
  auto_save: true           # Auto-save versions
  retention_days: 90        # Keep versions for 90 days
```

## Performance Considerations

### 1. Design-Time vs Runtime

- **Design-time**: Rich metadata, AI hints, placement suggestions
- **Runtime**: Minimal, optimized configuration

### 2. Generation Strategy

```typescript
// Lazy generation - generate on first use
const formConfig = generateFormFromDesigner(designer);

// Ahead-of-time generation - during build
// objectql designer generate *.designer.yml

// Caching - cache generated configs
const cache = new DesignerCache();
cache.set(designer.name, formConfig);
```

### 3. Large Forms/Pages

For forms with 50+ fields or complex pages:
- Use progressive disclosure
- Implement virtual scrolling in component palette
- Lazy-load section configurations
- Cache component definitions

## Future Enhancements

### Planned Features

1. **Visual Diff Tool**: Compare designer versions
2. **Component Marketplace**: Share reusable components
3. **Theme Gallery**: Pre-built design systems
4. **Form Analytics**: Track field usage and completion
5. **A/B Testing**: Test different layouts
6. **Accessibility Audit**: Automated accessibility checks

### Extensibility

The designer architecture is designed for extensibility:

```typescript
// Custom designer types
interface CustomDesignerConfig extends FormDesignerConfig {
  custom_features: {
    multi_step_wizard: boolean;
    conditional_logic: ConditionalRule[];
    dynamic_sections: DynamicSection[];
  };
}
```

## Conclusion

The ObjectQL Designer Architecture provides a robust, AI-friendly foundation for building user-friendly forms and page layouts. By separating design concerns from runtime configuration, it enables:

- Better developer experience
- AI-assisted generation
- Visual design tools
- Consistent UX patterns
- Accessible, responsive designs

For questions or contributions, please refer to the [main README](../../../README.md) or open an issue on GitHub.
