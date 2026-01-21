/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Integration Test Example for File Upload/Download
 * 
 * This example demonstrates how to use the file upload/download API
 * with a complete ObjectQL server setup.
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { createNodeHandler, MemoryFileStorage } from '../src';
import * as http from 'http';

async function setupServer() {
    // 1. Initialize Driver (In-Memory SQLite)
    const driver = new SqlDriver({
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true
    });

    // 2. Initialize Engine
    const app = new ObjectQL({
        datasources: { default: driver }
    });

    // 3. Define Schema with File Attachment
    app.registerObject({
        name: 'expense',
        label: 'Expense',
        fields: {
            expense_number: {
                type: 'text',
                required: true,
                label: 'Expense Number'
            },
            amount: {
                type: 'number',
                required: true,
                label: 'Amount'
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

    await app.init();

    // 4. Create HTTP Server with File Storage
    const fileStorage = new MemoryFileStorage({
        baseUrl: 'http://localhost:3000/api/files'
    });

    const handler = createNodeHandler(app, { fileStorage });
    const server = http.createServer(handler);

    return { server, app, fileStorage };
}

async function demonstrateUsage() {
    console.log('=== ObjectQL File Upload/Download Integration Example ===\n');

    const { server, app, fileStorage } = await setupServer();

    // Start server
    await new Promise<void>((resolve) => {
        server.listen(3000, () => {
            console.log('✓ Server started on http://localhost:3000');
            resolve();
        });
    });

    try {
        // Example 1: Upload a file
        console.log('\n1. Uploading a file...');
        const fileContent = Buffer.from('Sample receipt content');
        const uploadedFile = await fileStorage.save(
            fileContent,
            'receipt.pdf',
            'application/pdf',
            { userId: 'user_123' }
        );
        console.log('✓ File uploaded:', uploadedFile);

        // Example 2: Create an expense with the uploaded file
        console.log('\n2. Creating expense record with attachment...');
        const ctx = app.createContext({ isSystem: true });
        const expenseRepo = ctx.object('expense');
        
        const expense = await expenseRepo.create({
            expense_number: 'EXP-2024-001',
            amount: 125.50,
            description: 'Office supplies',
            receipt: uploadedFile
        });
        console.log('✓ Expense created:', {
            id: expense.id,
            expense_number: expense.expense_number,
            receipt: expense.receipt
        });

        // Example 3: Retrieve the file
        console.log('\n3. Downloading the file...');
        const downloadedFile = await fileStorage.get(uploadedFile.id!);
        console.log('✓ File downloaded:', {
            size: downloadedFile?.length,
            content: downloadedFile?.toString().substring(0, 50) + '...'
        });

        // Example 4: Query expenses with attachments
        console.log('\n4. Querying expenses with attachments...');
        const expenses = await expenseRepo.find({
            filters: [['receipt', '!=', null]]
        });
        console.log('✓ Found expenses with receipts:', expenses.length);
        expenses.forEach((exp: any) => {
            console.log(`  - ${exp.expense_number}: ${exp.receipt?.name}`);
        });

        // Example 5: Update attachment
        console.log('\n5. Uploading and updating receipt...');
        const newFileContent = Buffer.from('Updated receipt content');
        const newFile = await fileStorage.save(
            newFileContent,
            'updated_receipt.pdf',
            'application/pdf',
            { userId: 'user_123' }
        );
        
        await expenseRepo.update(expense.id, {
            receipt: newFile
        });
        console.log('✓ Receipt updated');

        // Example 6: Multiple file upload (product gallery)
        console.log('\n6. Multiple file upload example...');
        app.registerObject({
            name: 'product',
            label: 'Product',
            fields: {
                name: { type: 'text', required: true },
                price: { type: 'number' },
                gallery: {
                    type: 'image',
                    label: 'Product Gallery',
                    multiple: true,
                    accept: ['.jpg', '.jpeg', '.png'],
                    max_size: 2097152 // 2MB per image
                }
            }
        });

        const productRepo = ctx.object('product');
        
        // Upload multiple images
        const images = await Promise.all([
            fileStorage.save(
                Buffer.from('Image 1 content'),
                'product_1.jpg',
                'image/jpeg',
                { userId: 'user_123' }
            ),
            fileStorage.save(
                Buffer.from('Image 2 content'),
                'product_2.jpg',
                'image/jpeg',
                { userId: 'user_123' }
            )
        ]);

        const product = await productRepo.create({
            name: 'Premium Laptop',
            price: 1299.99,
            gallery: images
        });
        console.log('✓ Product created with gallery:', {
            id: product.id,
            name: product.name,
            images: product.gallery.length
        });

    } finally {
        // Cleanup
        server.close();
        console.log('\n✓ Server stopped');
    }
}

// Run the example
if (require.main === module) {
    demonstrateUsage().catch(console.error);
}

export { setupServer, demonstrateUsage };
