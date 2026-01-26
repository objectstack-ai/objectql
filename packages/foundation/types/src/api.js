"use strict";
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_API_ROUTES = exports.ObjectQLError = exports.ApiErrorCode = void 0;
exports.resolveApiRoutes = resolveApiRoutes;
// ============================================================================
// Error Handling Types
// ============================================================================
/**
 * Standardized error codes for ObjectQL API responses
 */
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ApiErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ApiErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ApiErrorCode["CONFLICT"] = "CONFLICT";
    ApiErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ApiErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
/**
 * ObjectQL Error class for throwing structured errors
 */
class ObjectQLError extends Error {
    constructor(error) {
        super(error.message);
        this.name = 'ObjectQLError';
        this.code = error.code;
        this.details = error.details;
        // Preserve proper stack traces in Node.js environments
        const ErrorConstructor = Error;
        if (typeof ErrorConstructor.captureStackTrace === 'function') {
            ErrorConstructor.captureStackTrace(this, ObjectQLError);
        }
    }
}
exports.ObjectQLError = ObjectQLError;
/**
 * Default API route configuration
 */
exports.DEFAULT_API_ROUTES = {
    rpc: '/api/objectql',
    data: '/api/data',
    metadata: '/api/metadata',
    files: '/api/files'
};
/**
 * Resolve API route configuration by merging user config with defaults
 * All paths are normalized to start with '/'
 */
function resolveApiRoutes(config) {
    var _a, _b, _c, _d;
    const normalizePath = (path) => path.startsWith('/') ? path : `/${path}`;
    return {
        rpc: normalizePath((_a = config === null || config === void 0 ? void 0 : config.rpc) !== null && _a !== void 0 ? _a : exports.DEFAULT_API_ROUTES.rpc),
        data: normalizePath((_b = config === null || config === void 0 ? void 0 : config.data) !== null && _b !== void 0 ? _b : exports.DEFAULT_API_ROUTES.data),
        metadata: normalizePath((_c = config === null || config === void 0 ? void 0 : config.metadata) !== null && _c !== void 0 ? _c : exports.DEFAULT_API_ROUTES.metadata),
        files: normalizePath((_d = config === null || config === void 0 ? void 0 : config.files) !== null && _d !== void 0 ? _d : exports.DEFAULT_API_ROUTES.files)
    };
}
//# sourceMappingURL=api.js.map