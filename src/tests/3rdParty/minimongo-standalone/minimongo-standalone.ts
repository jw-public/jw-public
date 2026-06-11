import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";

const RawLocalCollection: any = require("./minimongo-standalone-js").LocalCollection;

// The standalone minimongo build predates Meteor 3 and only ships the sync
// API. The server code under test now uses the async API exclusively, so we
// shim the *Async variants as Promise-wrapped versions of their sync
// counterparts (which is exactly how client-side minimongo implements them).
const proto = RawLocalCollection.prototype;
proto.findOneAsync = async function (...args: any[]) {
  return this.findOne(...args);
};
proto.insertAsync = async function (...args: any[]) {
  return this.insert(...args);
};
proto.updateAsync = async function (...args: any[]) {
  return this.update(...args);
};
proto.removeAsync = async function (...args: any[]) {
  return this.remove(...args);
};
proto.upsertAsync = async function (...args: any[]) {
  return this.upsert(...args);
};

const cursorProto = RawLocalCollection.Cursor.prototype;
cursorProto.fetchAsync = async function () {
  return this.fetch();
};
cursorProto.countAsync = async function () {
  return this.count();
};
cursorProto.forEachAsync = async function (callback: any, thisArg?: any) {
  return this.forEach(callback, thisArg);
};
cursorProto.mapAsync = async function (callback: any, thisArg?: any) {
  return this.map(callback, thisArg);
};

// Tests seed deliberately partial fixture documents, so the test double's
// insert is typed against Partial<T> (the real schema is not attached here).
export interface TestCollection<T> extends Omit<SimpleCollection<T>, "insert" | "insertAsync"> {
  insert(doc: Partial<T>, callback?: Function): string;
  insertAsync(doc: Partial<T>, callback?: Function): Promise<string>;
}

export interface TestCollectionStatic {
  new <T>(
    name: string,
    options?: {
      connection?: object;
      idGeneration?: string;
      transform?: Function;
    },
  ): TestCollection<T>;
}

export const LocalCollection: TestCollectionStatic = RawLocalCollection;
