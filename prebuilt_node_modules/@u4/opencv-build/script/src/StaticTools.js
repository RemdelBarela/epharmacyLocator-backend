"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dntShim = __importStar(require("../_dnt.shims.js"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("./env.js");
const detector = __importStar(require("./helper/detect.js"));
const Log_js_1 = __importDefault(require("./Log.js"));
const utils_js_1 = require("./utils.js");
class StaticTools {
    constructor() {
        Object.defineProperty(this, "readEnvsFromPackageJsonLog", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    /**
     * Find the proper root dir, this directory will contains all openCV source code and a subfolder per build
     * @param opts
     * @returns
     */
    getBuildDir(opts = {}) {
        let buildRoot = opts.buildRoot || (0, env_js_1.getEnv)("OPENCV_BUILD_ROOT") ||
            node_path_1.default.join((0, env_js_1.getDirname)(), "..");
        if (buildRoot[0] === "~") {
            buildRoot = node_path_1.default.join(node_os_1.default.homedir(), buildRoot.slice(1));
        }
        return buildRoot;
    }
    getPackageJson() {
        // return path.resolve(process.cwd(), "package.json");
        return dntShim.Deno.realPathSync(dntShim.Deno.cwd() + "/package.json");
    }
    /**
     * autodetect path using common values.
     * @return number of updated env variable from 0 to 3
     */
    autoLocatePrebuild() {
        let changes = 0;
        const summery = [];
        if (!(0, env_js_1.getEnv)("OPENCV_BIN_DIR")) {
            const candidate = detector.detectBinDir();
            if (candidate) {
                (0, env_js_1.setEnv)("OPENCV_BIN_DIR", candidate);
                changes++;
            }
        }
        if (!(0, env_js_1.getEnv)("OPENCV_LIB_DIR")) {
            const candidate = detector.detectLibDir();
            if (candidate) {
                (0, env_js_1.setEnv)("OPENCV_LIB_DIR", candidate);
                changes++;
            }
        }
        if (!(0, env_js_1.getEnv)("OPENCV_INCLUDE_DIR")) {
            const candidate = detector.detectIncludeDir();
            if (candidate) {
                (0, env_js_1.setEnv)("OPENCV_INCLUDE_DIR", candidate);
                changes++;
            }
        }
        return { changes, summery };
    }
    /**
     * list existing build in the diven directory
     * @param rootDir build directory
     * @returns builds list
     */
    listBuild(rootDir) {
        let workFolderContent = [];
        try {
            workFolderContent = node_fs_1.default.readdirSync(rootDir);
        }
        catch (err) {
            throw new Error("Failed to list directory: " + rootDir +
                " Check environement variable OPENCV_BUILD_ROOT, " + err);
        }
        const versions = workFolderContent
            .filter((n) => n.startsWith("opencv-"))
            .map((dir) => {
            const autobuild = node_path_1.default.join(rootDir, dir, "auto-build.json");
            try {
                const stats = node_fs_1.default.statSync(autobuild);
                const hash = dir.replace(/^opencv-.+-/, "-");
                const buildInfo = this.readAutoBuildFile(autobuild, true);
                return { autobuild, dir, hash, buildInfo, date: stats.mtime };
            }
            catch (_err) {
                return {
                    autobuild,
                    dir,
                    hash: "",
                    buildInfo: null,
                    date: 0,
                };
            }
        })
            .filter((n) => n.buildInfo);
        return versions;
    }
    /**
     * Read a parse an existing autoBuildFile
     * @param autoBuildFile file path
     * @returns
     */
    readAutoBuildFile(autoBuildFile, quiet) {
        try {
            const fileExists = node_fs_1.default.existsSync(autoBuildFile);
            if (fileExists) {
                const autoBuildFileData = JSON.parse(node_fs_1.default.readFileSync(autoBuildFile).toString());
                if (!autoBuildFileData.opencvVersion ||
                    !("autoBuildFlags" in autoBuildFileData) ||
                    !Array.isArray(autoBuildFileData.modules)) {
                    // if (quiet) return undefined;
                    throw new Error(`auto-build.json has invalid contents, please delete the file: ${autoBuildFile}`);
                }
                return autoBuildFileData;
            }
            if (!quiet) {
                Log_js_1.default.log("info", "readAutoBuildFile", "file does not exists: %s", autoBuildFile);
            }
        }
        catch (err) {
            //if (!quiet)
            if (err instanceof Error) {
                Log_js_1.default.log("error", "readAutoBuildFile", "failed to read auto-build.json from: %s, with error: %s", autoBuildFile, err.toString());
            }
            else {
                Log_js_1.default.log("error", "readAutoBuildFile", "failed to read auto-build.json from: %s, with error: %s", autoBuildFile, JSON.stringify(err));
            }
        }
        return undefined;
    }
    /**
     * extract opencv4nodejs section from package.json if available
     */
    parsePackageJson() {
        const absPath = this.getPackageJson();
        if (!node_fs_1.default.existsSync(absPath)) {
            return null;
        }
        const data = JSON.parse(node_fs_1.default.readFileSync(absPath).toString());
        return { file: absPath, data };
    }
    /**
     * get opencv4nodejs section from package.json if available
     * @returns opencv4nodejs customs
     */
    readEnvsFromPackageJson() {
        const rootPackageJSON = this.parsePackageJson();
        if (!rootPackageJSON) {
            return null;
        }
        if (!rootPackageJSON.data) {
            if (!this.readEnvsFromPackageJsonLog++) {
                Log_js_1.default.log("info", "config", `looking for opencv4nodejs option from ${(0, utils_js_1.highlight)("%s")}`, rootPackageJSON.file);
            }
            return {};
        }
        if (!rootPackageJSON.data.opencv4nodejs) {
            if (!this.readEnvsFromPackageJsonLog++) {
                Log_js_1.default.log("info", "config", `no opencv4nodejs section found in ${(0, utils_js_1.highlight)("%s")}`, rootPackageJSON.file);
            }
            return {};
        }
        if (!this.readEnvsFromPackageJsonLog++) {
            Log_js_1.default.log("info", "config", `found opencv4nodejs section in ${(0, utils_js_1.highlight)("%s")}`, rootPackageJSON.file);
        }
        return rootPackageJSON.data.opencv4nodejs;
    }
}
const singleton = new StaticTools();
exports.default = singleton;
