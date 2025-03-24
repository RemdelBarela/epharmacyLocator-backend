/**
 * portable env functions
 */
export declare function getEnv(name: string): string;
export declare function setEnv(name: string, value: string): void;
export declare function getDirname(): string;
export declare class Platfrm {
    static theOS: string;
    static changeOS(os: "windows" | "linux" | "darwin" | string): void;
    static get isWindows(): boolean;
    static get isLinux(): boolean;
    static get isMac(): boolean;
}
export declare function getArch(): string;
//# sourceMappingURL=env.d.ts.map