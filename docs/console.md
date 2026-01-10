# ObjectQL Visual Console

## Overview

The ObjectQL Visual Console provides a terminal-based UI for browsing and managing database tables without using REPL.

## Features

- **Split-pane interface** - Object list on the left, data table on the right
- **Pagination** - Navigate through large datasets (20 records per page)
- **Record detail view** - View full record details in an overlay
- **Keyboard navigation** - Intuitive keyboard shortcuts for all operations
- **Help system** - Built-in help screen (press `?`)

## Installation

The console command is included in `@objectql/cli`:

```bash
pnpm install @objectql/cli
```

## Usage

### Starting the Console

```bash
# Using npm script
npm run console

# Or directly with objectql CLI
objectql console

# With custom config file
objectql console --config path/to/objectql.config.ts
```

### Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ObjectQL Visual Console - Press q to quit, ? for help      │
├────────────┬────────────────────────────────────────────────┤
│ Objects    │ projects (Page 1/2, Total: 25)                │
│            ├────────────────────────────────────────────────┤
│ projects   │ # │ _id       │ name           │ status │... │
│ tasks      │ 1 │ PROJ-001  │ Website        │ active │... │
│ users      │ 2 │ PROJ-002  │ Mobile App     │ planned│... │
│            │ 3 │ PROJ-003  │ API Modernize  │ done   │... │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│ ↑↓ Navigate │ Enter: View Detail │ n: Next │ p: Prev       │
└─────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

### Navigation
- `↑` / `↓` or `j` / `k` - Move up/down in lists
- `Tab` - Switch between object list and data table
- `Enter` - View record detail
- `Escape` - Close detail view / return to main view

### Data Operations
- `r` - Refresh current data
- `n` - Next page
- `p` - Previous page

### General
- `?` or `h` - Show help screen
- `q` or `Ctrl+C` - Quit console

## Configuration

The console uses the same configuration file as other ObjectQL commands (`objectql.config.ts` or `objectql.config.js`):

```typescript
import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-knex';

const db = new ObjectQL({
  datasources: {
    default: new KnexDriver({
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3'
      }
    })
  }
});

export default db;
```

## Examples

### Basic Example

1. Navigate to your project directory containing `objectql.config.ts`
2. Run `objectql console`
3. Use arrow keys to select an object from the left panel
4. Use arrow keys to browse records
5. Press `Enter` to view a record in detail
6. Press `Escape` to return to the list view
7. Press `q` to quit

### Browsing Related Data

1. Select a parent object (e.g., `projects`)
2. View a specific record by pressing `Enter`
3. Note the foreign key values (e.g., `owner: user-123`)
4. Press `Escape` to return
5. Press `Tab` to switch to object list
6. Select the related object (e.g., `users`)
7. Find the related record

## Troubleshooting

### Console doesn't start
- Ensure `objectql.config.ts` exists in your current directory
- Verify your config file exports an ObjectQL instance as default or named export (`app`, `db`, or `objectql`)

### No data appears
- Check that your database is initialized with `await app.init()`
- Verify your datasource configuration is correct
- Ensure tables/collections have been created

### Permission errors
- The console runs with system-level privileges (similar to REPL)
- All objects registered in your ObjectQL instance will be accessible

## Comparison with REPL

| Feature | Console | REPL |
|---------|---------|------|
| Visual interface | ✅ Yes | ❌ No |
| Mouse support | ✅ Yes | ❌ No |
| Pagination | ✅ Built-in | ⚠️ Manual |
| Record detail view | ✅ Built-in | ⚠️ Manual |
| Complex queries | ❌ Limited | ✅ Full JS |
| Learning curve | ✅ Low | ⚠️ Medium |
| Scripting | ❌ No | ✅ Yes |

## Technical Details

### Dependencies
- `blessed` - Terminal UI framework
- `blessed-contrib` - Additional widgets for blessed
- All standard ObjectQL dependencies

### Architecture
- Uses `ObjectRepository` for data access
- Runs with system-level context (admin privileges)
- Supports all configured datasources
- Respects object-level datasource configuration

## Future Enhancements

Potential future features:
- [ ] Search/filter within tables
- [ ] Create new records
- [ ] Update existing records
- [ ] Delete records
- [ ] Export data (CSV, JSON)
- [ ] Custom column selection
- [ ] Sorting by columns
- [ ] Quick filters (status, date ranges, etc.)
- [ ] Multi-object views (joins)
- [ ] Action execution from UI

## See Also

- [ObjectQL CLI Documentation](../cli.md)
- [REPL Documentation](./repl.md)
- [Configuration Guide](./configuration.md)
