/**
 * ObjectQL Query Analyzer
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { UnifiedQuery, ObjectConfig, MetadataRegistry } from '@objectql/types';
import { Data } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type FilterNode = Data.FilterNode;
import { QueryService, QueryOptions } from './query-service';

/**
 * Query execution plan
 */
export interface QueryPlan {
    /**
     * The compiled QueryAST
     */
    ast: QueryAST;
    
    /**
     * Estimated number of rows to be scanned
     */
    estimatedRows?: number;
    
    /**
     * Indexes that could be used for this query
     */
    indexes: string[];
    
    /**
     * Warnings about potential performance issues
     */
    warnings: string[];
    
    /**
     * Suggestions for optimization
     */
    suggestions: string[];
    
    /**
     * Complexity score (0-100, higher is more complex)
     */
    complexity: number;
}

/**
 * Query profile result with execution statistics
 */
export interface ProfileResult {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;
    
    /**
     * Number of rows scanned by the database
     */
    rowsScanned: number;
    
    /**
     * Number of rows returned
     */
    rowsReturned: number;
    
    /**
     * Whether an index was used
     */
    indexUsed: boolean;
    
    /**
     * The query plan
     */
    plan: QueryPlan;
    
    /**
     * Efficiency ratio (rowsReturned / rowsScanned)
     * Higher is better (1.0 is perfect, 0.0 is worst)
     */
    efficiency: number;
}

/**
 * Aggregated query statistics
 */
export interface QueryStats {
    /**
     * Total number of queries executed
     */
    totalQueries: number;
    
    /**
     * Average execution time in milliseconds
     */
    avgExecutionTime: number;
    
    /**
     * Slowest query execution time
     */
    slowestQuery: number;
    
    /**
     * Fastest query execution time
     */
    fastestQuery: number;
    
    /**
     * Queries by object
     */
    byObject: Record<string, {
        count: number;
        avgTime: number;
    }>;
    
    /**
     * Top slow queries
     */
    slowQueries: Array<{
        objectName: string;
        executionTime: number;
        query: UnifiedQuery;
        timestamp: Date;
    }>;
}

/**
 * Query Analyzer
 * 
 * Provides query performance analysis and profiling capabilities.
 * This class helps developers optimize queries by:
 * - Analyzing query plans
 * - Profiling execution performance
 * - Tracking statistics
 * - Providing optimization suggestions
 */
export class QueryAnalyzer {
    private stats: QueryStats = {
        totalQueries: 0,
        avgExecutionTime: 0,
        slowestQuery: 0,
        fastestQuery: Number.MAX_VALUE,
        byObject: {},
        slowQueries: []
    };
    
    private executionTimes: number[] = [];
    private readonly MAX_SLOW_QUERIES = 10;
    
    constructor(
        private queryService: QueryService,
        private metadata: MetadataRegistry
    ) {}
    
    /**
     * Analyze a query and generate an execution plan
     * 
     * @param objectName - The object to query
     * @param query - The unified query
     * @returns Query plan with optimization suggestions
     */
    async explain(objectName: string, query: UnifiedQuery): Promise<QueryPlan> {
        const schema = this.getSchema(objectName);
        
        // Build the QueryAST (without executing)
        const ast: QueryAST = {
            object: objectName,
            filters: query.filters as any, // FilterCondition is compatible with FilterNode
            sort: query.sort as any, // Will be converted to SortNode[] format
            top: query.limit, // Changed from limit to top (QueryAST uses 'top')
            skip: query.skip,
            fields: query.fields
        };
        
        // Analyze filters for index usage
        const indexes = this.findApplicableIndexes(schema, query);
        
        // Detect potential issues
        const warnings = this.analyzeWarnings(schema, query);
        
        // Generate suggestions
        const suggestions = this.generateSuggestions(schema, query, indexes);
        
        // Calculate complexity
        const complexity = this.calculateComplexity(query);
        
        // Try to estimate rows (basic heuristic)
        const estimatedRows = this.estimateRows(schema, query);
        
        return {
            ast,
            estimatedRows,
            indexes,
            warnings,
            suggestions,
            complexity
        };
    }
    
    /**
     * Profile a query execution
     * 
     * @param objectName - The object to query
     * @param query - The unified query
     * @param options - Query execution options
     * @returns Profile result with execution statistics
     */
    async profile(
        objectName: string, 
        query: UnifiedQuery,
        options: QueryOptions = {}
    ): Promise<ProfileResult> {
        // Get the query plan first
        const plan = await this.explain(objectName, query);
        
        // Execute with profiling enabled
        const result = await this.queryService.find(objectName, query, {
            ...options,
            profile: true
        });
        
        const executionTime = result.profile?.executionTime || 0;
        const rowsReturned = result.value.length;
        const rowsScanned = result.profile?.rowsScanned || rowsReturned;
        
        // Calculate efficiency
        const efficiency = rowsScanned > 0 ? rowsReturned / rowsScanned : 0;
        
        // Determine if index was used (heuristic)
        const indexUsed = plan.indexes.length > 0 && efficiency > 0.5;
        
        // Update statistics
        this.recordExecution(objectName, executionTime, query);
        
        return {
            executionTime,
            rowsScanned,
            rowsReturned,
            indexUsed,
            plan,
            efficiency
        };
    }
    
    /**
     * Get aggregated query statistics
     * 
     * @returns Current query statistics
     */
    getStatistics(): QueryStats {
        return { ...this.stats };
    }
    
    /**
     * Reset statistics
     */
    resetStatistics(): void {
        this.stats = {
            totalQueries: 0,
            avgExecutionTime: 0,
            slowestQuery: 0,
            fastestQuery: Number.MAX_VALUE,
            byObject: {},
            slowQueries: []
        };
        this.executionTimes = [];
    }
    
    /**
     * Get schema for an object
     * @private
     */
    private getSchema(objectName: string): ObjectConfig {
        const obj = this.metadata.get<ObjectConfig>('object', objectName);
        if (!obj) {
            throw new Error(`Object '${objectName}' not found`);
        }
        return obj;
    }
    
    /**
     * Find indexes that could be used for the query
     * @private
     */
    private findApplicableIndexes(schema: ObjectConfig, query: UnifiedQuery): string[] {
        const indexes: string[] = [];
        
        if (!schema.indexes || !query.filters) {
            return indexes;
        }
        
        // Extract fields used in filters
        const filterFields = new Set<string>();
        
        // FilterCondition is an object-based filter (e.g., { field: value } or { field: { $eq: value } })
        // We need to extract field names from the filter object
        const extractFieldsFromFilter = (filter: any): void => {
            if (!filter || typeof filter !== 'object') return;
            
            for (const key of Object.keys(filter)) {
                // Skip logical operators
                if (key.startsWith('$')) {
                    // Logical operators contain nested filters
                    if (key === '$and' || key === '$or') {
                        const nested = filter[key];
                        if (Array.isArray(nested)) {
                            nested.forEach(extractFieldsFromFilter);
                        }
                    }
                    continue;
                }
                // This is a field name
                filterFields.add(key);
            }
        };
        
        extractFieldsFromFilter(query.filters);
        
        // Check which indexes could be used
        const indexesArray = Array.isArray(schema.indexes) ? schema.indexes : Object.values(schema.indexes || {});
        for (const index of indexesArray) {
            const indexFields = Array.isArray(index.fields) 
                ? index.fields 
                : [index.fields];
            
            // Simple heuristic: index is applicable if first field is in filter
            if (indexFields.length > 0 && filterFields.has(indexFields[0])) {
                const indexName = index.name || indexFields.join('_');
                indexes.push(indexName);
            }
        }
        
        return indexes;
    }
    
    /**
     * Analyze query for potential issues
     * @private
     */
    private analyzeWarnings(schema: ObjectConfig, query: UnifiedQuery): string[] {
        const warnings: string[] = [];
        
        // Warning: No filters (full table scan)
        if (!query.filters || query.filters.length === 0) {
            warnings.push('No filters specified - this will scan all records');
        }
        
        // Warning: No limit on potentially large dataset
        if (!query.limit) {
            warnings.push('No limit specified - consider adding pagination');
        }
        
        // Warning: Selecting all fields
        if (!query.fields || query.fields.length === 0) {
            const fieldCount = Object.keys(schema.fields || {}).length;
            if (fieldCount > 10) {
                warnings.push(`Selecting all ${fieldCount} fields - consider selecting only needed fields`);
            }
        }
        
        // Warning: Complex filters without indexes
        if (query.filters && query.filters.length > 5) {
            const indexes = this.findApplicableIndexes(schema, query);
            if (indexes.length === 0) {
                warnings.push('Complex filters without matching indexes - consider adding indexes');
            }
        }
        
        return warnings;
    }
    
    /**
     * Generate optimization suggestions
     * @private
     */
    private generateSuggestions(
        schema: ObjectConfig, 
        query: UnifiedQuery,
        indexes: string[]
    ): string[] {
        const suggestions: string[] = [];
        
        // Suggest adding limit
        if (!query.limit) {
            suggestions.push('Add a limit clause to restrict result set size');
        }
        
        // Suggest adding indexes
        if (query.filters && query.filters.length > 0 && indexes.length === 0) {
            const filterFields = query.filters
                .filter((f: any) => Array.isArray(f) && f.length >= 1)
                .map((f: any) => String(f[0]));
            
            if (filterFields.length > 0) {
                suggestions.push(`Consider adding an index on: ${filterFields.join(', ')}`);
            }
        }
        
        // Suggest field selection
        if (!query.fields || query.fields.length === 0) {
            suggestions.push('Select only required fields to reduce data transfer');
        }
        
        // Suggest composite index for multiple filters
        if (query.filters && query.filters.length > 1 && indexes.length < 2) {
            const filterFields = query.filters
                .filter((f: any) => Array.isArray(f) && f.length >= 1)
                .map((f: any) => String(f[0]))
                .slice(0, 3); // Top 3 fields
            
            if (filterFields.length > 1) {
                suggestions.push(`Consider a composite index on: (${filterFields.join(', ')})`);
            }
        }
        
        return suggestions;
    }
    
    /**
     * Calculate query complexity score (0-100)
     * @private
     */
    private calculateComplexity(query: UnifiedQuery): number {
        let complexity = 0;
        
        // Base complexity
        complexity += 10;
        
        // Filters add complexity
        if (query.filters) {
            complexity += query.filters.length * 5;
            
            // Nested filters (OR conditions) add more
            const hasNestedFilters = query.filters.some((f: any) => 
                Array.isArray(f) && Array.isArray(f[0])
            );
            if (hasNestedFilters) {
                complexity += 15;
            }
        }
        
        // Sorting adds complexity
        if (query.sort && query.sort.length > 0) {
            complexity += query.sort.length * 3;
        }
        
        // Field selection reduces complexity slightly
        if (query.fields && query.fields.length > 0 && query.fields.length < 10) {
            complexity -= 5;
        }
        
        // Pagination reduces complexity
        if (query.limit) {
            complexity -= 5;
        }
        
        // Cap at 100
        return Math.min(Math.max(complexity, 0), 100);
    }
    
    /**
     * Estimate number of rows (very rough heuristic)
     * @private
     */
    private estimateRows(schema: ObjectConfig, query: UnifiedQuery): number {
        // This is a placeholder - real implementation would need statistics
        // from the database (row count, index selectivity, etc.)
        
        // Default to unknown
        if (!query.filters || query.filters.length === 0) {
            return -1; // Unknown, full scan
        }
        
        // Very rough estimate based on filter count
        const baseEstimate = 1000;
        const filterReduction = Math.pow(0.5, query.filters.length);
        const estimated = Math.floor(baseEstimate * filterReduction);
        
        // Apply limit if present
        if (query.limit) {
            return Math.min(estimated, query.limit);
        }
        
        return estimated;
    }
    
    /**
     * Record a query execution for statistics
     * @private
     */
    private recordExecution(
        objectName: string,
        executionTime: number,
        query: UnifiedQuery
    ): void {
        // Update totals
        this.stats.totalQueries++;
        this.executionTimes.push(executionTime);
        
        // Update average
        this.stats.avgExecutionTime = 
            this.executionTimes.reduce((sum, t) => sum + t, 0) / this.executionTimes.length;
        
        // Update min/max
        this.stats.slowestQuery = Math.max(this.stats.slowestQuery, executionTime);
        this.stats.fastestQuery = Math.min(this.stats.fastestQuery, executionTime);
        
        // Update per-object stats
        if (!this.stats.byObject[objectName]) {
            this.stats.byObject[objectName] = { count: 0, avgTime: 0 };
        }
        const objStats = this.stats.byObject[objectName];
        objStats.count++;
        objStats.avgTime = ((objStats.avgTime * (objStats.count - 1)) + executionTime) / objStats.count;
        
        // Track slow queries
        if (this.stats.slowQueries.length < this.MAX_SLOW_QUERIES) {
            this.stats.slowQueries.push({
                objectName,
                executionTime,
                query,
                timestamp: new Date()
            });
            this.stats.slowQueries.sort((a, b) => b.executionTime - a.executionTime);
        } else if (executionTime > this.stats.slowQueries[this.MAX_SLOW_QUERIES - 1].executionTime) {
            this.stats.slowQueries[this.MAX_SLOW_QUERIES - 1] = {
                objectName,
                executionTime,
                query,
                timestamp: new Date()
            };
            this.stats.slowQueries.sort((a, b) => b.executionTime - a.executionTime);
        }
    }
}
