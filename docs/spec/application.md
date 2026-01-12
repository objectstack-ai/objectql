# Application Metadata Standard

The Application metadata (`.app.yml`) is the **primary entry point** for user interaction. It acts as a **container** that bundles navigation, routing, data access, and UI behaviors into a coherent workspace.

It supersedes separate menu definitions by combining **Identity**, **Navigation**, and **Workspace Context** into a single, unified definition.

**File Naming Convention:** `<app_name>.app.yml`

The filename (without the `.app.yml` extension) automatically becomes the application's API identifier.

**Examples:**
- `sales_crm.app.yml` → App name: `sales_crm`
- `hr_portal.app.yml` → App name: `hr_portal`

## 1. Root Structure (Schema)

```yaml
# File: sales_crm.app.yml
# App name is inferred from filename!

# Identity
label: Sales Command Center # Display name
description: Manage leads, pipeline, and forecasts.
icon: briefcase             # Icon (e.g., Lucide, Material)
version: 1.0.0

# Branding
theme:
  mode: light               # default, dark, system
  primary_color: "#0F6CBD"  # Brand color for this app
  density: compact          # default, compact, spacious

# Access Control
permissions:
  roles: [admin, sales_manager, sales_rep]

# AI Context (Agent Guidance)
ai_context:
  intent: "Central workspace for sales representatives to manage deal flow"
  target_persona: "Sales Representative"
  key_tasks: 
    - "Qualify incoming leads"
    - "Track opportunity stages"
    - "Generate quotes"

# Workspace Capabilities (Context)
features:
  global_search:
    enabled: true
    scope: [leads, opportunities, accounts]
    hotkey: "cmd+k"
    
  quick_actions:
    - name: new_lead
      label: New Lead
      action: create_record
      object: leads
      shortcut: "cmd+shift+l"

# Navigation Structure (The Menu Tree)
navigation:
  type: sidebar             # sidebar, topnav, mobile_bottom
  collapsible: true
  
  items:
    # 1. Dashboard (Page)
    - type: page
      name: home
      label: Dashboard
      icon: layout-dashboard
      path: /
      component: sales-dashboard-v1
      ai_context: "Overview of daily tasks and KPIs. Primary landing page."

    # 2. Section (Collapsible Group)
    - type: section
      label: Pipeline
      expanded: true
      items:
        # Object View Link
        - type: object
          name: leads
          label: Leads
          object: leads
          view: all_leads
          badge:
            function: count
            filter: [['status', '=', 'new']]
            color: red

        - type: object
          name: opportunities
          label: Opportunities
          object: opportunities
          
    # 3. External Link
    - type: divider
    
    - type: link
      label: Help Center
      url: https://internal.wiki/sales
      target: _blank
      icon: help-circle
```

## 2. Property Reference

### 2.1 Identity & Branding

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Unique API identifier (slug). Used in URLs (e.g., `/app/sales_crm`). Matches file name. |
| `label` | `string` | **Required.** Human-readable title displayed in the App Launcher. |
| `icon` | `string` | The icon name representing the app (e.g., in the sidebar or launcher). |
| `theme` | `object` | UI customization for this specific app context. |

### 2.2 Features (Workspace Context)

Defines global capabilities available while the user is inside this application.

*   **`global_search`**:
    *   Defines the behavior of the top search bar.
    *   `scope`: Limits search results to specific objects relevant to this app.
*   **`quick_actions`**:
    *   Global shortcuts available anywhere within the app (e.g., in the specialized top bar or utility bar).

### 2.3 Navigation Items (`items`)

The `navigation.items` array supports polymorphic types.

#### Type: `object` (Entity View)
Links directly to a standard ObjectQL view (List/Grid).

```yaml
- type: object
  object: invoices      # The object code
  view: pending_payment # (Optional) Specific view to open
  label: My Invoices    # (Optional) Override default object label
```

#### Type: `page` (Custom Page)
Links to a custom UI page or dashboard.

```yaml
- type: page
  path: /analytics
  component: analytics-board
```

#### Type: `section` (Group)
A visual grouping of items, usually with a header.

```yaml
- type: section
  label: Admin
  collapsible: true
  items: [...]
```

#### Type: `folder` (Dropdown)
A nested submenu (popover or accordion depending on layout).

```yaml
- type: folder
  label: Reports
  items: [...]
```

## 3. Best Practices

1.  **Context Isolation**: Ensure `quick_actions` and `global_search.scope` only include items relevant to *this* app's persona. Don't include "Inventory Search" in the "Sales App".
2.  **Badge Performance**: Use badges sparingly. Each badge executes a real-time query (`count`) when the menu loads.
3.  **Role Filtering**: Use `permissions` at the App level to hide the entire app. Use `visible_when` on specific menu items for fine-grained control.

## 4. Mobile Responsiveness

The `navigation` block is the source of truth. The frontend engine (`@objectql/studio`) automatically adapts this structure:
*   **Desktop**: Renders as `type` defined (e.g., Sidebar).
*   **Mobile**: Flattens `section`s and prioritizes the first 4 items for the bottom navigation bar, moving the rest to a "More" drawer.

## 5. AI Context & Agent Integration

ObjectQL apps are designed to be "Agent-Ready". By providing `ai_context`, you allow LLMs and AI Agents to navigate and operate the application intelligently.

### 5.1 Application Level Context
Describes the *purpose* of the workspace.

```yaml
ai_context:
  intent: "Customer Support Console"
  target_persona: "Support Agent"
  description: "Used for resolving high-priority tickets and managing SLAs."
```

**Usage by AI:**
*   **Routing**: "I see you are a Support Agent. I will route you to the `support_console` app."
*   **Context Setting**: When an agent works within this app, it knows to prioritize "Resolution Time" over "Sales Volume".

### 5.2 Navigation Level Context
Helps Agents find the right tool for the user's request.

```yaml
- type: page
  name: quarterly_reports
  label: Q3 Reports
  ai_context: "Use this screen to analyze revenue trends and export PDF reports."
```

**Usage by AI:**
*   **Navigation**: User asks *"Where can I see how much we made in Q3?"* -> AI matches intent to `quarterly_reports` item.
*   **Tool Selection**: If an AI Agent needs to "download a report", it knows this page contains that functionality.
