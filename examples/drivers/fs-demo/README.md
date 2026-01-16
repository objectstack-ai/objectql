# FileSystem Driver Demo

This example demonstrates how to use the `@objectql/driver-fs` package for file-based storage with ObjectQL.

## Features Demonstrated

- ✅ File system-based persistent storage
- ✅ One JSON file per object type
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Query operations (filters, sorting, pagination)
- ✅ Aggregate operations (count, distinct)
- ✅ Human-readable JSON format
- ✅ Automatic backup files

## Running the Demo

```bash
# From the project root
npm run dev

# Or directly
ts-node src/index.ts
```

## What It Does

1. **Initializes** the FileSystem driver with a data directory
2. **Creates** a schema for "projects" with various fields
3. **Inserts** 4 sample projects
4. **Queries** the data with different filters
5. **Updates** a project status
6. **Shows** aggregate operations

## Output

After running, you'll see:
- Console output showing all operations
- A `data/` directory with `projects.json` file
- A `projects.json.bak` backup file

## Inspecting the Data

The data is stored in human-readable JSON:

```bash
cat data/projects.json
```

You can manually edit this file and the changes will be reflected in the application!

## Data Directory Structure

```
fs-demo/
├── src/
│   └── index.ts
├── data/              ← Created on first run
│   ├── projects.json  ← Current data
│   └── projects.json.bak ← Backup
├── package.json
└── tsconfig.json
```

## Use Cases

This driver is ideal for:
- Development and prototyping
- Small applications (< 10k records)
- Configuration storage
- Embedded applications
- Scenarios without database setup
