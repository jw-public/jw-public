// Central import shim for the npm simpl-schema package (CJS default export)
// so the rest of the codebase keeps a plain `SimpleSchema` import without
// enabling esModuleInterop globally.
// collection2 v4 only patches Mongo.Collection (attachSchema & friends)
// once its static entry point is imported.
import "meteor/aldeed:collection2/static";
// collection2 v4 resolves SimpleSchema exclusively from the (rewritten)
// aldeed:simple-schema atmosphere package — not from npm simpl-schema.
import * as SSModule from "meteor/aldeed:simple-schema";

const SimpleSchema: any = (SSModule as any).default ?? (SSModule as any).SimpleSchema ?? SSModule;

// simpl-schema v3 dropped the bundled RegEx constants; restore the ones this
// app uses (values from simpl-schema v1).
if (!SimpleSchema.RegEx) {
    SimpleSchema.RegEx = {
        Id: /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/,
        Email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        EmailWithTLD: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
        Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,3}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
    };
}

export default SimpleSchema;
