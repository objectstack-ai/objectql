import * as blessed from 'blessed';
import * as path from 'path';
import * as fs from 'fs';
import { ObjectQL } from '@objectql/core';
import { register } from 'ts-node';

export async function startConsole(configPath?: string) {
    const cwd = process.cwd();
    
    // Register ts-node to handle TS config loading
    register({
        transpileOnly: true,
        compilerOptions: {
            module: "commonjs"
        }
    });

    // 1. Resolve Config File
    let configFile = configPath;
    if (!configFile) {
        const potentialFiles = ['objectql.config.ts', 'objectql.config.js'];
        for (const file of potentialFiles) {
            if (fs.existsSync(path.join(cwd, file))) {
                configFile = file;
                break;
            }
        }
    }

    if (!configFile) {
        console.error("❌ No configuration file found (objectql.config.ts/js).");
        console.log("Please create one that exports an ObjectQL instance.");
        process.exit(1);
    }

    console.log(`🚀 Loading configuration from ${configFile}...`);
    
    try {
        const configModule = require(path.join(cwd, configFile));
        const app = configModule.default || configModule.app || configModule.objectql || configModule.db;

        if (!(app instanceof ObjectQL)) {
            console.error("❌ The config file must export an instance of 'ObjectQL' as default or 'app'/'db'.");
            process.exit(1);
        }

        // 2. Init ObjectQL
        await app.init();
        console.log("✅ ObjectQL Initialized.");

        // 3. Start Visual Console
        await launchVisualConsole(app);

    } catch (error) {
        console.error("Failed to load or start:", error);
        process.exit(1);
    }
}

async function launchVisualConsole(app: ObjectQL) {
    // Create screen
    const screen = blessed.screen({
        smartCSR: true,
        title: 'ObjectQL Console'
    });

    // Get all objects
    const objects = app.metadata.list('object');
    const objectNames = objects.map((o: any) => o.name);

    if (objectNames.length === 0) {
        const messageBox = blessed.message({
            parent: screen,
            top: 'center',
            left: 'center',
            width: '80%',
            height: 'shrink',
            border: 'line',
            label: ' No Objects Registered ',
            tags: true,
            keys: true,
            vi: true,
            style: {
                border: {
                    fg: 'red'
                }
            }
        });

        messageBox.display(
            'No objects are registered in ObjectQL metadata.\n\nPlease define at least one object and restart the console.',
            0,
            () => {
                screen.destroy();
                process.exitCode = 1;
            }
        );

        screen.key(['q', 'C-c', 'escape'], () => {
            screen.destroy();
            process.exitCode = 1;
        });

        return;
    }
    // State
    let selectedObjectIndex = 0;
    let selectedObject = objectNames[0];
    let currentData: any[] = [];
    let currentPage = 0;
    const pageSize = 20;
    let totalRecords = 0;
    let selectedRowIndex = 0;
    let viewMode: 'list' | 'detail' = 'list';
    let selectedRecord: any;

    // Create a box container for layout
    const container = blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    });

    // Header
    blessed.box({
        parent: container,
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: ' {bold}ObjectQL Visual Console{/bold} - Press {cyan-fg}q{/cyan-fg} to quit, {cyan-fg}?{/cyan-fg} for help',
        tags: true,
        style: {
            fg: 'white',
            bg: 'blue'
        }
    });

    // Object selector (left sidebar)
    const objectList = blessed.list({
        parent: container,
        top: 3,
        left: 0,
        width: 25,
        height: '100%-6',
        label: ' Objects ',
        border: {
            type: 'line'
        },
        style: {
            selected: {
                bg: 'blue',
                fg: 'white'
            },
            border: {
                fg: 'cyan'
            }
        },
        keys: true,
        vi: true,
        mouse: true,
        items: objectNames
    });

    // Data table (main area)
    const dataTable = blessed.listtable({
        parent: container,
        top: 3,
        left: 25,
        width: '100%-25',
        height: '100%-6',
        label: ` ${selectedObject} (Page ${currentPage + 1}) `,
        border: {
            type: 'line'
        },
        align: 'left',
        tags: true,
        keys: true,
        vi: true,
        mouse: true,
        style: {
            header: {
                fg: 'white',
                bold: true
            },
            cell: {
                fg: 'white',
                selected: {
                    bg: 'blue'
                }
            },
            border: {
                fg: 'cyan'
            }
        }
    });

    // Detail view (overlay)
    const detailBox = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '80%',
        height: '80%',
        label: ' Record Detail ',
        border: {
            type: 'line'
        },
        hidden: true,
        scrollable: true,
        alwaysScroll: true,
        keys: true,
        vi: true,
        mouse: true,
        scrollbar: {
            ch: ' ',
            track: {
                bg: 'cyan'
            },
            style: {
                inverse: true
            }
        },
        style: {
            border: {
                fg: 'cyan'
            },
            bg: 'black'
        }
    });

    // Footer
    const footer = blessed.box({
        parent: container,
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: ' {cyan-fg}↑↓{/cyan-fg} Navigate | {cyan-fg}Enter{/cyan-fg} View Detail | {cyan-fg}n{/cyan-fg} Next Page | {cyan-fg}p{/cyan-fg} Prev Page | {cyan-fg}r{/cyan-fg} Refresh',
        tags: true,
        style: {
            fg: 'white',
            bg: 'black'
        }
    });

    // Load data for current object
    async function loadData() {
        try {
            const { ObjectRepository } = require('@objectql/core');
            
            const context: any = {
                roles: ['admin'],
                isSystem: true,
                userId: 'Console'
            };
            
            context.object = (n: string) => new ObjectRepository(n, context, app);
            context.transaction = async (cb: any) => cb(context);
            context.sudo = () => context;

            const repo = new ObjectRepository(selectedObject, context, app);
            
            // Get total count
            const countResult = await repo.count();
            totalRecords = countResult;
            
            // Get paginated data
            const skip = currentPage * pageSize;
            const records = await repo.find({
                top: pageSize,
                skip: skip
            });

            currentData = records;
            
            // Update table
            if (records.length > 0) {
                const fields = Object.keys(records[0]);
                const headers = ['#', ...fields];
                const rows = records.map((record: any, index: number) => {
                    return [
                        String(skip + index + 1),
                        ...fields.map(field => {
                            const value = record[field];
                            if (value === null || value === undefined) return '';
                            if (typeof value === 'object') return JSON.stringify(value);
                            return String(value);
                        })
                    ];
                });
                
                dataTable.setData([headers, ...rows]);
            } else {
                dataTable.setData([['No records found']]);
            }
            
            const totalPages = Math.ceil(totalRecords / pageSize);
            dataTable.setLabel(` ${selectedObject} (Page ${currentPage + 1}/${totalPages}, Total: ${totalRecords}) `);
            
            screen.render();
        } catch (error: any) {
            footer.setContent(` {red-fg}Error: ${error.message}{/red-fg}`);
            screen.render();
        }
    }

    // Handle object selection
    objectList.on('select', async (item: any, index: number) => {
        selectedObjectIndex = index;
        selectedObject = objectNames[index];
        currentPage = 0;
        selectedRowIndex = 0;
        await loadData();
    });

    // Handle keyboard shortcuts
    screen.key(['q', 'C-c'], () => {
        return process.exit(0);
    });

    screen.key(['?', 'h'], () => {
        const helpText = `
{bold}ObjectQL Visual Console - Help{/bold}

{cyan-fg}Navigation:{/cyan-fg}
  ↑/↓ or j/k    - Navigate up/down
  Tab           - Switch between panels
  q or Ctrl+C   - Quit
  
{cyan-fg}Data Operations:{/cyan-fg}
  Enter         - View record detail
  r             - Refresh current data
  n             - Next page
  p             - Previous page
  
{cyan-fg}Object Operations:{/cyan-fg}
  Select object from left sidebar
  
Press any key to close this help...
        `;
        
        const helpBox = blessed.box({
            parent: screen,
            top: 'center',
            left: 'center',
            width: '70%',
            height: '70%',
            content: helpText,
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'cyan'
                }
            }
        });
        
        screen.render();
        
        screen.onceKey('escape', () => {
            helpBox.destroy();
            screen.render();
        });
        screen.onceKey('enter', () => {
            helpBox.destroy();
            screen.render();
        });
        screen.onceKey('q', () => {
            helpBox.destroy();
            screen.render();
        });
    });

    screen.key(['r'], async () => {
        await loadData();
    });

    screen.key(['n'], async () => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (currentPage < totalPages - 1) {
            currentPage++;
            await loadData();
        }
    });

    screen.key(['p'], async () => {
        if (currentPage > 0) {
            currentPage--;
            await loadData();
        }
    });

    screen.key(['tab'], () => {
        // Check which element is currently focused
        const currentFocus = screen.focused;
        if (currentFocus === dataTable) {
            objectList.focus();
        } else {
            dataTable.focus();
        }
        screen.render();
    });

    // View detail
    dataTable.on('select', (item: any, index: number) => {
        if (index > 0 && currentData.length > 0) { // Skip header row
            const recordIndex = index - 1;
            if (recordIndex < currentData.length) {
                selectedRecord = currentData[recordIndex];
                
                // Format record for display
                const formatted = Object.entries(selectedRecord)
                    .map(([key, value]) => {
                        let displayValue: string;
                        if (value === null || value === undefined) {
                            displayValue = '{gray-fg}(null){/gray-fg}';
                        } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value, null, 2);
                        } else {
                            displayValue = String(value);
                        }
                        return `{bold}${key}:{/bold} ${displayValue}`;
                    })
                    .join('\n\n');
                
                detailBox.setContent(formatted);
                detailBox.show();
                detailBox.focus();
                screen.render();
            }
        }
    });

    // Close detail view
    detailBox.key(['escape', 'q'], () => {
        detailBox.hide();
        dataTable.focus();
        screen.render();
    });

    // Focus on object list initially
    objectList.focus();
    objectList.select(0);

    // Initial load
    await loadData();

    // Render screen
    screen.render();
}
