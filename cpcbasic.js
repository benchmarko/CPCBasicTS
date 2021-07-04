"use strict";
// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("./Utils");
var Controller_1 = require("./Controller");
var cpcconfig_1 = require("./cpcconfig");
var Model_1 = require("./Model");
var View_1 = require("./View");
var cpcBasic = /** @class */ (function () {
    function cpcBasic() {
    }
    cpcBasic.fnHereDoc = function (fn) {
        return String(fn).
            replace(/^[^/]+\/\*\S*/, "").
            replace(/\*\/[^/]+$/, "");
    };
    cpcBasic.addIndex = function (sDir, input) {
        if (typeof input !== "string") {
            input = this.fnHereDoc(input);
        }
        return cpcBasic.controller.addIndex(sDir, input);
    };
    cpcBasic.addItem = function (sKey, input) {
        var sInput = (typeof input !== "string") ? this.fnHereDoc(input) : input;
        return cpcBasic.controller.addItem(sKey, sInput);
    };
    // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    cpcBasic.fnParseUri = function (sUrlQuery, oConfig) {
        var rPlus = /\+/g, // Regex for replacing addition symbol with a space
        rSearch = /([^&=]+)=?([^&]*)/g, fnDecode = function (s) { return decodeURIComponent(s.replace(rPlus, " ")); };
        var aMatch;
        while ((aMatch = rSearch.exec(sUrlQuery)) !== null) {
            var sName = fnDecode(aMatch[1]);
            var sValue = fnDecode(aMatch[2]);
            if (sValue !== null && oConfig.hasOwnProperty(sName)) {
                switch (typeof oConfig[sName]) {
                    case "string":
                        break;
                    case "boolean":
                        sValue = (sValue === "true");
                        break;
                    case "number":
                        sValue = Number(sValue);
                        break;
                    case "object":
                        break;
                    default:
                        break;
                }
            }
            oConfig[sName] = sValue;
        }
    };
    cpcBasic.createDebugUtilsConsole = function (sCpcBasicLog) {
        var oCurrentConsole = Utils_1.Utils.console, oConsole = {
            consoleLog: {
                value: sCpcBasicLog || "" // already something collected?
            },
            console: oCurrentConsole,
            fnMapObjectProperties: function (arg) {
                if (typeof arg === "object") {
                    var aRes = [];
                    for (var sKey in arg) { // eslint-disable-line guard-for-in
                        // if (arg.hasOwnProperty(sKey)) {
                        var value = arg[sKey];
                        if (typeof value !== "object" && typeof value !== "function") {
                            aRes.push(sKey + ": " + value);
                        }
                    }
                    arg = String(arg) + "{" + aRes.join(", ") + "}";
                }
                return arg;
            },
            rawLog: function (fnMethod, sLevel, aArgs) {
                if (sLevel) {
                    aArgs.unshift(sLevel);
                }
                if (fnMethod) {
                    if (fnMethod.apply) {
                        fnMethod.apply(console, aArgs);
                    }
                }
                if (this.consoleLog) {
                    this.consoleLog.value += aArgs.map(this.fnMapObjectProperties).join(" ") + ((sLevel !== null) ? "\n" : "");
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
            changeLog: function (oLog) {
                var oldLog = this.consoleLog;
                this.consoleLog = oLog;
                if (oldLog && oldLog.value && oLog) { // some log entires collected?
                    oLog.value += oldLog.value; // take collected log entries
                }
            }
        };
        //Utils.console = oConsole as any;
        return oConsole;
    };
    cpcBasic.fnDoStart = function () {
        var oStartConfig = cpcBasic.config, oExternalConfig = cpcconfig_1.cpcconfig || {}; // external config from cpcconfig.js
        Object.assign(oStartConfig, oExternalConfig);
        //const oInitialConfig = Object.assign({}, oStartConfig); // save config
        cpcBasic.model = new Model_1.Model(oStartConfig);
        var sUrlQuery = window.location.search.substring(1);
        cpcBasic.fnParseUri(sUrlQuery, oStartConfig); // modify config with URL parameters
        cpcBasic.view = new View_1.View();
        var iDebug = Number(cpcBasic.model.getProperty("debug"));
        Utils_1.Utils.debug = iDebug;
        var UtilsConsole = Utils_1.Utils.console, sCpcBasicLog = "";
        if (UtilsConsole.cpcBasicLog) {
            sCpcBasicLog = UtilsConsole.cpcBasicLog;
            UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
        }
        if (Utils_1.Utils.debug > 1 && cpcBasic.model.getProperty("showConsole")) { // console log window?
            UtilsConsole = cpcBasic.createDebugUtilsConsole(sCpcBasicLog);
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
        sound: true,
        tron: false // trace on
    };
    return cpcBasic;
}());
window.cpcBasic = cpcBasic;
window.onload = function () {
    cpcBasic.fnOnLoad();
};
//# sourceMappingURL=cpcbasic.js.map