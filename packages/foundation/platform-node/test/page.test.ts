import { ObjectLoader } from '../src/loader';
import { MetadataRegistry } from '@objectql/types';
import * as path from 'path';
import * as fs from 'fs';

describe('Page Metadata Loader', () => {
    let registry: MetadataRegistry;
    let loader: ObjectLoader;

    beforeEach(() => {
        registry = new MetadataRegistry();
        loader = new ObjectLoader(registry);
    });

    it('should load page from .page.yml file', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const pages = registry.list('page');
        expect(pages.length).toBeGreaterThan(0);
    });

    it('should parse page metadata correctly', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_page');
        expect(page).toBeDefined();
        expect(page.label).toBe('Test Page');
        expect(page.layout).toBe('single_column');
        expect(page.components).toBeDefined();
        expect(Array.isArray(page.components)).toBe(true);
    });

    it('should load page with dashboard layout', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_dashboard');
        expect(page).toBeDefined();
        expect(page.layout).toBe('dashboard');
        expect(page.components).toBeDefined();
        
        // Check if components have grid positions
        const componentWithGrid = page.components?.find((c: any) => c.grid);
        expect(componentWithGrid).toBeDefined();
        if (componentWithGrid && componentWithGrid.grid) {
            expect(componentWithGrid.grid.x).toBeDefined();
            expect(componentWithGrid.grid.y).toBeDefined();
            expect(componentWithGrid.grid.w).toBeDefined();
            expect(componentWithGrid.grid.h).toBeDefined();
        }
    });

    it('should load page with sections', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_sections');
        expect(page).toBeDefined();
        expect(page.sections).toBeDefined();
        expect(Array.isArray(page.sections)).toBe(true);
        
        if (page.sections && page.sections.length > 0) {
            const section = page.sections[0];
            expect(section.id).toBeDefined();
            expect(section.components).toBeDefined();
        }
    });

    it('should support page permissions', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_page');
        expect(page).toBeDefined();
        expect(page.permissions).toBeDefined();
        expect(page.permissions.view).toBeDefined();
        expect(Array.isArray(page.permissions.view)).toBe(true);
    });

    it('should support component actions', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_page');
        expect(page).toBeDefined();
        
        const componentWithAction = page.components?.find((c: any) => c.actions);
        expect(componentWithAction).toBeDefined();
        if (componentWithAction && componentWithAction.actions) {
            expect(componentWithAction.actions.on_click).toBeDefined();
        }
    });

    it('should support data source configuration', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_page');
        expect(page).toBeDefined();
        
        const componentWithDataSource = page.components?.find((c: any) => c.data_source);
        expect(componentWithDataSource).toBeDefined();
        if (componentWithDataSource && componentWithDataSource.data_source) {
            expect(componentWithDataSource.data_source.object).toBeDefined();
        }
    });

    it('should support responsive configuration', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_responsive');
        expect(page).toBeDefined();
        expect(page.responsive).toBeDefined();
        
        if (page.responsive) {
            expect(page.responsive.mobile).toBeDefined();
            expect(page.responsive.tablet).toBeDefined();
            expect(page.responsive.desktop).toBeDefined();
        }
    });

    it('should support AI context', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        loader.load(fixturesDir);
        
        const page = registry.get('page', 'test_page');
        expect(page).toBeDefined();
        expect(page.ai_context).toBeDefined();
        
        if (page.ai_context) {
            expect(page.ai_context.intent).toBeDefined();
        }
    });
});
