import db from './objectql.config';
import { ObjectRepository } from '@objectql/core';

async function main() {
    // Initialize database
    await db.init();
    
    // Create context with system privileges
    const context: any = {
        roles: ['admin'],
        isSystem: true,
        userId: 'init-script'
    };
    
    context.object = (n: string) => new ObjectRepository(n, context, db);
    context.transaction = async (cb: any) => cb(context);
    context.sudo = () => context;
    
    // Load initial data
    const projects = new ObjectRepository('projects', context, db);
    const tasks = new ObjectRepository('tasks', context, db);
    
    // Create some sample projects
    await projects.create({
        _id: 'PROJ-001',
        name: 'Website Redesign',
        description: 'Redesign company website',
        status: 'in_progress',
        priority: 'high',
        owner: 'John Doe',
        budget: 50000,
        start_date: '2024-01-01',
        end_date: '2024-06-30'
    });
    
    await projects.create({
        _id: 'PROJ-002',
        name: 'Mobile App Development',
        description: 'Create native mobile apps',
        status: 'planned',
        priority: 'normal',
        owner: 'Jane Smith',
        budget: 100000,
        start_date: '2024-03-01',
        end_date: '2024-12-31'
    });
    
    await projects.create({
        _id: 'PROJ-003',
        name: 'API Modernization',
        description: 'Upgrade legacy APIs',
        status: 'completed',
        priority: 'high',
        owner: 'Bob Johnson',
        budget: 75000,
        start_date: '2023-07-01',
        end_date: '2024-01-15'
    });
    
    // Create sample tasks
    await tasks.create({
        _id: 'TASK-001',
        name: 'Design Homepage Mockups',
        project: 'PROJ-001',
        due_date: '2024-02-15',
        completed: true,
        priority: 'high',
        assigned_to: 'Alice Designer',
        estimated_hours: 40
    });
    
    await tasks.create({
        _id: 'TASK-002',
        name: 'Implement Responsive Layout',
        project: 'PROJ-001',
        due_date: '2024-03-30',
        completed: false,
        priority: 'high',
        assigned_to: 'Carlos Developer',
        estimated_hours: 80
    });
    
    await tasks.create({
        _id: 'TASK-003',
        name: 'Setup CI/CD Pipeline',
        project: 'PROJ-001',
        due_date: '2024-04-15',
        completed: false,
        priority: 'medium',
        assigned_to: 'Dave DevOps',
        estimated_hours: 24
    });
    
    await tasks.create({
        _id: 'TASK-004',
        name: 'Research Mobile Frameworks',
        project: 'PROJ-002',
        due_date: '2024-03-15',
        completed: true,
        priority: 'high',
        assigned_to: 'Eve Researcher',
        estimated_hours: 16
    });
    
    await tasks.create({
        _id: 'TASK-005',
        name: 'Create App Wireframes',
        project: 'PROJ-002',
        due_date: '2024-04-01',
        completed: false,
        priority: 'medium',
        assigned_to: 'Alice Designer',
        estimated_hours: 60
    });
    
    console.log('✅ Sample data initialized successfully!');
    console.log('Projects created: 3');
    console.log('Tasks created: 5');
    console.log('\nRun: npm run console');
    
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
