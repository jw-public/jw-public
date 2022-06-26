declare module "meteor/ongoworks:security" {

  import { Mongo } from "meteor/mongo";

  interface PermittedChain {
    collections: (collections: Array<Mongo.Collection<any>> | Mongo.Collection<any>) => any;
  }


  interface MethodDefinition<T> {
    fetch?: Array<string>;
    transform?: any;
    deny: (type: string, arg: any, userId: string, doc?: T, fields?: any, modifier?: any) => void;
  }

  export namespace Security {
    function permit(types: Array<"insert" | "update" | "upsert" | "remove">): PermittedChain;
    function defineMethod<T>(name: string, definition: MethodDefinition<T>): void;
  }

}
