import { loadObjectConfigs } from '../src/loader';
import * as path from 'path';

describe('Loader', () => {
    it('should load object configs from directory', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        const configs = loadObjectConfigs(fixturesDir);
        expect(configs).toBeDefined();
        expect(configs['project']).toBeDefined();
        expect(configs['project'].name).toBe('project');
        expect(configs['project'].fields).toBeDefined();
        expect(configs['project'].fields.name).toBeDefined();
    });

    it('should load actions from .action.ts files', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        const configs = loadObjectConfigs(fixturesDir);
        expect(configs['project'].actions).toBeDefined();
        expect(configs['project'].actions!.closeProject).toBeDefined();
        expect(typeof configs['project'].actions!.closeProject.handler).toBe('function');
    });
});
