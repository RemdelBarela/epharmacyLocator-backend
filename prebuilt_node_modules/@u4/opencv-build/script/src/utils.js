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
exports.protect = void 0;
exports.toExecCmd = toExecCmd;
exports.highlight = highlight;
exports.light = light;
exports.formatRed = formatRed;
exports.formatNumber = formatNumber;
exports.exec = exec;
exports.execSync = execSync;
exports.execFile = execFile;
exports.spawn = spawn;
exports.requireGit = requireGit;
exports.requireCmake = requireCmake;
exports.isCudaAvailable = isCudaAvailable;
const dntShim = __importStar(require("../_dnt.shims.js"));
const node_child_process_1 = __importDefault(require("node:child_process"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = require("node:os");
const node_path_1 = __importDefault(require("node:path"));
const deps_js_1 = require("../deps.js");
const env_js_1 = require("./env.js");
const Log_js_1 = __importDefault(require("./Log.js"));
/**
 * excape spaces for shell execution
 * @param txt text to escape
 * @returns a shell no spaced parameter
 */
const protect = (txt) => {
    if (txt.includes(" "))
        return `"${txt}"`;
    else
        return txt;
};
exports.protect = protect;
function toExecCmd(bin, args) {
    return `${(0, exports.protect)(bin)} ${args.map(exports.protect).join(" ")}`;
}
function highlight(text) {
    return deps_js_1.pc.bold(deps_js_1.pc.yellow(String(text)));
}
function light(text) {
    return deps_js_1.pc.yellow(String(text));
}
function formatRed(text) {
    return deps_js_1.pc.red(String(text));
}
function formatNumber(text) {
    return deps_js_1.pc.bold(deps_js_1.pc.green(String(text)));
}
function exec(cmd, options) {
    Log_js_1.default.log("silly", "install", "executing: %s", (0, exports.protect)(cmd));
    return new Promise(function (resolve, reject) {
        node_child_process_1.default.exec(cmd, options, function (err, stdout, stderr) {
            const _err = err || stderr;
            if (_err)
                return reject(_err);
            return resolve(stdout.toString());
        });
    });
}
function execSync(cmd, options) {
    Log_js_1.default.log("silly", "install", "executing: %s", (0, exports.protect)(cmd));
    const stdout = node_child_process_1.default.execSync(cmd, options);
    return stdout.toString();
}
/**
 * only used by findVs2017
 */
function execFile(cmd, args, options) {
    Log_js_1.default.log("silly", "install", "executing: %s %s", (0, exports.protect)(cmd), args.map(exports.protect).join(" "));
    return new Promise(function (resolve, reject) {
        const child = node_child_process_1.default.execFile(cmd, args, options, function (err, stdout, stderr) {
            const _err = err || stderr;
            if (_err)
                return reject(_err);
            return resolve(stdout.toString());
        });
        child.stdin && child.stdin.end();
    });
}
function spawn(cmd, args, options, filters) {
    filters = filters || {};
    const filterStdout = (data) => {
        if (filters && filters.out) {
            data = filters.out(data);
            if (!data) {
                return;
            }
        }
        // process.stdout.write(data);
        dntShim.Deno.stdout.write(data);
    };
    const filterStderr = (data) => {
        if (filters && filters.err) {
            data = filters.err(data);
            if (!data) {
                return;
            }
        }
        // process.stderr.write(data);
        dntShim.Deno.stdout.write(data);
    };
    Log_js_1.default.log("silly", "install", "spawning:", (0, exports.protect)(cmd), args.map(exports.protect).join(" "));
    return new Promise(function (resolve, reject) {
        try {
            const child = node_child_process_1.default.spawn(cmd, args, {
                stdio: ["inherit", "pipe", "pipe"],
                ...options,
            });
            child.stderr.on("data", filterStderr);
            child.stdout.on("data", filterStdout);
            child.on("exit", function (code) {
                if (typeof code !== "number") {
                    code = null;
                }
                const msg = `running: ${(0, exports.protect)(cmd)} ${args.map(exports.protect).join(" ")}${node_os_1.EOL}in ${options
                    .cwd} exited with code ${code} (for more info, set '--loglevel silly')'`;
                // if (code !== 0)
                //   console.log(`End of spawn ${cmd} ${args.join(' ')} RET:`, code);
                if (code !== 0) {
                    return reject(msg);
                }
                return resolve(msg);
            });
        }
        catch (err) {
            return reject(err);
        }
    });
}
async function requireCmd(cmd, hint) {
    Log_js_1.default.log("silly", "install", `executing: ${deps_js_1.pc.cyan("%s")}`, cmd);
    try {
        const stdout = await exec(cmd);
        Log_js_1.default.log("verbose", "install", `${cmd}: ${stdout.trim()}`);
        return stdout;
    }
    catch (err) {
        let errMessage = `failed to execute ${cmd}, ${hint}, error is: `;
        if (err instanceof Error) {
            errMessage += err.toString();
        }
        else {
            errMessage += JSON.stringify(err);
        }
        throw new Error(errMessage);
    }
}
function requireCmdSync(cmd, hint) {
    Log_js_1.default.log("info", "install", `executing: ${deps_js_1.pc.cyan("%s")}`, cmd);
    try {
        const stdout = execSync(cmd);
        Log_js_1.default.log("verbose", "install", `${cmd}: ${stdout.trim()}`);
        return stdout;
    }
    catch (err) {
        let errMessage = `failed to execute ${cmd}, ${hint}, error is: `;
        if (err instanceof Error) {
            errMessage += err.toString();
        }
        else {
            errMessage += JSON.stringify(err);
        }
        throw new Error(errMessage);
    }
}
async function requireGit() {
    const out = await requireCmd("git --version", "git is required");
    const version = out.match(/version ([\d.\w]+)/);
    if (version) {
        Log_js_1.default.log("info", "install", `git Version ${formatNumber("%s")} found`, version[1]);
    }
}
async function requireCmake() {
    const out = await requireCmd("cmake --version", "cmake is required to build opencv");
    const version = out.match(/version ([\d.\w]+)/);
    if (version) {
        Log_js_1.default.log("info", "install", `cmake Version ${formatNumber("%s")} found`, version[1]);
    }
}
let cached_cuda = null;
/**
 * looks for cuda lib
 * @returns
 */
function isCudaAvailable() {
    if (cached_cuda != null) {
        return cached_cuda;
    }
    Log_js_1.default.log("info", "install", "Check if CUDA is available & what version...");
    if (env_js_1.Platfrm.isWindows) {
        try {
            requireCmdSync("nvcc --version", "CUDA availability check");
            // return true;
        }
        catch (_err) {
            Log_js_1.default.log("info", "install", "Seems like CUDA is not installed; nvcc --version call failed");
            return false;
        }
    }
    // Because NVCC is not installed by default & requires an extra install step,
    // this is work around that always works
    const CUDA_PATH = (0, env_js_1.getEnv)("CUDA_PATH");
    for (const cudaPath of [CUDA_PATH, "/usr/local/cuda/"]) {
        if (!cudaPath) {
            continue;
        }
        if (!node_fs_1.default.existsSync(cudaPath)) {
            continue;
        }
        for (const file of ["version.txt", "version.json"]) {
            const realpath = node_path_1.default.resolve(cudaPath, file);
            if (node_fs_1.default.existsSync(realpath)) {
                const content = node_fs_1.default.readFileSync(realpath, "utf8");
                Log_js_1.default.log("info", "install", content);
                cached_cuda = true;
                return true;
            }
        }
    }
    Log_js_1.default.log("info", "install", `CUDA version file could not be found in {/usr/local/cuda/,CUDA_PATH}version.{txt,json}`);
    cached_cuda = false;
    return false;
}
