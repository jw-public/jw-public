import { injectable } from 'inversify';
import { LoggerFactory } from './LoggerFactory';
import { Logger } from './Logger';
import { JL } from "jsnlog";

@injectable()
export class JsnLogFactory implements LoggerFactory {


    createLogger(identifier: string): Logger {
        return JL(identifier);
    }
}