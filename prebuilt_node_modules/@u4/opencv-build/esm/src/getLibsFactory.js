import fs from "node:fs";
import path from "node:path";
import { Platfrm } from "./env.js";
export class getLibsFactory {
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
        this.libFiles = fs.readdirSync(libDir);
        return this.libFiles;
    }
    /**
     * lib files are prefixed differently on Unix / Windows base system.
     * @returns current OS prefix
     */
    get getLibPrefix() {
        return Platfrm.isWindows ? "opencv_" : "libopencv_";
    }
    /**
     * @returns lib extention based on current OS
     */
    get getLibSuffix() {
        if (Platfrm.isWindows) {
            return "lib";
        }
        if (Platfrm.isMac) {
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
        let fullpath = path.resolve(libDir, match);
        if (this.syncPath) {
            fullpath = fs.realpathSync(fullpath);
        }
        return fullpath;
    }
    getLibs() {
        const libDir = this.builder.env.opencvLibDir;
        // console.log("libDir => ", libDir);
        if (!fs.existsSync(libDir)) {
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
