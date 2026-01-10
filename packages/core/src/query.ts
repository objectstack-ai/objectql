export type FilterCriterion = [string, string, any];
export type FilterExpression = FilterCriterion | 'and' | 'or' | FilterExpression[];

export interface UnifiedQuery {
    fields?: string[];
    filters?: FilterExpression[];
    sort?: [string, 'asc' | 'desc'][];
    skip?: number;
    limit?: number;
    expand?: Record<string, UnifiedQuery>;
}
