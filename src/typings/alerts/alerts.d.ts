
declare module Alerts {

  interface Options {

    /**
     * Button with cross icon to hide (close) alert
     */
    dismissable?: boolean;

    /**
     * CSS classes to be appended on each alert DIV (use space for separator)
     */
    classes?: string;

    /**
     * Hide alert after delay in ms or false to infinity
     */
    autoHide?: number|boolean;

    /**
     * Time in ms before alert fully appears
     */
    fadeIn?: number;

    /**
     * If autoHide enabled then fadeOut is time in ms before alert disappears
     */
    fadeOut?: number;

    alertsLimit?: number;
  }

  /**
    * Add an alert
    *
    * @param message (String) Text to display.
    * @param mode (String) One of bootstrap alerts types: 'success', 'info', 'warning', 'danger' (default)
    * @param options (Object) Options if required to override some of default ones.
    *                          See Alerts.defaultOptions for all values.
    */
  function add(message: string, mode: string, options: Options): void;


  /**
   * Call this function before loading a new page to clear errors from previous page
   * Best way is using Router filtering feature to call this function
   */
  function removeSeen(): void;
}
