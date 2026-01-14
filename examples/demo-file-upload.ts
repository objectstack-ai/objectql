#!/usr/bin/env ts-node
/**
 * Quick Demo: ObjectQL File Upload API
 * 
 * This script demonstrates the file upload functionality in action.
 * Run: ts-node demo-file-upload.ts
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { createNodeHandler, MemoryFileStorage } from '@objectql/server';
import * as http from 'http';

async function main() {
    console.log('🚀 ObjectQL File Upload API Demo\n');

    // 1. Initialize ObjectQL with SQLite
    const driver = new SqlDriver({
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true
    });

    const app = new ObjectQL({
        datasources: { default: driver }
    });

    // 2. Define an expense object with file attachment
    app.registerObject({
        name: 'expense',
        label: 'Expense',
        fields: {
            expense_number: {
                type: 'text',
                required: true,
                label: 'Expense Number',
                index: true
            },
            amount: {
                type: 'number',
                required: true,
                label: 'Amount'
            },
            category: {
                type: 'select',
                options: ['office_supplies', 'travel', 'meals', 'other'],
                label: 'Category'
            },
            description: {
                type: 'textarea',
                label: 'Description'
            },
            receipt: {
                type: 'file',
                label: 'Receipt',
                accept: ['.pdf', '.jpg', '.jpeg', '.png'],
                max_size: 5242880 // 5MB
            }
        }
    });

    // 3. Define a product object with image gallery
    app.registerObject({
        name: 'product',
        label: 'Product',
        fields: {
            name: {
                type: 'text',
                required: true,
                label: 'Product Name'
            },
            price: {
                type: 'number',
                required: true,
                label: 'Price'
            },
            gallery: {
                type: 'image',
                label: 'Product Gallery',
                multiple: true,
                accept: ['.jpg', '.jpeg', '.png', '.webp'],
                max_size: 2097152 // 2MB per image
            }
        }
    });

    await app.init();
    console.log('✓ ObjectQL initialized with expense and product objects\n');

    // 4. Setup file storage (using memory for demo)
    const fileStorage = new MemoryFileStorage({
        baseUrl: 'http://localhost:3000/api/files'
    });

    // 5. Create HTTP server
    const handler = createNodeHandler(app, { fileStorage });
    const server = http.createServer(handler);

    const PORT = 3000;
    await new Promise<void>((resolve) => {
        server.listen(PORT, () => {
            console.log(`✓ Server started on http://localhost:${PORT}\n`);
            resolve();
        });
    });

    // 6. Demonstrate API usage programmatically
    const ctx = app.createContext({ isSystem: true });

    // Upload a mock receipt file
    console.log('📤 Uploading receipt file...');
    const receiptContent = Buffer.from('Mock receipt PDF content - Invoice #12345');
    const receiptFile = await fileStorage.save(
        receiptContent,
        'receipt_2024_001.pdf',
        'application/pdf',
        { object: 'expense', field: 'receipt', userId: 'user_demo' }
    );
    console.log('✓ Receipt uploaded:', {
        id: receiptFile.id,
        name: receiptFile.name,
        size: receiptFile.size,
        url: receiptFile.url
    });
    console.log();

    // Create expense with receipt
    console.log('💰 Creating expense with receipt...');
    const expenseRepo = ctx.object('expense');
    const expense = await expenseRepo.create({
        expense_number: 'EXP-2024-001',
        amount: 125.50,
        category: 'office_supplies',
        description: 'Printer paper and toner',
        receipt: receiptFile
    });
    console.log('✓ Expense created:', {
        id: expense.id,
        expense_number: expense.expense_number,
        amount: expense.amount,
        receipt_attached: expense.receipt ? true : false
    });
    console.log();

    // Upload multiple product images
    console.log('📷 Uploading product gallery...');
    const productImages = await Promise.all([
        fileStorage.save(
            Buffer.from('Product front view image data'),
            'laptop_front.jpg',
            'image/jpeg',
            { object: 'product', field: 'gallery', userId: 'user_demo' }
        ),
        fileStorage.save(
            Buffer.from('Product back view image data'),
            'laptop_back.jpg',
            'image/jpeg',
            { object: 'product', field: 'gallery', userId: 'user_demo' }
        ),
        fileStorage.save(
            Buffer.from('Product side view image data'),
            'laptop_side.jpg',
            'image/jpeg',
            { object: 'product', field: 'gallery', userId: 'user_demo' }
        )
    ]);
    console.log(`✓ Uploaded ${productImages.length} images`);
    console.log();

    // Create product with gallery
    console.log('🛍️  Creating product with image gallery...');
    const productRepo = ctx.object('product');
    const product = await productRepo.create({
        name: 'Premium Laptop',
        price: 1299.99,
        gallery: productImages
    });
    console.log('✓ Product created:', {
        id: product.id,
        name: product.name,
        price: product.price,
        gallery_images: product.gallery.length
    });
    console.log();

    // Query expenses with attachments
    console.log('🔍 Querying expenses with receipts...');
    const expensesWithReceipts = await expenseRepo.find({
        filters: [['receipt', '!=', null]]
    });
    console.log(`✓ Found ${expensesWithReceipts.length} expense(s) with receipt`);
    expensesWithReceipts.forEach((exp: any) => {
        console.log(`   - ${exp.expense_number}: $${exp.amount} (${exp.receipt?.name})`);
    });
    console.log();

    // Display API endpoints
    console.log('📋 Available API Endpoints:');
    console.log('   POST   /api/files/upload           - Upload single file');
    console.log('   POST   /api/files/upload/batch     - Upload multiple files');
    console.log('   GET    /api/files/:fileId          - Download file');
    console.log('   POST   /api/objectql               - Execute ObjectQL operations');
    console.log('   GET    /api/data/expense           - List expenses (REST)');
    console.log('   POST   /api/data/expense           - Create expense (REST)');
    console.log();

    console.log('💡 Example cURL commands:');
    console.log();
    console.log('# Upload a file');
    console.log('curl -X POST http://localhost:3000/api/files/upload \\');
    console.log('  -F "file=@receipt.pdf" \\');
    console.log('  -F "object=expense" \\');
    console.log('  -F "field=receipt"');
    console.log();
    console.log('# Create expense via JSON-RPC');
    console.log('curl -X POST http://localhost:3000/api/objectql \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"op":"create","object":"expense","args":{"expense_number":"EXP-002","amount":89.99}}\'');
    console.log();
    console.log('# Query expenses via REST');
    console.log('curl http://localhost:3000/api/data/expense');
    console.log();

    console.log('✨ Demo complete! Press Ctrl+C to stop the server.');
}

// Run the demo
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}

export { main };
