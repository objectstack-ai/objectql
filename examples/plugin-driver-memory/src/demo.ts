/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ====================================================================
 * Custom Driver Demo
 * ====================================================================
 * 
 * This demo shows how to use a custom In-Memory driver with ObjectStack.
 * It demonstrates:
 * 
 * 1. Creating a driver instance
 * 2. Initializing ObjectQL with the custom driver
 * 3. Performing CRUD operations
 * 4. Using queries with filters and sorting
 */

import { ObjectQL } from '@objectql/core';
import { InMemoryDriver } from './memory-driver';

async function main() {
    console.log("🚀 Custom Driver Demo: In-Memory Storage\n");
    console.log("=" .repeat(60));

    // ====================================================================
    // Step 1: Initialize Custom Driver
    // ====================================================================
    console.log("\n📦 Step 1: Initialize Custom Driver\n");

    const driver = new InMemoryDriver({
        strictMode: false,
        initialData: {
            // Optional: Pre-populate with data
            users: [
                { id: 'user-1', name: 'Alice', role: 'admin' },
                { id: 'user-2', name: 'Bob', role: 'user' }
            ]
        }
    });

    console.log("✅ InMemoryDriver created with initial data");

    // ====================================================================
    // Step 2: Initialize ObjectQL with Custom Driver
    // ====================================================================
    console.log("\n📦 Step 2: Initialize ObjectQL\n");

    const app = new ObjectQL({
        datasources: {
            default: driver
        }
    });

    // Register an object schema
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
                    { label: 'Active', value: 'active' },
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
            }
        }
    });

    await app.init();
    console.log("✅ ObjectQL initialized with custom driver");

    // ====================================================================
    // Step 3: Get Repository
    // ====================================================================
    const ctx = app.createContext({ isSystem: true });
    const projects = ctx.object('projects');

    // ====================================================================
    // Step 4: Create Records
    // ====================================================================
    console.log("\n📝 Step 3: Create Records\n");

    await projects.create({
        id: 'proj-1',
        name: 'Website Redesign',
        status: 'active',
        priority: 'high',
        budget: 50000
    });

    await projects.create({
        id: 'proj-2',
        name: 'Mobile App',
        status: 'planning',
        priority: 'high',
        budget: 80000
    });

    await projects.create({
        id: 'proj-3',
        name: 'Infrastructure Upgrade',
        status: 'active',
        priority: 'medium',
        budget: 30000
    });

    await projects.create({
        id: 'proj-4',
        name: 'Marketing Campaign',
        status: 'completed',
        priority: 'low',
        budget: 15000
    });

    console.log("✅ Created 4 projects");

    // ====================================================================
    // Step 5: Query Examples
    // ====================================================================
    console.log("\n🔍 Step 4: Query Examples\n");

    // Find all projects
    const allProjects = await projects.find({});
    console.log(`📊 Total projects: ${allProjects.length}`);

    // Find high priority projects
    const highPriority = await projects.find({
        filters: [['priority', '=', 'high']]
    });
    console.log(`\n🔥 High priority projects: ${highPriority.length}`);
    highPriority.forEach(p => console.log(`   - ${p.name}`));

    // Find active projects
    const active = await projects.find({
        filters: [['status', '=', 'active']]
    });
    console.log(`\n⚡ Active projects: ${active.length}`);
    active.forEach(p => console.log(`   - ${p.name}`));

    // Find projects with budget > 40000
    const largeBudget = await projects.find({
        filters: [['budget', '>', 40000]]
    });
    console.log(`\n💰 Projects with budget > $40,000: ${largeBudget.length}`);
    largeBudget.forEach(p => console.log(`   - ${p.name}: $${p.budget.toLocaleString()}`));

    // Sort by budget (descending)
    const sortedByBudget = await projects.find({
        sort: [['budget', 'desc']]
    });
    console.log(`\n📈 Projects sorted by budget (desc):`);
    sortedByBudget.forEach(p => console.log(`   - ${p.name}: $${p.budget.toLocaleString()}`));

    // ====================================================================
    // Step 6: Update Example
    // ====================================================================
    console.log("\n🔄 Step 5: Update Record\n");

    await projects.update('proj-2', { status: 'active' });
    const updated = await projects.findOne('proj-2');
    console.log(`✅ Updated ${updated.name} to ${updated.status}`);

    // ====================================================================
    // Step 7: Aggregate Operations
    // ====================================================================
    console.log("\n📊 Step 6: Aggregate Operations\n");

    const activeCount = await projects.count({
        filters: [['status', '=', 'active']]
    });
    console.log(`Active projects: ${activeCount}`);

    const priorities = await projects.distinct('priority');
    console.log(`Distinct priorities: ${priorities.join(', ')}`);

    // ====================================================================
    // Step 8: Delete Example
    // ====================================================================
    console.log("\n🗑️  Step 7: Delete Record\n");

    await projects.delete('proj-4');
    const remaining = await projects.find({});
    console.log(`✅ Deleted project. Remaining: ${remaining.length}`);

    // ====================================================================
    // Summary
    // ====================================================================
    console.log("\n" + "=".repeat(60));
    console.log("\n✨ Custom Driver Demo Complete!\n");
    console.log("Key Takeaways:");
    console.log("• Implemented Driver interface with CRUD operations");
    console.log("• Integrated driver with ObjectQL engine");
    console.log("• Demonstrated queries, filters, sorting, pagination");
    console.log("• Showed how to register driver as a plugin\n");

    // Cleanup
    await app.close();
}

// Run the demo
if (require.main === module) {
    main().catch(console.error);
}

export { main };
