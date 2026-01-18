/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Driver } from '@objectql/types';

export function createDriverFromConnection(connection: string): Driver {
    let driverPackage = '';
    let driverClass = '';
    let driverConfig: any = {};
    
    if (connection.startsWith('mongodb://')) {
        driverPackage = '@objectql/driver-mongo';
        driverClass = 'MongoDriver';
        driverConfig = { url: connection };
    } 
    else if (connection.startsWith('sqlite://')) {
        driverPackage = '@objectql/driver-sql';
        driverClass = 'SqlDriver';
        const filename = connection.replace('sqlite://', '');
        driverConfig = {
            client: 'sqlite3',
            connection: { filename },
            useNullAsDefault: true
        };
    }
    else if (connection.startsWith('postgres://') || connection.startsWith('postgresql://')) {
        driverPackage = '@objectql/driver-sql';
        driverClass = 'SqlDriver';
        driverConfig = {
            client: 'pg',
            connection: connection
        };
    }
    else if (connection.startsWith('mysql://')) {
        driverPackage = '@objectql/driver-sql';
        driverClass = 'SqlDriver';
        driverConfig = {
            client: 'mysql2',
            connection: connection
        };
    }
    else {
        throw new Error(`Unsupported connection protocol: ${connection}`);
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require(driverPackage);
        const DriverClass = pkg[driverClass];
        if (!DriverClass) {
            throw new Error(`${driverClass} not found in ${driverPackage}`);
        }
        return new DriverClass(driverConfig);
    } catch (e: any) {
        throw new Error(`Failed to load driver ${driverPackage}. Please install it: npm install ${driverPackage}. Error: ${e.message}`);
    }
}
