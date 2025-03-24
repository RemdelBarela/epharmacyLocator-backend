"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summery = void 0;
exports.applyDetect = applyDetect;
exports.detect = detect;
exports.detectBinDir = detectBinDir;
exports.detectLibDir = detectLibDir;
exports.detectIncludeDir = detectIncludeDir;
const node_fs_1 = __importDefault(require("node:fs"));
const glob_1 = require("glob");
const utils_js_1 = require("../utils.js");
const env_js_1 = require("../env.js");
exports.summery = new Set();
function applyDetect() {
    const { OPENCV_BIN_DIR, OPENCV_LIB_DIR, OPENCV_INCLUDE_DIR } = detect();
    (0, env_js_1.setEnv)("OPENCV_BIN_DIR", OPENCV_BIN_DIR);
    (0, env_js_1.setEnv)("OPENCV_LIB_DIR", OPENCV_LIB_DIR);
    (0, env_js_1.setEnv)("OPENCV_INCLUDE_DIR", OPENCV_INCLUDE_DIR);
}
function detect() {
    const OPENCV_BIN_DIR = detectBinDir();
    const OPENCV_LIB_DIR = detectLibDir();
    const OPENCV_INCLUDE_DIR = detectIncludeDir();
    return { OPENCV_BIN_DIR, OPENCV_LIB_DIR, OPENCV_INCLUDE_DIR };
}
// detect_OPENCV_BIN_DIR
// detect_OPENCV_LIB_DIR
// detect_OPENCV_INCLUDE_DIR
function detectBinDir() {
    // chocolatey
    if (env_js_1.Platfrm.isWindows) {
        const lookups = [
            // chocolatey
            "c:/tools/opencv/build/x64/vc*/bin",
            // vcpkg
            "c:/vcpkg/packages/opencv4_x64-windows/bin",
        ];
        // const candidates = ["c:\\tools\\opencv\\build\\x64\\vc14\\bin", "c:\\tools\\opencv\\build\\x64\\vc16\\bin"];
        let candidates = [];
        for (const lookup of lookups) {
            candidates = [...candidates, ...(0, glob_1.globSync)(lookup)];
        }
        let fnd = false;
        for (const candidate of candidates) {
            if (node_fs_1.default.existsSync(candidate)) {
                fnd = true;
                exports.summery.add(`OPENCV_BIN_DIR resolved as ${(0, utils_js_1.highlight)(candidate)}`);
                return candidate;
            }
        }
        if (!fnd) {
            exports.summery.add(`failed to resolve OPENCV_BIN_DIR from ${lookups.join(", ")} => ${candidates.join(",")}`);
        }
    }
    else if (env_js_1.Platfrm.isLinux) {
        const candidate = "/usr/bin/";
        if (node_fs_1.default.existsSync(candidate)) {
            exports.summery.add("OPENCV_BIN_DIR resolved");
            return candidate;
        }
        else {
            exports.summery.add(`failed to resolve OPENCV_BIN_DIR from ${candidate}`);
        }
    }
    else if (env_js_1.Platfrm.isMac) {
        const lookups = [
            "/opt/homebrew/Cellar/opencv/*/bin",
            "/usr/local/Cellar/opencv/*/bin",
        ];
        const candidates = [...(0, glob_1.globSync)(lookups[0]), ...(0, glob_1.globSync)(lookups[1])];
        if (candidates.length > 1) {
            exports.summery.add(`homebrew detection found more than one openCV in ${lookups.join(",")}`);
        }
        if (candidates.length) {
            const candidate = candidates[0];
            exports.summery.add(`OPENCV_BIN_DIR resolved as ${candidate}`);
            return candidate;
        }
        exports.summery.add(`failed to resolve OPENCV_BIN_DIR from ${lookups.join(",")}`);
    }
    return "";
}
function detectLibDir() {
    if (env_js_1.Platfrm.isWindows) {
        const lookups = [
            // chocolatey
            "c:/tools/opencv/build/x64/vc*/lib",
            // vcpkg
            "c:/vcpkg/packages/opencv4_x64-windows/lib",
        ];
        // const candidates = ["c:\\tools\\opencv\\build\\x64\\vc14\\bin", "c:\\tools\\opencv\\build\\x64\\vc16\\bin"];
        let candidates = [];
        for (const lookup of lookups) {
            candidates = [...candidates, ...(0, glob_1.globSync)(lookup)];
        }
        let fnd = false;
        for (const candidate of candidates) {
            if (node_fs_1.default.existsSync(candidate)) {
                fnd = true;
                exports.summery.add(`OPENCV_LIB_DIR resolved as ${(0, utils_js_1.highlight)(candidate)}`);
                return candidate;
            }
        }
        if (!fnd) {
            exports.summery.add(`failed to resolve OPENCV_LIB_DIR from ${lookups.join(", ")} => ${candidates.join(",")}`);
        }
    }
    else if (env_js_1.Platfrm.isLinux) {
        const lookup = "/usr/lib/*-linux-gnu";
        // tiny-blob need to be fix bypassing th issue
        //const [candidate] = fs.readdirSync('/usr/lib/').filter((a: string) => a.endsWith('-linux-gnu')).map(a => `/usr/lib/${a}`);
        const [candidate] = (0, glob_1.globSync)(lookup);
        if (candidate) {
            exports.summery.add(`OPENCV_LIB_DIR resolved as ${candidate}`);
            return candidate;
        }
        else {
            exports.summery.add(`failed to resolve OPENCV_LIB_DIR from ${lookup}`);
        }
    }
    else if (env_js_1.Platfrm.isMac) {
        const lookups = [
            "/opt/homebrew/Cellar/opencv/*/lib",
            "/usr/local/Cellar/opencv/*/lib",
        ];
        const candidates = [...(0, glob_1.globSync)(lookups[0]), ...(0, glob_1.globSync)(lookups[1])];
        if (candidates.length > 1) {
            exports.summery.add(`homebrew detection found more than one openCV in ${lookups.join(",")}`);
        }
        if (candidates.length) {
            const candidate = candidates[0];
            exports.summery.add(`OPENCV_LIB_DIR resolved as ${candidate}`);
            return candidate;
        }
        else {
            exports.summery.add(`failed to resolve OPENCV_BIN_DIR from ${lookups.join(",")}`);
        }
    }
    return "";
}
/**
 * detect OPENCV_INCLUDE_DIR
 */
function detectIncludeDir() {
    if (env_js_1.Platfrm.isWindows) {
        const candidates = [
            // chocolatey
            "c:\\tools\\opencv\\build\\include",
            // vcpkg
            "c:\\vcpkg\\packages\\opencv4_x64-windows\\include",
        ];
        for (const candidate of candidates) {
            if (node_fs_1.default.existsSync(candidate)) {
                exports.summery.add("OPENCV_INCLUDE_DIR resolved");
                return candidate;
            }
        }
        exports.summery.add(`failed to resolve OPENCV_INCLUDE_DIR from ${candidates.join(", ")}`);
    }
    else if (env_js_1.Platfrm.isLinux) {
        const candidate = "/usr/include/opencv4/";
        if (node_fs_1.default.existsSync(candidate)) {
            exports.summery.add(`OPENCV_INCLUDE_DIR resolved as ${candidate}`);
            return candidate;
        }
        else {
            exports.summery.add(`failed to resolve OPENCV_INCLUDE_DIR from ${candidate}`);
        }
    }
    else if (env_js_1.Platfrm.isMac) {
        const lookups = [
            "/opt/homebrew/Cellar/opencv/*/include",
            "/usr/local/Cellar/opencv/*/include",
        ];
        const candidates = [...(0, glob_1.globSync)(lookups[0]), ...(0, glob_1.globSync)(lookups[1])];
        if (candidates.length > 1) {
            exports.summery.add(`homebrew detection found more than one openCV in ${lookups.join(",")}`);
        }
        if (candidates.length) {
            const candidate = candidates[0];
            exports.summery.add(`OPENCV_INCLUDE_DIR resolved as ${candidate}`);
            return candidate;
        }
        else {
            exports.summery.add(`failed to resolve OPENCV_INCLUDE_DIR from ${lookups.join(",")}`);
        }
    }
    return "";
}
