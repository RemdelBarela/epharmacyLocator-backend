"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLibsFactory = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("./env.js");
class getLibsFactory {
    constructor(builder) {
        Object.defineProperty(this, "builder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: builder
        });
        Object.defineProperty(this, "libFiles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "syncPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
    }
    /**
     * list en cache file in lib folder
     * @returns files in lib directory
     */
    listFiles() {
        if (this.libFiles && this.libFiles.length) {
            return this.libFiles;
        }
        const libDir = this.builder.env.opencvLibDir;
        this.libFiles = node_fs_1.default.readdirSync(libDir);
        return this.libFiles;
    }
    /**
     * lib files are prefixed differently on Unix / Windows base system.
     * @returns current OS prefix
     */
    get getLibPrefix() {
        return env_js_1.Platfrm.isWindows ? "opencv_" : "libopencv_";
    }
    /**
     * @returns lib extention based on current OS
     */
    get getLibSuffix() {
        if (env_js_1.Platfrm.isWindows) {
            return "lib";
        }
        if (env_js_1.Platfrm.isMac) {
            return "dylib";
        }
        return "so";
    }
    /**
     * build a regexp matching os lib file
     * @param opencvModuleName
     * @returns
     */
    getLibNameRegex(opencvModuleName) {
        const regexp = `^${this.getLibPrefix}${opencvModuleName}[0-9.]*\\.${this.getLibSuffix}$`;
        return new RegExp(regexp);
    }
    /**
     * find a lib
     */
    resolveLib(opencvModuleName) {
        const libDir = this.builder.env.opencvLibDir;
        const libFiles = this.listFiles();
        return this.matchLib(opencvModuleName, libDir, libFiles);
    }
    /**
     * Match lib file names in a folder, was part of resolveLib, but was splitted for easy testing
     * @param opencvModuleName openCV module name
     * @param libDir library directory
     * @param libFiles files in lib directory
     * @returns full path to looked up lib file
     */
    matchLib(opencvModuleName, libDir, libFiles) {
        const regexp = this.getLibNameRegex(opencvModuleName);
        const match = libFiles.find((libFile) => !!(libFile.match(regexp) || [])[0]);
        if (!match) {
            return "";
        }
        let fullpath = node_path_1.default.resolve(libDir, match);
        if (this.syncPath) {
            fullpath = node_fs_1.default.realpathSync(fullpath);
        }
        return fullpath;
    }
    getLibs() {
        const libDir = this.builder.env.opencvLibDir;
        // console.log("libDir => ", libDir);
        if (!node_fs_1.default.existsSync(libDir)) {
            throw new Error(`specified lib dir does not exist: ${libDir}`);
        }
        const modules = [];
        const worldModule = "world";
        const worldLibPath = this.resolveLib(worldModule);
        if (worldLibPath) {
            modules.push({
                opencvModule: worldModule,
                libPath: worldLibPath,
            });
        }
        const extra = [...this.builder.env.enabledModules].map((opencvModule) => ({
            opencvModule,
            libPath: this.resolveLib(opencvModule),
        }));
        for (const m of extra) {
            if (m.opencvModule === "world") {
                continue;
            }
            if (m.libPath) {
                modules.push(m);
            }
        }
        return modules;
    }
}
exports.getLibsFactory = getLibsFactory;
