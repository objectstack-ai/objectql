import { MetadataRegistry } from './registry';

export interface LoaderHandlerContext {
    file: string;
    content: string;
    registry: MetadataRegistry;
    packageName?: string;
}

export type LoaderHandler = (ctx: LoaderHandlerContext) => void;

export interface LoaderPlugin {
    name: string;
    glob: string[];
    handler: LoaderHandler;
    options?: any;
}
