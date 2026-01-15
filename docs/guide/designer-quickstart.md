# Designer Quick Start Guide

Get started with ObjectQL Form and Layout Designers in 5 minutes.

## What are Designers?

Designers are specialized configurations that make it easier to create user-friendly forms and page layouts. They separate design concerns from runtime execution.

- **Form Designer**: Build forms with intelligent field organization, UX best practices, and AI assistance
- **Layout Designer**: Create page layouts with drag-and-drop components, grid systems, and templates

## Quick Start: Form Designer

### 1. Create a Form Designer Configuration

Create `user_form.designer.yml`:

```yaml
name: user_form_designer
label: User Registration Form
object: user
form_type: create

# Grouping strategy
grouping_strategy: by_section

# Available fields with design metadata
available_fields:
  - name: email
    label: Email Address
    required: true
    weight: 100
    category: account
    
  - name: password
    label: Password
    required: true
    weight: 95
    category: account
    
  - name: first_name
    label: First Name
    required: true
    weight: 90
    category: personal
    
  - name: last_name
    label: Last Name
    required: true
    weight: 85
    category: personal

# Sections
sections:
  - id: account
    label: Account Information
    priority: 100
    fields:
      - email
      - password
      
  - id: personal
    label: Personal Details
    priority: 90
    fields:
      - first_name
      - last_name

# Design system
design_system:
  palette:
    primary: "#3b82f6"
    error: "#ef4444"

# UX configuration
validation_ux:
  show_errors: on_blur
  error_style: inline

auto_save:
  enabled: false  # Disable for registration forms
```

### 2. Use in Your Application

```typescript
import { loadDesigner, generateFormFromDesigner } from '@objectql/core';

// Load designer configuration
const designer = await loadDesigner('user_form.designer.yml');

// Generate optimized form config
const formConfig = generateFormFromDesigner(designer);

// Register with ObjectQL
app.registerForm(formConfig);
```

### 3. Render with Object UI

```tsx
import { ObjectForm } from '@object-ui/react';

function RegistrationPage() {
  return (
    <ObjectForm 
      designer="user_form_designer"
      onSubmit={handleSubmit}
    />
  );
}
```

## Quick Start: Layout Designer

### 1. Create a Layout Designer Configuration

Create `dashboard.layout.designer.yml`:

```yaml
name: dashboard_designer
label: Dashboard Layout
page: home_dashboard

# Grid configuration
grid:
  columns: 12
  cell_width: 80
  cell_height: 80
  gap: "16px"

# Component palette
component_palette:
  components:
    - id: welcome_banner
      type: text
      label: Welcome Banner
      constraints:
        min_width: 12
        min_height: 2
        
    - id: stats_panel
      type: metric
      label: Key Metrics
      constraints:
        min_width: 3
        min_height: 2
        
    - id: recent_activity
      type: list
      label: Recent Activity
      constraints:
        min_width: 4
        min_height: 4

# Pre-built template
templates:
  - id: default
    name: Default Dashboard
    components:
      - id: welcome_banner
        grid:
          x: 0
          y: 0
          w: 12
          h: 2
          
      - id: stats_panel
        grid:
          x: 0
          y: 2
          w: 3
          h: 2
          
      - id: recent_activity
        grid:
          x: 0
          y: 4
          w: 8
          h: 4

# Design system
design_system:
  palette:
    primary: "#3b82f6"
    background:
      primary: "#ffffff"
      secondary: "#f9fafb"
```

### 2. Use in Your Application

```typescript
import { loadDesigner, generatePageFromDesigner } from '@objectql/core';

// Load designer
const designer = await loadDesigner('dashboard.layout.designer.yml');

// Generate page config
const pageConfig = generatePageFromDesigner(designer);

// Register with ObjectQL
app.registerPage(pageConfig);
```

### 3. Render with Object UI

```tsx
import { ObjectPage } from '@object-ui/react';

function HomePage() {
  return (
    <ObjectPage designer="dashboard_designer" />
  );
}
```

## Key Concepts

### 1. Field Weights

Control field importance and ordering:

```yaml
available_fields:
  - name: priority_field
    weight: 100  # Higher weight = more important
    
  - name: optional_field
    weight: 50   # Lower weight = less important
```

### 2. Grouping Strategies

Choose how fields should be organized:

- `by_section`: Group by logical sections (default)
- `by_type`: Group by data type (text, numbers, dates)
- `by_frequency`: Group by usage frequency
- `alphabetical`: Sort alphabetically
- `custom`: Full manual control

### 3. Design System

Define consistent styling:

```yaml
design_system:
  palette:
    primary: "#3b82f6"     # Brand color
    success: "#10b981"     # Success states
    error: "#ef4444"       # Error states
    
  spacing:
    sm: "8px"              # Small spacing
    md: "16px"             # Medium spacing
    lg: "24px"             # Large spacing
    
  typography:
    font_family: "Inter, sans-serif"
    base_size: "16px"
```

### 4. Grid System

Layout Designer uses a 12-column grid:

```yaml
grid:
  columns: 12              # Standard 12-column grid
  cell_width: 80           # Each cell is 80px wide
  cell_height: 80          # Each cell is 80px tall
  gap: "16px"              # Space between components

# Component placement
components:
  - id: full_width
    grid:
      x: 0                 # Start at column 0
      w: 12                # Span all 12 columns
      
  - id: half_width
    grid:
      x: 0
      w: 6                 # Span 6 columns (half width)
```

## Common Patterns

### Pattern 1: Multi-Section Form

```yaml
sections:
  - id: basics
    label: Basic Information
    priority: 100
    columns: 2
    fields: [name, email]
    
  - id: details
    label: Additional Details
    priority: 90
    collapsible: true
    collapsed: true
    fields: [bio, website]
```

### Pattern 2: Dashboard Layout

```yaml
templates:
  - id: dashboard
    name: Dashboard
    components:
      # Top metrics (3 across)
      - id: metric1
        grid: { x: 0, y: 0, w: 4, h: 2 }
      - id: metric2
        grid: { x: 4, y: 0, w: 4, h: 2 }
      - id: metric3
        grid: { x: 8, y: 0, w: 4, h: 2 }
      
      # Main chart (2/3 width)
      - id: chart
        grid: { x: 0, y: 2, w: 8, h: 4 }
      
      # Side panel (1/3 width)
      - id: activity
        grid: { x: 8, y: 2, w: 4, h: 4 }
```

### Pattern 3: Responsive Form

```yaml
mobile_optimization:
  enabled: true
  stack_fields: true        # Stack fields vertically on mobile
  large_targets: true       # Larger touch targets

responsive:
  enabled: true
  breakpoints:
    - name: mobile
      width: 375
    - name: desktop
      width: 1280
```

## Best Practices

### ✅ Do

- Use semantic field names
- Assign meaningful weights
- Group related fields
- Provide clear labels
- Enable auto-save for long forms
- Use progressive disclosure for complex forms
- Test on mobile devices

### ❌ Don't

- Don't create too many sections (3-5 is ideal)
- Don't mix unrelated fields in sections
- Don't disable accessibility features
- Don't ignore mobile users
- Don't skip validation UX configuration

## File Organization

Recommended directory structure:

```
src/
  designers/
    forms/
      user_registration.designer.yml
      project_edit.designer.yml
      contact_create.designer.yml
    layouts/
      dashboard.layout.designer.yml
      reports.layout.designer.yml
      analytics.layout.designer.yml
  objects/
    user.object.yml
    project.object.yml
    contact.object.yml
```

## Next Steps

1. **Explore Examples**: Check out [tutorial-designers](../../examples/tutorials/tutorial-designers/) for complete examples
2. **Read Architecture Guide**: See [designer-architecture.md](./designer-architecture.md) for deep dive
3. **Build Visual Tools**: Use designer types to build visual design tools
4. **Integrate with AI**: Leverage AI context for automated generation

## Need Help?

- 📖 [Full Documentation](./designer-architecture.md)
- 💬 [GitHub Discussions](https://github.com/objectstack-ai/objectql/discussions)
- 🐛 [Report Issues](https://github.com/objectstack-ai/objectql/issues)
- 📧 [Contact Support](mailto:support@objectstack.ai)

---

**Happy Designing! 🎨**
