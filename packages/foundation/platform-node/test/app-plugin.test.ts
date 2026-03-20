/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createAppPlugin } from '../src/app-plugin';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('createAppPlugin', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-plugin-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should load objects from directory and register as app.* service', async () => {
        // Create a test object YAML file
        fs.writeFileSync(path.join(tmpDir, 'task.object.yml'), `
name: task
label: Task
fields:
  name:
    type: text
    required: true
  status:
    type: select
    options:
      - label: Open
        value: open
      - label: Closed
        value: closed
`);

        const plugin = createAppPlugin({
            id: 'test-app',
            dir: tmpDir,
        });

        expect(plugin.name).toBe('app-loader:test-app');
        expect(plugin.type).toBe('app');

        // Simulate plugin init phase
        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: {
                info: () => {},
                debug: () => {},
            },
        };

        await plugin.init(ctx);

        // Verify service was registered with correct name
        expect(services['app.test-app']).toBeDefined();

        const manifest = services['app.test-app'] as Record<string, unknown>;
        expect(manifest.id).toBe('test-app');
        expect(manifest.name).toBe('test-app');

        // Verify objects were loaded
        const objects = manifest.objects as Record<string, unknown>;
        expect(objects['task']).toBeDefined();
        expect((objects['task'] as Record<string, unknown>).name).toBe('task');
    });

    it('should infer app id from app manifest YAML', async () => {
        // Create an app manifest YAML
        fs.writeFileSync(path.join(tmpDir, 'demo.app.yml'), `
name: demo_app
label: Demo Application
description: A demo application
homepage: /tasks
`);

        // Create a test object
        fs.writeFileSync(path.join(tmpDir, 'task.object.yml'), `
name: task
fields:
  name:
    type: text
`);

        const plugin = createAppPlugin({
            dir: tmpDir,
        });

        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: { info: () => {}, debug: () => {} },
        };

        await plugin.init(ctx);

        // Should use the app manifest name as the service id
        expect(services['app.demo_app']).toBeDefined();

        const manifest = services['app.demo_app'] as Record<string, unknown>;
        expect(manifest.label).toBe('Demo Application');
        expect(manifest.description).toBe('A demo application');
    });

    it('should fallback to directory name if no id or app manifest', async () => {
        fs.writeFileSync(path.join(tmpDir, 'item.object.yml'), `
name: item
fields:
  name:
    type: text
`);

        const plugin = createAppPlugin({
            dir: tmpDir,
        });

        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: { info: () => {}, debug: () => {} },
        };

        await plugin.init(ctx);

        // Should use the directory basename as the app id
        const dirName = path.basename(tmpDir);
        expect(services[`app.${dirName}`]).toBeDefined();
    });

    it('should load multiple objects and metadata types', async () => {
        // Create subdirectory structure
        const modulesDir = path.join(tmpDir, 'modules', 'projects');
        fs.mkdirSync(modulesDir, { recursive: true });

        fs.writeFileSync(path.join(modulesDir, 'projects.object.yml'), `
name: projects
label: Projects
fields:
  name:
    type: text
    required: true
  status:
    type: select
    options:
      - value: active
      - value: archived
`);

        fs.writeFileSync(path.join(modulesDir, 'projects.permission.yml'), `
name: projects
admin:
  allowCreate: true
  allowRead: true
  allowEdit: true
  allowDelete: true
`);

        fs.writeFileSync(path.join(modulesDir, 'projects.validation.yml'), `
name: projects
rules:
  - field: name
    rule: required
`);

        const tasksDir = path.join(tmpDir, 'modules', 'tasks');
        fs.mkdirSync(tasksDir, { recursive: true });

        fs.writeFileSync(path.join(tasksDir, 'tasks.object.yml'), `
name: tasks
label: Tasks
fields:
  title:
    type: text
  project:
    type: lookup
    reference_to: projects
`);

        const plugin = createAppPlugin({
            id: 'multi-module',
            dir: tmpDir,
        });

        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: { info: () => {}, debug: () => {} },
        };

        await plugin.init(ctx);

        const manifest = services['app.multi-module'] as Record<string, unknown>;
        expect(manifest).toBeDefined();

        const objects = manifest.objects as Record<string, unknown>;
        expect(Object.keys(objects)).toHaveLength(2);
        expect(objects['projects']).toBeDefined();
        expect(objects['tasks']).toBeDefined();

        // Verify non-object metadata was collected
        expect(manifest.permissions).toBeDefined();
        expect(manifest.validations).toBeDefined();
    });

    it('should handle non-existent directory gracefully', async () => {
        const plugin = createAppPlugin({
            id: 'missing-app',
            dir: '/nonexistent/path',
        });

        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: { info: () => {}, debug: () => {} },
        };

        await plugin.init(ctx);

        // No service should be registered
        expect(services['app.missing-app']).toBeUndefined();
    });

    it('should use config.label and config.description over manifest', async () => {
        fs.writeFileSync(path.join(tmpDir, 'demo.app.yml'), `
name: demo_app
label: Manifest Label
description: Manifest Description
`);

        const plugin = createAppPlugin({
            id: 'custom-app',
            dir: tmpDir,
            label: 'Custom Label',
            description: 'Custom Description',
        });

        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: { info: () => {}, debug: () => {} },
        };

        await plugin.init(ctx);

        const manifest = services['app.custom-app'] as Record<string, unknown>;
        expect(manifest.label).toBe('Custom Label');
        expect(manifest.description).toBe('Custom Description');
    });

    it('should work with the existing project-tracker fixtures', async () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        const plugin = createAppPlugin({
            id: 'test-fixtures',
            dir: fixturesDir,
            label: 'Test Fixtures App',
        });

        const services: Record<string, unknown> = {};
        const ctx = {
            registerService: (name: string, service: unknown) => {
                services[name] = service;
            },
            logger: { info: () => {}, debug: () => {} },
        };

        await plugin.init(ctx);

        const manifest = services['app.test-fixtures'] as Record<string, unknown>;
        expect(manifest).toBeDefined();
        expect(manifest.label).toBe('Test Fixtures App');

        const objects = manifest.objects as Record<string, unknown>;
        // The fixtures directory has project.object.yml
        expect(objects['project']).toBeDefined();
    });

    it('start() should be a no-op', async () => {
        const plugin = createAppPlugin({ id: 'noop', dir: tmpDir });
        await expect(plugin.start()).resolves.toBeUndefined();
    });
});
