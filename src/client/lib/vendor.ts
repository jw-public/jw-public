// Client-side vendor globals (replacing the twbs:bootstrap and
// mizzao:bootboxjs atmosphere packages, which are incompatible with the
// Meteor 3 module runtime).

// Bootstrap 3 JS plugins (dropdown/collapse/modal/tooltip) — they attach to
// the jQuery global provided by the Meteor jquery package.
import "bootstrap/dist/js/bootstrap.js";

// bootbox dialogs incl. locales; expose as the global the app code uses.
const bootboxModule = require("bootbox/dist/bootbox.all.min.js");

(window as any).bootbox = (bootboxModule as any).default ?? bootboxModule;

// bootbox 5 templates ship aria-hidden="true"; Bootstrap 4+ removes it on
// show, Bootstrap 3 never does — leaving visible dialogs (and all their
// buttons) excluded from the accessibility tree. Strip it whenever a modal
// is shown.
const $doc = (window as any).$(document);
$doc.on("show.bs.modal shown.bs.modal", ".modal", function (this: HTMLElement) {
    (window as any).$(this).removeAttr("aria-hidden");
});
