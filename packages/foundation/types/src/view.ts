/**
 * View Metadata Definition
 * 
 * Defines the structure for list views, grid views, and other data visualization views
 * in ObjectQL applications. Views define how data from objects is displayed to users
 * including columns, filters, sorting, and available actions.
 * 
 * Based on common patterns from Salesforce List Views, Airtable Views, and similar platforms.
 */

import { ValidationOperator } from './validation';

/**
 * Types of views supported by ObjectQL
 */
export type ViewType = 
    | 'list'           // Standard list/table view
    | 'kanban'         // Kanban board view
    | 'calendar'       // Calendar view
    | 'timeline'       // Timeline/Gantt view
    | 'gallery'        // Card/gallery view
    | 'map'            // Map/location view
    | 'pivot'          // Pivot table view
    | 'custom';        // Custom view type

/**
 * Column configuration for a view
 */
export interface ViewColumn {
    /** Field name to display */
    field: string;
    /** Display label (defaults to field label) */
    label?: string;
    /** Column width in pixels */
    width?: number;
    /** Whether this column is visible by default */
    visible?: boolean;
    /** Whether this column is sortable */
    sortable?: boolean;
    /** Whether this column is filterable */
    filterable?: boolean;
    /** Display format (date, currency, percent, etc.) */
    format?: string;
    /** Whether to display as a badge/chip */
    badge?: boolean;
    /** Custom template for rendering */
    template?: string;
    /** Alignment (left, center, right) */
    align?: 'left' | 'center' | 'right';
    /** Whether this column is frozen/pinned */
    frozen?: boolean;
    /** Truncate text after N characters */
    truncate?: number;
    /** Tooltip configuration */
    tooltip?: string | {
        field?: string;
        template?: string;
    };
}

/**
 * Filter condition for a view
 */
export interface ViewFilter {
    /** Field to filter on */
    field: string;
    /** Comparison operator */
    operator: ValidationOperator | 'is_null' | 'is_not_null';
    /** Value to compare against */
    value?: any;
    /** Multiple values (for 'in' operator) */
    values?: any[];
    /** Label for this filter (for UI) */
    label?: string;
}

/**
 * Logical grouping of filters
 */
export interface ViewFilterGroup {
    /** Logical operator */
    operator: 'and' | 'or';
    /** Filters in this group */
    filters: (ViewFilter | ViewFilterGroup)[];
}

/**
 * Sort configuration for a view
 */
export interface ViewSort {
    /** Field to sort by */
    field: string;
    /** Sort direction */
    direction: 'asc' | 'desc';
}

/**
 * Action available in the view
 */
export interface ViewAction {
    /** Action name/identifier */
    name: string;
    /** Display label */
    label?: string;
    /** Icon */
    icon?: string;
    /** Action type */
    type?: 'standard' | 'custom';
    /** Confirmation message before executing */
    confirm?: string;
    /** Visibility condition */
    visible_when?: string;
    /** Enabled condition */
    enabled_when?: string;
}

/**
 * Grouping configuration for a view
 */
export interface ViewGrouping {
    /** Field to group by */
    field: string;
    /** Display label for the group */
    label?: string;
    /** Sort order within groups */
    sort?: 'asc' | 'desc';
    /** Whether groups are collapsed by default */
    collapsed?: boolean;
}

/**
 * Pagination configuration
 */
export interface ViewPagination {
    /** Enable pagination */
    enabled: boolean;
    /** Default page size */
    page_size?: number;
    /** Available page size options */
    page_size_options?: number[];
}

/**
 * Kanban view specific configuration
 */
export interface KanbanViewConfig {
    /** Field to use for columns (status field) */
    column_field: string;
    /** Field to use for card title */
    title_field: string;
    /** Field to use for card subtitle */
    subtitle_field?: string;
    /** Additional fields to display on card */
    card_fields?: string[];
    /** Field to use for card color */
    color_field?: string;
    /** Field to use for card avatar/image */
    avatar_field?: string;
    /** Enable drag and drop */
    enable_drag_drop?: boolean;
}

/**
 * Calendar view specific configuration
 */
export interface CalendarViewConfig {
    /** Field to use for event start date */
    start_date_field: string;
    /** Field to use for event end date */
    end_date_field?: string;
    /** Field to use for event title */
    title_field: string;
    /** Field to use for event color */
    color_field?: string;
    /** Default view mode (day, week, month) */
    default_mode?: 'day' | 'week' | 'month' | 'year';
    /** Enable all-day events */
    all_day_field?: string;
}

/**
 * Timeline view specific configuration
 */
export interface TimelineViewConfig {
    /** Field to use for task start */
    start_field: string;
    /** Field to use for task end */
    end_field: string;
    /** Field to use for task name */
    name_field: string;
    /** Field to use for progress percentage */
    progress_field?: string;
    /** Field to use for dependencies */
    dependencies_field?: string;
    /** Enable drag to resize */
    enable_resize?: boolean;
    /** Enable drag to move */
    enable_move?: boolean;
}

/**
 * Gallery view specific configuration
 */
export interface GalleryViewConfig {
    /** Field to use for card image */
    image_field: string;
    /** Field to use for card title */
    title_field: string;
    /** Field to use for card description */
    description_field?: string;
    /** Number of columns */
    columns?: number;
    /** Card aspect ratio */
    aspect_ratio?: string;
}

/**
 * Map view specific configuration
 */
export interface MapViewConfig {
    /** Field containing location data */
    location_field: string;
    /** Field to use for marker title */
    title_field: string;
    /** Field to use for marker description */
    description_field?: string;
    /** Default map center [latitude, longitude] */
    center?: [number, number];
    /** Default zoom level */
    zoom?: number;
    /** Enable clustering */
    enable_clustering?: boolean;
}

/**
 * Complete view configuration
 */
export interface ViewConfig {
    /** Unique view identifier */
    name: string;
    /** Display label */
    label: string;
    /** Object this view applies to */
    object: string;
    /** View description */
    description?: string;
    /** View type */
    type?: ViewType;
    /** Icon for the view */
    icon?: string;
    
    /** Columns to display (for list views) */
    columns?: ViewColumn[];
    
    /** Default filters */
    filters?: (ViewFilter | ViewFilterGroup)[];
    
    /** Default sorting */
    sort?: ViewSort[];
    
    /** Grouping configuration */
    grouping?: ViewGrouping;
    
    /** Pagination configuration */
    pagination?: ViewPagination;
    
    /** Maximum number of records to fetch */
    limit?: number;
    
    /** Available actions */
    actions?: ViewAction[];
    
    /** Enable search */
    enable_search?: boolean;
    
    /** Searchable fields */
    search_fields?: string[];
    
    /** Enable inline editing */
    enable_inline_edit?: boolean;
    
    /** Enable bulk selection */
    enable_bulk_select?: boolean;
    
    /** Enable export */
    enable_export?: boolean;
    
    /** Export formats */
    export_formats?: ('csv' | 'xlsx' | 'pdf' | 'json')[];
    
    /** Kanban-specific config */
    kanban?: KanbanViewConfig;
    
    /** Calendar-specific config */
    calendar?: CalendarViewConfig;
    
    /** Timeline-specific config */
    timeline?: TimelineViewConfig;
    
    /** Gallery-specific config */
    gallery?: GalleryViewConfig;
    
    /** Map-specific config */
    map?: MapViewConfig;
    
    /** Whether this is the default view */
    is_default?: boolean;
    
    /** Access control */
    permissions?: {
        /** Roles allowed to view */
        view?: string[];
        /** Roles allowed to edit view configuration */
        edit?: string[];
    };
    
    /** Whether the view is shared with all users */
    is_public?: boolean;
    
    /** Owner of the view (for personal views) */
    owner?: string;
    
    /** Custom view configuration */
    config?: Record<string, any>;
    
    /** AI context for view generation */
    ai_context?: {
        /** Purpose of this view */
        intent?: string;
        /** Target user role */
        persona?: string;
        /** Key insights to display */
        insights?: string[];
    };
}

/**
 * Lightweight view reference
 * Used in navigation, dropdowns, and view selectors
 */
export interface ViewReference {
    /** View name/identifier */
    name: string;
    /** Display label */
    label?: string;
    /** Icon */
    icon?: string;
    /** View type */
    type?: ViewType;
    /** Whether this is the default view */
    is_default?: boolean;
}
