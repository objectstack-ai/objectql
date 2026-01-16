# Excel Driver Demo

This example demonstrates the Excel Driver for ObjectQL.

## Installation

From the repository root:

```bash
pnpm install
```

## Running the Demo

```bash
cd examples/drivers/excel-demo
pnpm start
```

## What This Demo Shows

1. **Creating Records** - Add users and products to Excel
2. **Querying Data** - Filter, sort, search, and paginate
3. **Updating Records** - Modify individual and bulk records
4. **Deleting Records** - Remove records from Excel
5. **Multiple Worksheets** - Separate sheets for different object types
6. **Bulk Operations** - Create multiple records at once

## Output

The demo will:
- Create an Excel file at `data/demo.xlsx`
- Populate it with sample users and products
- Demonstrate various query operations
- Show the final state of the data

## Excel File Structure

After running, `data/demo.xlsx` will contain:

**Sheet: users**
| id | name | email | role | age | department | created_at | updated_at |
|----|------|-------|------|-----|------------|------------|------------|
| ... | Alice Johnson | alice.johnson@... | admin | 31 | Tech | ... | ... |

**Sheet: products**
| id | name | price | category | stock | created_at | updated_at |
|----|------|-------|----------|-------|------------|------------|
| ... | Laptop Pro | 1299.99 | Electronics | 50 | ... | ... |

## Next Steps

- Modify `src/index.ts` to experiment with different queries
- Try adding your own object types
- Explore filter operators and sorting options
- Check the [Excel Driver README](../../../packages/drivers/excel/README.md)
