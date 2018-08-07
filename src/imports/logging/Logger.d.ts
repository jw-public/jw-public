export interface Logger {
    trace(logObject: any): any;
    debug(logObject: any): any;
    info(logObject: any): any;
    warn(logObject: any): any;
    error(logObject: any): any;
    fatal(logObject: any): any;
    fatalException(logObject: any, e: any): any;
}