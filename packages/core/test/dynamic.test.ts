import { ObjectQL } from '../src/index';
import * as path from 'path';

describe('Dynamic Package Loading', () => {
    let objectql: ObjectQL;

    beforeEach(() => {
        objectql = new ObjectQL({
            datasources: {}
        });
    });

    test('should load directory manually', () => {
        const fixtureDir = path.join(__dirname, 'fixtures');
        objectql.loadFromDirectory(fixtureDir, 'test-pkg');
        
        expect(objectql.getObject('project')).toBeDefined();
        // Since 'test-pkg' is passed, it should be tracked
        // but packageObjects is private, so we test behavior by removal
    });

    test('should remove package objects', () => {
        const fixtureDir = path.join(__dirname, 'fixtures');
        objectql.loadFromDirectory(fixtureDir, 'test-pkg');
        
        expect(objectql.getObject('project')).toBeDefined();

        objectql.removePackage('test-pkg');
        expect(objectql.getObject('project')).toBeUndefined();
    });

    // Mocking require for loadFromPackage is harder in jest without creating a real node module.
    // relying on loadFromDirectory with packageName argument is sufficient to test the tracking logic.
});
