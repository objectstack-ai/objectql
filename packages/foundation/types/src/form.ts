/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Form Metadata Definition
 * 
 * Defines the structure for forms, layouts, and field arrangements in ObjectQL.
 * Forms control how data is entered, edited, and displayed to users with
 * sections, tabs, columns, and conditional visibility.
 * 
 * Based on patterns from Salesforce Page Layouts, Dynamics Forms, and similar platforms.
 */

import { ValidationCondition } from './validation';

/**
 * Form types supported by ObjectQL
 */
export type FormType = 
    | 'create'          // Form for creating new records
    | 'edit'            // Form for editing existing records
    | 'view'            // Read-only view form
    | 'wizard'          // Multi-step wizard form
    | 'quick_create'    // Compact quick create form
    | 'inline'          // Inline editing form
    | 'custom';         // Custom form type

/**
 * Layout types for form arrangement
 */
export type FormLayoutType = 
    | 'single_column'   // Single column layout
    | 'two_column'      // Two column layout
    | 'three_column'    // Three column layout
    | 'tabs'            // Tab-based layout
    | 'accordion'       // Accordion sections
    | 'custom';         // Custom layout

/**
 * Field display configuration in form
 */
export interface FormField {
    /** Field name */
    name: string;
    
    /** Display label (overrides field config) */
    label?: string;
    
    /** Help text (overrides field config) */
    help_text?: string;
    
    /** Placeholder text */
    placeholder?: string;
    
    /** Whether field is required in this form */
    required?: boolean;
    
    /** Whether field is readonly in this form */
    readonly?: boolean;
    
    /** Whether field is hidden in this form */
    hidden?: boolean;
    
    /** Field width in columns (for multi-column layouts) */
    width?: number;
    
    /** Span across columns */
    span?: number;
    
    /** Visibility condition */
    visible_when?: ValidationCondition | string;
    
    /** Enabled condition */
    enabled_when?: ValidationCondition | string;
    
    /** Default value override */
    default_value?: any;
    
    /** Field-specific validation override */
    validation?: any;
    
    /** Custom CSS class */
    class_name?: string;
    
    /** Field-specific configuration */
    config?: Record<string, any>;
}

/**
 * Form section configuration
 */
export interface FormSection {
    /** Section identifier */
    id?: string;
    
    /** Section label */
    label?: string;
    
    /** Section description */
    description?: string;
    
    /** Number of columns in this section */
    columns?: number;
    
    /** Fields in this section */
    fields: (string | FormField)[];
    
    /** Whether section is collapsible */
    collapsible?: boolean;
    
    /** Default collapsed state */
    collapsed?: boolean;
    
    /** Visibility condition */
    visible_when?: ValidationCondition | string;
    
    /** Section border style */
    border?: boolean;
    
    /** Section background color */
    background?: string;
    
    /** Custom CSS class */
    class_name?: string;
}

/**
 * Form tab configuration
 */
export interface FormTab {
    /** Tab identifier */
    id: string;
    
    /** Tab label */
    label: string;
    
    /** Tab icon */
    icon?: string;
    
    /** Sections within this tab */
    sections: FormSection[];
    
    /** Visibility condition */
    visible_when?: ValidationCondition | string;
    
    /** Badge/count to display on tab */
    badge?: string | number;
    
    /** Whether this tab is disabled */
    disabled?: boolean;
}

/**
 * Wizard step configuration
 */
export interface WizardStep {
    /** Step identifier */
    id: string;
    
    /** Step label */
    label: string;
    
    /** Step description */
    description?: string;
    
    /** Icon for step */
    icon?: string;
    
    /** Sections in this step */
    sections: FormSection[];
    
    /** Validation to pass before proceeding */
    validation?: ValidationCondition;
    
    /** Whether user can skip this step */
    skippable?: boolean;
    
    /** Visibility condition */
    visible_when?: ValidationCondition | string;
    
    /** Action to execute when step is completed */
    on_complete?: string;
}

/**
 * Form action/button configuration
 */
export interface FormAction {
    /** Action identifier */
    name: string;
    
    /** Display label */
    label: string;
    
    /** Button type */
    type?: 'submit' | 'cancel' | 'custom' | 'save' | 'save_new' | 'save_close';
    
    /** Icon */
    icon?: string;
    
    /** Button style variant */
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    
    /** Position */
    position?: 'header' | 'footer' | 'both';
    
    /** Confirmation message before executing */
    confirm?: string;
    
    /** Visibility condition */
    visible_when?: ValidationCondition | string;
    
    /** Enabled condition */
    enabled_when?: ValidationCondition | string;
    
    /** Custom action handler */
    handler?: string;
    
    /** Navigate to path after action */
    redirect?: string;
}

/**
 * Form validation configuration
 */
export interface FormValidationConfig {
    /** Enable real-time validation */
    realtime?: boolean;
    
    /** Validate on blur */
    validate_on_blur?: boolean;
    
    /** Validate on change */
    validate_on_change?: boolean;
    
    /** Show validation summary */
    show_summary?: boolean;
    
    /** Custom validation rules */
    rules?: any[];
}

/**
 * Form header configuration
 */
export interface FormHeader {
    /** Show header */
    show?: boolean;
    
    /** Header title */
    title?: string;
    
    /** Header subtitle */
    subtitle?: string;
    
    /** Show record info (created, updated dates) */
    show_record_info?: boolean;
    
    /** Custom header component */
    component?: string;
}

/**
 * Form footer configuration
 */
export interface FormFooter {
    /** Show footer */
    show?: boolean;
    
    /** Footer actions */
    actions?: FormAction[];
    
    /** Footer position */
    position?: 'sticky' | 'static';
    
    /** Custom footer component */
    component?: string;
}

/**
 * Form autosave configuration
 */
export interface FormAutosaveConfig {
    /** Enable autosave */
    enabled: boolean;
    
    /** Autosave interval in milliseconds */
    interval?: number;
    
    /** Show autosave indicator */
    show_indicator?: boolean;
    
    /** Autosave on field blur */
    on_blur?: boolean;
}

/**
 * Complete form configuration
 */
export interface FormConfig {
    /** Unique form identifier */
    name: string;
    
    /** Display label */
    label: string;
    
    /** Form type */
    type?: FormType;
    
    /** Object this form is for */
    object: string;
    
    /** Form description */
    description?: string;
    
    /** Layout type */
    layout: FormLayoutType;
    
    /** Number of columns (for column layouts) */
    columns?: number;
    
    /** Sections (for non-tab layouts) */
    sections?: FormSection[];
    
    /** Tabs (for tab layout) */
    tabs?: FormTab[];
    
    /** Wizard steps (for wizard layout) */
    steps?: WizardStep[];
    
    /** Form header */
    header?: FormHeader;
    
    /** Form footer */
    footer?: FormFooter;
    
    /** Form actions/buttons */
    actions?: FormAction[];
    
    /** Validation configuration */
    validation?: FormValidationConfig;
    
    /** Autosave configuration */
    autosave?: FormAutosaveConfig;
    
    /** Show required field indicator */
    show_required_indicator?: boolean;
    
    /** Show field help text */
    show_help_text?: boolean;
    
    /** Compact mode (reduced spacing) */
    compact?: boolean;
    
    /** Read-only mode */
    readonly?: boolean;
    
    /** Disable all fields */
    disabled?: boolean;
    
    /** Show success message after save */
    success_message?: string;
    
    /** Redirect after successful save */
    redirect_on_success?: string;
    
    /** Access control */
    permissions?: {
        /** Roles that can view this form */
        view?: string[];
        /** Roles that can edit using this form */
        edit?: string[];
    };
    
    /** Custom form handler */
    handler?: string;
    
    /** Custom CSS class */
    class_name?: string;
    
    /** Form width (for modal forms) */
    width?: string;
    
    /** Maximum width */
    max_width?: string;
    
    /** Custom form configuration */
    config?: Record<string, any>;
    
    /** AI context for form generation */
    ai_context?: {
        /** Purpose of this form */
        intent?: string;
        /** User experience goals */
        ux_goals?: string[];
        /** Field organization strategy */
        organization_strategy?: string;
    };
}

/**
 * Lightweight form reference
 * Used in navigation, dropdowns, and form selectors
 */
export interface FormReference {
    /** Form name/identifier */
    name: string;
    
    /** Display label */
    label?: string;
    
    /** Form type */
    type?: FormType;
    
    /** Whether this is the default form */
    is_default?: boolean;
}

/**
 * Dynamic form state (runtime)
 */
export interface FormState {
    /** Current form values */
    values: Record<string, any>;
    
    /** Field errors */
    errors: Record<string, string>;
    
    /** Touched fields */
    touched: Record<string, boolean>;
    
    /** Whether form is submitting */
    submitting: boolean;
    
    /** Whether form is valid */
    valid: boolean;
    
    /** Whether form is dirty (has changes) */
    dirty: boolean;
    
    /** Current wizard step (for wizard forms) */
    current_step?: number;
    
    /** Custom state */
    custom?: Record<string, any>;
}
