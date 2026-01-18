/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Page Metadata Definition
 * 
 * Defines the structure for pages in ObjectQL applications.
 * Inspired by low-code platforms like Airtable, Retool, Appsmith, and Salesforce Lightning.
 * 
 * Pages are composable UI containers that can render data from objects,
 * display custom components, and orchestrate user interactions.
 */

/**
 * Layout types for page arrangement
 */
export type PageLayoutType = 
    | 'single_column'      // Single vertical column
    | 'two_column'         // Left and right columns
    | 'three_column'       // Left, center, right columns
    | 'dashboard'          // Grid-based dashboard layout
    | 'canvas'             // Free-form canvas with absolute positioning
    | 'tabs'               // Tab-based layout
    | 'wizard'             // Step-by-step wizard
    | 'custom';            // Custom layout defined by component

/**
 * Component types that can be placed on a page
 */
export type PageComponentType =
    | 'data_grid'          // Table/grid displaying records
    | 'form'               // Data entry form
    | 'detail_view'        // Record detail display
    | 'chart'              // Visualization (bar, line, pie, etc.)
    | 'metric'             // Single metric/KPI display
    | 'list'               // List view of records
    | 'calendar'           // Calendar view
    | 'kanban'             // Kanban board
    | 'timeline'           // Timeline/Gantt chart
    | 'text'               // Static text/markdown content
    | 'html'               // Custom HTML content
    | 'iframe'             // Embedded external content
    | 'button'             // Action button
    | 'tabs'               // Tab container
    | 'container'          // Generic container for grouping
    | 'divider'            // Visual separator
    | 'image'              // Image display
    | 'custom';            // Custom component

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveConfig {
    /** Mobile viewport (< 640px) */
    mobile?: {
        columns?: number;
        visible?: boolean;
        order?: number;
    };
    /** Tablet viewport (640px - 1024px) */
    tablet?: {
        columns?: number;
        visible?: boolean;
        order?: number;
    };
    /** Desktop viewport (> 1024px) */
    desktop?: {
        columns?: number;
        visible?: boolean;
        order?: number;
    };
}

/**
 * Data source configuration for components
 */
export interface ComponentDataSource {
    /** Object name to query */
    object?: string;
    /** Filter conditions */
    filters?: any[];
    /** Fields to display */
    fields?: string[];
    /** Sort configuration */
    sort?: Array<[string, 'asc' | 'desc']>;
    /** Maximum records to fetch */
    limit?: number;
    /** Enable pagination */
    paginate?: boolean;
    /** Related objects to expand */
    expand?: Record<string, any>;
    /** Custom query override */
    query?: any;
}

/**
 * Action triggered by component interaction
 */
export interface ComponentAction {
    /** Action type */
    type: 'navigate' | 'open_modal' | 'run_action' | 'submit_form' | 'refresh' | 'custom';
    /** Navigation path (for type: navigate) */
    path?: string;
    /** Modal component to open (for type: open_modal) */
    modal?: string;
    /** Action name to execute (for type: run_action) */
    action?: string;
    /** Target object for action */
    object?: string;
    /** Custom handler function */
    handler?: string;
    /** Confirmation message before executing */
    confirm?: string;
    /** Success message after execution */
    success_message?: string;
    /** Error handling */
    on_error?: 'show_toast' | 'show_modal' | 'ignore';
}

/**
 * Styling configuration for components
 */
export interface ComponentStyle {
    /** Width (e.g., '100%', '300px', 'auto') */
    width?: string;
    /** Height */
    height?: string;
    /** Minimum width */
    min_width?: string;
    /** Minimum height */
    min_height?: string;
    /** Background color */
    background?: string;
    /** Text color */
    color?: string;
    /** Border */
    border?: string;
    /** Border radius */
    border_radius?: string;
    /** Padding */
    padding?: string;
    /** Margin */
    margin?: string;
    /** Custom CSS classes */
    class_name?: string;
    /** Inline styles */
    custom_css?: Record<string, any>;
}

/**
 * Base component configuration
 */
export interface PageComponent {
    /** Unique component identifier within the page */
    id: string;
    /** Component type */
    type: PageComponentType;
    /** Display label */
    label?: string;
    /** Component description */
    description?: string;
    
    /** Data source configuration */
    data_source?: ComponentDataSource;
    
    /** Component-specific configuration */
    config?: Record<string, any>;
    
    /** Actions triggered by this component */
    actions?: {
        on_click?: ComponentAction;
        on_submit?: ComponentAction;
        on_load?: ComponentAction;
        on_change?: ComponentAction;
        [key: string]: ComponentAction | undefined;
    };
    
    /** Visual styling */
    style?: ComponentStyle;
    
    /** Responsive behavior */
    responsive?: ResponsiveConfig;
    
    /** Visibility conditions */
    visible_when?: Record<string, any>;
    
    /** Access control */
    permissions?: string[];
    
    /** Nested components (for containers, tabs, etc.) */
    components?: PageComponent[];
    
    /** Grid position (for dashboard layout) */
    grid?: {
        x: number;
        y: number;
        w: number;  // width in grid units
        h: number;  // height in grid units
    };
    
    /** Custom component reference */
    component?: string;
}

/**
 * Page section/region configuration
 */
export interface PageSection {
    /** Section identifier */
    id: string;
    /** Section label */
    label?: string;
    /** Section type */
    type?: 'header' | 'sidebar' | 'content' | 'footer' | 'custom';
    /** Components in this section */
    components: PageComponent[];
    /** Section styling */
    style?: ComponentStyle;
    /** Collapsible section */
    collapsible?: boolean;
    /** Default collapsed state */
    collapsed?: boolean;
    /** Visibility conditions */
    visible_when?: Record<string, any>;
}

/**
 * Page metadata configuration
 */
export interface PageConfig {
    /** Unique page identifier */
    name: string;
    /** Display label */
    label: string;
    /** Page description */
    description?: string;
    /** Icon for navigation */
    icon?: string;
    
    /** Layout type */
    layout: PageLayoutType;
    
    /** Page sections */
    sections?: PageSection[];
    
    /** Components (alternative to sections for simple layouts) */
    components?: PageComponent[];
    
    /** Page-level data sources */
    data_sources?: Record<string, ComponentDataSource>;
    
    /** Page-level actions */
    actions?: Record<string, ComponentAction>;
    
    /** Page styling */
    style?: ComponentStyle;
    
    /** Access control */
    permissions?: {
        /** Roles allowed to view this page */
        view?: string[];
        /** Roles allowed to edit this page */
        edit?: string[];
    };
    
    /** SEO and metadata */
    meta?: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
    
    /** Page state management */
    state?: {
        /** Initial state values */
        initial?: Record<string, any>;
        /** State persistence */
        persist?: boolean;
        /** Storage key for persistence */
        storage_key?: string;
    };
    
    /** Responsive configuration */
    responsive?: ResponsiveConfig;
    
    /** Custom page handler/controller */
    handler?: string;
    
    /** Enable real-time updates */
    realtime?: boolean;
    
    /** Refresh interval in seconds */
    refresh_interval?: number;
    
    /** AI context for page generation and understanding */
    ai_context?: {
        /** Purpose of the page */
        intent?: string;
        /** Target user persona */
        persona?: string;
        /** Key user tasks */
        tasks?: string[];
    };
}

/**
 * Lightweight page reference (for menus, navigation, etc.)
 * 
 * Used in application navigation menus and links to reference pages
 * without loading the full page configuration. This is useful for:
 * - Building navigation menus
 * - Creating page links
 * - Page selection dropdowns
 * 
 * @example
 * ```typescript
 * // In navigation menu
 * const menuItem: PageReference = {
 *   name: 'dashboard',
 *   label: 'Dashboard',
 *   icon: 'dashboard',
 *   path: '/dashboard'
 * };
 * ```
 */
export interface PageReference {
    /** Page name/identifier */
    name: string;
    /** Display label */
    label?: string;
    /** Icon */
    icon?: string;
    /** Path/route */
    path?: string;
}
