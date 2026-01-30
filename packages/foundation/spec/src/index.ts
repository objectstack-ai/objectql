/**
 * @objectstack/spec
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Data namespace - Core data structures
 */
export namespace Data {
    /**
     * Select Option
     */
    export interface SelectOption {
        label: string;
        value: string;
    }

    /**
     * Field Types
     */
    export type FieldType = 
        | 'text' 
        | 'textarea' 
        | 'html' 
        | 'number' 
        | 'currency' 
        | 'percent' 
        | 'boolean' 
        | 'date' 
        | 'datetime' 
        | 'time' 
        | 'lookup' 
        | 'master_detail' 
        | 'select' 
        | 'multiselect'
        | 'email'
        | 'url'
        | 'phone'
        | 'image'
        | 'file'
        | 'location'
        | 'json'
        | 'formula'
        | 'autonumber'
        | 'summary';

    /**
     * Field Definition
     */
    export interface Field {
        name: string;
        type: FieldType;
        label?: string;
        required?: boolean;
        readonly?: boolean;
        defaultValue?: any;
        reference_to?: string;
        options?: string[] | SelectOption[];
        formula?: string;
        [key: string]: any;
    }

    /**
     * Filter Operators
     */
    export type FilterOperator = 
        | '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte'
        | '$in' | '$nin' | '$contains' | '$startsWith' | '$endsWith'
        | '$and' | '$or' | '$not';

    /**
     * Filter Condition - MongoDB/Prisma-style filter syntax
     */
    export interface FilterCondition {
        [key: string]: any;
        $eq?: any;
        $ne?: any;
        $gt?: any;
        $gte?: any;
        $lt?: any;
        $lte?: any;
        $in?: any[];
        $nin?: any[];
        $contains?: string;
        $startsWith?: string;
        $endsWith?: string;
        $and?: FilterCondition[];
        $or?: FilterCondition[];
        $not?: FilterCondition;
    }

    /**
     * Sort Order
     */
    export type SortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';

    /**
     * Sort Node
     */
    export interface SortNode {
        field: string;
        order: SortOrder;
    }

    /**
     * Aggregation Function
     */
    export type AggregationFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';

    /**
     * Aggregation Node
     */
    export interface AggregationNode {
        function: AggregationFunction;
        field?: string;
        alias?: string;
    }

    /**
     * QueryAST - Abstract Syntax Tree for queries
     */
    export interface QueryAST {
        object?: string;
        fields?: string[];
        where?: FilterCondition;
        orderBy?: SortNode[];
        offset?: number;
        limit?: number;
        aggregations?: AggregationNode[];
        groupBy?: string[];
        distinct?: boolean;
    }
}

/**
 * UI namespace - UI-related types
 */
export namespace UI {
    /**
     * Action Definition
     */
    export interface Action {
        name: string;
        label?: string;
        on?: 'list' | 'record' | 'list_item';
        type?: 'button' | 'link';
        visible?: boolean | string;
        [key: string]: any;
    }

    /**
     * View Configuration
     */
    export interface View {
        type: 'list' | 'form' | 'detail';
        fields?: string[];
        columns?: any[];
        [key: string]: any;
    }
}

/**
 * System namespace - System-level interfaces
 */
export namespace System {
    /**
     * Driver Interface
     */
    export interface DriverInterface {
        find(objectName: string, query: Data.QueryAST, options?: any): Promise<any[]>;
        findOne(objectName: string, id: string, fields?: any, options?: any): Promise<any>;
        create(objectName: string, data: any, options: any): Promise<any>;
        update(objectName: string, id: string, data: any, options: any): Promise<any>;
        delete(objectName: string, id: string, options: any): Promise<any>;
        count(objectName: string, filters?: Data.FilterCondition, options?: any): Promise<number>;
    }

    /**
     * Driver Options
     */
    export interface DriverOptions {
        connection?: string;
        [key: string]: any;
    }
}
