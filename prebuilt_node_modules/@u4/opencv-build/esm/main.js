#!/usr/bin/env node
import * as dntShim from "./_dnt.shims.js";
import * as OpenCVBuilder from "./src/OpenCVBuilder.js";
export { pc } from "./deps.js";
// Learn more at https://deno.land/manual/examples/module_metadata#concepts
// if (import.meta.main)
const builder = new OpenCVBuilder.OpenCVBuilder(dntShim.Deno.args);
void builder.install();
