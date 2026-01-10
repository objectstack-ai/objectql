import app from '../objectql.config';

async function main() {
    await app.init();
    
    console.log('--- Objects loaded from Preset ---');
    const objects = app.metadata.list('object');
    console.log(objects.map(o => o.name));
    
    // We can access 'project' because it was loaded from the preset
    const projectRepo = app.createContext({}).object('project');
    
    // Create a project using the preset's definition
    const project = await projectRepo.create({
        name: 'Preset Usage Demo',
        description: 'Created via App Using Preset'
    });
    
    console.log('--- Created Project ---');
    console.log(project);
}

main().catch(console.error);
