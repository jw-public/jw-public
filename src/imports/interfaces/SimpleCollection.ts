interface Selector {
  [key: string]: any;
}

interface Modifier {}
interface SortSpecifier {}
interface FieldSpecifier {
  [id: string]: number;
}

export interface SimpleCollectionStatic {
  new <T>(
    name: string,
    options?: {
      connection?: object;
      idGeneration?: string;
      transform?: Function;
    },
  ): SimpleCollection<T>;
}
// allow/deny intentionally omitted: security rules are attached to the real
// collections in server/security.ts, never through this narrowed view.
export interface SimpleCollection<T> {
  find(
    selector?: Selector | string,
    options?: {
      sort?: SortSpecifier;
      skip?: number;
      limit?: number;
      fields?: FieldSpecifier;
      reactive?: boolean;
      transform?: Function;
    },
  ): Cursor<T>;
  findOne(
    selector?: Selector | string,
    options?: {
      sort?: SortSpecifier;
      skip?: number;
      fields?: FieldSpecifier;
      reactive?: boolean;
      transform?: Function;
    },
  ): T | undefined;
  insert(doc: T, callback?: Function): string;
  remove(selector: Selector | string, callback?: Function): number;
  update(
    selector: Selector | string,
    modifier: Modifier,
    options?: {
      multi?: boolean;
      upsert?: boolean;
    },
    callback?: Function,
  ): number;
  upsert(
    selector: Selector | string,
    modifier: Modifier,
    options?: {
      multi?: boolean;
    },
    callback?: Function,
  ): { numberAffected?: number; insertedId?: string };

  // ---- Meteor 3 async API (server side) ----------------------------------
  findOneAsync(
    selector?: Selector | string,
    options?: {
      sort?: SortSpecifier;
      skip?: number;
      fields?: FieldSpecifier;
      reactive?: boolean;
      transform?: Function;
    },
  ): Promise<T | undefined>;
  insertAsync(doc: T, callback?: Function): Promise<string>;
  removeAsync(selector: Selector | string): Promise<number>;
  updateAsync(
    selector: Selector | string,
    modifier: Modifier,
    options?: {
      multi?: boolean;
      upsert?: boolean;
    },
  ): Promise<number>;
  upsertAsync(
    selector: Selector | string,
    modifier: Modifier,
    options?: {
      multi?: boolean;
    },
  ): Promise<{ numberAffected?: number; insertedId?: string }>;
}

export interface CursorStatic {
  new <T>(): Cursor<T>;
}

interface Cursor<T> {
  count(): number;
  fetch(): Array<T>;
  forEach(callback: (doc: T, index: number, cursor: Cursor<T>) => void, thisArg?: any): void;
  map<U>(callback: (doc: T, index: number, cursor: Cursor<T>) => U, thisArg?: any): Array<U>;

  // ---- Meteor 3 async API (server side) ----------------------------------
  countAsync(): Promise<number>;
  fetchAsync(): Promise<Array<T>>;
  forEachAsync(
    callback: (doc: T, index: number, cursor: Cursor<T>) => void,
    thisArg?: any,
  ): Promise<void>;
  mapAsync<U>(
    callback: (doc: T, index: number, cursor: Cursor<T>) => U,
    thisArg?: any,
  ): Promise<Array<U>>;
}

export interface ObjectIDStatic {
  new (hexString?: string): any;
}
