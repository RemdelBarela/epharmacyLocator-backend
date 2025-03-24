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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platfrm = void 0;
exports.getEnv = getEnv;
exports.setEnv = setEnv;
exports.getDirname = getDirname;
exports.getArch = getArch;
const dntShim = __importStar(require("../_dnt.shims.js"));
const deps_js_1 = require("../deps.js");
/**
 * portable env functions
 */
function getEnv(name) {
    if (!name) {
        return "";
    }
    // const value = process.env[name];
    const value = dntShim.Deno.env.get(name);
    return value || "";
}
function setEnv(name, value) {
    // process.env[name] = value;
    dntShim.Deno.env.set(name, value);
}
function getDirname() {
    // return __dirname if it's a nodejs script
    // if (typeof __dirname !== "undefined") {
    // return __dirname;
    // }
    // return import.meta.url if it's a module
    const __dirname = deps_js_1.path.dirname(deps_js_1.path.fromFileUrl(require("url").pathToFileURL(__filename).href));
    return __dirname; // new URL(".", import.meta.url).pathname;
}
class Platfrm {
    static changeOS(os) {
        Platfrm.theOS = os;
    }
    static get isWindows() {
        return Platfrm.theOS.startsWith("win"); //  === 'windows';
    }
    static get isLinux() {
        return Platfrm.theOS === "linux";
    }
    static get isMac() {
        return Platfrm.theOS === "darwin";
    }
}
exports.Platfrm = Platfrm;
Object.defineProperty(Platfrm, "theOS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: dntShim.Deno.build.os
}); // process.platform;
function getArch() {
    // return process.arch;
    return dntShim.Deno.build.arch;
}
