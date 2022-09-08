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
        // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
        cpcBasic.fnParseUri = function (urlQuery, config) {
            var rPlus = /\+/g, // Regex for replacing addition symbol with a space
            fnDecode = function (s) { return decodeURIComponent(s.replace(rPlus, " ")); }, rSearch = /([^&=]+)=?([^&]*)/g, args = [];
            var match;
            while ((match = rSearch.exec(urlQuery)) !== null) {
                var name_2 = fnDecode(match[1]), value = fnDecode(match[2]);
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
        cpcBasic.fnDoStart = function () {
            var startConfig = cpcBasic.config, winCpcConfig = window.cpcConfig || {};
            Object.assign(startConfig, cpcconfig_1.cpcconfig, winCpcConfig);
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
            trace: false // trace code
        };
        return cpcBasic;
    }());
    window.cpcBasic = cpcBasic;
    window.onload = function () {
        cpcBasic.fnOnLoad();
    };
    // nodeJsAvail: when launching via node...
    // eslint-disable-next-line no-new-func
    var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // for old IE
    nodeJsAvail = (function () {
        var nodeJs = false;
        // https://www.npmjs.com/package/detect-node
        // Only Node.JS has a process variable that is of [[Class]] process
        try {
            if (Object.prototype.toString.call(myGlobalThis.process) === "[object process]") {
                nodeJs = true;
            }
        }
        catch (e) {
            // empty
        }
        return nodeJs;
    }());
    if (nodeJsAvail) {
        (function () {
            var https, // nodeJs
            fs, module;
            var domElements = {}, myCreateElement = function (id) {
                domElements[id] = {
                    className: "",
                    style: {
                        borderwidth: "",
                        borderStyle: ""
                    },
                    addEventListener: function () { },
                    options: [],
                    get length() {
                        return domElements[id].options.length;
                    }
                };
                return domElements[id];
            };
            Object.assign(window, {
                console: console,
                document: {
                    addEventListener: function () { },
                    getElementById: function (id) { return domElements[id] || myCreateElement(id); },
                    createElement: function (type) {
                        if (type === "option") {
                            return {};
                        }
                        Utils_1.Utils.console.error("createElement: unknown type", type);
                        return {};
                    }
                },
                AudioContext: function () { throw new Error("AudioContext not supported"); }
            });
            // eslint-disable-next-line no-eval
            var nodeExports = eval("exports"), view = nodeExports.View, setSelectOptionsOrig = view.prototype.setSelectOptions;
            view.prototype.setSelectOptions = function (id, options) {
                var element = domElements[id] || myCreateElement(id);
                if (!element.options.add) {
                    // element.options = [];
                    element.add = function (option) {
                        // eslint-disable-next-line no-invalid-this
                        element.options.push(option);
                        if (element.options.length === 1 || option.selected) {
                            element.value = element.options[element.options.length - 1].value;
                        }
                    };
                }
                return setSelectOptionsOrig(id, options);
            };
            var setAreaValueOrig = view.prototype.setAreaValue;
            view.prototype.setAreaValue = function (id, value) {
                if (id === "resultText") {
                    if (value) {
                        Utils_1.Utils.console.log(value);
                    }
                }
                return setAreaValueOrig(id, value);
            };
            // https://nodejs.dev/learn/accept-input-from-the-command-line-in-nodejs
            // readline?
            var controller = nodeExports.Controller;
            // startWithDirectInputOrig = controller.prototype.startWithDirectInput;
            controller.prototype.startWithDirectInput = function () {
                Utils_1.Utils.console.log("We are ready.");
            };
            //
            function isUrl(s) {
                return s.startsWith("http"); // http or https
            }
            function fnEval(code) {
                return eval(code); // eslint-disable-line no-eval
            }
            function nodeReadUrl(url, fnDataLoaded) {
                if (!https) {
                    fnEval('https = require("https");'); // to trick TypeScript
                }
                https.get(url, function (resp) {
                    var data = "";
                    // A chunk of data has been received.
                    resp.on("data", function (chunk) {
                        data += chunk;
                    });
                    // The whole response has been received. Print out the result.
                    resp.on("end", function () {
                        fnDataLoaded(undefined, data);
                    });
                }).on("error", function (err) {
                    Utils_1.Utils.console.log("Error: " + err.message);
                    fnDataLoaded(err);
                });
            }
            var modulePath;
            function nodeReadFile(name, fnDataLoaded) {
                if (!fs) {
                    fnEval('fs = require("fs");'); // to trick TypeScript
                }
                if (!module) {
                    fnEval('module = require("module");'); // to trick TypeScript
                    modulePath = module.path || "";
                    if (!modulePath) {
                        Utils_1.Utils.console.warn("nodeReadFile: Cannot determine module path");
                    }
                }
                var name2 = modulePath ? modulePath + "/" + name : name;
                fs.readFile(name2, "utf8", fnDataLoaded);
            }
            var utils = nodeExports.Utils;
            utils.loadScript = function (fileOrUrl, fnSuccess, _fnError, key) {
                var fnLoaded = function (error, data) {
                    if (error) {
                        Utils_1.Utils.console.error("file error: ", error);
                    }
                    if (data) {
                        fnEval(data); // load js (for nodeJs)
                    }
                    fnSuccess(fileOrUrl, key);
                };
                if (isUrl(fileOrUrl)) {
                    nodeReadUrl(fileOrUrl, fnLoaded);
                }
                else {
                    nodeReadFile(fileOrUrl, fnLoaded);
                }
            };
        }());
        cpcBasic.fnOnLoad();
        Utils_1.Utils.console.log("End of program.");
    }
});
//# sourceMappingURL=cpcbasic.js.map