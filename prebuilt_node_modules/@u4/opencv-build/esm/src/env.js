import * as dntShim from "../_dnt.shims.js";
import { path } from "../deps.js";
/**
 * portable env functions
 */
export function getEnv(name) {
    if (!name) {
        return "";
    }
    // const value = process.env[name];
    const value = dntShim.Deno.env.get(name);
    return value || "";
}
export function setEnv(name, value) {
    // process.env[name] = value;
    dntShim.Deno.env.set(name, value);
}
export function getDirname() {
    // return __dirname if it's a nodejs script
    // if (typeof __dirname !== "undefined") {
    // return __dirname;
    // }
    // return import.meta.url if it's a module
    const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
    return __dirname; // new URL(".", import.meta.url).pathname;
}
export class Platfrm {
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
Object.defineProperty(Platfrm, "theOS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: dntShim.Deno.build.os
}); // process.platform;
export function getArch() {
    // return process.arch;
    return dntShim.Deno.build.arch;
}
