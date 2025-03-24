"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMSBuild = findMSBuild;
const node_path_1 = __importDefault(require("node:path"));
const glob_1 = require("glob");
const Log_js_1 = __importDefault(require("./Log.js"));
const utils_js_1 = require("./utils.js");
const env_js_1 = require("./env.js");
/**
 * @returns all MSBuild.exe version in PROGRAM FILES most recent first.
 */
async function findMSBuild() {
    const progFiles = new Set([
        (0, env_js_1.getEnv)("programfiles"),
        (0, env_js_1.getEnv)("ProgramW6432"),
        (0, env_js_1.getEnv)("programfiles(x86)"),
    ]);
    const matches = [];
    for (const progFile of progFiles) {
        if (progFile) {
            const reg = `${progFile.replace(/\\/g, "/")}/Microsoft Visual Studio/*/*/MSBuild/*/Bin/MSBuild.exe`;
            for (const m of (0, glob_1.globSync)(reg)) {
                matches.push(node_path_1.default.resolve(m));
            }
        }
    }
    matches.sort();
    if (!matches.length) {
        return Promise.reject("no Microsoft Visual Studio found in program files directorys");
    }
    if (matches.length > 1) {
        Log_js_1.default.log("warn", "find-msbuild", `find ${(0, utils_js_1.formatNumber)(matches.length)} MSBuild version: [${matches.map((path) => (0, utils_js_1.light)(path)).join(", ")}]`);
    }
    const pbuilds = matches.map(async (selected) => {
        Log_js_1.default.log("silly", "find-msbuild", matches.join(", "));
        // const selected = matches[matches.length - 1];
        const txt = await (0, utils_js_1.execFile)(selected, ["/version"]);
        const m = txt.match(/(\d+)\.\d+/);
        if (!m) {
            Log_js_1.default.log("warn", "find-msbuild", `${selected} is not a valid msbuild path, can not find it's versdion`);
            return {
                path: selected,
                version: 0,
            };
        }
        //   return Promise.reject('fail to get MSBuild.exe version number');
        Log_js_1.default.log("info", "find-msbuild", `discover msbuild v${(0, utils_js_1.formatNumber)("%s")} in ${(0, utils_js_1.highlight)("%s")}`, m[1], selected);
        return {
            path: selected,
            version: Number(m[1]),
        };
    });
    const builds = await Promise.all(pbuilds);
    // drop versionnumber = 0;
    return builds.filter((a) => a.version).reverse();
}
