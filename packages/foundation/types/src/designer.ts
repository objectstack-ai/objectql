/**
 * Designer Metadata Definitions
 * 
 * Provides dedicated designer configurations for building forms and page layouts.
 * Separates the design-time experience from runtime metadata, making it easier
 * for AI agents and UI tools to create user-friendly interfaces.
 * 
 * This module addresses the need for specialized, user-friendly designers by:
 * - Separating design concerns from runtime concerns
 * - Providing intuitive, purpose-built configuration options
 * - Enabling visual design tools and AI-assisted generation
 */

import { FormConfig, FormSection, FormField, FormAction } from './form';
import { PageConfig, PageComponent, ComponentStyle } from './page';
import { ValidationCondition } from './validation';

/**
 * Design palette for consistent theming across designers
 */
export interface DesignPalette {
    /** Primary brand color */
    primary?: string;
    /** Secondary brand color */
    secondary?: string;
    /** Accent color */
    accent?: string;
    /** Success state color */
    success?: string;
    /** Warning state color */
    warning?: string;
    /** Error state color */
    error?: string;
    /** Info state color */
    info?: string;
    /** Background colors */
    background?: {
        primary?: string;
        secondary?: string;
        tertiary?: string;
    };
    /** Text colors */
    text?: {
        primary?: string;
        secondary?: string;
        disabled?: string;
    };
    /** Border colors */
    border?: {
        light?: string;
        medium?: string;
        dark?: string;
    };
}

/**
 * Design spacing system for consistent layouts
 */
export interface DesignSpacing {
    /** Extra small spacing (e.g., 4px) */
    xs?: string;
    /** Small spacing (e.g., 8px) */
    sm?: string;
    /** Medium spacing (e.g., 16px) */
    md?: string;
    /** Large spacing (e.g., 24px) */
    lg?: string;
    /** Extra large spacing (e.g., 32px) */
    xl?: string;
    /** Extra extra large spacing (e.g., 48px) */
    xxl?: string;
}

/**
 * Design typography system
 */
export interface DesignTypography {
    /** Font family */
    font_family?: string;
    /** Base font size */
    base_size?: string;
    /** Font sizes */
    sizes?: {
        xs?: string;
        sm?: string;
        md?: string;
        lg?: string;
        xl?: string;
        xxl?: string;
    };
    /** Font weights */
    weights?: {
        light?: number;
        regular?: number;
        medium?: number;
        semibold?: number;
        bold?: number;
    };
}

/**
 * Shared design system configuration
 */
export interface DesignSystem {
    /** Color palette */
    palette?: DesignPalette;
    /** Spacing system */
    spacing?: DesignSpacing;
    /** Typography system */
    typography?: DesignTypography;
    /** Border radius values */
    border_radius?: {
        none?: string;
        sm?: string;
        md?: string;
        lg?: string;
        full?: string;
    };
    /** Shadow definitions */
    shadows?: {
        none?: string;
        sm?: string;
        md?: string;
        lg?: string;
        xl?: string;
    };
}

/**
 * Field grouping strategy for form designer
 */
export type FormDesignerGroupingStrategy =
    | 'by_type'           // Group fields by data type
    | 'by_section'        // Group by logical sections
    | 'by_frequency'      // Group by usage frequency
    | 'alphabetical'      // Sort alphabetically
    | 'custom';           // Custom grouping

/**
 * Form field with design-time metadata
 */
export interface FormDesignerField extends FormField {
    /** Design-time category for organization */
    category?: string;
    /** Weight for automatic ordering (higher = more important) */
    weight?: number;
    /** Suggested placement hints */
    placement_hints?: {
        /** Preferred column in multi-column layout */
        preferred_column?: number;
        /** Should this field be prominent? */
        prominent?: boolean;
        /** Should this field be in a separate section? */
        separate_section?: boolean;
    };
    /** AI generation hints */
    ai_hints?: {
        /** Field importance (0-1) */
        importance?: number;
        /** Related fields that should be nearby */
        related_fields?: string[];
        /** Common user tasks involving this field */
        common_tasks?: string[];
    };
}

/**
 * Form section with design-time metadata
 */
export interface FormDesignerSection extends FormSection {
    /** Section priority for ordering */
    priority?: number;
    /** Recommended icon */
    icon?: string;
    /** Section category */
    category?: string;
    /** Whether section should be emphasized */
    emphasized?: boolean;
}

/**
 * Form Designer Configuration
 * 
 * Specialized configuration for designing forms with enhanced UX features.
 * Separates design concerns from runtime form configuration.
 */
export interface FormDesignerConfig {
    /** Unique designer identifier */
    name: string;
    
    /** Display label for the designer */
    label: string;
    
    /** Designer description */
    description?: string;
    
    /** Target object for this form */
    object: string;
    
    /** Form type being designed */
    form_type?: 'create' | 'edit' | 'view' | 'wizard' | 'quick_create' | 'inline';
    
    /** Design intent (what is this form for?) */
    intent?: string;
    
    /** Target user persona */
    persona?: string;
    
    /** Available fields with design metadata */
    available_fields: FormDesignerField[];
    
    /** Recommended field grouping strategy */
    grouping_strategy?: FormDesignerGroupingStrategy;
    
    /** Designed sections */
    sections?: FormDesignerSection[];
    
    /** Design system to apply */
    design_system?: DesignSystem;
    
    /** Suggested number of columns */
    suggested_columns?: number;
    
    /** Form width constraints */
    width_constraints?: {
        min?: string;
        max?: string;
        default?: string;
    };
    
    /** Accessibility requirements */
    accessibility?: {
        /** ARIA labels strategy */
        aria_labels?: 'auto' | 'manual';
        /** Keyboard navigation support */
        keyboard_nav?: boolean;
        /** Screen reader optimization */
        screen_reader?: boolean;
        /** High contrast mode support */
        high_contrast?: boolean;
    };
    
    /** Validation UX preferences */
    validation_ux?: {
        /** When to show validation errors */
        show_errors?: 'on_blur' | 'on_change' | 'on_submit';
        /** Error display style */
        error_style?: 'inline' | 'tooltip' | 'summary';
        /** Success indicators */
        show_success?: boolean;
    };
    
    /** Auto-save configuration */
    auto_save?: {
        /** Enable auto-save */
        enabled?: boolean;
        /** Save interval in seconds */
        interval?: number;
        /** Save strategy */
        strategy?: 'debounce' | 'throttle' | 'on_blur';
    };
    
    /** Progressive disclosure settings */
    progressive_disclosure?: {
        /** Enable progressive disclosure */
        enabled?: boolean;
        /** Show advanced fields by default */
        show_advanced?: boolean;
        /** Field complexity threshold (0-1) */
        complexity_threshold?: number;
    };
    
    /** Mobile optimization */
    mobile_optimization?: {
        /** Enable mobile-specific layout */
        enabled?: boolean;
        /** Stack fields on mobile */
        stack_fields?: boolean;
        /** Larger touch targets */
        large_targets?: boolean;
    };
    
    /** Form actions */
    actions?: FormAction[];
    
    /** AI generation context */
    ai_context?: {
        /** User tasks this form should support */
        user_tasks?: string[];
        /** Common data patterns */
        data_patterns?: string[];
        /** Field dependencies */
        dependencies?: Array<{
            field: string;
            depends_on: string[];
            condition?: ValidationCondition;
        }>;
        /** Suggested validation rules */
        suggested_validations?: string[];
    };
    
    /** Output configuration */
    output?: {
        /** Generated form config */
        form_config?: FormConfig;
        /** Export format preferences */
        export_format?: 'yaml' | 'json' | 'typescript';
        /** Include comments in export */
        include_comments?: boolean;
    };
}

/**
 * Page component placement in layout designer
 */
export interface LayoutDesignerComponent extends PageComponent {
    /** Component category for organization */
    category?: 'data' | 'visualization' | 'navigation' | 'container' | 'media' | 'custom';
    
    /** Component weight for importance */
    weight?: number;
    
    /** Placement constraints */
    constraints?: {
        /** Minimum width in grid units */
        min_width?: number;
        /** Minimum height in grid units */
        min_height?: number;
        /** Maximum width in grid units */
        max_width?: number;
        /** Maximum height in grid units */
        max_height?: number;
        /** Can this component be resized? */
        resizable?: boolean;
        /** Can this component be moved? */
        movable?: boolean;
    };
    
    /** Responsive behavior configuration */
    responsive_behavior?: {
        /** How should component adapt on mobile? */
        mobile_strategy?: 'hide' | 'stack' | 'collapse' | 'replace';
        /** Breakpoint-specific overrides */
        breakpoints?: {
            mobile?: Partial<PageComponent>;
            tablet?: Partial<PageComponent>;
            desktop?: Partial<PageComponent>;
        };
    };
    
    /** Data binding configuration */
    data_binding?: {
        /** Bind to page-level data source */
        source?: string;
        /** Field mappings */
        field_mappings?: Record<string, string>;
        /** Refresh strategy */
        refresh?: 'manual' | 'auto' | 'realtime';
    };
}

/**
 * Layout grid configuration for designer
 */
export interface LayoutGrid {
    /** Number of columns in the grid */
    columns: number;
    
    /** Number of rows (0 = infinite) */
    rows?: number;
    
    /** Grid cell width in pixels */
    cell_width?: number;
    
    /** Grid cell height in pixels */
    cell_height?: number;
    
    /** Spacing between grid items */
    gap?: string;
    
    /** Enable grid snapping */
    snap_to_grid?: boolean;
    
    /** Grid margin */
    margin?: string;
}

/**
 * Layout template for quick starts
 */
export interface LayoutTemplate {
    /** Template identifier */
    id: string;
    
    /** Template name */
    name: string;
    
    /** Template description */
    description?: string;
    
    /** Template preview image */
    preview?: string;
    
    /** Template category */
    category?: 'dashboard' | 'form' | 'detail' | 'list' | 'report' | 'custom';
    
    /** Pre-configured components */
    components: LayoutDesignerComponent[];
    
    /** Grid configuration */
    grid?: LayoutGrid;
    
    /** Suggested use cases */
    use_cases?: string[];
}

/**
 * Page Layout Designer Configuration
 * 
 * Specialized configuration for designing page layouts with drag-and-drop,
 * grid systems, and component libraries.
 */
export interface LayoutDesignerConfig {
    /** Unique designer identifier */
    name: string;
    
    /** Display label for the designer */
    label: string;
    
    /** Designer description */
    description?: string;
    
    /** Page being designed */
    page: string;
    
    /** Design intent (what is this page for?) */
    intent?: string;
    
    /** Target user persona */
    persona?: string;
    
    /** Layout grid configuration */
    grid: LayoutGrid;
    
    /** Available component palette */
    component_palette: {
        /** Component categories */
        categories?: Array<{
            id: string;
            label: string;
            components: LayoutDesignerComponent[];
        }>;
        /** All available components */
        components?: LayoutDesignerComponent[];
    };
    
    /** Pre-configured layout templates */
    templates?: LayoutTemplate[];
    
    /** Design system to apply */
    design_system?: DesignSystem;
    
    /** Canvas configuration */
    canvas?: {
        /** Canvas width */
        width?: string;
        /** Canvas height */
        height?: string;
        /** Background color */
        background?: string;
        /** Enable rulers */
        show_rulers?: boolean;
        /** Enable grid lines */
        show_grid?: boolean;
        /** Enable guides */
        show_guides?: boolean;
    };
    
    /** Responsive design settings */
    responsive?: {
        /** Enable responsive design mode */
        enabled?: boolean;
        /** Preview breakpoints */
        breakpoints?: Array<{
            name: string;
            width: number;
            height?: number;
        }>;
        /** Default preview breakpoint */
        default_breakpoint?: string;
    };
    
    /** Theme configuration */
    theme?: {
        /** Light/dark mode */
        mode?: 'light' | 'dark' | 'auto';
        /** Custom theme overrides */
        overrides?: Record<string, any>;
    };
    
    /** Collaboration features */
    collaboration?: {
        /** Enable real-time collaboration */
        realtime?: boolean;
        /** Show other users' cursors */
        show_cursors?: boolean;
        /** Enable comments */
        comments?: boolean;
    };
    
    /** Version control */
    versioning?: {
        /** Enable version history */
        enabled?: boolean;
        /** Auto-save versions */
        auto_save?: boolean;
        /** Version retention */
        retention_days?: number;
    };
    
    /** Export options */
    export?: {
        /** Supported export formats */
        formats?: ('yaml' | 'json' | 'html' | 'react' | 'vue')[];
        /** Include assets */
        include_assets?: boolean;
        /** Minify output */
        minify?: boolean;
    };
    
    /** AI assistance */
    ai_assistance?: {
        /** Enable AI suggestions */
        enabled?: boolean;
        /** Suggest component placements */
        suggest_placement?: boolean;
        /** Suggest color schemes */
        suggest_colors?: boolean;
        /** Suggest responsive breakpoints */
        suggest_breakpoints?: boolean;
    };
    
    /** Output configuration */
    output?: {
        /** Generated page config */
        page_config?: PageConfig;
        /** Export format */
        export_format?: 'yaml' | 'json' | 'typescript';
    };
}

/**
 * Designer state (runtime)
 * Tracks the current state of a designer session
 */
export interface DesignerState {
    /** Currently selected component/field */
    selected?: string | string[];
    
    /** Components/fields in clipboard */
    clipboard?: any[];
    
    /** Undo history */
    undo_stack?: any[];
    
    /** Redo history */
    redo_stack?: any[];
    
    /** Current zoom level */
    zoom?: number;
    
    /** Canvas pan position */
    pan?: {
        x: number;
        y: number;
    };
    
    /** Is designer in preview mode? */
    preview_mode?: boolean;
    
    /** Current breakpoint (for responsive design) */
    current_breakpoint?: string;
    
    /** Designer dirty flag */
    has_changes?: boolean;
    
    /** Last saved timestamp */
    last_saved?: string;
    
    /** Custom state */
    custom?: Record<string, any>;
}

/**
 * Designer action (for undo/redo)
 */
export interface DesignerAction {
    /** Action type */
    type: 'add' | 'remove' | 'update' | 'move' | 'resize' | 'style' | 'custom';
    
    /** Target element ID */
    target: string;
    
    /** Previous state (for undo) */
    previous?: any;
    
    /** New state (for redo) */
    next?: any;
    
    /** Timestamp */
    timestamp: string;
    
    /** User who performed the action */
    user?: string;
}

/**
 * Designer validation result
 */
export interface DesignerValidation {
    /** Is the design valid? */
    valid: boolean;
    
    /** Validation errors */
    errors?: Array<{
        /** Error code */
        code: string;
        /** Error message */
        message: string;
        /** Affected element */
        element?: string;
        /** Severity */
        severity?: 'error' | 'warning' | 'info';
    }>;
    
    /** Validation warnings */
    warnings?: Array<{
        /** Warning code */
        code: string;
        /** Warning message */
        message: string;
        /** Affected element */
        element?: string;
    }>;
    
    /** Suggestions for improvement */
    suggestions?: Array<{
        /** Suggestion message */
        message: string;
        /** Affected element */
        element?: string;
        /** Auto-fix available? */
        auto_fix?: boolean;
    }>;
}
