import app from '../objectql.config';

async function main() {
    await app.init();
    
    const noteRepo = app.createContext({ userId: 'u001' }).object('note');

    console.log('--- Creating Note ---');
    // Should trigger [Audit] log
    const note = await noteRepo.create({
        content: 'Hello Project Plugin!'
    });

    console.log('--- Deleting Note ---');
    // Should trigger [Audit] log
    await noteRepo.delete(note.id);
}

main().catch(console.error);
