/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type MenuType = 'sidebar' | 'topnav' | 'context' | 'mobile' | 'admin';

export type MenuItemType = 'page' | 'section' | 'url' | 'folder' | 'object' | 'action';

export interface MenuItem {
    /**
     * Unique identifier for the menu item
     */
    name: string;

    /**
     * Display label
     */
    label: string;

    /**
     * Icon name
     */
    icon?: string;

    /**
     * Item type
     */
    type?: MenuItemType;

    /**
     * Navigation path (for type: page/url)
     */
    path?: string;

    /**
     * Associated Object name (for type: object)
     */
    object?: string;

    /**
     * Object View name (for type: object)
     */
    view?: string;

    /**
     * Nested menu items
     */
    items?: MenuItem[];

    /**
     * Link target (e.g. _blank)
     */
    target?: string;

    /**
     * Visibility condition
     */
    hidden?: boolean | string;

    /**
     * Badge value or expression
     */
    badge?: string;
    
    /**
     * Custom properties
     */
    [key: string]: any;
}

export interface MenuConfig {
    /**
     * Unique identifier for the menu
     */
    name: string;

    /**
     * Display label
     */
    label: string;

    /**
     * Menu type/location
     */
    type?: MenuType;

    /**
     * The application this menu belongs to
     */
    app?: string; 
    
    /**
     * Menu items
     */
    items: MenuItem[];
    
    /**
     * Whether the menu is active
     */
    is_active?: boolean;

    /**
     * Custom properties
     */
    [key: string]: any;
}
