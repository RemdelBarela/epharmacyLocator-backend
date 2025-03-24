"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger_1 = __importDefault(require("@denodnt/logger"));
exports.logger = new logger_1.default();
class Log {
    static log(level, prefix, message, ...args) {
        if (!Log.silence) {
            switch (level) {
                case "info":
                    exports.logger.info(prefix, message, ...args);
                    break;
                case "warn":
                    exports.logger.warn(prefix, message, ...args);
                    break;
                case "error":
                    exports.logger.error(prefix, message, ...args);
                    break;
                default:
                    exports.logger.info(prefix, message, ...args);
                    break;
            }
            // log.log(level, prefix, message, ...args);
        }
    }
    info(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return exports.logger.info(...args);
    }
    warn(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return exports.logger.warn(...args);
    }
    error(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return exports.logger.error(...args);
    }
    silly(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return exports.logger.info(...args);
    }
    verbose(...args) {
        if (Log.silence) {
            return Promise.resolve();
        }
        return exports.logger.info(...args);
    }
    static set level(level) {
        //  npmlog.level = level;
    }
}
exports.default = Log;
