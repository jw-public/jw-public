// Client-side vendor globals (replacing the twbs:bootstrap and
// mizzao:bootboxjs atmosphere packages, which are incompatible with the
// Meteor 3 module runtime).

// Bootstrap 5 JS bundle (dropdown/collapse/modal/tooltip incl. Popper).
// When a jQuery global is present — Meteor's jquery package loads first —
// Bootstrap also registers its jQuery plugin interface ($().modal() etc.),
// which bootbox relies on.
import "bootstrap/dist/js/bootstrap.bundle.js";

// bootbox 6 dialogs (Bootstrap 5 templates). The locales bundle registers
// itself on the package main (dist/bootbox.js) — use that same instance,
// NOT bootbox.all.min.js, which is a second, separate module instance.
const bootboxModule = require("bootbox/dist/bootbox.js");
require("bootbox/dist/bootbox.locales.min.js");

(window as any).bootbox = (bootboxModule as any).default ?? bootboxModule;
