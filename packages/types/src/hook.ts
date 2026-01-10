import { ObjectQLContext } from "./types";
import { UnifiedQuery } from "./query";

export type HookName = 
    | 'beforeFind' | 'afterFind' 
    | 'beforeCreate' | 'afterCreate' 
    | 'beforeUpdate' | 'afterUpdate' 
    | 'beforeDelete' | 'afterDelete'
    | 'beforeCount' | 'afterCount';

export interface HookContext extends ObjectQLContext {
    objectName: string;
    query?: UnifiedQuery; // For find/count
    doc?: any;            // For create/update
    id?: string | number; // For update/delete/findOne
    result?: any;         // For after* hooks
    meta?: any;           // To pass data between hooks or from main context
}

export type HookHandler = (ctx: HookContext) => Promise<void> | void;
