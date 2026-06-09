declare module "meteor/react-meteor-data" {
    export function useTracker<T>(reactiveFn: () => T, deps?: ReadonlyArray<any>): T;
    export function useSubscribe(name?: string, ...args: any[]): () => boolean;
    export function useFind<T>(factory: () => any, deps?: ReadonlyArray<any>): T[];
    export function withTracker(options: any): (component: any) => any;
}
