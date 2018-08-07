import { Logger } from './Logger';

export interface LoggerFactory {
    createLogger(identifier: string): Logger;
}