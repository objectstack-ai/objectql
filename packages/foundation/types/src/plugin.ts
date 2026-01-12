import { IObjectQL } from './app';

export interface ObjectQLPlugin {
    name: string;
    setup(app: IObjectQL): void | Promise<void>;
}
