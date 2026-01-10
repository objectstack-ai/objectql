import { ObjectQL } from '../src/index';
import { ObjectConfig } from '../src/metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Metadata Loading', () => {
    
    it('should load definitions from .object.yml file', () => {
        // 1. Read YAML file
        const yamlPath = path.join(__dirname, 'fixtures', 'project.object.yml');
        const fileContents = fs.readFileSync(yamlPath, 'utf8');
        
        // 2. Parse YAML
        const objectDef = yaml.load(fileContents) as ObjectConfig;

        // 3. Verify Structure
        expect(objectDef.name).toBe('project');
        expect(objectDef.fields.name.type).toBe('text');
        expect(objectDef.fields.status.options).toHaveLength(3);
        expect(objectDef.fields.budget.type).toBe('currency');
        expect(objectDef.fields.owner.reference_to).toBe('users');

        // 4. Register with ObjectQL
        const app = new ObjectQL({
            datasources: {} 
        });
        
        app.registerObject(objectDef);

        // 5. Verify Registration
        const retrieved = app.getObject('project');
        expect(retrieved).toBeDefined();
        expect(retrieved?.label).toBe('Project');
    });

    it('should validate required properties (manual validation simulation)', () => {
         const yamlPath = path.join(__dirname, 'fixtures', 'project.object.yml');
         const fileContents = fs.readFileSync(yamlPath, 'utf8');
         const objectDef = yaml.load(fileContents) as ObjectConfig;

         function validateObject(obj: ObjectConfig) {
             if (!obj.name) throw new Error('Object name is required');
             if (!obj.fields) throw new Error('Object fields are required');
         }

         expect(() => validateObject(objectDef)).not.toThrow();
    });
});
