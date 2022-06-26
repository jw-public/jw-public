import { injectable } from 'inversify';
import { Logger } from './Logger';
import { LoggerFactory } from './LoggerFactory';

@injectable()
export class SimpleConsoleLoggerFactory implements LoggerFactory {


    createLogger(identifier: string): Logger {
        return new SimpleConsoleLogger(identifier);
    }
}

class SimpleConsoleLogger implements Logger {

    constructor(private identifier: string) {

    }

    trace(logObject: any) {
        this.log("trace", logObject);
    }
    debug(logObject: any) {
        this.log("debug", logObject);
    }
    info(logObject: any) {
        this.log("info", logObject);
    }
    warn(logObject: any) {
        this.log("warn", logObject);
    }
    error(logObject: any) {
        this.log("error", logObject);
    }
    fatal(logObject: any) {
        this.log("fatal", logObject);
    }
    fatalException(logObject: any, e: any) {
        this.log("fatalException", e);
    }

    private log(level: string, logObject: any) {
        console.log(`${level}\t| ${this.identifier}\t| ${JSON.stringify(logObject)}`);
    }

}