/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MetadataRegistry } from "./registry";
import { Driver } from "./driver";
import { ObjectConfig } from "./object";
import { ObjectQLPlugin } from "./plugin";

export interface ObjectQLConfig {
    registry?: MetadataRegistry;
    datasources?: Record<string, Driver>;
    /**
     * Optional connection string for auto-configuration.
     * e.g. "sqlite://dev.db", "postgres://localhost/db", "mongodb://localhost/db"
     */
    connection?: string;
    /**
     * Path(s) to the directory containing schema files (*.object.yml).
     */
    source?: string | string[];
    objects?: Record<string, ObjectConfig>;
    /**
     * @deprecated Use 'presets' instead.
     */
    packages?: string[];
    /**
     * @deprecated Use 'modules' instead.
     */
    presets?: string[];
    /**
     * List of modules to load.
     * Can be npm packages or local directories.
     */
    modules?: string[];
    /**
     * List of plugins to load. 
     * Can be an instance of ObjectQLPlugin or a package name string.
     */
    plugins?: (ObjectQLPlugin | string)[];
    /**
     * List of remote ObjectQL instances to connect to.
     * e.g. ["http://user-service:3000", "http://order-service:3000"]
     */
    remotes?: string[];
}
