/**
 * Mock for @objectstack/runtime
 * This mock is needed because the npm package has issues with Jest
 * and we want to focus on testing ObjectQL's logic, not the kernel integration.
 */

export class ObjectStackKernel {
    public ql: any = null;
    
    constructor(plugins: any[] = []) {
        // Mock implementation
    }
    
    async start(): Promise<void> {
        // Mock implementation
    }
    
    async seed(): Promise<void> {
        // Mock implementation
    }
    
    async find(objectName: string, query: any): Promise<{ value: Record<string, any>[]; count: number }> {
        return { value: [], count: 0 };
    }
    
    async get(objectName: string, id: string): Promise<Record<string, any>> {
        return {};
    }
    
    async create(objectName: string, data: any): Promise<Record<string, any>> {
        return data;
    }
    
    async update(objectName: string, id: string, data: any): Promise<Record<string, any>> {
        return data;
    }
    
    async delete(objectName: string, id: string): Promise<boolean> {
        return true;
    }
    
    getMetadata(objectName: string): any {
        return {};
    }
    
    getView(objectName: string, viewType?: 'list' | 'form'): any {
        return null;
    }
}

export class ObjectStackRuntimeProtocol {}

export interface RuntimeContext {
    engine: ObjectStackKernel;
}

export interface RuntimePlugin {
    name: string;
    install?: (ctx: RuntimeContext) => void | Promise<void>;
    onStart?: (ctx: RuntimeContext) => void | Promise<void>;
}
