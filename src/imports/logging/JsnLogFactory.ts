import { injectable } from 'inversify';
import { JL } from "jsnlog";
import { Logger } from './Logger';
import { LoggerFactory } from './LoggerFactory';

@injectable()
export class JsnLogFactory implements LoggerFactory {


    createLogger(identifier: string): Logger {
        return JL(identifier);
    }
}