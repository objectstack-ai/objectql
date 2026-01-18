/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface AppConfig {
    /**
     * Unique identifier for the application
     */
    name: string;
    
    /**
     * Display label for the application
     */
    label: string;
    
    /**
     * Description of what this application does
     */
    description?: string;
    
    /**
     * Icon name/class for the application
     */
    icon?: string;

    /**
     * URL to the application logo
     */
    logo?: string;

    /**
     * Default path to redirect when opening the app
     */
    homepage?: string;

    /**
     * Sort order for display
     */
    sort_no?: number;
    
    /**
     * Whether the application is enabled
     */
    is_active?: boolean;

    /**
     * Custom metadata/settings
     */
    [key: string]: any;
}
