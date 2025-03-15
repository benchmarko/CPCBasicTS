// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./Controller", "./cpcconfig", "./Model", "./View", "./NodeAdapt"], function (require, exports, Utils_1, Controller_1, cpcconfig_1, Model_1, View_1, NodeAdapt_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                var nameValue = args[i], nameValueList = Utils_1.Utils.split2(nameValue, "="), name_1 = nameValueList[0];
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
                err.message += ": " + s;
                Utils_1.Utils.console.error(err);
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
            var currentConsole = Utils_1.Utils.console;
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
        cpcBasic.fnDoStart = function () {
            var startConfig = cpcBasic.config, winCpcConfig = window.cpcConfig || {};
            Object.assign(startConfig, cpcconfig_1.cpcconfig, winCpcConfig);
            var redirectExamples = startConfig.redirectExamples;
            delete startConfig.redirectExamples;
            cpcBasic.model = new Model_1.Model(startConfig);
            // eslint-disable-next-line no-new-func
            var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
            if (!myGlobalThis.process) { // browser
                cpcBasic.fnParseUri(window.location.search.substring(1), startConfig);
            }
            else { // nodeJs
                cpcBasic.fnParseArgs(myGlobalThis.process.argv.slice(2), startConfig);
            }
            cpcBasic.view = new View_1.View();
            var debug = Number(cpcBasic.model.getProperty("debug" /* ModelPropID.debug */));
            Utils_1.Utils.debug = debug;
            var UtilsConsole = Utils_1.Utils.console, cpcBasicLog = "";
            if (UtilsConsole.cpcBasicLog) {
                cpcBasicLog = UtilsConsole.cpcBasicLog;
                UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
            }
            if (Utils_1.Utils.debug > 0 && cpcBasic.model.getProperty("showConsoleLog" /* ModelPropID.showConsoleLog */)) { // console log window?
                UtilsConsole = cpcBasic.createDebugUtilsConsole(cpcBasicLog);
                Utils_1.Utils.console = UtilsConsole;
                Utils_1.Utils.console.log("CPCBasic log started at", Utils_1.Utils.dateFormat(new Date()));
                UtilsConsole.changeLog(View_1.View.getElementById1("consoleLogText" /* ViewID.consoleLogText */));
            }
            if (redirectExamples) {
                this.fnRedirectExamples(redirectExamples);
            }
            cpcBasic.controller = new Controller_1.Controller(cpcBasic.model, cpcBasic.view);
            cpcBasic.controller.onDatabaseSelectChange(); // trigger loading example
        };
        cpcBasic.fnOnLoad = function () {
            Utils_1.Utils.console.log("CPCBasic started at", Utils_1.Utils.dateFormat(new Date()));
            cpcBasic.fnDoStart();
        };
        cpcBasic.config = {
            arrayBounds: false,
            autorun: true,
            basicVersion: "1.1",
            bench: 0,
            canvasType: "graphics",
            databaseDirs: "examples",
            database: "examples",
            debug: 0,
            example: "cpcbasic",
            exampleIndex: "0index.js",
            implicitLines: false,
            input: "",
            integerOverflow: false,
            kbdLayout: "alphanum",
            linesOnLoad: true,
            dragElements: false,
            palette: "color",
            prettyBrackets: true,
            prettyColons: true,
            prettyLowercaseVars: false,
            prettySpace: false,
            processFileImports: true,
            selectDataFiles: false,
            showConsoleLog: false,
            showConvert: false,
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
    window.cpcBasic = cpcBasic;
    window.onload = function () {
        cpcBasic.fnOnLoad();
    };
    if (window.Polyfills.isNodeAvailable) {
        NodeAdapt_1.NodeAdapt.doAdapt();
        cpcBasic.fnOnLoad();
        Utils_1.Utils.console.debug("End of main.");
    }
});
//# sourceMappingURL=cpcbasic.js.map