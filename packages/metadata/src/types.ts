export type FieldType = 
    | 'text' 
    | 'textarea' 
    | 'markdown'
    | 'html' 
    | 'select' 
    | 'date' 
    | 'datetime' 
    | 'time'
    | 'number' 
    | 'currency' 
    | 'percent'
    | 'boolean' 
    | 'email'
    | 'phone'
    | 'url'
    | 'image'
    | 'file'
    | 'avatar'
    | 'location'
    | 'lookup' 
    | 'master_detail'  
    | 'password'
    | 'formula'
    | 'summary'
    | 'auto_number'
    | 'object'
    | 'grid';

export interface FieldOption {
    label: string;
    value: string | number;
}

export interface FieldConfig {
    name?: string;
    label?: string;
    type: FieldType;
    required?: boolean;
    unique?: boolean;
    readonly?: boolean;
    hidden?: boolean;
    defaultValue?: any;
    help_text?: string;
    multiple?: boolean;
    
    // Validation
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    regex?: string;

    options?: FieldOption[] | string[];
    scale?: number;
    precision?: number;
    rows?: number;

    reference_to?: string;
    
    // Formula
    expression?: string;
    data_type?: 'text' | 'boolean' | 'date' | 'datetime' | 'number' | 'currency' | 'percent';

    // Summary
    summary_object?: string;
    summary_type?: 'count' | 'sum' | 'min' | 'max' | 'avg';
    summary_field?: string;
    summary_filters?: any[] | string;

    // Auto Number
    auto_number_format?: string;

    searchable?: boolean;
    sortable?: boolean;
    index?: boolean;
    description?: string;
    
    /**
     * Whether this field can be modified or deleted.
     * System fields (e.g., _id, createdAt, updatedAt) should be marked as non-customizable.
     * Defaults to true for user-defined fields.
     */
    customizable?: boolean;
}

export interface ActionConfig {
    label?: string;
    description?: string;
    handler?: Function;
    result?: unknown;
}

export interface ObjectConfig {
    name: string;
    label?: string;
    description?: string;
    icon?: string;
    /** Base ID this object belongs to (optional, for Base layer support) */
    baseId?: string;
    fields?: Record<string, FieldConfig>;
    methods?: Record<string, Function>;
    listeners?: Record<string, Function>;
    actions?: Record<string, ActionConfig>;
    data?: any[];
    
    /**
     * Whether this object can be modified or deleted.
     * System objects (e.g., user, session, account) should be marked as non-customizable.
     * Defaults to true for user-defined objects.
     */
    customizable?: boolean;
}

/**
 * Menu item configuration for app interfaces.
 * Similar to Airtable's interface menu structure.
 */
export interface AppMenuItem {
    /** Unique identifier for the menu item */
    id?: string;
    /** **Required.** Display label for the menu item */
    label: string;
    /** Icon identifier (e.g., remixicon class name like 'ri-home-line') */
    icon?: string;
    /** Type of menu item. Default: 'page' */
    type?: 'object' | 'page' | 'url' | 'divider';
    /** Reference to an object name (for type: 'object') */
    object?: string;
    /** URL path (for type: 'url' or 'page') */
    url?: string;
    /** Badge text or count to display */
    badge?: string | number;
    /** Whether this item is visible. Default: true */
    visible?: boolean;
    /** Nested sub-menu items */
    items?: AppMenuItem[];
}

/**
 * Menu section/group configuration for organizing menu items.
 */
export interface AppMenuSection {
    /** Section title/label */
    label?: string;
    /** **Required.** Menu items in this section. */
    items: AppMenuItem[];
    /** Whether this section is collapsible. Default: false */
    collapsible?: boolean;
    /** Whether this section is collapsed by default. Default: false */
    collapsed?: boolean;
}

/**
 * Type guard to check if a menu entry is a section vs a direct menu item.
 * A section has an 'items' array and lacks menu item-specific properties like 'type', 'object', or 'url'.
 * It may also have section-specific properties like 'collapsible' or 'collapsed'.
 */
export function isAppMenuSection(entry: AppMenuSection | AppMenuItem): entry is AppMenuSection {
    return 'items' in entry && 
           Array.isArray(entry.items) && 
           !('type' in entry) && 
           !('object' in entry) && 
           !('url' in entry);
}

/**
 * App configuration metadata.
 * Represents an application or interface with its own menu structure.
 */
export interface AppConfig {
    /** Unique identifier or code for the app */
    id?: string;
    /** App name. Unique identifier for the app, default to id if not specified. */
    name: string;
    /** App code/slug (Legacy, use name or id) */
    code?: string;
    /** **Required.** Display name of the app. */
    label: string;
    /** Description of the app's purpose. */
    description?: string;
    /** Icon identifier (e.g., `ri-dashboard-line`). */
    icon?: string;
    /** Color theme for the app (e.g., `blue`, `gray`). */
    color?: string;
    /** Whether to use dark mode by default. */
    dark?: boolean;
    /** Base ID this app belongs to (optional, for Base layer support) */
    baseId?: string;
    /** 
     * Left-side navigation menu configuration.
     * Can be either:
     * - An array of menu sections (recommended for organized menus with groups)
     * - An array of menu items (for simple flat menus)
     * 
     * Use the `isAppMenuSection()` type guard to distinguish between them at runtime.
     */
    menu?: AppMenuSection[] | AppMenuItem[];
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ChartConfig {
    name: string;
    label?: string;
    description?: string;
    type: ChartType;
    object: string;
    xAxisKey: string;
    yAxisKeys: string[];
    height?: number;
    colors?: string[];
    showGrid?: boolean;
    showLegend?: boolean;
    showTooltip?: boolean;
    filters?: any[];
    sort?: [string, 'asc' | 'desc'][];
}

export type PageLayoutType = 'grid' | 'flex' | 'stack' | 'tabs';

export interface PageComponent {
    type: string;
    props?: Record<string, any>;
    children?: PageComponent[];
}

export interface PageConfig {
    name: string;
    label?: string;
    description?: string;
    icon?: string;
    layout?: PageLayoutType;
    components?: PageComponent[];
    settings?: Record<string, any>;
}


