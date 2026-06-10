// Meteor 3 async collection/account APIs (augmenting the legacy hand-written
// typings in typings/meteor/meteor.d.ts).

declare module "meteor/mongo" {
    module Mongo {
        interface Collection<T> {
            insertAsync(doc: T, callback?: Function): Promise<string>;
            updateAsync(selector: any, modifier: any, options?: any, callback?: Function): Promise<number>;
            upsertAsync(selector: any, modifier: any, options?: any): Promise<{ numberAffected?: number; insertedId?: string }>;
            removeAsync(selector: any): Promise<number>;
            findOneAsync(selector?: any, options?: any): Promise<T | undefined>;
            countDocuments(selector?: any, options?: any): Promise<number>;
        }
        interface Cursor<T> {
            fetchAsync(): Promise<Array<T>>;
            forEachAsync(callback: (doc: T, index: number, cursor: Cursor<T>) => void, thisArg?: any): Promise<void>;
            mapAsync<U>(callback: (doc: T, index: number, cursor: Cursor<T>) => U, thisArg?: any): Promise<Array<U>>;
            countAsync(): Promise<number>;
            observeChangesAsync(callbacks: Object): Promise<{ stop(): void }>;
            observeAsync(callbacks: Object): Promise<{ stop(): void }>;
        }
    }
}

declare module "meteor/meteor" {
    module Meteor {
        interface User {
            roles?: string[];
            groups?: string[];
            notice?: string;
        }
    }
}

declare module "meteor/accounts-base" {
    module Accounts {
        function createUserAsync(options: {
            username?: string;
            email?: string;
            password?: string;
            profile?: Object;
        }, callback?: Function): Promise<string>;
        function setPasswordAsync(userId: string, newPassword: string, options?: Object): Promise<void>;
    }
}
