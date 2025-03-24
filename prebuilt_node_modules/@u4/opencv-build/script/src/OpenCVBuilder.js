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
exports.OpenCVBuilder = void 0;
const dntShim = __importStar(require("../_dnt.shims.js"));
const node_fs_1 = __importDefault(require("node:fs"));
const utils = __importStar(require("./utils.js"));
const getLibsFactory_js_1 = require("./getLibsFactory.js");
const setupOpencv_js_1 = require("./setupOpencv.js");
const constants_js_1 = require("./constants.js");
const OpenCVBuildEnv_js_1 = __importDefault(require("./OpenCVBuildEnv.js"));
const misc_js_1 = require("./misc.js");
const Log_js_1 = __importStar(require("./Log.js"));
class OpenCVBuilder {
    constructor(opts) {
        Object.defineProperty(this, "constant", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "getLibs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "env", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (Array.isArray(opts)) {
            opts = (0, misc_js_1.args2Option)(opts);
            if (opts.verbose) {
                Log_js_1.logger.enableConsole();
                // Log.level = "verbose";
            }
            if (opts.extra && (opts.extra.help || opts.extra.h)) {
                console.log("npm-opencv-build usage:");
                console.log((0, misc_js_1.genHelp)());
                dntShim.Deno.exit(1);
                // process.exit(1);
            }
        }
        if (opts instanceof OpenCVBuildEnv_js_1.default) {
            this.env = opts;
        }
        else {
            this.env = new OpenCVBuildEnv_js_1.default(opts);
        }
        if (!this.env.prebuild) {
            Log_js_1.default.log("info", "init", `${utils.highlight("Workdir")} will be: ${utils.formatNumber("%s")}`, this.env.opencvRoot);
        }
        this.constant = new constants_js_1.Constant(this);
        this.getLibs = new getLibsFactory_js_1.getLibsFactory(this);
    }
    checkInstalledLibs(autoBuildFile) {
        let hasLibs = true;
        Log_js_1.default.log("info", "install", "checking for opencv libraries");
        if (!node_fs_1.default.existsSync(this.env.opencvLibDir)) {
            Log_js_1.default.log("info", "install", "library dir does not exist:", this.env.opencvLibDir);
            return false;
        }
        const installedLibs = this.getLibs.getLibs();
        autoBuildFile.modules.forEach(({ opencvModule, libPath }) => {
            if (!libPath) {
                Log_js_1.default.log("info", "install", "%s: %s", opencvModule, "ignored");
                return;
            }
            const foundLib = installedLibs.find((lib) => lib.opencvModule === opencvModule);
            hasLibs = hasLibs && !!foundLib;
            Log_js_1.default.log("info", "install", `lib ${utils.formatNumber("%s")}: ${utils.light("%s")}`, opencvModule, foundLib ? foundLib.libPath : "not found");
        });
        return hasLibs;
    }
    async install() {
        let time = Date.now();
        // if project directory has a package.json containing opencv4nodejs variables
        // apply these variables to the process environment
        // this.env.applyEnvsFromPackageJson()
        if (this.env.isAutoBuildDisabled) {
            Log_js_1.default.log("info", "install", `${utils.highlight("OPENCV4NODEJS_DISABLE_AUTOBUILD")} is set skipping auto build...`);
            const setup = new setupOpencv_js_1.SetupOpencv(this);
            setup.writeAutoBuildFile(true);
            setup.linkBuild();
            return;
        }
        Log_js_1.default.log("info", "install", `if you want to use an own OpenCV build set ${utils.highlight("OPENCV4NODEJS_DISABLE_AUTOBUILD")} to 1, and fill ${misc_js_1.OPENCV_PATHS_ENV.map(utils.highlight).join(", ")} environement variables`);
        // prevent rebuild on every install
        const autoBuildFile = this.env.readAutoBuildFile();
        if (autoBuildFile) {
            Log_js_1.default.log("info", "install", `found previous build summery auto-build.json: ${utils.highlight(this.env.autoBuildFile)}`);
            if (autoBuildFile.opencvVersion !== this.env.opencvVersion) {
                // can no longer occure with this version of opencv4nodejs-builder
                Log_js_1.default.log("info", "install", `auto build opencv version is ${autoBuildFile.opencvVersion}, but AUTOBUILD_OPENCV_VERSION=${this.env.opencvVersion}, Will rebuild`);
            }
            else if (autoBuildFile.autoBuildFlags !== this.env.autoBuildFlags) {
                // should no longer occure since -MD5(autoBuildFlags) is append to build path
                Log_js_1.default.log("info", "install", `auto build flags are ${autoBuildFile.autoBuildFlags}, but AUTOBUILD_FLAGS is ${this.env.autoBuildFlags}, Will rebuild`);
            }
            else {
                const hasLibs = this.checkInstalledLibs(autoBuildFile);
                if (hasLibs) {
                    Log_js_1.default.log("info", "install", `all libraries are installed in ${utils.highlight(this.env.opencvLibDir)} => ${utils.highlight("Skip building")}`);
                    return;
                }
                else {
                    Log_js_1.default.log("info", "install", "missing some libraries");
                }
            }
        }
        else {
            // OpenCVBuildEnv.log('info', 'install', `failed to find auto-build.json: ${this.env.autoBuildFile}`)
        }
        Log_js_1.default.log("info", "install", "");
        Log_js_1.default.log("info", "install", "running install script...");
        Log_js_1.default.log("info", "install", "");
        Log_js_1.default.log("info", "install", `opencv version: ${utils.formatNumber("%s")}`, this.env.opencvVersion);
        Log_js_1.default.log("info", "install", `with opencv contrib: ${utils.formatNumber("%s")}`, this.env.isWithoutContrib ? "no" : "yes");
        Log_js_1.default.log("info", "install", `custom build flags: ${utils.formatNumber("%s")}`, this.env.autoBuildFlags || "< none >");
        Log_js_1.default.log("info", "install", "");
        try {
            await utils.requireGit();
            await utils.requireCmake();
            const setup = new setupOpencv_js_1.SetupOpencv(this);
            await setup.start();
            time = Date.now() - time;
            const date = new Date(time);
            const timeString = date.toISOString().substring(11, 19);
            Log_js_1.default.log("info", "install", `Total Build Time: ${utils.formatNumber(timeString)}`);
        }
        catch (err) {
            if (err instanceof Error) {
                Log_js_1.default.log("error", "install", err.toString());
            }
            else {
                Log_js_1.default.log("error", "install", JSON.stringify(err));
            }
            dntShim.Deno.exit(1);
            // process.exit(1);
        }
    }
}
exports.OpenCVBuilder = OpenCVBuilder;
exports.default = OpenCVBuilder;
