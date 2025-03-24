import Logger from "@denodnt/logger";
export type LogLevels = "silly" | "verbose" | "info" | "warn" | "error";
export declare const logger: Logger;
export default class Log {
    static silence: boolean;
    static log(level: LogLevels | string, prefix: string, message: string, ...args: unknown[]): void;
    info(...args: unknown[]): Promise<void>;
    warn(...args: unknown[]): Promise<void>;
    error(...args: unknown[]): Promise<void>;
    silly(...args: unknown[]): Promise<void>;
    verbose(...args: unknown[]): Promise<void>;
    static set level(level: LogLevels);
}
//# sourceMappingURL=Log.d.ts.map