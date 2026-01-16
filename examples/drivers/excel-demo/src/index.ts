/**
 * Excel Driver Demo
 * 
 * This example demonstrates both storage modes of the Excel Driver for ObjectQL:
 * 1. Single-file mode (default): All data in one Excel file
 * 2. File-per-object mode: Each object type in its own file
 */

import { ExcelDriver } from '@objectql/driver-excel';
import * as path from 'path';

async function demoFilePerObjectMode() {
    console.log('=' .repeat(60));
    console.log('📂 FILE-PER-OBJECT MODE DEMO');
    console.log('='  .repeat(60) + '\n');

    const dataDir = path.join(__dirname, '../data/file-per-object');
    console.log(`📁 Using directory: ${dataDir}\n`);

    const driver = await ExcelDriver.create({
        filePath: dataDir,
        fileStorageMode: 'file-per-object',
        createIfMissing: true,
        autoSave: true
    });

    console.log('📝 Creating data in separate files...');
    
    // Each object type will be stored in its own file
    await driver.create('customers', {
        name: 'ACME Corp',
        email: 'contact@acme.com',
        industry: 'Technology'
    });
    console.log('✓ Created customer (saved to customers.xlsx)');

    await driver.create('invoices', {
        number: 'INV-001',
        amount: 5000.00,
        status: 'paid'
    });
    console.log('✓ Created invoice (saved to invoices.xlsx)');

    await driver.create('tasks', {
        title: 'Review proposal',
        priority: 'high',
        status: 'in-progress'
    });
    console.log('✓ Created task (saved to tasks.xlsx)');

    console.log('\n📊 Summary:');
    console.log('  - Each object type has its own Excel file');
    console.log('  - Better for large datasets or independent objects');
    console.log('  - Files: customers.xlsx, invoices.xlsx, tasks.xlsx\n');

    await driver.disconnect();
}

async function demoSingleFileMode() {
    console.log('=' .repeat(60));
    console.log('📄 SINGLE-FILE MODE DEMO');
    console.log('=' .repeat(60) + '\n');

    // Initialize the Excel driver
    const dataPath = path.join(__dirname, '../data/demo.xlsx');
    console.log(`📁 Using Excel file: ${dataPath}\n`);

    const driver = await ExcelDriver.create({
        filePath: dataPath,
        fileStorageMode: 'single-file',  // Default mode (can be omitted)
        createIfMissing: true,
        autoSave: true
    });

    // ========== CRUD Operations ==========
    console.log('📝 Creating users...');
    
    const user1 = await driver.create('users', {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'admin',
        age: 30,
        department: 'Engineering'
    });
    console.log('✓ Created:', user1.name, `(ID: ${user1.id})`);

    const user2 = await driver.create('users', {
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'user',
        age: 25,
        department: 'Marketing'
    });
    console.log('✓ Created:', user2.name, `(ID: ${user2.id})`);

    const user3 = await driver.create('users', {
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        role: 'user',
        age: 35,
        department: 'Engineering'
    });
    console.log('✓ Created:', user3.name, `(ID: ${user3.id})`);

    // Create products
    console.log('\n📦 Creating products...');
    
    await driver.create('products', {
        name: 'Laptop Pro',
        price: 1299.99,
        category: 'Electronics',
        stock: 50
    });
    console.log('✓ Created: Laptop Pro');

    await driver.create('products', {
        name: 'Wireless Mouse',
        price: 29.99,
        category: 'Accessories',
        stock: 200
    });
    console.log('✓ Created: Wireless Mouse');

    // ========== Query Operations ==========
    console.log('\n🔍 Querying data...');

    // Find all users
    const allUsers = await driver.find('users');
    console.log(`\n✓ Found ${allUsers.length} users total`);

    // Filter by role
    const admins = await driver.find('users', {
        filters: [['role', '=', 'admin']]
    });
    console.log(`✓ Found ${admins.length} admin(s):`, admins.map(u => u.name).join(', '));

    // Filter by age
    const youngUsers = await driver.find('users', {
        filters: [['age', '<', 30]]
    });
    console.log(`✓ Found ${youngUsers.length} user(s) under 30:`, youngUsers.map(u => u.name).join(', '));

    // Filter by department
    const engineers = await driver.find('users', {
        filters: [['department', '=', 'Engineering']]
    });
    console.log(`✓ Found ${engineers.length} engineer(s):`, engineers.map(u => u.name).join(', '));

    // Search by name
    const searchResults = await driver.find('users', {
        filters: [['name', 'contains', 'li']]
    });
    console.log(`✓ Search "li" found ${searchResults.length} user(s):`, searchResults.map(u => u.name).join(', '));

    // Sort users by age
    const sortedByAge = await driver.find('users', {
        sort: [['age', 'desc']]
    });
    console.log('✓ Users sorted by age (desc):', sortedByAge.map(u => `${u.name} (${u.age})`).join(', '));

    // Pagination
    const pagedUsers = await driver.find('users', {
        limit: 2,
        skip: 1
    });
    console.log(`✓ Page 2 (limit 2, skip 1):`, pagedUsers.map(u => u.name).join(', '));

    // Count
    const userCount = await driver.count('users', {});
    console.log(`✓ Total user count: ${userCount}`);

    // Distinct values
    const departments = await driver.distinct('users', 'department');
    console.log('✓ Distinct departments:', departments.join(', '));

    // ========== Update Operations ==========
    console.log('\n✏️  Updating records...');

    await driver.update('users', user1.id, {
        email: 'alice.johnson@example.com',
        age: 31
    });
    console.log(`✓ Updated ${user1.name}'s email and age`);

    // Update many
    const updateResult = await driver.updateMany(
        'users',
        [['department', '=', 'Engineering']],
        { department: 'Tech' }
    );
    console.log(`✓ Updated ${updateResult.modifiedCount} user(s) department to Tech`);

    // ========== Query Updated Data ==========
    console.log('\n🔄 After updates...');
    const updatedUser1 = await driver.findOne('users', user1.id);
    console.log(`✓ ${updatedUser1.name}: age=${updatedUser1.age}, email=${updatedUser1.email}`);

    const techUsers = await driver.find('users', {
        filters: [['department', '=', 'Tech']]
    });
    console.log(`✓ Users in Tech: ${techUsers.map(u => u.name).join(', ')}`);

    // ========== Multiple Worksheets ==========
    console.log('\n📊 Multiple worksheets (object types)...');
    const products = await driver.find('products');
    console.log(`✓ Found ${products.length} products in separate worksheet`);
    products.forEach(p => {
        console.log(`  - ${p.name}: $${p.price} (${p.stock} in stock)`);
    });

    // ========== Delete Operations ==========
    console.log('\n🗑️  Deleting records...');

    await driver.delete('users', user2.id);
    console.log(`✓ Deleted ${user2.name}`);

    const finalCount = await driver.count('users', {});
    console.log(`✓ Remaining users: ${finalCount}`);

    // ========== Bulk Operations ==========
    console.log('\n📦 Bulk operations...');

    const newUsers = await driver.createMany('users', [
        { name: 'Diana Prince', email: 'diana@example.com', role: 'user', age: 28 },
        { name: 'Ethan Hunt', email: 'ethan@example.com', role: 'admin', age: 40 }
    ]);
    console.log(`✓ Created ${newUsers.length} users in bulk`);

    // ========== Final Summary ==========
    console.log('\n📈 Final Summary:');
    const finalUsers = await driver.find('users');
    console.log(`✓ Total users in Excel: ${finalUsers.length}`);
    finalUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.role}, ${user.age} years old)`);
    });

    const finalProducts = await driver.find('products');
    console.log(`✓ Total products in Excel: ${finalProducts.length}`);

    console.log('\n📊 Summary:');
    console.log('  - All object types in one Excel file');
    console.log('  - Easy to manage (single file)');
    console.log('  - Best for related data sets');

    // Clean up
    await driver.disconnect();
    
    console.log('\n✅ Single-file mode demo completed!');
    console.log(`📁 Check the Excel file at: ${dataPath}\n`);
}

async function main() {
    console.log('\n🚀 Excel Driver Demo - Storage Modes Comparison\n');
    
    try {
        // Demo both storage modes
        await demoFilePerObjectMode();
        await demoSingleFileMode();
        
        console.log('=' .repeat(60));
        console.log('✅ ALL DEMOS COMPLETED SUCCESSFULLY!');
        console.log('=' .repeat(60));
        console.log('\nYou can now:');
        console.log('  1. Open data/demo.xlsx to see single-file mode results');
        console.log('  2. Open data/file-per-object/*.xlsx to see file-per-object results');
        console.log('\n');
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the demo
main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});
