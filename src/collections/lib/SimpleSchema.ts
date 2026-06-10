// Central import shim for the npm simpl-schema package (CJS default export)
// so the rest of the codebase keeps a plain `SimpleSchema` import without
// enabling esModuleInterop globally.
import * as SS from "simpl-schema";

const SimpleSchema: any = (SS as any).default ?? SS;

export default SimpleSchema;
