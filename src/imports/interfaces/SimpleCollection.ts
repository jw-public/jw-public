interface Selector {
  [key: string]: any;
}
interface Selector extends Object { }
interface Modifier { }
interface SortSpecifier { }
interface FieldSpecifier {
  [id: string]: Number;
}

export interface SimpleCollectionStatic {
  new <T>(name: string, options?: {
    connection?: Object;
    idGeneration?: string;
    transform?: Function;
  }): SimpleCollection<T>;
}
export interface SimpleCollection<T> {
  allow(options: {
    insert?: (userId: string, doc: T) => boolean;
    update?: (userId: string, doc: T, fieldNames: string[], modifier: any) => boolean;
    remove?: (userId: string, doc: T) => boolean;
    fetch?: string[];
    transform?: Function;
  }): boolean;
  deny(options: {
    insert?: (userId: string, doc: T) => boolean;
    update?: (userId: string, doc: T, fieldNames: string[], modifier: any) => boolean;
    remove?: (userId: string, doc: T) => boolean;
    fetch?: string[];
    transform?: Function;
  }): boolean;
  find(selector?: Selector | string, options?: {
    sort?: SortSpecifier;
    skip?: number;
    limit?: number;
    fields?: FieldSpecifier;
    reactive?: boolean;
    transform?: Function;
  }): Cursor<T>;
  findOne(selector?: Selector | string, options?: {
    sort?: SortSpecifier;
    skip?: number;
    fields?: FieldSpecifier;
    reactive?: boolean;
    transform?: Function;
  }): T;
  insert(doc: T, callback?: Function): string;
  remove(selector: Selector | string, callback?: Function): number;
  update(selector: Selector | string, modifier: Modifier, options?: {
    multi?: boolean;
    upsert?: boolean;
  }, callback?: Function): number;
  upsert(selector: Selector | string, modifier: Modifier, options?: {
    multi?: boolean;
  }, callback?: Function): { numberAffected?: number; insertedId?: string; };
}

interface CursorStatic {
  new <T>(): Cursor<T>;
}

interface Cursor<T> {
  count(): number;
  fetch(): Array<T>;
  forEach(callback: (doc: T, index: number, cursor: Cursor<T>) => void, thisArg?: any): void;
  map<U>(callback: (doc: T, index: number, cursor: Cursor<T>) => U, thisArg?: any): Array<U>;
}

interface ObjectIDStatic {
  new(hexString?: string): any;
}
