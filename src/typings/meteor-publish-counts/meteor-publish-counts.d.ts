
declare module "meteor/tmeasday:publish-counts" {
  import { Subscription } from "meteor/meteor";
  import { Mongo } from "meteor/mongo";


  export namespace Counts {

    interface CountOptions<T> {
      noReady?: boolean;
      nonReactive?: boolean;
      countFromField?: string | { (doc?: T): any; };
      countFromFieldLength?: string | { (doc?: T): any; };
      noWarnings?: boolean;
    }

    function publish<T>(subscription: Subscription, counterName: string, cursor: Mongo.Cursor<T>, options?: CountOptions<T>): any;

    function get(counterName: string): number;

    function has(counterName: string): boolean;

  }
}
