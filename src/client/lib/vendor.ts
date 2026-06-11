// Client-side vendor globals (replacing the twbs:bootstrap atmosphere
// package, which is incompatible with the Meteor 3 module runtime).

// Bootstrap 5 JS bundle (dropdown/collapse/tooltip incl. Popper) — exposes
// window.bootstrap; jQuery-free since the app dropped bootbox and jQuery.
import "bootstrap/dist/js/bootstrap.bundle.js";
