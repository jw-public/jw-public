// Client-side vendor globals (replacing the twbs:bootstrap and
// mizzao:bootboxjs atmosphere packages, which are incompatible with the
// Meteor 3 module runtime).

// Bootstrap 3 JS plugins (dropdown/collapse/modal/tooltip) — they attach to
// the jQuery global provided by the Meteor jquery package.
import "bootstrap/dist/js/bootstrap.js";

// bootbox dialogs incl. locales; expose as the global the app code uses.
const bootboxModule = require("bootbox/dist/bootbox.all.min.js");

(window as any).bootbox = (bootboxModule as any).default ?? bootboxModule;
