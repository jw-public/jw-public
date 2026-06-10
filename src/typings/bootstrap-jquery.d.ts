// Bootstrap 5 jQuery interface (registered by bootstrap.bundle.js when a
// jQuery global is present) — only the plugins this app actually calls.
interface JQuery {
    modal(action?: string | object): JQuery;
    tooltip(action?: string | object): JQuery;
    dropdown(action?: string): JQuery;
    collapse(action?: string): JQuery;
}
