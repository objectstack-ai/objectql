/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';
import { ValidatorPlugin } from '@objectql/plugin-validator';

export default {
    // NOTE: keep `datasource` (singular) for CLI compatibility
    // The CLI will normalize it into a driver at runtime.
    datasource: {
        default: {
            type: 'sqlite',
            filename: 'objectos.db'
        }
    },
    // Runtime plugins (instances only)
    plugins: [
        new ObjectQLSecurityPlugin({
            enableAudit: false
        }),
        new ValidatorPlugin()
    ]
};
