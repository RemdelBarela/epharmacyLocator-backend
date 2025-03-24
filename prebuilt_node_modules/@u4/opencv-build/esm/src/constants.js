export class Constant {
    constructor(builder) {
        Object.defineProperty(this, "builder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: builder
        });
        Object.defineProperty(this, "opencvRepoUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://github.com/opencv/opencv.git"
        });
        // opencvRepoUrl = 'c:/cache/opencv'
        Object.defineProperty(this, "opencvContribRepoUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://github.com/opencv/opencv_contrib.git"
        });
        // opencvContribRepoUrl = 'c:/cache/opencv_contrib'
        //   opencvModules = opencvModules;
        Object.defineProperty(this, "cmakeVsCompilers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                "10": "Visual Studio 10 2010",
                "11": "Visual Studio 11 2012",
                "12": "Visual Studio 12 2013",
                "14": "Visual Studio 14 2015",
                "15": "Visual Studio 15 2017",
                "16": "Visual Studio 16 2019",
                "17": "Visual Studio 17 2022",
            }
        });
        Object.defineProperty(this, "cmakeArchs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                "x64": " Win64",
                "ia32": "",
                "arm": " ARM",
                "x86_64": " Win64",
                "aarch64": " ARM",
            }
        });
    }
}
