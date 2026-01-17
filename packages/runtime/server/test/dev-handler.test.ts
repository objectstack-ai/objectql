import request from 'supertest';
import { createServer } from 'http';
import { createDevHandler } from '../src/dev-handler';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('DevHandler', () => {
    let testDir: string;
    let srcDir: string;
    let server: any;

    beforeEach(() => {
        // Create a temporary directory for testing
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'objectql-dev-test-'));
        srcDir = path.join(testDir, 'src');
        fs.mkdirSync(srcDir, { recursive: true });

        // Create test files
        const objectsDir = path.join(srcDir, 'objects');
        fs.mkdirSync(objectsDir, { recursive: true });
        
        fs.writeFileSync(
            path.join(objectsDir, 'project.object.yml'),
            'name: project\nlabel: Project\nfields:\n  name:\n    type: text\n    required: true\n'
        );

        fs.writeFileSync(
            path.join(objectsDir, 'task.object.yml'),
            'name: task\nlabel: Task\nfields:\n  title:\n    type: text\n    required: true\n'
        );

        // Create dev handler with test directory
        const devHandler = createDevHandler({
            baseDir: testDir,
            enabled: true
        });

        server = createServer(devHandler);
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        if (server) {
            server.close();
        }
    });

    describe('GET /api/dev/files', () => {
        it('should list files in directory tree', async () => {
            const response = await request(server)
                .get('/api/dev/files')
                .expect(200);

            expect(response.body).toHaveProperty('baseDir');
            expect(response.body).toHaveProperty('tree');
            expect(Array.isArray(response.body.tree)).toBe(true);
            
            // Should have objects directory
            const objectsNode = response.body.tree.find((node: any) => node.name === 'objects');
            expect(objectsNode).toBeDefined();
            expect(objectsNode.type).toBe('directory');
            expect(objectsNode.children).toBeDefined();
            
            // Should have project.object.yml and task.object.yml
            const projectFile = objectsNode.children.find((node: any) => node.name === 'project.object.yml');
            expect(projectFile).toBeDefined();
            expect(projectFile.type).toBe('file');
            
            const taskFile = objectsNode.children.find((node: any) => node.name === 'task.object.yml');
            expect(taskFile).toBeDefined();
            expect(taskFile.type).toBe('file');
        });

        it('should filter by allowed extensions', async () => {
            // Create a non-allowed file
            fs.writeFileSync(path.join(srcDir, 'test.exe'), 'binary content');

            const response = await request(server)
                .get('/api/dev/files')
                .expect(200);

            // Should not include .exe files
            const exeFile = response.body.tree.find((node: any) => node.name === 'test.exe');
            expect(exeFile).toBeUndefined();
        });
    });

    describe('GET /api/dev/files/:path', () => {
        it('should read file content', async () => {
            const response = await request(server)
                .get('/api/dev/files/objects/project.object.yml')
                .expect(200);

            expect(response.body).toHaveProperty('path', 'objects/project.object.yml');
            expect(response.body).toHaveProperty('content');
            expect(response.body.content).toContain('name: project');
            expect(response.body).toHaveProperty('size');
            expect(response.body).toHaveProperty('modified');
        });

        it('should return 404 for non-existent file', async () => {
            const response = await request(server)
                .get('/api/dev/files/objects/nonexistent.yml')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.message).toContain('File not found');
        });

        it('should prevent path traversal', async () => {
            const response = await request(server)
                .get('/api/dev/files/../../../etc/passwd');

            // Should either be 403 (access denied) or 404 (not found after normalization)
            expect([403, 404]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/dev/files/:path', () => {
        it('should update file content', async () => {
            const newContent = 'name: project\nlabel: Updated Project\nfields:\n  name:\n    type: text\n';
            
            const response = await request(server)
                .put('/api/dev/files/objects/project.object.yml')
                .send({ content: newContent })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'File updated successfully');
            expect(response.body).toHaveProperty('path', 'objects/project.object.yml');

            // Verify file was actually updated
            const actualContent = fs.readFileSync(
                path.join(srcDir, 'objects', 'project.object.yml'),
                'utf-8'
            );
            expect(actualContent).toBe(newContent);
        });

        it('should return 404 for non-existent file', async () => {
            const response = await request(server)
                .put('/api/dev/files/objects/nonexistent.yml')
                .send({ content: 'test' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        it('should prevent path traversal', async () => {
            const response = await request(server)
                .put('/api/dev/files/../../../tmp/malicious.txt')
                .send({ content: 'malicious' });

            // Should either be 403 (access denied) or 404 (not found after normalization)
            expect([403, 404]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject disallowed file extensions', async () => {
            // First create a .exe file manually
            const exePath = path.join(srcDir, 'test.exe');
            fs.writeFileSync(exePath, 'binary');

            const response = await request(server)
                .put('/api/dev/files/test.exe')
                .send({ content: 'malicious' })
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.message).toContain('File type not allowed');
        });
    });

    describe('POST /api/dev/files', () => {
        it('should create new file', async () => {
            const response = await request(server)
                .post('/api/dev/files')
                .send({
                    path: 'objects/user.object.yml',
                    content: 'name: user\nlabel: User\nfields:\n  name:\n    type: text\n'
                })
                .expect(201);

            expect(response.body).toHaveProperty('message', 'File created successfully');
            expect(response.body).toHaveProperty('path', 'objects/user.object.yml');

            // Verify file was created
            const filePath = path.join(srcDir, 'objects', 'user.object.yml');
            expect(fs.existsSync(filePath)).toBe(true);
            
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(content).toContain('name: user');
        });

        it('should return 409 if file already exists', async () => {
            const response = await request(server)
                .post('/api/dev/files')
                .send({
                    path: 'objects/project.object.yml',
                    content: 'test'
                })
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.message).toContain('already exists');
        });

        it('should create directory if needed', async () => {
            const response = await request(server)
                .post('/api/dev/files')
                .send({
                    path: 'modules/crm/account.object.yml',
                    content: 'name: account\n'
                })
                .expect(201);

            // Verify directory was created
            const dirPath = path.join(srcDir, 'modules', 'crm');
            expect(fs.existsSync(dirPath)).toBe(true);
        });

        it('should reject disallowed file extensions', async () => {
            const response = await request(server)
                .post('/api/dev/files')
                .send({
                    path: 'malicious.exe',
                    content: 'malicious'
                })
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.message).toContain('File type not allowed');
        });
    });

    describe('DELETE /api/dev/files/:path', () => {
        it('should delete file', async () => {
            const response = await request(server)
                .delete('/api/dev/files/objects/task.object.yml')
                .expect(200);

            expect(response.body).toHaveProperty('message', 'File deleted successfully');

            // Verify file was deleted
            const filePath = path.join(srcDir, 'objects', 'task.object.yml');
            expect(fs.existsSync(filePath)).toBe(false);
        });

        it('should return 404 for non-existent file', async () => {
            const response = await request(server)
                .delete('/api/dev/files/objects/nonexistent.yml')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        it('should prevent path traversal', async () => {
            const response = await request(server)
                .delete('/api/dev/files/../../../tmp/file.txt');

            // Should either be 403 (access denied) or 404 (not found after normalization)
            expect([403, 404]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/dev/metadata', () => {
        it('should return ObjectQL metadata', async () => {
            const response = await request(server)
                .get('/api/dev/metadata')
                .expect(200);

            expect(response.body).toHaveProperty('objects');
            expect(response.body).toHaveProperty('validations');
            expect(response.body).toHaveProperty('permissions');
            expect(response.body).toHaveProperty('apps');
            expect(response.body).toHaveProperty('hooks');
            expect(response.body).toHaveProperty('actions');
            expect(response.body).toHaveProperty('total');

            expect(Array.isArray(response.body.objects)).toBe(true);
            expect(response.body.objects.length).toBe(2); // project and task
            
            expect(response.body.total.objects).toBe(2);
        });
    });

    describe('Security', () => {
        it('should be disabled in production mode', async () => {
            const prodHandler = createDevHandler({
                baseDir: testDir,
                enabled: false
            });

            const prodServer = createServer(prodHandler);

            const response = await request(prodServer)
                .get('/api/dev/files')
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.message).toContain('development mode');

            prodServer.close();
        });

        it('should support CORS headers', async () => {
            const response = await request(server)
                .options('/api/dev/files')
                .expect(200);

            expect(response.headers).toHaveProperty('access-control-allow-origin');
            expect(response.headers).toHaveProperty('access-control-allow-methods');
        });
    });
});
