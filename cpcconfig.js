/* cpcconfig.ts - configuration file for CPCBasicTS */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cpcconfig = void 0;
    exports.cpcconfig = {
        databaseDirs: "./examples,https://benchmarko.github.io/CPCBasicApps/apps,https://benchmarko.github.io/LocoBasic/examples=locobasic,https://benchmarko.github.io/CPCBasicApps/rosetta,storage",
        //databaseDirs: "./examples,../../CPCBasicApps/apps,../../LocoBasic/dist/examples=locobasic,../../CPCBasicApps/rosetta,storage", // local test
        // just an example, not the full list of moved examples...
        redirectExamples: {
            "examples/art": {
                database: "apps",
                example: "demo/art"
            },
            "examples/blkedit": {
                database: "apps",
                example: "apps/blkedit"
            }
        }
    };
});
//# sourceMappingURL=cpcconfig.js.map