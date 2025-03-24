import type { OpenCVBuildEnvParams } from "./misc.js";
import type { AutoBuildFile } from "./types.js";
export interface BuildDesc {
    autobuild: string;
    buildInfo: AutoBuildFile;
    dir: string;
    hash: string;
    date: Date;
}
declare class StaticTools {
    private readEnvsFromPackageJsonLog;
    /**
     * Find the proper root dir, this directory will contains all openCV source code and a subfolder per build
     * @param opts
     * @returns
     */
    getBuildDir(opts?: OpenCVBuildEnvParams): string;
    getPackageJson(): string;
    /**
     * autodetect path using common values.
     * @return number of updated env variable from 0 to 3
     */
    autoLocatePrebuild(): {
        changes: number;
        summery: string[];
    };
    /**
     * list existing build in the diven directory
     * @param rootDir build directory
     * @returns builds list
     */
    listBuild(rootDir: string): Array<BuildDesc>;
    /**
     * Read a parse an existing autoBuildFile
     * @param autoBuildFile file path
     * @returns
     */
    readAutoBuildFile(autoBuildFile: string, quiet?: boolean): AutoBuildFile | undefined;
    /**
     * extract opencv4nodejs section from package.json if available
     */
    private parsePackageJson;
    /**
     * get opencv4nodejs section from package.json if available
     * @returns opencv4nodejs customs
     */
    readEnvsFromPackageJson(): {
        [key: string]: string | boolean | number;
    } | null;
}
declare const singleton: StaticTools;
export default singleton;
//# sourceMappingURL=StaticTools.d.ts.map