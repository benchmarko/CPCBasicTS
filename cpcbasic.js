// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
import { Utils } from "./Utils";
import { Controller } from "./Controller";
import { cpcconfig } from "./cpcconfig";
import { Model } from "./Model";
import { View } from "./View";
var cpcBasic = /** @class */ (function () {
    function cpcBasic() {
    }
    cpcBasic.fnHereDoc = function (fn) {
        return String(fn).
            replace(/^[^/]+\/\*\S*/, "").
            replace(/\*\/[^/]+$/, "");
    };
    cpcBasic.addIndex = function (dir, input) {
        var _a;
        if (typeof input === "function") {
            input = (_a = {},
                _a[dir] = JSON.parse(this.fnHereDoc(input).trim()),
                _a);
        }
        return cpcBasic.controller.addIndex(dir, input);
    };
    cpcBasic.addItem = function (key, input) {
        var inputString = (typeof input !== "string") ? this.fnHereDoc(input) : input;
        return cpcBasic.controller.addItem(key, inputString);
    };
    cpcBasic.addRsx = function (key, RsxConstructor) {
        return cpcBasic.controller.addRsx(key, RsxConstructor);
    };
    // can be used for nodeJS
    cpcBasic.fnParseArgs = function (args, config) {
        for (var i = 0; i < args.length; i += 1) {
            var nameValue = args[i], nameValueList = Utils.split2(nameValue, "="), name_1 = nameValueList[0];
            if (config.hasOwnProperty(name_1)) {
                var value = nameValueList[1]; // string|number|boolean
                if (value !== undefined && config.hasOwnProperty(name_1)) {
                    switch (typeof config[name_1]) {
                        case "string":
                            break;
                        case "boolean":
                            value = (value === "true");
                            break;
                        case "number":
                            value = Number(value);
                            break;
                        case "object":
                            break;
                        default:
                            break;
                    }
                }
                config[name_1] = value;
            }
        }
        return config;
    };
    cpcBasic.fnDecodeUri = function (s) {
        var rPlus = /\+/g; // Regex for replacing addition symbol with a space
        var decoded = "";
        try {
            decoded = decodeURIComponent(s.replace(rPlus, " "));
        }
        catch (err) {
            if (err instanceof Error) {
                err.message += ": " + s;
            }
            Utils.console.error(err);
        }
        return decoded;
    };
    // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    cpcBasic.fnParseUri = function (urlQuery, config) {
        var rSearch = /([^&=]+)=?([^&]*)/g, args = [];
        var match;
        while ((match = rSearch.exec(urlQuery)) !== null) {
            var name_2 = cpcBasic.fnDecodeUri(match[1]), value = cpcBasic.fnDecodeUri(match[2]);
            if (value !== null && config.hasOwnProperty(name_2)) {
                args.push(name_2 + "=" + value);
            }
        }
        cpcBasic.fnParseArgs(args, config);
    };
    cpcBasic.fnMapObjectProperties = function (arg) {
        if (typeof arg === "object") {
            var res = [];
            for (var key in arg) { // eslint-disable-line guard-for-in
                // if (arg.hasOwnProperty(key)) {
                var value = arg[key];
                if (typeof value !== "object" && typeof value !== "function") {
                    res.push(key + ": " + value);
                }
            }
            arg = String(arg) + "{" + res.join(", ") + "}";
        }
        return arg;
    };
    cpcBasic.createDebugUtilsConsole = function (cpcBasicLog) {
        var currentConsole = Utils.console;
        return {
            consoleLog: {
                value: cpcBasicLog || "" // already something collected?
            },
            console: currentConsole,
            rawLog: function (fnMethod, level, args) {
                if (level) {
                    args.unshift(level);
                }
                if (fnMethod) {
                    if (fnMethod.apply) {
                        fnMethod.apply(console, args);
                    }
                }
                if (this.consoleLog) {
                    this.consoleLog.value += args.map(cpcBasic.fnMapObjectProperties).join(" ") + ((level !== null) ? "\n" : "");
                }
            },
            log: function () {
                this.rawLog(this.console && this.console.log, "", Array.prototype.slice.call(arguments));
            },
            debug: function () {
                this.rawLog(this.console && this.console.debug, "DEBUG:", Array.prototype.slice.call(arguments));
            },
            info: function () {
                this.rawLog(this.console && this.console.info, "INFO:", Array.prototype.slice.call(arguments));
            },
            warn: function () {
                this.rawLog(this.console && this.console.warn, "WARN:", Array.prototype.slice.call(arguments));
            },
            error: function () {
                this.rawLog(this.console && this.console.error, "ERROR:", Array.prototype.slice.call(arguments));
            },
            changeLog: function (log) {
                var oldLog = this.consoleLog;
                this.consoleLog = log;
                if (oldLog && oldLog.value && log) { // some log entires collected?
                    log.value += oldLog.value; // take collected log entries
                }
            }
        };
    };
    cpcBasic.fnRedirectExamples = function (redirectExamples) {
        var name = this.model.getProperty("database" /* ModelPropID.database */) + "/" + this.model.getProperty("example" /* ModelPropID.example */);
        if (redirectExamples[name]) {
            this.model.setProperty("database" /* ModelPropID.database */, redirectExamples[name].database);
            this.model.setProperty("example" /* ModelPropID.example */, redirectExamples[name].example);
        }
    };
    cpcBasic.fnDoStart = function (startupAdapter) {
        var startConfig = cpcBasic.config, adapterConfig = startupAdapter.getConfigOverrides() || {};
        Object.assign(startConfig, cpcconfig, adapterConfig);
        var redirectExamples = startConfig.redirectExamples;
        delete startConfig.redirectExamples;
        cpcBasic.model = new Model(startConfig);
        if (!startupAdapter.isNodeRuntime()) { // browser
            cpcBasic.fnParseUri(startupAdapter.getUrlQuery(), startConfig);
        }
        else { // nodeJs
            cpcBasic.fnParseArgs(startupAdapter.getArgs(), startConfig);
        }
        cpcBasic.view = new View();
        var debug = Number(cpcBasic.model.getProperty("debug" /* ModelPropID.debug */));
        Utils.debug = debug;
        var UtilsConsole = Utils.console, cpcBasicLog = "";
        if (UtilsConsole.cpcBasicLog) {
            cpcBasicLog = UtilsConsole.cpcBasicLog;
            UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
        }
        if (Utils.debug > 0 && cpcBasic.model.getProperty("showConsoleLog" /* ModelPropID.showConsoleLog */)) { // console log window?
            UtilsConsole = cpcBasic.createDebugUtilsConsole(cpcBasicLog);
            Utils.console = UtilsConsole;
            Utils.console.log("CPCBasic log started at", Utils.dateFormat(new Date()));
            UtilsConsole.changeLog(View.getElementById1("consoleLogText" /* ViewID.consoleLogText */));
        }
        if (redirectExamples) {
            this.fnRedirectExamples(redirectExamples);
        }
        cpcBasic.controller = new Controller(cpcBasic.model, cpcBasic.view);
        cpcBasic.controller.onDatabaseSelectChange(); // trigger loading example
    };
    cpcBasic.start = function (startupAdapter) {
        Utils.console.log("CPCBasic started at", Utils.dateFormat(new Date()));
        cpcBasic.fnDoStart(startupAdapter);
    };
    cpcBasic.fnOnLoad = function () {
        var defaultStartupAdapter = {
            getConfigOverrides: function () { return window.cpcConfig || {}; },
            getUrlQuery: function () { return window.location.search.substring(1); },
            getArgs: function () {
                // eslint-disable-next-line no-new-func
                var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
                return (myGlobalThis.process && myGlobalThis.process.argv) ? myGlobalThis.process.argv.slice(2) : [];
            },
            isNodeRuntime: function () {
                // eslint-disable-next-line no-new-func
                var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
                return Boolean(myGlobalThis.process);
            }
        };
        cpcBasic.start(defaultStartupAdapter);
    };
    cpcBasic.config = {
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
    return cpcBasic;
}());
export { cpcBasic };
//# sourceMappingURL=cpcbasic.js.map