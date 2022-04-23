// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./Controller", "./cpcconfig", "./Model", "./View"], function (require, exports, Utils_1, Controller_1, cpcconfig_1, Model_1, View_1) {
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
            if (typeof input !== "string") {
                input = this.fnHereDoc(input);
            }
            return cpcBasic.controller.addIndex(dir, input);
        };
        cpcBasic.addItem = function (key, input) {
            var inputString = (typeof input !== "string") ? this.fnHereDoc(input) : input;
            return cpcBasic.controller.addItem(key, inputString);
        };
        // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
        cpcBasic.fnParseUri = function (urlQuery, config) {
            var rPlus = /\+/g, // Regex for replacing addition symbol with a space
            rSearch = /([^&=]+)=?([^&]*)/g, fnDecode = function (s) { return decodeURIComponent(s.replace(rPlus, " ")); };
            var match;
            while ((match = rSearch.exec(urlQuery)) !== null) {
                var name_1 = fnDecode(match[1]);
                var value = fnDecode(match[2]);
                if (value !== null && config.hasOwnProperty(name_1)) {
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
        };
        cpcBasic.createDebugUtilsConsole = function (cpcBasicLog) {
            var currentConsole = Utils_1.Utils.console, console = {
                consoleLog: {
                    value: cpcBasicLog || "" // already something collected?
                },
                console: currentConsole,
                fnMapObjectProperties: function (arg) {
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
                },
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
                        this.consoleLog.value += args.map(this.fnMapObjectProperties).join(" ") + ((level !== null) ? "\n" : "");
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
            return console;
        };
        cpcBasic.fnDoStart = function () {
            var startConfig = cpcBasic.config, externalConfig = cpcconfig_1.cpcconfig || {}; // external config from cpcconfig.js
            Object.assign(startConfig, externalConfig);
            cpcBasic.model = new Model_1.Model(startConfig);
            var urlQuery = window.location.search.substring(1);
            cpcBasic.fnParseUri(urlQuery, startConfig); // modify config with URL parameters
            cpcBasic.view = new View_1.View();
            var debug = Number(cpcBasic.model.getProperty("debug"));
            Utils_1.Utils.debug = debug;
            var UtilsConsole = Utils_1.Utils.console, cpcBasicLog = "";
            if (UtilsConsole.cpcBasicLog) {
                cpcBasicLog = UtilsConsole.cpcBasicLog;
                UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
            }
            if (Utils_1.Utils.debug > 1 && cpcBasic.model.getProperty("showConsole")) { // console log window?
                UtilsConsole = cpcBasic.createDebugUtilsConsole(cpcBasicLog);
                Utils_1.Utils.console = UtilsConsole;
                Utils_1.Utils.console.log("CPCBasic log started at", Utils_1.Utils.dateFormat(new Date()));
                UtilsConsole.changeLog(View_1.View.getElementById1("consoleText"));
            }
            cpcBasic.controller = new Controller_1.Controller(cpcBasic.model, cpcBasic.view);
        };
        cpcBasic.fnOnLoad = function () {
            Utils_1.Utils.console.log("CPCBasic started at", Utils_1.Utils.dateFormat(new Date()));
            cpcBasic.fnDoStart();
        };
        cpcBasic.config = {
            bench: 0,
            debug: 0,
            databaseDirs: "examples",
            database: "examples",
            example: "cpcbasic",
            exampleIndex: "0index.js",
            input: "",
            kbdLayout: "alphanum",
            showInput: true,
            showInp2: false,
            showCpc: true,
            showKbd: false,
            showKbdLayout: false,
            showOutput: false,
            showResult: false,
            showText: false,
            showVariable: false,
            showConsole: false,
            showConvert: false,
            sound: true,
            tron: false // trace on
        };
        return cpcBasic;
    }());
    window.cpcBasic = cpcBasic;
    window.onload = function () {
        cpcBasic.fnOnLoad();
    };
});
//# sourceMappingURL=cpcbasic.js.map