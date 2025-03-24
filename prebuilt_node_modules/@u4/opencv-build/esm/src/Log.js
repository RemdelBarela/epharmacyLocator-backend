import Logger from "@denodnt/logger";
export const logger = new Logger();
export default class Log {
    static log(level, prefix, message, ...args) {
        if (!Log.silence) {
            switch (level) {
                case "info":
                    logger.info(prefix, message, ...args);
                    break;
                case "warn":
                    logger.warn(prefix, message, ...args);
                    break;
                case "error":
                    logger.error(prefix, message, ...args);
                    break;
                default:
                    logger.info(prefix, message, ...args);
                    break;
            }
            // log.log(level, prefix, message, ...args);
        }
    }
    info(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return logger.info(...args);
    }
    warn(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return logger.warn(...args);
    }
    error(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return logger.error(...args);
    }
    silly(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return logger.info(...args);
    }
    verbose(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return logger.info(...args);
    }
    static set level(level) {
        //  npmlog.level = level;
    }
}
