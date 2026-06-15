// cpcbasic.ts - CPCBasic for Browser / NodeJs
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
import { Utils } from "./Utils";
import { Core } from "./Core";
import { cpcconfig } from "./cpcconfig";
var startConfig = {
    arrayBounds: false,
    autorun: true,
    basicVersion: "1.1", // "1.1" or "1.0"
    bench: 0, // debug: number of parse bench loops
    canvasType: "graphics", // "graphics", "text", "none"
    databaseDirs: "examples", // example base directories (comma separated)
    database: "examples", // examples, apps, saved
    debug: 0,
    example: "cpcbasic",
    exampleIndex: "0index.js", // example index for every databaseDir
    implicitLines: false, // allow implicit line numbers
    input: "", // keyboard input when starting the app
    integerOverflow: false, // check for integer overflow
    kbdLayout: "alphanum", // alphanum, alpha, num
    linesOnLoad: true, // add missing line numbers on load
    dragElements: false,
    palette: "color", // "color", "green", "grey"
    prettyBrackets: true, // pretty print: brackets
    prettyColons: true, // pretty print: colons
    prettyLowercaseVars: false, // pretty print: lowercase variables
    prettySpace: false, // pretty print: spaces
    processFileImports: true, // open ZIP, DSK files on import
    random: "cpc", // cpc or minstd
    selectDataFiles: false, // select data files in example selection
    showConsoleLog: false,
    showCpc: true,
    showDisass: false,
    showExport: false,
    showGallery: false,
    showInput: true,
    showInp2: false,
    showKbd: false,
    showKbdSettings: false,
    showMore: false,
    showOutput: false,
    showPretty: false,
    showRenum: false,
    showResult: false,
    showSettings: false,
    showVariable: false,
    showView: false,
    sound: true,
    speed: 100,
    trace: false // trace code
};
var cpcBasic = /** @class */ (function () {
    function cpcBasic() {
    }
    cpcBasic.start = function (startupAdapter) {
        console.log("CPCBasicTS started at", Utils.dateFormat(new Date()));
        var adapterConfig = startupAdapter.getConfigOverrides() || {};
        Object.assign(startConfig, cpcconfig, adapterConfig);
        var redirectExamples = startConfig.redirectExamples;
        delete startConfig.redirectExamples;
        var core = new Core(startConfig);
        if (redirectExamples) {
            core.fnRedirectExamples(redirectExamples);
        }
        if (!startupAdapter.isNodeRuntime()) {
            var winFn = function () {
                var ui = startupAdapter.getUI();
                var win = window;
                if (!ui) {
                    throw new Error("start: UI undefined!");
                }
                if (!win) {
                    throw new Error("start: window undefined!");
                }
                win.cpcBasic = {
                    addIndex: core.addIndex,
                    addItem: function (key, input) {
                        if (!key) { // maybe ""
                            key = ui.getCurrentDataKey();
                        }
                        core.addItem(key, input);
                    },
                    addRsx: function (key, RsxConstructor) { return core.addRsx(key, RsxConstructor); }
                };
                ui.onWindowLoadContinue(core);
            };
            winFn();
        }
        else { // nodeJS
            var nodeUtils = startupAdapter.getNodeUtils();
            if (!nodeUtils) {
                throw new Error("start: NodeUtils undefined!");
            }
            nodeUtils.nodeMain(core);
        }
    };
    return cpcBasic;
}());
export { cpcBasic };
//# sourceMappingURL=cpcbasic.js.map