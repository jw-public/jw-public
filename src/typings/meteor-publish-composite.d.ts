// reywood:publish-composite ships only a minimal options-object typing that
// does not cover the function-config form this app uses, so the
// Meteor.publishComposite surface is declared here against the upstream
// Subscription type. find() may return null/undefined (= publish nothing).
declare module "meteor/meteor" {
  import { Mongo } from "meteor/mongo";

  export module Meteor {
    interface PublishCompositeConfigN {
      children?: PublishCompositeConfigN[];
      find(this: Subscription, ...args: any[]): Mongo.Cursor<any> | null | undefined;
    }

    interface PublishCompositeConfig1<InLevel1, OutLevel> {
      children?: PublishCompositeConfigN[];
      find(this: Subscription, arg1: InLevel1): Mongo.Cursor<OutLevel> | null | undefined;
    }

    interface PublishCompositeConfig<OutLevel> {
      children?: PublishCompositeConfig1<OutLevel, any>[];
      find(this: Subscription): Mongo.Cursor<OutLevel> | null | undefined;
    }

    export function publishComposite(
      name: string,
      config:
        | PublishCompositeConfig<any>
        | PublishCompositeConfig<any>[]
        | null,
    ): void;

    export function publishComposite(
      name: string,
      configFunc: (
        this: Subscription,
        ...args: any[]
      ) =>
        | PublishCompositeConfig<any>
        | PublishCompositeConfig<any>[]
        | null
        | Promise<PublishCompositeConfig<any> | PublishCompositeConfig<any>[] | null>,
    ): void;
  }
}
