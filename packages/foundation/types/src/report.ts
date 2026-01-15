/**
 * Report Metadata Definition
 * 
 * Defines the structure for reports, data summaries, and analytics in ObjectQL.
 * Reports aggregate and visualize data from objects with grouping, filtering, and calculations.
 * 
 * Based on patterns from Salesforce Reports, Tableau, and similar BI platforms.
 */

import { ViewFilter, ViewFilterGroup, ViewColumn } from './view';

/**
 * Types of reports supported by ObjectQL
 */
export type ReportType = 
    | 'tabular'         // Simple table report
    | 'summary'         // Grouped summary report
    | 'matrix'          // Two-dimensional matrix/pivot report
    | 'chart'           // Chart/visualization report
    | 'dashboard'       // Combined dashboard report
    | 'custom';         // Custom report type

/**
 * Chart types for visualization
 */
export type ChartType = 
    | 'bar'             // Bar chart
    | 'column'          // Column chart
    | 'line'            // Line chart
    | 'area'            // Area chart
    | 'pie'             // Pie chart
    | 'donut'           // Donut chart
    | 'scatter'         // Scatter plot
    | 'bubble'          // Bubble chart
    | 'funnel'          // Funnel chart
    | 'gauge'           // Gauge/meter chart
    | 'radar'           // Radar/spider chart
    | 'heatmap'         // Heatmap
    | 'treemap'         // Treemap
    | 'waterfall'       // Waterfall chart
    | 'custom';         // Custom chart type

/**
 * Aggregation functions for report calculations
 */
export type AggregationFunction = 
    | 'count'           // Count of records
    | 'sum'             // Sum of values
    | 'avg'             // Average of values
    | 'min'             // Minimum value
    | 'max'             // Maximum value
    | 'median'          // Median value
    | 'mode'            // Most frequent value
    | 'stddev'          // Standard deviation
    | 'variance'        // Variance
    | 'distinct_count'  // Count of distinct values
    | 'first'           // First value
    | 'last'            // Last value
    | 'custom';         // Custom aggregation

/**
 * Grouping configuration for reports
 */
export interface ReportGrouping {
    /** Field to group by */
    field: string;
    
    /** Display label */
    label?: string;
    
    /** Sort order for groups */
    sort?: 'asc' | 'desc';
    
    /** Group by date interval (for date fields) */
    date_interval?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    
    /** Group by numeric range (for numeric fields) */
    numeric_range?: {
        /** Range size */
        size: number;
        /** Starting value */
        start?: number;
    };
    
    /** Show subtotals for this grouping */
    show_subtotals?: boolean;
    
    /** Limit number of groups */
    limit?: number;
}

/**
 * Aggregation/calculation configuration
 */
export interface ReportAggregation {
    /** Field to aggregate */
    field: string;
    
    /** Aggregation function */
    function: AggregationFunction;
    
    /** Display label */
    label?: string;
    
    /** Display format */
    format?: string;
    
    /** Custom aggregation expression */
    expression?: string;
    
    /** Show in totals row */
    show_in_total?: boolean;
}

/**
 * Formula field for calculated columns
 */
export interface ReportFormula {
    /** Formula name */
    name: string;
    
    /** Display label */
    label?: string;
    
    /** Formula expression */
    expression: string;
    
    /** Data type of result */
    type?: 'number' | 'text' | 'date' | 'boolean';
    
    /** Display format */
    format?: string;
    
    /** Description of what this formula calculates */
    description?: string;
}

/**
 * Chart configuration for report visualization
 */
export interface ReportChartConfig {
    /** Chart type */
    type: ChartType;
    
    /** Chart title */
    title?: string;
    
    /** Field for X-axis */
    x_axis?: string;
    
    /** Field(s) for Y-axis */
    y_axis?: string | string[];
    
    /** Field for chart series/legend */
    series_field?: string;
    
    /** Chart colors */
    colors?: string[];
    
    /** Show legend */
    show_legend?: boolean;
    
    /** Legend position */
    legend_position?: 'top' | 'bottom' | 'left' | 'right';
    
    /** Show data labels */
    show_data_labels?: boolean;
    
    /** Chart height in pixels */
    height?: number;
    
    /** Chart width in pixels */
    width?: number;
    
    /** Enable drill-down */
    enable_drill_down?: boolean;
    
    /** Custom chart configuration */
    custom_config?: Record<string, any>;
}

/**
 * Matrix report dimension configuration
 */
export interface MatrixDimension {
    /** Field for this dimension */
    field: string;
    
    /** Display label */
    label?: string;
    
    /** Sort order */
    sort?: 'asc' | 'desc';
    
    /** Show totals */
    show_totals?: boolean;
}

/**
 * Export configuration for reports
 */
export interface ReportExportConfig {
    /** Enabled export formats */
    formats?: ('pdf' | 'xlsx' | 'csv' | 'json' | 'html')[];
    
    /** Include charts in export */
    include_charts?: boolean;
    
    /** Export filename template */
    filename_template?: string;
    
    /** Page orientation for PDF */
    page_orientation?: 'portrait' | 'landscape';
    
    /** Paper size for PDF */
    paper_size?: 'A4' | 'Letter' | 'Legal';
}

/**
 * Scheduling configuration for automated reports
 */
export interface ReportScheduleConfig {
    /** Enable scheduled execution */
    enabled: boolean;
    
    /** Cron expression for schedule */
    cron?: string;
    
    /** Timezone for schedule */
    timezone?: string;
    
    /** Email recipients for scheduled reports */
    recipients?: string[];
    
    /** Email subject template */
    email_subject?: string;
    
    /** Email body template */
    email_body?: string;
    
    /** Export format for scheduled report */
    format?: 'pdf' | 'xlsx' | 'csv';
}

/**
 * Complete report configuration
 */
export interface ReportConfig {
    /** Unique report identifier */
    name: string;
    
    /** Display label */
    label: string;
    
    /** Report type */
    type: ReportType;
    
    /** Primary object for the report */
    object: string;
    
    /** Report description */
    description?: string;
    
    /** Icon for the report */
    icon?: string;
    
    /** Columns to display */
    columns?: ViewColumn[];
    
    /** Filters to apply */
    filters?: (ViewFilter | ViewFilterGroup)[];
    
    /** Grouping configuration */
    groupings?: ReportGrouping[];
    
    /** Aggregations/calculations */
    aggregations?: ReportAggregation[];
    
    /** Formula fields */
    formulas?: ReportFormula[];
    
    /** Chart configuration */
    chart?: ReportChartConfig;
    
    /** Matrix report row dimension */
    row_dimension?: MatrixDimension;
    
    /** Matrix report column dimension */
    column_dimension?: MatrixDimension;
    
    /** Limit number of rows */
    limit?: number;
    
    /** Enable drill-down to records */
    enable_drill_down?: boolean;
    
    /** Show record count */
    show_record_count?: boolean;
    
    /** Show grand totals */
    show_grand_total?: boolean;
    
    /** Export configuration */
    export?: ReportExportConfig;
    
    /** Scheduling configuration */
    schedule?: ReportScheduleConfig;
    
    /** Cache configuration */
    cache?: {
        /** Enable caching */
        enabled?: boolean;
        /** Cache duration in seconds */
        duration?: number;
    };
    
    /** Access control */
    permissions?: {
        /** Roles that can view this report */
        view?: string[];
        /** Roles that can edit report configuration */
        edit?: string[];
        /** Roles that can export */
        export?: string[];
    };
    
    /** Whether this report is shared with all users */
    is_public?: boolean;
    
    /** Owner of the report (for personal reports) */
    owner?: string;
    
    /** Folder/category for organization */
    folder?: string;
    
    /** Custom report configuration */
    config?: Record<string, any>;
    
    /** AI context for report generation */
    ai_context?: {
        /** Business question this report answers */
        intent?: string;
        /** Target audience */
        audience?: string;
        /** Key insights to highlight */
        insights?: string[];
        /** Recommended visualizations */
        visualizations?: string[];
    };
}

/**
 * Report execution result
 */
export interface ReportResult {
    /** Report name */
    report_name: string;
    
    /** Execution timestamp */
    executed_at: string;
    
    /** Data rows */
    rows: any[];
    
    /** Total record count */
    total_count: number;
    
    /** Aggregation results */
    aggregations?: Record<string, any>;
    
    /** Grand totals */
    grand_total?: Record<string, any>;
    
    /** Chart data */
    chart_data?: any;
    
    /** Execution time in milliseconds */
    execution_time?: number;
    
    /** Whether result was from cache */
    from_cache?: boolean;
}

/**
 * Lightweight report reference
 * Used in navigation, dropdowns, and report selectors
 */
export interface ReportReference {
    /** Report name/identifier */
    name: string;
    
    /** Display label */
    label?: string;
    
    /** Icon */
    icon?: string;
    
    /** Report type */
    type?: ReportType;
    
    /** Folder/category */
    folder?: string;
}
