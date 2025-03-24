var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _OpenCVBuildEnv_cudaArch, _OpenCVBuildEnv_packageEnv, _OpenCVBuildEnv_ready, _OpenCVBuildEnv_enabledModules;
import * as dntShim from "../_dnt.shims.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { formatNumber, highlight, isCudaAvailable } from "./utils.js";
import { ALLARGS, MODEULES_MAP, OPENCV_PATHS_ENV } from "./misc.js";
import { ALL_OPENCV_MODULES } from "./misc.js";
import * as detector from "./helper/detect.js";
import { getEnv, Platfrm, setEnv } from "./env.js";
import Log from "./Log.js";
import StaticTools from "./StaticTools.js";
import { pc } from "../deps.js";
function toBool(value) {
    if (!value) {
        return false;
    }
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value > 0;
    }
    value = value.toLowerCase();
    if (value === "0" || value === "false" || value === "off" ||
        value.startsWith("disa")) {
        return false;
    }
    return true;
}
// const DEFAULT_OPENCV_VERSION = '4.6.0';
class OpenCVBuildEnv {
    get cudaArch() {
        const arch = __classPrivateFieldGet(this, _OpenCVBuildEnv_cudaArch, "f");
        if (!arch) {
            return "";
        }
        if (!arch.match(/^(\d+\.\d+)(,\d+\.\d+)*$/)) {
            throw Error(`invalid value for cudaArch "${arch}" should be a list of valid cuda arch separated by comma like: "7.5,8.6"`);
        }
        return arch;
    }
    getExpectedVersion(defaultVersion) {
        if (this.no_autobuild) {
            return "0.0.0";
        }
        const opencvVersion = this.resolveValue(ALLARGS.version);
        if (opencvVersion) {
            return opencvVersion;
        }
        return defaultVersion || "";
        // return '0.0.0'; //DEFAULT_OPENCV_VERSION;
    }
    // private getExpectedBuildWithCuda(): boolean {
    //     return !!this.resolveValue(ALLARGS.cuda);
    // }
    // this.autoBuildFlags = this.resolveValue(ALLARGS.flags);
    // this.#cudaArch = this.resolveValue(ALLARGS.cudaArch);
    // this.isWithoutContrib = !!this.resolveValue(ALLARGS.nocontrib);
    // this.isAutoBuildDisabled = !!this.resolveValue(ALLARGS.nobuild);
    // this.keepsources = !!this.resolveValue(ALLARGS.keepsources);
    // this.dryRun = !!this.resolveValue(ALLARGS['dry-run']);
    // this.gitCache = !!this.resolveValue(ALLARGS['git-cache']);
    resolveValue(info) {
        let value = "";
        if (info.conf in this.opts) {
            value = this.opts[info.conf] || "";
        }
        else {
            if (__classPrivateFieldGet(this, _OpenCVBuildEnv_packageEnv, "f") && __classPrivateFieldGet(this, _OpenCVBuildEnv_packageEnv, "f")[info.conf]) {
                value = __classPrivateFieldGet(this, _OpenCVBuildEnv_packageEnv, "f")[info.conf] || "";
            }
            else {
                value = getEnv(info.env) || "";
            }
        }
        if (info.isBool) {
            return toBool(value) ? "1" : "";
        }
        else {
            return value;
        }
    }
    constructor(opts = {}) {
        Object.defineProperty(this, "opts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: opts
        });
        Object.defineProperty(this, "prebuild", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * set using env OPENCV4NODEJS_AUTOBUILD_OPENCV_VERSION , or --version or autoBuildOpencvVersion option in package.json
         */
        Object.defineProperty(this, "opencvVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * set using env OPENCV4NODEJS_BUILD_CUDA , or --cuda or autoBuildBuildCuda option in package.json
         */
        Object.defineProperty(this, "buildWithCuda", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        _OpenCVBuildEnv_cudaArch.set(this, "");
        /**
         * set using env OPENCV4NODEJS_AUTOBUILD_WITHOUT_CONTRIB, or --nocontrib arg, or autoBuildWithoutContrib option in package.json
         */
        Object.defineProperty(this, "isWithoutContrib", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /**
         * set using env OPENCV4NODEJS_DISABLE_AUTOBUILD, or --nobuild arg or disableAutoBuild option in package.json
         */
        Object.defineProperty(this, "isAutoBuildDisabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /**
         * set using --keepsources arg or keepsources option in package.json
         */
        Object.defineProperty(this, "keepsources", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /**
         * set using --dry-run arg or dry-run option in package.json
         */
        Object.defineProperty(this, "dryRun", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "gitCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        // root path to look for package.json opencv4nodejs section
        // deprecated directly infer your parameters to the constructor
        Object.defineProperty(this, "autoBuildFlags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // legacy path to package.json dir
        Object.defineProperty(this, "rootcwd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Path to build all openCV libs
        Object.defineProperty(this, "buildRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Path to find package.json legacy option
        Object.defineProperty(this, "packageRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // protected _platform: NodeJS.Platform;
        Object.defineProperty(this, "no_autobuild", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        _OpenCVBuildEnv_packageEnv.set(this, {});
        _OpenCVBuildEnv_ready.set(this, false);
        /** default module build list */
        _OpenCVBuildEnv_enabledModules.set(this, new Set(Object.entries(MODEULES_MAP).filter(([, v]) => v).map(([k]) => k)));
        Object.defineProperty(this, "getConfiguredCmakeFlagsOnce", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "hash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        this.prebuild = opts.prebuild;
        this.packageRoot = opts.rootcwd || getEnv("INIT_CWD") || dntShim.Deno.cwd(); // process.cwd();
        this.buildRoot = StaticTools.getBuildDir(opts);
        // get project Root path to looks for package.json for opencv4nodejs section
        try {
            const data = StaticTools.readEnvsFromPackageJson();
            if (data === null && !this.prebuild) {
                Log.log("info", "config", `No file ${highlight("%s")} found for opencv4nodejs import`, StaticTools.getPackageJson());
            }
            if (data) {
                __classPrivateFieldSet(this, _OpenCVBuildEnv_packageEnv, data, "f");
            }
        }
        catch (err) {
            Log.log("error", "applyEnvsFromPackageJson", "failed to parse package.json:");
            if (err instanceof Error) {
                Log.log("error", "applyEnvsFromPackageJson", err.toString());
            }
            else {
                Log.log("error", "applyEnvsFromPackageJson", JSON.stringify(err));
            }
        }
        // try to use previouse build
        this.no_autobuild = toBool(this.resolveValue(ALLARGS.nobuild)) ? "1" : "";
        if (!this.no_autobuild && opts.prebuild) {
            const builds = StaticTools.listBuild(this.rootDir);
            if (!builds.length) {
                throw Error(`No build found in ${this.rootDir} you should launch opencv-build-npm once`);
            }
            const expVer = this.getExpectedVersion("0.0.0");
            /**
             * try to match the expected version
             */
            let buildV = builds;
            if (expVer != "0.0.0") {
                buildV = buildV.filter((b) => b.buildInfo.opencvVersion === expVer);
            }
            /**
             * but if no match, use the latest build with a different version number.
             */
            // if (buildV.length)
            //     builds = buildV;
            if (!buildV.length) {
                throw Error(`No build of version ${expVer} found in ${this.rootDir} you should launch opencv-build-npm Available versions are: ${builds.map((b) => b.buildInfo.opencvVersion).join(", ")}`);
            }
            if (buildV.length > 1) {
                switch (opts.prebuild) {
                    case "latestBuild":
                        builds.sort((a, b) => b.date.getTime() - a.date.getTime());
                        break;
                    case "latestVersion":
                        builds.sort((a, b) => b.dir.localeCompare(a.dir));
                        break;
                    case "oldestBuild":
                        builds.sort((a, b) => a.date.getTime() - b.date.getTime());
                        break;
                    case "oldestVersion":
                        builds.sort((a, b) => a.dir.localeCompare(b.dir));
                        break;
                }
            }
            // load envthe prevuious build
            const autoBuildFile = builds[0].buildInfo;
            //const autoBuildFile = OpenCVBuildEnv.readAutoBuildFile(builds[0].autobuild);
            //if (!autoBuildFile)
            //    throw Error(`failed to read build info from ${builds[0].autobuild}`);
            const flagStr = autoBuildFile.env.autoBuildFlags;
            this.hash = builds[0].hash;
            // merge -DBUILD_opencv_ to internal BUILD_opencv_ manager
            if (flagStr) {
                const flags = flagStr.split(/\s+/);
                flags.filter((flag) => {
                    if (flag.startsWith("-DBUILD_opencv_")) {
                        // eslint-disable-next-line prefer-const
                        let [mod, activated] = flag.substring(15).split("=");
                        activated = activated.toUpperCase();
                        if (activated === "ON" || activated === "1") {
                            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add(mod);
                        }
                        else if (activated === "OFF" || activated === "0") {
                            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").delete(mod);
                        }
                        return false;
                    }
                    return true;
                });
            }
            this.autoBuildFlags = flagStr;
            this.buildWithCuda = autoBuildFile.env.buildWithCuda;
            this.isAutoBuildDisabled = autoBuildFile.env.isAutoBuildDisabled;
            this.isWithoutContrib = autoBuildFile.env.isWithoutContrib;
            this.opencvVersion = autoBuildFile.env.opencvVersion;
            this.buildRoot = autoBuildFile.env.buildRoot;
            Log.log("debug", "OpenCVBuildEnv", `autoBuildFlags=${highlight(this.autoBuildFlags)}`);
            Log.log("debug", "OpenCVBuildEnv", `buildWithCuda=${highlight("" + (!!this.buildWithCuda))}`);
            Log.log("debug", "OpenCVBuildEnv", `isAutoBuildDisabled=${highlight("" + (this.isAutoBuildDisabled))}`);
            Log.log("debug", "OpenCVBuildEnv", `isWithoutContrib=${highlight("" + (!!this.isWithoutContrib))}`);
            Log.log("debug", "OpenCVBuildEnv", `opencvVersion=${highlight(this.opencvVersion)}`);
            Log.log("debug", "OpenCVBuildEnv", `buildRoot=${highlight(this.buildRoot)}`);
            if (!this.opencvVersion) {
                throw Error(`autobuild file is corrupted, opencvVersion is missing in ${builds[0].autobuild}`);
            }
            setEnv("OPENCV_BIN_DIR", autoBuildFile.env.OPENCV_BIN_DIR);
            setEnv("OPENCV_INCLUDE_DIR", autoBuildFile.env.OPENCV_INCLUDE_DIR);
            setEnv("OPENCV_LIB_DIR", autoBuildFile.env.OPENCV_LIB_DIR);
            if (this.buildWithCuda && isCudaAvailable()) {
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaarithm");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudabgsegm");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudacodec");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudafeatures2d");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudafilters");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaimgproc");
                // this.#enabledModules.add('cudalegacy');
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaobjdetect");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaoptflow");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudastereo");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudawarping");
            }
            return;
        }
        // try to build a new openCV or use a prebuilt one
        if (this.no_autobuild) {
            this.opencvVersion = "0.0.0";
            Log.log("info", "init", `no_autobuild is set.`);
            const changes = StaticTools.autoLocatePrebuild();
            Log.log("info", "init", changes.summery.join("\n"));
        }
        else {
            this.opencvVersion = this.getExpectedVersion("4.10.0");
            Log.log("info", "init", `using openCV verison ${formatNumber(this.opencvVersion)}`);
            if (getEnv("INIT_CWD")) {
                Log.log("info", "init", `${highlight("INIT_CWD")} is defined overwriting root path to ${highlight(getEnv("INIT_CWD"))}`);
            }
            // ensure that OpenCV workdir exists
            if (!fs.existsSync(this.buildRoot)) {
                fs.mkdirSync(this.buildRoot);
                if (!fs.existsSync(this.buildRoot)) {
                    throw new Error(`${this.buildRoot} can not be create`);
                }
            }
        }
        // import configuration from package.json
        const envKeys = Object.keys(__classPrivateFieldGet(this, _OpenCVBuildEnv_packageEnv, "f"));
        if (envKeys.length) {
            // print all imported variables
            Log.log("info", "applyEnvsFromPackageJson", "the following opencv4nodejs environment variables are set in the package.json:");
            envKeys.forEach((key) => Log.log("info", "applyEnvsFromPackageJson", `${highlight(key)}: ${formatNumber(__classPrivateFieldGet(this, _OpenCVBuildEnv_packageEnv, "f")[key] || "")}`));
        }
        this.autoBuildFlags = this.resolveValue(ALLARGS.flags);
        this.buildWithCuda = !!this.resolveValue(ALLARGS.cuda);
        __classPrivateFieldSet(this, _OpenCVBuildEnv_cudaArch, this.resolveValue(ALLARGS.cudaArch), "f");
        this.isWithoutContrib = !!this.resolveValue(ALLARGS.nocontrib);
        this.isAutoBuildDisabled = !!this.resolveValue(ALLARGS.nobuild);
        this.keepsources = !!this.resolveValue(ALLARGS.keepsources);
        this.dryRun = !!this.resolveValue(ALLARGS["dry-run"]);
        this.gitCache = !!this.resolveValue(ALLARGS["git-cache"]);
        if (this.buildWithCuda && isCudaAvailable()) {
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaarithm");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudabgsegm");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudacodec");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudafeatures2d");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudafilters");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaimgproc");
            // this.#enabledModules.add('cudalegacy');
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaobjdetect");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaoptflow");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudastereo");
            __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudawarping");
        }
    }
    /**
     * complet initialisation.
     */
    getReady() {
        if (__classPrivateFieldGet(this, _OpenCVBuildEnv_ready, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _OpenCVBuildEnv_ready, true, "f");
        for (const varname of ["binDir", "incDir", "libDir"]) {
            const varname2 = varname;
            const value = this.resolveValue(ALLARGS[varname2]);
            if (value && getEnv(varname) !== value) {
                setEnv(ALLARGS[varname2].env, value);
            }
        }
        if (this.no_autobuild) {
            // Try autoDetect opencv paths
            if (!getEnv("OPENCV_BIN_DIR") || !getEnv("OPENCV_LIB_DIR") ||
                !getEnv("OPENCV_INCLUDE_DIR")) {
                detector.applyDetect();
            }
            /**
             * no autobuild, all OPENCV_PATHS_ENV should be defined
             */
            const errors = [];
            for (const varname of OPENCV_PATHS_ENV) {
                const value = getEnv(varname);
                if (!value) {
                    errors.push(`${varname} must be define if auto-build is disabled, and autodetection failed`);
                    continue;
                }
                let stats;
                try {
                    stats = fs.statSync(value);
                }
                catch (_e) {
                    errors.push(`${varname} is set to non existing "${value}"`);
                    continue;
                }
                if (!stats.isDirectory()) {
                    errors.push(`${varname} is set to "${value}", that should be a directory`);
                }
            }
            if (errors.length) {
                throw Error([...errors, ...detector.summery].join("\n"));
            }
        }
    }
    get enabledModules() {
        return [...__classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f")];
    }
    enableModule(mod) {
        if (__classPrivateFieldGet(this, _OpenCVBuildEnv_ready, "f")) {
            throw Error("No mode modules change can be done after initialisation done.");
        }
        __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add(mod);
    }
    disableModule(mod) {
        if (__classPrivateFieldGet(this, _OpenCVBuildEnv_ready, "f")) {
            throw Error("No mode modules change can be done after initialisation done.");
        }
        __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").delete(mod);
    }
    /**
     * @returns return cmake flags like: -DBUILD_opencv_modules=ON ...
     */
    getCmakeBuildFlags() {
        const out = [];
        for (const mod of ALL_OPENCV_MODULES) {
            const value = __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").has(mod) ? "ON" : "OFF";
            if (value === "OFF" && MODEULES_MAP[mod] === null) {
                continue;
            }
            out.push(`-DBUILD_opencv_${mod}=${value}`);
        }
        return out.sort();
    }
    // if version < 4.5.6 ffmpeg 5 not compatible
    // https://stackoverflow.com/questions/71070080/building-opencv-from-source-in-mac-m1
    // brew install ffmpeg@4
    // brew unlink ffmpeg
    // brew link ffmpeg@4
    getSharedCmakeFlags() {
        const cMakeflags = [
            `-DCMAKE_INSTALL_PREFIX=${this.opencvBuild}`,
            "-DCMAKE_BUILD_TYPE=Release",
            "-DCMAKE_BUILD_TYPES=Release",
            "-DBUILD_EXAMPLES=OFF", // do not build opencv_contrib samples
            "-DBUILD_DOCS=OFF",
            "-DBUILD_TESTS=OFF",
            "-DBUILD_opencv_dnn=ON", // added 28/12/2022
            "-DENABLE_FAST_MATH=ON",
            "-DBUILD_PERF_TESTS=OFF",
            "-DBUILD_JAVA=OFF",
            "-DBUILD_ZLIB=OFF", // https://github.com/opencv/opencv/issues/21389
            "-DCUDA_NVCC_FLAGS=--expt-relaxed-constexpr",
            "-DWITH_VTK=OFF",
        ];
        if (!this.isWithoutContrib) {
            cMakeflags.push("-DOPENCV_ENABLE_NONFREE=ON", `-DOPENCV_EXTRA_MODULES_PATH=${this.opencvContribModules}`);
        }
        cMakeflags.push(...this.getConfiguredCmakeFlags());
        return cMakeflags;
        // .cMakeflags.push('-DCMAKE_SYSTEM_PROCESSOR=arm64', '-DCMAKE_OSX_ARCHITECTURES=arm64');
    }
    getConfiguredCmakeFlags() {
        const cMakeflags = [];
        if (this.buildWithCuda) {
            if (isCudaAvailable()) {
                // OpenCVBuildEnv.log('info', 'install', 'Adding CUDA flags...');
                // this.enabledModules.delete('cudacodec');// video codec (NVCUVID) is deprecated in cuda 10, so don't add it
                cMakeflags.push("-DWITH_CUDA=ON", "-DCUDA_FAST_MATH=ON", /* optional */ "-DWITH_CUBLAS=ON", /* optional */ "-DOPENCV_DNN_CUDA=ON");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaarithm");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudabgsegm");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudacodec");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudafeatures2d");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudafilters");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaimgproc");
                // this.#enabledModules.add('cudalegacy');
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaobjdetect");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudaoptflow");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudastereo");
                __classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f").add("cudawarping");
                const cudaArch = this.cudaArch;
                if (cudaArch) {
                    cMakeflags.push(`-DCUDA_ARCH_BIN=${cudaArch}`);
                }
            }
            else {
                if (!this.getConfiguredCmakeFlagsOnce) {
                    Log.log("error", "install", "failed to locate CUDA setup");
                }
            }
        }
        // add user added flags
        if (this.autoBuildFlags && typeof (this.autoBuildFlags) === "string") {
            const addedFlags = this.autoBuildFlags.split(/\s+/);
            const buildList = addedFlags.find((a) => a.startsWith("-DBUILD_LIST"));
            if (buildList) {
                if (!this.getConfiguredCmakeFlagsOnce) {
                    Log.log("info", "config", `cmake flag contains special ${pc.red("DBUILD_LIST")} options "${highlight("%s")}" automatic cmake flags are now disabled.`, buildList);
                }
                const extraModules = (buildList.split("=")[1] || "").split(",").filter((a) => a);
                for (const extraModule of extraModules) {
                    // drop any --DWITH_
                    ALL_OPENCV_MODULES.delete(extraModule);
                    // or use --DWITH_modules=ON
                    // this.#enabledModules.add(extraModule as OpencvModulesType);
                }
            }
            else {
                cMakeflags.push(...this.getCmakeBuildFlags());
            }
            // OpenCVBuildEnv.log('silly', 'install', 'using flags from OPENCV4NODEJS_AUTOBUILD_FLAGS:', this.autoBuildFlags)
            // cMakeflags.push(...this.autoBuildFlags.split(/\s+/));
            for (const arg of addedFlags) {
                const m = arg.match(/^(-D.+=)(.+)$/);
                if (!m) {
                    cMakeflags.push(arg);
                    continue;
                }
                const [, key] = m;
                const pos = cMakeflags.findIndex((a) => a.startsWith(key));
                if (pos >= 0) {
                    if (cMakeflags[pos] === arg) {
                        if (!this.getConfiguredCmakeFlagsOnce) {
                            Log.log("info", "config", `cmake flag "${highlight("%s")}" had no effect.`, arg);
                        }
                    }
                    else {
                        if (!this.getConfiguredCmakeFlagsOnce) {
                            Log.log("info", "config", `replacing cmake flag "${highlight("%s")}" by "${highlight("%s")}"`, cMakeflags[pos], m[0]);
                        }
                        cMakeflags[pos] = m[0];
                    }
                }
                else {
                    if (!this.getConfiguredCmakeFlagsOnce) {
                        Log.log("info", "config", `adding cmake flag "${highlight("%s")}"`, m[0]);
                    }
                    cMakeflags.push(m[0]);
                }
            }
        }
        else {
            cMakeflags.push(...this.getCmakeBuildFlags());
        }
        // console.log(cMakeflags)
        this.getConfiguredCmakeFlagsOnce = true;
        return cMakeflags;
    }
    dumpEnv() {
        return {
            opencvVersion: this.opencvVersion,
            buildWithCuda: this.buildWithCuda,
            isWithoutContrib: this.isWithoutContrib,
            isAutoBuildDisabled: this.isAutoBuildDisabled,
            autoBuildFlags: this.autoBuildFlags,
            cudaArch: this.cudaArch,
            buildRoot: this.buildRoot,
            OPENCV_INCLUDE_DIR: getEnv("OPENCV_INCLUDE_DIR"),
            OPENCV_LIB_DIR: getEnv("OPENCV_LIB_DIR"),
            OPENCV_BIN_DIR: getEnv("OPENCV_BIN_DIR"),
            modules: [...__classPrivateFieldGet(this, _OpenCVBuildEnv_enabledModules, "f")].sort(),
        };
    }
    numberOfCoresAvailable() {
        return os.cpus().length;
    }
    /**
     * openCV uniq version prostfix, used to avoid build path colision.
     */
    get optHash() {
        if (this.hash) {
            return this.hash;
        }
        let optArgs = this.getConfiguredCmakeFlags().join(" ");
        if (this.buildWithCuda)
            optArgs += "cuda";
        if (this.isWithoutContrib)
            optArgs += "noContrib";
        if (optArgs) {
            optArgs = "-" +
                crypto.createHash("md5").update(optArgs).digest("hex").substring(0, 5);
        }
        // do not cache the opt hash, it can change during the configuration process.
        // it will be fix durring the final serialisation.
        // this.hash = optArgs;
        return optArgs;
    }
    get rootDir() {
        return this.buildRoot;
    }
    get opencvRoot() {
        return path.join(this.rootDir, `opencv-${this.opencvVersion}${this.optHash}`);
    }
    get opencvGitCache() {
        return path.join(this.rootDir, "opencvGit");
    }
    get opencvContribGitCache() {
        return path.join(this.rootDir, "opencv_contribGit");
    }
    get opencvSrc() {
        return path.join(this.opencvRoot, "opencv");
    }
    get opencvContribSrc() {
        return path.join(this.opencvRoot, "opencv_contrib");
    }
    get opencvContribModules() {
        return path.join(this.opencvContribSrc, "modules");
    }
    get opencvBuild() {
        return path.join(this.opencvRoot, "build");
    }
    get opencvInclude() {
        return path.join(this.opencvBuild, "include");
    }
    get opencv4Include() {
        this.getReady();
        const candidat = getEnv("OPENCV_INCLUDE_DIR");
        if (candidat)
            return candidat;
        return path.join(this.opencvInclude, "opencv4");
    }
    get opencvIncludeDir() {
        this.getReady();
        return getEnv("OPENCV_INCLUDE_DIR");
    }
    get opencvLibDir() {
        this.getReady();
        const candidat = getEnv("OPENCV_LIB_DIR");
        if (candidat)
            return candidat;
        return Platfrm.isWindows
            ? path.join(this.opencvBuild, "lib/Release")
            : path.join(this.opencvBuild, "lib");
    }
    get opencvBinDir() {
        this.getReady();
        const candidat = getEnv("OPENCV_BIN_DIR");
        if (candidat)
            return candidat;
        return Platfrm.isWindows
            ? path.join(this.opencvBuild, "bin/Release")
            : path.join(this.opencvBuild, "bin");
    }
    get autoBuildFile() {
        return path.join(this.opencvRoot, "auto-build.json");
    }
    get autoBuildLog() {
        if (Platfrm.isWindows) {
            return path.join(this.opencvRoot, "build-cmd.bat");
        }
        else {
            return path.join(this.opencvRoot, "build-cmd.sh");
        }
    }
    readAutoBuildFile() {
        return StaticTools.readAutoBuildFile(this.autoBuildFile);
    }
}
_OpenCVBuildEnv_cudaArch = new WeakMap(), _OpenCVBuildEnv_packageEnv = new WeakMap(), _OpenCVBuildEnv_ready = new WeakMap(), _OpenCVBuildEnv_enabledModules = new WeakMap();
export default OpenCVBuildEnv;
