/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '@objectql/core';
import { FileSystemDriver } from '@objectql/driver-fs';
import * as path from 'path';

async function main() {
    console.log("🚀 ObjectQL FileSystem Driver Demo\n");

    // 1. Initialize Driver with data directory
    const dataDir = path.join(__dirname, '../data');
    const driver = new FileSystemDriver({
        dataDir: dataDir,
        prettyPrint: true,
        enableBackup: true
    });

    console.log(`📁 Data directory: ${dataDir}\n`);

    // 2. Initialize ObjectQL
    const app = new ObjectQL({
        datasources: {
            default: driver
        }
    });

    // 3. Define Object Schema
    app.registerObject({
        name: 'projects',
        label: 'Projects',
        fields: {
            name: { 
                type: 'text', 
                required: true,
                label: 'Project Name' 
            },
            status: {
                type: 'select',
                options: [
                    { label: 'Planning', value: 'planning' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' }
                ],
                defaultValue: 'planning',
                label: 'Status'
            },
            priority: {
                type: 'select',
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' }
                ],
                defaultValue: 'medium',
                label: 'Priority'
            },
            budget: {
                type: 'currency',
                label: 'Budget'
            },
            startDate: {
                type: 'date',
                label: 'Start Date'
            }
        }
    });

    await app.init();

    // 4. Get Repository
    const ctx = app.createContext({ isSystem: true });
    const projects = ctx.object('projects');

    // 5. Create Sample Projects
    console.log("📝 Creating sample projects...\n");

    await projects.create({
        id: 'PROJ-001',
        name: 'Website Redesign',
        status: 'in_progress',
        priority: 'high',
        budget: 50000,
        startDate: '2024-01-15'
    });

    await projects.create({
        id: 'PROJ-002',
        name: 'Mobile App Development',
        status: 'planning',
        priority: 'high',
        budget: 80000,
        startDate: '2024-02-01'
    });

    await projects.create({
        id: 'PROJ-003',
        name: 'Infrastructure Upgrade',
        status: 'in_progress',
        priority: 'medium',
        budget: 30000,
        startDate: '2024-01-10'
    });

    await projects.create({
        id: 'PROJ-004',
        name: 'Marketing Campaign',
        status: 'completed',
        priority: 'low',
        budget: 15000,
        startDate: '2023-12-01'
    });

    console.log("✅ Created 4 projects\n");

    // 6. Query Examples
    console.log("🔍 Query Examples:\n");

    // Find all projects
    const allProjects = await projects.find({});
    console.log(`📊 Total projects: ${allProjects.length}`);

    // Find high priority projects
    const highPriority = await projects.find({
        filters: [['priority', '=', 'high']]
    });
    console.log(`🔥 High priority projects: ${highPriority.length}`);
    highPriority.forEach(p => console.log(`   - ${p.name}`));

    // Find in-progress projects
    const inProgress = await projects.find({
        filters: [['status', '=', 'in_progress']]
    });
    console.log(`\n⚡ In-progress projects: ${inProgress.length}`);
    inProgress.forEach(p => console.log(`   - ${p.name}`));

    // Find projects with budget > 40000
    const largeBudget = await projects.find({
        filters: [['budget', '>', 40000]]
    });
    console.log(`\n💰 Projects with budget > $40,000: ${largeBudget.length}`);
    largeBudget.forEach(p => console.log(`   - ${p.name}: $${p.budget.toLocaleString()}`));

    // Sort by budget
    const sortedByBudget = await projects.find({
        sort: [['budget', 'desc']]
    });
    console.log(`\n📈 Projects sorted by budget (desc):`);
    sortedByBudget.forEach(p => console.log(`   - ${p.name}: $${p.budget.toLocaleString()}`));

    // 7. Update Example
    console.log(`\n🔄 Updating project status...\n`);
    await projects.update('PROJ-002', { status: 'in_progress' });
    const updated = await projects.findOne('PROJ-002');
    console.log(`✅ Updated ${updated.name} to ${updated.status}`);

    // 8. Aggregate Operations
    console.log(`\n📊 Aggregate Operations:\n`);

    const statusCount = await projects.count({
        filters: [['status', '=', 'in_progress']]
    });
    console.log(`In-progress projects: ${statusCount}`);

    const priorities = await projects.distinct('priority');
    console.log(`Distinct priorities: ${priorities.join(', ')}`);

    // 9. Show file location
    console.log(`\n📁 Data Files:\n`);
    console.log(`   JSON file: ${dataDir}/projects.json`);
    console.log(`   Backup: ${dataDir}/projects.json.bak`);
    console.log(`\n💡 Tip: Open the JSON files to see human-readable data!`);

    // Cleanup
    await app.close();
}

// Run the demo
if (require.main === module) {
    main().catch(console.error);
}
