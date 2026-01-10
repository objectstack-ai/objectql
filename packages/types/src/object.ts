import { FieldConfig } from './field';
import { ActionConfig } from './action';

export interface ObjectConfig {
    name: string;
    datasource?: string; // The name of the datasource to use
    label?: string;
    icon?: string;
    description?: string;
    
    fields: Record<string, FieldConfig>;
    actions?: Record<string, ActionConfig>;
}
