
declare module "meteor/ccorcos:subs-cache" {
  import { ReactiveVar } from "meteor/reactive-var";

  class CachedSubscription {
    /** will cache a subscription and stop after expireAfter unless restarted with sub.restart() */
    stop();

    /** will stop a subscription immediately and remove it from the cache. */
    stopNow();

    /** tells you if an individual subscription is ready */
    ready();

    /** will call a function once an individual subscription is ready */
    onReady(func);
  }

  class SubsCache {
    constructor(options?: {
      // maximum number of cache subscriptions
      cacheLimit?: number;
      // any subscription will be expire after 5 minute, if it's not used again
      expireAter?: number
    })

    public subscribe(name: string, ...rest: any[]): CachedSubscription;
    public subscribeFor(expireAfter: number, name: string, ...rest: any[]): CachedSubscription;
    public clear();


    /** tells you if all subscriptions in the cache are ready */
    public allReady: ReactiveVar<boolean>;

    /** will stop all subscription immediately */
    public clear();

    /** will call a function once all subscription are ready */
    public onReady(func: Function);

  }
}
