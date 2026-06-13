// NodeAdapt.ts - Adaptations for nodeJS
//
import { Utils } from "./Utils";
import { View } from "./View";
import { Controller } from "./Controller";
var NodeAdapt = /** @class */ (function () {
    function NodeAdapt() {
    }
    NodeAdapt.doAdapt = function (deps) {
        var view = (deps ? deps.View : (typeof View !== "undefined" ? View : undefined)), controller = (deps ? deps.Controller : (typeof Controller !== "undefined" ? Controller : undefined)), utils = (deps ? deps.Utils : Utils);
        /* eslint-disable prefer-const */
        var https = undefined, // nodeJs - set via fnEval, invisible to TS
        fs = undefined, module, audioContext;
        /* eslint-enable prefer-const */
        var domElements = {}, myCreateElement = function (id) {
            domElements[id] = {
                className: "",
                style: {
                    borderwidth: "",
                    borderStyle: ""
                },
                addEventListener: function () {
                    // nothing
                },
                options: [],
                getAttribute: function () {
                    // nothing
                },
                setAttribute: function () {
                    // nothing
                }
            };
            // old syntax for getter with "get length() { ... }"
            Object.defineProperty(domElements[id], "length", {
                get: function () {
                    return domElements[id].options.length;
                },
                set: function (len) {
                    domElements[id].options.length = len;
                },
                enumerable: true,
                configurable: true
            });
            return domElements[id];
        };
        function fnEval(code) {
            return eval(code); // eslint-disable-line no-eval
        }
        if (!audioContext) {
            // fnEval('audioContext = require("web-audio-api").AudioContext;'); // has no createChannelMerger()
            if (!audioContext) {
                audioContext = function () {
                    throw new Error("AudioContext not supported");
                };
            }
        }
        Object.assign(window, {
            console: console,
            document: {
                addEventListener: function () {
                    // nothing
                },
                getElementById: function (id) { return domElements[id] || myCreateElement(id); },
                createElement: function (type) {
                    if (type === "option") {
                        return {};
                    }
                    Utils.console.error("createElement: unknown type", type);
                    return {};
                }
            },
            AudioContext: audioContext
        });
        var setSelectOptionsOrig = view.prototype.setSelectOptions;
        // fast hacks...
        view.prototype.setSelectOptions = function (id, options) {
            var element = domElements[id] || myCreateElement(id);
            if (!element.options.add) {
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
            if (id === "resultText" /* ViewID.resultText */) {
                if (value) {
                    Utils.console.log(value);
                }
            }
            return setAreaValueOrig(id, value);
        };
        // https://nodejs.dev/learn/accept-input-from-the-command-line-in-nodejs
        // readline?
        controller.prototype.startWithDirectInput = function () {
            this.stopUpdateCanvas();
            Utils.console.log("We are ready.");
        };
        function isUrl(s) {
            return s.startsWith("http"); // http or https
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
                Utils.console.log("Error: " + err.message);
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
                    Utils.console.warn("nodeReadFile: Cannot determine module path");
                }
            }
            var name2 = modulePath ? modulePath + "/" + name : name;
            fs.readFile(name2, "utf8", fnDataLoaded);
        }
        utils.loadScript = function (fileOrUrl, fnSuccess, _fnError, key) {
            var fnLoaded = function (error, data) {
                if (error) {
                    Utils.console.error("file error: ", error);
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
    };
    return NodeAdapt;
}());
export { NodeAdapt };
//# sourceMappingURL=NodeAdapt.js.map