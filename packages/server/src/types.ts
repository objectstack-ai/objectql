// src/types.ts
export interface ObjectQLRequest {
    // Identity provided by the framework adapter (e.g. from session)
    user?: {
        id: string;
        roles: string[];
        [key: string]: any;
    };
    
    // The actual operation
    op: 'find' | 'findOne' | 'create' | 'update' | 'delete' | 'count' | 'action';
    object: string;
    
    // Arguments
    args: any;
}

export interface ObjectQLResponse {
    data?: any;
    error?: {
        code: string;
        message: string;
    }
}
