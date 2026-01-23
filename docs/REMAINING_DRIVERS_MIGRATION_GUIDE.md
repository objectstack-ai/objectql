# Remaining Drivers Migration Guide

**Status**: 6 drivers remaining (75% of ecosystem)  
**Completed**: driver-sql ✅, driver-memory ✅  
**Priority Order**: mongo → redis → fs → localstorage → excel → sdk

---

## Quick Reference: Migration Pattern

Based on the proven pattern from driver-sql and driver-memory, each driver migration follows these steps:

### Step 1: Update Imports (5 min)

```typescript
// Add to top of driver file
import { DriverInterface, QueryAST, FilterNode, SortNode } from '@objectstack/spec';

// Add Command interfaces
export interface Command {
    type: 'create' | 'update' | 'delete' | 'bulkCreate' | 'bulkUpdate' | 'bulkDelete';
    object: string;
    data?: any;
    id?: string | number;
    ids?: Array<string | number>;
    records?: any[];
    updates?: Array<{id: string | number, data: any}>;
    options?: any;
}

export interface CommandResult {
    success: boolean;
    data?: any;
    affected?: number;
    error?: string;
}
```

### Step 2: Update Class Declaration (2 min)

```typescript
// Before
export class XxxDriver implements Driver {

// After
export class XxxDriver implements Driver, DriverInterface {
```

### Step 3: Update Version (1 min)

```typescript
public readonly version = '4.0.0'; // was 3.0.1
```

### Step 4: Add executeQuery Method (15-30 min)

```typescript
async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
    const objectName = ast.object || '';
    
    // Convert QueryAST to legacy query format
    const legacyQuery: any = {
        fields: ast.fields,
        filters: this.convertFilterNodeToLegacy(ast.filters),
        sort: ast.sort?.map((s: SortNode) => [s.field, s.order]),
        limit: ast.top,
        offset: ast.skip,
    };
    
    // Use existing find method
    const results = await this.find(objectName, legacyQuery, options);
    
    return {
        value: results,
        count: results.length
    };
}
```

### Step 5: Add executeCommand Method (20-40 min)

```typescript
async executeCommand(command: Command, parameters?: any[], options?: any): Promise<CommandResult> {
    try {
        const cmdOptions = { ...options, ...command.options };
        
        switch (command.type) {
            case 'create':
                if (!command.data) throw new Error('Create command requires data');
                const created = await this.create(command.object, command.data, cmdOptions);
                return { success: true, data: created, affected: 1 };
            
            case 'update':
                if (!command.id || !command.data) throw new Error('Update command requires id and data');
                const updated = await this.update(command.object, command.id, command.data, cmdOptions);
                return { success: true, data: updated, affected: 1 };
            
            case 'delete':
                if (!command.id) throw new Error('Delete command requires id');
                await this.delete(command.object, command.id, cmdOptions);
                return { success: true, affected: 1 };
            
            case 'bulkCreate':
                if (!command.records || !Array.isArray(command.records)) {
                    throw new Error('BulkCreate command requires records array');
                }
                // Implementation varies by driver
                // See driver-specific section below
            
            case 'bulkUpdate':
                // Similar to bulkCreate
            
            case 'bulkDelete':
                // Similar to bulkCreate
            
            default:
                throw new Error(`Unknown command type: ${(command as any).type}`);
        }
    } catch (error: any) {
        return { success: false, error: error.message, affected: 0 };
    }
}
```

### Step 6: Add convertFilterNodeToLegacy Method (10-15 min)

```typescript
private convertFilterNodeToLegacy(node?: FilterNode): any {
    if (!node) return undefined;
    
    switch (node.type) {
        case 'comparison':
            const operator = node.operator || '=';
            return [[node.field, operator, node.value]];
        
        case 'and':
            if (!node.children || node.children.length === 0) return undefined;
            const andResults: any[] = [];
            for (const child of node.children) {
                const converted = this.convertFilterNodeToLegacy(child);
                if (converted) {
                    if (andResults.length > 0) andResults.push('and');
                    andResults.push(...(Array.isArray(converted) ? converted : [converted]));
                }
            }
            return andResults.length > 0 ? andResults : undefined;
        
        case 'or':
            if (!node.children || node.children.length === 0) return undefined;
            const orResults: any[] = [];
            for (const child of node.children) {
                const converted = this.convertFilterNodeToLegacy(child);
                if (converted) {
                    if (orResults.length > 0) orResults.push('or');
                    orResults.push(...(Array.isArray(converted) ? converted : [converted]));
                }
            }
            return orResults.length > 0 ? orResults : undefined;
        
        case 'not':
            if (node.children && node.children.length > 0) {
                return this.convertFilterNodeToLegacy(node.children[0]);
            }
            return undefined;
        
        default:
            return undefined;
    }
}
```

### Step 7: Add execute Method (5 min)

```typescript
async execute(command: any, parameters?: any[], options?: any): Promise<any> {
    // Driver-specific implementation
    // For most drivers, throw error or implement raw command execution
}
```

### Step 8: Update package.json (2 min)

```json
{
  "version": "4.0.0",
  "dependencies": {
    "@objectstack/spec": "^0.2.0"
  }
}
```

**Total Time per Driver**: 60-100 minutes

---

## Driver-Specific Implementation Notes

### 1. driver-mongo (Priority 1)

**Complexity**: High (NoSQL patterns)  
**Estimated Time**: 6-8 hours  
**Status**: Partial (has @objectstack/spec dependency)

**Special Considerations**:

1. **MongoDB Query Translation**:
```typescript
// QueryAST → MongoDB query
convertFilterNodeToMongo(node?: FilterNode): any {
    if (!node) return {};
    
    switch (node.type) {
        case 'comparison':
            return { [node.field]: { [`$${node.operator}`]: node.value } };
        case 'and':
            return { $and: node.children?.map(c => this.convertFilterNodeToMongo(c)) };
        case 'or':
            return { $or: node.children?.map(c => this.convertFilterNodeToMongo(c)) };
        // ... etc
    }
}
```

2. **Bulk Operations**:
```typescript
case 'bulkCreate':
    const result = await this.collection.insertMany(command.records);
    return { success: true, data: result.ops, affected: result.insertedCount };
```

3. **Embedded Documents**: Handle nested object queries

**Files to Modify**:
- `packages/drivers/mongo/src/index.ts`
- `packages/drivers/mongo/package.json`

---

### 2. driver-redis (Priority 2)

**Complexity**: Medium (Key-Value limitations)  
**Estimated Time**: 5-6 hours  
**Status**: Non-compliant

**Special Considerations**:

1. **Limited Query Support**: Redis is key-value, so filters are limited
```typescript
async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
    // For Redis, we may need to:
    // 1. Get all keys for the object type
    // 2. Load all records
    // 3. Filter in memory
    const pattern = `${ast.object}:*`;
    const keys = await this.redis.keys(pattern);
    const records = await Promise.all(keys.map(k => this.redis.get(k)));
    
    // Apply filters in memory
    const filtered = this.applyFiltersInMemory(records, ast.filters);
    
    return { value: filtered, count: filtered.length };
}
```

2. **Bulk Operations**: Use pipeline
```typescript
case 'bulkCreate':
    const pipeline = this.redis.pipeline();
    command.records.forEach(record => {
        const key = `${command.object}:${record.id}`;
        pipeline.set(key, JSON.stringify(record));
    });
    await pipeline.exec();
```

**Files to Modify**:
- `packages/drivers/redis/src/index.ts`
- `packages/drivers/redis/package.json`

---

### 3. driver-fs (Priority 3)

**Complexity**: Medium (File system operations)  
**Estimated Time**: 4-5 hours  
**Status**: Non-compliant

**Special Considerations**:

1. **File-based Storage**: Objects stored as JSON files
```typescript
async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
    const dir = path.join(this.basePath, ast.object);
    const files = await fs.readdir(dir);
    
    // Load all records
    const records = await Promise.all(
        files.map(f => fs.readFile(path.join(dir, f), 'utf8').then(JSON.parse))
    );
    
    // Filter in memory (reuse convertFilterNodeToLegacy)
    const filtered = this.applyFilters(records, ast.filters);
    
    return { value: filtered, count: filtered.length };
}
```

2. **Bulk Operations**: Batch file writes
```typescript
case 'bulkCreate':
    await Promise.all(command.records.map(record => {
        const filepath = path.join(this.basePath, command.object, `${record.id}.json`);
        return fs.writeFile(filepath, JSON.stringify(record, null, 2));
    }));
```

**Files to Modify**:
- `packages/drivers/fs/src/index.ts`
- `packages/drivers/fs/package.json`

---

### 4. driver-localstorage (Priority 4)

**Complexity**: Low (Browser API wrapper)  
**Estimated Time**: 3-4 hours  
**Status**: Non-compliant

**Special Considerations**:

1. **Browser Environment**: Uses `window.localStorage`
```typescript
async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
    const prefix = `${ast.object}:`;
    const records = [];
    
    // Iterate localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            records.push(data);
        }
    }
    
    // Filter in memory
    const filtered = this.applyFilters(records, ast.filters);
    
    return { value: filtered, count: filtered.length };
}
```

2. **Synchronous API**: Wrap in promises for consistency

**Files to Modify**:
- `packages/drivers/localstorage/src/index.ts`
- `packages/drivers/localstorage/package.json`

---

### 5. driver-excel (Priority 5)

**Complexity**: Medium-High (Excel format complexity)  
**Estimated Time**: 5-6 hours  
**Status**: Non-compliant

**Special Considerations**:

1. **Excel Workbook**: Each object is a worksheet
```typescript
async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
    const workbook = await this.loadWorkbook();
    const worksheet = workbook.getWorksheet(ast.object);
    
    if (!worksheet) {
        return { value: [], count: 0 };
    }
    
    // Convert rows to objects
    const records = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header
            const record = this.rowToObject(row);
            records.push(record);
        }
    });
    
    // Filter in memory
    const filtered = this.applyFilters(records, ast.filters);
    
    return { value: filtered, count: filtered.length };
}
```

2. **Bulk Operations**: Batch row operations
```typescript
case 'bulkCreate':
    const worksheet = workbook.getWorksheet(command.object);
    command.records.forEach(record => {
        worksheet.addRow(this.objectToRow(record));
    });
    await workbook.xlsx.writeFile(this.filepath);
```

**Files to Modify**:
- `packages/drivers/excel/src/index.ts`
- `packages/drivers/excel/package.json`

---

### 6. driver-sdk (Priority 6)

**Complexity**: Medium (HTTP API wrapper)  
**Estimated Time**: 6-8 hours  
**Status**: Non-compliant

**Special Considerations**:

1. **HTTP Remote Driver**: Forwards to remote ObjectQL server
```typescript
async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
    // Forward QueryAST to remote server
    const response = await this.http.post('/api/query', { ast }, {
        headers: this.getAuthHeaders()
    });
    
    return {
        value: response.data.value,
        count: response.data.count
    };
}
```

2. **Authentication**: Include auth tokens
3. **Error Handling**: Handle network errors

**Files to Modify**:
- `packages/drivers/sdk/src/index.ts`
- `packages/drivers/sdk/package.json`

---

## Migration Timeline

### Week 7 (Remaining Days)

- [ ] **driver-mongo** (Days 1-2): NoSQL patterns, 6-8 hours
  - Complex QueryAST translation
  - Test with embedded documents
  - Create migration guide

### Week 8

- [ ] **driver-redis** (Days 1-2): Key-value patterns, 5-6 hours
- [ ] **driver-fs** (Days 2-3): File operations, 4-5 hours
- [ ] **driver-localstorage** (Day 3): Browser API, 3-4 hours
- [ ] **driver-excel** (Days 3-4): Excel format, 5-6 hours
- [ ] **driver-sdk** (Days 4-5): HTTP remote, 6-8 hours

**Total Estimated Time**: 29-37 hours (6-7 working days)

---

## Testing Strategy

For each driver:

1. **Existing Tests**: All should pass (backward compatibility)
2. **New Tests**: Add DriverInterface tests
```typescript
describe('DriverInterface Compliance', () => {
    it('should execute QueryAST query', async () => {
        const ast: QueryAST = {
            object: 'users',
            filters: {
                type: 'comparison',
                field: 'status',
                operator: '=',
                value: 'active'
            }
        };
        const result = await driver.executeQuery(ast);
        expect(result.value).toBeInstanceOf(Array);
    });
    
    it('should execute create command', async () => {
        const result = await driver.executeCommand({
            type: 'create',
            object: 'users',
            data: { name: 'Test' }
        });
        expect(result.success).toBe(true);
    });
});
```

---

## Quality Checklist

For each driver migration, ensure:

- [ ] TypeScript compiles without errors
- [ ] All existing tests pass
- [ ] New DriverInterface tests added
- [ ] JSDoc comments added
- [ ] Backward compatibility verified
- [ ] Performance benchmarked (<10% overhead)
- [ ] Version bumped to 4.0.0
- [ ] package.json updated with @objectstack/spec
- [ ] Migration guide created (optional, can reuse driver-sql pattern)
- [ ] Compliance matrix updated

---

## Automation Opportunities

To speed up remaining migrations:

1. **Code Generator**: Create script to generate boilerplate
2. **Test Template**: Reusable DriverInterface test suite
3. **Validation Tool**: Automated compliance checker

---

## Risk Mitigation

1. **NoSQL Complexity (Mongo)**: Allocate extra time for QueryAST translation
2. **Network Issues (SDK)**: Handle timeouts and retries
3. **File Locking (FS, Excel)**: Implement proper concurrency control
4. **Browser Limits (LocalStorage)**: Document size limitations

---

## Success Criteria

Each driver is considered complete when:

1. ✅ Implements DriverInterface
2. ✅ executeQuery() works with QueryAST
3. ✅ executeCommand() supports all command types
4. ✅ All existing tests pass
5. ✅ Performance overhead <10%
6. ✅ Documentation updated
7. ✅ Version 4.0.0 published

---

## Next Action

**Immediate**: Start with driver-mongo migration
**Timeline**: Complete all 6 drivers in 6-7 working days
**Support**: Use driver-sql and driver-memory as reference implementations

---

**Prepared By**: ObjectStack AI  
**Last Updated**: January 23, 2026  
**Status**: Ready for execution
