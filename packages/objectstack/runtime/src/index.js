"use strict";
/**
 * @objectql/runtime
 * ObjectStack Runtime Types
 *
 * This package defines the runtime types for the ObjectStack ecosystem.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectStackRuntimeProtocol = exports.ObjectStackKernel = void 0;
// Import core modules for use in kernel
const metadata_1 = require("./metadata");
const hooks_1 = require("./hooks");
const actions_1 = require("./actions");
// Export core runtime modules
__exportStar(require("./metadata"), exports);
__exportStar(require("./hooks"), exports);
__exportStar(require("./actions"), exports);
/**
 * ObjectStack Kernel
 * The core runtime engine
 */
class ObjectStackKernel {
    constructor(plugins = []) {
        /** Query interface (QL) */
        this.ql = null;
        /** Registered plugins */
        this.plugins = [];
        this.plugins = plugins;
        this.metadata = new metadata_1.MetadataRegistry();
        this.hooks = new hooks_1.HookManager();
        this.actions = new actions_1.ActionManager();
    }
    /** Start the kernel */
    async start() {
        // Install all plugins
        for (const plugin of this.plugins) {
            if (plugin.install) {
                await plugin.install({ engine: this });
            }
        }
        // Start all plugins
        for (const plugin of this.plugins) {
            if (plugin.onStart) {
                await plugin.onStart({ engine: this });
            }
        }
    }
    /** Stop the kernel */
    async stop() {
        // Stop all plugins in reverse order
        for (let i = this.plugins.length - 1; i >= 0; i--) {
            const plugin = this.plugins[i];
            if (plugin.onStop) {
                await plugin.onStop({ engine: this });
            }
        }
    }
    /** Seed initial data */
    async seed() {
        // Stub implementation
    }
    /** Find records */
    async find(objectName, query) {
        return { value: [], count: 0 };
    }
    /** Get a single record */
    async get(objectName, id) {
        return {};
    }
    /** Create a record */
    async create(objectName, data) {
        return data;
    }
    /** Update a record */
    async update(objectName, id, data) {
        return data;
    }
    /** Delete a record */
    async delete(objectName, id) {
        return true;
    }
    /** Get metadata for an object */
    getMetadata(objectName) {
        return {};
    }
    /** Get view configuration */
    getView(objectName, viewType) {
        return null;
    }
}
exports.ObjectStackKernel = ObjectStackKernel;
/**
 * ObjectStack Runtime Protocol
 * Base class for runtime protocol implementations
 */
class ObjectStackRuntimeProtocol {
}
exports.ObjectStackRuntimeProtocol = ObjectStackRuntimeProtocol;
//# sourceMappingURL=index.js.map