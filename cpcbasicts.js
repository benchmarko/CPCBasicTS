"use strict";
// Polyfills.ts - Some Polyfills for old browsers, e.g. IE8, and nodeJS
//
/* globals globalThis */
var Polyfills = {
    list: [],
    getList: function () {
        return Polyfills.list;
    },
    log: function (part) {
        Polyfills.list.push(part);
    },
    console: typeof window !== "undefined" ? window.console : globalThis.console,
    localStorage: (function () {
        var rc;
        if (typeof window !== "undefined") {
            try {
                rc = window.localStorage; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
            }
            catch (_e) {
                // empty
            }
        }
        return rc; // if it is undefined, localStorage is set in Polyfills
    }()),
    isNodeAvailable: (function () {
        // eslint-disable-next-line no-new-func
        var myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
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
    }()),
    isDefinePropertyOk: (function () {
        if (!Object.defineProperty) {
            return false;
        }
        try { // IE8 cannot do this...
            Object.defineProperty({}, "p1", {
                value: "1"
            });
        }
        catch (e) { // on IE8 we get "TypeError: Object does not support this action"
            return false;
        }
        return true;
    }())
};
// IE: window.console is only available when Dev Tools are open
if (!Polyfills.console) { // browser or node.js
    var polyFillConsole_1 = {
        cpcBasicLog: "LOG:\n",
        log: function () {
            if (polyFillConsole_1.cpcBasicLog) {
                polyFillConsole_1.cpcBasicLog += Array.prototype.slice.call(arguments).join(" ") + "\n";
            }
        }
    };
    polyFillConsole_1.info = polyFillConsole_1.log;
    polyFillConsole_1.warn = polyFillConsole_1.log;
    polyFillConsole_1.error = polyFillConsole_1.log;
    polyFillConsole_1.debug = polyFillConsole_1.log;
    Polyfills.console = polyFillConsole_1;
    Polyfills.log("window.console");
}
if (!Polyfills.console.debug) { // IE8 has no console.debug
    Polyfills.console.debug = Polyfills.console.log;
    Polyfills.log("window.console.debug");
}
if ((typeof globalThis !== "undefined") && !globalThis.window) { // nodeJS
    Polyfills.log("window");
    globalThis.window = globalThis;
}
if (!Array.prototype.indexOf) { // IE8
    Polyfills.log("Array.prototype.indexOf");
    Array.prototype.indexOf = function (searchElement, from) {
        var len = this.length >>> 0; // eslint-disable-line no-bitwise
        from = Number(from) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) {
            from += len;
        }
        for (; from < len; from += 1) {
            if (from in this && this[from] === searchElement) {
                return from;
            }
        }
        return -1;
    };
}
if (!Array.prototype.fill) { // IE11
    // based on: https://github.com/1000ch/array-fill/blob/master/index.js
    Polyfills.log("Array.prototype.fill");
    Array.prototype.fill = function (value, start, end) {
        var length = this.length;
        start = start || 0;
        end = end === undefined ? length : (end || 0);
        var i = start < 0 ? Math.max(length + start, 0) : Math.min(start, length);
        var l = end < 0 ? Math.max(length + end, 0) : Math.min(end, length);
        for (; i < l; i += 1) {
            this[i] = value;
        }
        return this;
    };
}
if (!Array.prototype.filter) { // IE8
    Polyfills.log("Array.prototype.filter");
    Array.prototype.filter = function (callbackFn) {
        var arr = [];
        for (var i = 0; i < this.length; i += 1) {
            if (callbackFn.call(this, this[i], i, this)) {
                arr.push(this[i]);
            }
        }
        return arr;
    };
}
if (!Array.prototype.map) { // IE8
    // based on: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    Polyfills.log("Array.prototype.map");
    Array.prototype.map = function (callback, thisArg) {
        var values = [], object = Object(this), len = object.length;
        var T;
        if (arguments.length > 1) {
            T = thisArg;
        }
        for (var i = 0; i < len; i += 1) {
            if (i in object) {
                var kValue = object[i], mappedValue = callback.call(T, kValue, i, object);
                values[i] = mappedValue;
            }
        }
        return values;
    };
}
if (window.Element) {
    if (!Element.prototype.addEventListener) { // IE8
        Polyfills.log("Element.prototype.addEventListener");
        Element.prototype.addEventListener = function (event, fnCallback) {
            event = "on" + event;
            return this.attachEvent(event, fnCallback);
        };
    }
    if (!Element.prototype.removeEventListener) { // IE8
        Polyfills.log("Element.prototype.removeEventListener");
        Element.prototype.removeEventListener = function (event, fnCallback) {
            event = "on" + event;
            return this.detachEvent(event, fnCallback);
        };
    }
}
if (window.Event) {
    if (!Event.prototype.preventDefault) { // IE8
        Polyfills.log("Event.prototype.preventDefault");
        Event.prototype.preventDefault = function () {
            // empty
        };
    }
    if (!Event.prototype.stopPropagation) { // IE8
        Polyfills.log("Event.prototype.stopPropagation");
        Event.prototype.stopPropagation = function () {
            // empty
        };
    }
}
if (!window.getComputedStyle) { // IE8
    // https://stackoverflow.com/questions/21797258/getcomputedstyle-like-javascript-function-for-ie8
    Polyfills.log("window.getComputedStyle");
    window.getComputedStyle = function (el, _pseudo) {
        this.getPropertyValue = function (prop) {
            var re = /(-([a-z]){1})/g;
            if (prop === "float") {
                prop = "styleFloat";
            }
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            var currentStyle = el.currentStyle;
            return currentStyle && currentStyle[prop] ? currentStyle[prop] : null;
        };
        return this;
    };
}
if (!Date.now) { // IE8
    Polyfills.log("Date.now");
    Date.now = function () {
        return new Date().getTime();
    };
}
if (window.document) {
    if (!document.addEventListener) {
        // or check: https://gist.github.com/fuzzyfox/6762206
        Polyfills.log("document.addEventListener, removeEventListener");
        if (document.attachEvent) {
            (function () {
                var eventListeners = [];
                document.addEventListener = function (eventString, fnHandler) {
                    var fnFindCaret = function (event) {
                        var documentSelection = document.selection; // IE only
                        if (documentSelection) {
                            var target = (event.target || event.srcElement);
                            target.focus();
                            var range = documentSelection.createRange(), range2 = range.duplicate();
                            if (range2.moveToElementTxt) { // not on IE8
                                range2.moveToElementTxt(target);
                            }
                            range2.setEndPoint("EndToEnd", range);
                            target.selectionStart = range2.text.length - range.text.length;
                            target.selectionEnd = target.selectionStart + range.text.length;
                        }
                    }, fnOnEvent = function (event) {
                        event = event || window.event;
                        var target = event.target || event.srcElement;
                        if (event.type === "click" && target && target.tagName === "TEXTAREA") {
                            fnFindCaret(event);
                        }
                        if (typeof fnHandler === "function") {
                            fnHandler(event);
                        }
                        else if (typeof fnHandler === "object") {
                            fnHandler.handleEvent(event);
                        }
                        else {
                            Polyfills.console.error("Unknown fnHandler:", fnHandler);
                        }
                        return false;
                    };
                    // The change event is not bubbled and fired on document for old IE8. So attach it to every select tag
                    if (eventString === "change") {
                        var elements = document.getElementsByTagName("select");
                        for (var i = 0; i < elements.length; i += 1) {
                            elements[i].attachEvent("on" + eventString, fnOnEvent);
                            eventListeners.push({
                                object: this,
                                eventString: eventString,
                                fnHandler: fnHandler,
                                fnOnEvent: fnOnEvent
                            });
                        }
                    }
                    else { // e.g. "Click"
                        document.attachEvent("on" + eventString, fnOnEvent);
                        eventListeners.push({
                            object: this,
                            eventString: eventString,
                            fnHandler: fnHandler,
                            fnOnEvent: fnOnEvent
                        });
                    }
                };
                document.removeEventListener = function (event, fnHandler) {
                    var counter = 0;
                    while (counter < eventListeners.length) {
                        var eventListener = eventListeners[counter];
                        if (eventListener.object === this && eventListener.eventString === event && eventListener.fnHandler === fnHandler) {
                            this.detachEvent("on" + event, eventListener.fnOnEvent);
                            eventListeners.splice(counter, 1);
                            break;
                        }
                        counter += 1;
                    }
                };
            }());
        }
        else {
            (Polyfills.console || window.console).error("No document.attachEvent found."); // will be ignored
            // debug: trying to fix
            if (document.__proto__.addEventListener) { // eslint-disable-line no-proto
                document.addEventListener = document.__proto__.addEventListener; // eslint-disable-line no-proto
            }
        }
    }
}
if (!Function.prototype.bind) { // IE8
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    // Does not work with `new funcA.bind(thisArg, args)`
    Polyfills.log("Function.prototype.bind");
    (function () {
        var ArrayPrototypeSlice = Array.prototype.slice; // since IE6
        Function.prototype.bind = function () {
            var that = this, // eslint-disable-line @typescript-eslint/no-this-alias
            thatArg = arguments[0], args = ArrayPrototypeSlice.call(arguments, 1), argLen = args.length;
            if (typeof that !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }
            return function () {
                args.length = argLen;
                args.push.apply(args, arguments);
                return that.apply(thatArg, args);
            };
        };
    }());
}
if (!Math.log10) { // IE11
    Polyfills.log("Math.log10");
    Math.log10 = function (x) {
        return Math.log(x) * Math.LOG10E;
    };
}
if (!Math.sign) { // IE11
    Polyfills.log("Math.sign");
    Math.sign = function (x) {
        return (Number(x > 0) - Number(x < 0)) || Number(x);
    };
}
if (!Math.trunc) { // IE11
    Polyfills.log("Math.trunc");
    Math.trunc = function (v) {
        return v < 0 ? Math.ceil(v) : Math.floor(v);
    };
}
if (!Object.assign) { // IE11
    Polyfills.log("Object.assign");
    Object.assign = function (target) {
        var to = target;
        for (var i = 1; i < arguments.length; i += 1) {
            var nextSource = arguments[i];
            for (var nextKey in nextSource) {
                if (nextSource.hasOwnProperty(nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
        return to;
    };
}
if (!Object.defineProperty || !Polyfills.isDefinePropertyOk) { // IE8
    Polyfills.log("Object.defineProperty");
    Object.defineProperty = function (target, prop, PropDescriptor) {
        // can handle simple case: Object.defineProperty(exports, "__esModule", { value: true });
        target[prop] = PropDescriptor.value;
        return target;
    };
}
if (!Object.keys) { // IE8
    Polyfills.log("Object.keys");
    // based on: https://tokenposts.blogspot.com/2012/04/javascript-objectkeys-browser.html
    Object.keys = function (o) {
        var k = [];
        if (o !== Object(o)) {
            throw new TypeError("Object.keys called on a non-object");
        }
        for (var p in o) {
            if (Object.prototype.hasOwnProperty.call(o, p)) {
                k.push(p);
            }
        }
        return k;
    };
}
if (!Object.values) { // IE11
    Polyfills.log("Object.values");
    // based on: https://github.com/KhaledElAnsari/Object.values/blob/master/index.js
    Object.values = function (o) {
        return Object.keys(o).map(function (key) {
            return o[key];
        });
    };
}
if (!String.prototype.endsWith) {
    Polyfills.log("String.prototype.endsWith");
    String.prototype.endsWith = function (search, position) {
        if (position === undefined) {
            position = this.length;
        }
        position -= search.length;
        var lastIndex = this.indexOf(search, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}
if (!String.prototype.includes) { // IE11
    Polyfills.log("String.prototype.includes");
    String.prototype.includes = function (search, start) {
        if (start === void 0) { start = 0; }
        var ret;
        if (start + search.length > this.length) {
            ret = false;
        }
        else {
            ret = this.indexOf(search, start) !== -1;
        }
        return ret;
    };
}
if (!String.prototype.padStart) { // IE11
    Polyfills.log("String.prototype.padStart");
    String.prototype.padStart = function (targetLength, pad) {
        var ret = String(this);
        targetLength >>= 0; // eslint-disable-line no-bitwise
        if (this.length < targetLength) {
            pad = String(typeof pad !== "undefined" ? pad : " ");
            targetLength -= this.length;
            if (targetLength > pad.length) {
                pad += pad.repeat(targetLength / pad.length);
            }
            ret = pad.slice(0, targetLength) + ret;
        }
        return ret;
    };
}
if (!String.prototype.padEnd) { // IE11
    // based on: https://github.com/behnammodi/polyfill/blob/master/string.polyfill.js
    Polyfills.log("String.prototype.padEnd");
    String.prototype.padEnd = function (targetLength, pad) {
        var ret = String(this);
        targetLength >>= 0; // eslint-disable-line no-bitwise
        if (this.length < targetLength) {
            pad = String(typeof pad !== "undefined" ? pad : " ");
            targetLength -= this.length;
            if (targetLength > pad.length) {
                pad += pad.repeat(targetLength / pad.length);
            }
            ret += pad.slice(0, targetLength); // this line differs from padStart
        }
        return ret;
    };
}
if (!String.prototype.repeat) { // IE11
    Polyfills.log("String.prototype.repeat");
    String.prototype.repeat = function (count) {
        var str = String(this);
        var out = "";
        for (var i = 0; i < count; i += 1) {
            out += str;
        }
        return out;
    };
}
if (!String.prototype.startsWith) {
    Polyfills.log("String.prototype.startsWith");
    String.prototype.startsWith = function (search, position) {
        position = position || 0;
        return this.indexOf(search, position) === position;
    };
}
if (!String.prototype.trim) { // IE8
    Polyfills.log("String.prototype.trim");
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    };
}
// based on: https://github.com/mathiasbynens/base64/blob/master/base64.js
// https://mths.be/base64 v0.1.0 by @mathias | MIT license
if (!window.atob) { // IE9 (and node.js)
    Polyfills.log("window.atob, window.btoa");
    if (Polyfills.isNodeAvailable) { // for nodeJS we have an alternative
        // https://dirask.com/posts/Node-js-atob-btoa-functions-equivalents-1Aqb51
        window.atob = function (input) {
            return Buffer.from(input, "base64").toString("binary");
        };
        window.btoa = function (input) {
            return Buffer.from(input, "binary").toString("base64");
        };
    }
    else {
        (function () {
            var table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", reSpaceCharacters = /[\t\n\f\r ]/g; // http://whatwg.org/html/common-microsyntaxes.html#space-character
            /* eslint-disable no-bitwise */
            window.atob = function (input) {
                input = String(input).replace(reSpaceCharacters, "");
                var length = input.length;
                if (length % 4 === 0) {
                    input = input.replace(/[=]=?$/, ""); // additional brackets to maks eslint happy
                    length = input.length;
                }
                if (length % 4 === 1 || (/[^+a-zA-Z0-9/]/).test(input)) { // http://whatwg.org/C#alphanumeric-ascii-characters
                    throw new TypeError("Polyfills:atob: Invalid character: the string to be decoded is not correctly encoded.");
                }
                var bitCounter = 0, output = "", position = 0, bitStorage = 0;
                while (position < length) {
                    var buffer = table.indexOf(input.charAt(position));
                    bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
                    bitCounter += 1;
                    if ((bitCounter - 1) % 4) { // Unless this is the first of a group of 4 characters...
                        output += String.fromCharCode(0xFF & bitStorage >> (-2 * bitCounter & 6)); // ...convert the first 8 bits to a single ASCII character
                    }
                    position += 1;
                }
                return output;
            };
            window.btoa = function (input) {
                input = String(input);
                if ((/[^\0-\xFF]/).test(input)) {
                    throw new TypeError("Polyfills:btoa: The string to be encoded contains characters outside of the Latin1 range.");
                }
                var padding = input.length % 3, length = input.length - padding; // Make sure any padding is handled outside of the loop
                var output = "", position = 0;
                while (position < length) {
                    // Read three bytes, i.e. 24 bits.
                    var a = input.charCodeAt(position) << 16;
                    position += 1;
                    var b = input.charCodeAt(position) << 8;
                    position += 1;
                    var c = input.charCodeAt(position);
                    position += 1;
                    var buffer = a + b + c;
                    // Turn the 24 bits into four chunks of 6 bits each, and append the matching character for each of them to the output
                    output += table.charAt(buffer >> 18 & 0x3F) + table.charAt(buffer >> 12 & 0x3F) + table.charAt(buffer >> 6 & 0x3F) + table.charAt(buffer & 0x3F);
                }
                if (padding === 2) {
                    var a = input.charCodeAt(position) << 8;
                    position += 1;
                    var b = input.charCodeAt(position), buffer = a + b;
                    output += table.charAt(buffer >> 10) + table.charAt((buffer >> 4) & 0x3F) + table.charAt((buffer << 2) & 0x3F) + "=";
                }
                else if (padding === 1) {
                    var buffer = input.charCodeAt(position);
                    output += table.charAt(buffer >> 2) + table.charAt((buffer << 4) & 0x3F) + "==";
                }
                return output;
            };
            /* eslint-enable no-bitwise */
        }());
    }
}
// For IE and Edge, localStorage is only available if page is hosted on web server, so we simulate it (do not use property "length" or method names as keys!)
if (!Polyfills.localStorage) {
    Polyfills.log("window.localStorage");
    (function () {
        var Storage = /** @class */ (function () {
            function Storage() {
                this.length = 0;
            }
            Storage.prototype.clear = function () {
                for (var key in this) {
                    if (this.hasOwnProperty(key)) {
                        delete this[key];
                    }
                }
                this.length = 0;
            };
            Storage.prototype.key = function (index) {
                var i = 0;
                for (var key in this) {
                    if (this.hasOwnProperty(key) && key !== "length") {
                        if (i === index) {
                            return key;
                        }
                        i += 1;
                    }
                }
                return null;
            };
            Storage.prototype.getItem = function (key) {
                return this.hasOwnProperty(key) ? this[key] : null;
            };
            Storage.prototype.setItem = function (key, value) {
                if (this.getItem(key) === null) {
                    this.length += 1;
                }
                this[key] = String(value);
            };
            Storage.prototype.removeItem = function (key) {
                if (this.getItem(key) !== null) {
                    delete this[key];
                    this.length -= 1;
                }
            };
            return Storage;
        }());
        Polyfills.localStorage = new Storage();
    }());
}
if (!window.ArrayBuffer) { // IE9
    Polyfills.log("window.ArrayBuffer");
    window.ArrayBuffer = Array;
}
if (!window.AudioContext) { // ? not for IE
    window.AudioContext = window.webkitAudioContext || window.mozAudioContext;
    if (window.AudioContext) {
        Polyfills.log("window.AudioContext");
    }
    else {
        Polyfills.log("window.AudioContext not ok!");
    }
}
if (!window.JSON) { // simple polyfill for JSON.parse only
    // for a better implementation, see https://github.com/douglascrockford/JSON-js/blob/master/json2.js
    Polyfills.log("window.JSON.parse");
    window.JSON = {
        parse: function (text) {
            return eval("(" + text + ")"); // eslint-disable-line no-eval
        },
        stringify: function (o) {
            (Polyfills.console || window.console).error("Not implemented: window.JSON.stringify");
            return String(o);
        }
    };
}
if (!window.requestAnimationFrame) { // IE9, SliTaz tazweb browser
    // https://wiki.selfhtml.org/wiki/JavaScript/Window/requestAnimationFrame
    window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
        (function () {
            var lastTime = 0;
            Polyfills.log("window.requestAnimationFrame, cancelAnimationFrame");
            window.requestAnimationFrame = function (callback /* , element */) {
                var currTime = new Date().getTime(), timeToCall = Math.max(0, 16 - (currTime - lastTime)), id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }());
    }
    else {
        Polyfills.log("window.requestAnimationFrame, cancelAnimationFrame: Using vendor specific method.");
    }
}
if (!window.Uint8Array) { // IE9
    Polyfills.log("Uint8Array (fallback only)");
    window.Uint8Array = function (arrayBuffer) {
        return arrayBuffer; // we just return the ArrayBuffer as fallback; enough for our needs
    };
    window.Uint8Array.BYTES_PER_ELEMENT = 1;
    // A more complex solution would be: https://github.com/inexorabletash/polyfill/blob/master/typedarray.js
}
(Polyfills.console || window.console).debug("Polyfills: (" + Polyfills.getList().length + ") " + Polyfills.getList().join("; "));
window.Polyfills = Polyfills; // for nodeJs
// end
// amdLoader.ts - AMD Loader for the browser or nodeJS
// (c) Marco Vieth, 2022
//
// Simulates nodeJS exports, require, define in the browser.
// Does not support default exports, (maybe possible with document.currentScript.src, but not for IE; or when compiled to one file)
//
function amd4Node() {
    var Module = require("module"); // eslint-disable-line global-require, @typescript-eslint/no-var-requires
    var moduleStack = [], defaultCompile = module.constructor.prototype._compile; // eslint-disable-line no-underscore-dangle
    // eslint-disable-next-line no-underscore-dangle
    module.constructor.prototype._compile = function (content, filename) {
        moduleStack.push(this);
        try {
            return defaultCompile.call(this, content, filename);
        }
        finally {
            moduleStack.pop();
        }
    };
    global.define = function (arg1, arg2, arg3) {
        // if arg1 is no id, we have an anonymous module
        // eslint-disable-next-line array-element-newline
        var _a = (typeof arg1 !== "string") ? [arg1, arg2] : [arg2, arg3], deps = _a[0], func = _a[1], 
        // const [id, deps, func] = (typeof arg1 !== "string") ? ["", arg1, arg2 as MyDefineFunctionType] : [arg1, arg2 as string[], arg3 as MyDefineFunctionType],
        currentModule = moduleStack[moduleStack.length - 1], mod = currentModule || module.parent || require.main, req = function (module, relativeId) {
            if (module.exports[relativeId]) { // already loaded, maybe from define in same file?
                return module.exports;
            }
            var fileName = Module._resolveFilename(relativeId, module); // eslint-disable-line no-underscore-dangle
            if (Array.isArray(fileName)) {
                fileName = fileName[0];
            }
            return require(fileName); // eslint-disable-line global-require
        }.bind(this, mod);
        func.apply(mod.exports, deps.map(function (injection) {
            switch (injection) {
                // check for CommonJS injection variables
                case "require": return req;
                case "exports": return mod.exports;
                case "module": return mod;
                default: return req(injection); // a module dependency
            }
        }));
    };
}
function amd4browser() {
    if (!window.exports) {
        window.exports = {};
    }
    if (!window.require) {
        window.require = function (name) {
            name = name.replace(/^.*[\\/]/, "");
            if (!window.exports[name]) {
                console.error("ERROR: Module not loaded:", name);
                throw new Error();
            }
            return window.exports;
        };
    }
    if (!window.define) {
        window.define = function (arg1, arg2, arg3) {
            // if arg1 is no id, we have an anonymous module
            var _a = (typeof arg1 !== "string") ? [arg1, arg2] : [arg2, arg3], deps = _a[0], func = _a[1], // eslint-disable-line array-element-newline
            depsMapped = []; // deps.map() (Array.map() not IE8)
            for (var i = 0; i < deps.length; i += 1) {
                var name_1 = deps[i];
                var mapped = void 0;
                if (name_1 === "require") {
                    mapped = null;
                }
                else if (name_1 === "exports") {
                    mapped = window.exports;
                }
                else {
                    mapped = window.require(name_1);
                }
                depsMapped[i] = mapped;
            }
            func.apply(this, depsMapped);
        };
    }
}
if (Polyfills.isNodeAvailable) {
    amd4Node();
}
else {
    amd4browser();
}
// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("Utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utils = void 0;
    var Polyfills = window.Polyfills;
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        Utils.fnLoadScriptOrStyle = function (script, fnSuccess, fnError) {
            // inspired by https://github.com/requirejs/requirejs/blob/master/require.js
            var ieTimeoutCount = 3; // IE timeout count
            var onScriptLoad = function (event) {
                var type = event.type, // "load" or "error"
                node = (event.currentTarget || event.srcElement), fullUrl = node.src || node.href, // src for script, href for link
                key = node.getAttribute("data-key");
                if (Utils.debug > 1) {
                    Utils.console.debug("onScriptLoad:", type, fullUrl, key);
                }
                node.removeEventListener("load", onScriptLoad, false);
                node.removeEventListener("error", onScriptLoad, false);
                if (type === "load") {
                    fnSuccess(fullUrl, key);
                }
                else {
                    fnError(fullUrl, key);
                }
            }, onScriptReadyStateChange = function (event) {
                var node = (event ? (event.currentTarget || event.srcElement) : script), fullUrl = node.src || node.href, // src for script, href for link
                key = node.getAttribute("data-key"), node2 = node;
                if (node2.detachEvent) {
                    node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
                }
                if (Utils.debug > 1) {
                    Utils.console.debug("onScriptReadyStateChange: " + fullUrl);
                }
                // check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
                if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
                    if (node2.readyState === "loading" && ieTimeoutCount) {
                        ieTimeoutCount -= 1;
                        var timeout = 200; // some delay
                        Utils.console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
                        setTimeout(function () {
                            onScriptReadyStateChange(); // check again
                        }, timeout);
                    }
                    else {
                        // ieTimeoutCount = 3;
                        Utils.console.error("onScriptReadyStateChange: Cannot load file " + fullUrl + " readystate=" + node2.readyState);
                        fnError(fullUrl, key);
                    }
                }
                else {
                    fnSuccess(fullUrl, key);
                }
            };
            if (script.readyState) { // old IE8
                ieTimeoutCount = 3;
                script.attachEvent("onreadystatechange", onScriptReadyStateChange);
            }
            else { // Others
                script.addEventListener("load", onScriptLoad, false);
                script.addEventListener("error", onScriptLoad, false);
            }
            document.getElementsByTagName("head")[0].appendChild(script);
        };
        Utils.loadScript = function (url, fnSuccess, fnError, key) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.charset = "utf-8";
            script.async = true;
            script.src = url;
            script.setAttribute("data-key", key);
            this.fnLoadScriptOrStyle(script, fnSuccess, fnError);
        };
        Utils.hexEscape = function (str) {
            return str.replace(/[\x00-\x1f]/g, function (char) {
                return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
            });
        };
        Utils.hexUnescape = function (str) {
            return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
                return String.fromCharCode(parseInt(arguments[1], 16));
            });
        };
        Utils.dateFormat = function (d) {
            return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
                + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
        };
        Utils.stringCapitalize = function (str) {
            return str.charAt(0).toUpperCase() + str.substring(1);
        };
        Utils.numberWithCommas = function (x) {
            // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
            var parts = String(x).split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        };
        Utils.toRadians = function (deg) {
            return deg * Math.PI / 180;
        };
        Utils.toDegrees = function (rad) {
            return rad * 180 / Math.PI;
        };
        Utils.toPrecision9 = function (num) {
            var numStr = num.toPrecision(9), // some rounding, formatting
            _a = numStr.split("e"), decimal = _a[0], exponent = _a[1], // eslint-disable-line array-element-newline
            result = String(Number(decimal)) + (exponent !== undefined ? ("E" + exponent.replace(/(\D)(\d)$/, "$10$2")) : "");
            // Number(): strip trailing decimal point and/or zeros (replace(/\.?0*$/, ""))
            // exponent 1 digit to 2 digits
            return result;
        };
        Utils.testIsSupported = function (testExpression) {
            try {
                Function(testExpression); // eslint-disable-line no-new-func
            }
            catch (e) {
                return false;
            }
            return true;
        };
        Utils.stringTrimEnd = function (str) {
            return str.replace(/[\s\uFEFF\xA0]+$/, "");
        };
        Utils.isCustomError = function (e) {
            return e.pos !== undefined;
        };
        Utils.split2 = function (str, char) {
            var index = str.indexOf(char);
            return index >= 0 ? [str.slice(0, index), str.slice(index + 1)] : [str]; // eslint-disable-line array-element-newline
        };
        Utils.string2Uint8Array = function (data) {
            var buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
            for (var i = 0; i < data.length; i += 1) {
                view[i] = data.charCodeAt(i);
            }
            return view;
        };
        Utils.composeError = function (name, errorObject, message, value, pos, len, line, hidden) {
            var customError = errorObject;
            customError.name = name;
            customError.message = message;
            customError.value = value;
            if (pos !== undefined) {
                customError.pos = pos;
            }
            if (len !== undefined) {
                customError.len = len;
            }
            if (line !== undefined) {
                customError.line = line;
            }
            if (hidden !== undefined) {
                customError.hidden = hidden;
            }
            var errorLen = customError.len;
            if (errorLen === undefined && customError.value !== undefined) {
                errorLen = String(customError.value).length;
            }
            var endPos = (customError.pos || 0) + (errorLen || 0), lineMsg = (customError.line !== undefined ? " in " + customError.line : ""), posMsg = pos !== undefined ? (" at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos)) : "";
            customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
            customError.message += lineMsg + posMsg + ": " + customError.value;
            return customError;
        };
        Utils.composeVmError = function (name, errorObject, errCode, value) {
            var customError = Utils.composeError(name, errorObject, String(errCode), value);
            customError.errCode = errCode;
            return customError;
        };
        Utils.debug = 0;
        Utils.console = Polyfills.console;
        Utils.supportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?
        Utils.supportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
        Utils.localStorage = Polyfills.localStorage || window.localStorage;
        Utils.atob = function (data) {
            return window.atob(data);
        };
        Utils.btoa = function (data) {
            return window.btoa(data);
        };
        return Utils;
    }());
    exports.Utils = Utils;
});
// Interfaces.ts - Interfaces
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//
define("Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
//
// cpcCharset.ts
//
define("cpcCharset", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cpcCharset = void 0;
    /* eslint-disable array-element-newline */
    exports.cpcCharset = [
        [0xff, 0xc3, 0xc3, 0xc3, 0xc3, 0xc3, 0xc3, 0xff],
        [0xff, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0],
        [0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0xff],
        [0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0xff],
        [0x0c, 0x18, 0x30, 0x7e, 0x0c, 0x18, 0x30, 0x00],
        [0xff, 0xc3, 0xe7, 0xdb, 0xdb, 0xe7, 0xc3, 0xff],
        [0x00, 0x01, 0x03, 0x06, 0xcc, 0x78, 0x30, 0x00],
        [0x3c, 0x66, 0xc3, 0xc3, 0xff, 0x24, 0xe7, 0x00],
        [0x00, 0x00, 0x30, 0x60, 0xff, 0x60, 0x30, 0x00],
        [0x00, 0x00, 0x0c, 0x06, 0xff, 0x06, 0x0c, 0x00],
        [0x18, 0x18, 0x18, 0x18, 0xdb, 0x7e, 0x3c, 0x18],
        [0x18, 0x3c, 0x7e, 0xdb, 0x18, 0x18, 0x18, 0x18],
        [0x18, 0x5a, 0x3c, 0x99, 0xdb, 0x7e, 0x3c, 0x18],
        [0x00, 0x03, 0x33, 0x63, 0xfe, 0x60, 0x30, 0x00],
        [0x3c, 0x66, 0xff, 0xdb, 0xdb, 0xff, 0x66, 0x3c],
        [0x3c, 0x66, 0xc3, 0xdb, 0xdb, 0xc3, 0x66, 0x3c],
        [0xff, 0xc3, 0xc3, 0xff, 0xc3, 0xc3, 0xc3, 0xff],
        [0x3c, 0x7e, 0xdb, 0xdb, 0xdf, 0xc3, 0x66, 0x3c],
        [0x3c, 0x66, 0xc3, 0xdf, 0xdb, 0xdb, 0x7e, 0x3c],
        [0x3c, 0x66, 0xc3, 0xfb, 0xdb, 0xdb, 0x7e, 0x3c],
        [0x3c, 0x7e, 0xdb, 0xdb, 0xfb, 0xc3, 0x66, 0x3c],
        [0x00, 0x01, 0x33, 0x1e, 0xce, 0x7b, 0x31, 0x00],
        [0x7e, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0xe7],
        [0x03, 0x03, 0x03, 0xff, 0x03, 0x03, 0x03, 0x00],
        [0xff, 0x66, 0x3c, 0x18, 0x18, 0x3c, 0x66, 0xff],
        [0x18, 0x18, 0x3c, 0x3c, 0x3c, 0x3c, 0x18, 0x18],
        [0x3c, 0x66, 0x66, 0x30, 0x18, 0x00, 0x18, 0x00],
        [0x3c, 0x66, 0xc3, 0xff, 0xc3, 0xc3, 0x66, 0x3c],
        [0xff, 0xdb, 0xdb, 0xdb, 0xfb, 0xc3, 0xc3, 0xff],
        [0xff, 0xc3, 0xc3, 0xfb, 0xdb, 0xdb, 0xdb, 0xff],
        [0xff, 0xc3, 0xc3, 0xdf, 0xdb, 0xdb, 0xdb, 0xff],
        [0xff, 0xdb, 0xdb, 0xdb, 0xdf, 0xc3, 0xc3, 0xff],
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x18, 0x18, 0x18, 0x18, 0x18, 0x00, 0x18, 0x00],
        [0x6c, 0x6c, 0x6c, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x6c, 0x6c, 0xfe, 0x6c, 0xfe, 0x6c, 0x6c, 0x00],
        [0x18, 0x3e, 0x58, 0x3c, 0x1a, 0x7c, 0x18, 0x00],
        [0x00, 0xc6, 0xcc, 0x18, 0x30, 0x66, 0xc6, 0x00],
        [0x38, 0x6c, 0x38, 0x76, 0xdc, 0xcc, 0x76, 0x00],
        [0x18, 0x18, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x0c, 0x18, 0x30, 0x30, 0x30, 0x18, 0x0c, 0x00],
        [0x30, 0x18, 0x0c, 0x0c, 0x0c, 0x18, 0x30, 0x00],
        [0x00, 0x66, 0x3c, 0xff, 0x3c, 0x66, 0x00, 0x00],
        [0x00, 0x18, 0x18, 0x7e, 0x18, 0x18, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x30],
        [0x00, 0x00, 0x00, 0x7e, 0x00, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00],
        [0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0, 0x80, 0x00],
        [0x7c, 0xc6, 0xce, 0xd6, 0xe6, 0xc6, 0x7c, 0x00],
        [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7e, 0x00],
        [0x3c, 0x66, 0x06, 0x3c, 0x60, 0x66, 0x7e, 0x00],
        [0x3c, 0x66, 0x06, 0x1c, 0x06, 0x66, 0x3c, 0x00],
        [0x1c, 0x3c, 0x6c, 0xcc, 0xfe, 0x0c, 0x1e, 0x00],
        [0x7e, 0x62, 0x60, 0x7c, 0x06, 0x66, 0x3c, 0x00],
        [0x3c, 0x66, 0x60, 0x7c, 0x66, 0x66, 0x3c, 0x00],
        [0x7e, 0x66, 0x06, 0x0c, 0x18, 0x18, 0x18, 0x00],
        [0x3c, 0x66, 0x66, 0x3c, 0x66, 0x66, 0x3c, 0x00],
        [0x3c, 0x66, 0x66, 0x3e, 0x06, 0x66, 0x3c, 0x00],
        [0x00, 0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00],
        [0x00, 0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x30],
        [0x0c, 0x18, 0x30, 0x60, 0x30, 0x18, 0x0c, 0x00],
        [0x00, 0x00, 0x7e, 0x00, 0x00, 0x7e, 0x00, 0x00],
        [0x60, 0x30, 0x18, 0x0c, 0x18, 0x30, 0x60, 0x00],
        [0x3c, 0x66, 0x66, 0x0c, 0x18, 0x00, 0x18, 0x00],
        [0x7c, 0xc6, 0xde, 0xde, 0xde, 0xc0, 0x7c, 0x00],
        [0x18, 0x3c, 0x66, 0x66, 0x7e, 0x66, 0x66, 0x00],
        [0xfc, 0x66, 0x66, 0x7c, 0x66, 0x66, 0xfc, 0x00],
        [0x3c, 0x66, 0xc0, 0xc0, 0xc0, 0x66, 0x3c, 0x00],
        [0xf8, 0x6c, 0x66, 0x66, 0x66, 0x6c, 0xf8, 0x00],
        [0xfe, 0x62, 0x68, 0x78, 0x68, 0x62, 0xfe, 0x00],
        [0xfe, 0x62, 0x68, 0x78, 0x68, 0x60, 0xf0, 0x00],
        [0x3c, 0x66, 0xc0, 0xc0, 0xce, 0x66, 0x3e, 0x00],
        [0x66, 0x66, 0x66, 0x7e, 0x66, 0x66, 0x66, 0x00],
        [0x7e, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7e, 0x00],
        [0x1e, 0x0c, 0x0c, 0x0c, 0xcc, 0xcc, 0x78, 0x00],
        [0xe6, 0x66, 0x6c, 0x78, 0x6c, 0x66, 0xe6, 0x00],
        [0xf0, 0x60, 0x60, 0x60, 0x62, 0x66, 0xfe, 0x00],
        [0xc6, 0xee, 0xfe, 0xfe, 0xd6, 0xc6, 0xc6, 0x00],
        [0xc6, 0xe6, 0xf6, 0xde, 0xce, 0xc6, 0xc6, 0x00],
        [0x38, 0x6c, 0xc6, 0xc6, 0xc6, 0x6c, 0x38, 0x00],
        [0xfc, 0x66, 0x66, 0x7c, 0x60, 0x60, 0xf0, 0x00],
        [0x38, 0x6c, 0xc6, 0xc6, 0xda, 0xcc, 0x76, 0x00],
        [0xfc, 0x66, 0x66, 0x7c, 0x6c, 0x66, 0xe6, 0x00],
        [0x3c, 0x66, 0x60, 0x3c, 0x06, 0x66, 0x3c, 0x00],
        [0x7e, 0x5a, 0x18, 0x18, 0x18, 0x18, 0x3c, 0x00],
        [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3c, 0x00],
        [0x66, 0x66, 0x66, 0x66, 0x66, 0x3c, 0x18, 0x00],
        [0xc6, 0xc6, 0xc6, 0xd6, 0xfe, 0xee, 0xc6, 0x00],
        [0xc6, 0x6c, 0x38, 0x38, 0x6c, 0xc6, 0xc6, 0x00],
        [0x66, 0x66, 0x66, 0x3c, 0x18, 0x18, 0x3c, 0x00],
        [0xfe, 0xc6, 0x8c, 0x18, 0x32, 0x66, 0xfe, 0x00],
        [0x3c, 0x30, 0x30, 0x30, 0x30, 0x30, 0x3c, 0x00],
        [0xc0, 0x60, 0x30, 0x18, 0x0c, 0x06, 0x02, 0x00],
        [0x3c, 0x0c, 0x0c, 0x0c, 0x0c, 0x0c, 0x3c, 0x00],
        [0x18, 0x3c, 0x7e, 0x18, 0x18, 0x18, 0x18, 0x00],
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff],
        [0x30, 0x18, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x78, 0x0c, 0x7c, 0xcc, 0x76, 0x00],
        [0xe0, 0x60, 0x7c, 0x66, 0x66, 0x66, 0xdc, 0x00],
        [0x00, 0x00, 0x3c, 0x66, 0x60, 0x66, 0x3c, 0x00],
        [0x1c, 0x0c, 0x7c, 0xcc, 0xcc, 0xcc, 0x76, 0x00],
        [0x00, 0x00, 0x3c, 0x66, 0x7e, 0x60, 0x3c, 0x00],
        [0x1c, 0x36, 0x30, 0x78, 0x30, 0x30, 0x78, 0x00],
        [0x00, 0x00, 0x3e, 0x66, 0x66, 0x3e, 0x06, 0x7c],
        [0xe0, 0x60, 0x6c, 0x76, 0x66, 0x66, 0xe6, 0x00],
        [0x18, 0x00, 0x38, 0x18, 0x18, 0x18, 0x3c, 0x00],
        [0x06, 0x00, 0x0e, 0x06, 0x06, 0x66, 0x66, 0x3c],
        [0xe0, 0x60, 0x66, 0x6c, 0x78, 0x6c, 0xe6, 0x00],
        [0x38, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3c, 0x00],
        [0x00, 0x00, 0x6c, 0xfe, 0xd6, 0xd6, 0xc6, 0x00],
        [0x00, 0x00, 0xdc, 0x66, 0x66, 0x66, 0x66, 0x00],
        [0x00, 0x00, 0x3c, 0x66, 0x66, 0x66, 0x3c, 0x00],
        [0x00, 0x00, 0xdc, 0x66, 0x66, 0x7c, 0x60, 0xf0],
        [0x00, 0x00, 0x76, 0xcc, 0xcc, 0x7c, 0x0c, 0x1e],
        [0x00, 0x00, 0xdc, 0x76, 0x60, 0x60, 0xf0, 0x00],
        [0x00, 0x00, 0x3c, 0x60, 0x3c, 0x06, 0x7c, 0x00],
        [0x30, 0x30, 0x7c, 0x30, 0x30, 0x36, 0x1c, 0x00],
        [0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x3e, 0x00],
        [0x00, 0x00, 0x66, 0x66, 0x66, 0x3c, 0x18, 0x00],
        [0x00, 0x00, 0xc6, 0xd6, 0xd6, 0xfe, 0x6c, 0x00],
        [0x00, 0x00, 0xc6, 0x6c, 0x38, 0x6c, 0xc6, 0x00],
        [0x00, 0x00, 0x66, 0x66, 0x66, 0x3e, 0x06, 0x7c],
        [0x00, 0x00, 0x7e, 0x4c, 0x18, 0x32, 0x7e, 0x00],
        [0x0e, 0x18, 0x18, 0x70, 0x18, 0x18, 0x0e, 0x00],
        [0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00],
        [0x70, 0x18, 0x18, 0x0e, 0x18, 0x18, 0x70, 0x00],
        [0x76, 0xdc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0xcc, 0x33, 0xcc, 0x33, 0xcc, 0x33, 0xcc, 0x33],
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0xf0, 0xf0, 0xf0, 0xf0, 0x00, 0x00, 0x00, 0x00],
        [0x0f, 0x0f, 0x0f, 0x0f, 0x00, 0x00, 0x00, 0x00],
        [0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0x00, 0xf0, 0xf0, 0xf0, 0xf0],
        [0xf0, 0xf0, 0xf0, 0xf0, 0xf0, 0xf0, 0xf0, 0xf0],
        [0x0f, 0x0f, 0x0f, 0x0f, 0xf0, 0xf0, 0xf0, 0xf0],
        [0xff, 0xff, 0xff, 0xff, 0xf0, 0xf0, 0xf0, 0xf0],
        [0x00, 0x00, 0x00, 0x00, 0x0f, 0x0f, 0x0f, 0x0f],
        [0xf0, 0xf0, 0xf0, 0xf0, 0x0f, 0x0f, 0x0f, 0x0f],
        [0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f],
        [0xff, 0xff, 0xff, 0xff, 0x0f, 0x0f, 0x0f, 0x0f],
        [0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff],
        [0xf0, 0xf0, 0xf0, 0xf0, 0xff, 0xff, 0xff, 0xff],
        [0x0f, 0x0f, 0x0f, 0x0f, 0xff, 0xff, 0xff, 0xff],
        [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
        [0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00],
        [0x18, 0x18, 0x18, 0x18, 0x18, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0x1f, 0x1f, 0x00, 0x00, 0x00],
        [0x18, 0x18, 0x18, 0x1f, 0x0f, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0x18, 0x18, 0x18, 0x18, 0x18],
        [0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18],
        [0x00, 0x00, 0x00, 0x0f, 0x1f, 0x18, 0x18, 0x18],
        [0x18, 0x18, 0x18, 0x1f, 0x1f, 0x18, 0x18, 0x18],
        [0x00, 0x00, 0x00, 0xf8, 0xf8, 0x00, 0x00, 0x00],
        [0x18, 0x18, 0x18, 0xf8, 0xf0, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0x00],
        [0x18, 0x18, 0x18, 0xff, 0xff, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0xf0, 0xf8, 0x18, 0x18, 0x18],
        [0x18, 0x18, 0x18, 0xf8, 0xf8, 0x18, 0x18, 0x18],
        [0x00, 0x00, 0x00, 0xff, 0xff, 0x18, 0x18, 0x18],
        [0x18, 0x18, 0x18, 0xff, 0xff, 0x18, 0x18, 0x18],
        [0x10, 0x38, 0x6c, 0xc6, 0x00, 0x00, 0x00, 0x00],
        [0x0c, 0x18, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x3c, 0x66, 0x60, 0xf8, 0x60, 0x66, 0xfe, 0x00],
        [0x38, 0x44, 0xba, 0xa2, 0xba, 0x44, 0x38, 0x00],
        [0x7e, 0xf4, 0xf4, 0x74, 0x34, 0x34, 0x34, 0x00],
        [0x1e, 0x30, 0x38, 0x6c, 0x38, 0x18, 0xf0, 0x00],
        [0x18, 0x18, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x40, 0xc0, 0x44, 0x4c, 0x54, 0x1e, 0x04, 0x00],
        [0x40, 0xc0, 0x4c, 0x52, 0x44, 0x08, 0x1e, 0x00],
        [0xe0, 0x10, 0x62, 0x16, 0xea, 0x0f, 0x02, 0x00],
        [0x00, 0x18, 0x18, 0x7e, 0x18, 0x18, 0x7e, 0x00],
        [0x18, 0x18, 0x00, 0x7e, 0x00, 0x18, 0x18, 0x00],
        [0x00, 0x00, 0x00, 0x7e, 0x06, 0x06, 0x00, 0x00],
        [0x18, 0x00, 0x18, 0x30, 0x66, 0x66, 0x3c, 0x00],
        [0x18, 0x00, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00],
        [0x00, 0x00, 0x73, 0xde, 0xcc, 0xde, 0x73, 0x00],
        [0x7c, 0xc6, 0xc6, 0xfc, 0xc6, 0xc6, 0xf8, 0xc0],
        [0x00, 0x66, 0x66, 0x3c, 0x66, 0x66, 0x3c, 0x00],
        [0x3c, 0x60, 0x60, 0x3c, 0x66, 0x66, 0x3c, 0x00],
        [0x00, 0x00, 0x1e, 0x30, 0x7c, 0x30, 0x1e, 0x00],
        [0x38, 0x6c, 0xc6, 0xfe, 0xc6, 0x6c, 0x38, 0x00],
        [0x00, 0xc0, 0x60, 0x30, 0x38, 0x6c, 0xc6, 0x00],
        [0x00, 0x00, 0x66, 0x66, 0x66, 0x7c, 0x60, 0x60],
        [0x00, 0x00, 0x00, 0xfe, 0x6c, 0x6c, 0x6c, 0x00],
        [0x00, 0x00, 0x00, 0x7e, 0xd8, 0xd8, 0x70, 0x00],
        [0x03, 0x06, 0x0c, 0x3c, 0x66, 0x3c, 0x60, 0xc0],
        [0x03, 0x06, 0x0c, 0x66, 0x66, 0x3c, 0x60, 0xc0],
        [0x00, 0xe6, 0x3c, 0x18, 0x38, 0x6c, 0xc7, 0x00],
        [0x00, 0x00, 0x66, 0xc3, 0xdb, 0xdb, 0x7e, 0x00],
        [0xfe, 0xc6, 0x60, 0x30, 0x60, 0xc6, 0xfe, 0x00],
        [0x00, 0x7c, 0xc6, 0xc6, 0xc6, 0x6c, 0xee, 0x00],
        [0x18, 0x30, 0x60, 0xc0, 0x80, 0x00, 0x00, 0x00],
        [0x18, 0x0c, 0x06, 0x03, 0x01, 0x00, 0x00, 0x00],
        [0x00, 0x00, 0x00, 0x01, 0x03, 0x06, 0x0c, 0x18],
        [0x00, 0x00, 0x00, 0x80, 0xc0, 0x60, 0x30, 0x18],
        [0x18, 0x3c, 0x66, 0xc3, 0x81, 0x00, 0x00, 0x00],
        [0x18, 0x0c, 0x06, 0x03, 0x03, 0x06, 0x0c, 0x18],
        [0x00, 0x00, 0x00, 0x81, 0xc3, 0x66, 0x3c, 0x18],
        [0x18, 0x30, 0x60, 0xc0, 0xc0, 0x60, 0x30, 0x18],
        [0x18, 0x30, 0x60, 0xc1, 0x83, 0x06, 0x0c, 0x18],
        [0x18, 0x0c, 0x06, 0x83, 0xc1, 0x60, 0x30, 0x18],
        [0x18, 0x3c, 0x66, 0xc3, 0xc3, 0x66, 0x3c, 0x18],
        [0xc3, 0xe7, 0x7e, 0x3c, 0x3c, 0x7e, 0xe7, 0xc3],
        [0x03, 0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xc0],
        [0xc0, 0xe0, 0x70, 0x38, 0x1c, 0x0e, 0x07, 0x03],
        [0xcc, 0xcc, 0x33, 0x33, 0xcc, 0xcc, 0x33, 0x33],
        [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55],
        [0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        [0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03, 0x03],
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff],
        [0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0],
        [0xff, 0xfe, 0xfc, 0xf8, 0xf0, 0xe0, 0xc0, 0x80],
        [0xff, 0x7f, 0x3f, 0x1f, 0x0f, 0x07, 0x03, 0x01],
        [0x01, 0x03, 0x07, 0x0f, 0x1f, 0x3f, 0x7f, 0xff],
        [0x80, 0xc0, 0xe0, 0xf0, 0xf8, 0xfc, 0xfe, 0xff],
        [0xaa, 0x55, 0xaa, 0x55, 0x00, 0x00, 0x00, 0x00],
        [0x0a, 0x05, 0x0a, 0x05, 0x0a, 0x05, 0x0a, 0x05],
        [0x00, 0x00, 0x00, 0x00, 0xaa, 0x55, 0xaa, 0x55],
        [0xa0, 0x50, 0xa0, 0x50, 0xa0, 0x50, 0xa0, 0x50],
        [0xaa, 0x54, 0xa8, 0x50, 0xa0, 0x40, 0x80, 0x00],
        [0xaa, 0x55, 0x2a, 0x15, 0x0a, 0x05, 0x02, 0x01],
        [0x01, 0x02, 0x05, 0x0a, 0x15, 0x2a, 0x55, 0xaa],
        [0x00, 0x80, 0x40, 0xa0, 0x50, 0xa8, 0x54, 0xaa],
        [0x7e, 0xff, 0x99, 0xff, 0xbd, 0xc3, 0xff, 0x7e],
        [0x7e, 0xff, 0x99, 0xff, 0xc3, 0xbd, 0xff, 0x7e],
        [0x38, 0x38, 0xfe, 0xfe, 0xfe, 0x10, 0x38, 0x00],
        [0x10, 0x38, 0x7c, 0xfe, 0x7c, 0x38, 0x10, 0x00],
        [0x6c, 0xfe, 0xfe, 0xfe, 0x7c, 0x38, 0x10, 0x00],
        [0x10, 0x38, 0x7c, 0xfe, 0xfe, 0x10, 0x38, 0x00],
        [0x00, 0x3c, 0x66, 0xc3, 0xc3, 0x66, 0x3c, 0x00],
        [0x00, 0x3c, 0x7e, 0xff, 0xff, 0x7e, 0x3c, 0x00],
        [0x00, 0x7e, 0x66, 0x66, 0x66, 0x66, 0x7e, 0x00],
        [0x00, 0x7e, 0x7e, 0x7e, 0x7e, 0x7e, 0x7e, 0x00],
        [0x0f, 0x07, 0x0d, 0x78, 0xcc, 0xcc, 0xcc, 0x78],
        [0x3c, 0x66, 0x66, 0x66, 0x3c, 0x18, 0x7e, 0x18],
        [0x0c, 0x0c, 0x0c, 0x0c, 0x0c, 0x3c, 0x7c, 0x38],
        [0x18, 0x1c, 0x1e, 0x1b, 0x18, 0x78, 0xf8, 0x70],
        [0x99, 0x5a, 0x24, 0xc3, 0xc3, 0x24, 0x5a, 0x99],
        [0x10, 0x38, 0x38, 0x38, 0x38, 0x38, 0x7c, 0xd6],
        [0x18, 0x3c, 0x7e, 0xff, 0x18, 0x18, 0x18, 0x18],
        [0x18, 0x18, 0x18, 0x18, 0xff, 0x7e, 0x3c, 0x18],
        [0x10, 0x30, 0x70, 0xff, 0xff, 0x70, 0x30, 0x10],
        [0x08, 0x0c, 0x0e, 0xff, 0xff, 0x0e, 0x0c, 0x08],
        [0x00, 0x00, 0x18, 0x3c, 0x7e, 0xff, 0xff, 0x00],
        [0x00, 0x00, 0xff, 0xff, 0x7e, 0x3c, 0x18, 0x00],
        [0x80, 0xe0, 0xf8, 0xfe, 0xf8, 0xe0, 0x80, 0x00],
        [0x02, 0x0e, 0x3e, 0xfe, 0x3e, 0x0e, 0x02, 0x00],
        [0x38, 0x38, 0x92, 0x7c, 0x10, 0x28, 0x28, 0x28],
        [0x38, 0x38, 0x10, 0xfe, 0x10, 0x28, 0x44, 0x82],
        [0x38, 0x38, 0x12, 0x7c, 0x90, 0x28, 0x24, 0x22],
        [0x38, 0x38, 0x90, 0x7c, 0x12, 0x28, 0x48, 0x88],
        [0x00, 0x3c, 0x18, 0x3c, 0x3c, 0x3c, 0x18, 0x00],
        [0x3c, 0xff, 0xff, 0x18, 0x0c, 0x18, 0x30, 0x18],
        [0x18, 0x3c, 0x7e, 0x18, 0x18, 0x7e, 0x3c, 0x18],
        [0x00, 0x24, 0x66, 0xff, 0x66, 0x24, 0x00, 0x00] //  0xff
    ];
});
/* eslint-enable array-element-newline */
// Model.ts - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define("Model", ["require", "exports", "Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Model = void 0;
    var Model = /** @class */ (function () {
        function Model(config) {
            this.config = config || {}; // store only a reference
            this.initialConfig = Object.assign({}, this.config); // save initial config
            this.databases = {};
            this.examples = {}; // loaded examples per database
        }
        Model.prototype.getProperty = function (property) {
            return this.config[property];
        };
        Model.prototype.setProperty = function (property, value) {
            this.config[property] = value;
        };
        Model.prototype.getAllProperties = function () {
            return this.config;
        };
        Model.prototype.getAllInitialProperties = function () {
            return this.initialConfig;
        };
        Model.prototype.getChangedProperties = function () {
            var current = this.config, initial = this.initialConfig, changed = {};
            for (var name_2 in current) {
                if (current.hasOwnProperty(name_2)) {
                    if (current[name_2] !== initial[name_2]) {
                        changed[name_2] = current[name_2];
                    }
                }
            }
            return changed;
        };
        Model.prototype.addDatabases = function (db) {
            for (var par in db) {
                if (db.hasOwnProperty(par)) {
                    var entry = db[par];
                    this.databases[par] = entry;
                    this.examples[par] = {};
                }
            }
        };
        Model.prototype.getAllDatabases = function () {
            return this.databases;
        };
        Model.prototype.getDatabase = function () {
            var database = this.getProperty("database");
            return this.databases[database];
        };
        Model.prototype.getAllExamples = function () {
            var database = this.getProperty("database");
            return this.examples[database];
        };
        Model.prototype.getExample = function (key) {
            var database = this.getProperty("database");
            return this.examples[database][key];
        };
        Model.prototype.setExample = function (example) {
            var database = this.getProperty("database"), key = example.key;
            if (!this.examples[database][key]) {
                if (Utils_1.Utils.debug > 1) {
                    Utils_1.Utils.console.debug("setExample: creating new example:", key);
                }
            }
            this.examples[database][key] = example;
        };
        Model.prototype.removeExample = function (key) {
            var database = this.getProperty("database");
            if (!this.examples[database][key]) {
                Utils_1.Utils.console.warn("removeExample: example does not exist: " + key);
            }
            delete this.examples[database][key];
        };
        return Model;
    }());
    exports.Model = Model;
});
// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
define("BasicLexer", ["require", "exports", "Utils"], function (require, exports, Utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicLexer = void 0;
    var BasicLexer = /** @class */ (function () {
        function BasicLexer(options) {
            this.label = ""; // for error messages
            this.takeNumberAsLabel = true; // first number in a line is assumed to be a label (line number)
            this.input = ""; // input to analyze
            this.index = 0; // position in input
            this.tokens = [];
            this.whiteSpace = ""; // collected whitespace
            this.options = {
                keywords: options.keywords,
                keepWhiteSpace: false,
                quiet: false
            };
            this.setOptions(options);
        }
        BasicLexer.prototype.setOptions = function (options) {
            if (options.keepWhiteSpace !== undefined) {
                this.options.keepWhiteSpace = options.keepWhiteSpace;
            }
        };
        BasicLexer.prototype.getOptions = function () {
            return this.options;
        };
        BasicLexer.prototype.composeError = function (error, message, value, pos, len) {
            return Utils_2.Utils.composeError("BasicLexer", error, message, value, pos, len, this.label || undefined);
        };
        BasicLexer.isOperatorOrStreamOrAddress = function (c) {
            return (/[+\-*/^=()[\],;:?\\@#]/).test(c);
        };
        BasicLexer.isComparison = function (c) {
            return (/[<>]/).test(c);
        };
        BasicLexer.isComparison2 = function (c) {
            return (/[<>=]/).test(c);
        };
        BasicLexer.isDigit = function (c) {
            return (/\d/).test(c);
        };
        BasicLexer.isSign = function (c) {
            return (/[+-]/).test(c);
        };
        BasicLexer.isBin = function (c) {
            return (/[01]/).test(c);
        };
        BasicLexer.isHex = function (c) {
            return (/[0-9A-Fa-f]/).test(c);
        };
        BasicLexer.isWhiteSpace = function (c) {
            return (/[ \r]/).test(c);
        };
        BasicLexer.isNotQuotes = function (c) {
            return c !== "" && c !== '"' && c !== "\n"; // quoted string must be in one line!
        };
        BasicLexer.isIdentifierStart = function (c) {
            return c !== "" && (/[A-Za-z]/).test(c); // cannot use complete [A-Za-z]+[\w]*[$%!]?
        };
        BasicLexer.isIdentifierMiddle = function (c) {
            return c !== "" && (/[A-Za-z0-9.]/).test(c);
        };
        BasicLexer.isIdentifierEnd = function (c) {
            return c !== "" && (/[$%!]/).test(c);
        };
        BasicLexer.isNotNewLine = function (c) {
            return c !== "" && c !== "\n";
        };
        BasicLexer.isUnquotedData = function (c) {
            return c !== "" && (/[^:,\r\n]/).test(c);
        };
        BasicLexer.prototype.testChar = function (add) {
            return this.input.charAt(this.index + add);
        };
        BasicLexer.prototype.getChar = function () {
            return this.input.charAt(this.index);
        };
        BasicLexer.prototype.advance = function () {
            this.index += 1;
            return this.getChar();
        };
        BasicLexer.prototype.advanceWhile = function (char, fn) {
            var token = "";
            do {
                token += char;
                char = this.advance();
            } while (fn(char));
            return token;
        };
        BasicLexer.prototype.debugCheckValue = function (type, value, pos, orig) {
            var origValue = orig || value, part = this.input.substring(pos, pos + origValue.length);
            if (part !== origValue) {
                Utils_2.Utils.console.debug("BasicLexer:debugCheckValue:", type, part, "<>", origValue, "at pos", pos);
            }
        };
        BasicLexer.prototype.addToken = function (type, value, pos, orig) {
            var node = {
                type: type,
                value: value,
                pos: pos
            };
            if (orig !== undefined) {
                if (orig !== value) {
                    node.orig = orig;
                }
            }
            if (this.whiteSpace !== "") {
                node.ws = this.whiteSpace;
                this.whiteSpace = "";
            }
            if (Utils_2.Utils.debug > 1) {
                this.debugCheckValue(type, value, pos, node.orig); // check position of added value
            }
            this.tokens.push(node);
        };
        BasicLexer.prototype.fnParseExponentialNumber = function (char) {
            // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
            var token = "", index = 1;
            while (BasicLexer.isWhiteSpace(this.testChar(index))) { // whitespace between e and rest?
                index += 1;
            }
            var char1 = this.testChar(index), char2 = this.testChar(index + 1);
            if (BasicLexer.isDigit(char1) || (BasicLexer.isSign(char1) && BasicLexer.isDigit(char2))) { // so it is a number
                token += char; // take "E"
                char = this.advance();
                while (BasicLexer.isWhiteSpace(char)) {
                    token += char;
                    char = this.advance();
                }
                if (BasicLexer.isSign(char)) {
                    token += char; // take sign "+" or "-"
                    char = this.advance();
                }
                if (BasicLexer.isDigit(char)) {
                    token += this.advanceWhile(char, BasicLexer.isDigit);
                }
            }
            return token;
        };
        BasicLexer.prototype.fnParseNumber = function (char, startPos, startsWithDot) {
            var token = "";
            if (startsWithDot) {
                token = char;
                char = this.advance();
            }
            token += this.advanceWhile(char, BasicLexer.isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
            char = this.getChar();
            if (char === "." && !startsWithDot) {
                token += char;
                char = this.advance();
                if (BasicLexer.isDigit(char)) { // digits after dot?
                    token += this.advanceWhile(char, BasicLexer.isDigit);
                    char = this.getChar();
                }
            }
            var expNumberPart = "";
            if (char === "e" || char === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
                expNumberPart = this.fnParseExponentialNumber(char);
                token += expNumberPart;
                if (expNumberPart[1] === " " && !this.options.quiet) {
                    Utils_2.Utils.console.warn(this.composeError({}, "Whitespace in exponential number", token, startPos).message);
                    // do we really want to allow this?
                }
            }
            var orig = token;
            token = token.replace(/ /g, ""); // remove spaces
            if (!isFinite(Number(token))) { // Infnity?
                throw this.composeError(Error(), "Number is too large or too small", token, startPos); // for a 64-bit double
            }
            var number = expNumberPart ? token : parseFloat(token);
            this.addToken(expNumberPart ? "expnumber" : "number", String(number), startPos, orig); // store number as string
            if (this.takeNumberAsLabel) {
                this.takeNumberAsLabel = false;
                this.label = String(number); // save just for error message
            }
        };
        BasicLexer.prototype.fnParseCompleteLineForRemOrApostrophe = function (char, startPos) {
            if (BasicLexer.isNotNewLine(char)) {
                var token = this.advanceWhile(char, BasicLexer.isNotNewLine);
                char = this.getChar();
                this.addToken("unquoted", token, startPos);
            }
            return char;
        };
        BasicLexer.prototype.fnParseWhiteSpace = function (char) {
            var token = this.advanceWhile(char, BasicLexer.isWhiteSpace);
            if (this.options.keepWhiteSpace) {
                this.whiteSpace = token;
            }
        };
        BasicLexer.prototype.fnParseUnquoted = function (char, pos) {
            var reSpacesAtEnd = new RegExp(/\s+$/);
            var token = this.advanceWhile(char, BasicLexer.isUnquotedData);
            var match = reSpacesAtEnd.exec(token), endingSpaces = (match && match[0]) || "";
            token = token.trim(); // remove whitespace before and after; do we need this?
            this.addToken("unquoted", token, pos); // could be interpreted as string or number during runtime
            if (this.options.keepWhiteSpace) {
                this.whiteSpace = endingSpaces;
            }
        };
        BasicLexer.prototype.fnParseCompleteLineForData = function (char) {
            var pos;
            while (BasicLexer.isNotNewLine(char)) {
                if (BasicLexer.isWhiteSpace(char)) {
                    this.fnParseWhiteSpace(char);
                    char = this.getChar();
                }
                if (char === "\n") { // now newline?
                    break;
                }
                pos = this.index;
                if (char === '"') {
                    this.fnParseString(pos);
                    char = this.getChar();
                }
                else if (char === ",") { // empty argument?
                    // parser can insert dummy token
                }
                else {
                    this.fnParseUnquoted(char, pos);
                    char = this.getChar();
                }
                if (BasicLexer.isWhiteSpace(char)) {
                    this.fnParseWhiteSpace(char);
                    char = this.getChar();
                }
                if (char !== ",") {
                    break;
                }
                pos = this.index;
                this.addToken(char, char, pos); // ","
                char = this.advance();
                if (char === "\r") { // IE8 has "/r/n" newlines
                    char = this.advance();
                }
            }
        };
        BasicLexer.prototype.fnParseIdentifier = function (char, startPos) {
            var token = char;
            char = this.advance();
            var lcToken = (token + char).toLowerCase(); // combine first 2 letters
            if (lcToken === "fn" && this.options.keywords[lcToken]) {
                this.addToken(lcToken, token + char, startPos); // create "fn" token
                this.advance();
                return;
            }
            if (BasicLexer.isIdentifierMiddle(char)) {
                token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
                char = this.getChar();
            }
            if (BasicLexer.isIdentifierEnd(char)) {
                token += char;
                char = this.advance();
            }
            lcToken = token.toLowerCase();
            if (this.options.keywords[lcToken]) {
                this.addToken(lcToken, token, startPos);
                if (lcToken === "rem") { // special handling for line comment
                    startPos += lcToken.length;
                    this.fnParseCompleteLineForRemOrApostrophe(char, startPos);
                }
                else if (lcToken === "data") { // special handling because strings in data lines need not to be quoted
                    this.fnParseCompleteLineForData(char);
                }
            }
            else {
                this.addToken("identifier", token, startPos);
            }
        };
        BasicLexer.prototype.fnParseHexOrBin = function (char, startPos) {
            var token = char;
            char = this.advance();
            if (char.toLowerCase() === "x") { // binary?
                token += char;
                char = this.advance();
                if (BasicLexer.isBin(char)) {
                    token += this.advanceWhile(char, BasicLexer.isBin);
                    this.addToken("binnumber", token, startPos);
                }
                else {
                    throw this.composeError(Error(), "Expected binary number", token, startPos);
                }
            }
            else { // hex
                if (char.toLowerCase() === "h") { // optional h
                    token += char;
                    char = this.advance();
                }
                if (BasicLexer.isHex(char)) {
                    token += this.advanceWhile(char, BasicLexer.isHex);
                    this.addToken("hexnumber", token, startPos);
                }
                else {
                    throw this.composeError(Error(), "Expected hex number", token, startPos);
                }
            }
        };
        BasicLexer.prototype.fnTryContinueString = function (char) {
            var out = "";
            while (char === "\n") {
                var char1 = this.testChar(1);
                if (char1 !== "" && (char1 < "0" || char1 > "9")) { // heuristic: next char not a digit => continue with the (multiline) string
                    out += this.advanceWhile(char, BasicLexer.isNotQuotes);
                    char = this.getChar();
                }
                else {
                    break;
                }
            }
            return out;
        };
        BasicLexer.prototype.fnParseString = function (startPos) {
            var char = "", token = this.advanceWhile(char, BasicLexer.isNotQuotes), type = "string";
            char = this.getChar();
            if (char !== '"') {
                var contString = this.fnTryContinueString(char); // heuristic to detect an LF in the string
                if (contString) {
                    if (Utils_2.Utils.debug) {
                        Utils_2.Utils.console.debug(this.composeError({}, "Continued string", token, startPos + 1).message);
                    }
                    token += contString;
                    char = this.getChar();
                }
            }
            if (char === '"') { // not for newline
                this.advance();
            }
            else {
                if (Utils_2.Utils.debug) {
                    Utils_2.Utils.console.debug(this.composeError({}, "Unterminated string", token, startPos + 1).message);
                }
                type = "ustring"; // unterminated string
            }
            this.addToken(type, token, startPos + 1);
        };
        BasicLexer.prototype.fnParseRsx = function (char, startPos) {
            var token = char;
            char = this.advance();
            if (BasicLexer.isIdentifierMiddle(char)) {
                token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
            }
            this.addToken("|", token, startPos);
        };
        BasicLexer.prototype.processNextCharacter = function (startPos) {
            var char = this.getChar(), token;
            if (BasicLexer.isWhiteSpace(char)) {
                this.fnParseWhiteSpace(char);
            }
            else if (char === "\n") {
                this.addToken("(eol)", char, startPos);
                this.advance();
                this.takeNumberAsLabel = true;
            }
            else if (char === "'") { // apostrophe (comment)
                this.addToken(char, char, startPos);
                char = this.advance();
                this.fnParseCompleteLineForRemOrApostrophe(char, startPos + 1);
            }
            else if (BasicLexer.isOperatorOrStreamOrAddress(char)) {
                this.addToken(char, char, startPos);
                this.advance();
            }
            else if (BasicLexer.isDigit(char)) { // number starting with a digit?
                this.fnParseNumber(char, startPos, false);
            }
            else if (char === ".") { // number starting with a dot?
                this.fnParseNumber(char, startPos, true);
            }
            else if (char === "&") { // isHexOrBin: bin: &X, hex: & or &H
                this.fnParseHexOrBin(char, startPos);
            }
            else if (char === '"') {
                this.fnParseString(startPos);
            }
            else if (BasicLexer.isIdentifierStart(char)) {
                this.fnParseIdentifier(char, startPos);
            }
            else if (char === "|") { // isRsx
                this.fnParseRsx(char, startPos);
            }
            else if (BasicLexer.isComparison(char)) {
                token = this.advanceWhile(char, BasicLexer.isComparison2);
                this.addToken(token, token, startPos); // like operator
            }
            else {
                throw this.composeError(Error(), "Unrecognized token", char, startPos);
            }
        };
        BasicLexer.prototype.lex = function (input) {
            var startPos;
            this.input = input;
            this.index = 0;
            this.label = ""; // for error messages
            this.takeNumberAsLabel = true;
            this.whiteSpace = "";
            this.tokens.length = 0;
            while (this.index < input.length) {
                startPos = this.index;
                this.processNextCharacter(startPos);
            }
            this.addToken("(end)", "", this.index);
            return this.tokens;
        };
        return BasicLexer;
    }());
    exports.BasicLexer = BasicLexer;
});
// BasicParser.ts - BASIC Parser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC parser for Locomotive BASIC 1.1 for Amstrad CPC 6128
//
define("BasicParser", ["require", "exports", "Utils"], function (require, exports, Utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicParser = void 0;
    var BasicParser = /** @class */ (function () {
        function BasicParser(options) {
            this.label = "0"; // for error messages
            this.symbols = {};
            // set also during parse
            this.tokens = [];
            this.index = 0;
            this.parseTree = [];
            this.statementList = []; // just to check last statement when generating error message
            /* eslint-disable no-invalid-this */
            this.specialStatements = {
                "|": this.rsx,
                after: this.afterEveryGosub,
                chain: this.chain,
                clear: this.clear,
                data: this.data,
                def: this.def,
                "else": this.fnElse,
                ent: this.entOrEnv,
                env: this.entOrEnv,
                every: this.afterEveryGosub,
                "for": this.fnFor,
                graphics: this.graphics,
                "if": this.fnIf,
                input: this.input,
                key: this.key,
                let: this.let,
                line: this.line,
                mid$: this.mid$Assign,
                on: this.on,
                print: this.print,
                "?": this.question,
                resume: this.resume,
                run: this.run,
                speed: this.speed,
                symbol: this.symbol,
                window: this.window,
                write: this.write
            };
            this.options = {
                quiet: false,
                keepBrackets: false,
                keepColons: false,
                keepDataComma: false,
                keepTokens: false
            };
            if (options) {
                this.setOptions(options);
            }
            this.fnGenerateSymbols();
            this.previousToken = {}; // to avoid warnings
            this.token = this.previousToken;
        }
        BasicParser.prototype.setOptions = function (options) {
            if (options.keepBrackets !== undefined) {
                this.options.keepBrackets = options.keepBrackets;
            }
            if (options.keepColons !== undefined) {
                this.options.keepColons = options.keepColons;
            }
            if (options.keepDataComma !== undefined) {
                this.options.keepDataComma = options.keepDataComma;
            }
            if (options.keepTokens !== undefined) {
                this.options.keepTokens = options.keepTokens;
            }
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
        };
        BasicParser.prototype.getOptions = function () {
            return this.options;
        };
        BasicParser.prototype.composeError = function (error, message, value, pos, len) {
            len = value === "(end)" ? 0 : len;
            return Utils_3.Utils.composeError("BasicParser", error, message, value, pos, len, this.label || undefined);
        };
        BasicParser.prototype.fnLastStatementIsOnErrorGotoX = function () {
            var statements = this.statementList;
            var isOnErrorGoto = false;
            for (var i = statements.length - 1; i >= 0; i -= 1) {
                var lastStatement = statements[i];
                if (lastStatement.type !== ":") { // ignore colons (separator when keepTokens=true)
                    if (lastStatement.type === "onErrorGoto" && lastStatement.args && Number(lastStatement.args[0].value) > 0) {
                        isOnErrorGoto = true;
                    }
                    break;
                }
            }
            return isOnErrorGoto;
        };
        BasicParser.prototype.fnMaskedError = function (node, message) {
            if (!this.fnLastStatementIsOnErrorGotoX()) {
                throw this.composeError(Error(), message, node.value, node.pos);
            }
            else if (!this.options.quiet) {
                Utils_3.Utils.console.warn(this.composeError({}, message, node.value, node.pos).message);
            }
        };
        // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
        // http://crockford.com/javascript/tdop/parse.js
        // Operator precedence parsing
        //
        // Operator: With left binding power (lbp) and operational function.
        // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
        // identifiers, numbers: also nud.
        BasicParser.prototype.advance = function (id) {
            var token = this.token;
            this.previousToken = this.token;
            if (id && id !== token.type) {
                if (!this.fnLastStatementIsOnErrorGotoX()) {
                    throw this.composeError(Error(), "Expected " + id, token.value === "" ? token.type : token.value, token.pos); //TTT we cannot mask this error because advance is very generic
                }
                else if (!this.options.quiet) {
                    Utils_3.Utils.console.warn(this.composeError({}, "Expected " + id, token.value === "" ? token.type : token.value, token.pos).message);
                }
            }
            token = this.tokens[this.index]; // we get a lex token and reuse it as parseTree token
            if (!token) { // should not occur
                Utils_3.Utils.console.error(this.composeError({}, "advance: End of file", "", this.token && this.token.pos).message);
                return this.token; // old token
            }
            this.index += 1;
            var sym = this.symbols[token.type];
            if (!sym) {
                throw this.composeError(Error(), "Unknown token", token.type, token.pos);
            }
            this.token = token;
            return token;
        };
        BasicParser.prototype.expression = function (rbp) {
            var t = this.token, s = this.symbols[t.type];
            if (Utils_3.Utils.debug > 3) {
                Utils_3.Utils.console.debug("parse: expression rbp=" + rbp + " type=" + t.type + " t=%o", t);
            }
            if (t.type === "(end)") {
                throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
            }
            this.advance();
            if (!s.nud) {
                throw this.composeError(Error(), "Unexpected token", t.value, t.pos);
            }
            var left = s.nud(t); // process literals, variables, and prefix operators
            t = this.token;
            s = this.symbols[t.type];
            while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
                this.advance();
                if (!s.led) {
                    throw this.composeError(Error(), "Unexpected token", t.type, t.pos);
                    // TODO: How to get this error?
                }
                left = s.led(left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
                t = this.token;
                s = this.symbols[t.type];
            }
            return left;
        };
        BasicParser.prototype.fnCheckExpressionType = function (expression, expectedType, typeFirstChar) {
            if (expression.type !== expectedType) {
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
        };
        BasicParser.prototype.assignment = function () {
            this.fnCheckExpressionType(this.token, "identifier", "v");
            var left = this.expression(90), // take it (can also be an array) and stop
            value = this.token;
            this.advance("="); // equal as assignment
            value.left = left;
            value.right = this.expression(0);
            value.type = "assign"; // replace "="
            return value;
        };
        BasicParser.prototype.statement = function () {
            var t = this.token, s = this.symbols[t.type];
            if (s.std) { // statement?
                this.advance();
                return s.std(this.previousToken);
            }
            var value;
            if (t.type === "identifier") {
                value = this.assignment();
            }
            else {
                value = this.expression(0);
            }
            if (value.type !== "assign" && value.type !== "fcall" && value.type !== "def" && value.type !== "(" && value.type !== "[") {
                this.fnMaskedError(t, "Bad expression statement");
            }
            return value;
        };
        BasicParser.prototype.statements = function (statementList, closeTokens) {
            this.statementList = statementList; // fast hack to access last statement for error messages
            var colonExpected = false;
            while (!closeTokens[this.token.type]) {
                if (colonExpected || this.token.type === ":") {
                    if (this.token.type !== "'" && this.token.type !== "else") { // no colon required for line comment or ELSE
                        this.advance(":");
                        if (this.options.keepColons) {
                            statementList.push(this.previousToken);
                        }
                        else if (this.previousToken.ws) { // colon token has ws?
                            this.token.ws = this.previousToken.ws + (this.token.ws || ""); // add ws to next token
                        }
                    }
                    colonExpected = false;
                }
                else {
                    statementList.push(this.statement());
                    colonExpected = true;
                }
            }
            return statementList;
        };
        BasicParser.fnCreateDummyArg = function (type, value) {
            return {
                type: type,
                value: value || "",
                pos: 0,
                len: 0
            };
        };
        BasicParser.prototype.basicLine = function () {
            var node;
            if (this.token.type !== "number") {
                node = BasicParser.fnCreateDummyArg("label", "");
                node.pos = this.token.pos;
            }
            else {
                this.advance();
                node = this.previousToken; // number token
                node.type = "label"; // number => label
            }
            this.label = node.value; // set line number for error messages
            node.args = this.statements([], BasicParser.closeTokensForLine);
            if (this.token.type === "(eol)") {
                if (this.options.keepTokens) { // not really a token
                    node.args.push(this.token); // eol token with whitespace
                }
                this.advance();
            }
            else if (this.token.type === "(end)" && this.token.ws && this.options.keepTokens) {
                node.args.push(this.token); // end token with whitespace
            }
            return node;
        };
        BasicParser.prototype.fnCombineTwoTokensNoArgs = function (node, token2) {
            var name = node.type + Utils_3.Utils.stringCapitalize(this.token.type); // e.g ."speedInk"
            node.value += (this.token.ws || " ") + this.token.value; // combine values of both
            this.token = this.advance(token2); // for "speed" e.g. "ink", "key", "write" (this.token.type)
            if (this.options.keepTokens) {
                if (!node.right) {
                    node.right = this.previousToken; // set second token in first token
                }
                else { // e.g. on break...
                    node.right.right = this.previousToken;
                }
            }
            this.previousToken = node; // fast hack to get e.g. "speed" token
            return name;
        };
        BasicParser.prototype.fnCombineTwoTokens = function (node, token2) {
            return this.fnCreateCmdCallForType(node, this.fnCombineTwoTokensNoArgs(node, token2));
        };
        BasicParser.prototype.fnGetOptionalStream = function () {
            var node;
            if (this.token.type === "#") { // stream?
                node = this.expression(0);
            }
            else { // create dummy
                node = BasicParser.fnCreateDummyArg("#"); // dummy stream
                node.right = BasicParser.fnCreateDummyArg("null", "0"); // ...with dummy parameter
            }
            return node;
        };
        BasicParser.prototype.fnChangeNumber2LineNumber = function (node) {
            this.fnCheckExpressionType(node, "number", "l");
            node.type = "linenumber"; // change type: number => linenumber
        };
        BasicParser.prototype.fnGetLineRange = function () {
            var left;
            if (this.token.type === "number") {
                left = this.token;
                this.advance();
                this.fnChangeNumber2LineNumber(left);
            }
            var range;
            if (this.token.type === "-") {
                range = this.token;
                this.advance();
            }
            if (range) {
                var right = void 0;
                if (this.token.type === "number") {
                    right = this.token;
                    this.advance();
                    this.fnChangeNumber2LineNumber(right);
                }
                // accept also "-" as full range
                range.type = "linerange"; // change "-" => "linerange"
                range.left = left || BasicParser.fnCreateDummyArg("null"); // insert dummy for left
                range.right = right || BasicParser.fnCreateDummyArg("null"); // insert dummy for right (do not skip it)
            }
            else if (left) {
                range = left; // single line number
            }
            else {
                throw this.composeError(Error(), "Programming error: Undefined range", this.token.value, this.token.pos);
            }
            return range;
        };
        BasicParser.fnIsSingleLetterIdentifier = function (node) {
            return node.type === "identifier" && !node.args && node.value.length === 1;
        };
        BasicParser.prototype.fnGetLetterRange = function (typeFirstChar) {
            this.fnCheckExpressionType(this.token, "identifier", typeFirstChar);
            var expression = this.expression(0); // n or n-n
            if (BasicParser.fnIsSingleLetterIdentifier(expression)) { // ok
                expression.type = "letter"; // change type: identifier -> letter
            }
            else if (expression.type === "-" && expression.left && expression.right && BasicParser.fnIsSingleLetterIdentifier(expression.left) && BasicParser.fnIsSingleLetterIdentifier(expression.right)) { // also ok
                expression.type = "range"; // change type: "-" => range
                expression.left.type = "letter"; // change type: identifier -> letter
                expression.right.type = "letter"; // change type: identifier -> letter
            }
            else {
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
            return expression;
        };
        BasicParser.prototype.fnCheckRemainingTypes = function (types) {
            for (var i = 0; i < types.length; i += 1) { // some more parameters expected?
                var type = types[i];
                if (!type.endsWith("?") && !type.endsWith("*")) { // mandatory?
                    var text = BasicParser.parameterTypes[type] || ("parameter " + type);
                    this.fnMaskedError(this.token, "Expected " + text + " for " + this.previousToken.type);
                }
            }
        };
        BasicParser.prototype.fnCheckStaticTypeNotNumber = function (expression, typeFirstChar) {
            var type = expression.type, isStringFunction = (BasicParser.keywords[type] || "").startsWith("f") && type.endsWith("$"), isStringIdentifier = type === "identifier" && expression.value.endsWith("$");
            if (type === "string" || type === "ustring" || type === "#" || isStringFunction || isStringIdentifier) { // got a string or a stream? (statical check)
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
        };
        BasicParser.prototype.fnCheckStaticTypeNotString = function (expression, typeFirstChar) {
            var type = expression.type, isNumericFunction = (BasicParser.keywords[type] || "").startsWith("f") && !type.endsWith("$"), isNumericIdentifier = type === "identifier" && (expression.value.endsWith("%") || expression.value.endsWith("!")), isComparison = type === "=" || type.startsWith("<") || type.startsWith(">"); // =, <, >, <=, >=
            if (type === "number" || type === "binnumber" || type === "hexnumber" || type === "expnumber" || type === "#" || isNumericFunction || isNumericIdentifier || isComparison) { // got e.g. number or a stream? (statical check)
                this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
            }
        };
        BasicParser.prototype.fnGetExpressionForType = function (args, type, types) {
            var typeFirstChar = type.charAt(0), separator = ",";
            var expression, suppressAdvance = false;
            switch (typeFirstChar) {
                case "#": // stream expected? (for functions)
                    if (type === "#0?") { // optional stream?
                        if (this.token.type !== "#") { // no stream?
                            suppressAdvance = true;
                            type = ",";
                        }
                        expression = this.fnGetOptionalStream();
                    }
                    else {
                        expression = this.expression(0);
                        this.fnCheckExpressionType(expression, "#", typeFirstChar); // check that it is a stream and not a number
                    }
                    break;
                case "l":
                    expression = this.expression(0);
                    this.fnCheckExpressionType(expression, "number", typeFirstChar);
                    this.fnChangeNumber2LineNumber(expression);
                    break;
                case "v": // variable (identifier)
                    expression = this.expression(0);
                    this.fnCheckExpressionType(expression, "identifier", typeFirstChar);
                    break;
                case "r": // letter or range of letters (defint, defreal, defstr)
                    expression = this.fnGetLetterRange(typeFirstChar);
                    break;
                case "q": // line number range
                    if (type !== "q0?") { // optional line number range
                        throw this.composeError(Error(), "Programming error: Unexpected line range type", this.token.type, this.token.pos); // should not occur
                    }
                    if (this.token.type === "number" || this.token.type === "-") {
                        expression = this.fnGetLineRange();
                    }
                    else {
                        expression = BasicParser.fnCreateDummyArg("null");
                        if (types.length) {
                            type = ","; // needMore=true, maybe take it as next parameter
                        }
                    }
                    break;
                case "n": // number"
                    if (type.substring(0, 2) === "n0" && this.token.type === separator) { // n0 or n0?: if parameter not specified, insert default value null?
                        expression = BasicParser.fnCreateDummyArg("null");
                    }
                    else {
                        expression = this.expression(0);
                        this.fnCheckStaticTypeNotNumber(expression, typeFirstChar);
                    }
                    break;
                case "s": // string
                    expression = this.expression(0);
                    this.fnCheckStaticTypeNotString(expression, typeFirstChar);
                    break;
                default:
                    expression = this.expression(0);
                    if (expression.type === "#") { // got stream?
                        this.fnMaskedError(expression, "Unexpected stream");
                    }
                    break;
            }
            args.push(expression);
            if (this.token.type === separator) {
                if (!suppressAdvance) {
                    this.advance(separator);
                    if (this.options.keepTokens) {
                        args.push(this.previousToken);
                    }
                }
                if (type.slice(-1) !== "*") {
                    type = "xxx"; // initial needMore
                }
            }
            else if (type !== ",") { // !needMore
                type = ""; // stop
            }
            return type;
        };
        BasicParser.prototype.fnGetArgs = function (args, keyword) {
            var keyOpts = BasicParser.keywords[keyword], types = keyOpts.split(" "), closeTokens = BasicParser.closeTokensForArgs;
            var type = "xxx"; // initial needMore
            types.shift(); // remove keyword type
            while (type && !closeTokens[this.token.type]) {
                if (types && type.slice(-1) !== "*") { // "*"= any number of parameters
                    type = types.shift() || "";
                    if (!type) {
                        this.fnMaskedError(this.previousToken, "Expected end of arguments"); // If masked, it will accept more args than expected
                    }
                }
                type = this.fnGetExpressionForType(args, type, types);
            }
            if (types.length) { // some more parameters expected?
                this.fnCheckRemainingTypes(types); // error if remaining mandatory args
                type = types[0];
                if (type === "#0?") { // null stream to add?
                    var expression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg
                    expression.right = BasicParser.fnCreateDummyArg("null", "0");
                    args.push(expression);
                }
            }
            if (this.previousToken.type === "," && keyword !== "delete" && keyword !== "list") { // for line number range in delete, list it is ok
                this.fnMaskedError(this.previousToken, "Operand missing");
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsSepByCommaSemi = function (args) {
            var closeTokens = BasicParser.closeTokensForArgs;
            while (!closeTokens[this.token.type]) {
                args.push(this.expression(0));
                if (this.token.type === "," || this.token.type === ";") {
                    args.push(this.token); // keep comma or semicolon
                    this.advance();
                }
                else {
                    break;
                }
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsInParenthesis = function (args, keyword) {
            this.advance("(");
            if (this.options.keepTokens) {
                args.push(this.previousToken);
            }
            this.fnGetArgs(args, keyword || "_any1"); // until ")"
            this.advance(")");
            if (this.options.keepTokens) {
                args.push(this.previousToken);
            }
            return args;
        };
        BasicParser.prototype.fnGetArgsInParenthesesOrBrackets = function (args) {
            var brackets = BasicParser.brackets;
            this.advance(this.token.type === "[" ? "[" : "(");
            var bracketOpen = this.previousToken;
            args.push(bracketOpen);
            this.fnGetArgs(args, "_any1"); // until "]" or ")"
            this.advance(this.token.type === "]" ? "]" : ")");
            var bracketClose = this.previousToken;
            args.push(bracketClose);
            if (!this.options.quiet && (brackets[bracketOpen.type] !== bracketClose.type)) {
                Utils_3.Utils.console.warn(this.composeError({}, "Inconsistent bracket style", this.previousToken.value, this.previousToken.pos).message);
            }
            return args;
        };
        BasicParser.prototype.fnCreateCmdCall = function (node) {
            node.args = this.fnGetArgs([], node.type);
            return node;
        };
        BasicParser.prototype.fnCreateCmdCallForType = function (node, type) {
            if (type) {
                node.type = type; // override
            }
            return this.fnCreateCmdCall(node);
        };
        BasicParser.prototype.fnCreateFuncCall = function (node) {
            node.args = [];
            if (this.token.type === "(") { // args in parenthesis?
                this.advance("(");
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
                this.fnGetArgs(node.args, node.type);
                this.advance(")");
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
            }
            else { // no parenthesis?
                // if we have a check, make sure there are no non-optional parameters left
                var keyOpts = BasicParser.keywords[node.type];
                if (keyOpts) {
                    var types = keyOpts.split(" ");
                    types.shift(); // remove key
                    this.fnCheckRemainingTypes(types);
                }
            }
            return node;
        };
        // ...
        BasicParser.prototype.fnIdentifier = function (node) {
            if (this.token.type === "(" || this.token.type === "[") {
                node.args = [];
                this.fnGetArgsInParenthesesOrBrackets(node.args);
            }
            return node;
        };
        BasicParser.prototype.fnParenthesis = function (node) {
            if (this.options.keepBrackets) {
                node.args = [this.expression(0)];
            }
            else {
                if (node.ws) { // bracket open has ws?
                    this.token.ws = node.ws + (this.token.ws || ""); // add ws to next token
                }
                node = this.expression(0);
            }
            this.advance(")");
            if (this.options.keepBrackets) {
                node.args.push(this.previousToken);
            }
            else if (this.previousToken.ws) { // bracket close token has ws?
                this.token.ws = this.previousToken.ws + (this.token.ws || ""); // add ws to next token
            }
            return node;
        };
        BasicParser.prototype.fnFn = function (node) {
            node.args = [];
            this.token = this.advance("identifier");
            node.right = this.previousToken;
            if (this.token.type === "(") { // optional args?
                this.fnGetArgsInParenthesis(node.args);
            }
            return node;
        };
        BasicParser.prototype.rsx = function (node) {
            node.args = [];
            var type = "_any1"; // expect any number of arguments
            if (this.token.type === ",") { // arguments starting with comma
                this.advance();
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
                type = "_rsx1"; // dummy token: expect at least 1 argument
            }
            this.fnGetArgs(node.args, type); // get arguments
            return node;
        };
        BasicParser.prototype.afterEveryGosub = function (node) {
            var combinedNode = this.fnCreateCmdCallForType(node, node.type + "Gosub"); // "afterGosub" or "everyGosub", interval and optional timer
            if (!combinedNode.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
            }
            if (combinedNode.args.length < 2) { // add default timer 0
                combinedNode.args.push(BasicParser.fnCreateDummyArg("null"));
            }
            this.advance("gosub");
            if (this.options.keepTokens) {
                combinedNode.args.push(this.previousToken);
            }
            this.fnGetArgs(combinedNode.args, "gosub"); // line number
            return combinedNode;
        };
        BasicParser.prototype.chain = function (node) {
            if (this.token.type === "merge") { // chain merge?
                var name_3 = this.fnCombineTwoTokensNoArgs(node, this.token.type); // chainMerge
                node.type = name_3;
            }
            node.args = [];
            // chain, chain merge with optional DELETE
            var node2 = this.expression(0); // filename
            node.args.push(node2);
            if (this.token.type === ",") {
                this.token = this.advance();
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
                var numberExpression = false; // line number (expression) found
                if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(eof)") {
                    node2 = this.expression(0); // line number or expression
                    node.args.push(node2);
                    numberExpression = true;
                }
                if (this.token.type === ",") {
                    this.advance();
                    if (this.options.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    if (!numberExpression) {
                        node2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
                        node.args.push(node2);
                    }
                    this.advance("delete");
                    if (this.options.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    this.fnGetArgs(node.args, this.previousToken.type); // args for "delete"
                }
            }
            return node;
        };
        BasicParser.prototype.clear = function (node) {
            var tokenType = this.token.type;
            return tokenType === "input" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "clear input" or "clear"
        };
        BasicParser.prototype.data = function (node) {
            var parameterFound = false;
            node.args = [];
            // data is special: it can have empty parameters, also the last parameter, and also if no parameters
            if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
                node.args.push(this.expression(0)); // take first argument
                parameterFound = true;
            }
            while (this.token.type === ",") {
                if (!parameterFound) {
                    node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
                }
                this.token = this.advance();
                if (this.options.keepDataComma) {
                    node.args.push(this.previousToken); // ","
                }
                parameterFound = false;
                if (this.token.type === "(eol)" || this.token.type === "(end)") {
                    break;
                }
                else if (this.token.type !== ",") {
                    node.args.push(this.expression(0));
                    parameterFound = true;
                }
            }
            if (!parameterFound) {
                node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
            }
            return node;
        };
        BasicParser.prototype.def = function (node) {
            node.args = [];
            this.advance("fn");
            if (this.options.keepTokens) {
                node.right = this.previousToken;
            }
            this.token = this.advance("identifier");
            if (node.right) { // keepTokens
                node.right.right = this.previousToken;
            }
            else {
                node.right = this.previousToken;
            }
            if (this.token.type === "(") {
                this.fnGetArgsInParenthesis(node.args, "_vars1"); // accept only variable names
            }
            this.advance("=");
            if (this.options.keepTokens) {
                node.args.push(this.previousToken);
            }
            var expression = this.expression(0);
            node.args.push(expression);
            return node;
        };
        BasicParser.prototype.fnElse = function (node) {
            node.args = [];
            node.type += "Comment"; // else => elseComment
            if (!this.options.quiet) {
                Utils_3.Utils.console.warn(this.composeError({}, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
            }
            if (this.token.type === "number") { // first token number?
                this.fnChangeNumber2LineNumber(this.token);
            }
            // TODO: data line as separate statement is taken
            while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
                node.args.push(this.token); // collect tokens unchecked, may contain syntax error
                this.advance();
            }
            return node;
        };
        BasicParser.prototype.entOrEnv = function (node) {
            node.args = [this.expression(0)]; // should be number or variable
            var count = 0;
            while (this.token.type === ",") {
                this.token = this.advance();
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
                if (this.token.type === "=" && count % 3 === 0) { // special handling for parameter "number of steps"
                    this.advance();
                    if (this.options.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
                    count += 1;
                }
                var expression = this.expression(0);
                node.args.push(expression);
                count += 1;
            }
            return node;
        };
        BasicParser.prototype.fnFor = function (node) {
            this.fnCheckExpressionType(this.token, "identifier", "v");
            var name = this.expression(90); // take simple identifier, nothing more
            this.fnCheckExpressionType(name, "identifier", "v"); // expected simple
            node.args = [name];
            this.advance("=");
            if (this.options.keepTokens) {
                node.args.push(this.previousToken);
            }
            node.args.push(this.expression(0));
            this.token = this.advance("to");
            if (this.options.keepTokens) {
                node.args.push(this.previousToken);
            }
            node.args.push(this.expression(0));
            if (this.token.type === "step") {
                this.advance();
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
                node.args.push(this.expression(0));
            }
            return node;
        };
        BasicParser.prototype.graphics = function (node) {
            var tokenType = this.token.type;
            if (tokenType !== "pen" && tokenType !== "paper") {
                throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
            }
            return this.fnCombineTwoTokens(node, tokenType);
        };
        BasicParser.prototype.fnCheckForUnreachableCode = function (args) {
            for (var i = 0; i < args.length; i += 1) {
                var node = args[i], tokenType = node.type;
                if ((i === 0 && tokenType === "linenumber") || tokenType === "goto" || tokenType === "stop") {
                    var index = i + 1;
                    if (index < args.length && (args[index].type !== "rem") && (args[index].type !== "'")) {
                        if (args[index].type === ":" && this.options.keepColons) {
                            // ignore
                        }
                        else if (!this.options.quiet) {
                            Utils_3.Utils.console.warn(this.composeError({}, "IF: Unreachable code after THEN or ELSE", tokenType, node.pos).message);
                        }
                        break;
                    }
                }
            }
        };
        BasicParser.prototype.fnIf = function (node) {
            node.right = this.expression(0); // condition
            node.args = [];
            if (this.token.type !== "goto") { // no "goto", expect "then" token...
                this.advance("then");
                if (this.options.keepTokens) {
                    node.args.unshift(this.previousToken);
                }
                if (this.token.type === "number") {
                    this.fnGetArgs(node.args, "goto"); // take number parameter as line number
                }
            }
            this.statements(node.args, BasicParser.closeTokensForLineAndElse); // get "then" statements until "else" or eol
            this.fnCheckForUnreachableCode(node.args);
            if (this.token.type === "else") {
                this.token = this.advance("else");
                var elseNode = this.previousToken;
                node.args.push(elseNode);
                elseNode.args = [];
                if (this.token.type === "number") {
                    this.fnGetArgs(elseNode.args, "goto"); // take number parameter as line number
                    // only number 0?
                }
                if (this.token.type === "if") {
                    elseNode.args.push(this.statement());
                }
                else {
                    this.statements(elseNode.args, BasicParser.closeTokensForLineAndElse);
                }
                this.fnCheckForUnreachableCode(elseNode.args);
            }
            return node;
        };
        BasicParser.prototype.input = function (node) {
            var stream = this.fnGetOptionalStream();
            node.args = [stream];
            if (stream.len !== 0) { // not an inserted stream?
                this.advance(",");
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
            }
            if (this.token.type === ";") { // no newline after input?
                node.args.push(this.token);
                this.advance();
            }
            else {
                node.args.push(BasicParser.fnCreateDummyArg("null"));
            }
            if (this.token.type === "string" || this.token.type === "ustring") { // message
                node.args.push(this.token);
                this.token = this.advance();
                if (this.token.type === ";" || this.token.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
                    node.args.push(this.token);
                    this.advance();
                }
                else {
                    throw this.composeError(Error(), "Expected ; or ,", this.token.type, this.token.pos);
                }
            }
            else {
                node.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
                node.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
            }
            do { // we need loop for input
                var value2 = this.expression(90); // we expect "identifier", no fnxx
                this.fnCheckExpressionType(value2, "identifier", "v");
                node.args.push(value2);
                if (node.type === "lineInput" || this.token.type !== ",") {
                    break; // no loop for lineInput (only one arg) or no more args
                }
                this.advance(",");
                if (this.options.keepTokens) {
                    node.args.push(this.previousToken);
                }
            } while (true); // eslint-disable-line no-constant-condition
            return node;
        };
        BasicParser.prototype.key = function (node) {
            var tokenType = this.token.type;
            return tokenType === "def" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "key def" or "key"
        };
        BasicParser.prototype.let = function (node) {
            node.right = this.assignment();
            return node;
        };
        BasicParser.prototype.line = function (node) {
            node.type = this.fnCombineTwoTokensNoArgs(node, "input"); // combine "line" => "lineInput"
            return this.input(node); // continue with input //TTT
        };
        BasicParser.prototype.mid$Assign = function (node) {
            node.type = "mid$Assign"; // change type mid$ => mid$Assign
            this.fnCreateFuncCall(node);
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
            }
            // check that first argument is a variable...
            var i = 0;
            if (this.options.keepTokens) {
                while (node.args[i].type === "(" && i < (node.args.length - 1)) {
                    i += 1;
                }
            }
            this.fnCheckExpressionType(node.args[i], "identifier", "v");
            this.advance("="); // equal as assignment
            if (this.options.keepTokens) {
                node.args.push(this.previousToken);
            }
            var expression = this.expression(0);
            node.args.push(expression);
            return node;
        };
        BasicParser.prototype.on = function (node) {
            node.args = [];
            var tokenType;
            switch (this.token.type) {
                case "break":
                    node.type = this.fnCombineTwoTokensNoArgs(node, "break"); // onBreak
                    tokenType = this.token.type;
                    if (tokenType === "gosub" || tokenType === "cont" || tokenType === "stop") {
                        this.fnCombineTwoTokens(node, this.token.type); // onBreakGosub, onBreakCont, onBreakStop
                    }
                    else {
                        throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.token.type, this.token.pos);
                    }
                    break;
                case "error": // on error goto
                    node.type = this.fnCombineTwoTokensNoArgs(node, "error"); // onError..
                    this.fnCombineTwoTokens(node, "goto"); // onErrorGoto
                    break;
                case "sq": // on sq(n) gosub
                    node.right = this.expression(0);
                    if (!node.right.args) {
                        throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
                    }
                    this.advance("gosub");
                    if (this.options.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                    node.type = "onSqGosub";
                    this.fnGetArgs(node.args, node.type);
                    break;
                default: // on <expr> goto|gosub
                    node.args.push(this.expression(0));
                    if (this.token.type === "gosub" || this.token.type === "goto") {
                        this.advance();
                        if (this.options.keepTokens) {
                            node.args.push(this.previousToken); // modify
                        }
                        node.type = "on" + Utils_3.Utils.stringCapitalize(this.previousToken.type); // onGoto, onGosub
                        this.fnGetArgs(node.args, node.type);
                    }
                    else {
                        throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
                    }
                    break;
            }
            return node;
        };
        BasicParser.prototype.print = function (node) {
            var closeTokens = BasicParser.closeTokensForArgs, stream = this.fnGetOptionalStream();
            node.args = [stream];
            if (stream.len !== 0) { // not an inserted stream?
                if (!closeTokens[this.token.type]) {
                    this.advance(",");
                    if (this.options.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                }
            }
            while (!closeTokens[this.token.type]) {
                var node2 = void 0;
                if (this.token.type === "spc" || this.token.type === "tab") {
                    this.advance();
                    node2 = this.fnCreateFuncCall(this.previousToken);
                }
                else if (this.token.type === "using") {
                    node2 = this.token;
                    node2.args = [];
                    this.advance();
                    node2.args.push(this.expression(0)); // format
                    this.advance(";"); // after the format there must be a ";"
                    node2.args.push(this.previousToken); // semicolon
                    node2.args = this.fnGetArgsSepByCommaSemi(node2.args);
                    if (this.previousToken.type === ";") { // using closed by ";"?
                        node2.args.pop(); // remove it from using
                        node.args.push(node2);
                        node2 = this.previousToken; // keep it for print
                    }
                }
                else if (this.token.type === ";" || this.token.type === ",") { // separator ";" or comma tab separator ","
                    node2 = this.token;
                    this.advance();
                }
                else {
                    node2 = this.expression(0);
                }
                node.args.push(node2);
            }
            return node;
        };
        BasicParser.prototype.question = function (node) {
            var node2 = this.print(node); // not really a new node
            node2.type = "print";
            return node2;
        };
        BasicParser.prototype.resume = function (node) {
            var tokenType = this.token.type;
            return tokenType === "next" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "resume next" or "resume"
        };
        BasicParser.prototype.run = function (node) {
            if (this.token.type === "number") {
                node.args = this.fnGetArgs([], "goto"); // we get linenumber arg as for goto
            }
            else {
                node = this.fnCreateCmdCall(node);
            }
            return node;
        };
        BasicParser.prototype.speed = function (node) {
            var tokenType = this.token.type;
            if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
                throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
            }
            return this.fnCombineTwoTokens(node, tokenType);
        };
        BasicParser.prototype.symbol = function (node) {
            var tokenType = this.token.type;
            return tokenType === "after" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "symbol after" or "symbol"
        };
        BasicParser.prototype.window = function (node) {
            var tokenType = this.token.type;
            return tokenType === "swap" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "window swap" or "window"
        };
        BasicParser.prototype.write = function (node) {
            var closeTokens = BasicParser.closeTokensForArgs, stream = this.fnGetOptionalStream();
            node.args = [stream];
            if (stream.len !== 0) { // not an inserted stream?
                if (!closeTokens[this.token.type]) {
                    this.advance(",");
                    if (this.options.keepTokens) {
                        node.args.push(this.previousToken);
                    }
                }
            }
            var lengthBefore = node.args.length;
            this.fnGetArgsSepByCommaSemi(node.args);
            if ((this.previousToken.type === "," && node.args.length > lengthBefore) || this.previousToken.type === ";") {
                this.fnMaskedError(this.previousToken, "Operand missing");
            }
            return node;
        };
        // ---
        BasicParser.fnNode = function (node) {
            return node;
        };
        BasicParser.prototype.createSymbol = function (id) {
            if (!this.symbols[id]) { // some symbols are extended, e.g. symbols for both infix and prefix
                this.symbols[id] = {}; // create symbol
            }
            return this.symbols[id];
        };
        BasicParser.prototype.createNudSymbol = function (id, nud) {
            var symbol = this.createSymbol(id);
            symbol.nud = nud;
            return symbol;
        };
        BasicParser.prototype.fnInfixLed = function (left, rbp) {
            var node = this.previousToken;
            node.left = left;
            node.right = this.expression(rbp);
            return node;
        };
        BasicParser.prototype.createInfix = function (id, lbp, rbp) {
            var _this = this;
            var symbol = this.createSymbol(id);
            symbol.lbp = lbp;
            symbol.led = function (left) { return _this.fnInfixLed(left, rbp || lbp); };
        };
        BasicParser.prototype.createInfixr = function (id, lbp) {
            var _this = this;
            var symbol = this.createSymbol(id);
            symbol.lbp = lbp;
            symbol.led = function (left) { return _this.fnInfixLed(left, lbp - 1); };
        };
        BasicParser.prototype.fnPrefixNud = function (rbp) {
            var node = this.previousToken;
            node.right = this.expression(rbp);
            return node;
        };
        BasicParser.prototype.createPrefix = function (id, rbp) {
            var _this = this;
            this.createNudSymbol(id, function () { return _this.fnPrefixNud(rbp); });
        };
        BasicParser.prototype.createStatement = function (id, fn) {
            var _this = this;
            var symbol = this.createSymbol(id);
            symbol.std = function () { return fn.call(_this, _this.previousToken); };
            return symbol;
        };
        BasicParser.prototype.fnGenerateKeywordSymbols = function () {
            var _this = this;
            for (var key in BasicParser.keywords) {
                if (BasicParser.keywords.hasOwnProperty(key)) {
                    var keywordType = BasicParser.keywords[key].charAt(0);
                    if (keywordType === "f") {
                        this.createNudSymbol(key, function () { return _this.fnCreateFuncCall(_this.previousToken); });
                    }
                    else if (keywordType === "c") {
                        this.createStatement(key, this.specialStatements[key] || this.fnCreateCmdCall);
                    }
                    else if (keywordType === "p") { // additional parts of command
                        this.createSymbol(key);
                    }
                }
            }
        };
        BasicParser.prototype.fnGenerateSymbols = function () {
            var _this = this;
            this.fnGenerateKeywordSymbols();
            // special statements ...
            this.createStatement("|", this.specialStatements["|"]); // rsx
            this.createStatement("mid$", this.specialStatements.mid$); // mid$Assign (statement), combine with function
            this.createStatement("?", this.specialStatements["?"]); // "?" is same as print
            this.createSymbol(":");
            this.createSymbol(";");
            this.createSymbol(",");
            this.createSymbol(")");
            this.createSymbol("[");
            this.createSymbol("]");
            this.createSymbol("(eol)");
            this.createSymbol("(end)");
            this.createNudSymbol("number", BasicParser.fnNode);
            this.createNudSymbol("binnumber", BasicParser.fnNode);
            this.createNudSymbol("expnumber", BasicParser.fnNode);
            this.createNudSymbol("hexnumber", BasicParser.fnNode);
            this.createNudSymbol("linenumber", BasicParser.fnNode);
            this.createNudSymbol("string", BasicParser.fnNode);
            this.createNudSymbol("ustring", BasicParser.fnNode);
            this.createNudSymbol("unquoted", BasicParser.fnNode);
            this.createNudSymbol("ws", BasicParser.fnNode); // optional whitespace
            this.createNudSymbol("identifier", function () { return _this.fnIdentifier(_this.previousToken); });
            this.createNudSymbol("(", function () { return _this.fnParenthesis(_this.previousToken); });
            this.createNudSymbol("fn", function () { return _this.fnFn(_this.previousToken); }); // separate fn
            this.createPrefix("@", 95); // address of
            this.createInfix("^", 90, 80);
            this.createPrefix("+", 80); // + can be uses as prefix or infix
            this.createPrefix("-", 80); // - can be uses as prefix or infix
            this.createInfix("*", 70);
            this.createInfix("/", 70);
            this.createInfix("\\", 60); // integer division
            this.createInfix("mod", 50);
            this.createInfix("+", 40); // + can be uses as prefix or infix, so combine with prefix function
            this.createInfix("-", 40); // - can be uses as prefix or infix, so combine with prefix function
            this.createInfix("=", 30); // equal for comparison, left associative
            this.createInfix("<>", 30);
            this.createInfix("<", 30);
            this.createInfix("<=", 30);
            this.createInfix(">", 30);
            this.createInfix(">=", 30);
            this.createPrefix("not", 23);
            this.createInfixr("and", 22);
            this.createInfixr("or", 21);
            this.createInfixr("xor", 20);
            this.createPrefix("#", 10); // priority ok?
        };
        // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
        // http://crockford.com/javascript/tdop/parse.js
        // Operator precedence parsing
        //
        // Operator: With left binding power (lbp) and operational function.
        // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
        // identifiers, numbers: also nud.
        BasicParser.prototype.parse = function (tokens) {
            this.tokens = tokens;
            // line
            this.label = "0"; // for error messages
            this.index = 0;
            this.token = {};
            this.previousToken = this.token; // just to avoid warning
            var parseTree = this.parseTree;
            parseTree.length = 0;
            this.advance();
            while (this.token.type !== "(end)") {
                parseTree.push(this.basicLine());
            }
            return parseTree;
        };
        BasicParser.parameterTypes = {
            c: "command",
            f: "function",
            o: "operator",
            n: "number",
            s: "string",
            l: "line number",
            q: "line number range",
            v: "variable",
            r: "letter or range",
            a: "any parameter",
            "n0?": "optional parameter with default null",
            "#": "stream"
        };
        // first letter: c=command, f=function, p=part of command, o=operator, x=misc
        // following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), q=line number range, r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
        BasicParser.keywords = {
            abs: "f n",
            after: "c",
            afterGosub: "c n n?",
            and: "o",
            asc: "f s",
            atn: "f n",
            auto: "c n0? n0?",
            bin$: "f n n?",
            border: "c n n?",
            "break": "p",
            call: "c n *",
            cat: "c",
            chain: "c s n? *",
            chainMerge: "c s n? *",
            chr$: "f n",
            cint: "f n",
            clear: "c",
            clearInput: "c",
            clg: "c n?",
            closein: "c",
            closeout: "c",
            cls: "c #0?",
            cont: "c",
            copychr$: "f #",
            cos: "f n",
            creal: "f n",
            cursor: "c #0? n0? n?",
            data: "c n0*",
            dec$: "f n s",
            def: "c s *",
            defint: "c r r*",
            defreal: "c r r*",
            defstr: "c r r*",
            deg: "c",
            "delete": "c q0?",
            derr: "f",
            di: "c",
            dim: "c v *",
            draw: "c n n n0? n?",
            drawr: "c n n n0? n?",
            edit: "c l",
            ei: "c",
            "else": "c",
            end: "c",
            ent: "c n *",
            env: "c n *",
            eof: "f",
            erase: "c v *",
            erl: "f",
            err: "f",
            error: "c n",
            every: "c",
            everyGosub: "c n n?",
            exp: "f n",
            fill: "c n",
            fix: "f n",
            fn: "x",
            "for": "c",
            frame: "c",
            fre: "f a",
            gosub: "c l",
            "goto": "c l",
            graphics: "c",
            graphicsPaper: "x n",
            graphicsPen: "x n0? n?",
            hex$: "f n n?",
            himem: "f",
            "if": "c",
            ink: "c n n n?",
            inkey: "f n",
            inkey$: "f",
            inp: "f n",
            input: "c #0? *",
            instr: "f a a a?",
            "int": "f n",
            joy: "f n",
            key: "c n s",
            keyDef: "c n n n? n? n?",
            left$: "f s n",
            len: "f s",
            let: "c",
            line: "c",
            lineInput: "c #0? *",
            list: "c q0? #0?",
            load: "c s n?",
            locate: "c #0? n n",
            log: "f n",
            log10: "f n",
            lower$: "f s",
            mask: "c n0? n?",
            max: "f a *",
            memory: "c n",
            merge: "c s",
            mid$: "f s n n?",
            mid$Assign: "f s n n?",
            min: "f a *",
            mod: "o",
            mode: "c n",
            move: "c n n n0? n?",
            mover: "c n n n0? n?",
            "new": "c",
            next: "c v*",
            not: "o",
            on: "c",
            onBreakCont: "c",
            onBreakGosub: "c l",
            onBreakStop: "c",
            onErrorGoto: "c l",
            onGosub: "c l l*",
            onGoto: "c l l*",
            onSqGosub: "c l",
            openin: "c s",
            openout: "c s",
            or: "o",
            origin: "c n n n? n? n? n?",
            out: "c n n",
            paper: "c #0? n",
            peek: "f n",
            pen: "c #0? n0 n?",
            pi: "f",
            plot: "c n n n0? n?",
            plotr: "c n n n0? n?",
            poke: "c n n",
            pos: "f #",
            print: "c #0? *",
            rad: "c",
            randomize: "c n?",
            read: "c v v*",
            release: "c n",
            rem: "c s?",
            "'": "c s?",
            remain: "f n",
            renum: "c n0? n0? n?",
            restore: "c l?",
            resume: "c l?",
            resumeNext: "c",
            "return": "c",
            right$: "f s n",
            rnd: "f n?",
            round: "f n n?",
            run: "c a?",
            save: "c s a? n? n? n?",
            sgn: "f n",
            sin: "f n",
            sound: "c n n n? n0? n0? n0? n?",
            space$: "f n",
            spc: "f n",
            speed: "c",
            speedInk: "c n n",
            speedKey: "c n n",
            speedWrite: "c n",
            sq: "f n",
            sqr: "f n",
            step: "p",
            stop: "c",
            str$: "f n",
            string$: "f n a",
            swap: "p n n?",
            symbol: "c n n *",
            symbolAfter: "c n",
            tab: "f n",
            tag: "c #0?",
            tagoff: "c #0?",
            tan: "f n",
            test: "f n n",
            testr: "f n n",
            then: "p",
            time: "f",
            to: "p",
            troff: "c",
            tron: "c",
            unt: "f n",
            upper$: "f s",
            using: "p",
            val: "f s",
            vpos: "f #",
            wait: "c n n n?",
            wend: "c",
            "while": "c n",
            width: "c n",
            window: "c #0? n n n n",
            windowSwap: "c n n?",
            write: "c #0? *",
            xor: "o",
            xpos: "f",
            ypos: "f",
            zone: "c n",
            _rsx1: "c a a*",
            _any1: "x *",
            _vars1: "x v*" // dummy: any number of variables
        };
        /* eslint-enable no-invalid-this */
        BasicParser.closeTokensForLine = {
            "(eol)": 1,
            "(end)": 1
        };
        BasicParser.closeTokensForLineAndElse = {
            "(eol)": 1,
            "(end)": 1,
            "else": 1
        };
        BasicParser.closeTokensForArgs = {
            ":": 1,
            "(eol)": 1,
            "(end)": 1,
            "else": 1,
            rem: 1,
            "'": 1
        };
        BasicParser.brackets = {
            "(": ")",
            "[": "]"
        };
        return BasicParser;
    }());
    exports.BasicParser = BasicParser;
});
// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//
define("BasicFormatter", ["require", "exports", "Utils"], function (require, exports, Utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicFormatter = void 0;
    var BasicFormatter = /** @class */ (function () {
        function BasicFormatter(options) {
            this.label = ""; // current label (line) for error messages
            this.options = {
                lexer: options.lexer,
                parser: options.parser,
                implicitLines: false
            };
            this.setOptions(options);
        }
        BasicFormatter.prototype.setOptions = function (options) {
            if (options.implicitLines !== undefined) {
                this.options.implicitLines = options.implicitLines;
            }
        };
        BasicFormatter.prototype.getOptions = function () {
            return this.options;
        };
        BasicFormatter.prototype.composeError = function (error, message, value, pos, len) {
            return Utils_4.Utils.composeError("BasicFormatter", error, message, value, pos, len, this.label);
        };
        // renumber
        BasicFormatter.fnHasLabel = function (label) {
            return label !== "";
        };
        BasicFormatter.prototype.fnCreateLabelEntry = function (node, lastLine, implicitLines) {
            var origLen = (node.orig || node.value).length;
            if (!BasicFormatter.fnHasLabel(node.value) && implicitLines) {
                node.value = String(lastLine + 1); // generate label
            }
            var label = node.value;
            this.label = label; // for error messages
            if (BasicFormatter.fnHasLabel(label)) {
                var line = Number(label);
                if (line < 1 || line > 65535) {
                    throw this.composeError(Error(), "Line number overflow", label, node.pos, node.len);
                }
                if (line <= lastLine) {
                    throw this.composeError(Error(), "Expected increasing line number", label, node.pos, node.len);
                }
            }
            var labelEntry = {
                value: label,
                pos: node.pos,
                len: origLen,
                refCount: 0
            };
            return labelEntry;
        };
        BasicFormatter.prototype.fnCreateLabelMap = function (nodes, implicitLines) {
            var lines = {}; // line numbers
            var lastLine = 0;
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                if (node.type === "label") {
                    var labelEntry = this.fnCreateLabelEntry(node, lastLine, implicitLines);
                    lines[labelEntry.value] = labelEntry;
                    lastLine = Number(labelEntry.value);
                }
            }
            return lines;
        };
        BasicFormatter.prototype.fnAddSingleReference = function (node, lines, refs) {
            if (node.type === "linenumber") {
                if (node.value in lines) {
                    refs.push({
                        value: node.value,
                        pos: node.pos,
                        len: (node.orig || node.value).length
                    });
                    var linesEntry = lines[node.value];
                    if (linesEntry.refCount === undefined) { // not needed for renum but for removing line numbers
                        linesEntry.refCount = 1;
                    }
                    else {
                        linesEntry.refCount += 1;
                    }
                }
                else {
                    throw this.composeError(Error(), "Line does not exist", node.value, node.pos);
                }
            }
        };
        BasicFormatter.prototype.fnAddReferencesForNode = function (node, lines, refs) {
            if (node.type === "label") {
                this.label = node.value;
            }
            else {
                this.fnAddSingleReference(node, lines, refs);
            }
            if (node.left) {
                this.fnAddSingleReference(node.left, lines, refs);
            }
            if (node.right) {
                this.fnAddSingleReference(node.right, lines, refs);
            }
            if (node.args) {
                if (node.type === "onErrorGoto" && node.args.length === 1 && node.args[0].value === "0") {
                    // ignore "on error goto 0"
                }
                else {
                    this.fnAddReferences(node.args, lines, refs); // recursive
                }
            }
        };
        BasicFormatter.prototype.fnAddReferences = function (nodes, lines, refs) {
            for (var i = 0; i < nodes.length; i += 1) {
                this.fnAddReferencesForNode(nodes[i], lines, refs);
            }
        };
        BasicFormatter.prototype.fnRenumberLines = function (lines, refs, newLine, oldLine, step, keep) {
            var changes = {}, keys = Object.keys(lines);
            function fnSortbyPosition(a, b) {
                return lines[a].pos - lines[b].pos;
            }
            keys.sort(fnSortbyPosition);
            for (var i = 0; i < keys.length; i += 1) {
                var lineEntry = lines[keys[i]], hasLabel = BasicFormatter.fnHasLabel(lineEntry.value), line = Number(lineEntry.value);
                if (!hasLabel || (line >= oldLine && line < keep)) {
                    if (newLine > 65535) {
                        throw this.composeError(Error(), "Line number overflow", lineEntry.value, lineEntry.pos);
                    }
                    lineEntry.newValue = String(newLine);
                    changes[lineEntry.pos] = lineEntry;
                    newLine += step;
                }
            }
            for (var i = 0; i < refs.length; i += 1) {
                var ref = refs[i], lineString = ref.value, line = Number(lineString);
                if (line >= oldLine && line < keep) {
                    if (lineString !== lines[lineString].newValue) {
                        ref.newValue = lines[lineString].newValue;
                        changes[ref.pos] = ref;
                    }
                }
            }
            return changes;
        };
        BasicFormatter.fnSortNumbers = function (a, b) {
            return a - b;
        };
        BasicFormatter.fnApplyChanges = function (input, changes) {
            var keys = Object.keys(changes).map(Number);
            keys.sort(BasicFormatter.fnSortNumbers);
            // apply changes to input in reverse order
            for (var i = keys.length - 1; i >= 0; i -= 1) {
                var line = changes[keys[i]];
                input = input.substring(0, line.pos) + line.newValue + input.substring(line.pos + line.len);
            }
            return input;
        };
        BasicFormatter.prototype.fnRenumber = function (input, parseTree, newLine, oldLine, step, keep) {
            var refs = [], // references
            lines = this.fnCreateLabelMap(parseTree, Boolean(this.options.implicitLines));
            this.fnAddReferences(parseTree, lines, refs); // create reference list
            var changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep), output = BasicFormatter.fnApplyChanges(input, changes);
            return output;
        };
        BasicFormatter.prototype.renumber = function (input, newLine, oldLine, step, keep) {
            var out = {
                text: ""
            };
            this.label = ""; // current line (label)
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRenumber(input, parseTree, newLine, oldLine, step, keep || 65535);
                out.text = output;
            }
            catch (e) {
                if (Utils_4.Utils.isCustomError(e)) {
                    out.error = e;
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_4.Utils.console.error(e);
                }
            }
            return out;
        };
        // ---
        BasicFormatter.prototype.fnRemoveUnusedLines = function (input, parseTree) {
            var refs = [], // references
            implicitLines = true, lines = this.fnCreateLabelMap(parseTree, implicitLines);
            this.fnAddReferences(parseTree, lines, refs); // create reference list
            // reference count would be enough
            var changes = {}, keys = Object.keys(lines);
            for (var i = 0; i < keys.length; i += 1) {
                var lineEntry = lines[keys[i]];
                if (lineEntry.len && !lineEntry.refCount) { // non-empty label without references?
                    lineEntry.newValue = ""; // set empty line number
                    if (input[lineEntry.pos + lineEntry.len] === " ") { // space following line number?
                        lineEntry.len += 1; // remove it as well
                    }
                    changes[lineEntry.pos] = lineEntry;
                }
            }
            var output = BasicFormatter.fnApplyChanges(input, changes);
            return output;
        };
        BasicFormatter.prototype.removeUnusedLines = function (input) {
            var out = {
                text: ""
            };
            this.label = ""; // current line (label)
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRemoveUnusedLines(input, parseTree);
                out.text = output;
            }
            catch (e) {
                if (Utils_4.Utils.isCustomError(e)) {
                    out.error = e;
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_4.Utils.console.error(e);
                }
            }
            return out;
        };
        return BasicFormatter;
    }());
    exports.BasicFormatter = BasicFormatter;
});
// BasicTokenizer.ts - Tokenize BASIC programs
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
// decode based on lbas2ascii.pl, 28.06.2006
// http://cpctech.cpc-live.com/docs/bastech.html
// https://www.cpcwiki.eu/index.php/Technical_information_about_Locomotive_BASIC#BASIC_tokens
//
define("BasicTokenizer", ["require", "exports", "Utils"], function (require, exports, Utils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicTokenizer = void 0;
    var BasicTokenizer = /** @class */ (function () {
        function BasicTokenizer() {
            this.pos = 0;
            this.line = 0;
            // will also be set in decode
            this.lineEnd = 0;
            this.input = "";
            this.needSpace = false; // hmm
            this.debug = {
                startPos: 0,
                line: 0,
                info: ""
            };
            // on sq?
            /* eslint-disable no-invalid-this */
            this.tokens = {
                0x00: "",
                0x01: ":",
                0x02: this.fnIntVar,
                0x03: this.fnStringVar,
                0x04: this.fnFpVar,
                0x05: "var?",
                0x06: "var?",
                0x07: "var?",
                0x08: "var?",
                0x09: "var?",
                0x0a: "var?",
                0x0b: this.fnVar,
                0x0c: this.fnVar,
                0x0d: this.fnVar,
                0x0e: "0",
                0x0f: "1",
                0x10: "2",
                0x11: "3",
                0x12: "4",
                0x13: "5",
                0x14: "6",
                0x15: "7",
                0x16: "8",
                0x17: "9",
                0x18: "10",
                0x19: this.fnNum8DecAsStr,
                0x1a: this.fnNum16DecAsStr,
                0x1b: this.fnNum16Bin,
                0x1c: this.fnNum16Hex,
                0x1d: this.fnNum16DecAsStr,
                0x1e: this.fnNum16DecAsStr,
                0x1f: this.fnNumFp,
                // 0x20-0x21 ASCII printable symbols
                0x22: this.fnQuotedString,
                // 0x23-0x7b ASCII printable symbols
                0x7c: this.fnRsx,
                0x80: "AFTER",
                0x81: "AUTO",
                0x82: "BORDER",
                0x83: "CALL",
                0x84: "CAT",
                0x85: "CHAIN",
                0x86: "CLEAR",
                0x87: "CLG",
                0x88: "CLOSEIN",
                0x89: "CLOSEOUT",
                0x8a: "CLS",
                0x8b: "CONT",
                0x8c: "DATA",
                0x8d: "DEF",
                0x8e: "DEFINT",
                0x8f: "DEFREAL",
                0x90: "DEFSTR",
                0x91: "DEG",
                0x92: "DELETE",
                0x93: "DIM",
                0x94: "DRAW",
                0x95: "DRAWR",
                0x96: "EDIT",
                0x97: "ELSE",
                0x98: "END",
                0x99: "ENT",
                0x9a: "ENV",
                0x9b: "ERASE",
                0x9c: "ERROR",
                0x9d: "EVERY",
                0x9e: "FOR",
                0x9f: "GOSUB",
                0xa0: "GOTO",
                0xa1: "IF",
                0xa2: "INK",
                0xa3: "INPUT",
                0xa4: "KEY",
                0xa5: "LET",
                0xa6: "LINE",
                0xa7: "LIST",
                0xa8: "LOAD",
                0xa9: "LOCATE",
                0xaa: "MEMORY",
                0xab: "MERGE",
                0xac: "MID$",
                0xad: "MODE",
                0xae: "MOVE",
                0xaf: "MOVER",
                0xb0: "NEXT",
                0xb1: "NEW",
                0xb2: "ON",
                0xb3: "ON BREAK",
                0xb4: "ON ERROR GOTO 0",
                0xb5: "ON SQ",
                0xb6: "OPENIN",
                0xb7: "OPENOUT",
                0xb8: "ORIGIN",
                0xb9: "OUT",
                0xba: "PAPER",
                0xbb: "PEN",
                0xbc: "PLOT",
                0xbd: "PLOTR",
                0xbe: "POKE",
                0xbf: "PRINT",
                0xc0: this.fnApostrophe,
                0xc1: "RAD",
                0xc2: "RANDOMIZE",
                0xc3: "READ",
                0xc4: "RELEASE",
                0xc5: this.fnRem,
                0xc6: "RENUM",
                0xc7: "RESTORE",
                0xc8: "RESUME",
                0xc9: "RETURN",
                0xca: "RUN",
                0xcb: "SAVE",
                0xcc: "SOUND",
                0xcd: "SPEED",
                0xce: "STOP",
                0xcf: "SYMBOL",
                0xd0: "TAG",
                0xd1: "TAGOFF",
                0xd2: "TROFF",
                0xd3: "TRON",
                0xd4: "WAIT",
                0xd5: "WEND",
                0xd6: "WHILE",
                0xd7: "WIDTH",
                0xd8: "WINDOW",
                0xd9: "WRITE",
                0xda: "ZONE",
                0xdb: "DI",
                0xdc: "EI",
                0xdd: "FILL",
                0xde: "GRAPHICS",
                0xdf: "MASK",
                0xe0: "FRAME",
                0xe1: "CURSOR",
                0xe2: "<unused>",
                0xe3: "ERL",
                0xe4: "FN",
                0xe5: "SPC",
                0xe6: "STEP",
                0xe7: "SWAP",
                0xe8: "<unused>",
                0xe9: "<unused>",
                0xea: "TAB",
                0xeb: "THEN",
                0xec: "TO",
                0xed: "USING",
                0xee: ">",
                0xef: "=",
                0xf0: ">=",
                0xf1: "<",
                0xf2: "<>",
                0xf3: "<=",
                0xf4: "+",
                0xf5: "-",
                0xf6: "*",
                0xf7: "/",
                0xf8: "^",
                0xf9: "\\",
                0xfa: "AND",
                0xfb: "MOD",
                0xfc: "OR",
                0xfd: "XOR",
                0xfe: "NOT"
                // 0xff: (prefix for additional keywords)
            };
            /* eslint-enable no-invalid-this */
            this.tokensFF = {
                // Functions with one argument
                0x00: "ABS",
                0x01: "ASC",
                0x02: "ATN",
                0x03: "CHR$",
                0x04: "CINT",
                0x05: "COS",
                0x06: "CREAL",
                0x07: "EXP",
                0x08: "FIX",
                0x09: "FRE",
                0x0a: "INKEY",
                0x0b: "INP",
                0x0c: "INT",
                0x0d: "JOY",
                0x0e: "LEN",
                0x0f: "LOG",
                0x10: "LOG10",
                0x11: "LOWER$",
                0x12: "PEEK",
                0x13: "REMAIN",
                0x14: "SGN",
                0x15: "SIN",
                0x16: "SPACE$",
                0x17: "SQ",
                0x18: "SQR",
                0x19: "STR$",
                0x1a: "TAN",
                0x1b: "UNT",
                0x1c: "UPPER$",
                0x1d: "VAL",
                // Functions without arguments
                0x40: "EOF",
                0x41: "ERR",
                0x42: "HIMEM",
                0x43: "INKEY$",
                0x44: "PI",
                0x45: "RND",
                0x46: "TIME",
                0x47: "XPOS",
                0x48: "YPOS",
                0x49: "DERR",
                // Functions with more arguments
                0x71: "BIN$",
                0x72: "DEC$",
                0x73: "HEX$",
                0x74: "INSTR",
                0x75: "LEFT$",
                0x76: "MAX",
                0x77: "MIN",
                0x78: "POS",
                0x79: "RIGHT$",
                0x7a: "ROUND",
                0x7b: "STRING$",
                0x7c: "TEST",
                0x7d: "TESTR",
                0x7e: "COPYCHR$",
                0x7f: "VPOS"
            };
        }
        BasicTokenizer.prototype.fnNum8Dec = function () {
            var num = this.input.charCodeAt(this.pos);
            this.pos += 1;
            return num;
        };
        BasicTokenizer.prototype.fnNum16Dec = function () {
            return this.fnNum8Dec() + this.fnNum8Dec() * 256;
        };
        BasicTokenizer.prototype.fnNum32Dec = function () {
            return this.fnNum16Dec() + this.fnNum16Dec() * 65536;
        };
        BasicTokenizer.prototype.fnNum8DecAsStr = function () {
            return String(this.fnNum8Dec());
        };
        BasicTokenizer.prototype.fnNum16DecAsStr = function () {
            return String(this.fnNum16Dec());
        };
        BasicTokenizer.prototype.fnNum16Bin = function () {
            return "&X" + this.fnNum16Dec().toString(2);
        };
        BasicTokenizer.prototype.fnNum16Hex = function () {
            return "&" + this.fnNum16Dec().toString(16).toUpperCase();
        };
        // floating point numbers (little endian byte order)
        // byte 0: mantissa (bits 7-0)
        // byte 1: mantissa (bits 15-8)
        // byte 2: mantissa (bits 23-16)
        // byte 3: sign, mantissa (bits 30-24)
        // byte 4: exponent
        //
        //
        // examples:
        // 0xa2,0xda,0x0f,0x49,0x82 (PI)
        // 0x00,0x00,0x00,0x00,0x81 (1)
        //
        // 0x00,0x00,0x00,0x00,0x84      ; 10 (10^1)
        // 0x00,0x00,0x00,0x48,0x87      ; 100 (10^2)
        // 0x00,0x00,0x00,0x7A,0x8A      ; 1000 (10^3)
        // 0x00,0x00,0x40,0x1c,0x8e      ; 10000 (10^4) (1E+4)
        // 0x00,0x00,0x50,0x43,0x91      ; 100000 (10^5) (1E+5)
        // 0x00,0x00,0x24,0x74,0x94      ; 1000000 (10^6) (1E+6)
        // 0x00,0x80,0x96,0x18,0x98      ; 10000000 (10^7) (1E+7)
        // 0x00,0x20,0xbc,0x3e,0x9b      ; 100000000 (10^8) (1E+8)
        // 0x00,0x28,0x6b,0x6e,0x9e      ; 1000000000 (10^9) (1E+9)
        // 0x00,0xf9,0x02,0x15,0xa2      ; 10000000000 (10^10) (1E+10)
        // 0x40,0xb7,0x43,0x3a,0xa5      ; 100000000000 (10^11) (1E+11)
        // 0x10,0xa5,0xd4,0x68,0xa8      ; 1000000000000 (10^12) (1E+12)
        // 0x2a,0xe7,0x84,0x11,0xac      ; 10000000000000 (10^13) (1E+13)
        // Check also: https://mfukar.github.io/2015/10/29/amstrad-fp.html
        // Example PI: b=[0xa2,0xda,0x0f,0x49,0x82]; e=b[4]-128; m=(b[3] >= 128 ? -1 : +1) * (0x80000000 + ((b[3] & 0x7f) <<24) + (b[2] << 16) + (b[1] <<8) + b[0]); z=m*Math.pow(2,e-32);console.log(m,e,z)
        BasicTokenizer.prototype.fnNumFp = function () {
            var value = this.fnNum32Dec(); // signed integer
            var exponent = this.fnNum8Dec(), out;
            if (!exponent) { // exponent zero? => 0
                out = "0";
            }
            else { // beware: JavaScript has no unsigned int except for ">>> 0"
                var mantissa = value >= 0 ? value + 0x80000000 : value;
                exponent -= 0x81; // 2-complement: 2^-127 .. 2^128
                var num = mantissa * Math.pow(2, exponent - 31);
                out = Utils_5.Utils.toPrecision9(num);
            }
            return out;
        };
        BasicTokenizer.prototype.fnGetBit7TerminatedString = function () {
            var data = this.input;
            var pos = this.pos;
            while (data.charCodeAt(pos) <= 0x7f && pos < this.lineEnd) { // last character b7=1 (>= 0x80)
                pos += 1;
            }
            var out = data.substring(this.pos, pos) + String.fromCharCode(data.charCodeAt(pos) & 0x7f); // eslint-disable-line no-bitwise
            if (pos < this.lineEnd) { // maybe corrupted if used in DATA line
                this.pos = pos + 1;
            }
            return out;
        };
        BasicTokenizer.prototype.fnVar = function () {
            this.fnNum16Dec(); // ignore offset (offset to memory location of variable)
            return this.fnGetBit7TerminatedString();
        };
        BasicTokenizer.prototype.fnIntVar = function () {
            return this.fnVar() + "%";
        };
        BasicTokenizer.prototype.fnStringVar = function () {
            return this.fnVar() + "$";
        };
        BasicTokenizer.prototype.fnFpVar = function () {
            return this.fnVar() + "!";
        };
        BasicTokenizer.prototype.fnRsx = function () {
            var name = this.fnGetBit7TerminatedString();
            name = name.substring(1); // ignore length (offset to tokens following RSX name)
            return "|" + name;
        };
        BasicTokenizer.prototype.fnStringUntilEol = function () {
            var out = this.input.substring(this.pos, this.lineEnd - 1); // take remaining line
            this.pos = this.lineEnd;
            return out;
        };
        BasicTokenizer.prototype.fnApostrophe = function () {
            return "'" + this.fnStringUntilEol();
        };
        BasicTokenizer.prototype.fnRem = function () {
            return "REM" + this.fnStringUntilEol();
        };
        BasicTokenizer.prototype.fnQuotedString = function () {
            var closingQuotes = this.input.indexOf('"', this.pos);
            var out = "";
            if (closingQuotes < 0 || closingQuotes >= this.lineEnd) { // unclosed quoted string (quotes not found or not in this line)
                out = this.fnStringUntilEol(); // take remaining line
            }
            else {
                out = this.input.substring(this.pos, closingQuotes + 1);
                this.pos = closingQuotes + 1; // after quotes
            }
            out = '"' + out;
            if (out.indexOf("\r") >= 0) {
                Utils_5.Utils.console.log("BasicTokenizer line", this.line, ": string contains CR, replaced by CHR$(13)");
                out = out.replace(/\r/g, '"+chr$(13)+"');
            }
            if ((/\n\d/).test(out)) {
                Utils_5.Utils.console.log("BasicTokenizer line", this.line, ": string contains LF<digit>, replaced by CHR$(10)<digit>");
                out = out.replace(/\n(\d)/g, '"+chr$(10)+"$1');
            }
            return out;
        };
        BasicTokenizer.prototype.debugPrintInfo = function () {
            var debug = this.debug;
            Utils_5.Utils.console.debug("BasicTokenizer Details:\n", debug.info);
            debug.line = 0;
            debug.info = "";
        };
        BasicTokenizer.prototype.debugCollectInfo = function (tokenLine) {
            var debug = this.debug, hex = this.input.substring(debug.startPos, this.pos).split("").map(function (s) {
                return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
            }).join(",");
            if (this.line !== debug.line) {
                if (debug.info) {
                    debug.info += "\n";
                }
                debug.line = this.line;
                debug.info += debug.line + ": ";
            }
            debug.info += " [" + hex + "] " + tokenLine;
        };
        BasicTokenizer.prototype.fnParseNextToken = function (input) {
            var oldNeedSpace = this.needSpace;
            var token = this.fnNum8Dec();
            if (token === 0x01) { // statement seperator ":"?
                if (this.pos < input.length) {
                    var nextToken = input.charCodeAt(this.pos); // test next token
                    if (nextToken === 0x97 || nextToken === 0xc0) { // ELSE or rem '?
                        token = nextToken; // ignore ':'
                        this.pos += 1;
                    }
                }
            }
            this.needSpace = ((token >= 0x02 && token <= 0x1f) || (token === 0x7c)); // constant 0..9; variable, or RSX?
            var tokenValue;
            if (token === 0xff) { // extended token?
                token = this.fnNum8Dec(); // get it
                tokenValue = this.tokensFF[token];
            }
            else {
                tokenValue = this.tokens[token];
            }
            var tstr;
            if (tokenValue !== undefined) {
                tstr = typeof tokenValue === "function" ? tokenValue.call(this) : tokenValue;
                if ((/[a-zA-Z0-9.]$/).test(tstr) && token !== 0xe4) { // last character char, number, dot? (not for token "FN")
                    this.needSpace = true; // maybe need space next time...
                }
            }
            else { // normal ASCII
                tstr = String.fromCharCode(token);
            }
            if (oldNeedSpace) {
                if ((/^[a-zA-Z0-9$%!]/).test(tstr) || (token >= 0x02 && token <= 0x1f)) {
                    tstr = " " + tstr;
                }
            }
            if (Utils_5.Utils.debug > 2) {
                this.debugCollectInfo(tstr);
            }
            return tstr;
        };
        BasicTokenizer.prototype.fnParseLineFragment = function () {
            var input = this.input;
            var out = "";
            this.needSpace = false; // only needed in fnParseNextToken
            while (this.pos < this.lineEnd) {
                this.debug.startPos = this.pos;
                var tstr = this.fnParseNextToken(input);
                out += tstr;
            }
            return out;
        };
        BasicTokenizer.prototype.fnParseNextLine = function () {
            var lineLength = this.fnNum16Dec();
            if (!lineLength) {
                return undefined; // nothing more
            }
            this.line = this.fnNum16Dec();
            this.lineEnd = this.pos - 4 + lineLength;
            return this.line + " " + this.fnParseLineFragment();
        };
        BasicTokenizer.prototype.fnParseProgram = function () {
            var out = "", line;
            while ((line = this.fnParseNextLine()) !== undefined) {
                out += line + "\n";
                // CPC uses "\r\n" line breaks, JavaScript uses "\n", textArea cannot contain "\r"
            }
            return out;
        };
        BasicTokenizer.prototype.decodeLineFragment = function (program, offset, length) {
            this.input = program;
            this.pos = offset;
            this.line = 0;
            this.lineEnd = this.pos + length;
            var out = this.fnParseLineFragment();
            if (Utils_5.Utils.debug > 2) {
                this.debugPrintInfo();
            }
            return out;
        };
        BasicTokenizer.prototype.decode = function (program) {
            this.input = program;
            this.pos = 0;
            this.line = 0;
            var out = this.fnParseProgram();
            if (Utils_5.Utils.debug > 2) {
                this.debugPrintInfo();
            }
            return out;
        };
        return BasicTokenizer;
    }());
    exports.BasicTokenizer = BasicTokenizer;
});
// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
define("CodeGeneratorBasic", ["require", "exports", "Utils", "BasicParser"], function (require, exports, Utils_6, BasicParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGeneratorBasic = void 0;
    var CodeGeneratorBasic = /** @class */ (function () {
        function CodeGeneratorBasic(options) {
            this.hasColons = false;
            this.keepWhiteSpace = false;
            this.line = 0; // current line (label)
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                "(": this.fnParenthesisOpen,
                string: CodeGeneratorBasic.string,
                ustring: CodeGeneratorBasic.ustring,
                assign: this.assign,
                expnumber: CodeGeneratorBasic.expnumber,
                binnumber: CodeGeneratorBasic.binHexNumber,
                hexnumber: CodeGeneratorBasic.binHexNumber,
                label: this.label,
                "|": this.vertical,
                afterGosub: this.afterEveryGosub,
                chain: this.chainOrChainMerge,
                chainMerge: this.chainOrChainMerge,
                data: this.data,
                def: this.def,
                "else": this.fnElse,
                elseComment: this.elseComment,
                everyGosub: this.afterEveryGosub,
                fn: this.fn,
                "for": this.fnFor,
                "if": this.fnIf,
                input: this.inputLineInput,
                lineInput: this.inputLineInput,
                list: this.list,
                mid$Assign: this.mid$Assign,
                onBreakCont: this.onBreakOrError,
                onBreakGosub: this.onBreakOrError,
                onBreakStop: this.onBreakOrError,
                onErrorGoto: this.onBreakOrError,
                onGosub: this.onGotoGosub,
                onGoto: this.onGotoGosub,
                onSqGosub: this.onSqGosub,
                print: this.print,
                rem: this.rem,
                using: this.using,
                write: this.write
            };
            this.options = {
                lexer: options.lexer,
                parser: options.parser,
                quiet: false
            };
            this.setOptions(options);
        }
        CodeGeneratorBasic.prototype.setOptions = function (options) {
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
        };
        CodeGeneratorBasic.prototype.getOptions = function () {
            return this.options;
        };
        CodeGeneratorBasic.prototype.composeError = function (error, message, value, pos) {
            return Utils_6.Utils.composeError("CodeGeneratorBasic", error, message, value, pos, undefined, this.line);
        };
        CodeGeneratorBasic.fnWs = function (node) {
            return node.ws || "";
        };
        CodeGeneratorBasic.fnSpace1 = function (value) {
            return (!value.length || value.startsWith(" ") ? "" : " ") + value;
        };
        CodeGeneratorBasic.getUcKeyword = function (node) {
            var type = node.type;
            return CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
        };
        CodeGeneratorBasic.prototype.fnParseArgs = function (args) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            for (var i = 0; i < args.length; i += 1) {
                var value = this.parseNode(args[i]);
                if (args[i].type === "'" || args[i].type === "else" || args[i].type === "elseComment") { // fast hack to put a space before "'", "else" or "elseComment", if there is no space previously
                    if (i > 0 && !nodeArgs[i - 1].endsWith(" ") && !nodeArgs[i - 1].endsWith(":")) {
                        value = CodeGeneratorBasic.fnSpace1(value);
                    }
                }
                nodeArgs.push(value);
            }
            return nodeArgs;
        };
        CodeGeneratorBasic.prototype.combineArgsWithColon = function (args) {
            if (!this.hasColons) {
                for (var i = 1; i < args.length; i += 1) { // start with 1
                    var arg = args[i].trim();
                    if (!arg.startsWith("ELSE") && !arg.startsWith("'") && arg !== "") { //TTT arg !== "\n"
                        args[i] = ":" + args[i];
                    }
                }
            }
            return args.join("");
        };
        CodeGeneratorBasic.prototype.fnParenthesisOpen = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value + (node.args ? this.fnParseArgs(node.args).join("") : "");
        };
        CodeGeneratorBasic.string = function (node) {
            return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
        };
        CodeGeneratorBasic.ustring = function (node) {
            return CodeGeneratorBasic.fnWs(node) + '"' + node.value;
        };
        CodeGeneratorBasic.prototype.assign = function (node) {
            // see also "let"
            if (node.left.type !== "identifier") {
                throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
            }
            // no spaces needed around "="
            return this.parseNode(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.parseNode(node.right);
        };
        CodeGeneratorBasic.expnumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + Number(node.value).toExponential().toUpperCase().replace(/(\d+)$/, function (x) {
                return x.length >= 2 ? x : x.padStart(2, "0"); // format with 2 exponential digits
            });
        };
        CodeGeneratorBasic.binHexNumber = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // binnumber: maybe "&x", hexnumber: mayby "&h"
        };
        CodeGeneratorBasic.prototype.label = function (node) {
            this.line = Number(node.value); // set line before parsing args
            var value = this.combineArgsWithColon(this.fnParseArgs(node.args));
            return CodeGeneratorBasic.fnWs(node) + node.value + (node.value !== "" ? CodeGeneratorBasic.fnSpace1(value) : value);
        };
        // special keyword functions
        CodeGeneratorBasic.prototype.vertical = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorBasic.prototype.afterEveryGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            nodeArgs[0] = CodeGeneratorBasic.fnSpace1(nodeArgs[0]); // first argument
            nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub"
            nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.chainOrChainMerge = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length > 2) { // with delete?
                if (nodeArgs[nodeArgs.length - 2] === "DELETE") {
                    nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
                }
            }
            return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) : "") + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.data = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var value2 = nodeArgs[i];
                nodeArgs[i] = value2;
            }
            var args = nodeArgs.join("");
            if (!this.keepWhiteSpace) {
                args = Utils_6.Utils.stringTrimEnd(args); // remove trailing spaces
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(args);
        };
        CodeGeneratorBasic.prototype.def = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + this.fnParseArgs(node.args).join("") : "");
        };
        CodeGeneratorBasic.prototype.elseComment = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var args = node.args;
            var value = "";
            for (var i = 0; i < args.length; i += 1) {
                var token = args[i];
                if (token.value) {
                    if (this.keepWhiteSpace) {
                        value += CodeGeneratorBasic.fnWs(token) + token.value;
                    }
                    else {
                        value += CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.fnWs(token) + token.value); //TTT
                    }
                }
            }
            return CodeGeneratorBasic.fnWs(node) + "else".toUpperCase() + value;
        };
        CodeGeneratorBasic.prototype.fn = function (node) {
            if (!node.right) {
                return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase(); // only fn
            }
            var nodeArgs = node.args ? this.fnParseArgs(node.args) : [];
            var right = this.parseNode(node.right);
            if ((node.right.pos - node.pos) > 2) { // space between fn and identifier?
                right = CodeGeneratorBasic.fnSpace1(right); // keep it
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + right + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.fnFor = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                if (i !== 1 && i !== 2) { // not for "=" and startValue
                    nodeArgs[i] = CodeGeneratorBasic.fnSpace1(nodeArgs[i]); // set minimal spaces in case we do not keep whitespace
                }
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.fnElse = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(this.fnParseArgs(node.args)));
        };
        CodeGeneratorBasic.prototype.fnIf = function (node) {
            /*
            const elseNode = node.args && node.args.length && node.args[node.args.length - 1].type === "else" ? (node.args.pop() as ParserNode);
            elseArgs = node.args && node.args.length && node.args[node.args.length - 1].type === "else" ? (node.args.pop() as ParserNode).args : undefined,
            */
            var nodeArgs = this.fnParseArgs(node.args), partName = nodeArgs.shift(); // "then"/"goto"
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right))
                + CodeGeneratorBasic.fnSpace1(partName) + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(nodeArgs));
            //+ elseArgs ? CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase()
        };
        CodeGeneratorBasic.prototype.inputLineInput = function (node) {
            var nodeArgs = node.args ? this.fnParseArgs(node.args) : [], // also for clear input, which has no args
            name = node.right ? this.parseNode(node.right) : ""; // line input?
            return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + CodeGeneratorBasic.fnSpace1(name) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.list = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length && nodeArgs[0] === "") { // empty range?
                nodeArgs.shift(); // remove
            }
            if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") { // dummy stream?
                nodeArgs.pop(); // remove
            }
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.mid$Assign = function (node) {
            return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorBasic.prototype.onBreakOrError = function (node) {
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
        };
        CodeGeneratorBasic.prototype.onGotoGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), expression = nodeArgs.shift(), instruction = nodeArgs.shift(); // "goto" or "gosub"
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(expression) + CodeGeneratorBasic.fnSpace1(instruction) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
        };
        CodeGeneratorBasic.prototype.onSqGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub" with space (optional)
            nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number with space
            return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.print = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            var value = "";
            for (var i = 0; i < nodeArgs.length; i += 1) {
                value += nodeArgs[i];
            }
            if (node.value !== "?") { // for "print"
                value = CodeGeneratorBasic.fnSpace1(value);
            }
            return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get PRINT or ?
        };
        CodeGeneratorBasic.prototype.rem = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorBasic.prototype.using = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), template = nodeArgs.length ? nodeArgs.shift() || "" : "";
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + nodeArgs.join("");
        };
        CodeGeneratorBasic.prototype.write = function (node) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.args ? CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join("")) : ""); // separators already there
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorBasic.prototype.fnParseOther = function (node) {
            var type = node.type;
            var value = ""; // CodeGeneratorBasic.fnGetWs(node);
            if (node.left) {
                value += this.parseNode(node.left);
            }
            value += CodeGeneratorBasic.fnWs(node);
            var keyType = BasicParser_1.BasicParser.keywords[type];
            if (keyType) {
                value += CodeGeneratorBasic.getUcKeyword(node);
            }
            else if (node.value) { // e.g. string,...
                value += node.value;
            }
            var right = "";
            if (node.right) {
                right = this.parseNode(node.right);
                var needSpace1 = BasicParser_1.BasicParser.keywords[right.toLowerCase()] || keyType;
                value += needSpace1 ? CodeGeneratorBasic.fnSpace1(right) : right;
            }
            if (node.args) {
                var nodeArgs = this.fnParseArgs(node.args).join(""), needSpace2 = keyType && keyType.charAt(0) !== "f" && node.type !== "'";
                // special handling for combined keywords with 2 tokens (for 3 tokens, we need a specific function)
                value += needSpace2 ? CodeGeneratorBasic.fnSpace1(nodeArgs) : nodeArgs;
            }
            return value;
        };
        CodeGeneratorBasic.getLeftOrRightOperatorPrecedence = function (node) {
            var precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
            var pr;
            if (operators[node.type] && (node.left || node.right)) { // binary operator (or unary operator, e.g. not)
                if (node.left) { // right is binary
                    pr = precedence[node.type] || 0;
                }
                else {
                    pr = precedence["p" + node.type] || precedence[node.type] || 0;
                }
            }
            return pr;
        };
        CodeGeneratorBasic.prototype.parseOperator = function (node) {
            var precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
            var value;
            if (node.left) {
                value = this.parseNode(node.left);
                var p = precedence[node.type], pl = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(node.left);
                if (pl !== undefined && pl < p) {
                    value = "(" + value + ")";
                }
                var right = node.right;
                var value2 = this.parseNode(right);
                var pr = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(right);
                if (pr !== undefined) {
                    if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
                        value2 = "(" + value2 + ")";
                    }
                }
                var operator = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase();
                if ((/^(and|or|xor|mod)$/).test(node.type)) {
                    value += CodeGeneratorBasic.fnSpace1(operator) + CodeGeneratorBasic.fnSpace1(value2);
                }
                else {
                    value += operator + value2;
                }
            }
            else if (node.right) { // unary operator, e.g. not, '#'
                if (node.len === 0) {
                    value = ""; // ignore dummy token, e.g. '#'
                }
                else {
                    var right = node.right;
                    value = this.parseNode(right);
                    var pr = void 0;
                    if (right.left) { // was binary op?
                        pr = precedence[right.type] || 0; // no special prio
                    }
                    else {
                        pr = precedence["p" + right.type] || precedence[right.type] || 0; // check unary operator first
                    }
                    var p = precedence["p" + node.type] || precedence[node.type] || 0; // check unary operator first
                    if (p && pr && (pr < p)) {
                        value = "(" + value + ")";
                    }
                    value = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase() + (node.type === "not" ? CodeGeneratorBasic.fnSpace1(value) : value);
                }
            }
            else { // no operator, e.g. "=" in "for"
                value = this.fnParseOther(node);
            }
            return value;
        };
        CodeGeneratorBasic.prototype.parseNode = function (node) {
            var type = node.type;
            if (Utils_6.Utils.debug > 3) {
                Utils_6.Utils.console.debug("evaluate: parseNode node=%o type=" + type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var value;
            if (CodeGeneratorBasic.operators[type]) {
                value = this.parseOperator(node);
            }
            else if (this.parseFunctions[type]) { // function with special handling?
                value = this.parseFunctions[type].call(this, node);
            }
            else { // for other functions, generate code directly
                value = this.fnParseOther(node);
            }
            return value;
        };
        CodeGeneratorBasic.prototype.evaluate = function (parseTree) {
            var output = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_6.Utils.debug > 2) {
                    Utils_6.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var line = this.parseNode(parseTree[i]);
                if ((line !== undefined) && (line !== "")) {
                    if (line !== null) {
                        if (output.length === 0) {
                            output = line;
                        }
                        else {
                            output += line;
                        }
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            return output;
        };
        CodeGeneratorBasic.prototype.generate = function (input) {
            var out = {
                text: ""
            };
            this.hasColons = Boolean(this.options.parser.getOptions().keepColons);
            this.keepWhiteSpace = Boolean(this.options.lexer.getOptions().keepWhiteSpace);
            this.line = 0;
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.evaluate(parseTree);
                out.text = output;
            }
            catch (e) {
                if (Utils_6.Utils.isCustomError(e)) {
                    out.error = e;
                    if (!this.options.quiet) {
                        Utils_6.Utils.console.warn(e); // show our customError as warning
                    }
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_6.Utils.console.error(e);
                }
            }
            return out;
        };
        CodeGeneratorBasic.combinedKeywords = {
            chainMerge: "CHAIN",
            clearInput: "CLEAR",
            graphicsPaper: "GRAPHICS",
            graphicsPen: "GRAPHICS",
            keyDef: "KEY",
            lineInput: "LINE",
            mid$Assign: "MID$",
            onBreakCont: "ON",
            onBreakGosub: "ON",
            onBreakStop: "ON",
            onErrorGoto: "ON",
            resumeNext: "RESUME",
            speedInk: "SPEED",
            speedKey: "SPEED",
            speedWrite: "SPEED",
            symbolAfter: "SYMBOL",
            windowSwap: "WINDOW" // "WINDOW SWAP"
        };
        CodeGeneratorBasic.operators = {
            "+": "+",
            "-": "-",
            "*": "*",
            "/": "/",
            "\\": "\\",
            "^": "^",
            and: "AND",
            or: "OR",
            xor: "XOR",
            not: "NOT",
            mod: "MOD",
            ">": ">",
            "<": "<",
            ">=": ">=",
            "<=": "<=",
            "=": "=",
            "<>": "<>",
            "@": "@",
            "#": "#"
        };
        CodeGeneratorBasic.operatorPrecedence = {
            "@": 95,
            "^": 90,
            "p-": 80,
            "p+": 80,
            "*": 70,
            "/": 70,
            "\\": 60,
            mod: 50,
            "+": 40,
            "-": 40,
            "=": 30,
            "<>": 30,
            "<": 30,
            "<=": 30,
            ">": 30,
            ">=": 30,
            not: 23,
            and: 22,
            or: 21,
            xor: 20,
            "#": 10 // priority?
        };
        return CodeGeneratorBasic;
    }());
    exports.CodeGeneratorBasic = CodeGeneratorBasic;
});
// Variables.ts - Variables
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
define("Variables", ["require", "exports", "Utils"], function (require, exports, Utils_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Variables = void 0;
    var ArrayProxy = /** @class */ (function () {
        function ArrayProxy(len) {
            return new Proxy(new Array(len), this);
        }
        // eslint-disable-next-line class-methods-use-this
        ArrayProxy.prototype.get = function (target, prop) {
            if (typeof prop === "string" && !isNaN(Number(prop))) {
                var numProp = Number(prop);
                if (numProp < 0 || numProp >= target.length) {
                    throw Utils_7.Utils.composeVmError("Variables", Error(), 9, prop); // Subscript out of range
                }
            }
            return target[prop];
        };
        // eslint-disable-next-line class-methods-use-this
        ArrayProxy.prototype.set = function (target, prop, value) {
            if (!isNaN(Number(prop))) {
                var numProp = Number(prop);
                if (numProp < 0 || numProp >= target.length) {
                    throw Utils_7.Utils.composeVmError("Variables", Error(), 9, prop); // Subscript out of range
                }
            }
            target[prop] = value;
            return true;
        };
        return ArrayProxy;
    }());
    var Variables = /** @class */ (function () {
        function Variables(options) {
            this.arrayBounds = false;
            if (options) {
                this.setOptions(options);
            }
            this.variables = {};
            this.varTypes = {}; // default variable types for variables starting with letters a-z
        }
        Variables.prototype.setOptions = function (options) {
            if (options.arrayBounds !== undefined) {
                this.arrayBounds = options.arrayBounds;
            }
        };
        Variables.prototype.removeAllVariables = function () {
            var variables = this.variables;
            for (var name_4 in variables) { // eslint-disable-line guard-for-in
                delete variables[name_4];
            }
        };
        Variables.prototype.getAllVariables = function () {
            return this.variables;
        };
        Variables.prototype.getAllVarTypes = function () {
            return this.varTypes;
        };
        Variables.prototype.createNDimArray = function (dims, initVal) {
            var that = this, fnCreateRec = function (index) {
                var len = dims[index], arr = that.arrayBounds ? new ArrayProxy(len) : new Array(len);
                index += 1;
                if (index < dims.length) { // more dimensions?
                    for (var i = 0; i < len; i += 1) {
                        arr[i] = fnCreateRec(index); // recursive call
                    }
                }
                else { // one dimension
                    for (var i = 0; i < len; i += 1) {
                        arr[i] = initVal;
                    }
                }
                return arr;
            }, ret = fnCreateRec(0);
            return ret;
        };
        // determine static varType (first letter + optional fixed vartype) from a variable name
        // format: (v.|v["])(_)<sname>(A*)(I|R|$)([...]([...])) with optional parts in ()
        Variables.prototype.determineStaticVarType = function (name) {
            if (name.indexOf("v.") === 0) { // preceding variable object?
                name = name.substring(2); // remove preceding "v."
            }
            if (name.indexOf('v["') === 0) { // preceding variable object?
                name = name.substring(3); // remove preceding 'v["'
            }
            var nameType = name.charAt(0); // take first character to determine variable type later
            if (nameType === "_") { // ignore underscore (do not clash with keywords)
                nameType = name.charAt(1);
            }
            var bracketPos = name.indexOf("["), typePos = bracketPos >= 0 ? bracketPos - 1 : name.length - 1, typeChar = name.charAt(typePos); // check character before array bracket
            if (typeChar === "I" || typeChar === "R" || typeChar === "$") { // explicit type specified?
                nameType += typeChar;
            }
            return nameType;
        };
        Variables.prototype.getVarDefault = function (varName, dimensions) {
            var isString = varName.includes("$");
            if (!isString) { // check dynamic varType...
                var first = varName.charAt(0);
                if (first === "_") { // ignore underscore (do not clash with keywords)
                    first = first.charAt(1);
                }
                isString = (this.getVarType(first) === "$");
            }
            var value = isString ? "" : 0, arrayIndices = varName.split("A").length - 1;
            if (arrayIndices) {
                if (!dimensions) {
                    dimensions = [];
                    if (arrayIndices > 3) { // on CPC up to 3 dimensions 0..10 without dim
                        arrayIndices = 3;
                    }
                    for (var i = 0; i < arrayIndices; i += 1) {
                        dimensions.push(11);
                    }
                }
                var valueArray = this.createNDimArray(dimensions, value);
                value = valueArray;
            }
            return value;
        };
        Variables.prototype.initVariable = function (name) {
            this.variables[name] = this.getVarDefault(name);
        };
        Variables.prototype.dimVariable = function (name, dimensions) {
            this.variables[name] = this.getVarDefault(name, dimensions);
        };
        Variables.prototype.getAllVariableNames = function () {
            return Object.keys(this.variables);
        };
        Variables.prototype.getVariableIndex = function (name) {
            var varNames = this.getAllVariableNames(), pos = varNames.indexOf(name);
            return pos;
        };
        Variables.prototype.initAllVariables = function () {
            var variables = this.getAllVariableNames();
            for (var i = 0; i < variables.length; i += 1) {
                this.initVariable(variables[i]);
            }
        };
        Variables.prototype.getVariable = function (name) {
            return this.variables[name];
        };
        Variables.prototype.setVariable = function (name, value) {
            this.variables[name] = value;
        };
        Variables.prototype.getVariableByIndex = function (index) {
            var variables = this.getAllVariableNames(), name = variables[index];
            return this.variables[name];
        };
        Variables.prototype.variableExist = function (name) {
            return name in this.variables;
        };
        Variables.prototype.getVarType = function (varChar) {
            return this.varTypes[varChar];
        };
        Variables.prototype.setVarType = function (varChar, type) {
            this.varTypes[varChar] = type;
        };
        return Variables;
    }());
    exports.Variables = Variables;
});
// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
define("CodeGeneratorJs", ["require", "exports", "Utils"], function (require, exports, Utils_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGeneratorJs = void 0;
    var CodeGeneratorJs = /** @class */ (function () {
        function CodeGeneratorJs(options) {
            this.line = "0"; // current line (label)
            this.stack = {
                forLabel: [],
                forVarName: [],
                whileLabel: []
            };
            this.gosubCount = 0;
            this.ifCount = 0;
            this.stopCount = 0;
            this.forCount = 0; // stack needed
            this.whileCount = 0; // stack needed
            this.referencedLabelsCount = {};
            this.dataList = []; // collected data from data lines
            this.labelList = []; // all labels
            this.sourceMap = {};
            this.countMap = {};
            // for evaluate:
            this.variables = {}; // will be set later
            this.defintDefstrTypes = {};
            /* eslint-disable no-invalid-this */
            this.allOperators = {
                "+": this.plus,
                "-": this.minus,
                "*": this.mult,
                "/": this.div,
                "\\": this.intDiv,
                "^": this.exponent,
                and: this.and,
                or: this.or,
                xor: this.xor,
                not: CodeGeneratorJs.not,
                mod: this.mod,
                ">": this.greater,
                "<": this.less,
                ">=": this.greaterEqual,
                "<=": this.lessEqual,
                "=": this.equal,
                "<>": this.notEqual,
                "@": this.addressOf,
                "#": CodeGeneratorJs.stream
            };
            this.unaryOperators = {
                "+": this.plus,
                "-": this.minus,
                not: CodeGeneratorJs.not,
                "@": this.addressOf,
                "#": CodeGeneratorJs.stream
            };
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                ";": CodeGeneratorJs.commaOrSemicolon,
                ",": CodeGeneratorJs.commaOrSemicolon,
                "|": this.vertical,
                number: CodeGeneratorJs.number,
                expnumber: CodeGeneratorJs.expnumber,
                binnumber: CodeGeneratorJs.binnumber,
                hexnumber: CodeGeneratorJs.hexnumber,
                linenumber: CodeGeneratorJs.linenumber,
                identifier: this.identifier,
                letter: CodeGeneratorJs.letter,
                range: this.range,
                linerange: this.linerange,
                string: CodeGeneratorJs.string,
                ustring: CodeGeneratorJs.string,
                unquoted: CodeGeneratorJs.unquoted,
                "null": CodeGeneratorJs.fnNull,
                assign: this.assign,
                label: this.label,
                // special keyword functions
                afterGosub: this.afterEveryGosub,
                call: this.fnCommandWithGoto,
                chain: this.fnCommandWithGoto,
                chainMerge: this.fnCommandWithGoto,
                clear: this.fnCommandWithGoto,
                closeout: this.fnCommandWithGoto,
                cont: CodeGeneratorJs.cont,
                data: this.data,
                def: this.def,
                defint: this.fnParseDefIntRealStr,
                defreal: this.fnParseDefIntRealStr,
                defstr: this.fnParseDefIntRealStr,
                dim: this.dim,
                "delete": this.fnDelete,
                edit: this.edit,
                elseComment: this.elseComment,
                end: this.stopOrEnd,
                erase: this.erase,
                error: this.error,
                everyGosub: this.afterEveryGosub,
                fn: this.fn,
                "for": this.fnFor,
                frame: this.fnCommandWithGoto,
                gosub: this.gosub,
                "goto": this.gotoOrResume,
                "if": this.fnIf,
                input: this.inputOrlineInput,
                let: this.let,
                lineInput: this.inputOrlineInput,
                list: this.list,
                load: this.fnCommandWithGoto,
                merge: this.fnCommandWithGoto,
                mid$Assign: this.mid$Assign,
                "new": CodeGeneratorJs.fnNew,
                next: this.next,
                onBreakGosub: this.onBreakGosubOrRestore,
                onErrorGoto: this.onErrorGoto,
                onGosub: this.onGosubOnGoto,
                onGoto: this.onGosubOnGoto,
                onSqGosub: this.onSqGosub,
                openin: this.fnCommandWithGoto,
                print: this.print,
                randomize: this.randomize,
                read: this.read,
                rem: this.rem,
                "'": this.apostrophe,
                renum: this.fnCommandWithGoto,
                restore: this.onBreakGosubOrRestore,
                resume: this.gotoOrResume,
                resumeNext: this.gotoOrResume,
                "return": CodeGeneratorJs.fnReturn,
                run: this.run,
                save: this.save,
                sound: this.fnCommandWithGoto,
                spc: this.spc,
                stop: this.stopOrEnd,
                tab: this.tab,
                tron: this.fnCommandWithGoto,
                using: this.usingOrWrite,
                wend: this.wend,
                "while": this.fnWhile,
                write: this.usingOrWrite
            };
            this.options = {
                lexer: options.lexer,
                parser: options.parser,
                rsx: options.rsx,
                quiet: false
            };
            this.setOptions(options); // optional options
            this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
        }
        CodeGeneratorJs.prototype.setOptions = function (options) {
            if (options.implicitLines !== undefined) {
                this.options.implicitLines = options.implicitLines;
            }
            if (options.noCodeFrame !== undefined) {
                this.options.noCodeFrame = options.noCodeFrame;
            }
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
            if (options.trace !== undefined) {
                this.options.trace = options.trace;
            }
        };
        CodeGeneratorJs.prototype.getOptions = function () {
            return this.options;
        };
        CodeGeneratorJs.prototype.reset = function () {
            var stack = this.stack;
            stack.forLabel.length = 0;
            stack.forVarName.length = 0;
            stack.whileLabel.length = 0;
            this.line = "0"; // current line (label)
            this.resetCountsPerLine();
            this.labelList.length = 0;
            this.dataList.length = 0;
            this.sourceMap = {};
            this.referencedLabelsCount = {}; // labels or line numbers
            this.countMap = {};
        };
        CodeGeneratorJs.prototype.resetCountsPerLine = function () {
            this.gosubCount = 0;
            this.ifCount = 0;
            this.stopCount = 0;
            this.forCount = 0; // stack needed
            this.whileCount = 0; // stack needed
        };
        CodeGeneratorJs.prototype.composeError = function (error, message, value, pos) {
            return Utils_8.Utils.composeError("CodeGeneratorJs", error, message, value, pos, undefined, this.line);
        };
        CodeGeneratorJs.createJsKeywordRegex = function () {
            return new RegExp("^(" + CodeGeneratorJs.jsKeywords.join("|") + ")$");
        };
        CodeGeneratorJs.prototype.fnDeclareVariable = function (name) {
            if (!this.variables.variableExist(name)) { // variable not yet defined?
                this.variables.initVariable(name);
            }
        };
        CodeGeneratorJs.prototype.fnAdaptVariableName = function (node, name, arrayIndices) {
            var defScopeArgs = this.defScopeArgs;
            name = name.toLowerCase().replace(/\./g, "_");
            var firstChar = name.charAt(0);
            if (defScopeArgs || !Utils_8.Utils.supportReservedNames) { // avoid keywords as def fn parameters; and for IE8 avoid keywords in dot notation
                if (this.reJsKeywords.test(name)) { // IE8: avoid keywords in dot notation
                    name = "_" + name; // prepend underscore
                }
            }
            var mappedTypeChar = CodeGeneratorJs.varTypeMap[name.charAt(name.length - 1)] || ""; // map last char
            if (mappedTypeChar) {
                name = name.slice(0, -1); // remove type char
                node.pt = name.charAt(name.length - 1); // set also type; TODO currently not used
            }
            if (arrayIndices) {
                name += "A".repeat(arrayIndices);
            }
            name += mappedTypeChar; // put type at the end
            var needDeclare = false;
            if (defScopeArgs) {
                if (name === "o" || name === "t" || name === "v") { // we must not use formal parameter "o", "t", "v", since we use them already
                    name = "N" + name; // change variable name to something we cannot set in BASIC
                }
                if (!defScopeArgs.collectDone) { // in collection mode?
                    defScopeArgs[name] = true; // declare DEF scope variable
                }
                else if (!(name in defScopeArgs)) {
                    needDeclare = true;
                }
            }
            else {
                needDeclare = true;
            }
            if (needDeclare) {
                if (mappedTypeChar) { // we have an explicit type
                    this.fnDeclareVariable(name);
                    name = "v." + name; // access with "v."
                }
                else if (!this.defintDefstrTypes[firstChar]) {
                    // the first char of the variable name is not defined via DEFINT or DEFSTR in the program
                    name += "R"; // then we know that the type is real
                    this.fnDeclareVariable(name);
                    name = "v." + name; // access with "v."
                }
                else {
                    // we do not know which type we will need, so declare for all types
                    this.fnDeclareVariable(name + "I");
                    this.fnDeclareVariable(name + "R");
                    this.fnDeclareVariable(name + "$");
                    name = 'v["' + name + '" + t.' + name.charAt(0) + "]";
                }
            }
            return name;
        };
        CodeGeneratorJs.prototype.fnParseOneArg = function (arg) {
            this.parseNode(arg); // eslint-disable-line no-use-before-define
            return arg.pv;
        };
        CodeGeneratorJs.prototype.fnParseArgRange = function (args, start, stop) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            for (var i = start; i <= stop; i += 1) {
                nodeArgs.push(this.fnParseOneArg(args[i]));
            }
            return nodeArgs;
        };
        CodeGeneratorJs.prototype.fnParseArgs = function (args) {
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            return this.fnParseArgRange(args, 0, args.length - 1);
        };
        CodeGeneratorJs.prototype.fnParseArgsIgnoringCommaSemi = function (args) {
            var nodeArgs = [];
            for (var i = 0; i < args.length; i += 1) {
                if (args[i].type !== "," && args[i].type !== ";") { // ignore separators
                    nodeArgs.push(this.fnParseOneArg(args[i]));
                }
            }
            return nodeArgs;
        };
        CodeGeneratorJs.prototype.fnDetermineStaticVarType = function (name) {
            return this.variables.determineStaticVarType(name);
        };
        CodeGeneratorJs.fnExtractVarName = function (name) {
            if (name.indexOf("v.") === 0) { // variable object?
                name = name.substring(2); // remove preceding "v."
                var bracketIndex = name.indexOf("[");
                if (bracketIndex >= 0) {
                    name = name.substring(0, bracketIndex);
                }
            }
            if (name.indexOf('v["') === 0) { // variable object in brackets?
                name = name.substring(3); // remove preceding 'v["'
                var quotesIndex = name.indexOf('"');
                name = name.substring(0, quotesIndex);
            }
            return name;
        };
        CodeGeneratorJs.fnGetNameTypeExpression = function (name) {
            if (name.indexOf("v.") === 0) { // variable object with dot?
                name = name.substring(2); // remove preceding "v."
                var bracketIndex = name.indexOf("[");
                if (bracketIndex >= 0) {
                    name = name.substring(0, bracketIndex);
                }
                name = '"' + name + '"';
            }
            if (name.indexOf("v[") === 0) { // variable object with brackets?
                name = name.substring(2); // remove preceding "v["
                var closeBracketIndex = name.indexOf("]");
                name = name.substring(0, closeBracketIndex);
            }
            return name;
        };
        CodeGeneratorJs.fnIsIntConst = function (a) {
            var reIntConst = /^[+-]?(\d+|0x[0-9a-f]+|0b[0-1]+)$/; // regex for integer, hex, binary constant
            return reIntConst.test(a);
        };
        CodeGeneratorJs.fnGetRoundString = function (node) {
            if (node.pt !== "I") { // no rounding needed for integer, hex, binary constants, integer variables, functions returning integer (optimization)
                node.pv = "o.vmRound(" + node.pv + ")";
            }
            return node.pv;
        };
        CodeGeneratorJs.fnIsInString = function (string, find) {
            return find && string.indexOf(find) >= 0;
        };
        CodeGeneratorJs.prototype.fnPropagateStaticTypes = function (node, left, right, types) {
            if (left.pt && right.pt) {
                if (CodeGeneratorJs.fnIsInString(types, left.pt + right.pt)) {
                    node.pt = left.pt === right.pt ? left.pt : "R";
                }
                else {
                    throw this.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else if (left.pt && !CodeGeneratorJs.fnIsInString(types, left.pt) || right.pt && !CodeGeneratorJs.fnIsInString(types, right.pt)) {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        };
        // operators
        CodeGeneratorJs.prototype.plus = function (node, left, right) {
            if (left === undefined) { // unary plus? => skip it
                node.pv = right.pv;
                var type = right.pt;
                if (CodeGeneratorJs.fnIsInString("IR$", type)) { // I, R or $?
                    node.pt = type;
                }
                else if (type) {
                    throw this.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else {
                node.pv = left.pv + " + " + right.pv;
                this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            }
        };
        CodeGeneratorJs.prototype.minus = function (node, left, right) {
            if (left === undefined) { // unary minus?
                var value = right.pv, type = right.pt;
                // when optimizing, beware of "--" operator in JavaScript!
                if (CodeGeneratorJs.fnIsIntConst(value) || right.type === "number") { // int const or number const (also fp)
                    if (value.charAt(0) === "-") { // starting already with "-"?
                        node.pv = value.substring(1); // remove "-"
                    }
                    else {
                        node.pv = "-" + value;
                    }
                }
                else {
                    node.pv = "-(" + value + ")"; // can be an expression
                }
                if (CodeGeneratorJs.fnIsInString("IR", type)) { // I or R?
                    node.pt = type;
                }
                else if (type) {
                    throw this.composeError(Error(), "Type error", node.value, node.pos);
                }
            }
            else {
                node.pv = left.pv + " - " + right.pv;
                this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            }
        };
        CodeGeneratorJs.prototype.mult = function (node, left, right) {
            node.pv = left.pv + " * " + right.pv;
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
        };
        CodeGeneratorJs.prototype.div = function (node, left, right) {
            node.pv = left.pv + " / " + right.pv;
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "R"; // event II can get a fraction
        };
        CodeGeneratorJs.prototype.intDiv = function (node, left, right) {
            node.pv = "(" + left.pv + " / " + right.pv + ") | 0"; // integer division
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.exponent = function (node, left, right) {
            node.pv = "Math.pow(" + left.pv + ", " + right.pv + ")";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
        };
        CodeGeneratorJs.prototype.and = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " & " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.or = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " | " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.xor = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " ^ " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.not = function (node, _oLeft, right) {
            node.pv = "~(" + CodeGeneratorJs.fnGetRoundString(right) + ")"; // a can be an expression
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.mod = function (node, left, right) {
            node.pv = CodeGeneratorJs.fnGetRoundString(left) + " % " + CodeGeneratorJs.fnGetRoundString(right);
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.greater = function (node, left, right) {
            node.pv = left.pv + " > " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.less = function (node, left, right) {
            node.pv = left.pv + " < " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.greaterEqual = function (node, left, right) {
            node.pv = left.pv + " >= " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.lessEqual = function (node, left, right) {
            node.pv = left.pv + " <= " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.equal = function (node, left, right) {
            node.pv = left.pv + " === " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.notEqual = function (node, left, right) {
            node.pv = left.pv + " !== " + right.pv + " ? -1 : 0";
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
            node.pt = "I";
        };
        CodeGeneratorJs.prototype.addressOf = function (node, _oLeft, right) {
            if (right.type !== "identifier") {
                throw this.composeError(Error(), "Expected variable", node.value, node.pos);
            }
            // we want a name, for arrays with "A"'s but without array indices
            var name = CodeGeneratorJs.fnGetNameTypeExpression(right.pv);
            node.pv = "o.addressOf(" + name + ")"; // address of
            node.pt = "I";
        };
        CodeGeneratorJs.stream = function (node, _oLeft, right) {
            // "#" stream as prefix operator
            node.pv = right.pv;
            node.pt = "I";
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorJs.prototype.fnParseDefIntRealStr = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var arg = nodeArgs[i];
                nodeArgs[i] = "o." + node.type + '("' + arg + '")';
            }
            node.pv = nodeArgs.join("; ");
        };
        CodeGeneratorJs.prototype.fnAddReferenceLabel = function (label, node) {
            if (label in this.referencedLabelsCount) {
                this.referencedLabelsCount[label] += 1;
            }
            else {
                if (Utils_8.Utils.debug > 1) {
                    Utils_8.Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", label);
                }
                if (!this.countMap.merge && !this.countMap.chainMerge) {
                    throw this.composeError(Error(), "Line does not exist", label, node.pos);
                }
            }
        };
        CodeGeneratorJs.prototype.fnGetForLabel = function () {
            var label = this.line + "f" + this.forCount;
            this.forCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetGosubLabel = function () {
            var label = this.line + "g" + this.gosubCount;
            this.gosubCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetIfLabel = function () {
            var label = this.line + "i" + this.ifCount;
            this.ifCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetStopLabel = function () {
            var label = this.line + "s" + this.stopCount;
            this.stopCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnGetWhileLabel = function () {
            var label = this.line + "w" + this.whileCount;
            this.whileCount += 1;
            return label;
        };
        CodeGeneratorJs.prototype.fnCommandWithGoto = function (node, nodeArgs) {
            nodeArgs = nodeArgs || this.fnParseArgs(node.args);
            var label = this.fnGetStopLabel();
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":";
            return node.pv;
        };
        CodeGeneratorJs.commaOrSemicolon = function (node) {
            node.pv = node.type;
        };
        CodeGeneratorJs.prototype.vertical = function (node) {
            var rsxName = node.value.substring(1).toLowerCase().replace(/\./g, "_");
            var rsxAvailable = this.options.rsx && this.options.rsx.rsxIsAvailable(rsxName), nodeArgs = this.fnParseArgs(node.args), label = this.fnGetStopLabel();
            if (!rsxAvailable) { // if RSX not available, we delay the error until it is executed (or catched by on error goto)
                if (!this.options.quiet) {
                    var error = this.composeError(Error(), "Unknown RSX command", node.value, node.pos);
                    Utils_8.Utils.console.warn(error);
                }
                nodeArgs.unshift('"' + rsxName + '"'); // put as first arg
                rsxName = "rsxExec"; // and call special handler which triggers error if not available
            }
            node.pv = "o.rsx." + rsxName + "(" + nodeArgs.join(", ") + "); o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // most RSX commands need goto (era, ren,...)
        };
        CodeGeneratorJs.number = function (node) {
            node.pt = (/^\d+$/).test(node.value) ? "I" : "R";
            node.pv = node.value;
        };
        CodeGeneratorJs.expnumber = function (node) {
            node.pt = "R";
            node.pv = node.value;
        };
        CodeGeneratorJs.binnumber = function (node) {
            var value = node.value.slice(2); // remove &x
            if (Utils_8.Utils.supportsBinaryLiterals) {
                value = "0b" + ((value.length) ? value : "0"); // &x->0b; 0b is ES6
            }
            else {
                value = "0x" + ((value.length) ? parseInt(value, 2).toString(16) : "0"); // we convert it to hex
            }
            node.pt = "I";
            node.pv = value;
        };
        CodeGeneratorJs.hexnumber = function (node) {
            var value = node.value.slice(1); // remove &
            if (value.charAt(0).toLowerCase() === "h") { // optional h
                value = value.slice(1); // remove
            }
            value || (value = "0");
            var n = parseInt(value, 16);
            if (n > 32767) { //	two's complement
                n = 65536 - n;
                value = "-0x" + n.toString(16);
            }
            else {
                value = "0x" + value;
            }
            node.pt = "I";
            node.pv = value;
        };
        CodeGeneratorJs.prototype.identifier = function (node) {
            var nodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
            name = this.fnAdaptVariableName(node, node.value, nodeArgs.length); // here we use node.value;
            var indices = "";
            for (var i = 0; i < nodeArgs.length; i += 1) { // array indices
                var arg = node.args[i + 1], // +1 because of opening braket
                index = arg.pt !== "I" ? ("o.vmRound(" + nodeArgs[i] + ")") : nodeArgs[i];
                // can we use fnGetRoundString()?
                indices += "[" + index + "]";
            }
            var varType = this.fnDetermineStaticVarType(name);
            if (varType.length > 1) {
                node.pt = varType.charAt(1);
            }
            node.pv = name + indices;
        };
        CodeGeneratorJs.letter = function (node) {
            node.pv = node.value.toLowerCase();
        };
        CodeGeneratorJs.linenumber = function (node) {
            node.pv = node.value;
        };
        CodeGeneratorJs.prototype.range = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var left = this.fnParseOneArg(node.left).toLowerCase(), right = this.fnParseOneArg(node.right).toLowerCase();
            if (left > right) {
                throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
            }
            node.pv = left + '", "' + right;
        };
        CodeGeneratorJs.prototype.linerange = function (node) {
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            var left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right), leftNumber = Number(left), // "undefined" gets NaN (should we check node.left.type for null?)
            rightNumber = Number(right);
            if (leftNumber > rightNumber) { // comparison with NaN and number is always false
                throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
            }
            var rightSpecified = (right === "undefined") ? "65535" : right; // make sure we set a missing right range parameter
            node.pv = !right ? left : left + ", " + rightSpecified;
        };
        CodeGeneratorJs.string = function (node) {
            var value = node.value;
            value = value.replace(/\\/g, "\\\\"); // escape backslashes
            value = Utils_8.Utils.hexEscape(value);
            node.pt = "$";
            node.pv = '"' + value + '"';
        };
        CodeGeneratorJs.unquoted = function (node) {
            node.pt = "$";
            node.pv = node.value;
        };
        CodeGeneratorJs.fnNull = function (node) {
            node.pv = node.value || "undefined"; // use explicit value or "undefined"
        };
        CodeGeneratorJs.prototype.assign = function (node) {
            // see also "let"
            if (!node.left || !node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
            }
            if (node.left.type !== "identifier") {
                throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
            }
            var name = this.fnParseOneArg(node.left), assignValue = this.fnParseOneArg(node.right);
            this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
            var varType = this.fnDetermineStaticVarType(name);
            var value;
            if (node.pt) {
                if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
                    value = "o.vmRound(" + assignValue + ")";
                    node.pt = "I"; // "R" => "I"
                }
                else {
                    value = assignValue;
                }
            }
            else {
                value = "o.vmAssign(\"" + varType + "\", " + assignValue + ")";
            }
            node.pv = name + " = " + value;
        };
        CodeGeneratorJs.prototype.generateTraceLabel = function (node, tracePrefix, i) {
            var traceLabel = tracePrefix + ((i > 0) ? "t" + i : ""), pos = node.pos, len = node.len || node.value.length || 0;
            this.sourceMap[traceLabel] = [
                pos,
                len
            ];
            return traceLabel;
        };
        CodeGeneratorJs.prototype.label = function (node) {
            var isTraceActive = this.options.trace || Boolean(this.countMap.tron), isResumeNext = Boolean(this.countMap.resumeNext), isResumeNoArgs = Boolean(this.countMap.resumeNoArgsCount);
            var label = node.value;
            this.line = label; // set line before parsing args
            if (this.countMap.resumeNext) {
                this.labelList.push(label); // only needed to support resume next
            }
            this.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct
            var isDirect = label === "direct";
            var value = "";
            if (isDirect) { // special handling for direct
                value = "o.vmGoto(\"directEnd\"); break;\n";
                label = '"direct"';
            }
            if (!this.options.noCodeFrame) {
                value += "case " + label + ":";
                value += " o.line = " + label + ";";
                if (isTraceActive) {
                    value += " o.vmTrace();";
                }
            }
            else {
                value = "";
            }
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var value2 = nodeArgs[i];
                if (value2 !== "") {
                    if (isTraceActive || isResumeNext || isResumeNoArgs) {
                        var traceLabel = this.generateTraceLabel(node.args[i], this.line, i); // side effect: put position in source map
                        if (i > 0) { // only if not first statement in the line
                            if (isResumeNext || isResumeNoArgs) { // eslint-disable-line max-depth
                                value += '\ncase "' + traceLabel + '":';
                            }
                            value += ' o.line = "' + traceLabel + '";';
                            if (isResumeNext) { // eslint-disable-line max-depth
                                this.labelList.push('"' + traceLabel + '"'); // only needed to support resume next
                            }
                        }
                    }
                    if (!(/[}:;\n]$/).test(value2)) { // does not end with } : ; \n
                        value2 += ";";
                    }
                    else if (value2.substring(value2.length - 1) === "\n") {
                        value2 = value2.substring(0, value2.length - 1);
                    }
                    value += " " + value2;
                }
            }
            if (isDirect && !this.options.noCodeFrame) {
                value += "\n o.vmGoto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
            }
            node.pv = value;
        };
        // special keyword functions
        CodeGeneratorJs.prototype.afterEveryGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            this.fnAddReferenceLabel(nodeArgs[2], node.args[2]); // argument 2 = line number
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.cont = function (node) {
            node.pv = "o." + node.type + "(); break;"; // append break
        };
        CodeGeneratorJs.prototype.data = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < node.args.length; i += 1) {
                if (node.args[i].type === "unquoted") {
                    nodeArgs[i] = '"' + nodeArgs[i].replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"'; // escape backslashes and quotes, put in quotes
                }
            }
            var lineString = String(this.line); // TODO: already string?
            if (lineString === "direct") {
                lineString = '"' + lineString + '"';
            }
            nodeArgs.unshift(lineString); // prepend line number
            this.dataList.push("o.data(" + nodeArgs.join(", ") + ")"); // will be set at the beginning of the script
            node.pv = "/* data */";
        };
        CodeGeneratorJs.prototype.def = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
            }
            var savedValue = node.right.value;
            node.right.value = "fn" + savedValue; // prefix with "fn"
            var name = this.fnParseOneArg(node.right);
            node.right.value = savedValue; // restore
            var expressionArg = node.args.pop();
            this.defScopeArgs = {}; // collect DEF scope args
            var nodeArgs = this.fnParseArgs(node.args);
            this.defScopeArgs.collectDone = true; // collection done => now use them
            var expression = this.fnParseOneArg(expressionArg); //this.fnParseOneArg(node.right);
            this.defScopeArgs = undefined;
            this.fnPropagateStaticTypes(node, node.right, expressionArg, "II RR IR RI $$");
            var value;
            if (node.pt) {
                if (node.right.pt === "I" && expressionArg.pt === "R") { // special handing for IR: rounding needed
                    value = "o.vmRound(" + expression + ")";
                    node.pt = "I"; // "R" => "I"
                }
                else {
                    value = expression;
                }
            }
            else {
                var varType = this.fnDetermineStaticVarType(name);
                value = "o.vmAssign(\"" + varType + "\", " + expression + ")";
            }
            value = name + " = function (" + nodeArgs.join(", ") + ") { return " + value + "; };";
            node.pv = value;
        };
        CodeGeneratorJs.prototype.dim = function (node) {
            var args = [];
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            for (var i = 0; i < node.args.length; i += 1) {
                var nodeArg = node.args[i];
                if (nodeArg.type !== "identifier") {
                    throw this.composeError(Error(), "Expected variable in DIM", node.type, node.pos);
                }
                if (!nodeArg.args) {
                    throw this.composeError(Error(), "Programming error: Undefined args", nodeArg.type, nodeArg.pos); // should not occur
                }
                var nodeArgs = this.fnParseArgRange(nodeArg.args, 1, nodeArg.args.length - 2), // we skip open and close bracket
                fullExpression = this.fnParseOneArg(nodeArg), name_5 = CodeGeneratorJs.fnGetNameTypeExpression(fullExpression);
                nodeArgs.unshift(name_5); // put as first arg
                args.push("/* " + fullExpression + " = */ o.dim(" + nodeArgs.join(", ") + ")");
            }
            node.pv = args.join("; ");
        };
        CodeGeneratorJs.prototype.fnDelete = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), name = Utils_8.Utils.supportReservedNames ? ("o." + node.type) : 'o["' + node.type + '"]';
            if (!nodeArgs.length) { // no arguments? => complete range
                nodeArgs.push("1");
                nodeArgs.push("65535");
            }
            node.pv = name + "(" + nodeArgs.join(", ") + "); break;";
        };
        CodeGeneratorJs.prototype.edit = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
        };
        CodeGeneratorJs.prototype.elseComment = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var value = "else"; // not: node.type;
            for (var i = 0; i < node.args.length; i += 1) {
                var token = node.args[i];
                if (token.value) {
                    value += " " + token.value;
                }
            }
            node.pv = "// " + value + "\n";
        };
        CodeGeneratorJs.prototype.erase = function (node) {
            this.defScopeArgs = {}; // collect DEF scope args
            var nodeArgs = this.fnParseArgs(node.args);
            this.defScopeArgs = undefined;
            for (var i = 0; i < nodeArgs.length; i += 1) {
                nodeArgs[i] = '"' + nodeArgs[i] + '"'; // put in quotes
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.error = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break";
        };
        CodeGeneratorJs.prototype.fn = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
            }
            var nodeArgs = this.fnParseArgs(node.args), savedValue = node.right.value;
            node.right.value = "fn" + savedValue; // prefix with "fn"
            var name = this.fnParseOneArg(node.right);
            node.right.value = savedValue; // restore
            if (node.right.pt) {
                node.pt = node.right.pt;
            }
            node.pv = name + "(" + nodeArgs.join(", ") + ")";
        };
        // TODO: complexity
        // eslint-disable-next-line complexity
        CodeGeneratorJs.prototype.fnFor = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), varName = nodeArgs[0], label = this.fnGetForLabel();
            this.stack.forLabel.push(label);
            this.stack.forVarName.push(varName);
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            var startNode = node.args[1], endNode = node.args[2], stepNode = node.args[3]; // optional
            var startValue = nodeArgs[1], endValue = nodeArgs[2], stepValue = stepNode ? nodeArgs[3] : "1"; // default step
            // optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
            var startIsIntConst = CodeGeneratorJs.fnIsIntConst(startValue), endIsIntConst = CodeGeneratorJs.fnIsIntConst(endValue), stepIsIntConst = CodeGeneratorJs.fnIsIntConst(stepValue), varType = this.fnDetermineStaticVarType(varName), type = (varType.length > 1) ? varType.charAt(1) : "";
            if (type === "$") {
                throw this.composeError(Error(), "Type error", node.args[0].value, node.args[0].pos);
            }
            if (!startIsIntConst) {
                if (startNode.pt !== "I") {
                    startValue = "o.vmAssign(\"" + varType + "\", " + startValue + ")"; // assign checks and rounds, if needed
                }
            }
            var endName;
            if (!endIsIntConst) {
                if (endNode.pt !== "I") {
                    endValue = "o.vmAssign(\"" + varType + "\", " + endValue + ")";
                }
                endName = CodeGeneratorJs.fnExtractVarName(varName) + "End";
                this.fnDeclareVariable(endName); // declare also end variable
                endName = "v." + endName;
            }
            if (varName.indexOf("v[") === 0) { // untyped?
                // TODO
            }
            var stepName;
            if (!stepIsIntConst) {
                if (stepNode && stepNode.pt !== "I") {
                    stepValue = "o.vmAssign(\"" + varType + "\", " + stepValue + ")";
                }
                stepName = CodeGeneratorJs.fnExtractVarName(varName) + "Step";
                this.fnDeclareVariable(stepName); // declare also step variable
                stepName = "v." + stepName;
            }
            var value = "/* for() */";
            if (type !== "I" && type !== "R") {
                value += " o.vmAssertNumberType(\"" + varType + "\");"; // do a type check: assert number type
            }
            value += " " + varName + " = " + startValue + ";";
            if (!endIsIntConst) {
                value += " " + endName + " = " + endValue + ";";
            }
            if (!stepIsIntConst) {
                value += " " + stepName + " = " + stepValue + ";";
            }
            value += " o.vmGoto(\"" + label + "b\"); break;";
            value += "\ncase \"" + label + "\": ";
            value += varName + " += " + (stepIsIntConst ? stepValue : stepName) + ";";
            value += "\ncase \"" + label + "b\": ";
            var endNameOrValue = endIsIntConst ? endValue : endName;
            if (stepIsIntConst) {
                if (Number(stepValue) > 0) {
                    value += "if (" + varName + " > " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
                }
                else if (Number(stepValue) < 0) {
                    value += "if (" + varName + " < " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
                }
                else { // stepValue === 0 => endless loop, if starting with variable !== end
                    value += "if (" + varName + " === " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
                }
            }
            else {
                value += "if (" + stepName + " > 0 && " + varName + " > " + endNameOrValue + " || " + stepName + " < 0 && " + varName + " < " + endNameOrValue + " || !" + stepName + " && " + varName + " === " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.gosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), label = this.fnGetGosubLabel();
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            node.pv = "o." + node.type + '("' + label + '", ' + nodeArgs.join(", ") + '); break;\ncase "' + label + '":';
        };
        CodeGeneratorJs.prototype.gotoOrResume = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break"; // with break
        };
        CodeGeneratorJs.prototype.fnThenOrElsePart = function (args, tracePrefix) {
            var isTraceActive = this.options.trace, isResumeNext = Boolean(this.countMap.resumeNext), isResumeNoArgs = Boolean(this.countMap.resumeNoArgsCount), nodeArgs = this.fnParseArgs(args);
            if (args.length && args[0].type === "linenumber") {
                var line = nodeArgs[0];
                this.fnAddReferenceLabel(line, args[0]);
                nodeArgs[0] = "o.goto(" + line + "); break"; // convert to "goto"
            }
            if (isTraceActive || isResumeNext || isResumeNoArgs) {
                for (var i = 0; i < nodeArgs.length; i += 1) {
                    var traceLabel = this.generateTraceLabel(args[i], tracePrefix, i);
                    var value = "";
                    if (isResumeNext || isResumeNoArgs) {
                        value += '\ncase "' + traceLabel + '":';
                    }
                    if (isResumeNext) {
                        this.labelList.push('"' + traceLabel + '"'); // only needed to support resume next
                    }
                    value += ' o.line = "' + traceLabel + '";';
                    nodeArgs[i] = value + " " + nodeArgs[i];
                }
            }
            return nodeArgs.join("; ");
        };
        CodeGeneratorJs.fnIsSimplePart = function (part) {
            var partNoTrailingBreak = part.replace(/; break$/, ""), simplePart = !(/case|break/).test(partNoTrailingBreak);
            return simplePart;
        };
        CodeGeneratorJs.prototype.fnIf = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
            }
            var expression = this.fnParseOneArg(node.right);
            if (expression.endsWith(" ? -1 : 0")) { // optimize simple expression
                expression = expression.replace(/ \? -1 : 0$/, "");
            }
            var label = this.fnGetIfLabel(), // need it also for tracing nested if
            elseArgs = node.args.length && node.args[node.args.length - 1].type === "else" ? node.args.pop().args : undefined, elsePart = elseArgs ? this.fnThenOrElsePart(elseArgs, label + "E") : "", thenPart = this.fnThenOrElsePart(node.args, label + "T"), // "then"/"goto" statements
            simpleThen = CodeGeneratorJs.fnIsSimplePart(thenPart), simpleElse = elsePart ? CodeGeneratorJs.fnIsSimplePart(elsePart) : true;
            var value = "if (" + expression + ") { ";
            if (simpleThen && simpleElse) {
                value += thenPart + "; }";
                if (elsePart) {
                    value += " else { " + elsePart + "; }";
                }
            }
            else {
                value += 'o.vmGoto("' + label + '"); break; } ';
                if (elsePart !== "") { // "else" statements?
                    value += "/* else */ " + elsePart + "; ";
                }
                value += 'o.vmGoto("' + label + 'e"); break;\ncase "' + label + '": ' + thenPart + ';\ncase "' + label + 'e": ';
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.inputOrlineInput = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), varTypes = [], label = this.fnGetStopLabel();
            if (nodeArgs.length < 4) {
                throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos); // should not occur
            }
            var stream = nodeArgs[0];
            var noCRLF = nodeArgs[1];
            if (noCRLF === ";") { // ; or null
                noCRLF = '"' + noCRLF + '"';
            }
            var msg = nodeArgs[2];
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            if (node.args[2].type === "null") { // message type
                msg = '""';
            }
            var prompt = nodeArgs[3];
            if (prompt === ";" || node.args[3].type === "null") { // ";" => insert prompt "? " in quoted string
                msg = msg.substring(0, msg.length - 1) + "? " + msg.substr(-1, 1);
            }
            for (var i = 4; i < nodeArgs.length; i += 1) {
                varTypes[i - 4] = this.fnDetermineStaticVarType(nodeArgs[i]);
            }
            var value = "o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input
            var label2 = this.fnGetStopLabel();
            value += "o." + node.type + "(" + stream + ", " + noCRLF + ", " + msg + ", \"" + varTypes.join('", "') + "\"); o.vmGoto(\"" + label2 + "\"); break;\ncase \"" + label2 + "\":";
            for (var i = 4; i < nodeArgs.length; i += 1) {
                value += "; " + nodeArgs[i] + " = o.vmGetNextInput()";
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.let = function (node) {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
            }
            this.assign(node.right);
            node.pv = node.right.pv;
            node.pt = node.right.pt; // TODO: Do we need this?
        };
        CodeGeneratorJs.prototype.list = function (node) {
            var nodeArgs = this.fnParseArgs(node.args); // or: fnCommandWithGoto
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
            }
            if (!node.args.length || node.args[node.args.length - 1].type === "#") { // last parameter stream? or no parameters?
                var stream = nodeArgs.pop() || "0";
                nodeArgs.unshift(stream); // put it first
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
        };
        CodeGeneratorJs.prototype.mid$Assign = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length < 4) {
                nodeArgs.splice(2, 0, "undefined"); // set empty length
            }
            var name = nodeArgs[0], varType = this.fnDetermineStaticVarType(name);
            node.pv = name + " = o.vmAssign(\"" + varType + "\", o.mid$Assign(" + nodeArgs.join(", ") + "))";
        };
        CodeGeneratorJs.fnNew = function (node) {
            var name = Utils_8.Utils.supportReservedNames ? ("o." + node.type) : 'o["' + node.type + '"]';
            node.pv = name + "();";
        };
        CodeGeneratorJs.prototype.next = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (!nodeArgs.length) {
                nodeArgs.push(""); // we have no variable, so use empty argument
            }
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var label = this.stack.forLabel.pop(), varName = this.stack.forVarName.pop();
                var errorNode = void 0;
                if (label === undefined) {
                    if (nodeArgs[i] === "") { // inserted node?
                        errorNode = node;
                    }
                    else { // identifier arg
                        errorNode = node.args[i];
                    }
                    throw this.composeError(Error(), "Unexpected NEXT", errorNode.type, errorNode.pos);
                }
                if (nodeArgs[i] !== "" && nodeArgs[i] !== varName) {
                    errorNode = node.args[i];
                    throw this.composeError(Error(), "Unexpected NEXT variable", errorNode.value, errorNode.pos);
                }
                nodeArgs[i] = "/* " + node.type + "(\"" + nodeArgs[i] + "\") */ o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
            }
            node.pv = nodeArgs.join("; ");
        };
        CodeGeneratorJs.prototype.onBreakGosubOrRestore = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.onErrorGoto = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                if (Number(nodeArgs[i])) { // only for lines > 0
                    this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
                }
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.onGosubOnGoto = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), label = node.type === "onGosub" ? this.fnGetGosubLabel() : this.fnGetStopLabel();
            for (var i = 1; i < nodeArgs.length; i += 1) { // starting with 1
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            nodeArgs.unshift('"' + label + '"');
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + '); break;\ncase "' + label + '":';
        };
        CodeGeneratorJs.prototype.onSqGosub = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
            }
            var sqArgs = this.fnParseArgs(node.right.args);
            nodeArgs.unshift(sqArgs[0]);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.print = function (node) {
            var args = node.args, nodeArgs = [];
            var newLine = true;
            for (var i = 0; i < args.length; i += 1) {
                var arg = args[i];
                var argString = this.fnParseOneArg(arg);
                if (i === args.length - 1) {
                    if (arg.type === ";" || arg.type === "," || arg.type === "spc" || arg.type === "tab") {
                        newLine = false;
                    }
                }
                if (arg.type === ",") { // comma tab
                    argString = "{type: \"commaTab\", args: []}"; // we must delay the commaTab() call until print() is called
                    nodeArgs.push(argString);
                }
                else if (arg.type !== ";") { // ignore ";" separators
                    nodeArgs.push(argString);
                }
            }
            if (newLine) {
                var arg2 = '"\\r\\n"';
                nodeArgs.push(arg2);
            }
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.randomize = function (node) {
            var value;
            if (node.args.length) {
                var nodeArgs = this.fnParseArgs(node.args);
                value = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
            }
            else {
                var label = this.fnGetStopLabel();
                value = "o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input
                value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
            }
            node.pv = value;
        };
        CodeGeneratorJs.prototype.read = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            for (var i = 0; i < nodeArgs.length; i += 1) {
                var name_6 = nodeArgs[i], varType = this.fnDetermineStaticVarType(name_6);
                nodeArgs[i] = name_6 + " = o." + node.type + "(\"" + varType + "\")";
            }
            node.pv = nodeArgs.join("; ");
        };
        CodeGeneratorJs.prototype.rem = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "//" + nodeArgs.join("") + "\n";
        };
        CodeGeneratorJs.prototype.apostrophe = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            if (nodeArgs.length && !nodeArgs[0].startsWith(" ")) {
                nodeArgs[0] = " " + nodeArgs[0]; // add extra space
            }
            node.pv = "//" + nodeArgs.join("") + "\n";
        };
        CodeGeneratorJs.fnReturn = function (node) {
            var name = Utils_8.Utils.supportReservedNames ? ("o." + node.type) : 'o["' + node.type + '"]';
            node.pv = name + "(); break;";
        };
        CodeGeneratorJs.prototype.run = function (node) {
            if (node.args.length) {
                if (node.args[0].type === "linenumber" || node.args[0].type === "number") { // optional line number, should be linenumber only
                    this.fnAddReferenceLabel(this.fnParseOneArg(node.args[0]), node.args[0]); // parse only one arg, args are parsed later
                }
            }
            node.pv = this.fnCommandWithGoto(node);
        };
        CodeGeneratorJs.prototype.save = function (node) {
            var nodeArgs = [];
            if (node.args.length) {
                var fileName = this.fnParseOneArg(node.args[0]);
                nodeArgs.push(fileName);
                if (node.args.length > 1) {
                    this.defScopeArgs = {}; // collect DEF scope args
                    var type = '"' + this.fnParseOneArg(node.args[1]) + '"';
                    this.defScopeArgs = undefined;
                    nodeArgs.push(type);
                    var nodeArgs2 = node.args.slice(2), // get remaining args
                    nodeArgs3 = this.fnParseArgs(nodeArgs2);
                    nodeArgs = nodeArgs.concat(nodeArgs3);
                }
            }
            node.pv = this.fnCommandWithGoto(node, nodeArgs);
        };
        CodeGeneratorJs.prototype.spc = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "{type: \"spc\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
        };
        CodeGeneratorJs.prototype.stopOrEnd = function (node) {
            var label = this.fnGetStopLabel();
            node.pv = "o." + node.type + "(\"" + label + "\"); break;\ncase \"" + label + "\":";
        };
        CodeGeneratorJs.prototype.tab = function (node) {
            var nodeArgs = this.fnParseArgs(node.args);
            node.pv = "{type: \"tab\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
        };
        CodeGeneratorJs.prototype.usingOrWrite = function (node) {
            var nodeArgs = this.fnParseArgsIgnoringCommaSemi(node.args);
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        };
        CodeGeneratorJs.prototype.wend = function (node) {
            var label = this.stack.whileLabel.pop();
            if (label === undefined) {
                throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
            }
            node.pv = "/* o." + node.type + "() */ o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
        };
        CodeGeneratorJs.prototype.fnWhile = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), label = this.fnGetWhileLabel();
            this.stack.whileLabel.push(label);
            node.pv = "\ncase \"" + label + "\": if (!(" + nodeArgs + ")) { o.vmGoto(\"" + label + "e\"); break; }";
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorJs.prototype.fnParseOther = function (node) {
            var nodeArgs = this.fnParseArgs(node.args), typeWithSpaces = " " + node.type + " ";
            node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
            if (CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", typeWithSpaces)) {
                node.pt = "I";
            }
            else if (CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 pi rnd round sin sqr tan time val ", typeWithSpaces)) {
                node.pt = "R";
            }
            else if (CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", typeWithSpaces)) {
                node.pt = "$";
            }
            // Note: min and max usually return a number, but for a single string argument also the string!
            if (node.type === "min" || node.type === "max") {
                if (node.args.length === 1) {
                    if (node.args[0].type === "$") {
                        node.pt = "$";
                    }
                }
                else if (node.args.length > 1) {
                    node.pt = "R";
                }
            }
        };
        CodeGeneratorJs.prototype.parseOperator = function (node) {
            var operators = this.allOperators;
            if (node.left) {
                this.parseNode(node.left);
                if (operators[node.left.type] && node.left.left) { // binary operator?
                    node.left.pv = "(" + node.left.pv + ")";
                }
                if (!node.right) {
                    throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
                }
                this.parseNode(node.right);
                if (operators[node.right.type] && node.right.left) { // binary operator?
                    node.right.pv = "(" + node.right.pv + ")";
                }
                operators[node.type].call(this, node, node.left, node.right);
            }
            else {
                if (!node.right) {
                    throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
                }
                this.parseNode(node.right);
                this.unaryOperators[node.type].call(this, node, undefined, node.right); // unary operator: we just use node.right
            }
        };
        CodeGeneratorJs.prototype.parseNode = function (node) {
            if (Utils_8.Utils.debug > 3) {
                Utils_8.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            if (this.allOperators[node.type]) {
                this.parseOperator(node);
            }
            else if (this.parseFunctions[node.type]) { // function with special handling?
                this.parseFunctions[node.type].call(this, node);
            }
            else { // for other functions, generate code directly
                this.fnParseOther(node);
            }
        };
        CodeGeneratorJs.fnCommentUnusedCases = function (output, labels) {
            return output.replace(/^case (\d+):/gm, function (all, line) {
                return (labels[line]) ? all : "/* " + all + " */";
            });
        };
        CodeGeneratorJs.prototype.fnCheckLabel = function (node, lastLine) {
            var label = node.value;
            if (label === "") {
                if (this.options.implicitLines) {
                    label = String(lastLine + 1); // no line => we just increase the last line by 1
                    node.value = label; // we also modify the parse tree
                }
                else {
                    throw this.composeError(Error(), "Direct command found", label, node.pos);
                }
            }
            var lineNumber = Number(label);
            if ((lineNumber | 0) !== lineNumber) { // eslint-disable-line no-bitwise
                throw this.composeError(Error(), "Expected integer line number", label, node.pos);
            }
            if (lineNumber < 1 || lineNumber > 65535) {
                throw this.composeError(Error(), "Line number overflow", label, node.pos);
            }
            if (lineNumber <= lastLine) {
                throw this.composeError(Error(), "Expected increasing line number", label, node.pos);
            }
            return label;
        };
        CodeGeneratorJs.prototype.fnCreateLabelMap = function (nodes, labels) {
            var lastLine = 0;
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                if (node.type === "label" && node.value !== "direct") {
                    var label = this.fnCheckLabel(node, lastLine);
                    if (label) {
                        labels[label] = 0; // init call count
                        lastLine = Number(label);
                    }
                }
            }
        };
        CodeGeneratorJs.prototype.removeAllDefVarTypes = function () {
            var varTypes = this.defintDefstrTypes;
            for (var name_7 in varTypes) { // eslint-disable-line guard-for-in
                delete varTypes[name_7];
            }
        };
        CodeGeneratorJs.prototype.fnSetDefVarTypeRange = function (type, first, last) {
            var firstNum = first.charCodeAt(0), lastNum = last.charCodeAt(0);
            for (var i = firstNum; i <= lastNum; i += 1) {
                var varChar = String.fromCharCode(i);
                this.defintDefstrTypes[varChar] = type;
            }
        };
        CodeGeneratorJs.prototype.fnPrecheckDefintDefstr = function (node) {
            if (node.args) {
                var type = node.type === "defint" ? "I" : "$";
                for (var i = 0; i < node.args.length; i += 1) {
                    var arg = node.args[i];
                    if (arg.type === "letter") {
                        this.defintDefstrTypes[arg.value.toLowerCase()] = type;
                    }
                    else { // assuming range
                        if (!arg.left || !arg.right) {
                            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
                        }
                        this.fnSetDefVarTypeRange(type, arg.left.value.toLowerCase(), arg.right.value.toLowerCase());
                    }
                }
            }
        };
        CodeGeneratorJs.prototype.fnPrecheckTree = function (nodes, countMap) {
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                countMap[node.type] = (countMap[node.type] || 0) + 1;
                if (node.type === "defint" || node.type === "defstr") {
                    if (node.args) {
                        this.fnPrecheckDefintDefstr(node);
                    }
                }
                if (node.type === "resume" && !(node.args && node.args.length)) {
                    var resumeNoArgs = "resumeNoArgsCount";
                    countMap[resumeNoArgs] = (countMap[resumeNoArgs] || 0) + 1;
                }
                if (node.args) {
                    this.fnPrecheckTree(node.args, countMap); // recursive
                }
                /*
                if (node.args2) { // for "ELSE"
                    this.fnPrecheckTree(node.args2, countMap); // recursive
                }
                */
            }
        };
        //
        // evaluate
        //
        CodeGeneratorJs.prototype.evaluate = function (parseTree, variables) {
            this.variables = variables;
            this.defScopeArgs = undefined;
            // create labels map
            this.fnCreateLabelMap(parseTree, this.referencedLabelsCount);
            this.removeAllDefVarTypes();
            this.fnPrecheckTree(parseTree, this.countMap); // also sets "resumeNoArgsCount" for resume without args
            var output = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_8.Utils.debug > 2) {
                    Utils_8.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var line = this.fnParseOneArg(parseTree[i]);
                if ((line !== undefined) && (line !== "")) {
                    if (line !== null) {
                        if (output.length === 0) {
                            output = line;
                        }
                        else {
                            output += "\n" + line;
                        }
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            // optimize: comment lines which are not referenced
            if (!this.countMap.merge && !this.countMap.chainMerge && !this.countMap.resumeNext && !this.countMap.resumeNoArgsCount) {
                output = CodeGeneratorJs.fnCommentUnusedCases(output, this.referencedLabelsCount);
            }
            return output;
        };
        CodeGeneratorJs.combineData = function (data) {
            return data.length ? data.join(";\n") + ";\n" : "";
        };
        CodeGeneratorJs.combineLabels = function (data) {
            return data.length ? "o.vmSetLabels([" + data.join(",") + "]);\n" : "";
        };
        CodeGeneratorJs.prototype.getSourceMap = function () {
            return this.sourceMap;
        };
        CodeGeneratorJs.prototype.debugGetLabelsCount = function () {
            return Object.keys(this.referencedLabelsCount).length;
        };
        CodeGeneratorJs.prototype.generate = function (input, variables, allowDirect) {
            var out = {
                text: ""
            };
            this.reset();
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens);
                if (allowDirect && parseTree.length) {
                    var lastLine = parseTree[parseTree.length - 1];
                    if (lastLine.type === "label" && lastLine.value === "") {
                        lastLine.value = "direct";
                    }
                }
                var output = this.evaluate(parseTree, variables);
                var combinedData = CodeGeneratorJs.combineData(this.dataList), combinedLabels = CodeGeneratorJs.combineLabels(this.labelList);
                if (!this.options.noCodeFrame) {
                    output = '"use strict"\n'
                        + "var v=o.vmGetAllVariables();\n"
                        + "var t=o.vmGetAllVarTypes();\n"
                        + "while (o.vmLoopCondition()) {\nswitch (o.line) {\ncase 0:\n"
                        + combinedData
                        + combinedLabels
                        + " o.vmGoto(o.startLine ? o.startLine : \"start\"); break;\ncase \"start\":\n"
                        + output
                        + "\ncase \"end\": o.line=\"end\"; o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.vmGoto(\"end\"); break;\n}}\n";
                }
                else {
                    output = combinedData + output;
                }
                out.text = output;
            }
            catch (e) {
                if (Utils_8.Utils.isCustomError(e)) {
                    out.error = e;
                    if (!this.options.quiet) {
                        Utils_8.Utils.console.warn(e); // show our customError as warning
                    }
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_8.Utils.console.error(e);
                }
            }
            return out;
        };
        // ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
        CodeGeneratorJs.jsKeywords = [
            "do",
            "if",
            "in",
            "for",
            "int",
            "new",
            "try",
            "var",
            "byte",
            "case",
            "char",
            "else",
            "enum",
            "goto",
            "long",
            "null",
            "this",
            "true",
            "void",
            "with",
            "break",
            "catch",
            "class",
            "const",
            "false",
            "final",
            "float",
            "short",
            "super",
            "throw",
            "while",
            "delete",
            "double",
            "export",
            "import",
            "native",
            "public",
            "return",
            "static",
            "switch",
            "throws",
            "typeof",
            "boolean",
            "default",
            "extends",
            "finally",
            "package",
            "private",
            "abstract",
            "continue",
            "debugger",
            "function",
            "volatile",
            "interface",
            "protected",
            "transient",
            "implements",
            "instanceof",
            "synchronized"
        ];
        CodeGeneratorJs.varTypeMap = {
            "!": "R",
            "%": "I",
            $: "$" // or "S"?
        };
        return CodeGeneratorJs;
    }());
    exports.CodeGeneratorJs = CodeGeneratorJs;
});
// CodeGeneratorToken.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
define("CodeGeneratorToken", ["require", "exports", "Utils"], function (require, exports, Utils_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGeneratorToken = void 0;
    var CodeGeneratorToken = /** @class */ (function () {
        function CodeGeneratorToken(options) {
            this.label = ""; // current line (label)
            /* eslint-disable no-invalid-this */
            this.parseFunctions = {
                args: this.fnArgs,
                range: this.range,
                linerange: this.linerange,
                string: CodeGeneratorToken.string,
                ustring: CodeGeneratorToken.ustring,
                "(eol)": CodeGeneratorToken.fnEol,
                number: CodeGeneratorToken.number,
                expnumber: CodeGeneratorToken.number,
                binnumber: CodeGeneratorToken.binnumber,
                hexnumber: CodeGeneratorToken.hexnumber,
                identifier: this.identifier,
                linenumber: CodeGeneratorToken.linenumber,
                label: this.fnLabel,
                "|": this.vertical,
                "else": this.fnElseOrApostrophe,
                elseComment: this.elseComment,
                onBreakCont: this.onBreakContOrGosubOrStop,
                onBreakGosub: this.onBreakContOrGosubOrStop,
                onBreakStop: this.onBreakContOrGosubOrStop,
                onErrorGoto: this.onErrorGoto,
                onSqGosub: this.onSqGosub,
                "'": this.fnElseOrApostrophe
            };
            this.options = {
                lexer: options.lexer,
                parser: options.parser,
                implicitLines: false,
                quiet: false
            };
            this.setOptions(options);
        }
        CodeGeneratorToken.prototype.setOptions = function (options) {
            if (options.implicitLines !== undefined) {
                this.options.implicitLines = options.implicitLines;
            }
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
        };
        CodeGeneratorToken.prototype.getOptions = function () {
            return this.options;
        };
        CodeGeneratorToken.prototype.composeError = function (error, message, value, pos) {
            return Utils_9.Utils.composeError("CodeGeneratorToken", error, message, value, pos, undefined, this.label);
        };
        CodeGeneratorToken.convUInt8ToString = function (n) {
            return String.fromCharCode(n);
        };
        CodeGeneratorToken.convUInt16ToString = function (n) {
            return String.fromCharCode(n & 0xff) + String.fromCharCode(n >> 8); // eslint-disable-line no-bitwise
        };
        CodeGeneratorToken.convInt32ToString = function (n) {
            return CodeGeneratorToken.convUInt16ToString(n & 0xffff) + CodeGeneratorToken.convUInt16ToString((n >> 16) & 0xffff); // eslint-disable-line no-bitwise
        };
        CodeGeneratorToken.token2String = function (name) {
            var token = CodeGeneratorToken.tokens[name], result = "";
            if (token === undefined) {
                token = CodeGeneratorToken.tokensFF[name];
                if (token === undefined) {
                    Utils_9.Utils.console.error("token2String: Not a token: " + name);
                    return name; // return something
                }
                result = CodeGeneratorToken.convUInt8ToString(0xff); // prefix for special tokens
            }
            return result + CodeGeneratorToken.convUInt8ToString(token);
        };
        CodeGeneratorToken.getBit7TerminatedString = function (s) {
            return s.substring(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) | 0x80); // eslint-disable-line no-bitwise
        };
        CodeGeneratorToken.fnGetWs = function (node) {
            return node.ws || "";
        };
        CodeGeneratorToken.prototype.fnParseArgs = function (args) {
            var nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
            if (!args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            for (var i = 0; i < args.length; i += 1) {
                nodeArgs.push(this.parseNode(args[i]));
            }
            return nodeArgs;
        };
        CodeGeneratorToken.prototype.fnArgs = function (node) {
            return this.fnParseArgs(node.args).join(node.value);
        };
        CodeGeneratorToken.prototype.range = function (node) {
            return this.parseNode(node.left) + CodeGeneratorToken.fnGetWs(node) + node.value + this.parseNode(node.right);
        };
        CodeGeneratorToken.prototype.linerange = function (node) {
            return this.parseNode(node.left) + CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.value) + this.parseNode(node.right);
        };
        CodeGeneratorToken.string = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + '"' + node.value + '"';
        };
        CodeGeneratorToken.ustring = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + '"' + node.value; // unterminated string
        };
        CodeGeneratorToken.fnEol = function () {
            return "";
        };
        CodeGeneratorToken.floatToByteString = function (number) {
            var mantissa = 0, exponent = 0, sign = 0;
            if (number !== 0) {
                if (number < 0) {
                    sign = 0x80000000;
                    number = -number;
                }
                exponent = Math.ceil(Math.log(number) / Math.log(2));
                mantissa = Math.round(number / Math.pow(2, exponent - 32)) & ~0x80000000; // eslint-disable-line no-bitwise
                if (mantissa === 0) {
                    exponent += 1;
                }
                exponent += 0x80;
            }
            return CodeGeneratorToken.convInt32ToString(sign + mantissa) + CodeGeneratorToken.convUInt8ToString(exponent);
        };
        CodeGeneratorToken.number = function (node) {
            var numberString = node.value.toUpperCase(), // maybe "e" inside
            number = Number(numberString);
            var result = "";
            if (number === Math.floor(number)) { // integer?
                if (number >= 0 && number <= 9) { // integer number constant 0-9? (not sure when 10 is used)
                    result = CodeGeneratorToken.token2String(numberString);
                }
                else if (number >= 10 && number <= 0xff) {
                    result = CodeGeneratorToken.token2String("_dec8") + CodeGeneratorToken.convUInt8ToString(number);
                }
                else if (number >= -0x7fff && number <= 0x7fff) {
                    result = (number < 0 ? CodeGeneratorToken.token2String("-") : "") + CodeGeneratorToken.token2String("_dec16") + CodeGeneratorToken.convUInt16ToString(number);
                }
            }
            if (result === "") { // no integer number yet, use float...
                result = CodeGeneratorToken.token2String("_float") + CodeGeneratorToken.floatToByteString(number);
            }
            return CodeGeneratorToken.fnGetWs(node) + result;
        };
        CodeGeneratorToken.binnumber = function (node) {
            var valueString = node.value.slice(2), // remove &x
            value = (valueString.length) ? parseInt(valueString, 2) : 0; // we convert it to dec
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_bin16") + CodeGeneratorToken.convUInt16ToString(value);
        };
        CodeGeneratorToken.hexnumber = function (node) {
            var valueString = node.value.slice(1); // remove &
            if (valueString.charAt(0).toLowerCase() === "h") { // optional h
                valueString = valueString.slice(1); // remove
            }
            var value = (valueString.length) ? parseInt(valueString, 16) : 0; // we convert it to dec
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_hex16") + CodeGeneratorToken.convUInt16ToString(value);
        };
        CodeGeneratorToken.prototype.identifier = function (node) {
            var name = node.value, // keep case, maybe mixed
            mappedTypeName = CodeGeneratorToken.varTypeMap[name.charAt(name.length - 1)] || ""; // map last char
            if (mappedTypeName) {
                name = name.slice(0, -1); // remove type char
            }
            else {
                mappedTypeName = "_anyVar";
            }
            var offset = 0; // (offset to memory location of variable; not used here)
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(mappedTypeName) + CodeGeneratorToken.convUInt16ToString(offset) + CodeGeneratorToken.getBit7TerminatedString(name) + (node.args ? this.fnParseArgs(node.args).join("") : "");
        };
        CodeGeneratorToken.linenumber = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_line16") + CodeGeneratorToken.convUInt16ToString(Number(node.value));
        };
        CodeGeneratorToken.prototype.fnLabel = function (node) {
            if (this.options.implicitLines) {
                if (node.value === "") { // direct
                    node.value = String(Number(this.label) + 1);
                }
            }
            this.label = node.value; // set line before parsing args
            var line = Number(this.label), nodeArgs = this.fnParseArgs(node.args);
            var value = nodeArgs.join("");
            if (node.value !== "") { // direct
                if (value.charAt(0) === " ") { // remove one space (implicit space after label)
                    value = value.substring(1);
                }
                value = CodeGeneratorToken.convUInt16ToString(line) + value + CodeGeneratorToken.token2String("_eol"); // no ws
                value = CodeGeneratorToken.convUInt16ToString(value.length + 2) + value;
            }
            return value;
        };
        // special keyword functions
        CodeGeneratorToken.prototype.vertical = function (node) {
            var rsxName = node.value.substring(1).toUpperCase(), nodeArgs = this.fnParseArgs(node.args), offset = 0; // offset to tokens following RSX name
            // if rsxname.length=0 we take 0x80 from empty getBit7TerminatedString
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + (rsxName.length ? CodeGeneratorToken.convUInt8ToString(offset) : "") + CodeGeneratorToken.getBit7TerminatedString(rsxName) + nodeArgs.join("");
        };
        CodeGeneratorToken.prototype.fnElseOrApostrophe = function (node) {
            // prefix token with ":"
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(":") + CodeGeneratorToken.token2String(node.type) + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorToken.prototype.elseComment = function (node) {
            if (!node.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
            }
            var type = "else"; // not "elseComment"
            var value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(":") + CodeGeneratorToken.token2String(type); // always prefix with ":"
            var args = node.args;
            // we do not have a parse tree here but a simple list
            for (var i = 0; i < args.length; i += 1) {
                var token = args[i];
                var value2 = token.value;
                if (value2) {
                    if (token.type === "linenumber") {
                        value2 = CodeGeneratorToken.linenumber(token);
                    }
                    value += value2;
                }
            }
            return value;
        };
        CodeGeneratorToken.prototype.onBreakContOrGosubOrStop = function (node) {
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_onBreak") + (node.right && node.right.right ? this.parseNode(node.right.right) : "") + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorToken.prototype.onErrorGoto = function (node) {
            if (node.args && node.args.length && node.args[0].value === "0") { // on error goto 0?
                return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_onErrorGoto0");
            }
            return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("on") + this.parseNode(node.right) + this.fnParseArgs(node.args).join("");
        };
        CodeGeneratorToken.prototype.onSqGosub = function (node) {
            return CodeGeneratorToken.token2String("_onSq") + this.fnParseArgs(node.right.args).join("") + this.fnParseArgs(node.args).join("");
        };
        /* eslint-enable no-invalid-this */
        CodeGeneratorToken.prototype.fnParseOther = function (node) {
            var type = node.type, isToken = CodeGeneratorToken.tokens[type] !== undefined || CodeGeneratorToken.tokensFF[type] !== undefined;
            var value = ""; // CodeGeneratorToken.fnGetWs(node);
            if (node.left) {
                value += this.parseNode(node.left);
            }
            value += CodeGeneratorToken.fnGetWs(node);
            if (isToken) {
                value += CodeGeneratorToken.token2String(type);
            }
            else if (node.value) { // e.g. string,...
                value += node.value;
            }
            if (node.right) {
                value += this.parseNode(node.right);
            }
            if (node.args) {
                value += this.fnParseArgs(node.args).join("");
            }
            return value;
        };
        CodeGeneratorToken.prototype.parseNode = function (node) {
            if (Utils_9.Utils.debug > 3) {
                Utils_9.Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
            }
            var type = node.type;
            var value;
            if (node.len === 0 && type !== "label") { // ignore dummy token, e.g. '#' (but not label)
                value = "";
            }
            else {
                value = this.parseFunctions[type] ? this.parseFunctions[type].call(this, node) : this.fnParseOther(node);
                // function with special handling or other type
            }
            if (Utils_9.Utils.debug > 2) {
                Utils_9.Utils.console.debug("parseNode: type='" + type + "', value='" + node.value + "', ws='" + node.ws + "', resultValue='" + value + "'");
            }
            return value;
        };
        CodeGeneratorToken.prototype.evaluate = function (parseTree) {
            var output = "";
            for (var i = 0; i < parseTree.length; i += 1) {
                if (Utils_9.Utils.debug > 2) {
                    Utils_9.Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
                }
                var node = this.parseNode(parseTree[i]);
                if ((node !== undefined) && (node !== "")) {
                    if (node !== null) {
                        output += node;
                    }
                    else {
                        output = ""; // cls (clear output when node is set to null)
                    }
                }
            }
            if (output.length && this.label) {
                output += CodeGeneratorToken.token2String("_eol") + CodeGeneratorToken.token2String("_eol"); // 2 times eol is eof
            }
            return output;
        };
        CodeGeneratorToken.prototype.generate = function (input) {
            var out = {
                text: ""
            };
            this.label = "";
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.evaluate(parseTree);
                out.text = output;
            }
            catch (e) {
                if (Utils_9.Utils.isCustomError(e)) {
                    out.error = e;
                    if (!this.options.quiet) {
                        Utils_9.Utils.console.warn(e); // show our customError as warning
                    }
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_9.Utils.console.error(e);
                }
            }
            return out;
        };
        CodeGeneratorToken.tokens = {
            _eol: 0x00,
            ":": 0x01,
            _intVar: 0x02,
            _stringVar: 0x03,
            _floatVar: 0x04,
            // "": 0x05, // "var?"
            // "": 0x06, // "var?"
            // "": 0x07, // "var?"
            // "": 0x08, // "var?"
            // "": 0x09, // "var?"
            // "": 0x0a, // "var?"
            // "": 0x0b, // integer variable definition (no suffix)
            // "": 0x0c, // string variable definition (no suffix)
            _anyVar: 0x0d,
            0: 0x0e,
            1: 0x0f,
            2: 0x10,
            3: 0x11,
            4: 0x12,
            5: 0x13,
            6: 0x14,
            7: 0x15,
            8: 0x16,
            9: 0x17,
            10: 0x18,
            _dec8: 0x19,
            _dec16: 0x1a,
            _bin16: 0x1b,
            _hex16: 0x1c,
            // "": 0x1d, // 16-bit BASIC program line memory address pointer (should not occur)
            _line16: 0x1e,
            _float: 0x1f,
            // 0x20-0x21 ASCII printable symbols (space, "!")
            // "": 0x22, // '"' quoted string value
            // 0x23-0x7b ASCII printable symbols
            "#": 0x23,
            "(": 0x28,
            ")": 0x29,
            ",": 0x2c,
            "?": 0x3f,
            "@": 0x40,
            "[": 0x5b,
            "]": 0x5d,
            "|": 0x7c,
            after: 0x80,
            afterGosub: 0x80,
            auto: 0x81,
            border: 0x82,
            call: 0x83,
            cat: 0x84,
            chain: 0x85,
            chainMerge: 0x85,
            clear: 0x86,
            clearInput: 0x86,
            clg: 0x87,
            closein: 0x88,
            closeout: 0x89,
            cls: 0x8a,
            cont: 0x8b,
            data: 0x8c,
            def: 0x8d,
            defint: 0x8e,
            defreal: 0x8f,
            defstr: 0x90,
            deg: 0x91,
            "delete": 0x92,
            dim: 0x93,
            draw: 0x94,
            drawr: 0x95,
            edit: 0x96,
            "else": 0x97,
            end: 0x98,
            ent: 0x99,
            env: 0x9a,
            erase: 0x9b,
            error: 0x9c,
            every: 0x9d,
            everyGosub: 0x9d,
            "for": 0x9e,
            gosub: 0x9f,
            "goto": 0xa0,
            "if": 0xa1,
            ink: 0xa2,
            input: 0xa3,
            key: 0xa4,
            keyDef: 0xa4,
            let: 0xa5,
            line: 0xa6,
            lineInput: 0xa6,
            list: 0xa7,
            load: 0xa8,
            locate: 0xa9,
            memory: 0xaa,
            merge: 0xab,
            mid$: 0xac,
            mid$Assign: 0xac,
            mode: 0xad,
            move: 0xae,
            mover: 0xaf,
            next: 0xb0,
            "new": 0xb1,
            on: 0xb2,
            _onBreak: 0xb3,
            _onErrorGoto0: 0xb4,
            onGosub: 0xb2,
            onGoto: 0xb2,
            _onSq: 0xb5,
            openin: 0xb6,
            openout: 0xb7,
            origin: 0xb8,
            out: 0xb9,
            paper: 0xba,
            pen: 0xbb,
            plot: 0xbc,
            plotr: 0xbd,
            poke: 0xbe,
            print: 0xbf,
            "'": 0xc0,
            rad: 0xc1,
            randomize: 0xc2,
            read: 0xc3,
            release: 0xc4,
            rem: 0xc5,
            renum: 0xc6,
            restore: 0xc7,
            resume: 0xc8,
            resumeNext: 0xc8,
            "return": 0xc9,
            run: 0xca,
            save: 0xcb,
            sound: 0xcc,
            speedInk: 0xcd,
            speedKey: 0xcd,
            speedWrite: 0xcd,
            stop: 0xce,
            swap: 0xe7,
            symbol: 0xcf,
            symbolAfter: 0xcf,
            tag: 0xd0,
            tagoff: 0xd1,
            troff: 0xd2,
            tron: 0xd3,
            wait: 0xd4,
            wend: 0xd5,
            "while": 0xd6,
            width: 0xd7,
            window: 0xd8,
            windowSwap: 0xd8,
            write: 0xd9,
            zone: 0xda,
            di: 0xdb,
            ei: 0xdc,
            fill: 0xdd,
            graphics: 0xde,
            graphicsPaper: 0xde,
            graphicsPen: 0xde,
            mask: 0xdf,
            frame: 0xe0,
            cursor: 0xe1,
            // "<unused>":         0xe2,
            erl: 0xe3,
            fn: 0xe4,
            spc: 0xe5,
            step: 0xe6,
            // swap: 0xe7, only: windowSwap...
            // "<unused>":         0xe8,
            // "<unused>":         0xe9,
            tab: 0xea,
            then: 0xeb,
            to: 0xec,
            using: 0xed,
            ">": 0xee,
            "=": 0xef,
            assign: 0xef,
            ">=": 0xf0,
            "<": 0xf1,
            "<>": 0xf2,
            "<=": 0xf3,
            "+": 0xf4,
            "-": 0xf5,
            "*": 0xf6,
            "/": 0xf7,
            "^": 0xf8,
            "\\": 0xf9,
            and: 0xfa,
            mod: 0xfb,
            or: 0xfc,
            xor: 0xfd,
            not: 0xfe
            // 0xff: (prefix for additional keywords)
        };
        CodeGeneratorToken.tokensFF = {
            // Functions with one argument
            abs: 0x00,
            asc: 0x01,
            atn: 0x02,
            chr$: 0x03,
            cint: 0x04,
            cos: 0x05,
            creal: 0x06,
            exp: 0x07,
            fix: 0x08,
            fre: 0x09,
            inkey: 0x0a,
            inp: 0x0b,
            "int": 0x0c,
            joy: 0x0d,
            len: 0x0e,
            log: 0x0f,
            log10: 0x10,
            lower$: 0x11,
            peek: 0x12,
            remain: 0x13,
            sgn: 0x14,
            sin: 0x15,
            space$: 0x16,
            sq: 0x17,
            sqr: 0x18,
            str$: 0x19,
            tan: 0x1a,
            unt: 0x1b,
            upper$: 0x1c,
            val: 0x1d,
            // Functions without arguments
            eof: 0x40,
            err: 0x41,
            himem: 0x42,
            inkey$: 0x43,
            pi: 0x44,
            rnd: 0x45,
            time: 0x46,
            xpos: 0x47,
            ypos: 0x48,
            derr: 0x49,
            // Functions with more arguments
            bin$: 0x71,
            dec$: 0x72,
            hex$: 0x73,
            instr: 0x74,
            left$: 0x75,
            max: 0x76,
            min: 0x77,
            pos: 0x78,
            right$: 0x79,
            round: 0x7a,
            string$: 0x7b,
            test: 0x7c,
            testr: 0x7d,
            copychr$: 0x7e,
            vpos: 0x7f
        };
        CodeGeneratorToken.varTypeMap = {
            "!": "_floatVar",
            "%": "_intVar",
            $: "_stringVar"
        };
        return CodeGeneratorToken;
    }());
    exports.CodeGeneratorToken = CodeGeneratorToken;
});
// Diff.ts - Diff strings
// (c) Slava Kim
// https://github.com/Slava/diff.js
//
define("Diff", ["require", "exports", "Utils"], function (require, exports, Utils_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Diff = void 0;
    var Diff = /** @class */ (function () {
        function Diff() {
        }
        // Refer to http://www.xmailserver.org/diff2.pdf
        Diff.composeError = function (error, message, value, pos) {
            return Utils_10.Utils.composeError("Diff", error, message, value, pos, undefined, 0);
        };
        Diff.inRange = function (x, l, r) {
            return (l <= x && x <= r) || (r <= x && x <= l);
        };
        Diff.fnEquals = function (a, b) {
            return a === b;
        };
        // Accepts custom comparator
        Diff.customIndexOf = function (arr, item, start, fnEquals) {
            for (var i2 = start; i2 < arr.length; i2 += 1) {
                if (fnEquals(item, arr[i2])) {
                    return i2;
                }
            }
            return -1;
        };
        /* can we use it here? need to define aA, aB, lcsAtoms, findMidSnake():
        private static lcs(startA: number, endA: number, startB: number, endB: number) {
            const N = endA - startA + 1,
                M = endB - startB + 1;
    
            if (N > 0 && M > 0) {
                const middleSnake = findMidSnake(startA, endA, startB, endB),
                    // A[x;u] == B[y,v] and is part of LCS
                    x = middleSnake[0][0],
                    y = middleSnake[0][1],
                    u = middleSnake[1][0],
                    v = middleSnake[1][1],
                    D = middleSnake[2];
    
                if (D > 1) {
                    Diff.lcs(startA, x - 1, startB, y - 1);
                    if (x <= u) {
                        [].push.apply(lcsAtoms, aA.slice(x, u + 1));
                    }
                    lcs(u + 1, endA, v + 1, endB);
                } else if (M > N) {
                    [].push.apply(lcsAtoms, aA.slice(startA, endA + 1));
                } else {
                    [].push.apply(lcsAtoms, aB.slice(startB, endB + 1));
                }
            }
        }
        */
        // Longest Common Subsequence
        // @param A - sequence of atoms - Array
        // @param B - sequence of atoms - Array
        // @param equals - optional comparator of atoms - returns true or false,
        //                 if not specified, triple equals operator is used
        // @returns Array - sequence of atoms, one of LCSs, edit script from A to B
        Diff.fnLCS = function (aA, aB, equals) {
            // Helpers
            var // Takes X-component as argument, diagonal as context, returns array-pair of form x, y
            toPoint = function (x) {
                return [
                    x,
                    x - this // eslint-disable-line no-invalid-this
                ]; // XXX context is not the best way to pass diagonal
            }, 
            // NOTE: all intervals from now on are both sides inclusive
            // Get the points in Edit Graph, one of the LCS paths goes through.
            // The points are located on the same diagonal and represent the middle
            // snake ([D/2] out of D+1) in the optimal edit path in edit graph.
            // @param startA, endA - substring of A we are working on
            // @param startB, endB - substring of B we are working on
            // @returns Array - [
            //                   [x, y], - beginning of the middle snake
            //                   [u, v], - end of the middle snake
            //                    D,     - optimal edit distance
            //                    LCS ]  - length of LCS
            findMidSnake = function (startA, endA, startB, endB) {
                var iN = endA - startA + 1, iM = endB - startB + 1, max = iN + iM, delta = iN - iM, hhalfMaxCeil = (max + 1) / 2 | 0, // eslint-disable-line no-bitwise
                // Maps -Max .. 0 .. +Max, diagonal index to endpoints for furthest reaching D-path on current iteration.
                oV = {}, 
                // Same but for reversed paths.
                oU = {};
                var overlap, iD;
                // Special case for the base case, D = 0, k = 0, x = y = 0
                oV[1] = 0;
                // Special case for the base case reversed, D = 0, k = 0, x = N, y = M
                oU[delta - 1] = iN;
                // Iterate over each possible length of edit script
                for (iD = 0; iD <= hhalfMaxCeil; iD += 1) {
                    // Iterate over each diagonal
                    for (var k = -iD; k <= iD && !overlap; k += 2) {
                        var x = void 0;
                        // Positions in sequences A and B of furthest going D-path on diagonal k.
                        // Choose from each diagonal we extend
                        if (k === -iD || (k !== iD && oV[k - 1] < oV[k + 1])) {
                            // Extending path one point down, that's why x doesn't change, y
                            // increases implicitly
                            x = oV[k + 1];
                        }
                        else {
                            // Extending path one point to the right, x increases
                            x = oV[k - 1] + 1;
                        }
                        // We can calculate the y out of x and diagonal index.
                        var y = x - k;
                        if (isNaN(y) || x > iN || y > iM) {
                            continue;
                        }
                        var xx = x;
                        // Try to extend the D-path with diagonal paths. Possible only if atoms
                        // A_x match B_y
                        while (x < iN && y < iM // if there are atoms to compare
                            && equals(aA[startA + x], aB[startB + y])) {
                            x += 1;
                            y += 1;
                        }
                        // We can safely update diagonal k, since on every iteration we consider
                        // only even or only odd diagonals and the result of one depends only on
                        // diagonals of different iteration.
                        oV[k] = x;
                        // Check feasibility, Delta is checked for being odd.
                        if ((delta & 1) === 1 && Diff.inRange(k, delta - (iD - 1), delta + (iD - 1))) { // eslint-disable-line no-bitwise
                            // Forward D-path can overlap with reversed D-1-path
                            if (oV[k] >= oU[k]) {
                                // Found an overlap, the middle snake, convert X-components to dots
                                overlap = [
                                    xx,
                                    x
                                ].map(toPoint, k); // XXX ES5
                            }
                        }
                    }
                    var SES = void 0;
                    if (overlap) {
                        SES = iD * 2 - 1;
                    }
                    // Iterate over each diagonal for reversed case
                    for (var k = -iD; k <= iD && !overlap; k += 2) {
                        // The real diagonal we are looking for is k + Delta
                        var K = k + delta;
                        var x = void 0;
                        if (k === iD || (k !== -iD && oU[K - 1] < oU[K + 1])) {
                            x = oU[K - 1];
                        }
                        else {
                            x = oU[K + 1] - 1;
                        }
                        var y = x - K;
                        if (isNaN(y) || x < 0 || y < 0) {
                            continue;
                        }
                        var xx = x;
                        while (x > 0 && y > 0 && equals(aA[startA + x - 1], aB[startB + y - 1])) {
                            x -= 1;
                            y -= 1;
                        }
                        oU[K] = x;
                        if (delta % 2 === 0 && Diff.inRange(K, -iD, iD)) {
                            if (oU[K] <= oV[K]) {
                                overlap = [
                                    x,
                                    xx
                                ].map(toPoint, K); // XXX ES5
                            }
                        }
                    }
                    if (overlap) {
                        SES = SES || iD * 2;
                        // Remember we had offset of each sequence?
                        for (var i = 0; i < 2; i += 1) {
                            for (var j = 0; j < 2; j += 1) {
                                overlap[i][j] += [
                                    startA,
                                    startB
                                ][j] - i;
                            }
                        }
                        return overlap.concat([
                            SES,
                            (max - SES) / 2
                        ]);
                    }
                }
                throw Diff.composeError(Error(), "Programming error in findMidSnake", "", 0); // should not occur
            }, lcsAtoms = [], lcs = function (startA, endA, startB, endB) {
                var N = endA - startA + 1, M = endB - startB + 1;
                if (N > 0 && M > 0) {
                    var middleSnake = findMidSnake(startA, endA, startB, endB), 
                    // A[x;u] == B[y,v] and is part of LCS
                    x = middleSnake[0][0], y = middleSnake[0][1], u = middleSnake[1][0], v = middleSnake[1][1], D = middleSnake[2];
                    if (D > 1) {
                        lcs(startA, x - 1, startB, y - 1);
                        if (x <= u) {
                            [].push.apply(lcsAtoms, aA.slice(x, u + 1));
                        }
                        lcs(u + 1, endA, v + 1, endB);
                    }
                    else if (M > N) {
                        [].push.apply(lcsAtoms, aA.slice(startA, endA + 1));
                    }
                    else {
                        [].push.apply(lcsAtoms, aB.slice(startB, endB + 1));
                    }
                }
            };
            lcs(0, aA.length - 1, 0, aB.length - 1);
            return lcsAtoms;
        };
        // Diff sequence
        // @param A - sequence of atoms - Array
        // @param B - sequence of atoms - Array
        // [@param equals - optional comparator of atoms - returns true or false,
        //                 if not specified, triple equals operator is used]
        // @returns Array - sequence of objects in a form of:
        //   - operation: one of "none", "add", "delete"
        //   - atom: the atom found in either A or B
        // Applying operations from diff sequence you should be able to transform A to B
        Diff.diff = function (aA, aB) {
            var diff = [], fnEquals = Diff.fnEquals;
            var i = 0, j = 0, iN = aA.length, iM = aB.length, iK = 0;
            while (i < iN && j < iM && fnEquals(aA[i], aB[j])) {
                i += 1;
                j += 1;
            }
            while (i < iN && j < iM && fnEquals(aA[iN - 1], aB[iM - 1])) {
                iN -= 1;
                iM -= 1;
                iK += 1;
            }
            [].push.apply(diff, aA.slice(0, i).map(function (atom2) {
                return {
                    operation: "none",
                    atom: atom2
                };
            }));
            var lcs = Diff.fnLCS(aA.slice(i, iN), aB.slice(j, iM), fnEquals);
            for (var k = 0; k < lcs.length; k += 1) {
                var atom = lcs[k], ni = Diff.customIndexOf(aA, atom, i, fnEquals), nj = Diff.customIndexOf(aB, atom, j, fnEquals);
                // XXX ES5 map
                // Delete unmatched atoms from A
                [].push.apply(diff, aA.slice(i, ni).map(function (atom2) {
                    return {
                        operation: "delete",
                        atom: atom2
                    };
                }));
                // Add unmatched atoms from B
                [].push.apply(diff, aB.slice(j, nj).map(function (atom2) {
                    return {
                        operation: "add",
                        atom: atom2
                    };
                }));
                // Add the atom found in both sequences
                diff.push({
                    operation: "none",
                    atom: atom
                });
                i = ni + 1;
                j = nj + 1;
            }
            // Don't forget about the rest
            [].push.apply(diff, aA.slice(i, iN).map(function (atom2) {
                return {
                    operation: "delete",
                    atom: atom2
                };
            }));
            [].push.apply(diff, aB.slice(j, iM).map(function (atom2) {
                return {
                    operation: "add",
                    atom: atom2
                };
            }));
            [].push.apply(diff, aA.slice(iN, iN + iK).map(function (atom2) {
                return {
                    operation: "none",
                    atom: atom2
                };
            }));
            return diff;
        };
        Diff.testDiff = function (text1, text2) {
            var textParts1 = text1.split("\n"), textParts2 = text2.split("\n");
            var diff = Diff.diff(textParts1, textParts2).map(function (o) {
                var result = "";
                if (o.operation === "add") {
                    result = "+ " + o.atom;
                }
                else if (o.operation === "delete") {
                    result = "- " + o.atom;
                } // else "none"
                return result;
            }).join("\n");
            diff = diff.replace(/\n\n+/g, "\n");
            return diff;
        };
        return Diff;
    }());
    exports.Diff = Diff;
});
// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
define("DiskImage", ["require", "exports", "Utils"], function (require, exports, Utils_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskImage = void 0;
    var DiskImage = /** @class */ (function () {
        function DiskImage(options) {
            this.options = {
                diskName: options.diskName,
                data: options.data,
                quiet: false
            };
            this.setOptions(options);
            // reset
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.format = DiskImage.getInitialFormat();
        }
        DiskImage.prototype.setOptions = function (options) {
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
        };
        DiskImage.getInitialDiskInfo = function () {
            return {
                trackInfo: {
                    sectorInfo: []
                }
            };
        };
        DiskImage.getInitialFormat = function () {
            return {};
        };
        DiskImage.prototype.reset = function () {
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.format = DiskImage.getInitialFormat();
        };
        DiskImage.prototype.composeError = function (error, message, value, pos) {
            var len = 0;
            return Utils_11.Utils.composeError("DiskImage", error, this.options.diskName + ": " + message, value, pos || 0, len);
        };
        DiskImage.testDiskIdent = function (ident) {
            var diskType = 0;
            if (ident === "MV - CPC") {
                diskType = 1;
            }
            else if (ident === "EXTENDED") {
                diskType = 2;
            }
            return diskType;
        };
        DiskImage.prototype.readUtf = function (pos, len) {
            var out = this.options.data.substring(pos, pos + len);
            if (out.length !== len) {
                throw this.composeError(new Error(), "End of File", "", pos);
            }
            return out;
        };
        DiskImage.prototype.readUInt8 = function (pos) {
            var num = this.options.data.charCodeAt(pos);
            if (isNaN(num)) {
                throw this.composeError(new Error(), "End of File", String(num), pos);
            }
            return num;
        };
        DiskImage.prototype.readUInt16 = function (pos) {
            return this.readUInt8(pos) + this.readUInt8(pos + 1) * 256;
        };
        DiskImage.prototype.readDiskInfo = function (pos) {
            var diskInfoSize = 0x100, diskInfo = this.diskInfo, ident = this.readUtf(pos, 8), // check first 8 characters as characteristic
            diskType = DiskImage.testDiskIdent(ident);
            if (!diskType) {
                throw this.composeError(Error(), "Ident not found", ident, pos);
            }
            diskInfo.extended = (diskType === 2);
            diskInfo.ident = ident + this.readUtf(pos + 8, 34 - 8); // read remaining ident
            if (diskInfo.ident.substring(34 - 11, 34 - 11 + 9) !== "Disk-Info") { // some tools use "Disk-Info  " instead of "Disk-Info\r\n", so compare without "\r\n"
                // "Disk-Info" string is optional
                if (!this.options.quiet) {
                    Utils_11.Utils.console.warn(this.composeError({}, "Disk ident not found", diskInfo.ident.substring(34 - 11, 34 - 11 + 9), pos + 34 - 11).message);
                }
            }
            diskInfo.creator = this.readUtf(pos + 34, 14);
            diskInfo.tracks = this.readUInt8(pos + 48);
            diskInfo.heads = this.readUInt8(pos + 49);
            diskInfo.trackSize = this.readUInt16(pos + 50);
            var trackSizes = [], trackPosList = [], trackSizeCount = diskInfo.tracks * diskInfo.heads; // number of track sizes
            var trackPos = diskInfoSize;
            pos += 52; // track sizes high bytes start at offset 52 (0x35)
            for (var i = 0; i < trackSizeCount; i += 1) {
                trackPosList.push(trackPos);
                var trackSize = diskInfo.trackSize || (this.readUInt8(pos + i) * 256); // take common track size or read individual track size (extended)
                trackSizes.push(trackSize);
                trackPos += trackSize;
            }
            diskInfo.trackSizes = trackSizes;
            diskInfo.trackPos = trackPosList;
        };
        DiskImage.prototype.readTrackInfo = function (pos) {
            var trackInfoSize = 0x100, trackInfo = this.diskInfo.trackInfo, sectorInfoList = trackInfo.sectorInfo;
            trackInfo.dataPos = pos + trackInfoSize;
            trackInfo.ident = this.readUtf(pos, 12);
            if (trackInfo.ident.substring(0, 10) !== "Track-Info") { // some tools use "Track-Info  " instead of "Track-Info\r\n", so compare without "\r\n"
                // "Track-Info" string is optional
                if (!this.options.quiet) {
                    Utils_11.Utils.console.warn(this.composeError({}, "Track ident not found", trackInfo.ident.substring(0, 10), pos).message);
                }
            }
            // 4 unused bytes
            trackInfo.track = this.readUInt8(pos + 16);
            trackInfo.head = this.readUInt8(pos + 17);
            trackInfo.dataRate = this.readUInt8(pos + 18);
            trackInfo.recMode = this.readUInt8(pos + 19);
            trackInfo.bps = this.readUInt8(pos + 20);
            trackInfo.spt = this.readUInt8(pos + 21);
            trackInfo.gap3 = this.readUInt8(pos + 22);
            trackInfo.fill = this.readUInt8(pos + 23);
            sectorInfoList.length = trackInfo.spt;
            var sectorNum2Index = {};
            trackInfo.sectorNum2Index = sectorNum2Index;
            pos += 24; // start sector info
            var sectorPos = trackInfo.dataPos;
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sectorInfo = sectorInfoList[i] || {}; // resue SectorInfo object if possible
                sectorInfoList[i] = sectorInfo;
                sectorInfo.dataPos = sectorPos;
                sectorInfo.track = this.readUInt8(pos);
                sectorInfo.head = this.readUInt8(pos + 1);
                sectorInfo.sector = this.readUInt8(pos + 2);
                sectorInfo.bps = this.readUInt8(pos + 3);
                sectorInfo.state1 = this.readUInt8(pos + 4);
                sectorInfo.state2 = this.readUInt8(pos + 5);
                var sectorSize = this.readUInt16(pos + 6) || (0x0080 << trackInfo.bps); // eslint-disable-line no-bitwise
                sectorInfo.sectorSize = sectorSize;
                sectorPos += sectorSize;
                sectorNum2Index[sectorInfo.sector] = i;
                pos += 8;
            }
        };
        DiskImage.prototype.seekTrack = function (track, head) {
            var diskInfo = this.diskInfo, trackInfo = diskInfo.trackInfo;
            if (trackInfo.track === track && trackInfo.head === head) { // already positionend?
                return;
            }
            if (!diskInfo.ident) {
                this.readDiskInfo(0);
            }
            var trackInfoPos = diskInfo.trackPos[track * diskInfo.heads + head];
            if (trackInfoPos === undefined) {
                throw this.composeError(new Error(), "Track not found", String(track));
            }
            this.readTrackInfo(trackInfoPos);
        };
        DiskImage.prototype.sectorNum2Index = function (sector) {
            var trackInfo = this.diskInfo.trackInfo, sectorIndex = trackInfo.sectorNum2Index[sector];
            return sectorIndex;
        };
        DiskImage.prototype.seekSector = function (sectorIndex) {
            var sectorInfoList = this.diskInfo.trackInfo.sectorInfo, sectorInfo = sectorInfoList[sectorIndex];
            return sectorInfo;
        };
        DiskImage.prototype.readSector = function (sector) {
            var trackInfo = this.diskInfo.trackInfo, sectorIndex = this.sectorNum2Index(sector);
            if (sectorIndex === undefined) {
                throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
            }
            var sectorInfo = this.seekSector(sectorIndex), out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);
            return out;
        };
        // ...
        DiskImage.prototype.getFormatDescriptor = function (format) {
            var derivedFormat = DiskImage.formatDescriptors[format];
            if (!derivedFormat) {
                throw this.composeError(Error(), "Unknown format", format);
            }
            var formatDescriptor;
            if (derivedFormat.parentRef) {
                var parentFormat = this.getFormatDescriptor(derivedFormat.parentRef); // recursive
                formatDescriptor = Object.assign({}, parentFormat, derivedFormat);
            }
            else {
                formatDescriptor = Object.assign({}, derivedFormat); // get a copy
            }
            return formatDescriptor;
        };
        DiskImage.prototype.determineFormat = function () {
            var diskInfo = this.diskInfo, track = 0, head = 0;
            this.seekTrack(track, head);
            var trackInfo = diskInfo.trackInfo;
            var firstSector = 0xff;
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sector = trackInfo.sectorInfo[i].sector;
                if (sector < firstSector) {
                    firstSector = sector;
                }
            }
            var format = "";
            if (firstSector === 0xc1) {
                format = "data";
            }
            else if (firstSector === 0x41) {
                format = "system";
            }
            else if ((firstSector === 0x91) && (diskInfo.tracks === 80)) { // parados80
                format = "parados80";
            }
            else if ((firstSector === 0x01) && (diskInfo.tracks === 80)) { // big780k (usually diskInfo.heads: 2)
                format = "big780k";
            }
            else {
                throw this.composeError(Error(), "Unknown format with sector", String(firstSector));
            }
            if (diskInfo.heads > 1) { // maybe 2
                format += String(diskInfo.heads); // e.g. "data": "data2"
            }
            return this.getFormatDescriptor(format);
        };
        DiskImage.fnRemoveHighBit7 = function (str) {
            var out = "";
            for (var i = 0; i < str.length; i += 1) {
                var char = str.charCodeAt(i);
                out += String.fromCharCode(char & 0x7f); // eslint-disable-line no-bitwise
            }
            return out;
        };
        DiskImage.prototype.readDirectoryExtents = function (extents, pos, endPos) {
            while (pos < endPos) {
                var extWithFlags = this.readUtf(pos + 9, 3), // extension with high bits set for special flags
                extent = {
                    user: this.readUInt8(pos),
                    name: DiskImage.fnRemoveHighBit7(this.readUtf(pos + 1, 8)),
                    ext: DiskImage.fnRemoveHighBit7(extWithFlags),
                    extent: this.readUInt8(pos + 12),
                    lastRecBytes: this.readUInt8(pos + 13),
                    extentHi: this.readUInt8(pos + 14),
                    records: this.readUInt8(pos + 15),
                    blocks: [],
                    readOnly: Boolean(extWithFlags.charCodeAt(0) & 0x80),
                    system: Boolean(extWithFlags.charCodeAt(1) & 0x80),
                    backup: Boolean(extWithFlags.charCodeAt(2) & 0x80) /* eslint-disable-line no-bitwise */
                };
                pos += 16;
                var blocks = extent.blocks;
                for (var i = 0; i < 16; i += 1) {
                    var block = this.readUInt8(pos + i);
                    if (block) {
                        blocks.push(block);
                    }
                    else { // last block
                        break;
                    }
                }
                pos += 16;
                extents.push(extent);
            }
            return extents;
        };
        DiskImage.fnSortByExtentNumber = function (a, b) {
            return a.extent - b.extent;
        };
        // do not know if we need to sort the extents per file, but...
        DiskImage.sortFileExtents = function (dir) {
            for (var name_8 in dir) {
                if (dir.hasOwnProperty(name_8)) {
                    var fileExtents = dir[name_8];
                    fileExtents.sort(DiskImage.fnSortByExtentNumber);
                }
            }
        };
        DiskImage.prepareDirectoryList = function (extents, fill, reFilePattern) {
            var dir = {};
            for (var i = 0; i < extents.length; i += 1) {
                var extent = extents[i];
                if (fill === null || extent.user !== fill) {
                    var name_9 = extent.name + "." + extent.ext; // and extent.user?
                    // (do not convert filename here (to display messages in filenames))
                    if (!reFilePattern || reFilePattern.test(name_9)) {
                        if (!(name_9 in dir)) {
                            dir[name_9] = [];
                        }
                        dir[name_9].push(extent);
                    }
                }
            }
            DiskImage.sortFileExtents(dir);
            return dir;
        };
        DiskImage.prototype.convertBlock2Sector = function (block) {
            var format = this.format, spt = format.spt, blockSectors = format.bls / 512, // usually 2
            logSec = block * blockSectors, // directory is in block 0-1
            pos = {
                track: Math.floor(logSec / spt) + format.off,
                head: 0,
                sector: (logSec % spt) + format.firstSector
            };
            return pos;
        };
        DiskImage.prototype.readDirectory = function () {
            var directorySectors = 4, // could be determined from al0,al1
            extents = [], format = this.determineFormat(), off = format.off, firstSector = format.firstSector;
            this.format = format;
            this.seekTrack(off, 0);
            for (var i = 0; i < directorySectors; i += 1) {
                var sectorIndex = this.sectorNum2Index(firstSector + i);
                if (sectorIndex === undefined) {
                    throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
                }
                var sectorInfo = this.seekSector(sectorIndex);
                this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
            }
            return DiskImage.prepareDirectoryList(extents, format.fill);
        };
        DiskImage.prototype.nextSector = function (pos) {
            var format = this.format;
            pos.sector += 1;
            if (pos.sector >= format.firstSector + format.spt) {
                pos.track += 1;
                pos.sector = format.firstSector;
            }
        };
        DiskImage.prototype.readBlock = function (block) {
            var diskInfo = this.diskInfo, blockSectors = this.format.bls / 512, // usually 2
            pos = this.convertBlock2Sector(block);
            var out = "";
            if (pos.track >= diskInfo.tracks) {
                Utils_11.Utils.console.error(this.composeError({}, "Block " + block + ": Track out of range", String(pos.track)));
            }
            if (pos.head >= diskInfo.heads) {
                Utils_11.Utils.console.error(this.composeError({}, "Block " + block + ": Head out of range", String(pos.track)));
            }
            for (var i = 0; i < blockSectors; i += 1) {
                this.seekTrack(pos.track, pos.head);
                out += this.readSector(pos.sector);
                this.nextSector(pos);
            }
            return out;
        };
        DiskImage.prototype.readExtents = function (fileExtents) {
            var recPerBlock = this.format.bls / 128; // usually 8
            var out = "";
            for (var i = 0; i < fileExtents.length; i += 1) {
                var extent = fileExtents[i], blocks = extent.blocks;
                var records = extent.records;
                if (extent.extent > 0) {
                    if (recPerBlock > 8) { // fast hack for parados: adapt records
                        records += extent.extent * 128;
                    }
                }
                for (var blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
                    var block = this.readBlock(blocks[blockIndex]);
                    if (records < recPerBlock) { // block with some remaining data
                        block = block.substring(0, 0x80 * records);
                    }
                    out += block;
                    records -= recPerBlock;
                    if (records <= 0) {
                        break;
                    }
                }
            }
            return out;
        };
        DiskImage.prototype.readFile = function (fileExtents) {
            var out = this.readExtents(fileExtents);
            var header = DiskImage.parseAmsdosHeader(out);
            var realLen;
            if (header) {
                var amsdosHeaderLength = 0x80;
                realLen = header.length + amsdosHeaderLength;
            }
            if (realLen === undefined) { // no real length: ASCII: find EOF (0x1a) in last record
                var fileLen = out.length, lastRecPos = fileLen > 0x80 ? (fileLen - 0x80) : 0, index = out.indexOf(String.fromCharCode(0x1a), lastRecPos);
                if (index >= 0) {
                    realLen = index;
                    if (Utils_11.Utils.debug > 0) {
                        Utils_11.Utils.console.debug("readFile: ASCII file length " + fileLen + " truncated to " + realLen);
                    }
                }
            }
            if (realLen !== undefined) { // now real length (from header or ASCII)?
                out = out.substring(0, realLen);
            }
            return out;
        };
        /* eslint-enable array-element-newline */
        DiskImage.unOrProtectData = function (data) {
            var table1 = DiskImage.protectTable[0], table2 = DiskImage.protectTable[1];
            var out = "";
            for (var i = 0; i < data.length; i += 1) {
                var byte = data.charCodeAt(i);
                byte ^= table1[(i & 0x7f) % table1.length] ^ table2[(i & 0x7f) % table2.length]; // eslint-disable-line no-bitwise
                out += String.fromCharCode(byte);
            }
            return out;
        };
        // ...
        DiskImage.computeChecksum = function (data) {
            var sum = 0;
            for (var i = 0; i < data.length; i += 1) {
                sum += data.charCodeAt(i);
            }
            return sum;
        };
        DiskImage.parseAmsdosHeader = function (data) {
            var typeMap = {
                0: "T",
                1: "P",
                2: "B",
                8: "G",
                0x16: "A" // ASCII
            };
            var header;
            // http://www.benchmarko.de/cpcemu/cpcdoc/chapter/cpcdoc7_e.html#I_AMSDOS_HD
            // http://www.cpcwiki.eu/index.php/AMSDOS_Header
            if (data.length >= 0x80) {
                var computed = DiskImage.computeChecksum(data.substring(0, 66)), sum = data.charCodeAt(67) + data.charCodeAt(68) * 256;
                if (computed === sum) {
                    header = {
                        user: data.charCodeAt(0),
                        name: data.substring(1, 1 + 8),
                        ext: data.substring(9, 9 + 3),
                        typeNumber: data.charCodeAt(18),
                        start: data.charCodeAt(21) + data.charCodeAt(22) * 256,
                        pseudoLen: data.charCodeAt(24) + data.charCodeAt(25) * 256,
                        entry: data.charCodeAt(26) + data.charCodeAt(27) * 256,
                        length: data.charCodeAt(64) + data.charCodeAt(65) * 256 + data.charCodeAt(66) * 65536,
                        typeString: ""
                    };
                    header.typeString = typeMap[header.typeNumber] || typeMap[16]; // default: ASCII
                }
            }
            return header;
        };
        DiskImage.uInt8ToString = function (value) {
            return String.fromCharCode(value);
        };
        DiskImage.uInt16ToString = function (value) {
            return DiskImage.uInt8ToString(value & 0xff) + DiskImage.uInt8ToString((value >> 8) & 0xff); // eslint-disable-line no-bitwise
        };
        DiskImage.uInt24ToString = function (value) {
            return DiskImage.uInt16ToString(value & 0xffff) + DiskImage.uInt8ToString(value >> 16); // eslint-disable-line no-bitwise
        };
        DiskImage.combineAmsdosHeader = function (header) {
            var typeMap = {
                T: 0,
                P: 1,
                B: 2,
                G: 8,
                A: 0x16 // ASCII
            };
            var type = header.typeNumber;
            if (header.typeString) { // overwrite type form type
                type = typeMap[header.typeString];
                if (type === undefined) {
                    type = typeMap.A;
                }
            }
            var data1 = DiskImage.uInt8ToString(header.user || 0)
                + (header.name || "").padEnd(8, " ")
                + (header.ext || "").padEnd(3, " ")
                + DiskImage.uInt16ToString(0)
                + DiskImage.uInt16ToString(0)
                + DiskImage.uInt8ToString(0) // block number (unused)
                + DiskImage.uInt8ToString(0) // last block (unused)
                + DiskImage.uInt8ToString(type)
                + DiskImage.uInt16ToString(0) // data location (unused)
                + DiskImage.uInt16ToString(header.start || 0)
                + DiskImage.uInt8ToString(0xff) // first block (unused, always 0xff)
                + DiskImage.uInt16ToString(header.pseudoLen || header.length) // logical length
                + DiskImage.uInt16ToString(header.entry || 0)
                + " ".repeat(36)
                + DiskImage.uInt24ToString(header.length), checksum = DiskImage.computeChecksum(data1), data = data1
                + DiskImage.uInt16ToString(checksum)
                + "\x00".repeat(59);
            return data;
        };
        DiskImage.formatDescriptors = {
            data: {
                tracks: 40,
                heads: 1,
                // head: 0, // head number?
                bps: 2,
                spt: 9,
                gap3: 0x4e,
                fill: 0xe5,
                firstSector: 0xc1,
                bls: 1024,
                // bsh: 3, // log2 BLS - 7
                // blm: 7, // BLS / 128 - 1
                al0: 0xc0,
                al1: 0x00,
                off: 0 // number of reserved tracks (also the track where the directory starts)
            },
            // double sided data
            data2: {
                parentRef: "data",
                heads: 2
            },
            system: {
                parentRef: "data",
                firstSector: 0x41,
                off: 2
            },
            // double sided system
            system2: {
                parentRef: "system",
                heads: 2
            },
            vortex: {
                parentRef: "data",
                tracks: 80,
                heads: 2,
                firstSector: 0x01
            },
            "3dos": {
                parentRef: "data",
                firstSector: 0x00
            },
            parados80: {
                parentRef: "data",
                tracks: 80,
                firstSector: 0x91,
                spt: 10,
                bls: 2048
            },
            big780k: {
                parentRef: "data",
                al0: 0x80,
                tracks: 80,
                off: 1,
                firstSector: 0x01
            },
            big780k2: {
                parentRef: "big780k",
                heads: 2
            }
        };
        // ...
        // see AMSDOS ROM, &D252
        /* eslint-disable array-element-newline */
        DiskImage.protectTable = [
            [0xe2, 0x9d, 0xdb, 0x1a, 0x42, 0x29, 0x39, 0xc6, 0xb3, 0xc6, 0x90, 0x45, 0x8a],
            [0x49, 0xb1, 0x36, 0xf0, 0x2e, 0x1e, 0x06, 0x2a, 0x28, 0x19, 0xea] // 11 bytes
        ];
        return DiskImage;
    }());
    exports.DiskImage = DiskImage;
});
// InputStack.ts - InputStack...
// see: https://github.com/jzaefferer/undo
//
define("InputStack", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputStack = void 0;
    var InputStack = /** @class */ (function () {
        function InputStack() {
            this.input = [];
            this.stackPosition = -1;
        }
        InputStack.prototype.reset = function () {
            this.input.length = 0;
            this.stackPosition = -1;
        };
        InputStack.prototype.getInput = function () {
            return this.input[this.stackPosition];
        };
        InputStack.prototype.clearRedo = function () {
            this.input = this.input.slice(0, this.stackPosition + 1);
        };
        InputStack.prototype.save = function (input) {
            this.clearRedo();
            this.input.push(input);
            this.stackPosition += 1;
        };
        InputStack.prototype.canUndoKeepOne = function () {
            return this.stackPosition > 0;
        };
        InputStack.prototype.undo = function () {
            this.stackPosition -= 1;
            return this.getInput();
        };
        InputStack.prototype.canRedo = function () {
            return this.stackPosition < this.input.length - 1;
        };
        InputStack.prototype.redo = function () {
            this.stackPosition += 1;
            return this.getInput();
        };
        return InputStack;
    }());
    exports.InputStack = InputStack;
});
// View.ts - View Module to access HTML DOM
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("View", ["require", "exports", "Utils"], function (require, exports, Utils_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    var View = /** @class */ (function () {
        function View() {
        }
        View.getElementById1 = function (id) {
            var element = window.document.getElementById(id);
            if (!element) {
                throw new Error("Unknown " + id);
            }
            return element;
        };
        View.getElementByIdAs = function (id) {
            return View.getElementById1(id);
        };
        View.prototype.getHidden = function (id) {
            var element = View.getElementById1(id);
            return element.className.indexOf("displayNone") >= 0;
        };
        View.prototype.setHidden = function (id, hidden, display) {
            // optional display: block or flex
            var element = View.getElementById1(id), displayVisible = "display" + Utils_12.Utils.stringCapitalize(display || "block");
            if (hidden) {
                if (element.className.indexOf("displayNone") < 0) {
                    this.toggleClass(id, "displayNone");
                }
                if (element.className.indexOf(displayVisible) >= 0) {
                    this.toggleClass(id, displayVisible);
                }
            }
            else {
                if (element.className.indexOf("displayNone") >= 0) {
                    this.toggleClass(id, "displayNone");
                }
                if (element.className.indexOf(displayVisible) < 0) {
                    this.toggleClass(id, displayVisible);
                }
            }
            return this;
        };
        View.prototype.setDisabled = function (id, disabled) {
            var element = View.getElementByIdAs(id);
            element.disabled = disabled;
            return this;
        };
        View.prototype.toggleClass = function (id, className) {
            var element = View.getElementById1(id);
            var classes = element.className;
            var nameIndex = classes.indexOf(className);
            if (nameIndex === -1) {
                classes = classes.trim() + " " + className;
            }
            else {
                classes = classes.substring(0, nameIndex) + classes.substring(nameIndex + className.length + 1).trim();
            }
            element.className = classes;
        };
        View.prototype.getAreaValue = function (id) {
            var element = View.getElementByIdAs(id);
            return element.value;
        };
        View.prototype.setAreaValue = function (id, value) {
            var element = View.getElementByIdAs(id);
            element.value = value;
            return this;
        };
        View.prototype.getInputValue = function (id) {
            var element = View.getElementByIdAs(id);
            return element.value;
        };
        View.prototype.setInputValue = function (id, value) {
            var element = View.getElementByIdAs(id);
            element.value = value;
            return this;
        };
        View.prototype.getInputChecked = function (id) {
            var element = View.getElementByIdAs(id);
            return element.checked;
        };
        View.prototype.setInputChecked = function (id, checked) {
            var element = View.getElementByIdAs(id);
            element.checked = checked;
            return this;
        };
        View.prototype.setAreaInputList = function (id, inputs) {
            var element = View.getElementByIdAs(id), childNodes = element.childNodes;
            while (childNodes.length && childNodes[0].nodeType !== Node.ELEMENT_NODE) { // remove all non-element nodes
                element.removeChild(element.firstChild);
            }
            for (var i = 0; i < inputs.length; i += 1) {
                var item = inputs[i];
                var input = void 0, label = void 0;
                if (i * 2 >= childNodes.length) {
                    input = window.document.createElement("input");
                    input.type = "radio";
                    input.id = "galleryItem" + i;
                    input.name = "gallery";
                    input.value = item.value;
                    input.checked = item.checked;
                    label = window.document.createElement("label");
                    label.setAttribute("for", "galleryItem" + i);
                    label.setAttribute("style", 'background: url("' + item.imgUrl + '"); background-size: cover');
                    label.setAttribute("title", item.title);
                    element.appendChild(input);
                    element.appendChild(label);
                }
                else {
                    input = childNodes[i * 2];
                    if (input.value !== item.value) {
                        if (Utils_12.Utils.debug > 3) {
                            Utils_12.Utils.console.debug("setInputList: " + id + ": value changed for index " + i + ": " + item.value);
                        }
                        input.value = item.value;
                        label = childNodes[i * 2 + 1];
                        label.setAttribute("style", 'background: url("' + item.imgUrl + '");');
                        label.setAttribute("title", item.title);
                    }
                    if (input.checked !== item.checked) {
                        input.checked = item.checked;
                    }
                }
            }
            // remove additional items
            while (element.childElementCount > inputs.length * 2) {
                element.removeChild(element.lastChild);
            }
            return this;
        };
        View.prototype.setSelectOptions = function (id, options) {
            var element = View.getElementByIdAs(id);
            for (var i = 0; i < options.length; i += 1) {
                var item = options[i];
                var option = void 0;
                if (i >= element.length) {
                    option = window.document.createElement("option");
                    option.value = item.value;
                    option.text = item.text;
                    option.title = item.title;
                    option.selected = item.selected; // multi-select
                    element.add(option, null); // null needed for old FF 3.x
                }
                else {
                    option = element.options[i];
                    if (option.value !== item.value) {
                        option.value = item.value;
                    }
                    if (option.text !== item.text) {
                        if (Utils_12.Utils.debug > 3) {
                            Utils_12.Utils.console.debug("setSelectOptions: " + id + ": text changed for index " + i + ": " + item.text);
                        }
                        option.text = item.text;
                        option.title = item.title;
                    }
                    option.selected = item.selected; // multi-select
                }
            }
            // remove additional select options
            element.options.length = options.length;
            return this;
        };
        View.prototype.getSelectOptions = function (id) {
            var element = View.getElementByIdAs(id), elementOptions = element.options, options = [];
            for (var i = 0; i < elementOptions.length; i += 1) {
                var elementOption = elementOptions[i];
                options.push({
                    value: elementOption.value,
                    text: elementOption.text,
                    title: elementOption.title,
                    selected: elementOption.selected
                });
            }
            return options;
        };
        View.prototype.getSelectValue = function (id) {
            var element = View.getElementByIdAs(id);
            return element.value;
        };
        View.prototype.setSelectValue = function (id, value) {
            var element = View.getElementByIdAs(id);
            if (value) {
                element.value = value;
            }
            return this;
        };
        View.prototype.setSelectTitleFromSelectedOption = function (id) {
            var element = View.getElementByIdAs(id), selectedIndex = element.selectedIndex, title = (selectedIndex >= 0) ? element.options[selectedIndex].title : "";
            element.title = title;
            return this;
        };
        View.prototype.setAreaScrollTop = function (id, scrollTop) {
            var element = View.getElementByIdAs(id);
            if (scrollTop === undefined) {
                scrollTop = element.scrollHeight;
            }
            element.scrollTop = scrollTop;
            return this;
        };
        View.prototype.setSelectionRange = function (textarea, selectionStart, selectionEnd) {
            // First scroll selection region to view
            var fullText = textarea.value;
            textarea.value = fullText.substring(0, selectionEnd);
            // For some unknown reason, you must store the scollHeight to a variable before setting the textarea value. Otherwise it won't work for long strings
            var scrollHeight = textarea.scrollHeight;
            textarea.value = fullText;
            var textareaHeight = textarea.clientHeight;
            var scrollTop = scrollHeight;
            if (scrollTop > textareaHeight) {
                // scroll selection to center of textarea
                scrollTop -= textareaHeight / 2;
            }
            else {
                scrollTop = 0;
            }
            textarea.scrollTop = scrollTop;
            // Continue to set selection range
            textarea.setSelectionRange(selectionStart, selectionEnd);
            return this;
        };
        View.prototype.setAreaSelection = function (id, pos, endPos) {
            var element = View.getElementByIdAs(id);
            if (element.selectionStart !== undefined) {
                if (element.setSelectionRange !== undefined) {
                    element.focus(); // not needed for scrolling but we want to see the selected text
                    this.setSelectionRange(element, pos, endPos);
                }
                else {
                    element.focus();
                    element.selectionStart = pos;
                    element.selectionEnd = endPos;
                }
            }
            return this;
        };
        View.prototype.attachEventHandler = function (type, eventHandler) {
            if (Utils_12.Utils.debug) {
                Utils_12.Utils.console.debug("attachEventHandler: type=" + type + ", eventHandler=" + ((eventHandler !== undefined) ? "[?]" : null));
            }
            window.document.addEventListener(type, eventHandler, false);
            return this;
        };
        View.getEventTarget = function (event) {
            var target = event.target || event.srcElement; // target, not currentTarget; srcElement for IE8
            if (!target) {
                Utils_12.Utils.console.error("getEventTarget: Undefined event target: " + target);
            }
            return target;
        };
        View.requestFullscreenForId = function (id) {
            var element = View.getElementById1(id), anyEl = element, requestMethod = element.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.mozRequestFullscreen || anyEl.msRequestFullscreen;
            if (requestMethod) {
                requestMethod.call(element); // can we ALLOW_KEYBOARD_INPUT?
            }
            else if (typeof window.ActiveXObject !== "undefined") { // older IE
                var wscript = new window.ActiveXObject("WScript.Shell");
                if (wscript !== null) {
                    wscript.SendKeys("{F11}"); // eslint-disable-line new-cap
                }
            }
            else {
                return false;
            }
            return true;
        };
        return View;
    }());
    exports.View = View;
});
// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("Keyboard", ["require", "exports", "Utils", "View"], function (require, exports, Utils_13, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Keyboard = void 0;
    var Keyboard = /** @class */ (function () {
        function Keyboard(options) {
            this.keyBuffer = []; // buffered pressed keys
            this.expansionTokens = []; // strings for expansion tokens 0..31 (in reality: 128..159)
            this.active = false; // flag if keyboard is active/focused, set from outside
            this.codeStringsRemoved = false;
            this.pressedKeys = {}; // currently pressed browser keys
            this.options = {
                fnOnEscapeHandler: undefined,
                fnOnKeyDown: undefined
            };
            this.setOptions(options);
            this.key2CpcKey = Keyboard.key2CpcKey;
            this.cpcKeyExpansions = {
                normal: {},
                shift: {},
                ctrl: {},
                repeat: {}
            }; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat
            var cpcArea = View_1.View.getElementById1("cpcArea");
            cpcArea.addEventListener("keydown", this.onCpcAreaKeydown.bind(this), false);
            cpcArea.addEventListener("keyup", this.oncpcAreaKeyup.bind(this), false);
            var textArea = View_1.View.getElementById1("textArea");
            textArea.addEventListener("keydown", this.onCpcAreaKeydown.bind(this), false);
            textArea.addEventListener("keyup", this.oncpcAreaKeyup.bind(this), false);
        }
        Keyboard.prototype.setOptions = function (options) {
            if (options.fnOnEscapeHandler !== undefined) {
                this.options.fnOnEscapeHandler = options.fnOnEscapeHandler;
            }
            if (options.fnOnKeyDown !== undefined) {
                this.options.fnOnKeyDown = options.fnOnKeyDown;
            }
        };
        Keyboard.prototype.getOptions = function () {
            return this.options;
        };
        /* eslint-enable array-element-newline */
        Keyboard.prototype.reset = function () {
            this.options.fnOnKeyDown = undefined;
            this.clearInput();
            this.pressedKeys = {}; // currently pressed browser keys
            this.resetExpansionTokens();
            this.resetCpcKeysExpansions();
        };
        Keyboard.prototype.clearInput = function () {
            this.keyBuffer.length = 0;
        };
        Keyboard.prototype.resetExpansionTokens = function () {
            var expansionTokens = this.expansionTokens;
            for (var i = 0; i <= 9; i += 1) {
                expansionTokens[i] = String(i);
            }
            expansionTokens[10] = ".";
            expansionTokens[11] = "\r";
            expansionTokens[12] = 'RUN"\r';
            for (var i = 13; i <= 31; i += 1) {
                expansionTokens[i] = "0";
            }
        };
        Keyboard.prototype.resetCpcKeysExpansions = function () {
            var cpcKeyExpansions = this.cpcKeyExpansions;
            cpcKeyExpansions.normal = {
                15: 0 + 128,
                13: 1 + 128,
                14: 2 + 128,
                5: 3 + 128,
                20: 4 + 128,
                12: 5 + 128,
                4: 6 + 128,
                10: 7 + 128,
                11: 8 + 128,
                3: 9 + 128,
                7: 10 + 128,
                6: 11 + 128 // Enter
            };
            cpcKeyExpansions.shift = {};
            cpcKeyExpansions.ctrl = {
                6: 12 + 128 // ctrl+Enter
            };
            cpcKeyExpansions.repeat = {};
        };
        //TODO: remove getKeyDownHandler, setKeyDownHandler?
        Keyboard.prototype.getKeyDownHandler = function () {
            return this.options.fnOnKeyDown;
        };
        Keyboard.prototype.setKeyDownHandler = function (fnOnKeyDown) {
            this.options.fnOnKeyDown = fnOnKeyDown;
        };
        Keyboard.prototype.setActive = function (active) {
            this.active = active;
        };
        Keyboard.prototype.removeCodeStringsFromKeymap = function () {
            var key2CpcKey = this.key2CpcKey, newMap = {};
            if (Utils_13.Utils.debug > 1) {
                Utils_13.Utils.console.log("removeCodeStringsFromKeymap: Unfortunately not all keys can be used.");
            }
            for (var key in key2CpcKey) {
                if (key2CpcKey.hasOwnProperty(key)) {
                    var keyCode = parseInt(key, 10); // get just the number
                    newMap[keyCode] = key2CpcKey[key];
                }
            }
            this.key2CpcKey = newMap;
        };
        Keyboard.prototype.fnPressCpcKey = function (cpcKeyCode, pressedKey, key, shiftKey, ctrlKey) {
            var pressedKeys = this.pressedKeys, cpcKeyExpansions = this.cpcKeyExpansions, specialKeys = Keyboard.specialKeys, cpcKey = String(cpcKeyCode);
            var cpcKeyEntry = pressedKeys[cpcKey];
            if (!cpcKeyEntry) {
                pressedKeys[cpcKey] = {
                    keys: {},
                    shift: false,
                    ctrl: false
                };
                cpcKeyEntry = pressedKeys[cpcKey];
            }
            var keyAlreadyPressed = cpcKeyEntry.keys[pressedKey];
            cpcKeyEntry.keys[pressedKey] = true;
            cpcKeyEntry.shift = shiftKey;
            cpcKeyEntry.ctrl = ctrlKey;
            if (Utils_13.Utils.debug > 1) {
                Utils_13.Utils.console.log("fnPressCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKey);
            }
            var repeat = cpcKeyExpansions.repeat;
            if (keyAlreadyPressed && ((cpcKey in repeat) && !repeat[cpcKey])) {
                key = ""; // repeat off => ignore key
            }
            else {
                var expansions = void 0;
                if (ctrlKey) {
                    expansions = cpcKeyExpansions.ctrl;
                }
                else if (shiftKey) {
                    expansions = cpcKeyExpansions.shift;
                }
                else {
                    expansions = cpcKeyExpansions.normal;
                }
                if (cpcKey in expansions) {
                    var expKey = expansions[cpcKey];
                    if (expKey >= 128 && expKey <= 159) {
                        key = this.expansionTokens[expKey - 128];
                        for (var i = 0; i < key.length; i += 1) {
                            this.putKeyInBuffer(key.charAt(i));
                        }
                    }
                    else { // ascii code
                        key = String.fromCharCode(expKey);
                        this.putKeyInBuffer(key.charAt(0));
                    }
                    key = ""; // already done, ignore key form keyboard
                }
            }
            var shiftCtrlKey = key + (shiftKey ? "Shift" : "") + (ctrlKey ? "Ctrl" : "");
            if (shiftCtrlKey in specialKeys) {
                key = specialKeys[shiftCtrlKey];
            }
            else if (key in specialKeys) {
                key = specialKeys[key];
            }
            else if (ctrlKey) {
                if (key >= "a" && key <= "z") { // map keys with ctrl to control codes (problem: some control codes are browser functions, e.g. w: close window)
                    key = String.fromCharCode(key.charCodeAt(0) - 96); // ctrl+a => \x01
                }
            }
            if (key.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
                this.putKeyInBuffer(key);
            }
            if (cpcKeyCode === 66 && this.options.fnOnEscapeHandler) { // or: key === "Escape" or "Esc" (on IE)
                this.options.fnOnEscapeHandler(key, pressedKey);
            }
            if (this.options.fnOnKeyDown) { // special handler?
                this.options.fnOnKeyDown();
            }
        };
        Keyboard.prototype.fnReleaseCpcKey = function (cpcKeyCode, pressedKey, key, shiftKey, ctrlKey) {
            var pressedKeys = this.pressedKeys, cpcKey = pressedKeys[cpcKeyCode];
            if (Utils_13.Utils.debug > 1) {
                Utils_13.Utils.console.log("fnReleaseCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKeyCode + ", keys:", (cpcKey ? cpcKey.keys : "undef."));
            }
            if (!cpcKey) {
                Utils_13.Utils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", cpcKeyCode);
            }
            else {
                delete cpcKey.keys[pressedKey];
                if (!Object.keys(cpcKey.keys).length) {
                    delete pressedKeys[cpcKeyCode];
                }
                else {
                    cpcKey.shift = shiftKey;
                    cpcKey.ctrl = ctrlKey;
                }
            }
        };
        Keyboard.keyIdentifier2Char = function (event) {
            // SliTaz web browser has not key but keyIdentifier
            var identifier = event.keyIdentifier, // eslint-disable-line @typescript-eslint/no-explicit-any
            shiftKey = event.shiftKey;
            var char = "";
            if ((/^U\+/i).test(identifier || "")) { // unicode string?
                char = String.fromCharCode(parseInt(identifier.substr(2), 16));
                if (char === "\0") { // ignore
                    char = "";
                }
                char = shiftKey ? char.toUpperCase() : char.toLowerCase(); // do we get keys in unicode always in uppercase?
            }
            else {
                char = identifier; // take it, could be "Enter"
            }
            return char;
        };
        Keyboard.prototype.fnKeyboardKeydown = function (event) {
            var keyCode = event.which || event.keyCode, pressedKey = String(keyCode) + (event.code ? event.code : ""); // event.code available for e.g. Chrome, Firefox
            var key = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
            if (!event.code && !this.codeStringsRemoved) { // event.code not available on e.g. IE, Edge
                this.removeCodeStringsFromKeymap(); // remove code information from the mapping. Not all keys can be detected any more
                this.codeStringsRemoved = true;
            }
            if (Utils_13.Utils.debug > 1) {
                Utils_13.Utils.console.log("fnKeyboardKeydown: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
            }
            if (pressedKey in this.key2CpcKey) {
                var cpcKey = this.key2CpcKey[pressedKey];
                if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                    cpcKey = 22;
                }
                // map numpad cursor to joystick
                if (cpcKey === 72) {
                    key = "JoyUp";
                }
                else if (cpcKey === 73) {
                    key = "JoyDown";
                }
                else if (cpcKey === 74) {
                    key = "JoyLeft";
                }
                else if (cpcKey === 75) {
                    key = "JoyRight";
                }
                else if (key === "Dead") { // Chrome, FF
                    key += event.code + (event.shiftKey ? "Shift" : ""); // special handling => "DeadBackquote" or "DeadEqual"; and "Shift"
                }
                else if (key === "Unidentified") { // IE, Edge
                    if (keyCode === 220) {
                        key = event.shiftKey ? "°" : "DeadBackquote";
                    }
                    else if (keyCode === 221) {
                        key = "DeadEqual" + (event.shiftKey ? "Shift" : "");
                    }
                    else if (keyCode === 226) { // "|"
                        key = "|";
                    }
                }
                else if (key.length === 2) {
                    if (key.charAt(0) === "^" || key.charAt(0) === "´" || key.charAt(0) === "`") { // IE, Edge? prefix key
                        key = key.substring(1); // remove prefix
                    }
                }
                this.fnPressCpcKey(cpcKey, pressedKey, key, event.shiftKey, event.ctrlKey);
            }
            else if (key.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
                this.putKeyInBuffer(key);
                Utils_13.Utils.console.log("fnKeyboardKeydown: Partly unhandled key", pressedKey + ":", key);
            }
            else {
                Utils_13.Utils.console.log("fnKeyboardKeydown: Unhandled key", pressedKey + ":", key);
            }
        };
        Keyboard.prototype.fnKeyboardKeyup = function (event) {
            var keyCode = event.which || event.keyCode, pressedKey = String(keyCode) + (event.code ? event.code : ""), // event.code available for e.g. Chrome, Firefox
            key = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier
            if (Utils_13.Utils.debug > 1) {
                Utils_13.Utils.console.log("fnKeyboardKeyup: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
            }
            if (pressedKey in this.key2CpcKey) {
                var cpcKey = this.key2CpcKey[pressedKey];
                if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
                    cpcKey = 22;
                }
                this.fnReleaseCpcKey(cpcKey, pressedKey, key, event.shiftKey, event.ctrlKey);
            }
            else {
                Utils_13.Utils.console.log("fnKeyboardKeyup: Unhandled key", pressedKey + ":", key);
            }
        };
        Keyboard.prototype.getKeyFromBuffer = function () {
            var keyBuffer = this.keyBuffer, key = keyBuffer.length ? keyBuffer.shift() : "";
            return key;
        };
        Keyboard.prototype.putKeyInBuffer = function (key) {
            this.keyBuffer.push(key);
        };
        Keyboard.prototype.putKeysInBuffer = function (input) {
            for (var i = 0; i < input.length; i += 1) {
                var key = input.charAt(i);
                this.keyBuffer.push(key);
            }
        };
        Keyboard.prototype.getKeyState = function (cpcKeyCode) {
            var pressedKeys = this.pressedKeys;
            var state = -1;
            if (cpcKeyCode in pressedKeys) {
                var cpcKeyEntry = pressedKeys[cpcKeyCode];
                state = 0 + (cpcKeyEntry.shift ? 32 : 0) + (cpcKeyEntry.ctrl ? 128 : 0);
            }
            return state;
        };
        Keyboard.prototype.getJoyState = function (joy) {
            var joyKeyList = Keyboard.joyKeyCodes[joy];
            var value = 0;
            /* eslint-disable no-bitwise */
            for (var i = 0; i < joyKeyList.length; i += 1) {
                if (this.getKeyState(joyKeyList[i]) !== -1) {
                    value |= (1 << i);
                }
            }
            // check additional special codes for joy 0 (not available on CPC)
            if (joy === 0) {
                if (this.getKeyState(80) !== -1) { // up left
                    value |= 1 + 4;
                }
                if (this.getKeyState(81) !== -1) { // up right
                    value |= 1 + 8;
                }
                if (this.getKeyState(82) !== -1) { // down left
                    value |= 2 + 4;
                }
                if (this.getKeyState(83) !== -1) { // down right
                    value |= 2 + 8;
                }
            }
            /* eslint-enable no-bitwise */
            return value;
        };
        Keyboard.prototype.setExpansionToken = function (token, string) {
            this.expansionTokens[token] = string;
        };
        Keyboard.prototype.setCpcKeyExpansion = function (options) {
            var cpcKeyExpansions = this.cpcKeyExpansions, cpcKey = options.cpcKey;
            cpcKeyExpansions.repeat[cpcKey] = options.repeat;
            if (options.normal !== undefined) {
                cpcKeyExpansions.normal[cpcKey] = options.normal;
            }
            if (options.shift !== undefined) {
                cpcKeyExpansions.shift[cpcKey] = options.shift;
            }
            if (options.ctrl !== undefined) {
                cpcKeyExpansions.ctrl[cpcKey] = options.ctrl;
            }
        };
        Keyboard.prototype.onCpcAreaKeydown = function (event) {
            if (this.active) {
                this.fnKeyboardKeydown(event);
                event.preventDefault();
                return false;
            }
            return undefined;
        };
        Keyboard.prototype.oncpcAreaKeyup = function (event) {
            if (this.active) {
                this.fnKeyboardKeyup(event);
                event.preventDefault();
                return false;
            }
            return undefined;
        };
        // use this:
        Keyboard.key2CpcKey = {
            "38ArrowUp": 0,
            "39ArrowRight": 1,
            "40ArrowDown": 2,
            "105Numpad9": 3,
            "120F9": 3,
            "102Numpad6": 4,
            "117F6": 4,
            "99Numpad3": 5,
            "114F3": 5,
            "13NumpadEnter": 6,
            "110NumpadDecimal": 7,
            "37ArrowLeft": 8,
            "18AltLeft": 9,
            "103Numpad7": 10,
            "118F7": 10,
            "104Numpad8": 11,
            "119F8": 11,
            "101Numpad5": 12,
            "116F5": 12,
            "97Numpad1": 13,
            "112F1": 13,
            "98Numpad2": 14,
            "113F2": 14,
            "96Numpad0": 15,
            "121F10": 15,
            "46Delete": 16,
            "187BracketRight": 17,
            "171BracketRight": 17,
            "221BracketRight": 17,
            "13Enter": 18,
            "191Backslash": 19,
            "163Backslash": 19,
            "220Backslash": 19,
            "100Numpad4": 20,
            "115F4": 20,
            "16ShiftLeft": 21,
            "16ShiftRight": 21,
            "220Backquote": 22,
            "160Backquote": 22,
            "192Backquote": 22,
            "17ControlLeft": 23,
            "17ControlRight": 23,
            "221Equal": 24,
            "192Equal": 24,
            "187Equal": 24,
            "219Minus": 25,
            "63Minus": 25,
            "189Minus": 25,
            "186BracketLeft": 26,
            "59BracketLeft": 26,
            "219BracketLeft": 26,
            "80KeyP": 27,
            "222Quote": 28,
            "192Quote": 28,
            "192Semicolon": 29,
            "186Semicolon": 29,
            "189Slash": 30,
            "173Slash": 30,
            "191Slash": 30,
            "190Period": 31,
            "48Digit0": 32,
            "57Digit9": 33,
            "79KeyO": 34,
            "73KeyI": 35,
            "76KeyL": 36,
            "75KeyK": 37,
            "77KeyM": 38,
            "188Comma": 39,
            "56Digit8": 40,
            "55Digit7": 41,
            "85KeyU": 42,
            "90KeyY": 43,
            "89KeyY": 43,
            "72KeyH": 44,
            "74KeyJ": 45,
            "78KeyN": 46,
            "32Space": 47,
            "54Digit6": 48,
            "53Digit5": 49,
            "82KeyR": 50,
            "84KeyT": 51,
            "71KeyG": 52,
            "70KeyF": 53,
            "66KeyB": 54,
            "86KeyV": 55,
            "52Digit4": 56,
            "51Digit3": 57,
            "69KeyE": 58,
            "87KeyW": 59,
            "83KeyS": 60,
            "68KeyD": 61,
            "67KeyC": 62,
            "88KeyX": 63,
            "49Digit1": 64,
            "50Digit2": 65,
            "27Escape": 66,
            "81KeyQ": 67,
            "9Tab": 68,
            "65KeyA": 69,
            "20CapsLock": 70,
            "89KeyZ": 71,
            "90KeyZ": 71,
            "38Numpad8": 72,
            "40Numpad2": 73,
            "37Numpad4": 74,
            "39Numpad6": 75,
            "12Numpad5": 76,
            "45Numpad0": 76,
            "46NumpadDecimal": 77,
            "8Backspace": 79,
            "36Numpad7": 80,
            "33Numpad9": 81,
            "35Numpad1": 82,
            "34Numpad3": 83,
            "226IntlBackslash": 85,
            "60IntlBackslash": 85,
            "220IntlBackslash": 85,
            "111NumpadDivide": 86,
            "106NumpadMultiply": 87,
            "109NumpadSubtract": 88,
            "107NumpadAdd": 89
        };
        Keyboard.specialKeys = {
            Alt: String.fromCharCode(224),
            ArrowUp: String.fromCharCode(240),
            ArrowDown: String.fromCharCode(241),
            ArrowLeft: String.fromCharCode(242),
            ArrowRight: String.fromCharCode(243),
            ArrowUpShift: String.fromCharCode(244),
            ArrowDownShift: String.fromCharCode(245),
            ArrowLeftShift: String.fromCharCode(246),
            ArrowRightShift: String.fromCharCode(247),
            ArrowUpCtrl: String.fromCharCode(248),
            ArrowDownCtrl: String.fromCharCode(249),
            ArrowLeftCtrl: String.fromCharCode(250),
            ArrowRightCtrl: String.fromCharCode(251),
            Backspace: String.fromCharCode(127),
            Delete: String.fromCharCode(16),
            Enter: "\r",
            JoyUp: String.fromCharCode(11),
            JoyDown: String.fromCharCode(10),
            JoyLeft: String.fromCharCode(8),
            JoyRight: String.fromCharCode(9),
            Clear: "X",
            Spacebar: " ",
            Tab: String.fromCharCode(9),
            ä: ";",
            Ä: "+",
            ö: ":",
            Ö: "*",
            ü: "@",
            Ü: "|",
            ß: "-",
            DeadBackquote: "^",
            "°": "£",
            DeadEqual: String.fromCharCode(161),
            "´": String.fromCharCode(161),
            DeadEqualShift: "`" // backtick
        };
        /* eslint-disable array-element-newline */
        Keyboard.joyKeyCodes = [
            [72, 73, 74, 75, 76, 77],
            [48, 49, 50, 51, 52, 53]
        ];
        return Keyboard;
    }());
    exports.Keyboard = Keyboard;
});
// VirtualKeyboard.ts - VirtualKeyboard
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("VirtualKeyboard", ["require", "exports", "Utils", "View"], function (require, exports, Utils_14, View_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VirtualKeyboard = void 0;
    var VirtualKeyboard = /** @class */ (function () {
        function VirtualKeyboard(options) {
            this.shiftLock = false;
            this.numLock = false;
            /* eslint-enable array-element-newline */
            this.dragInfo = {
                dragItem: undefined,
                active: false,
                xOffset: 0,
                yOffset: 0,
                initialX: 0,
                initialY: 0,
                currentX: 0,
                currentY: 0
            };
            this.options = {
                fnPressCpcKey: options.fnPressCpcKey,
                fnReleaseCpcKey: options.fnReleaseCpcKey
            };
            var eventNames = this.fnAttachPointerEvents("kbdArea", this.onVirtualVirtualKeyboardKeydown.bind(this), undefined, this.onVirtualVirtualKeyboardKeyup.bind(this));
            if (eventNames.out) {
                this.pointerOutEvent = eventNames.out;
                this.fnVirtualKeyout = this.onVirtualVirtualKeyboardKeyout.bind(this);
            }
            this.dragInit("pageBody", "kbdAreaBox");
            this.virtualKeyboardCreate();
        }
        VirtualKeyboard.prototype.fnAttachPointerEvents = function (id, fnDown, fnMove, fnUp) {
            var area = View_2.View.getElementById1(id);
            var eventNames;
            if (window.PointerEvent) {
                eventNames = VirtualKeyboard.pointerEventNames;
            }
            else if ("ontouchstart" in window || navigator.maxTouchPoints) {
                eventNames = VirtualKeyboard.touchEventNames;
            }
            else {
                eventNames = VirtualKeyboard.mouseEventNames;
            }
            if (Utils_14.Utils.debug > 0) {
                Utils_14.Utils.console.log("fnAttachPointerEvents: Using", eventNames.type, "events");
            }
            if (fnDown) {
                area.addEventListener(eventNames.down, fnDown, false); // +clicked for pointer, touch?
            }
            if (fnMove) {
                area.addEventListener(eventNames.move, fnMove, false);
            }
            if (fnUp) {
                area.addEventListener(eventNames.up, fnUp, false);
                if (eventNames.cancel) {
                    area.addEventListener(eventNames.cancel, fnUp, false);
                }
            }
            return eventNames;
        };
        VirtualKeyboard.prototype.reset = function () {
            this.virtualKeyboardAdaptKeys(false, false);
        };
        VirtualKeyboard.prototype.mapNumLockCpcKey = function (cpcKey) {
            var key = VirtualKeyboard.cpcKey2Key[cpcKey];
            if (key.numLockCpcKey) {
                cpcKey = key.numLockCpcKey;
            }
            return cpcKey;
        };
        VirtualKeyboard.prototype.fnVirtualGetAscii = function (cpcKey, shiftKey, numLock) {
            var keyEntry = VirtualKeyboard.cpcKey2Key[cpcKey];
            var key, text, title;
            if (numLock && keyEntry.keyNumLock) {
                key = keyEntry.keyNumLock;
                text = keyEntry.textNumLock || key;
                title = keyEntry.titleNumLock || text;
            }
            else if (shiftKey && keyEntry.keyShift) {
                key = keyEntry.keyShift;
                text = keyEntry.textShift || key;
                title = keyEntry.titleShift || text;
            }
            else {
                key = keyEntry.key;
                text = keyEntry.text || key;
                title = keyEntry.title || text;
            }
            return {
                key: key,
                text: text,
                title: title
            };
        };
        VirtualKeyboard.prototype.createButtonRow = function (id, options) {
            var place = View_2.View.getElementById1(id);
            if (place.insertAdjacentElement) {
                var buttonList = document.createElement("div");
                buttonList.className = "displayFlex";
                for (var i = 0; i < options.length; i += 1) {
                    var item = options[i], button = document.createElement("button");
                    button.innerText = item.text;
                    button.setAttribute("title", item.title);
                    button.className = item.className;
                    button.setAttribute("data-key", String(item.key));
                    buttonList.insertAdjacentElement("beforeend", button);
                }
                place.insertAdjacentElement("beforeend", buttonList);
            }
            else { // Polyfill for old browsers
                var html = "<div class=displayFlex>\n";
                for (var i = 0; i < options.length; i += 1) {
                    var item = options[i];
                    html += '<button title="' + item.title + '" class="' + item.className + '" data-key="' + item.key + '">' + item.text + "</button>\n";
                }
                html += "</div>";
                place.innerHTML += html;
            }
            return this;
        };
        VirtualKeyboard.prototype.virtualKeyboardCreatePart = function (id, virtualVirtualKeyboard) {
            var keyArea = View_2.View.getElementById1(id), shiftLock = this.shiftLock, numLock = this.numLock, cpcKey2Key = VirtualKeyboard.cpcKey2Key, buttons = keyArea.getElementsByTagName("button");
            if (!buttons.length) { // not yet created?
                for (var row = 0; row < virtualVirtualKeyboard.length; row += 1) {
                    var rowList = virtualVirtualKeyboard[row], optionsList = [];
                    for (var col = 0; col < rowList.length; col += 1) {
                        var cpcKeyEntry = void 0;
                        if (typeof rowList[col] === "number") {
                            cpcKeyEntry = {
                                key: rowList[col]
                            };
                        }
                        else { // object
                            cpcKeyEntry = rowList[col];
                        }
                        var cpcKey = numLock ? this.mapNumLockCpcKey(cpcKeyEntry.key) : cpcKeyEntry.key, keyEntry = cpcKey2Key[cpcKeyEntry.key], ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock), className = "kbdButton" + (cpcKeyEntry.style || keyEntry.style || "") + ((col === rowList.length - 1) ? " kbdNoRightMargin" : ""), options = {
                            key: cpcKey,
                            text: ascii.text,
                            title: ascii.title,
                            className: className
                        };
                        optionsList.push(options);
                    }
                    this.createButtonRow(id, optionsList);
                }
            }
        };
        VirtualKeyboard.prototype.virtualKeyboardCreate = function () {
            this.virtualKeyboardCreatePart("kbdAlpha", VirtualKeyboard.virtualVirtualKeyboardAlpha);
            this.virtualKeyboardCreatePart("kbdNum", VirtualKeyboard.virtualVirtualKeyboardNum);
        };
        VirtualKeyboard.prototype.virtualKeyboardAdaptKeys = function (shiftLock, numLock) {
            var keyArea = View_2.View.getElementById1("kbdArea"), buttons = keyArea.getElementsByTagName("button"); // or: keyArea.childNodes and filter
            for (var i = 0; i < buttons.length; i += 1) {
                var button = buttons[i];
                var cpcKey = Number(button.getAttribute("data-key"));
                if (numLock) {
                    cpcKey = this.mapNumLockCpcKey(cpcKey);
                }
                var ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock);
                if (ascii.key !== button.innerText) {
                    button.innerText = ascii.text;
                    button.title = ascii.title;
                }
            }
        };
        VirtualKeyboard.prototype.fnVirtualGetPressedKey = function (cpcKey) {
            var key = VirtualKeyboard.cpcKey2Key[cpcKey];
            var pressedKey = "";
            if (key) {
                pressedKey = key.keys;
                if (pressedKey.indexOf(",") >= 0) { // maybe more
                    pressedKey = pressedKey.substring(0, pressedKey.indexOf(",")); // take the first
                }
            }
            return pressedKey;
        };
        VirtualKeyboard.prototype.onVirtualVirtualKeyboardKeydown = function (event) {
            var node = View_2.View.getEventTarget(event), cpcKey = node.getAttribute("data-key");
            if (Utils_14.Utils.debug > 1) {
                Utils_14.Utils.console.debug("onVirtualVirtualKeyboardKeydown: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", cpcKey);
            }
            if (cpcKey !== null) {
                var cpcKeyCode = Number(cpcKey);
                if (this.numLock) {
                    cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
                }
                var pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode), pointerEvent = event, ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || pointerEvent.shiftKey, this.numLock);
                this.options.fnPressCpcKey(cpcKeyCode, pressedKey, ascii.key, pointerEvent.shiftKey, pointerEvent.ctrlKey);
            }
            if (this.pointerOutEvent && this.fnVirtualKeyout) {
                node.addEventListener(this.pointerOutEvent, this.fnVirtualKeyout, false);
            }
            event.preventDefault();
            return false;
        };
        VirtualKeyboard.prototype.fnVirtualVirtualKeyboardKeyupOrKeyout = function (event) {
            var node = View_2.View.getEventTarget(event), cpcKey = node.getAttribute("data-key");
            if (cpcKey !== null) {
                var cpcKeyCode = Number(cpcKey);
                if (this.numLock) {
                    cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
                }
                var pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode), pointerEvent = event, ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || pointerEvent.shiftKey, this.numLock);
                this.options.fnReleaseCpcKey(cpcKeyCode, pressedKey, ascii.key, pointerEvent.shiftKey, pointerEvent.ctrlKey);
                if (cpcKeyCode === 70) { // Caps Lock?
                    this.shiftLock = !this.shiftLock;
                    this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
                }
                else if (cpcKeyCode === 90) { // Num lock
                    this.numLock = !this.numLock;
                    this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
                }
            }
        };
        VirtualKeyboard.prototype.onVirtualVirtualKeyboardKeyup = function (event) {
            var node = View_2.View.getEventTarget(event);
            if (Utils_14.Utils.debug > 1) {
                Utils_14.Utils.console.debug("onVirtualVirtualKeyboardKeyup: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", node.getAttribute("data-key"));
            }
            this.fnVirtualVirtualKeyboardKeyupOrKeyout(event);
            if (this.pointerOutEvent && this.fnVirtualKeyout) {
                node.removeEventListener(this.pointerOutEvent, this.fnVirtualKeyout); // do not need out event any more
            }
            event.preventDefault();
            return false;
        };
        VirtualKeyboard.prototype.onVirtualVirtualKeyboardKeyout = function (event) {
            var node = View_2.View.getEventTarget(event);
            if (Utils_14.Utils.debug > 1) {
                Utils_14.Utils.console.debug("onVirtualVirtualKeyboardKeyout: event=", event);
            }
            this.fnVirtualVirtualKeyboardKeyupOrKeyout(event);
            if (this.pointerOutEvent && this.fnVirtualKeyout) {
                node.removeEventListener(this.pointerOutEvent, this.fnVirtualKeyout);
            }
            event.preventDefault();
            return false;
        };
        // based on https://www.kirupa.com/html5/drag.htm
        VirtualKeyboard.prototype.dragInit = function (containerId, itemId) {
            var drag = this.dragInfo;
            drag.dragItem = View_2.View.getElementById1(itemId);
            drag.active = false;
            drag.xOffset = 0;
            drag.yOffset = 0;
            this.fnAttachPointerEvents(containerId, this.dragStart.bind(this), this.drag.bind(this), this.dragEnd.bind(this));
        };
        VirtualKeyboard.prototype.dragStart = function (event) {
            var node = View_2.View.getEventTarget(event), parent = node.parentElement ? node.parentElement.parentElement : null, drag = this.dragInfo;
            if (node === drag.dragItem || parent === drag.dragItem) {
                if (event.type === "touchstart") {
                    var touchEvent = event;
                    drag.initialX = touchEvent.touches[0].clientX - drag.xOffset;
                    drag.initialY = touchEvent.touches[0].clientY - drag.yOffset;
                }
                else {
                    var dragEvent = event;
                    drag.initialX = dragEvent.clientX - drag.xOffset;
                    drag.initialY = dragEvent.clientY - drag.yOffset;
                }
                drag.active = true;
            }
        };
        VirtualKeyboard.prototype.dragEnd = function ( /* event */) {
            var drag = this.dragInfo;
            drag.initialX = drag.currentX;
            drag.initialY = drag.currentY;
            drag.active = false;
        };
        VirtualKeyboard.prototype.setTranslate = function (xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        };
        VirtualKeyboard.prototype.drag = function (event) {
            var drag = this.dragInfo;
            if (drag.active) {
                event.preventDefault();
                if (event.type === "touchmove") {
                    var touchEvent = event;
                    drag.currentX = touchEvent.touches[0].clientX - drag.initialX;
                    drag.currentY = touchEvent.touches[0].clientY - drag.initialY;
                }
                else {
                    var dragEvent = event;
                    drag.currentX = dragEvent.clientX - drag.initialX;
                    drag.currentY = dragEvent.clientY - drag.initialY;
                }
                drag.xOffset = drag.currentX;
                drag.yOffset = drag.currentY;
                if (drag.dragItem) {
                    this.setTranslate(drag.currentX, drag.currentY, drag.dragItem);
                }
            }
        };
        VirtualKeyboard.cpcKey2Key = [
            {
                keys: "38ArrowUp",
                key: "ArrowUp",
                text: "\u2191",
                title: "Cursor up"
            },
            {
                keys: "39ArrowRight",
                key: "ArrowRight",
                text: "\u2192",
                title: "Cursor right",
                style: 1
            },
            {
                keys: "40ArrowDown",
                key: "ArrowDown",
                text: "\u2193",
                title: "Cursor down"
            },
            {
                keys: "105Numpad9,120F9",
                key: "9",
                text: "f9",
                style: 1,
                numLockCpcKey: 81 // joy 0 up+right
            },
            {
                keys: "102Numpad6,117F6",
                key: "6",
                text: "f6",
                style: 1,
                numLockCpcKey: 75 // joy 0 right
            },
            {
                keys: "99Numpad3,114F3",
                key: "3",
                text: "f3",
                style: 1,
                numLockCpcKey: 83 // joy 0 down+right
            },
            {
                keys: "13NumpadEnter",
                key: "Enter",
                style: 4
            },
            {
                keys: "110NumpadDecimal",
                key: ".",
                numLockCpcKey: 77 // joy 0 fire 1
            },
            {
                keys: "37ArrowLeft",
                key: "ArrowLeft",
                text: "\u2190",
                title: "Cursor left",
                style: 1
            },
            {
                keys: "18AltLeft",
                key: "Alt",
                text: "Copy",
                style: 2
            },
            {
                keys: "103Numpad7,118F7",
                key: "7",
                text: "f7",
                style: 1,
                numLockCpcKey: 80 // joy 0 up+left
            },
            {
                keys: "104Numpad8,119F8",
                key: "8",
                text: "f8",
                style: 1,
                numLockCpcKey: 72 // joy 0 up
            },
            {
                keys: "101Numpad5,116F5",
                key: "5",
                text: "f5",
                style: 1,
                numLockCpcKey: 76 // joy 0 fire 2
            },
            {
                keys: "97Numpad1,112F1",
                key: "1",
                text: "f1",
                style: 1,
                numLockCpcKey: 82 // joy 0 down+left
            },
            {
                keys: "98Numpad2,113F2",
                key: "2",
                text: "f2",
                style: 1,
                numLockCpcKey: 73 // joy 0 down
            },
            {
                keys: "96Numpad0,121F10",
                key: "0",
                text: "f0",
                style: 1
                // numLockCpcKey: 90 // Num lock
            },
            {
                keys: "46Delete",
                key: "Delete",
                text: "Clr",
                title: "Clear",
                style: 1
            },
            {
                keys: "187BracketRight,171BracketRight,221BracketRight",
                key: "[",
                keyShift: "{"
            },
            {
                keys: "13Enter",
                key: "Enter",
                text: "Ret",
                title: "Return",
                style: 2
            },
            {
                keys: "191Backslash,163Backslash,220Backslash",
                key: "]",
                keyShift: "}"
            },
            {
                keys: "100Numpad4,115F4",
                key: "4",
                text: "f4",
                style: 1,
                numLockCpcKey: 74 // joy 0 left
            },
            {
                keys: "16ShiftLeft,16ShiftRight",
                key: "Shift",
                style: 4
            },
            {
                keys: "220Backquote,160Backquote,192Backquote",
                key: "\\",
                keyShift: "`"
            },
            {
                keys: "17ControlLeft,17ControlRight",
                key: "Control",
                text: "Ctrl",
                title: "Control",
                style: 4
            },
            {
                keys: "221Equal,192Equal,187Equal",
                key: "^",
                keyShift: "£"
            },
            {
                keys: "219Minus,63Minus,189Minus",
                key: "-",
                keyShift: "="
            },
            {
                keys: "186BracketLeft,59BracketLeft,219BracketLeft",
                key: "@",
                keyShift: "|",
                style: 1
            },
            {
                keys: "80KeyP",
                key: "p",
                keyShift: "P"
            },
            {
                keys: "222Quote,192Quote",
                key: ";",
                keyShift: "+"
            },
            {
                keys: "192Semicolon,186Semicolon",
                key: ":",
                keyShift: "*"
            },
            {
                keys: "189Slash,173Slash,191Slash",
                key: "/",
                keyShift: "?"
            },
            {
                keys: "190Period",
                key: ".",
                keyShift: "<"
            },
            {
                keys: "48Digit0",
                key: "0",
                keyShift: "_"
            },
            {
                keys: "57Digit9",
                key: "9",
                keyShift: ")"
            },
            {
                keys: "79KeyO",
                key: "o",
                keyShift: "O"
            },
            {
                keys: "73KeyI",
                key: "i",
                keyShift: "I"
            },
            {
                keys: "76KeyL",
                key: "l",
                keyShift: "L"
            },
            {
                keys: "75KeyK",
                key: "k",
                keyShift: "K"
            },
            {
                keys: "77KeyM",
                key: "m",
                keyShift: "M"
            },
            {
                keys: "188Comma",
                key: ",",
                keyShift: ">"
            },
            {
                keys: "56Digit8",
                key: "8",
                keyShift: "("
            },
            {
                keys: "55Digit7",
                key: "7",
                keyShift: "'"
            },
            {
                keys: "85KeyU",
                key: "u",
                keyShift: "U"
            },
            {
                keys: "90KeyY,89KeyY",
                key: "y",
                keyShift: "Y"
            },
            {
                keys: "72KeyH",
                key: "h",
                keyShift: "H"
            },
            {
                keys: "74KeyJ",
                key: "j",
                keyShift: "J"
            },
            {
                keys: "78KeyN",
                key: "n",
                keyShift: "N"
            },
            {
                keys: "32Space",
                key: " ",
                text: "Space",
                style: 5
            },
            {
                keys: "54Digit6",
                key: "6",
                keyShift: "("
            },
            {
                keys: "53Digit5",
                key: "5",
                keyShift: "%"
            },
            {
                keys: "82KeyR",
                key: "r",
                keyShift: "R"
            },
            {
                keys: "84KeyT",
                key: "t",
                keyShift: "T"
            },
            {
                keys: "71KeyG",
                key: "g",
                keyShift: "G"
            },
            {
                keys: "70KeyF",
                key: "f",
                keyShift: "F"
            },
            {
                keys: "66KeyB",
                key: "b",
                keyShift: "B"
            },
            {
                keys: "86KeyV",
                key: "v",
                keyShift: "V"
            },
            {
                keys: "52Digit4",
                key: "4",
                keyShift: "$"
            },
            {
                keys: "51Digit3",
                key: "3",
                keyShift: "#"
            },
            {
                keys: "69KeyE",
                key: "e",
                keyShift: "E"
            },
            {
                keys: "87KeyW",
                key: "w",
                keyShift: "W"
            },
            {
                keys: "83KeyS",
                key: "s",
                keyShift: "S"
            },
            {
                keys: "68KeyD",
                key: "d",
                keyShift: "D"
            },
            {
                keys: "67KeyC",
                key: "c",
                keyShift: "C"
            },
            {
                keys: "88KeyX",
                key: "x",
                keyShift: "X"
            },
            {
                keys: "49Digit1",
                key: "1",
                keyShift: "!"
            },
            {
                keys: "50Digit2",
                key: "2",
                keyShift: "\""
            },
            {
                keys: "27Escape",
                key: "Escape",
                text: "Esc",
                title: "Escape",
                style: 1
            },
            {
                keys: "81KeyQ",
                key: "q",
                keyShift: "Q"
            },
            {
                keys: "9Tab",
                key: "Tab",
                style: 2
            },
            {
                keys: "65KeyA",
                key: "a",
                keyShift: "A"
            },
            {
                keys: "20CapsLock",
                key: "CapsLock",
                text: "Caps",
                title: "Caps Lock",
                style: 3
            },
            {
                keys: "89KeyZ,90KeyZ",
                key: "z",
                keyShift: "Z"
            },
            {
                keys: "38Numpad8",
                key: "JoyUp",
                text: "\u21D1",
                title: "Joy up"
            },
            {
                keys: "40Numpad2",
                key: "JoyDown",
                text: "\u21D3",
                title: "Joy down"
            },
            {
                keys: "37Numpad4",
                key: "JoyLeft",
                text: "\u21D0",
                title: "Joy left"
            },
            {
                keys: "39Numpad6",
                key: "JoyRight",
                text: "\u21D2",
                title: "Joy right"
            },
            {
                keys: "12Numpad5,45Numpad0",
                key: "X",
                text: "\u29BF",
                title: "Joy fire"
            },
            {
                keys: "46NumpadDecimal",
                key: "Z",
                text: "\u25E6",
                title: "Joy fire 1"
            },
            {
                keys: "",
                key: ""
            },
            {
                keys: "8Backspace",
                key: "Backspace",
                text: "Del",
                title: "Delete",
                style: 1
            },
            // starting with 80, not on CPC
            // not on CPC:
            {
                keys: "36Numpad7",
                key: "",
                text: "\u21D6",
                title: "Joy up+left"
            },
            {
                keys: "33Numpad9",
                key: "",
                text: "\u21D7",
                title: "Joy up+right"
            },
            {
                keys: "35Numpad1",
                key: "",
                text: "\u21D9",
                title: "Joy down+leftt"
            },
            {
                keys: "34Numpad3",
                key: "",
                text: "\u21D8",
                title: "Joy down+right"
            },
            {
                keys: "",
                key: ""
            },
            {
                keys: "226IntlBackslash,60IntlBackslash,220IntlBackslash",
                key: ""
            },
            {
                keys: "111NumpadDivide",
                key: ""
            },
            {
                keys: "106NumpadMultiply",
                key: ""
            },
            {
                keys: "109NumpadSubtract",
                key: ""
            },
            {
                keys: "107NumpadAdd",
                key: ""
            },
            {
                keys: "",
                key: "",
                text: "Num",
                title: "Num / Joy",
                style: 1
            }
            // only on PC:
            // "226IntlBackslash", "122F11", "123F12", "44PrintScreen", "145ScrollLock", "19Pause", "45Insert", "36Home", "33PageUp", "35End", "34PageDown", "111NumpadDivide", "106NumpadMultiply", "109NumpadSubtract", "107NumpadAdd"
        ];
        /* eslint-disable array-element-newline */
        VirtualKeyboard.virtualVirtualKeyboardAlpha = [
            [66, 64, 65, 57, 56, 49, 48, 41, 40, 33, 32, 25, 24, 16, 79],
            [68, 67, 59, 58, 50, 51, 43, 42, 35, 34, 27, 26, 17, 18],
            [70, 69, 60, 61, 53, 52, 44, 45, 37, 36, 29, 28, 19, 90],
            [
                21, 71, 63, 62, 55, 54, 46, 38, 39, 31, 30, 22,
                {
                    key: 21,
                    style: 2
                }
            ],
            [23, 9, 47, 6]
        ];
        VirtualKeyboard.virtualVirtualKeyboardNum = [
            [10, 11, 3],
            [20, 12, 4],
            [13, 14, 5],
            [15, 0, 7],
            [8, 2, 1]
        ];
        VirtualKeyboard.pointerEventNames = {
            down: "pointerdown",
            move: "pointermove",
            up: "pointerup",
            cancel: "pointercancel",
            out: "pointerout",
            type: "pointer"
        };
        VirtualKeyboard.touchEventNames = {
            down: "touchstart",
            move: "touchmove",
            up: "touchend",
            cancel: "touchcancel",
            out: "",
            type: "touch"
        };
        VirtualKeyboard.mouseEventNames = {
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            cancel: "",
            out: "mouseout",
            type: "mouse"
        };
        return VirtualKeyboard;
    }());
    exports.VirtualKeyboard = VirtualKeyboard;
});
// Canvas.ts - Graphics output to HTML canvas
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
/* globals ArrayBuffer, Uint8Array, Uint32Array */
define("Canvas", ["require", "exports", "Utils", "View"], function (require, exports, Utils_15, View_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Canvas = void 0;
    var Canvas = /** @class */ (function () {
        //setOptions(options: CanvasOptions): void { }
        function Canvas(options) {
            this.fps = 15; // FPS for canvas update
            this.customCharset = {};
            this.gColMode = 0; // 0=normal, 1=xor, 2=and, 3=or
            this.mask = 255;
            this.maskBit = 128;
            this.maskFirst = 1;
            this.offset = 0; // screen offset
            this.borderWidth = 4;
            this.needUpdate = false;
            this.colorValues = [];
            this.currentInks = [];
            this.speedInk = [];
            this.inkSet = 0;
            this.pen2ColorMap = [];
            this.littleEndian = true;
            this.use32BitCopy = true; // determined later
            this.gPen = 0;
            this.gPaper = 0;
            this.speedInkCount = 0; // usually 10
            this.hasFocus = false; // canvas has focus
            this.mode = 0;
            this.modeData = Canvas.modeData[0];
            this.xPos = 0;
            this.yPos = 0;
            this.xOrig = 0;
            this.yOrig = 0;
            this.xLeft = 0;
            this.xRight = 639;
            this.yTop = 399;
            this.yBottom = 0;
            this.gTransparent = false;
            this.options = {
                charset: options.charset,
                colors: options.colors,
                onClickKey: options.onClickKey
            };
            this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
            this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);
            this.cpcAreaBox = View_3.View.getElementById1("cpcAreaBox");
            var canvas = View_3.View.getElementById1("cpcCanvas");
            this.canvas = canvas;
            // make sure canvas is not hidden (allows to get width, height, set style)
            if (canvas.offsetParent === null) {
                Utils_15.Utils.console.error("Error: canvas is not visible!");
            }
            var width = canvas.width, height = canvas.height;
            this.width = width;
            this.height = height;
            this.dataset8 = new Uint8Array(new ArrayBuffer(width * height)); // array with pen values
            this.setColors(this.options.colors);
            this.animationTimeoutId = undefined;
            this.animationFrame = undefined;
            if (this.canvas.getContext) { // not available on e.g. IE8
                this.ctx = this.canvas.getContext("2d");
                this.imageData = this.ctx.getImageData(0, 0, width, height);
                if (typeof Uint32Array !== "undefined" && this.imageData.data.buffer) { // imageData.data.buffer not available on IE10
                    this.littleEndian = Canvas.isLittleEndian();
                    this.pen2Color32 = new Uint32Array(new ArrayBuffer(Canvas.modeData[3].pens * 4));
                    this.data32 = new Uint32Array(this.imageData.data.buffer);
                    this.use32BitCopy = true;
                    Utils_15.Utils.console.log("Canvas: using optimized copy2Canvas32bit, littleEndian:", this.littleEndian);
                }
                else {
                    this.setAlpha(255);
                    this.use32BitCopy = false;
                    Utils_15.Utils.console.log("Canvas: using copy2Canvas8bit");
                }
                this.applyCopy2CanvasFunction(this.offset);
            }
            else {
                Utils_15.Utils.console.warn("Error: canvas.getContext is not supported.");
                this.ctx = {}; // not available
                this.imageData = {}; // not available
            }
            this.reset();
        }
        Canvas.prototype.reset = function () {
            this.changeMode(1);
            this.inkSet = 0;
            this.setDefaultInks();
            this.speedInk[0] = 10;
            this.speedInk[1] = 10;
            this.speedInkCount = this.speedInk[this.inkSet];
            this.canvas.style.borderColor = this.options.colors[this.currentInks[this.inkSet][16]];
            this.setGPen(1);
            this.setGPaper(0);
            this.resetCustomChars();
            this.setMode(1);
            this.clearGraphicsWindow();
        };
        Canvas.prototype.resetCustomChars = function () {
            this.customCharset = {}; // symbol
        };
        Canvas.isLittleEndian = function () {
            // https://gist.github.com/TooTallNate/4750953
            var b = new ArrayBuffer(4), a = new Uint32Array(b), c = new Uint8Array(b);
            a[0] = 0xdeadbeef;
            return (c[0] === 0xef);
        };
        Canvas.extractColorValues = function (color) {
            return [
                parseInt(color.substring(1, 3), 16),
                parseInt(color.substring(3, 5), 16),
                parseInt(color.substring(5, 7), 16)
            ];
        };
        Canvas.extractAllColorValues = function (colors, colorValues) {
            //const colorValues: number[][] = [];
            for (var i = 0; i < colors.length; i += 1) {
                colorValues[i] = Canvas.extractColorValues(colors[i]);
            }
        };
        Canvas.prototype.setColors = function (colors) {
            Canvas.extractAllColorValues(colors, this.colorValues);
        };
        Canvas.prototype.setAlpha = function (alpha) {
            var buf8 = this.imageData.data, length = this.dataset8.length; // or: this.width * this.height
            for (var i = 0; i < length; i += 1) {
                buf8[i * 4 + 3] = alpha; // alpha
            }
        };
        Canvas.prototype.setNeedUpdate = function () {
            this.needUpdate = true;
        };
        Canvas.prototype.updateCanvas2 = function () {
            this.animationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
            if (this.needUpdate) { // could be improved: update only updateRect
                this.needUpdate = false;
                // we always do a full updateCanvas...
                if (this.fnCopy2Canvas) { // not available on e.g. IE8
                    this.fnCopy2Canvas();
                }
            }
        };
        // http://creativejs.com/resources/requestanimationframe/ (set frame rate)
        // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
        Canvas.prototype.updateCanvas = function () {
            this.animationTimeoutId = window.setTimeout(this.fnUpdateCanvas2Handler, 1000 / this.fps); // ts (node)
        };
        Canvas.prototype.startUpdateCanvas = function () {
            if (this.animationFrame === undefined && this.canvas.offsetParent !== null) { // animation off and canvas visible in DOM?
                this.updateCanvas();
            }
        };
        Canvas.prototype.stopUpdateCanvas = function () {
            if (this.animationFrame !== undefined) {
                cancelAnimationFrame(this.animationFrame);
                clearTimeout(this.animationTimeoutId);
                this.animationFrame = undefined;
                this.animationTimeoutId = undefined;
            }
        };
        Canvas.prototype.copy2Canvas8bit = function () {
            var buf8 = this.imageData.data, // use Uint8ClampedArray from canvas
            dataset8 = this.dataset8, length = dataset8.length, // or: this.width * this.height
            pen2ColorMap = this.pen2ColorMap;
            for (var i = 0; i < length; i += 1) {
                var color = pen2ColorMap[dataset8[i]], j = i * 4;
                buf8[j] = color[0]; // r
                buf8[j + 1] = color[1]; // g
                buf8[j + 2] = color[2]; // b
                // alpha already set to 255
            }
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        Canvas.prototype.copy2Canvas32bit = function () {
            var dataset8 = this.dataset8, data32 = this.data32, pen2Color32 = this.pen2Color32;
            for (var i = 0; i < data32.length; i += 1) {
                data32[i] = pen2Color32[dataset8[i]];
            }
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        Canvas.prototype.copy2Canvas32bitWithOffset = function () {
            var dataset8 = this.dataset8, data32 = this.data32, pen2Color32 = this.pen2Color32, offset = this.offset;
            for (var i = 0; i < data32.length - offset; i += 1) {
                data32[i + offset] = pen2Color32[dataset8[i]];
            }
            for (var i = data32.length - offset; i < data32.length; i += 1) {
                data32[i + offset - data32.length] = pen2Color32[dataset8[i]];
            }
            this.ctx.putImageData(this.imageData, 0, 0);
        };
        Canvas.prototype.applyCopy2CanvasFunction = function (offset) {
            if (this.use32BitCopy) {
                this.fnCopy2Canvas = offset ? this.copy2Canvas32bitWithOffset : this.copy2Canvas32bit;
            }
            else {
                this.fnCopy2Canvas = offset ? this.copy2Canvas8bit : this.copy2Canvas8bit; // TODO: for older browsers
            }
        };
        Canvas.prototype.setScreenOffset = function (offset) {
            if (offset) {
                // TODO
                offset = (offset % 80) * 8 + ((offset / 80) | 0) * 80 * 16 * 8; // eslint-disable-line no-bitwise
                offset = 640 * 400 - offset;
            }
            if (offset !== this.offset) {
                this.offset = offset;
                this.applyCopy2CanvasFunction(offset);
                this.setNeedUpdate();
            }
        };
        Canvas.prototype.updateColorMap = function () {
            var colorValues = this.colorValues, currentInksInSet = this.currentInks[this.inkSet], pen2ColorMap = this.pen2ColorMap, pen2Color32 = this.pen2Color32;
            for (var i = 0; i < 16; i += 1) {
                pen2ColorMap[i] = colorValues[currentInksInSet[i]];
            }
            if (pen2Color32) {
                for (var i = 0; i < 16; i += 1) {
                    var color = pen2ColorMap[i];
                    if (this.littleEndian) {
                        pen2Color32[i] = color[0] + color[1] * 256 + color[2] * 65536 + 255 * 65536 * 256;
                    }
                    else {
                        pen2Color32[i] = color[2] + color[1] * 256 + color[0] * 65536 + 255 * 65536 * 256; // for big endian (untested)
                    }
                }
            }
        };
        Canvas.prototype.updateColorsAndCanvasImmediately = function (inkList) {
            if (this.fnCopy2Canvas) { // not available on e.g. IE8
                var currentInksInSet = this.currentInks[this.inkSet], memorizedInks = currentInksInSet.slice();
                this.currentInks[this.inkSet] = inkList; // temporary inks
                this.updateColorMap();
                this.fnCopy2Canvas(); // do it immediately
                this.currentInks[this.inkSet] = memorizedInks.slice();
                this.updateColorMap();
                this.needUpdate = true; // we want to restore it with the next update...
            }
        };
        Canvas.prototype.updateSpeedInk = function () {
            var pens = this.modeData.pens;
            this.speedInkCount -= 1;
            if (this.speedInkCount <= 0) {
                var currentInkSet = this.inkSet, newInkSet = currentInkSet ^ 1; // eslint-disable-line no-bitwise
                this.inkSet = newInkSet;
                this.speedInkCount = this.speedInk[newInkSet];
                // check for blinking inks which pens are visible in the current mode
                for (var i = 0; i < pens; i += 1) {
                    if (this.currentInks[newInkSet][i] !== this.currentInks[currentInkSet][i]) {
                        this.updateColorMap(); // need ink update
                        this.needUpdate = true; // we also need update
                        break;
                    }
                }
                // check border ink
                if (this.currentInks[newInkSet][16] !== this.currentInks[currentInkSet][16]) {
                    this.canvas.style.borderColor = this.options.colors[this.currentInks[newInkSet][16]];
                }
            }
        };
        Canvas.prototype.setCustomChar = function (char, charData) {
            this.customCharset[char] = charData;
        };
        Canvas.prototype.getCharData = function (char) {
            return this.customCharset[char] || this.options.charset[char];
        };
        Canvas.prototype.setDefaultInks = function () {
            this.currentInks[0] = Canvas.defaultInks[0].slice(); // copy ink set 0 array
            this.currentInks[1] = Canvas.defaultInks[1].slice(); // copy ink set 1 array
            this.updateColorMap();
            this.setGPen(this.gPen);
        };
        Canvas.prototype.setFocusOnCanvas = function () {
            this.cpcAreaBox.style.background = "#463c3c";
            if (this.canvas) {
                this.canvas.focus();
            }
            this.hasFocus = true;
        };
        Canvas.prototype.getMousePos = function (event) {
            var anyDoc = document, isFullScreen = Boolean(document.fullscreenElement || anyDoc.mozFullScreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement), rect = this.canvas.getBoundingClientRect();
            if (isFullScreen) {
                var rectwidth = rect.right - rect.left - this.borderWidth * 2, rectHeight = rect.bottom - rect.top - this.borderWidth * 2, ratioX = rectwidth / this.canvas.width, ratioY = rectHeight / this.canvas.height, minRatio = ratioX <= ratioY ? ratioX : ratioY, diffX = rectwidth - (this.canvas.width * minRatio), diffY = rectHeight - (this.canvas.height * minRatio);
                return {
                    x: (event.clientX - this.borderWidth - rect.left - diffX / 2) / ratioX * ratioX / minRatio,
                    y: (event.clientY - this.borderWidth - rect.top - diffY / 2) / ratioY * ratioY / minRatio
                };
            }
            return {
                x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * this.canvas.width,
                y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * this.canvas.height
            };
        };
        Canvas.prototype.canvasClickAction2 = function (event) {
            var pos = this.getMousePos(event);
            var x = pos.x, y = pos.y, char;
            /* eslint-disable no-bitwise */
            x |= 0; // force integer
            y |= 0;
            /* eslint-enable no-bitwise */
            if (x >= 0 && x <= 639 && y >= 0 && y <= 399) {
                var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, 
                /* eslint-disable no-bitwise */
                xTxt = (x / charWidth) | 0, yTxt = (y / charHeight) | 0;
                /* eslint-enable no-bitwise */
                char = this.readChar(xTxt, yTxt, 1, 0); // TODO: currently we use pen 1, paper 0
                if (char < 0 && event.detail === 2) { // no char but mouse double click?
                    char = 13; // use CR
                }
                if (char >= 0 && this.options.onClickKey) { // call click handler (put char in keyboard input buffer)
                    this.options.onClickKey(String.fromCharCode(char));
                }
            }
            // for graphics coordinates, adapt origin
            x -= this.xOrig;
            y = this.height - 1 - (y + this.yOrig);
            if (this.xPos === 1000 && this.yPos === 1000) { // only activate move if pos is 1000, 1000
                this.move(x, y);
            }
            if (Utils_15.Utils.debug > 0) {
                Utils_15.Utils.console.debug("onCpcCanvasClick: x", pos.x, "y", pos.y, "x - xOrig", x, "y - yOrig", y, "char", char, "char", (char !== undefined ? String.fromCharCode(char) : "?"), "detail", event.detail);
            }
        };
        Canvas.prototype.onCpcCanvasClick = function (event) {
            if (!this.hasFocus) {
                this.setFocusOnCanvas();
            }
            else {
                this.canvasClickAction2(event);
            }
            event.stopPropagation();
        };
        Canvas.prototype.onWindowClick = function (_event) {
            if (this.hasFocus) {
                this.hasFocus = false;
                this.cpcAreaBox.style.background = "";
            }
        };
        Canvas.prototype.getXpos = function () {
            return this.xPos;
        };
        Canvas.prototype.getYpos = function () {
            return this.yPos;
        };
        Canvas.prototype.fillMyRect = function (x, y, width, height, paper) {
            var canvasWidth = this.width, dataset8 = this.dataset8;
            for (var row = 0; row < height; row += 1) {
                for (var col = 0; col < width; col += 1) {
                    var idx = (x + col) + (y + row) * canvasWidth;
                    dataset8[idx] = paper;
                }
            }
        };
        Canvas.prototype.fillTextBox = function (left, top, width, height, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8;
            paper %= this.modeData.pens; // limit papers
            this.fillMyRect(left * charWidth, top * charHeight, width * charWidth, height * charHeight, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.moveMyRectUp = function (x, y, width, height, x2, y2) {
            var canvasWidth = this.width, dataset8 = this.dataset8;
            for (var row = 0; row < height; row += 1) {
                var idx1 = x + (y + row) * canvasWidth, idx2 = x2 + (y2 + row) * canvasWidth;
                for (var col = 0; col < width; col += 1) {
                    dataset8[idx2 + col] = dataset8[idx1 + col];
                }
            }
        };
        Canvas.prototype.moveMyRectDown = function (x, y, width, height, x2, y2) {
            var canvasWidth = this.width, dataset8 = this.dataset8;
            for (var row = height - 1; row >= 0; row -= 1) {
                var idx1 = x + (y + row) * canvasWidth, idx2 = x2 + (y2 + row) * canvasWidth;
                for (var col = 0; col < width; col += 1) {
                    dataset8[idx2 + col] = dataset8[idx1 + col];
                }
            }
        };
        Canvas.prototype.invertChar = function (x, y, pen, paper) {
            var pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, penXorPaper = pen ^ paper, // eslint-disable-line no-bitwise
            gColMode = 0;
            for (var row = 0; row < 8; row += 1) {
                for (var col = 0; col < 8; col += 1) {
                    var testPen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);
                    testPen ^= penXorPaper; // eslint-disable-line no-bitwise
                    this.setSubPixels(x + col * pixelWidth, y + row * pixelHeight, testPen, gColMode);
                }
            }
        };
        Canvas.prototype.setChar = function (char, x, y, pen, paper, transparent, gColMode, textAtGraphics) {
            var charData = this.customCharset[char] || this.options.charset[char], pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight;
            for (var row = 0; row < 8; row += 1) {
                for (var col = 0; col < 8; col += 1) {
                    var charValue = charData[row], bit = charValue & (0x80 >> col); // eslint-disable-line no-bitwise
                    if (!(transparent && !bit)) { // do not set background pixel in transparent mode
                        var penOrPaper = (bit) ? pen : paper;
                        if (textAtGraphics) {
                            this.setPixel(x + col * pixelWidth, y - row * pixelHeight, penOrPaper, gColMode);
                        }
                        else { // text mode
                            this.setSubPixels(x + col * pixelWidth, y + row * pixelHeight, penOrPaper, gColMode); // colMode always 0 in text mode
                        }
                    }
                }
            }
        };
        Canvas.prototype.readCharData = function (x, y, expectedPen) {
            var charData = [], pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight;
            for (var row = 0; row < 8; row += 1) {
                var charValue = 0;
                for (var col = 0; col < 8; col += 1) {
                    var pen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);
                    if (pen === expectedPen) {
                        charValue |= (0x80 >> col); // eslint-disable-line no-bitwise
                    }
                }
                charData[row] = charValue;
            }
            return charData;
        };
        Canvas.prototype.setSubPixels = function (x, y, gPen, gColMode) {
            var pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, width = this.width;
            /* eslint-disable no-bitwise */
            x &= ~(pixelWidth - 1); // match CPC pixel
            y &= ~(pixelHeight - 1);
            for (var row = 0; row < pixelHeight; row += 1) {
                var i = x + width * (y + row);
                for (var col = 0; col < pixelWidth; col += 1) {
                    switch (gColMode) {
                        case 0: // normal
                            this.dataset8[i] = gPen;
                            break;
                        case 1: // xor
                            this.dataset8[i] ^= gPen;
                            break;
                        case 2: // and
                            this.dataset8[i] &= gPen;
                            break;
                        case 3: // or
                            this.dataset8[i] |= gPen;
                            break;
                        default:
                            Utils_15.Utils.console.warn("setSubPixels: Unknown colMode:", gColMode);
                            break;
                    }
                    i += 1;
                }
            }
            /* eslint-enable no-bitwise */
        };
        Canvas.prototype.setPixel = function (x, y, gPen, gColMode) {
            // some rounding needed before applying origin:
            /* eslint-disable no-bitwise */
            x = x >= 0 ? x & ~(this.modeData.pixelWidth - 1) : -(-x & ~(this.modeData.pixelWidth - 1));
            y = y >= 0 ? y & ~(this.modeData.pixelHeight - 1) : -(-y & ~(this.modeData.pixelHeight - 1));
            /* eslint-enable no-bitwise */
            x += this.xOrig;
            y = this.height - 1 - (y + this.yOrig);
            if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
                return; // not in graphics window
            }
            this.setSubPixels(x, y, gPen, gColMode);
        };
        Canvas.prototype.setPixelOriginIncluded = function (x, y, gPen, gColMode) {
            if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
                return; // not in graphics window
            }
            this.setSubPixels(x, y, gPen, gColMode);
        };
        Canvas.prototype.testSubPixel = function (x, y) {
            var i = x + this.width * y, pen = this.dataset8[i];
            return pen;
        };
        Canvas.prototype.testPixel = function (x, y) {
            // some rounding needed before applying origin:
            /* eslint-disable no-bitwise */
            x = x >= 0 ? x & ~(this.modeData.pixelWidth - 1) : -(-x & ~(this.modeData.pixelWidth - 1));
            y = y >= 0 ? y & ~(this.modeData.pixelHeight - 1) : -(-y & ~(this.modeData.pixelHeight - 1));
            /* eslint-enable no-bitwise */
            x += this.xOrig;
            y = this.height - 1 - (y + this.yOrig);
            if (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom)) {
                return this.gPaper; // not in graphics window => return graphics paper
            }
            var i = x + this.width * y, pen = this.dataset8[i];
            return pen;
        };
        Canvas.prototype.getByte = function (addr) {
            /* eslint-disable no-bitwise */
            var mode = this.mode, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, x = ((addr & 0x7ff) % 80) * 8, y = (((addr & 0x3800) / 0x800) + (((addr & 0x7ff) / 80) | 0) * 8) * pixelHeight;
            var byte = null, // null=cannot read
            gPen;
            if (y < this.height) { // only if in visible range
                if (mode === 0) {
                    gPen = this.dataset8[x + this.width * y];
                    byte = ((gPen >> 2) & 0x02) | ((gPen << 3) & 0x20) | ((gPen << 2) & 0x08) | ((gPen << 7) & 0x80); // b1,b5,b3,b7 (left pixel)
                    gPen = this.dataset8[x + pixelWidth + this.width * y];
                    byte |= ((gPen >> 3) & 0x01) | ((gPen << 2) & 0x10) | ((gPen << 1) & 0x04) | ((gPen << 6) & 0x40); // b0,b4,b2,b6 (right pixel)
                }
                else if (mode === 1) {
                    byte = 0;
                    gPen = this.dataset8[x + this.width * y];
                    byte |= ((gPen & 0x02) << 2) | ((gPen & 0x01) << 7); // b3,b7 (left pixel 1)
                    gPen = this.dataset8[x + pixelWidth + this.width * y];
                    byte |= ((gPen & 0x02) << 1) | ((gPen & 0x01) << 6); // b2,b6 (pixel 2)
                    gPen = this.dataset8[x + pixelWidth * 2 + this.width * y];
                    byte |= ((gPen & 0x02) << 0) | ((gPen & 0x01) << 5); // b1,b5 (pixel 3)
                    gPen = this.dataset8[x + pixelWidth * 3 + this.width * y];
                    byte |= ((gPen & 0x02) >> 1) | ((gPen & 0x01) << 4); // b0,b4 (right pixel 4)
                }
                else if (mode === 2) {
                    byte = 0;
                    for (var i = 0; i <= 7; i += 1) {
                        gPen = this.dataset8[x + i + this.width * y];
                        byte |= (gPen & 0x01) << (7 - i);
                    }
                }
                else { // mode === 3
                }
            }
            /* eslint-enable no-bitwise */
            return byte;
        };
        Canvas.prototype.setByte = function (addr, byte) {
            /* eslint-disable no-bitwise */
            var mode = this.mode, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, x = ((addr & 0x7ff) % 80) * 8, y = (((addr & 0x3800) / 0x800) + (((addr & 0x7ff) / 80) | 0) * 8) * pixelHeight, gColMode = 0; // always 0
            var gPen;
            if (y < this.height) { // only if in visible range
                if (mode === 0) {
                    gPen = ((byte << 2) & 0x08) | ((byte >> 3) & 0x04) | ((byte >> 2) & 0x02) | ((byte >> 7) & 0x01); // b1,b5,b3,b7 (left pixel)
                    this.setSubPixels(x, y, gPen, gColMode);
                    gPen = ((byte << 3) & 0x08) | ((byte >> 2) & 0x04) | ((byte >> 1) & 0x02) | ((byte >> 6) & 0x01); // b0,b4,b2,b6 (right pixel)
                    this.setSubPixels(x + pixelWidth, y, gPen, gColMode);
                    this.setNeedUpdate();
                }
                else if (mode === 1) {
                    gPen = ((byte >> 2) & 0x02) | ((byte >> 7) & 0x01); // b3,b7 (left pixel 1)
                    this.setSubPixels(x, y, gPen, gColMode);
                    gPen = ((byte >> 1) & 0x02) | ((byte >> 6) & 0x01); // b2,b6 (pixel 2)
                    this.setSubPixels(x + pixelWidth, y, gPen, gColMode);
                    gPen = ((byte >> 0) & 0x02) | ((byte >> 5) & 0x01); // b1,b5 (pixel 3)
                    this.setSubPixels(x + pixelWidth * 2, y, gPen, gColMode);
                    gPen = ((byte << 1) & 0x02) | ((byte >> 4) & 0x01); // b0,b4 (right pixel 4)
                    this.setSubPixels(x + pixelWidth * 3, y, gPen, gColMode);
                    this.setNeedUpdate();
                }
                else if (mode === 2) {
                    for (var i = 0; i <= 7; i += 1) {
                        gPen = (byte >> (7 - i)) & 0x01;
                        this.setSubPixels(x + i * pixelWidth, y, gPen, gColMode);
                    }
                    this.setNeedUpdate();
                }
                else { // mode === 3 (not supported)
                }
            }
            /* eslint-enable no-bitwise */
        };
        // https://de.wikipedia.org/wiki/Bresenham-Algorithmus
        Canvas.prototype.drawBresenhamLine = function (xstart, ystart, xend, yend) {
            var pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, gPen = this.gPen, gPaper = this.gPaper, mask = this.mask, maskFirst = this.maskFirst, gColMode = this.gColMode, transparent = this.gTransparent;
            var maskBit = this.maskBit;
            // we have to add origin before modifying coordinates to match CPC pixel
            xstart += this.xOrig;
            ystart = this.height - 1 - (ystart + this.yOrig);
            xend += this.xOrig;
            yend = this.height - 1 - (yend + this.yOrig);
            /* eslint-disable no-bitwise */
            if (xend >= xstart) { // line from left to right
                xend |= (pixelWidth - 1); // match CPC pixel
            }
            else { // line from right to left
                xstart |= (pixelWidth - 1);
            }
            if (yend >= ystart) { // line from bottom to top
                yend |= (pixelHeight - 1);
            }
            else { // line from top to bottom
                ystart |= (pixelHeight - 1);
            }
            var dx = ((xend - xstart) / pixelWidth) | 0, dy = ((yend - ystart) / pixelHeight) | 0;
            /* eslint-enable no-bitwise */
            var incx = Math.sign(dx) * pixelWidth, incy = Math.sign(dy) * pixelHeight;
            if (dx < 0) {
                dx = -dx;
            }
            if (dy < 0) {
                dy = -dy;
            }
            var pdx, pdy, ddx, ddy, deltaslowdirection, deltafastdirection;
            if (dx > dy) {
                pdx = incx;
                pdy = 0;
                ddx = incx;
                ddy = incy;
                deltaslowdirection = dy;
                deltafastdirection = dx;
            }
            else {
                pdx = 0;
                pdy = incy;
                ddx = incx;
                ddy = incy;
                deltaslowdirection = dx;
                deltafastdirection = dy;
            }
            var x = xstart, y = ystart, err = deltafastdirection >> 1; // eslint-disable-line no-bitwise
            if (maskFirst) { // draw first pixel?
                var bit = mask & maskBit; // eslint-disable-line no-bitwise
                if (!(transparent && !bit)) { // do not set background pixel in transparent mode
                    this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode); // we expect integers
                }
                // rotate bitpos right
                maskBit = (maskBit >> 1) | ((maskBit << 7) & 0xff); // eslint-disable-line no-bitwise
            }
            for (var t = 0; t < deltafastdirection; t += 1) {
                err -= deltaslowdirection;
                if (err < 0) {
                    err += deltafastdirection;
                    x += ddx;
                    y += ddy;
                }
                else {
                    x += pdx;
                    y += pdy;
                }
                var bit = mask & maskBit; // eslint-disable-line no-bitwise
                if (!(transparent && !bit)) { // do not set background pixel in transparent mode
                    this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode); // we expect integers
                }
                // rotate bitpos right
                maskBit = (maskBit >> 1) | ((maskBit << 7) & 0xff); // eslint-disable-line no-bitwise
            }
            this.maskBit = maskBit;
        };
        Canvas.prototype.draw = function (x, y) {
            var xStart = this.xPos, yStart = this.yPos;
            this.move(x, y); // destination
            this.drawBresenhamLine(xStart, yStart, x, y);
            this.setNeedUpdate();
        };
        Canvas.prototype.move = function (x, y) {
            this.xPos = x; // must be integer
            this.yPos = y;
        };
        Canvas.prototype.plot = function (x, y) {
            this.move(x, y);
            this.setPixel(x, y, this.gPen, this.gColMode); // must be integer
            this.setNeedUpdate();
        };
        Canvas.prototype.test = function (x, y) {
            this.move(x, y);
            return this.testPixel(this.xPos, this.yPos); // use rounded values
        };
        Canvas.prototype.setInk = function (pen, ink1, ink2) {
            var needInkUpdate = false;
            if (this.currentInks[0][pen] !== ink1) {
                this.currentInks[0][pen] = ink1;
                needInkUpdate = true;
            }
            if (this.currentInks[1][pen] !== ink2) {
                this.currentInks[1][pen] = ink2;
                needInkUpdate = true;
            }
            if (needInkUpdate) {
                this.updateColorMap();
                this.setNeedUpdate(); // we need to notify that an update is needed
            }
            return needInkUpdate;
        };
        Canvas.prototype.setBorder = function (ink1, ink2) {
            var needInkUpdate = this.setInk(16, ink1, ink2);
            if (needInkUpdate) {
                this.canvas.style.borderColor = this.options.colors[this.currentInks[this.inkSet][16]];
            }
        };
        Canvas.prototype.setGPen = function (gPen) {
            gPen %= this.modeData.pens; // limit pens
            this.gPen = gPen;
        };
        Canvas.prototype.setGPaper = function (gPaper) {
            gPaper %= this.modeData.pens; // limit pens
            this.gPaper = gPaper;
        };
        Canvas.prototype.setGTransparentMode = function (transparent) {
            this.gTransparent = transparent;
        };
        Canvas.prototype.printGChar = function (char) {
            var charWidth = this.modeData.pixelWidth * 8;
            if (char >= this.options.charset.length) {
                Utils_15.Utils.console.warn("printGChar: Ignoring char with code", char);
                return;
            }
            this.setChar(char, this.xPos, this.yPos, this.gPen, this.gPaper, this.gTransparent, this.gColMode, true);
            this.xPos += charWidth;
            this.setNeedUpdate();
        };
        Canvas.prototype.printChar = function (char, x, y, pen, paper, transparent) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
            if (char >= this.options.charset.length) {
                Utils_15.Utils.console.warn("printChar: Ignoring char with code", char);
                return;
            }
            pen %= pens;
            paper %= pens; // also pens
            this.setChar(char, x * charWidth, y * charHeight, pen, paper, transparent, 0, false);
            this.setNeedUpdate();
        };
        Canvas.prototype.drawCursor = function (x, y, pen, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
            pen %= pens;
            paper %= pens; // also pens
            this.invertChar(x * charWidth, y * charHeight, pen, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.findMatchingChar = function (charData) {
            var charset = this.options.charset;
            var char = -1; // not detected
            for (var i = 0; i < charset.length; i += 1) {
                var charData2 = this.customCharset[i] || charset[i];
                var match = true;
                for (var j = 0; j < 8; j += 1) {
                    if (charData[j] !== charData2[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    char = i;
                    break;
                }
            }
            return char;
        };
        Canvas.prototype.readChar = function (x, y, pen, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
            pen %= pens;
            paper %= pens; // also pens
            x *= charWidth;
            y *= charHeight;
            var charData = this.readCharData(x, y, pen), char = this.findMatchingChar(charData);
            if (char < 0 || char === 32) { // no match? => check inverse with paper, char=32?
                charData = this.readCharData(x, y, paper);
                for (var i = 0; i < charData.length; i += 1) {
                    charData[i] ^= 0xff; // eslint-disable-line no-bitwise
                }
                var char2 = this.findMatchingChar(charData);
                if (char2 >= 0) {
                    if (char2 === 143) { // invers of space?
                        char2 = 32; // use space
                    }
                    char = char2;
                }
            }
            return char;
        };
        // fill: idea from: https://simpledevcode.wordpress.com/2015/12/29/flood-fill-algorithm-using-c-net/
        Canvas.prototype.fnIsNotInWindow = function (x, y) {
            return (x < this.xLeft || x > this.xRight || y < (this.height - 1 - this.yTop) || y > (this.height - 1 - this.yBottom));
        };
        Canvas.prototype.fill = function (fillPen) {
            var gPen = this.gPen, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, pixels = [], fnIsStopPen = function (p) {
                return p === fillPen || p === gPen;
            };
            var xPos = this.xPos, yPos = this.yPos;
            fillPen %= this.modeData.pens; // limit pens
            // apply origin
            xPos += this.xOrig;
            yPos = this.height - 1 - (yPos + this.yOrig);
            if (this.fnIsNotInWindow(xPos, yPos)) {
                return;
            }
            pixels.push({
                x: xPos,
                y: yPos
            });
            while (pixels.length) {
                var pixel = pixels.pop();
                var y1 = pixel.y, p1 = this.testSubPixel(pixel.x, y1);
                while (y1 >= (this.height - 1 - this.yTop) && !fnIsStopPen(p1)) {
                    y1 -= pixelHeight;
                    p1 = this.testSubPixel(pixel.x, y1);
                }
                y1 += pixelHeight;
                var spanLeft = false, spanRight = false;
                p1 = this.testSubPixel(pixel.x, y1);
                while (y1 <= (this.height - 1 - this.yBottom) && !fnIsStopPen(p1)) {
                    this.setSubPixels(pixel.x, y1, fillPen, 0);
                    var x1 = pixel.x - pixelWidth;
                    var p2 = this.testSubPixel(x1, y1);
                    if (!spanLeft && x1 >= this.xLeft && !fnIsStopPen(p2)) {
                        pixels.push({
                            x: x1,
                            y: y1
                        });
                        spanLeft = true;
                    }
                    else if (spanLeft && ((x1 < this.xLeft) || fnIsStopPen(p2))) {
                        spanLeft = false;
                    }
                    x1 = pixel.x + pixelWidth;
                    var p3 = this.testSubPixel(x1, y1);
                    if (!spanRight && x1 <= this.xRight && !fnIsStopPen(p3)) {
                        pixels.push({
                            x: x1,
                            y: y1
                        });
                        spanRight = true;
                    }
                    else if (spanRight && ((x1 > this.xRight) || fnIsStopPen(p3))) {
                        spanRight = false;
                    }
                    y1 += pixelHeight;
                    p1 = this.testSubPixel(pixel.x, y1);
                }
            }
            this.setNeedUpdate();
        };
        Canvas.fnPutInRange = function (n, min, max) {
            if (n < min) {
                n = min;
            }
            else if (n > max) {
                n = max;
            }
            return n;
        };
        Canvas.prototype.setOrigin = function (xOrig, yOrig) {
            var pixelWidth = this.modeData.pixelWidth;
            xOrig &= ~(pixelWidth - 1); // eslint-disable-line no-bitwise
            this.xOrig = xOrig; // must be integer
            this.yOrig = yOrig;
            this.move(0, 0);
        };
        Canvas.prototype.setGWindow = function (xLeft, xRight, yTop, yBottom) {
            var pixelWidth = 8, // force byte boundaries: always 8 x/byte
            pixelHeight = this.modeData.pixelHeight; // usually 2, anly for mode 3 we have 1
            xLeft = Canvas.fnPutInRange(xLeft, 0, this.width - 1);
            xRight = Canvas.fnPutInRange(xRight, 0, this.width - 1);
            yTop = Canvas.fnPutInRange(yTop, 0, this.height - 1);
            yBottom = Canvas.fnPutInRange(yBottom, 0, this.height - 1);
            // exchange coordinates, if needed (left>right or top<bottom)
            if (xRight < xLeft) {
                var tmp = xRight;
                xRight = xLeft;
                xLeft = tmp;
            }
            if (yTop < yBottom) {
                var tmp = yTop;
                yTop = yBottom;
                yBottom = tmp;
            }
            // On the CPC this is set to byte positions (CPC Systembuch, p. 346)
            // ORIGIN 0,0,13,563,399,0 gets origin 0,0,8,567,399 mod2+1,mod2
            /* eslint-disable no-bitwise */
            xLeft &= ~(pixelWidth - 1);
            xRight |= (pixelWidth - 1);
            yTop |= (pixelHeight - 1); // we know: top is larger than bottom
            yBottom &= ~(pixelHeight - 1);
            /* eslint-enable no-bitwise */
            this.xLeft = xLeft;
            this.xRight = xRight;
            this.yTop = yTop;
            this.yBottom = yBottom;
        };
        Canvas.prototype.setGColMode = function (gColMode) {
            if (gColMode !== this.gColMode) {
                this.gColMode = gColMode;
            }
        };
        Canvas.prototype.clearTextWindow = function (left, right, top, bottom, paper) {
            var width = right + 1 - left, height = bottom + 1 - top;
            this.fillTextBox(left, top, width, height, paper);
        };
        Canvas.prototype.clearGraphicsWindow = function () {
            this.fillMyRect(this.xLeft, this.height - 1 - this.yTop, this.xRight + 1 - this.xLeft, this.yTop + 1 - this.yBottom, this.gPaper); // +1 or not?
            this.move(0, 0);
            this.setNeedUpdate();
        };
        Canvas.prototype.clearFullWindow = function () {
            var paper = 0;
            this.fillMyRect(0, 0, this.width, this.height, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.windowScrollUp = function (left, right, top, bottom, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                this.moveMyRectUp(left * charWidth, (top + 1) * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, top * charHeight);
            }
            this.fillTextBox(left, bottom, width, 1, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.windowScrollDown = function (left, right, top, bottom, paper) {
            var charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                this.moveMyRectDown(left * charWidth, top * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, (top + 1) * charHeight);
            }
            this.fillTextBox(left, top, width, 1, paper);
            this.setNeedUpdate();
        };
        Canvas.prototype.setSpeedInk = function (time1, time2) {
            this.speedInk[0] = time1;
            this.speedInk[1] = time2;
        };
        Canvas.prototype.setMask = function (mask) {
            this.mask = mask;
            this.maskBit = 128;
        };
        Canvas.prototype.setMaskFirst = function (maskFirst) {
            this.maskFirst = maskFirst;
        };
        Canvas.prototype.getMode = function () {
            return this.mode;
        };
        Canvas.prototype.changeMode = function (mode) {
            var modeData = Canvas.modeData[mode];
            this.mode = mode;
            this.modeData = modeData;
        };
        Canvas.prototype.setMode = function (mode) {
            this.setScreenOffset(0);
            this.changeMode(mode);
            this.setOrigin(0, 0);
            this.setGWindow(0, this.width - 1, this.height - 1, 0);
            this.setGColMode(0);
            this.setMask(255);
            this.setMaskFirst(1);
            this.setGPen(this.gPen); // keep, but maybe different for other mode
            this.setGPaper(this.gPaper); // keep, maybe different for other mode
            this.setGTransparentMode(false);
        };
        Canvas.prototype.getCanvasElement = function () {
            return this.canvas;
        };
        // mode 0: pen 0-15,16=border; inks for pen 14,15 are alternating: "1,24", "16,11"
        Canvas.defaultInks = [
            [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 1, 16, 1],
            [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 24, 11, 1] // eslint-disable-line array-element-newline
        ];
        Canvas.modeData = [
            {
                pens: 16,
                pixelWidth: 4,
                pixelHeight: 2 // pixel height
            },
            {
                pens: 4,
                pixelWidth: 2,
                pixelHeight: 2
            },
            {
                pens: 2,
                pixelWidth: 1,
                pixelHeight: 2
            },
            {
                pens: 16,
                pixelWidth: 1,
                pixelHeight: 1
            }
        ];
        return Canvas;
    }());
    exports.Canvas = Canvas;
});
// TextCanvas.ts - Text "Canvas"
// (c) Marco Vieth, 2022
// https://benchmarko.github.io/CPCBasicTS/
//
define("TextCanvas", ["require", "exports", "Utils", "View"], function (require, exports, Utils_16, View_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextCanvas = void 0;
    var TextCanvas = /** @class */ (function () {
        function TextCanvas(options) {
            this.fps = 15; // FPS for canvas update
            this.needTextUpdate = false;
            this.textBuffer = []; // textbuffer characters at row,column
            this.hasFocus = false; // canvas has focus
            this.options = {
                onClickKey: options.onClickKey
            };
            this.fnUpdateTextCanvasHandler = this.updateTextCanvas.bind(this);
            this.fnUpdateTextCanvas2Handler = this.updateTextCanvas2.bind(this);
            this.textText = View_4.View.getElementById1("textText"); // View.setAreaValue()
            this.animationTimeoutId = undefined;
            this.animationFrame = undefined;
            this.reset();
        }
        TextCanvas.prototype.reset = function () {
            this.resetTextBuffer();
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.resetTextBuffer = function () {
            this.textBuffer.length = 0;
        };
        TextCanvas.prototype.setNeedTextUpdate = function () {
            this.needTextUpdate = true;
        };
        TextCanvas.prototype.updateTextCanvas2 = function () {
            this.animationFrame = requestAnimationFrame(this.fnUpdateTextCanvasHandler);
            if (this.textText.offsetParent) { // text area visible?
                if (this.needTextUpdate) {
                    this.needTextUpdate = false;
                    this.updateTextWindow();
                }
            }
        };
        TextCanvas.prototype.updateTextCanvas = function () {
            this.animationTimeoutId = window.setTimeout(this.fnUpdateTextCanvas2Handler, 1000 / this.fps); // ts (node)
        };
        TextCanvas.prototype.startUpdateCanvas = function () {
            if (this.animationFrame === undefined && this.textText.offsetParent !== null) { // animation off and canvas visible in DOM?
                this.updateTextCanvas();
            }
        };
        TextCanvas.prototype.stopUpdateCanvas = function () {
            if (this.animationFrame !== undefined) {
                cancelAnimationFrame(this.animationFrame);
                clearTimeout(this.animationTimeoutId);
                this.animationFrame = undefined;
                this.animationTimeoutId = undefined;
            }
        };
        TextCanvas.prototype.updateTextWindow = function () {
            var textBuffer = this.textBuffer, cpc2Unicode = TextCanvas.cpc2Unicode;
            var out = "";
            for (var y = 0; y < textBuffer.length; y += 1) {
                var textBufferRow = textBuffer[y];
                if (textBufferRow) {
                    for (var x = 0; x < textBufferRow.length; x += 1) {
                        out += cpc2Unicode[textBufferRow[x] || 32];
                    }
                }
                out += "\n";
            }
            this.textText.value = out;
        };
        TextCanvas.prototype.setFocusOnCanvas = function () {
            var parentNode = this.textText.parentNode;
            if (parentNode) {
                parentNode.style.background = "#463c3c";
            }
            if (this.textText) {
                this.textText.focus();
            }
            this.hasFocus = true;
        };
        // eslint-disable-next-line class-methods-use-this
        TextCanvas.prototype.getMousePos = function (event) {
            var borderWidth = 1, // TODO
            rect = this.textText.getBoundingClientRect(), pos = {
                x: event.clientX - borderWidth - rect.left,
                y: event.clientY - borderWidth - rect.top
            };
            return pos;
        };
        TextCanvas.prototype.canvasClickAction2 = function (event) {
            var target = View_4.View.getEventTarget(event), style = window.getComputedStyle(target, null).getPropertyValue("font-size"), fontSize = parseFloat(style), pos = this.getMousePos(event), charWidth = (fontSize + 1.4) / 2, charHeight = fontSize + 2.25, // TODO
            x = pos.x, y = pos.y, 
            /* eslint-disable no-bitwise */
            xTxt = (x / charWidth) | 0, yTxt = (y / charHeight) | 0;
            /* eslint-enable no-bitwise */
            if (Utils_16.Utils.debug > 0) {
                Utils_16.Utils.console.debug("canvasClickAction2: x=" + x + ", y=" + y + ", xTxt=" + xTxt + ", yTxt=" + yTxt);
            }
            var char = this.getCharFromTextBuffer(xTxt, yTxt); // is there a character an the click position?
            if (char === undefined && event.detail === 2) { // no char but mouse double click?
                char = 13; // use CR
            }
            if (char !== undefined && this.options.onClickKey) { // call click handler (put char in keyboard input buffer)
                this.options.onClickKey(String.fromCharCode(char));
            }
        };
        TextCanvas.prototype.onTextCanvasClick = function (event) {
            if (!this.hasFocus) {
                this.setFocusOnCanvas();
            }
            else {
                this.canvasClickAction2(event);
            }
            event.stopPropagation();
        };
        TextCanvas.prototype.onWindowClick = function (_event) {
            if (this.hasFocus) {
                this.hasFocus = false;
                var parentNode = this.textText.parentNode;
                if (parentNode) {
                    parentNode.style.background = "";
                }
            }
        };
        TextCanvas.prototype.fillTextBox = function (left, top, width, height, _pen) {
            this.clearTextBufferBox(left, top, width, height);
        };
        TextCanvas.prototype.clearTextBufferBox = function (left, top, width, height) {
            var textBuffer = this.textBuffer;
            for (var y = top; y < top + height; y += 1) {
                var textBufferRow = textBuffer[y];
                if (textBufferRow) {
                    for (var x = left; x < left + width; x += 1) {
                        delete textBufferRow[x];
                    }
                }
            }
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.copyTextBufferBoxUp = function (left, top, width, height, left2, top2) {
            var textBuffer = this.textBuffer;
            for (var y = 0; y < height; y += 1) {
                var sourceRow = textBuffer[top + y];
                var destinationRow = textBuffer[top2 + y];
                if (sourceRow) {
                    // could be optimized, if complete rows
                    if (!destinationRow) {
                        destinationRow = [];
                        textBuffer[top2 + y] = destinationRow;
                    }
                    for (var x = 0; x < width; x += 1) {
                        destinationRow[left2 + x] = sourceRow[left + x];
                    }
                }
                else if (destinationRow) {
                    delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
                }
            }
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.copyTextBufferBoxDown = function (left, top, width, height, left2, top2) {
            var textBuffer = this.textBuffer;
            for (var y = height - 1; y >= 0; y -= 1) {
                var sourceRow = textBuffer[top + y];
                var destinationRow = textBuffer[top2 + y];
                if (sourceRow) {
                    if (!destinationRow) {
                        destinationRow = [];
                        textBuffer[top2 + y] = destinationRow;
                    }
                    for (var x = 0; x < width; x += 1) {
                        destinationRow[left2 + x] = sourceRow[left + x];
                    }
                }
                else if (destinationRow) {
                    delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
                }
            }
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.putCharInTextBuffer = function (char, x, y) {
            var textBuffer = this.textBuffer;
            if (!textBuffer[y]) {
                textBuffer[y] = [];
            }
            this.textBuffer[y][x] = char;
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.getCharFromTextBuffer = function (x, y) {
            var textBuffer = this.textBuffer;
            var char;
            if (textBuffer[y]) {
                char = this.textBuffer[y][x]; // can be undefined, if not set
            }
            return char;
        };
        TextCanvas.prototype.printChar = function (char, x, y, _pen, _paper, _transparent) {
            this.putCharInTextBuffer(char, x, y);
        };
        TextCanvas.prototype.readChar = function (x, y, _pen, _paper) {
            var char = this.getCharFromTextBuffer(x, y); // TODO
            if (char === undefined) {
                char = -1; // not detected
            }
            return char;
        };
        TextCanvas.prototype.clearTextWindow = function (left, right, top, bottom, _paper) {
            var width = right + 1 - left, height = bottom + 1 - top;
            this.fillTextBox(left, top, width, height);
        };
        TextCanvas.prototype.clearFullWindow = function () {
            this.resetTextBuffer();
            this.setNeedTextUpdate();
        };
        TextCanvas.prototype.windowScrollUp = function (left, right, top, bottom, _pen) {
            var width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                // adapt also text buffer
                this.copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
            }
            this.fillTextBox(left, bottom, width, 1);
        };
        TextCanvas.prototype.windowScrollDown = function (left, right, top, bottom, _pen) {
            var width = right + 1 - left, height = bottom + 1 - top;
            if (height > 1) { // scroll part
                // adapt also text buffer
                this.copyTextBufferBoxDown(left, top, width, height - 1, left, top + 1);
            }
            this.fillTextBox(left, top, width, 1);
        };
        // CPC Unicode map for text mode (https://www.unicode.org/L2/L2019/19025-terminals-prop.pdf AMSCPC.TXT) incomplete
        TextCanvas.cpc2Unicode = "................................ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]\u2195_`abcdefghijklmnopqrstuvwxyz{|}~\u2591"
            + "\u00A0\u2598\u259D\u2580\u2596\u258C\u259E\u259B\u2597\u259A\u2590\u259C\u2584\u2599\u259F\u2588\u00B7\u2575\u2576\u2514\u2577\u2502\u250C"
            + "\u251C\u2574\u2518\u2500\u2534\u2510\u2524\u252C\u253C\u005E\u00B4\u00A8\u00A3\u00A9\u00B6\u00A7\u2018\u00BC\u00BD\u00BE\u00B1\u00F7\u00AC"
            + "\u00BF\u00A1\u03B1\u03B2\u03B3\u03B4\u03B5\u03B8\u03BB\u03BC\u03C0\u03C3\u03C6\u03C8\u03C7\u03C9\u03A3\u03A9\u1FBA0\u1FBA1\u1FBA3\u1FBA2\u1FBA7"
            + "\u1FBA5\u1FBA6\u1FBA4\u1FBA8\u1FBA9\u1FBAE\u2573\u2571\u2572\u1FB95\u2592\u23BA\u23B9\u23BD\u23B8\u25E4\u25E5\u25E2\u25E3\u1FB8E\u1FB8D\u1FB8F"
            + "\u1FB8C\u1FB9C\u1FB9D\u1FB9E\u1FB9F\u263A\u2639\u2663\u2666\u2665\u2660\u25CB\u25CF\u25A1\u25A0\u2642\u2640\u2669\u266A\u263C\uFFBDB\u2B61\u2B63"
            + "\u2B60\u2B62\u25B2\u25BC\u25B6\u25C0\u1FBC6\u1FBC5\u1FBC7\u1FBC8\uFFBDC\uFFBDD\u2B65\u2B64";
        return TextCanvas;
    }());
    exports.TextCanvas = TextCanvas;
});
// NodeAdapt.ts - Adaptations for nodeJS
//
define("NodeAdapt", ["require", "exports", "Utils"], function (require, exports, Utils_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeAdapt = void 0;
    var NodeAdapt = /** @class */ (function () {
        function NodeAdapt() {
        }
        NodeAdapt.doAdapt = function () {
            var https, // nodeJs
            fs, module, audioContext;
            var domElements = {}, myCreateElement = function (id) {
                domElements[id] = {
                    className: "",
                    style: {
                        borderwidth: "",
                        borderStyle: ""
                    },
                    addEventListener: function () { },
                    options: []
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
                    addEventListener: function () { },
                    getElementById: function (id) { return domElements[id] || myCreateElement(id); },
                    createElement: function (type) {
                        if (type === "option") {
                            return {};
                        }
                        Utils_17.Utils.console.error("createElement: unknown type", type);
                        return {};
                    }
                },
                AudioContext: audioContext
            });
            // eslint-disable-next-line no-eval
            var nodeExports = eval("exports"), view = nodeExports.View, setSelectOptionsOrig = view.prototype.setSelectOptions;
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
                if (id === "resultText") {
                    if (value) {
                        Utils_17.Utils.console.log(value);
                    }
                }
                return setAreaValueOrig(id, value);
            };
            // https://nodejs.dev/learn/accept-input-from-the-command-line-in-nodejs
            // readline?
            var controller = nodeExports.Controller;
            controller.prototype.startWithDirectInput = function () {
                Utils_17.Utils.console.log("We are ready.");
            };
            //
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
                    Utils_17.Utils.console.log("Error: " + err.message);
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
                        Utils_17.Utils.console.warn("nodeReadFile: Cannot determine module path");
                    }
                }
                var name2 = modulePath ? modulePath + "/" + name : name;
                fs.readFile(name2, "utf8", fnDataLoaded);
            }
            var utils = nodeExports.Utils;
            utils.loadScript = function (fileOrUrl, fnSuccess, _fnError, key) {
                var fnLoaded = function (error, data) {
                    if (error) {
                        Utils_17.Utils.console.error("file error: ", error);
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
    exports.NodeAdapt = NodeAdapt;
});
// end
// CommonEventHandler.ts - Common event handler for browser events
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define("CommonEventHandler", ["require", "exports", "Utils", "View"], function (require, exports, Utils_18, View_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommonEventHandler = void 0;
    var CommonEventHandler = /** @class */ (function () {
        function CommonEventHandler(model, view, controller) {
            this.fnUserAction = undefined;
            /* eslint-disable no-invalid-this */
            this.handlers = {
                onSpecialButtonClick: this.onSpecialButtonClick,
                onInputButtonClick: this.onInputButtonClick,
                onInp2ButtonClick: this.onInp2ButtonClick,
                onOutputButtonClick: this.onOutputButtonClick,
                onResultButtonClick: this.onResultButtonClick,
                onTextButtonClick: this.onTextButtonClick,
                onVariableButtonClick: this.onVariableButtonClick,
                onCpcButtonClick: this.onCpcButtonClick,
                onConvertButtonClick: this.onConvertButtonClick,
                onSettingsButtonClick: this.onSettingsButtonClick,
                onGalleryButtonClick: this.onGalleryButtonClick,
                onKbdButtonClick: this.onKbdButtonClick,
                onConsoleButtonClick: this.onConsoleButtonClick,
                onParseButtonClick: this.onParseButtonClick,
                onRenumButtonClick: this.onRenumButtonClick,
                onPrettyButtonClick: this.onPrettyButtonClick,
                onLineNumberAddButtonClick: this.onLineNumberAddButtonClick,
                onLineNumberRemoveButtonClick: this.onLineNumberRemoveButtonClick,
                onUndoButtonClick: this.onUndoButtonClick,
                onRedoButtonClick: this.onRedoButtonClick,
                onDownloadButtonClick: this.onDownloadButtonClick,
                onRunButtonClick: this.onRunButtonClick,
                onStopButtonClick: this.onStopButtonClick,
                onContinueButtonClick: this.onContinueButtonClick,
                onResetButtonClick: this.onResetButtonClick,
                onParseRunButtonClick: this.onParseRunButtonClick,
                onHelpButtonClick: CommonEventHandler.onHelpButtonClick,
                onGalleryItemClick: this.onGalleryItemClick,
                onInputTextClick: CommonEventHandler.onNothing,
                onOutputTextClick: CommonEventHandler.onNothing,
                onResultTextClick: CommonEventHandler.onNothing,
                onVarTextClick: CommonEventHandler.onNothing,
                onOutputTextChange: this.onOutputTextChange,
                onReloadButtonClick: this.onReloadButtonClick,
                onDatabaseSelectChange: this.onDatabaseSelectChange,
                onDirectorySelectChange: this.onDirectorySelectChange,
                onExampleSelectChange: this.onExampleSelectChange,
                onVarSelectChange: this.onVarSelectChange,
                onKbdLayoutSelectChange: this.onKbdLayoutSelectChange,
                onVarTextChange: this.onVarTextChange,
                onImplicitLinesInputChange: this.onImplicitLinesInputChange,
                onArrayBoundsInputChange: this.onArrayBoundsInputChange,
                onTraceInputChange: this.onTraceInputChange,
                onSpeedInputChange: this.onSpeedInputChange,
                onScreenshotButtonClick: this.onScreenshotButtonClick,
                onEnterButtonClick: this.onEnterButtonClick,
                onSoundButtonClick: this.onSoundButtonClick,
                onFullscreenButtonClick: CommonEventHandler.onFullscreenButtonClick,
                onCpcCanvasClick: this.onCpcCanvasClick,
                onWindowClick: this.onWindowClick,
                onTextTextClick: this.onTextTextClick,
                onCopyTextButtonClick: this.onCopyTextButtonClick
            };
            this.model = model;
            this.view = view;
            this.controller = controller;
        }
        CommonEventHandler.prototype.toogleHidden = function (id, prop, display) {
            var visible = !this.model.getProperty(prop);
            this.model.setProperty(prop, visible);
            this.view.setHidden(id, !visible, display);
            return visible;
        };
        CommonEventHandler.prototype.fnSetUserAction = function (fnAction) {
            this.fnUserAction = fnAction;
        };
        CommonEventHandler.prototype.onSpecialButtonClick = function () {
            this.toogleHidden("specialArea", "showSpecial");
        };
        CommonEventHandler.prototype.onInputButtonClick = function () {
            this.toogleHidden("inputArea", "showInput");
        };
        CommonEventHandler.prototype.onInp2ButtonClick = function () {
            this.toogleHidden("inp2Area", "showInp2");
        };
        CommonEventHandler.prototype.onOutputButtonClick = function () {
            this.toogleHidden("outputArea", "showOutput");
        };
        CommonEventHandler.prototype.onResultButtonClick = function () {
            this.toogleHidden("resultArea", "showResult");
        };
        CommonEventHandler.prototype.onTextButtonClick = function () {
            if (this.toogleHidden("textArea", "showText")) {
                this.controller.startUpdateTextCanvas();
            }
            else {
                this.controller.stopUpdateTextCanvas();
            }
        };
        CommonEventHandler.prototype.onVariableButtonClick = function () {
            this.toogleHidden("variableArea", "showVariable");
        };
        CommonEventHandler.prototype.onCpcButtonClick = function () {
            if (this.toogleHidden("cpcArea", "showCpc")) {
                this.controller.startUpdateCanvas();
            }
            else {
                this.controller.stopUpdateCanvas();
            }
        };
        CommonEventHandler.prototype.onConvertButtonClick = function () {
            this.toogleHidden("convertArea", "showConvert", "flex");
        };
        CommonEventHandler.prototype.onSettingsButtonClick = function () {
            this.toogleHidden("settingsArea", "showSettings", "flex");
        };
        CommonEventHandler.prototype.onGalleryButtonClick = function () {
            if (this.toogleHidden("galleryArea", "showGallery", "flex")) {
                this.controller.setGalleryAreaInputs();
            }
        };
        CommonEventHandler.prototype.onKbdButtonClick = function () {
            if (this.toogleHidden("kbdArea", "showKbd", "flex")) {
                if (this.view.getHidden("kbdArea")) { // on old browsers, display "flex" is not available, so set "block" if still hidden
                    this.view.setHidden("kbdArea", false);
                }
                this.controller.virtualKeyboardCreate(); // maybe draw it
                this.view.setHidden("kbdLayoutArea", true, "inherit"); // kbd visible => kbdlayout invisible
            }
            else {
                this.view.setHidden("kbdLayoutArea", false, "inherit");
            }
        };
        CommonEventHandler.prototype.onConsoleButtonClick = function () {
            this.toogleHidden("consoleArea", "showConsole");
        };
        CommonEventHandler.prototype.onParseButtonClick = function () {
            this.controller.startParse();
        };
        CommonEventHandler.prototype.onRenumButtonClick = function () {
            this.controller.startRenum();
        };
        CommonEventHandler.prototype.onPrettyButtonClick = function () {
            this.controller.fnPretty();
        };
        CommonEventHandler.prototype.onLineNumberAddButtonClick = function () {
            this.controller.fnAddLines();
        };
        CommonEventHandler.prototype.onLineNumberRemoveButtonClick = function () {
            this.controller.fnRemoveLines();
        };
        CommonEventHandler.prototype.fnUpdateAreaText = function (input) {
            this.controller.setInputText(input, true);
            this.view.setAreaValue("outputText", "");
        };
        CommonEventHandler.prototype.onUndoButtonClick = function () {
            var input = this.controller.undoStackElement();
            this.fnUpdateAreaText(input);
        };
        CommonEventHandler.prototype.onRedoButtonClick = function () {
            var input = this.controller.redoStackElement();
            this.fnUpdateAreaText(input);
        };
        CommonEventHandler.prototype.onDownloadButtonClick = function () {
            this.controller.fnDownload();
        };
        CommonEventHandler.prototype.onRunButtonClick = function () {
            this.controller.startRun();
        };
        CommonEventHandler.prototype.onStopButtonClick = function () {
            this.controller.startBreak();
        };
        CommonEventHandler.prototype.onContinueButtonClick = function (event) {
            this.controller.startContinue();
            this.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onResetButtonClick = function () {
            this.controller.startReset();
        };
        CommonEventHandler.prototype.onParseRunButtonClick = function (event) {
            this.controller.startParseRun();
            this.onCpcCanvasClick(event);
        };
        CommonEventHandler.onHelpButtonClick = function () {
            window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
        };
        CommonEventHandler.prototype.onGalleryItemClick = function (event) {
            var target = View_5.View.getEventTarget(event), value = target.value;
            this.view.setSelectValue("exampleSelect", value);
            this.toogleHidden("galleryArea", "showGallery", "flex"); // close
            this.onExampleSelectChange();
        };
        CommonEventHandler.onNothing = function () {
            // nothing
        };
        // eslint-disable-next-line class-methods-use-this
        CommonEventHandler.prototype.onCopyTextButtonClick = function () {
            var textText = View_5.View.getElementByIdAs("textText");
            textText.select();
            this.view.setAreaSelection("textText", 0, 99999); // for mobile devices
            if (window.navigator && window.navigator.clipboard) {
                window.navigator.clipboard.writeText(textText.value);
            }
            else {
                Utils_18.Utils.console.warn("Copy to clipboard not available");
            }
        };
        CommonEventHandler.prototype.onOutputTextChange = function () {
            this.controller.invalidateScript();
        };
        CommonEventHandler.encodeUriParam = function (params) {
            var parts = [];
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var value = params[key];
                    parts[parts.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value);
                }
            }
            return parts.join("&");
        };
        CommonEventHandler.prototype.onReloadButtonClick = function () {
            var changed = this.model.getChangedProperties();
            var paras = CommonEventHandler.encodeUriParam(changed);
            paras = paras.replace(/%2[Ff]/g, "/"); // unescape %2F -> /
            window.location.search = "?" + paras;
        };
        CommonEventHandler.prototype.onDatabaseSelectChange = function () {
            this.controller.onDatabaseSelectChange();
        };
        CommonEventHandler.prototype.onDirectorySelectChange = function () {
            this.controller.onDirectorySelectChange();
        };
        CommonEventHandler.prototype.onExampleSelectChange = function () {
            this.controller.onExampleSelectChange();
        };
        CommonEventHandler.prototype.onVarSelectChange = function () {
            var par = this.view.getSelectValue("varSelect"), value = this.controller.getVariable(par), valueString = (value !== undefined) ? String(value) : "";
            this.view.setAreaValue("varText", valueString);
        };
        CommonEventHandler.prototype.onKbdLayoutSelectChange = function () {
            var value = this.view.getSelectValue("kbdLayoutSelect");
            this.model.setProperty("kbdLayout", value);
            this.view.setSelectTitleFromSelectedOption("kbdLayoutSelect");
            this.view.setHidden("kbdAlpha", value === "num");
            this.view.setHidden("kbdNum", value === "alpha");
        };
        CommonEventHandler.prototype.onVarTextChange = function () {
            this.controller.changeVariable();
        };
        CommonEventHandler.prototype.onImplicitLinesInputChange = function () {
            var checked = this.view.getInputChecked("implicitLinesInput");
            this.model.setProperty("implicitLines", checked);
            this.controller.fnImplicitLines();
        };
        CommonEventHandler.prototype.onArrayBoundsInputChange = function () {
            var checked = this.view.getInputChecked("arrayBoundsInput");
            this.model.setProperty("arrayBounds", checked);
            this.controller.fnArrayBounds();
        };
        CommonEventHandler.prototype.onTraceInputChange = function () {
            var checked = this.view.getInputChecked("traceInput");
            this.model.setProperty("trace", checked);
            this.controller.fnTrace();
        };
        CommonEventHandler.prototype.onSpeedInputChange = function () {
            var speed = this.view.getInputValue("speedInput");
            this.model.setProperty("speed", Number(speed));
            this.controller.fnSpeed();
        };
        CommonEventHandler.prototype.onScreenshotButtonClick = function () {
            var example = this.view.getSelectValue("exampleSelect"), image = this.controller.startScreenshot(), link = View_5.View.getElementById1("screenshotLink"), name = example + ".png";
            if (image) {
                link.setAttribute("download", name);
                link.setAttribute("href", image);
                link.click();
            }
        };
        CommonEventHandler.prototype.onEnterButtonClick = function () {
            this.controller.startEnter();
        };
        CommonEventHandler.prototype.onSoundButtonClick = function () {
            this.model.setProperty("sound", !this.model.getProperty("sound"));
            this.controller.setSoundActive();
        };
        CommonEventHandler.onFullscreenButtonClick = function () {
            var switched = View_5.View.requestFullscreenForId("cpcCanvas");
            if (!switched) {
                Utils_18.Utils.console.warn("Switch to fullscreen not available");
            }
        };
        CommonEventHandler.prototype.onCpcCanvasClick = function (event) {
            this.controller.onCpcCanvasClick(event);
        };
        CommonEventHandler.prototype.onWindowClick = function (event) {
            this.controller.onWindowClick(event);
        };
        CommonEventHandler.prototype.onTextTextClick = function (event) {
            this.controller.onTextTextClick(event);
        };
        /* eslint-enable no-invalid-this */
        CommonEventHandler.prototype.handleEvent = function (event) {
            var target = View_5.View.getEventTarget(event), id = (target) ? target.getAttribute("id") : String(target), type = event.type; // click or change
            if (this.fnUserAction) {
                this.fnUserAction(event, id);
            }
            if (id) {
                if (!target.disabled) { // check needed for IE which also fires for disabled buttons
                    var idNoNum = id.replace(/\d+$/, ""), // remove a trailing number
                    handler = "on" + Utils_18.Utils.stringCapitalize(idNoNum) + Utils_18.Utils.stringCapitalize(type);
                    if (Utils_18.Utils.debug) {
                        Utils_18.Utils.console.debug("fnCommonEventHandler: handler=" + handler);
                    }
                    if (handler in this.handlers) {
                        this.handlers[handler].call(this, event);
                    }
                    else if (!handler.endsWith("SelectClick") && !handler.endsWith("InputClick")) { // do not print all messages
                        Utils_18.Utils.console.log("Event handler not found:", handler);
                    }
                }
            }
            else if (target.getAttribute("data-key") === null) { // not for keyboard buttons
                if (Utils_18.Utils.debug) {
                    Utils_18.Utils.console.debug("Event handler for", type, "unknown target:", target.tagName, target.id);
                }
            }
            if (type === "click") { // special
                if (id !== "cpcCanvas" && id !== "textText") {
                    this.onWindowClick(event);
                }
            }
        };
        return CommonEventHandler;
    }());
    exports.CommonEventHandler = CommonEventHandler;
});
// Random.ts - Random Number Generator
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define("Random", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Random = void 0;
    //
    // Random number generator taken from:
    // Raj Jain: The Art of Computer Systems Performance Analysis, John Wiley & Sons, 1991, page 442-444
    //
    var Random = /** @class */ (function () {
        function Random(seed) {
            this.init(seed);
        }
        Random.prototype.init = function (seed) {
            this.x = seed || 1; // do not use 0
        };
        Random.prototype.random = function () {
            var m = 2147483647, // prime number 2^31-1; modulus, do not change!
            a = 16807, // 7^5, one primitive root; multiplier
            q = 127773, // m div a
            r = 2836; // m mod a
            var x = this.x; // last random value
            x = a * (x % q) - r * ((x / q) | 0); // eslint-disable-line no-bitwise
            // we use "| 0" to get an integer div result
            if (x <= 0) {
                x += m; // x is new random number
            }
            this.x = x;
            return x / m;
        };
        return Random;
    }());
    exports.Random = Random;
});
// Sound.ts - Sound output via WebAudio
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("Sound", ["require", "exports", "Utils"], function (require, exports, Utils_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sound = void 0;
    var Sound = /** @class */ (function () {
        function Sound(options) {
            this.isSoundOn = false;
            this.isActivatedByUserFlag = false;
            this.gainNodes = [];
            this.oscillators = []; // 3 oscillators left, middle, right
            this.queues = []; // node queues and info for the three channels
            this.fScheduleAheadTime = 0.1; // 100 ms
            this.volEnv = [];
            this.toneEnv = [];
            this.options = {
                AudioContextConstructor: options.AudioContextConstructor
            };
            for (var i = 0; i < 3; i += 1) {
                this.queues[i] = {
                    soundData: [],
                    fNextNoteTime: 0,
                    onHold: false,
                    rendevousMask: 0
                };
            }
            if (Utils_19.Utils.debug > 1) {
                this.debugLogList = []; // access: cpcBasic.controller.sound.debugLog
            }
        }
        Sound.prototype.reset = function () {
            var oscillators = this.oscillators, volEnvData = {
                steps: 1,
                diff: 0,
                time: 200
            };
            this.resetQueue();
            for (var i = 0; i < 3; i += 1) {
                if (oscillators[i]) {
                    this.stopOscillator(i);
                }
            }
            this.volEnv.length = 0;
            this.setVolEnv(0, [volEnvData]); // set default ENV (should not be changed)
            this.toneEnv.length = 0;
            if (this.debugLogList) {
                this.debugLogList.length = 0;
            }
        };
        Sound.prototype.stopOscillator = function (n) {
            var oscillators = this.oscillators, oscillatorNode = oscillators[n];
            if (oscillatorNode) {
                oscillatorNode.frequency.value = 0;
                oscillatorNode.stop();
                oscillatorNode.disconnect();
                oscillators[n] = undefined;
            }
        };
        Sound.prototype.debugLog = function (msg) {
            if (this.debugLogList) {
                this.debugLogList.push([
                    this.context ? this.context.currentTime : 0,
                    msg
                ]);
            }
        };
        Sound.prototype.resetQueue = function () {
            var queues = this.queues;
            for (var i = 0; i < queues.length; i += 1) {
                var queue = queues[i];
                queue.soundData.length = 0;
                queue.fNextNoteTime = 0;
                queue.onHold = false;
                queue.rendevousMask = 0;
            }
        };
        Sound.prototype.createSoundContext = function () {
            var channelMap2Cpc = [
                0,
                2,
                1
            ], context = new this.options.AudioContextConstructor(), // may produce exception if not available
            mergerNode = context.createChannelMerger(6); // create mergerNode with 6 inputs; we are using the first 3 for left, right, center
            this.context = context;
            this.mergerNode = mergerNode;
            for (var i = 0; i < 3; i += 1) {
                var gainNode = context.createGain();
                gainNode.connect(mergerNode, 0, channelMap2Cpc[i]); // connect output #0 of gainNode i to input #j of the mergerNode
                this.gainNodes[i] = gainNode;
            }
        };
        Sound.prototype.playNoise = function (oscillator, fTime, fDuration, noise) {
            var ctx = this.context, bufferSize = ctx.sampleRate * fDuration, // set the time of the note
            buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate), // create an empty buffer
            data = buffer.getChannelData(0), // get data
            noiseNode = ctx.createBufferSource(); // create a buffer source for noise data
            // fill the buffer with noise
            for (var i = 0; i < bufferSize; i += 1) {
                data[i] = Math.random() * 2 - 1; // -1..1
            }
            noiseNode.buffer = buffer;
            if (noise > 1) {
                var bandHz = 20000 / noise, bandpass = ctx.createBiquadFilter();
                bandpass.type = "bandpass";
                bandpass.frequency.value = bandHz;
                // bandpass.Q.value = q; // ?
                noiseNode.connect(bandpass).connect(this.gainNodes[oscillator]);
            }
            else {
                noiseNode.connect(this.gainNodes[oscillator]);
            }
            noiseNode.start(fTime);
            noiseNode.stop(fTime + fDuration);
        };
        Sound.prototype.applyVolEnv = function (volData, gain, fTime, volume, duration, volEnvRepeat) {
            var maxVolume = 15, i100ms2sec = 100; // time duration unit: 1/100 sec=10 ms, convert to sec
            var time = 0;
            for (var loop = 0; loop < volEnvRepeat; loop += 1) {
                for (var part = 0; part < volData.length; part += 1) {
                    var group = volData[part];
                    if (group.steps !== undefined) {
                        var group1 = group, volDiff = group1.diff, volTime = group1.time;
                        var volSteps = group1.steps;
                        if (!volSteps) { // steps=0
                            volSteps = 1;
                            volume = 0; // we will set volDiff as absolute volume
                        }
                        for (var i = 0; i < volSteps; i += 1) {
                            volume = (volume + volDiff) % (maxVolume + 1);
                            var fVolume = volume / maxVolume;
                            gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
                            time += volTime;
                            if (duration && time >= duration) { // eslint-disable-line max-depth
                                loop = volEnvRepeat; // stop early if longer than specified duration
                                part = volData.length;
                                break;
                            }
                        }
                    }
                    else { // register
                        var group2 = group, register = group2.register, period = group2.period, volTime = period;
                        if (register === 0) {
                            volume = 15;
                            var fVolume = volume / maxVolume;
                            gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
                            time += volTime;
                            fVolume = 0;
                            gain.linearRampToValueAtTime(fVolume, fTime + time / i100ms2sec); // or: exponentialRampToValueAtTime?
                        }
                        else {
                            // TODO: other registers
                        }
                    }
                }
            }
            if (duration === 0) {
                duration = time;
            }
            return duration;
        };
        Sound.prototype.applyToneEnv = function (toneData, frequency, fTime, period, duration) {
            var i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
            repeat = toneData[0], toneEnvRepeat = repeat ? 5 : 1; // we use at most 5
            var time = 0;
            for (var loop = 0; loop < toneEnvRepeat; loop += 1) {
                for (var part = 0; part < toneData.length; part += 1) {
                    var group = toneData[part];
                    if (group.steps !== undefined) {
                        var group1 = group, toneSteps = group1.steps || 1, // steps 0 => 1
                        toneDiff = group1.diff, toneTime = group1.time;
                        for (var i = 0; i < toneSteps; i += 1) {
                            var fFrequency = (period >= 3) ? 62500 / period : 0;
                            frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
                            period += toneDiff;
                            time += toneTime;
                            if (duration && time >= duration) { // eslint-disable-line max-depth
                                loop = toneEnvRepeat; // stop early if longer than specified duration
                                part = toneData.length;
                                break;
                            }
                        }
                    }
                    else { // absolute period
                        var group2 = group, toneTime = group2.time;
                        period = group2.period;
                        var fFrequency = (period >= 3) ? 62500 / period : 0;
                        frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
                        // TODO
                        time += toneTime;
                        // frequency.linearRampToValueAtTime(fXXX, fTime + time / i100ms2sec); // or: exponentialRampToValueAtTime?
                    }
                }
            }
        };
        Sound.prototype.scheduleNote = function (oscillator, fTime, soundData) {
            var maxVolume = 15, i100ms2sec = 100, // time duration unit: 1/100 sec=10 ms, convert to sec
            ctx = this.context, toneEnv = soundData.toneEnv;
            var volEnv = soundData.volEnv, volEnvRepeat = 1;
            if (Utils_19.Utils.debug > 1) {
                this.debugLog("scheduleNote: " + oscillator + " " + fTime);
            }
            var oscillatorNode = ctx.createOscillator();
            oscillatorNode.type = "square";
            oscillatorNode.frequency.value = (soundData.period >= 3) ? 62500 / soundData.period : 0;
            oscillatorNode.connect(this.gainNodes[oscillator]);
            if (fTime < ctx.currentTime) {
                if (Utils_19.Utils.debug) {
                    Utils_19.Utils.console.debug("Test: sound: scheduleNote:", fTime, "<", ctx.currentTime);
                }
            }
            var volume = soundData.volume, gain = this.gainNodes[oscillator].gain, fVolume = volume / maxVolume;
            gain.setValueAtTime(fVolume * fVolume, fTime); // start volume
            var duration = soundData.duration;
            if (duration < 0) { // <0: repeat volume envelope?
                volEnvRepeat = Math.min(5, -duration); // we limit repeat to 5 times sice we precompute duration
                duration = 0;
            }
            if (volEnv || !duration) { // some volume envelope or duration 0?
                if (!this.volEnv[volEnv]) {
                    volEnv = 0; // envelope not defined => use default envelope 0
                }
                duration = this.applyVolEnv(this.volEnv[volEnv], gain, fTime, volume, duration, volEnvRepeat);
            }
            if (toneEnv && this.toneEnv[toneEnv]) { // some tone envelope?
                this.applyToneEnv(this.toneEnv[toneEnv], oscillatorNode.frequency, fTime, soundData.period, duration);
            }
            var fDuration = duration / i100ms2sec;
            oscillatorNode.start(fTime);
            oscillatorNode.stop(fTime + fDuration);
            this.oscillators[oscillator] = oscillatorNode;
            if (soundData.noise) {
                this.playNoise(oscillator, fTime, fDuration, soundData.noise);
            }
            return fDuration;
        };
        Sound.prototype.testCanQueue = function (state) {
            var canQueue = true;
            if (this.isSoundOn && !this.isActivatedByUserFlag) { // sound on but not yet activated? -> say cannot queue
                canQueue = false;
                /* eslint-disable no-bitwise */
            }
            else if (!(state & 0x80)) { // 0x80: flush
                var queues = this.queues;
                if ((state & 0x01 && queues[0].soundData.length >= 4)
                    || (state & 0x02 && queues[1].soundData.length >= 4)
                    || (state & 0x04 && queues[2].soundData.length >= 4)) {
                    canQueue = false;
                }
            }
            /* eslint-enable no-bitwise */
            return canQueue;
        };
        Sound.prototype.sound = function (soundData) {
            if (!this.isSoundOn) {
                return;
            }
            var queues = this.queues, state = soundData.state;
            for (var i = 0; i < 3; i += 1) {
                if ((state >> i) & 0x01) { // eslint-disable-line no-bitwise
                    var queue = queues[i];
                    if (state & 0x80) { // eslint-disable-line no-bitwise
                        queue.soundData.length = 0; // flush queue
                        queue.fNextNoteTime = 0;
                        this.stopOscillator(i);
                    }
                    queue.soundData.push(soundData); // just a reference
                    if (Utils_19.Utils.debug > 1) {
                        this.debugLog("sound: " + i + " " + state + ":" + queue.soundData.length);
                    }
                    this.updateQueueStatus(i, queue);
                }
            }
            this.scheduler(); // schedule early to allow SQ busy check immediately (can channels go out of sync by this?)
        };
        Sound.prototype.setVolEnv = function (volEnv, volEnvData) {
            this.volEnv[volEnv] = volEnvData;
        };
        Sound.prototype.setToneEnv = function (toneEnv, toneEnvData) {
            this.toneEnv[toneEnv] = toneEnvData;
        };
        Sound.prototype.updateQueueStatus = function (i, queue) {
            var soundData = queue.soundData;
            if (soundData.length) {
                /* eslint-disable no-bitwise */
                queue.onHold = Boolean(soundData[0].state & 0x40); // check if next note on hold
                queue.rendevousMask = (soundData[0].state & 0x07); // get channel bits
                queue.rendevousMask &= ~(1 << i); // mask out our channel
                queue.rendevousMask |= (soundData[0].state >> 3) & 0x07; // and combine rendevous
                /* eslint-enable no-bitwise */
            }
            else {
                queue.onHold = false;
                queue.rendevousMask = 0;
            }
        };
        // idea from: https://www.html5rocks.com/en/tutorials/audio/scheduling/
        Sound.prototype.scheduler = function () {
            if (!this.isSoundOn) {
                return;
            }
            var context = this.context, fCurrentTime = context.currentTime, queues = this.queues;
            var canPlayMask = 0;
            for (var i = 0; i < 3; i += 1) {
                var queue = queues[i];
                while (queue.soundData.length && !queue.onHold && queue.fNextNoteTime < fCurrentTime + this.fScheduleAheadTime) { // something to schedule and not on hold and time reached
                    if (!queue.rendevousMask) { // no rendevous needed, schedule now
                        if (queue.fNextNoteTime < fCurrentTime) {
                            queue.fNextNoteTime = fCurrentTime;
                        }
                        var soundData = queue.soundData.shift();
                        queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
                        this.updateQueueStatus(i, queue); // check if next note on hold
                    }
                    else { // need rendevous
                        canPlayMask |= (1 << i); // eslint-disable-line no-bitwise
                        break;
                    }
                }
            }
            if (!canPlayMask) { // no channel can play
                return;
            }
            for (var i = 0; i < 3; i += 1) {
                var queue = queues[i];
                // we can play, if in rendevous
                if ((canPlayMask >> i) & 0x01 && ((queue.rendevousMask & canPlayMask) === queue.rendevousMask)) { // eslint-disable-line no-bitwise
                    if (queue.fNextNoteTime < fCurrentTime) {
                        queue.fNextNoteTime = fCurrentTime;
                    }
                    var soundData = queue.soundData.shift();
                    queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
                    this.updateQueueStatus(i, queue); // check if next note on hold
                }
            }
        };
        Sound.prototype.release = function (releaseMask) {
            var queues = this.queues;
            if (!queues.length) {
                return;
            }
            if (Utils_19.Utils.debug > 1) {
                this.debugLog("release: " + releaseMask);
            }
            for (var i = 0; i < 3; i += 1) {
                var queue = queues[i], soundData = queue.soundData;
                if (((releaseMask >> i) & 0x01) && soundData.length && queue.onHold) { // eslint-disable-line no-bitwise
                    queue.onHold = false; // release
                }
            }
            this.scheduler(); // extra schedule now so that following sound instructions are not releases early
        };
        Sound.prototype.sq = function (n) {
            var queues = this.queues, queue = queues[n], soundData = queue.soundData, context = this.context;
            var sq = 4 - soundData.length;
            if (sq < 0) {
                sq = 0;
            }
            /* eslint-disable no-bitwise */
            sq |= (queue.rendevousMask << 3);
            if (this.oscillators[n] && queues[n].fNextNoteTime > context.currentTime) { // note still playing?
                sq |= 0x80; // eslint-disable-line no-bitwise
            }
            else if (soundData.length && (soundData[0].state & 0x40)) {
                sq |= 0x40;
            }
            /* eslint-enable no-bitwise */
            return sq;
        };
        Sound.prototype.setActivatedByUser = function () {
            this.isActivatedByUserFlag = true;
        };
        Sound.prototype.isActivatedByUser = function () {
            return this.isActivatedByUserFlag;
        };
        Sound.prototype.soundOn = function () {
            if (!this.isSoundOn) {
                if (!this.context) {
                    this.createSoundContext();
                }
                var mergerNode = this.mergerNode, context = this.context;
                mergerNode.connect(context.destination);
                this.isSoundOn = true;
                if (Utils_19.Utils.debug) {
                    Utils_19.Utils.console.debug("soundOn: Sound switched on");
                }
            }
        };
        Sound.prototype.soundOff = function () {
            if (this.isSoundOn) {
                var mergerNode = this.mergerNode, context = this.context;
                mergerNode.disconnect(context.destination);
                this.isSoundOn = false;
                if (Utils_19.Utils.debug) {
                    Utils_19.Utils.console.debug("soundOff: Sound switched off");
                }
            }
        };
        return Sound;
    }());
    exports.Sound = Sound;
});
// ZipFile.ts - ZIP file handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("ZipFile", ["require", "exports", "Utils"], function (require, exports, Utils_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZipFile = void 0;
    var ZipFile = /** @class */ (function () {
        function ZipFile(data, zipName) {
            this.data = data;
            this.zipName = zipName; // for error messages
            this.entryTable = this.readZipDirectory();
        }
        ZipFile.prototype.getZipDirectory = function () {
            return this.entryTable;
        };
        ZipFile.prototype.composeError = function (error, message, value, pos) {
            message = this.zipName + ": " + message; // put zipname in message
            return Utils_20.Utils.composeError("ZipFile", error, message, value, pos);
        };
        ZipFile.prototype.subArr = function (begin, length) {
            var data = this.data, end = begin + length;
            return data.slice ? data.slice(begin, end) : data.subarray(begin, end); // array.slice on Uint8Array not for IE11
        };
        ZipFile.prototype.readUTF = function (offset, len) {
            var callSize = 25000; // use call window to avoid "maximum call stack error" for e.g. size 336461
            var out = "";
            while (len) {
                var chunkLen = Math.min(len, callSize), nums = this.subArr(offset, chunkLen);
                out += String.fromCharCode.apply(null, nums); // on Chrome this is faster than single character processing
                offset += chunkLen;
                len -= chunkLen;
            }
            return out;
        };
        ZipFile.prototype.readUInt = function (i) {
            var data = this.data;
            return (data[i + 3] << 24) | (data[i + 2] << 16) | (data[i + 1] << 8) | data[i]; // eslint-disable-line no-bitwise
        };
        ZipFile.prototype.readUShort = function (i) {
            var data = this.data;
            return ((data[i + 1]) << 8) | data[i]; // eslint-disable-line no-bitwise
        };
        ZipFile.prototype.readEocd = function (eocdPos) {
            var eocd = {
                signature: this.readUInt(eocdPos),
                entries: this.readUShort(eocdPos + 10),
                cdfhOffset: this.readUInt(eocdPos + 16),
                cdSize: this.readUInt(eocdPos + 20) // size of central directory (just for information)
            };
            return eocd;
        };
        ZipFile.prototype.readCdfh = function (pos) {
            var cdfh = {
                signature: this.readUInt(pos),
                version: this.readUShort(pos + 6),
                flag: this.readUShort(pos + 8),
                compressionMethod: this.readUShort(pos + 10),
                modificationTime: this.readUShort(pos + 12),
                crc: this.readUInt(pos + 16),
                compressedSize: this.readUInt(pos + 20),
                size: this.readUInt(pos + 24),
                fileNameLength: this.readUShort(pos + 28),
                extraFieldLength: this.readUShort(pos + 30),
                fileCommentLength: this.readUShort(pos + 32),
                localOffset: this.readUInt(pos + 42),
                // set later...
                name: "",
                isDirectory: false,
                extra: [],
                comment: "",
                timestamp: 0,
                dataStart: 0
            };
            return cdfh;
        };
        ZipFile.prototype.readZipDirectory = function () {
            var eocdLen = 22, // End of central directory (EOCD)
            maxEocdCommentLen = 0xffff, eocdSignature = 0x06054B50, // EOCD signature: "PK\x05\x06"
            cdfhSignature = 0x02014B50, // Central directory file header signature: PK\x01\x02"
            cdfhLen = 46, // Central directory file header length
            lfhSignature = 0x04034b50, // Local file header signature
            lfhLen = 30, // Local file header length
            data = this.data, entryTable = {};
            // find End of central directory (EOCD) record
            var i = data.length - eocdLen + 1, // +1 because of loop
            eocd;
            var n = Math.max(0, i - maxEocdCommentLen);
            while (i >= n) {
                i -= 1;
                if (this.readUInt(i) === eocdSignature) {
                    eocd = this.readEocd(i);
                    if (this.readUInt(eocd.cdfhOffset) === cdfhSignature) {
                        break; // looks good, so we assume that we have found the EOCD
                    }
                }
            }
            if (!eocd) {
                throw this.composeError(Error(), "Zip: File ended abruptly: EOCD not found", "", (i >= 0) ? i : 0);
            }
            var entries = eocd.entries;
            var offset = eocd.cdfhOffset;
            for (i = 0; i < entries; i += 1) {
                var cdfh = this.readCdfh(offset);
                if (cdfh.signature !== cdfhSignature) {
                    throw this.composeError(Error(), "Zip: Bad CDFH signature", "", offset);
                }
                if (!cdfh.fileNameLength) {
                    throw this.composeError(Error(), "Zip Entry name missing", "", offset);
                }
                offset += cdfhLen;
                cdfh.name = this.readUTF(offset, cdfh.fileNameLength);
                offset += cdfh.fileNameLength;
                cdfh.isDirectory = cdfh.name.charAt(cdfh.name.length - 1) === "/";
                cdfh.extra = this.subArr(offset, cdfh.extraFieldLength);
                offset += cdfh.extraFieldLength;
                cdfh.comment = this.readUTF(offset, cdfh.fileCommentLength);
                offset += cdfh.fileCommentLength;
                if ((cdfh.flag & 1) === 1) { // eslint-disable-line no-bitwise
                    throw this.composeError(Error(), "Zip encrypted entries not supported", "", i);
                }
                var dostime = cdfh.modificationTime;
                // year, month, day, hour, minute, second
                cdfh.timestamp = new Date(((dostime >> 25) & 0x7F) + 1980, ((dostime >> 21) & 0x0F) - 1, (dostime >> 16) & 0x1F, (dostime >> 11) & 0x1F, (dostime >> 5) & 0x3F, (dostime & 0x1F) << 1).getTime(); // eslint-disable-line no-bitwise
                // local file header... much more info
                if (this.readUInt(cdfh.localOffset) !== lfhSignature) {
                    Utils_20.Utils.console.error("Zip: readZipDirectory: LFH signature not found at offset", cdfh.localOffset);
                }
                var lfhExtrafieldLength = this.readUShort(cdfh.localOffset + 28); // extra field length
                cdfh.dataStart = cdfh.localOffset + lfhLen + cdfh.name.length + lfhExtrafieldLength;
                entryTable[cdfh.name] = cdfh;
            }
            return entryTable;
        };
        ZipFile.fnInflateConstruct = function (codes, lens2, n) {
            var i;
            for (i = 0; i <= 0xF; i += 1) {
                codes.count[i] = 0;
            }
            for (i = 0; i < n; i += 1) {
                codes.count[lens2[i]] += 1;
            }
            if (codes.count[0] === n) {
                return 0;
            }
            var left = 1;
            for (i = 1; i <= 0xF; i += 1) {
                if ((left = (left << 1) - codes.count[i]) < 0) { // eslint-disable-line no-bitwise
                    return left;
                }
            }
            var offs = [
                undefined,
                0
            ];
            for (i = 1; i < 0xF; i += 1) {
                offs[i + 1] = offs[i] + codes.count[i];
            }
            for (i = 0; i < n; i += 1) {
                if (lens2[i] !== 0) {
                    codes.symbol[offs[lens2[i]]] = i; // TTT
                    offs[lens2[i]] += 1; // TTT
                }
            }
            return left;
        };
        ZipFile.fnConstructFixedHuffman = function (lens, lenCode, distCode) {
            var symbol;
            for (symbol = 0; symbol < 0x90; symbol += 1) {
                lens[symbol] = 8;
            }
            for (; symbol < 0x100; symbol += 1) {
                lens[symbol] = 9;
            }
            for (; symbol < 0x118; symbol += 1) {
                lens[symbol] = 7;
            }
            for (; symbol < 0x120; symbol += 1) {
                lens[symbol] = 8;
            }
            ZipFile.fnInflateConstruct(lenCode, lens, 0x120);
            for (symbol = 0; symbol < 0x1E; symbol += 1) {
                lens[symbol] = 5;
            }
            ZipFile.fnInflateConstruct(distCode, lens, 0x1E);
        };
        ZipFile.prototype.inflate = function (offset, compressedSize, finalSize) {
            /* eslint-disable array-element-newline */
            var startLens = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258], lExt = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], dists = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577], dExt = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], dynamicTableOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], 
            /* eslint-enable array-element-newline */
            that = this, // eslint-disable-line @typescript-eslint/no-this-alias
            data = this.data, bufEnd = offset + compressedSize, outBuf = new Uint8Array(finalSize);
            var inCnt = offset, // read position
            outCnt = 0, // bytes written to outbuf
            bitCnt = 0, // helper to keep track of where we are in #bits
            bitBuf = 0, distCode, lenCode, lens;
            var fnBits = function (need) {
                var out = bitBuf;
                while (bitCnt < need) {
                    if (inCnt === bufEnd) {
                        throw that.composeError(Error(), "Zip: inflate: Data overflow", that.zipName, -1);
                    }
                    out |= data[inCnt] << bitCnt; // eslint-disable-line no-bitwise
                    inCnt += 1;
                    bitCnt += 8;
                }
                bitBuf = out >> need; // eslint-disable-line no-bitwise
                bitCnt -= need;
                return out & ((1 << need) - 1); // eslint-disable-line no-bitwise
            }, fnDecode = function (codes) {
                var code = 0, first = 0, i = 0;
                for (var j = 1; j <= 0xF; j += 1) {
                    code |= fnBits(1); // eslint-disable-line no-bitwise
                    var count = codes.count[j];
                    if (code < first + count) {
                        return codes.symbol[i + (code - first)];
                    }
                    i += count;
                    first += count;
                    first <<= 1; // eslint-disable-line no-bitwise
                    code <<= 1; // eslint-disable-line no-bitwise
                }
                return null;
            }, fnInflateStored = function () {
                bitBuf = 0;
                bitCnt = 0;
                if (inCnt + 4 > bufEnd) {
                    throw that.composeError(Error(), "Zip: inflate: Data overflow", "", inCnt);
                }
                var len = that.readUShort(inCnt);
                inCnt += 2;
                if (data[inCnt] !== (~len & 0xFF) || data[inCnt + 1] !== ((~len >> 8) & 0xFF)) { // eslint-disable-line no-bitwise
                    throw that.composeError(Error(), "Zip: inflate: Bad length", "", inCnt);
                }
                inCnt += 2;
                if (inCnt + len > bufEnd) {
                    throw that.composeError(Error(), "Zip: inflate: Data overflow", "", inCnt);
                }
                // Compatibility: Instead of: outbuf.push.apply(outbuf, outbuf.slice(incnt, incnt + len)); outcnt += len; incnt += len;
                while (len) {
                    outBuf[outCnt] = data[inCnt];
                    outCnt += 1;
                    inCnt += 1;
                    len -= 1;
                }
            }, fnConstructDynamicHuffman = function () {
                var nLen = fnBits(5) + 257, nDist = fnBits(5) + 1, nCode = fnBits(4) + 4;
                if (nLen > 0x11E || nDist > 0x1E) {
                    throw that.composeError(Error(), "Zip: inflate: length/distance code overflow", "", 0);
                }
                var i;
                for (i = 0; i < nCode; i += 1) {
                    lens[dynamicTableOrder[i]] = fnBits(3);
                }
                for (; i < 19; i += 1) {
                    lens[dynamicTableOrder[i]] = 0;
                }
                if (ZipFile.fnInflateConstruct(lenCode, lens, 19) !== 0) {
                    throw that.composeError(Error(), "Zip: inflate: length codes incomplete", "", 0);
                }
                for (i = 0; i < nLen + nDist;) {
                    var symbol = fnDecode(lenCode); // TTT
                    /* eslint-disable max-depth */
                    if (symbol < 16) {
                        lens[i] = symbol;
                        i += 1;
                    }
                    else {
                        var len = 0;
                        if (symbol === 16) {
                            if (i === 0) {
                                throw that.composeError(Error(), "Zip: inflate: repeat lengths with no first length", "", 0);
                            }
                            len = lens[i - 1];
                            symbol = 3 + fnBits(2);
                        }
                        else if (symbol === 17) {
                            symbol = 3 + fnBits(3);
                        }
                        else {
                            symbol = 11 + fnBits(7);
                        }
                        if (i + symbol > nLen + nDist) {
                            throw that.composeError(Error(), "Zip: inflate: more lengths than specified", "", 0);
                        }
                        while (symbol) {
                            lens[i] = len;
                            symbol -= 1;
                            i += 1;
                        }
                    }
                    /* eslint-enable max-depth */
                }
                var err1 = ZipFile.fnInflateConstruct(lenCode, lens, nLen), err2 = ZipFile.fnInflateConstruct(distCode, lens.slice(nLen), nDist);
                if ((err1 < 0 || (err1 > 0 && nLen - lenCode.count[0] !== 1))
                    || (err2 < 0 || (err2 > 0 && nDist - distCode.count[0] !== 1))) {
                    throw that.composeError(Error(), "Zip: inflate: bad literal or length codes", "", 0);
                }
            }, fnInflateHuffmann = function () {
                var symbol;
                do { // decode deflated data
                    symbol = fnDecode(lenCode); // TTT
                    if (symbol < 256) {
                        outBuf[outCnt] = symbol;
                        outCnt += 1;
                    }
                    if (symbol > 256) {
                        symbol -= 257;
                        if (symbol > 28) {
                            throw that.composeError(Error(), "Zip: inflate: Invalid length/distance", "", 0);
                        }
                        var len = startLens[symbol] + fnBits(lExt[symbol]);
                        symbol = fnDecode(distCode); // TTT
                        var dist = dists[symbol] + fnBits(dExt[symbol]);
                        if (dist > outCnt) {
                            throw that.composeError(Error(), "Zip: inflate: distance out of range", "", 0);
                        }
                        // instead of outbuf.slice, we use...
                        while (len) {
                            outBuf[outCnt] = outBuf[outCnt - dist];
                            len -= 1;
                            outCnt += 1;
                        }
                    }
                } while (symbol !== 256);
            };
            var last;
            do { // The actual inflation
                last = fnBits(1);
                var type = fnBits(2);
                switch (type) {
                    case 0: // STORED
                        fnInflateStored();
                        break;
                    case 1:
                    case 2: // fixed (=1) or dynamic (=2) huffman
                        lenCode = {
                            count: [],
                            symbol: []
                        };
                        distCode = {
                            count: [],
                            symbol: []
                        };
                        lens = [];
                        if (type === 1) { // construct fixed huffman tables
                            ZipFile.fnConstructFixedHuffman(lens, lenCode, distCode);
                        }
                        else { // construct dynamic huffman tables
                            fnConstructDynamicHuffman();
                        }
                        fnInflateHuffmann();
                        break;
                    default:
                        throw this.composeError(Error(), "Zip: inflate: unsupported compression type" + type, "", 0);
                }
            } while (!last);
            return outBuf;
        };
        ZipFile.prototype.readData = function (name) {
            var cdfh = this.entryTable[name];
            if (!cdfh) {
                throw this.composeError(Error(), "Zip: readData: file does not exist:" + name, "", 0);
            }
            var dataUTF8 = "";
            if (cdfh.compressionMethod === 0) { // stored
                dataUTF8 = this.readUTF(cdfh.dataStart, cdfh.size);
            }
            else if (cdfh.compressionMethod === 8) { // deflated
                var fileData = this.inflate(cdfh.dataStart, cdfh.compressedSize, cdfh.size), savedData = this.data;
                this.data = fileData; // we need to switch this.data
                dataUTF8 = this.readUTF(0, fileData.length);
                this.data = savedData; // restore
            }
            else {
                throw this.composeError(Error(), "Zip: readData: compression method not supported:" + cdfh.compressionMethod, "", 0);
            }
            if (dataUTF8.length !== cdfh.size) { // assert
                Utils_20.Utils.console.error("Zip: readData: different length 2!");
            }
            return dataUTF8;
        };
        return ZipFile;
    }());
    exports.ZipFile = ZipFile;
});
// CpcVm.ts - CPC Virtual Machine
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("CpcVm", ["require", "exports", "Utils", "Random"], function (require, exports, Utils_21, Random_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CpcVm = void 0;
    var CpcVm = /** @class */ (function () {
        function CpcVm(options) {
            this.quiet = false;
            this.inkeyTimeMs = 0; // next time of frame fly (if >0, next time when inkey$ can be checked without inserting "waitFrame")
            this.gosubStack = []; // stack of line numbers for gosub/return
            this.maxGosubStackLength = 83; // maximum nesting of GOSUB on a real CPC
            this.dataIndex = 0; // current index
            this.dataLineIndex = {
                0: 0 // for line 0: index 0
            };
            this.sourceMap = {};
            this.crtcReg = 0;
            this.printControlBuf = "";
            this.startTime = 0;
            this.lastRnd = 0; // last random number
            this.nextFrameTime = 0;
            this.initialStop = 5;
            this.stopCount = 0;
            this.line = 0;
            this.startLine = 0;
            this.errorGotoLine = 0;
            this.errorResumeLine = 0;
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
            this.outBuffer = "";
            this.errorCode = 0; // last error code (Err)
            this.errorLine = 0; // line of last error (Erl)
            this.degFlag = false; // degree or radians
            this.tronFlag1 = false; // trace flag
            this.ramSelect = 0;
            this.screenPage = 3; // 16K screen page, 3=0xc000..0xffff
            this.minCharHimem = CpcVm.maxHimem;
            this.maxCharHimem = CpcVm.maxHimem;
            this.himemValue = CpcVm.maxHimem;
            this.minCustomChar = 256;
            this.timerPriority = -1; // priority of running task: -1=low (min priority to start new timers)
            this.zoneValue = 13; // print tab zone value
            this.modeValue = -1;
            /* eslint-disable no-invalid-this */
            this.vmInternal = {
                getTimerList: this.vmTestGetTimerList,
                getWindowDataList: this.vmTestGetWindowDataList,
                commaTab: this.commaTab,
                spc: this.spc,
                tab: this.tab
            };
            this.fnOpeninHandler = this.vmOpeninCallback.bind(this);
            this.fnCloseinHandler = this.vmCloseinCallback.bind(this);
            this.fnCloseoutHandler = this.vmCloseoutCallback.bind(this);
            this.fnLoadHandler = this.vmLoadCallback.bind(this);
            this.fnRunHandler = this.vmRunCallback.bind(this);
            this.canvas = options.canvas;
            this.textCanvas = options.textCanvas;
            this.keyboard = options.keyboard;
            this.soundClass = options.sound;
            this.variables = options.variables;
            this.quiet = Boolean(options.quiet);
            this.random = new Random_1.Random();
            this.stopCount = this.initialStop;
            this.stopEntry = {
                reason: "",
                priority: 0,
                paras: {}
            };
            this.inputValues = []; // values to input into script
            this.inFile = {
                open: false,
                command: "",
                name: "",
                line: 0,
                start: undefined,
                fileData: [],
                fnFileCallback: undefined,
                first: 0,
                last: 0,
                memorizedExample: ""
            };
            this.outFile = {
                open: false,
                command: "",
                name: "",
                line: 0,
                start: 0,
                fileData: [],
                fnFileCallback: undefined,
                stream: 0,
                typeString: "",
                length: 0,
                entry: 0
            }; // file handling
            // "open": File open flag
            // "command": Command that started the file open (in: chain, chainMerge, load, merge, openin, run; out: save, openput)
            // "name": File name
            // "type": File type: A, B, P, T
            // "start": start address of data
            // "length": length of data
            // "entry": entry address (save)
            // "line": ?
            // "fileData": File contents for (LINE) INPUT #9; PRINT #9, WRITE #9
            // "fnFileCallback": Callback for stop reason "fileLoad", "fileSave"
            // "line": run line (CHAIN, CHAIN MERGE)
            // "first": first line to delete (CHAIN MERGE)
            // "last": last line to delete (CHAIN MERGE)
            this.gosubStack = []; // stack of line numbers for gosub/return
            this.mem = []; // for peek, poke
            this.dataList = []; // array for BASIC data lines (continuous)
            this.labelList = [];
            this.windowDataList = []; // window data for window 0..7,8,9
            for (var i = 0; i < CpcVm.streamCount; i += 1) {
                this.windowDataList[i] = {};
            }
            this.timerList = []; // BASIC timer 0..3 (3 has highest priority)
            for (var i = 0; i < CpcVm.timerCount; i += 1) {
                this.timerList[i] = {};
            }
            this.soundData = [];
            this.sqTimer = []; // Sound queue timer 0..2
            for (var i = 0; i < CpcVm.sqTimerCount; i += 1) {
                this.sqTimer[i] = {};
            }
            this.crtcData = [];
        }
        CpcVm.prototype.getOptions = function () {
            return {
                canvas: this.canvas,
                textCanvas: this.textCanvas,
                keyboard: this.keyboard,
                sound: this.soundClass,
                variables: this.variables,
                quiet: this.quiet
            };
        };
        CpcVm.prototype.vmSetRsxClass = function (rsx) {
            this.rsx = rsx; // this.rsx just used in the script
        };
        CpcVm.prototype.vmReset = function () {
            this.startTime = Date.now();
            this.vmResetRandom();
            this.nextFrameTime = Date.now() + CpcVm.frameTimeMs; // next time of frame fly
            this.stopCount = this.initialStop;
            this.line = 0; // current line number (or label)
            this.startLine = 0; // line to start
            this.errorGotoLine = 0;
            this.errorResumeLine = 0;
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
            this.inputValues.length = 0;
            this.vmResetInFileHandling();
            this.vmResetControlBuffer();
            this.outBuffer = ""; // console output
            this.vmStop("", 0, true);
            this.vmResetData();
            this.errorCode = 0; // last error code
            this.errorLine = 0; // line of last error
            this.gosubStack.length = 0;
            this.degFlag = false; // degree or radians
            this.tronFlag1 = false;
            this.screenPage = 3; // 16K screen page, 3=0xc000..0xffff
            this.crtcReg = 0;
            this.crtcData.length = 0;
            this.vmResetMemory();
            this.symbolAfter(240); // set also minCustomChar
            this.vmResetTimers();
            this.timerPriority = -1; // priority of running task: -1=low (min priority to start new timers)
            this.zoneValue = 13; // print tab zone value
            this.defreal("a", "z"); // init vartypes
            this.modeValue = -1;
            this.vmResetWindowData(true); // reset all, including pen and paper
            this.width(132); // set default printer width
            this.mode(1); // including vmResetWindowData() without pen and paper
            this.canvas.reset();
            this.textCanvas.reset();
            this.keyboard.reset();
            this.soundClass.reset();
            this.soundData.length = 0;
            this.inkeyTimeMs = 0; // if >0, next time when inkey$ can be checked without inserting "waitFrame"
        };
        CpcVm.prototype.vmResetMemory = function () {
            this.mem.length = 0; // clear memory (for PEEK, POKE)
            this.ramSelect = 0; // for banking with 16K banks in the range 0x4000-0x7fff (0=default; 1...=additional)
            this.minCharHimem = CpcVm.maxHimem;
            this.maxCharHimem = CpcVm.maxHimem;
            this.himemValue = CpcVm.maxHimem;
            this.minCustomChar = 256;
        };
        CpcVm.prototype.vmResetRandom = function () {
            this.random.init();
            this.lastRnd = 0;
        };
        CpcVm.prototype.vmResetTimers = function () {
            var data = {
                line: 0,
                repeat: false,
                intervalMs: 0,
                active: false,
                nextTimeMs: 0,
                handlerRunning: false,
                stackIndexReturn: 0,
                savedPriority: 0 // priority befora calling the handler
            }, timer = this.timerList, sqTimer = this.sqTimer;
            for (var i = 0; i < CpcVm.timerCount; i += 1) {
                Object.assign(timer[i], data);
            }
            // sound queue timer
            for (var i = 0; i < CpcVm.sqTimerCount; i += 1) {
                Object.assign(sqTimer[i], data);
            }
        };
        CpcVm.prototype.vmResetWindowData = function (resetPenPaper) {
            var winData = CpcVm.winData[this.modeValue], data = {
                pos: 0,
                vpos: 0,
                textEnabled: true,
                tag: false,
                transparent: false,
                cursorOn: false,
                cursorEnabled: true // user switch
            }, penPaperData = {
                pen: 1,
                paper: 0
            }, printData = {
                pos: 0,
                vpos: 0,
                right: 132 // override
            }, cassetteData = {
                pos: 0,
                vpos: 0,
                right: 255 // override
            };
            if (resetPenPaper) {
                Object.assign(data, penPaperData);
            }
            for (var i = 0; i < this.windowDataList.length - 2; i += 1) { // for window streams
                Object.assign(this.windowDataList[i], winData, data);
            }
            Object.assign(this.windowDataList[8], winData, printData); // printer
            Object.assign(this.windowDataList[9], winData, cassetteData); // cassette
        };
        CpcVm.prototype.vmResetControlBuffer = function () {
            this.printControlBuf = ""; // collected control characters for PRINT
        };
        CpcVm.vmResetFileHandling = function (file) {
            file.open = false;
            file.command = ""; // to be sure
            file.name = "";
            file.line = 0;
            file.start = undefined; // to be sure
            file.fileData.length = 0;
        };
        CpcVm.prototype.vmResetInFileHandling = function () {
            var inFile = this.inFile;
            CpcVm.vmResetFileHandling(inFile);
            inFile.first = 0;
            inFile.last = 0;
        };
        CpcVm.prototype.vmResetOutFileHandling = function () {
            var outFile = this.outFile;
            CpcVm.vmResetFileHandling(outFile);
            outFile.stream = 0;
            outFile.typeString = "";
            outFile.length = 0;
            outFile.entry = 0;
        };
        CpcVm.prototype.vmResetData = function () {
            this.dataList.length = 0; // array for BASIC data lines (continuous)
            this.dataIndex = 0; // current index
            this.dataLineIndex = {
                0: 0 // for line 0: index 0
            };
        };
        CpcVm.prototype.vmResetInks = function () {
            this.canvas.setDefaultInks();
            this.canvas.setSpeedInk(10, 10);
        };
        CpcVm.prototype.vmReset4Run = function () {
            var stream = 0;
            this.clearInput();
            this.closein();
            this.closeout();
            this.cursor(stream, 0);
            this.labelList.length = 0;
        };
        CpcVm.prototype.vmGetAllVariables = function () {
            return this.variables.getAllVariables();
        };
        CpcVm.prototype.vmGetAllVarTypes = function () {
            return this.variables.getAllVarTypes();
        };
        CpcVm.prototype.vmSetStartLine = function (line) {
            this.startLine = line;
        };
        CpcVm.prototype.vmSetLabels = function (labels) {
            this.labelList.length = 0;
            Object.assign(this.labelList, labels);
        };
        CpcVm.prototype.vmOnBreakContSet = function () {
            return this.breakGosubLine < 0; // on break cont
        };
        CpcVm.prototype.vmOnBreakHandlerActive = function () {
            return Boolean(this.breakResumeLine);
        };
        CpcVm.prototype.vmEscape = function () {
            var stop = true;
            if (this.breakGosubLine > 0) { // on break gosub n
                if (!this.breakResumeLine) { // do not nest break gosub
                    this.breakResumeLine = Number(this.line);
                    this.vmGosub(this.line, this.breakGosubLine);
                }
                stop = false;
            }
            else if (this.breakGosubLine < 0) { // on break cont
                stop = false;
            } // else: on break stop
            return stop;
        };
        CpcVm.prototype.vmAssertNumber = function (n, err) {
            if (typeof n !== "number") {
                throw this.vmComposeError(Error(), 13, err + " " + n); // Type mismatch
            }
        };
        CpcVm.prototype.vmAssertString = function (s, err) {
            if (typeof s !== "string") {
                throw this.vmComposeError(Error(), 13, err + " " + s); // Type mismatch
            }
        };
        CpcVm.prototype.vmAssertInRange = function (n, min, max, err) {
            this.vmAssertNumber(n, err);
            if (n < min || n > max) {
                if (!this.quiet) {
                    Utils_21.Utils.console.warn("vmAssertInRange: number not in range:", min + "<=" + n + "<=" + max);
                }
                throw this.vmComposeError(Error(), 5, err + " " + n); // 5=Improper argument
            }
            return n;
        };
        // round number (-2^31..2^31) to integer; throw error if no number
        CpcVm.prototype.vmRound = function (n, err) {
            this.vmAssertNumber(n, err || "?");
            return (n >= 0) ? (n + 0.5) | 0 : (n - 0.5) | 0; // eslint-disable-line no-bitwise
        };
        CpcVm.prototype.vmInRangeRound = function (n, min, max, err) {
            n = this.vmRound(n, err);
            if (n < min || n > max) {
                if (!this.quiet) {
                    Utils_21.Utils.console.warn("vmInRangeRound: number not in range:", min + "<=" + n + "<=" + max);
                }
                throw this.vmComposeError(Error(), n < -32768 || n > 32767 ? 6 : 5, err + " " + n); // 6=Overflow, 5=Improper argument
            }
            return n;
        };
        CpcVm.prototype.vmLineInRange = function (n, err) {
            var min = 1, max = 65535, num2 = this.vmRound(n, err);
            if (n !== num2) { // fractional number? => integer expected
                throw this.vmComposeError(Error(), 23, err + " " + n); // Line too long
            }
            if (n < min || n > max) {
                if (!this.quiet) {
                    Utils_21.Utils.console.warn("vmLineInRange: number not in range:", min + "<=" + n + "<=" + max);
                }
                throw this.vmComposeError(Error(), 5, err + " " + n); // 5=Improper argument
            }
            return n;
        };
        CpcVm.prototype.vmRound2Complement = function (n, err) {
            n = this.vmInRangeRound(n, -32768, 65535, err);
            if (n < 0) { // undo two's complement
                n += 65536;
            }
            return n;
        };
        CpcVm.prototype.vmGetLetterCode = function (s, err) {
            this.vmAssertString(s, err);
            s = s.toLowerCase();
            if (s.length !== 1 || s < "a" || s > "z") { // single letter?
                throw this.vmComposeError(Error(), 2, err + " " + s); // Syntax Error
            }
            return s.charCodeAt(0);
        };
        CpcVm.prototype.vmDetermineVarType = function (varType) {
            return (varType.length > 1) ? varType.charAt(1) : this.variables.getVarType(varType.charAt(0));
        };
        CpcVm.prototype.vmAssertNumberType = function (varType) {
            var type = this.vmDetermineVarType(varType);
            if (type !== "I" && type !== "R") { // not integer or real?
                throw this.vmComposeError(Error(), 13, "type " + type); // "Type mismatch"
            }
        };
        // format a value for assignment to a variable with type determined from varType
        CpcVm.prototype.vmAssign = function (varType, value) {
            var type = this.vmDetermineVarType(varType);
            if (type === "R") { // real
                this.vmAssertNumber(value, "=");
            }
            else if (type === "I") { // integer
                value = this.vmRound(value, "="); // round number to integer
            }
            else if (type === "$") { // string
                if (typeof value !== "string") {
                    if (!this.quiet) {
                        Utils_21.Utils.console.warn("vmAssign: expected string but got:", value);
                    }
                    throw this.vmComposeError(Error(), 13, "type " + type + "=" + value); // "Type mismatch"
                }
            }
            return value;
        };
        CpcVm.prototype.vmGoto = function (line, _msg) {
            this.line = line;
        };
        CpcVm.prototype.fnCheckSqTimer = function () {
            var timerExpired = false;
            if (this.timerPriority < 2) {
                for (var i = 0; i < CpcVm.sqTimerCount; i += 1) {
                    var timer = this.sqTimer[i];
                    // use sound.sq(i) and not this.sq(i) since that would reset onSq timer
                    if (timer.active && !timer.handlerRunning && (this.soundClass.sq(i) & 0x07)) { // eslint-disable-line no-bitwise
                        this.vmGosub(this.line, timer.line);
                        timer.handlerRunning = true;
                        timer.stackIndexReturn = this.gosubStack.length;
                        timer.repeat = false; // one shot
                        timerExpired = true;
                        break; // found expired timer
                    }
                }
            }
            return timerExpired;
        };
        CpcVm.prototype.vmCheckTimer = function (time) {
            var timerExpired = false;
            for (var i = CpcVm.timerCount - 1; i > this.timerPriority; i -= 1) { // check timers starting with highest priority first
                var timer = this.timerList[i];
                if (timer.active && !timer.handlerRunning && time > timer.nextTimeMs) { // timer expired?
                    this.vmGosub(this.line, timer.line);
                    timer.handlerRunning = true;
                    timer.stackIndexReturn = this.gosubStack.length;
                    timer.savedPriority = this.timerPriority;
                    this.timerPriority = i;
                    if (!timer.repeat) { // not repeating
                        timer.active = false;
                    }
                    else {
                        var delta = time - timer.nextTimeMs;
                        timer.nextTimeMs += timer.intervalMs * Math.ceil(delta / timer.intervalMs);
                    }
                    timerExpired = true;
                    break; // found expired timer
                }
                else if (i === 2) { // for priority 2 we check the sq timers which also have priority 2
                    if (this.fnCheckSqTimer()) {
                        break; // found expired timer
                    }
                }
            }
            return timerExpired;
        };
        CpcVm.prototype.vmCheckTimerHandlers = function () {
            for (var i = CpcVm.timerCount - 1; i >= 0; i -= 1) {
                var timer = this.timerList[i];
                if (timer.handlerRunning) {
                    if (timer.stackIndexReturn > this.gosubStack.length) {
                        timer.handlerRunning = false;
                        this.timerPriority = timer.savedPriority; // restore priority
                        timer.stackIndexReturn = 0;
                    }
                }
            }
        };
        CpcVm.prototype.vmCheckSqTimerHandlers = function () {
            var timerReloaded = false;
            for (var i = CpcVm.sqTimerCount - 1; i >= 0; i -= 1) {
                var timer = this.sqTimer[i];
                if (timer.handlerRunning) {
                    if (timer.stackIndexReturn > this.gosubStack.length) {
                        timer.handlerRunning = false;
                        this.timerPriority = timer.savedPriority; // restore priority
                        timer.stackIndexReturn = 0;
                        if (!timer.repeat) { // not reloaded
                            timer.active = false;
                        }
                        else {
                            timerReloaded = true;
                        }
                    }
                }
            }
            return timerReloaded;
        };
        CpcVm.prototype.vmCheckNextFrame = function (time) {
            if (time >= this.nextFrameTime) { // next time of frame fly
                var delta = time - this.nextFrameTime;
                if (delta > CpcVm.frameTimeMs) {
                    this.nextFrameTime += CpcVm.frameTimeMs * Math.ceil(delta / CpcVm.frameTimeMs);
                }
                else {
                    this.nextFrameTime += CpcVm.frameTimeMs;
                }
                this.canvas.updateSpeedInk();
                this.vmCheckTimer(time); // check BASIC timers and sound queue
                this.soundClass.scheduler(); // on a real CPC it is 100 Hz, we use 50 Hz
            }
        };
        CpcVm.prototype.vmGetTimeUntilFrame = function (time) {
            time = time || Date.now();
            return this.nextFrameTime - time;
        };
        CpcVm.prototype.vmLoopCondition = function () {
            var time = Date.now();
            if (time >= this.nextFrameTime) {
                this.vmCheckNextFrame(time);
                this.stopCount -= 1;
                if (this.stopCount <= 0) { // do not stop too often because of just timer reason because setTimeout is expensive
                    this.stopCount = this.initialStop;
                    this.vmStop("timer", 20);
                }
            }
            return this.stopEntry.reason === "";
        };
        CpcVm.prototype.vmDefineVarTypes = function (type, err, first, last) {
            var firstNum = this.vmGetLetterCode(first, err), lastNum = last ? this.vmGetLetterCode(last, err) : firstNum;
            for (var i = firstNum; i <= lastNum; i += 1) {
                var varChar = String.fromCharCode(i);
                this.variables.setVarType(varChar, type);
            }
        };
        CpcVm.prototype.vmStop = function (reason, priority, force, paras) {
            var defaultPriority = CpcVm.stopPriority[reason];
            if (defaultPriority === undefined) {
                Utils_21.Utils.console.warn("Programming error: vmStop: Unknown reason:", reason);
            }
            priority = priority || 0;
            if (priority !== 0) {
                priority = defaultPriority;
            }
            if (force || priority >= this.stopEntry.priority) {
                this.stopEntry.priority = priority;
                this.stopEntry.reason = reason;
                this.stopEntry.paras = paras || CpcVm.emptyParas;
            }
        };
        CpcVm.prototype.vmNotImplemented = function (name) {
            if (Utils_21.Utils.debug > 0) {
                Utils_21.Utils.console.debug("Not implemented:", name);
            }
        };
        CpcVm.prototype.vmUsingStringFormat = function (format, arg) {
            var padChar = " ", re1 = /^\\ *\\$/;
            var str;
            if (format === "&") {
                str = arg;
            }
            else if (format === "!") {
                str = arg.charAt(0);
            }
            else if (re1.test(format)) { // "\...\"
                var padLen = format.length - arg.length, pad = (padLen > 0) ? padChar.repeat(padLen) : "";
                str = arg + pad; // string left aligned
            }
            else { // no string format
                throw this.vmComposeError(Error(), 13, "USING format " + format); // "Type mismatch"
            }
            return str;
        };
        // not fully implemented
        CpcVm.prototype.vmUsingNumberFormat = function (format, arg) {
            var padChar = " ", re1 = /^\\ *\\$/;
            var str;
            if (format === "&" || format === "!" || re1.test(format)) { // string format for number?
                throw this.vmComposeError(Error(), 13, "USING format " + format); // "Type mismatch"
            }
            if (format.indexOf(".") < 0) { // no decimal point?
                str = arg.toFixed(0);
            }
            else { // assume ###.##
                var formatParts = format.split(".", 2), decimals = formatParts[1].length;
                // To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
                arg = Number(Math.round(Number(arg + "e" + decimals)) + "e-" + decimals);
                str = arg.toFixed(decimals);
            }
            if (format.indexOf(",") >= 0) { // contains comma => insert thousands separator
                str = Utils_21.Utils.numberWithCommas(str);
            }
            var padLen = format.length - str.length, pad = (padLen > 0) ? padChar.repeat(padLen) : "";
            str = pad + str;
            if (str.length > format.length) {
                str = "%" + str; // mark too long
            }
            return str;
        };
        CpcVm.prototype.vmUsingFormat = function (format, arg) {
            return typeof arg === "string" ? this.vmUsingStringFormat(format, arg) : this.vmUsingNumberFormat(format, arg);
        };
        CpcVm.prototype.vmGetStopObject = function () {
            return this.stopEntry;
        };
        CpcVm.prototype.vmGetInFileObject = function () {
            return this.inFile;
        };
        CpcVm.prototype.vmGetOutFileObject = function () {
            return this.outFile;
        };
        CpcVm.prototype.vmAdaptFilename = function (name, err) {
            this.vmAssertString(name, err);
            name = name.replace(/ /g, ""); // remove spaces
            if (name[0] === "!") {
                name = name.substring(1); // remove preceding "!"
            }
            var index = name.indexOf(":");
            if (index >= 0) {
                name = name.substring(index + 1); // remove user and drive letter including ":"
            }
            if (name.endsWith(".")) {
                name = name.substring(0, name.length - 1); // remove training "."
            }
            name = name.toLowerCase();
            if (!name) {
                throw this.vmComposeError(Error(), 32, "Bad filename: " + name);
            }
            return name;
        };
        CpcVm.prototype.vmGetSoundData = function () {
            return this.soundData;
        };
        CpcVm.prototype.vmSetSourceMap = function (sourceMap) {
            this.sourceMap = sourceMap;
        };
        CpcVm.prototype.vmTrace = function () {
            if (this.tronFlag1) {
                var stream = 0;
                this.print(stream, "[" + String(this.line) + "]");
            }
        };
        CpcVm.prototype.vmDrawMovePlot = function (type, gPen, gColMode) {
            if (gPen !== undefined) {
                gPen = this.vmInRangeRound(gPen, 0, 15, type);
                this.canvas.setGPen(gPen);
            }
            if (gColMode !== undefined) {
                gColMode = this.vmInRangeRound(gColMode, 0, 3, type);
                this.canvas.setGColMode(gColMode);
            }
        };
        CpcVm.prototype.vmAfterEveryGosub = function (type, interval, timer, line) {
            interval = this.vmInRangeRound(interval, 0, 32767, type); // more would be overflow
            timer = this.vmInRangeRound(timer || 0, 0, 3, type);
            line = this.vmLineInRange(line, type + " GOSUB");
            var timerEntry = this.timerList[timer];
            if (interval) {
                var intervalMs = interval * CpcVm.frameTimeMs; // convert to ms
                timerEntry.intervalMs = intervalMs;
                timerEntry.line = line;
                timerEntry.repeat = type === "EVERY";
                timerEntry.active = true;
                timerEntry.nextTimeMs = Date.now() + intervalMs;
            }
            else { // interval 0 => switch running timer off
                timerEntry.active = false;
            }
        };
        CpcVm.prototype.vmCopyFromScreen = function (source, dest) {
            for (var i = 0; i < 0x4000; i += 1) {
                var byte = this.canvas.getByte(source + i); // get byte from screen memory
                if (byte === null) { // byte not visible on screen?
                    byte = this.mem[source + i] || 0; // get it from our memory
                }
                this.mem[dest + i] = byte;
            }
        };
        CpcVm.prototype.vmCopyToScreen = function (source, dest) {
            for (var i = 0; i < 0x4000; i += 1) {
                var byte = this.mem[source + i] || 0; // get it from our memory
                this.canvas.setByte(dest + i, byte);
            }
        };
        CpcVm.prototype.vmSetScreenBase = function (byte) {
            byte = this.vmInRangeRound(byte, 0, 255, "screenBase");
            var page = byte >> 6, // eslint-disable-line no-bitwise
            oldPage = this.screenPage;
            if (page !== oldPage) {
                var addr = oldPage << 14; // eslint-disable-line no-bitwise
                this.vmCopyFromScreen(addr, addr);
                this.screenPage = page;
                addr = page << 14; // eslint-disable-line no-bitwise
                this.vmCopyToScreen(addr, addr);
            }
        };
        CpcVm.prototype.vmSetScreenOffset = function (offset) {
            this.canvas.setScreenOffset(offset);
        };
        // could be also set vmSetScreenViewBase? thisiScreenViewPage?  We always draw on visible canvas?
        CpcVm.prototype.vmSetTransparentMode = function (stream, transparent) {
            this.windowDataList[stream].transparent = Boolean(transparent);
        };
        // --
        CpcVm.prototype.abs = function (n) {
            this.vmAssertNumber(n, "ABS");
            return Math.abs(n);
        };
        CpcVm.prototype.addressOf = function (variable) {
            // not really implemented
            this.vmAssertString(variable, "@");
            var varIndex = this.variables.getVariableIndex(variable);
            if (varIndex < 0) {
                throw this.vmComposeError(Error(), 5, "@" + variable); // Improper argument
            }
            return varIndex;
        };
        CpcVm.prototype.afterGosub = function (interval, timer, line) {
            this.vmAfterEveryGosub("AFTER", interval, timer, line);
        };
        CpcVm.vmGetCpcCharCode = function (code) {
            if (code > 255) { // map some UTF-8 character codes
                if (CpcVm.utf8ToCpc[code]) {
                    code = CpcVm.utf8ToCpc[code];
                }
            }
            return code;
        };
        CpcVm.prototype.asc = function (s) {
            this.vmAssertString(s, "ASC");
            if (!s.length) {
                throw this.vmComposeError(Error(), 5, "ASC"); // Improper argument
            }
            return CpcVm.vmGetCpcCharCode(s.charCodeAt(0));
        };
        CpcVm.prototype.atn = function (n) {
            this.vmAssertNumber(n, "ATN");
            n = Math.atan(n);
            return this.degFlag ? Utils_21.Utils.toDegrees(n) : n;
        };
        CpcVm.prototype.auto = function (line, increment) {
            line = line === undefined ? 10 : this.vmLineInRange(line, "AUTO");
            increment = increment === undefined ? 10 : this.vmLineInRange(increment, "AUTO");
            this.vmNotImplemented("AUTO " + line + "," + increment);
        };
        CpcVm.prototype.bin$ = function (n, pad) {
            n = this.vmRound2Complement(n, "BIN$");
            pad = this.vmInRangeRound(pad || 0, 0, 16, "BIN$");
            return n.toString(2).padStart(pad, "0");
        };
        CpcVm.prototype.border = function (ink1, ink2) {
            ink1 = this.vmInRangeRound(ink1, 0, 31, "BORDER");
            if (ink2 === undefined) {
                ink2 = ink1;
            }
            else {
                ink2 = this.vmInRangeRound(ink2, 0, 31, "BORDER");
            }
            this.canvas.setBorder(ink1, ink2);
        };
        // break
        CpcVm.prototype.vmMcSetMode = function (mode) {
            mode = this.vmInRangeRound(mode, 0, 3, "MCSetMode");
            var canvasMode = this.canvas.getMode();
            if (mode !== canvasMode) {
                var addr = this.screenPage << 14; // eslint-disable-line no-bitwise
                // keep screen bytes, just interpret in other mode
                this.vmCopyFromScreen(addr, addr); // read bytes from screen memory into memory
                this.canvas.changeMode(mode); // change mode and interpretation of bytes
                this.vmCopyToScreen(addr, addr); // write bytes back to screen memory
                this.canvas.changeMode(canvasMode); // keep mode
                // TODO: new content should still be written in old mode but interpreted in new mode
            }
        };
        CpcVm.prototype.vmTxtInverse = function (stream) {
            var win = this.windowDataList[stream], tmpPen = win.pen;
            this.pen(stream, win.paper);
            this.paper(stream, tmpPen);
        };
        CpcVm.prototype.vmPutKeyInBuffer = function (key) {
            this.keyboard.putKeyInBuffer(key);
            var keyDownHandler = this.keyboard.getKeyDownHandler();
            if (keyDownHandler) {
                keyDownHandler();
            }
        };
        // special function to set all inks temporarily; experimental and expensive
        CpcVm.prototype.updateColorsImmediately = function (addr) {
            var inkList = [];
            for (var i = 0; i < 17; i += 1) {
                /* eslint-disable no-bitwise */
                var byte = this.peek((addr + i) & 0xffff), color = byte & 0x1f;
                /* eslint-enable no-bitwise */
                inkList[i] = color;
            }
            this.canvas.updateColorsAndCanvasImmediately(inkList);
        };
        CpcVm.prototype.call = function (addr) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            // varargs (adr + parameters)
            addr = this.vmRound2Complement(addr, "CALL");
            if (args.length > 32) { // more that 32 arguments?
                throw this.vmComposeError(Error(), 2, "CALL "); // Syntax Error
            }
            for (var i = 0; i < args.length; i += 1) {
                if (typeof args[i] === "number") {
                    args[i] = this.vmRound2Complement(args[i], "CALL"); // even if the args itself are not used here
                }
            }
            switch (addr) {
                case 0xbb00: // KM Initialize (ROM &19E0)
                    this.keyboard.resetCpcKeysExpansions();
                    this.call(0xbb03); // KM Reset
                    break;
                case 0xbb03: // KM Reset (ROM &1AE1)
                    this.clearInput();
                    this.keyboard.resetExpansionTokens();
                    // TODO: reset also speed key
                    break;
                case 0xbb0c: // KM Char Return (ROM &1A77), depending on number of args
                    this.vmPutKeyInBuffer(String.fromCharCode(args.length));
                    break;
                case 0xbb06: // KM Wait Char (ROM &1A3C); since we do not return a character, we do the same as call &bb18
                case 0xbb18: // KM Wait Key (ROM &1B56)
                    if (this.inkey$() === "") { // no key?
                        this.vmStop("waitKey", 30); // wait for key
                    }
                    break;
                case 0xbb4e: // TXT Initialize (ROM &1078)
                    this.canvas.resetCustomChars();
                    this.vmResetWindowData(true); // reset windows, including pen and paper
                    // and TXT Reset...
                    this.vmResetControlBuffer();
                    break;
                case 0xbb51: // TXT Reset (ROM &11088)
                    this.vmResetControlBuffer();
                    break;
                case 0xbb5a: // TXT Output (ROM &1400), depending on number of args
                    this.print(0, String.fromCharCode(args.length));
                    break;
                case 0xbb5d: // TXT WR Char (ROM &1334), depending on number of args
                    this.vmDrawUndrawCursor(0);
                    this.vmPrintChars(0, String.fromCharCode(args.length));
                    this.vmDrawUndrawCursor(0);
                    break;
                case 0xbb6c: // TXT Clear Window (ROM &1540)
                    this.cls(0);
                    break;
                case 0xbb7b: // TXT Cursor Enable (ROM &1289); user switch (cursor enabled)
                    this.cursor(0, undefined, 1);
                    break;
                case 0xbb7e: // TXT Cursor Disable (ROM &129A); user switch
                    this.cursor(0, undefined, 0);
                    break;
                case 0xbb81: // TXT Cursor On (ROM &1279); system switch (cursor on)
                    this.cursor(0, 1);
                    break;
                case 0xbb84: // TXT Cursor Off (ROM &1281); system switch
                    this.cursor(0, 0);
                    break;
                case 0xbb8a: // TXT Place Cursor (ROM &1268)
                case 0xbb8d: // TXT Remove Cursor (ROM &1268); same as place cursor
                    this.vmPlaceRemoveCursor(0); // 0=stream
                    break;
                case 0xbb90: // TXT Set Pen (ROM &12A9), depending on number of args
                    this.pen(0, args.length % 16);
                    break;
                case 0xbb96: // TXT Set Paper (ROM &12AE); depending on number of args
                    this.paper(0, args.length % 16);
                    break;
                case 0xbb9c: // TXT Inverse (ROM &12C9), same as print chr$(24);
                    this.vmTxtInverse(0);
                    break;
                case 0xbb9f: // TXT Set Back (ROM &137A), depending on number of args
                    this.vmSetTransparentMode(0, args.length);
                    break;
                case 0xbbdb: // GRA Clear Window (ROM &17C5)
                    this.canvas.clearGraphicsWindow();
                    break;
                case 0xbbde: // GRA Set Pen (ROM &17F6), depending on number of args
                    // we can only set graphics pen depending on number of args (pen 0=no arg, pen 1=one arg)
                    this.graphicsPen(args.length % 16);
                    break;
                case 0xbbe4: // GRA Set Paper (ROM &17FD), depending on number of args
                    this.graphicsPaper(args.length % 16);
                    break;
                case 0xbbfc: // GRA WR Char (ROM &1945), depending on number of args
                    this.canvas.printGChar(args.length);
                    break;
                case 0xbbff: // SCR Initialize (ROM &0AA0)
                    this.vmSetScreenBase(0xc0);
                    this.modeValue = 1;
                    this.canvas.setMode(this.modeValue); // does not clear canvas
                    this.canvas.clearFullWindow(); // (SCR Mode Clear)
                    this.textCanvas.clearFullWindow();
                    // and SCR Reset:
                    this.vmResetInks();
                    break;
                case 0xbc02: // SCR Reset (ROM &0AB1)
                    this.vmResetInks();
                    break;
                case 0xbc06: // SCR SET BASE (&BC08, ROM &0B45); We use &BC06 to load reg A from reg E (not for CPC 664!)
                case 0xbc07: // Works on all CPC 464/664/6128
                    this.vmSetScreenBase(args[0]);
                    break;
                case 0xbc0e: // SCR SET MODE (ROM &0ACE), depending on number of args
                    this.mode(args.length % 4); // 3 is valid also on CPC
                    break;
                case 0xbca7: // SOUND Reset (ROM &1E68)
                    this.soundClass.reset();
                    break;
                case 0xbcb6: // SOUND Hold (ROM &1ECB)
                    this.vmNotImplemented("CALL &BCBC");
                    break;
                case 0xbcb9: // SOUND Continue (ROM &1EE6)
                    this.vmNotImplemented("CALL &BCB9");
                    break;
                case 0xbd19: // MC Wait Flyback (ROM &07BA)
                    this.frame();
                    break;
                case 0xbd1c: // MC Set Mode (ROM &0776) just set mode, depending on number of args
                    this.vmMcSetMode(args.length % 4);
                    break;
                /*
                // would be a temporary functionality, will be undo with next interrupt
                case 0xbd22: // MC Clear Inks (ROM &0786), ink table address in DE (last parameter)
                    break;
                */
                case 0xbd25: // MC Set Inks (ROM &0799), ink table address in DE (last parameter) TTT experimantal
                    this.updateColorsImmediately(args[0]);
                    break;
                case 0xbd3d: // KM Flush (ROM ?; CPC 664/6128)
                    this.clearInput();
                    break;
                case 0xbd49: // GRA Set First (ROM ?; CPC 664/6128), depending on number of args
                    this.canvas.setMaskFirst(args.length % 2);
                    break;
                case 0xbd4c: // GRA Set Mask (ROM ?; CPC 664/6128), depending on number of args
                    this.canvas.setMask(args.length);
                    break;
                case 0xbd52: // GRA Fill (ROM ?; CPC 664/6128), depending on number of args
                    this.fill(args.length % 16);
                    break;
                case 0xbd5b: // KL RAM SELECT (CPC 6128 only)
                    // we can only set RAM bank depending on number of args
                    this.vmSetRamSelect(args.length);
                    break;
                default:
                    if (Utils_21.Utils.debug > 0) {
                        Utils_21.Utils.console.debug("Ignored: CALL", addr, args);
                    }
                    break;
            }
        };
        CpcVm.prototype.cat = function () {
            var stream = 0, fileParas = {
                command: "cat",
                stream: stream,
                fileMask: "",
                line: this.line // unused
            };
            this.vmStop("fileCat", 45, false, fileParas);
        };
        CpcVm.prototype.chain = function (name, line, first, last) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "CHAIN");
            this.closein();
            inFile.line = line === undefined ? 0 : this.vmInRangeRound(line, 0, 65535, "CHAIN"); // here we do rounding of line number
            inFile.first = first === undefined ? 0 : this.vmAssertInRange(first, 1, 65535, "CHAIN"); // first and last are not needed
            inFile.last = last === undefined ? 0 : this.vmAssertInRange(last, 1, 65535, "CHAIN");
            inFile.open = true;
            inFile.command = "chain";
            inFile.name = name;
            inFile.fnFileCallback = this.fnCloseinHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.chainMerge = function (name, line, first, last) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "CHAIN MERGE");
            this.closein();
            inFile.line = line === undefined ? 0 : this.vmInRangeRound(line, 0, 65535, "CHAIN MERGE"); // here we do rounding of line number;
            inFile.first = first === undefined ? 0 : this.vmAssertInRange(first, 1, 65535, "CHAIN MERGE");
            inFile.last = last === undefined ? 0 : this.vmAssertInRange(last, 1, 65535, "CHAIN MERGE");
            inFile.open = true;
            inFile.command = "chainMerge";
            inFile.name = name;
            inFile.fnFileCallback = this.fnCloseinHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.chr$ = function (n) {
            n = this.vmInRangeRound(n, 0, 255, "CHR$");
            return String.fromCharCode(n);
        };
        CpcVm.prototype.cint = function (n) {
            return this.vmInRangeRound(n, -32768, 32767, "CINT");
        };
        CpcVm.prototype.clear = function () {
            this.vmResetTimers();
            this.ei();
            this.vmSetStartLine(0);
            this.errorCode = 0;
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
            this.errorGotoLine = 0;
            this.errorResumeLine = 0;
            this.gosubStack.length = 0;
            this.variables.initAllVariables();
            this.defreal("a", "z");
            this.restore(); // restore data line index
            this.rad();
            this.soundClass.resetQueue();
            this.soundData.length = 0;
            this.vmResetInFileHandling();
            this.vmResetOutFileHandling();
        };
        CpcVm.prototype.clearInput = function () {
            this.keyboard.clearInput();
        };
        CpcVm.prototype.clg = function (gPaper) {
            if (gPaper !== undefined) {
                gPaper = this.vmInRangeRound(gPaper, 0, 15, "CLG");
                this.canvas.setGPaper(gPaper);
            }
            this.canvas.clearGraphicsWindow();
        };
        CpcVm.prototype.vmCloseinCallback = function () {
            var inFile = this.inFile;
            CpcVm.vmResetFileHandling(inFile);
        };
        CpcVm.prototype.closein = function () {
            if (this.inFile.open) {
                this.vmCloseinCallback(); // close directly
            }
        };
        CpcVm.prototype.vmCloseoutCallback = function () {
            var outFile = this.outFile;
            CpcVm.vmResetFileHandling(outFile);
        };
        CpcVm.prototype.closeout = function () {
            var outFile = this.outFile;
            if (outFile.open) {
                if (outFile.command !== "openout") {
                    if (!this.quiet) {
                        Utils_21.Utils.console.warn("closeout: command=", outFile.command); // should not occur
                    }
                }
                if (!outFile.fileData.length) { // openout without data?
                    this.vmCloseoutCallback(); // close directly
                }
                else { // data to save
                    outFile.command = "closeout";
                    outFile.fnFileCallback = this.fnCloseoutHandler;
                    this.vmStop("fileSave", 90); // must stop directly after closeout
                }
            }
        };
        // also called for chr$(12), call &bb6c
        CpcVm.prototype.cls = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "CLS");
            var win = this.windowDataList[stream];
            this.vmDrawUndrawCursor(stream); // why, if we clear anyway?
            this.canvas.clearTextWindow(win.left, win.right, win.top, win.bottom, win.paper); // cls window
            this.textCanvas.clearTextWindow(win.left, win.right, win.top, win.bottom, win.paper);
            win.pos = 0;
            win.vpos = 0;
            if (!stream) {
                this.outBuffer = ""; // clear also console, if stream===0
            }
        };
        CpcVm.prototype.commaTab = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 9, "commaTab");
            this.vmMoveCursor2AllowedPos(stream);
            var zone = this.zoneValue, win = this.windowDataList[stream];
            var count = zone - (win.pos % zone);
            if (win.pos) { // <>0: not begin of line
                if (win.pos + count + zone > (win.right + 1 - win.left)) {
                    win.pos += count + zone;
                    this.vmMoveCursor2AllowedPos(stream);
                    count = 0;
                }
            }
            return " ".repeat(count);
        };
        CpcVm.prototype.cont = function () {
            if (!this.startLine) {
                throw this.vmComposeError(Error(), 17, "CONT"); // cannot continue
            }
            this.vmGoto(this.startLine, "CONT");
            this.startLine = 0;
        };
        CpcVm.prototype.copychr$ = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "COPYCHR$");
            this.vmMoveCursor2AllowedPos(stream);
            this.vmDrawUndrawCursor(stream); // undraw
            var win = this.windowDataList[stream], charCode = this.canvas.readChar(win.pos + win.left, win.vpos + win.top, win.pen, win.paper), 
            // TODO charCode2 = this.textCanvas.readChar(win.pos + win.left, win.vpos + win.top, win.pen, win.paper),
            char = (charCode >= 0) ? String.fromCharCode(charCode) : "";
            this.vmDrawUndrawCursor(stream); // draw
            return char;
        };
        CpcVm.prototype.cos = function (n) {
            this.vmAssertNumber(n, "COS");
            return Math.cos((this.degFlag) ? Utils_21.Utils.toRadians(n) : n);
        };
        CpcVm.prototype.creal = function (n) {
            this.vmAssertNumber(n, "CREAL");
            return n;
        };
        CpcVm.prototype.vmPlaceRemoveCursor = function (stream) {
            var win = this.windowDataList[stream];
            this.vmMoveCursor2AllowedPos(stream);
            this.canvas.drawCursor(win.pos + win.left, win.vpos + win.top, win.pen, win.paper);
        };
        CpcVm.prototype.vmDrawUndrawCursor = function (stream) {
            var win = this.windowDataList[stream];
            if (win.cursorOn && win.cursorEnabled) {
                this.vmPlaceRemoveCursor(stream);
            }
        };
        CpcVm.prototype.cursor = function (stream, cursorOn, cursorEnabled) {
            stream = this.vmInRangeRound(stream, 0, 7, "CURSOR");
            var win = this.windowDataList[stream];
            if (cursorOn !== undefined) { // system
                cursorOn = this.vmInRangeRound(cursorOn, 0, 1, "CURSOR");
                this.vmDrawUndrawCursor(stream); // undraw
                win.cursorOn = Boolean(cursorOn);
                this.vmDrawUndrawCursor(stream); // draw
            }
            if (cursorEnabled !== undefined) { // user
                cursorEnabled = this.vmInRangeRound(cursorEnabled, 0, 1, "CURSOR");
                this.vmDrawUndrawCursor(stream); // undraw
                win.cursorEnabled = Boolean(cursorEnabled);
                this.vmDrawUndrawCursor(stream); // draw
            }
        };
        CpcVm.prototype.data = function (line) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.vmLineInRange(line, "DATA");
            if (!this.dataLineIndex[line]) {
                this.dataLineIndex[line] = this.dataList.length; // set current index for the line
            }
            // append data
            for (var i = 0; i < args.length; i += 1) {
                this.dataList.push(args[i]);
            }
        };
        CpcVm.prototype.dec$ = function (n, frmt) {
            this.vmAssertNumber(n, "DEC$");
            this.vmAssertString(frmt, "DEC$");
            return this.vmUsingNumberFormat(frmt, n);
        };
        // def fn
        CpcVm.prototype.defint = function (first, last) {
            this.vmDefineVarTypes("I", "DEFINT", first, last);
        };
        CpcVm.prototype.defreal = function (first, last) {
            this.vmDefineVarTypes("R", "DEFREAL", first, last);
        };
        CpcVm.prototype.defstr = function (first, last) {
            this.vmDefineVarTypes("$", "DEFSTR", first, last);
        };
        CpcVm.prototype.deg = function () {
            this.degFlag = true;
        };
        CpcVm.prototype["delete"] = function (first, last) {
            if (first === undefined) {
                first = 1;
                last = last === undefined ? 65535 : this.vmInRangeRound(last, 1, 65535, "DELETE");
            }
            else {
                first = this.vmInRangeRound(first, 1, 65535, "DELETE");
                if (last === undefined) { // just one parameter?
                    last = first;
                }
                else { // range
                    last = this.vmInRangeRound(last, 1, 65535, "DELETE");
                }
            }
            this.vmStop("deleteLines", 85, false, {
                command: "DELETE",
                stream: 0,
                first: first,
                last: last,
                line: this.line // unused
            });
        };
        CpcVm.prototype.derr = function () {
            return 0; // "[Not implemented yet: derr]"
        };
        CpcVm.prototype.di = function () {
            this.timerPriority = 3; // increase priority
        };
        CpcVm.prototype.dim = function (varName) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var dimensions = [];
            this.vmAssertString(varName, "DIM");
            for (var i = 0; i < args.length; i += 1) {
                var size = this.vmInRangeRound(args[i], 0, 32767, "DIM") + 1; // for basic we have sizes +1
                dimensions.push(size);
            }
            this.variables.dimVariable(varName, dimensions);
        };
        CpcVm.prototype.draw = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "DRAW");
            y = this.vmInRangeRound(y, -32768, 32767, "DRAW");
            this.vmDrawMovePlot("DRAW", gPen, gColMode);
            this.canvas.draw(x, y);
        };
        CpcVm.prototype.drawr = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "DRAWR") + this.canvas.getXpos();
            y = this.vmInRangeRound(y, -32768, 32767, "DRAWR") + this.canvas.getYpos();
            this.vmDrawMovePlot("DRAWR", gPen, gColMode);
            this.canvas.draw(x, y);
        };
        CpcVm.prototype.edit = function (line) {
            var lineParas = {
                command: "edit",
                stream: 0,
                first: line,
                last: 0,
                line: this.line // unused
            };
            this.vmStop("editLine", 85, false, lineParas);
        };
        CpcVm.prototype.ei = function () {
            this.timerPriority = -1; // decrease priority
        };
        CpcVm.prototype.end = function (label) {
            this.stop(label);
        };
        CpcVm.prototype.ent = function (toneEnv) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            toneEnv = this.vmInRangeRound(toneEnv, -15, 15, "ENT");
            var envData = [];
            var arg, repeat = false;
            if (toneEnv < 0) {
                toneEnv = -toneEnv;
                repeat = true;
            }
            if (toneEnv) { // not 0
                for (var i = 0; i < args.length; i += 3) { // starting with 1: 3 parameters per section
                    if (args[i] !== undefined) {
                        arg = {
                            steps: this.vmInRangeRound(args[i], 0, 239, "ENT"),
                            diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENT"),
                            time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT"),
                            repeat: repeat
                        }; // as ToneEnvData1
                    }
                    else { // special handling
                        arg = {
                            period: this.vmInRangeRound(args[i + 1], 0, 4095, "ENT"),
                            time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT") // time: 0..255 (0=256)
                        }; // as ToneEnvData2
                    }
                    envData.push(arg);
                }
                this.soundClass.setToneEnv(toneEnv, envData);
            }
            else { // 0
                if (!this.quiet) {
                    Utils_21.Utils.console.warn("ENT: toneEnv", toneEnv);
                }
                throw this.vmComposeError(Error(), 5, "ENT " + toneEnv); // Improper argument
            }
        };
        CpcVm.prototype.env = function (volEnv) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            volEnv = this.vmInRangeRound(volEnv, 1, 15, "ENV");
            var envData = [];
            var arg;
            for (var i = 0; i < args.length; i += 3) { // starting with 1: 3 parameters per section
                if (args[i] !== undefined) {
                    arg = {
                        steps: this.vmInRangeRound(args[i], 0, 127, "ENV"),
                        /* eslint-disable no-bitwise */
                        diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENV") & 0x0f,
                        /* eslint-enable no-bitwise */
                        time: this.vmInRangeRound(args[i + 2], 0, 255, "ENV") // time per step: 0..255 (0=256)
                    }; // as VolEnvData1
                    if (!arg.time) { // (0=256)
                        arg.time = 256;
                    }
                }
                else { // special handling for register parameters
                    arg = {
                        register: this.vmInRangeRound(args[i + 1], 0, 15, "ENV"),
                        period: this.vmInRangeRound(args[i + 2], -32768, 65535, "ENV")
                    }; // as VolEnvData2
                }
                envData.push(arg);
            }
            this.soundClass.setVolEnv(volEnv, envData);
        };
        CpcVm.prototype.eof = function () {
            var inFile = this.inFile;
            var eof = -1;
            if (inFile.open && inFile.fileData.length) {
                eof = 0;
            }
            return eof;
        };
        // find array variable matching <name>(A+)(typeChar?)
        CpcVm.prototype.vmFindArrayVariable = function (name) {
            var typeChar = name.charAt(name.length - 1); // last character
            if (typeChar === "I" || typeChar === "R" || typeChar === "$") { // explicit type specified?
                name = name.slice(0, -1); // remove type char
            }
            else {
                typeChar = "";
            }
            name += "A";
            if (this.variables.variableExist(name + typeChar)) { // one dim array variable?
                return name + typeChar;
            }
            // find multi-dim array variable
            var fnArrayVarFilter = function (variable) {
                return (variable.indexOf(name) === 0 && (!typeChar || variable.charAt(variable.length - 1) === typeChar)) ? variable : null; // find array varA(typeChar?)
            };
            var names = this.variables.getAllVariableNames();
            names = names.filter(fnArrayVarFilter); // find array varA... with any number of indices
            return names[0]; // we should find exactly one
        };
        CpcVm.prototype.erase = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (!args.length) {
                throw this.vmComposeError(Error(), 2, "ERASE"); // Syntax Error
            }
            for (var i = 0; i < args.length; i += 1) {
                this.vmAssertString(args[i], "ERASE");
                var name_10 = this.vmFindArrayVariable(args[i]);
                if (name_10) {
                    this.variables.initVariable(name_10);
                }
                else {
                    if (!this.quiet) {
                        Utils_21.Utils.console.warn("erase: Array variable not found:", args[i]);
                    }
                    throw this.vmComposeError(Error(), 5, "ERASE " + args[i]); // Improper argument
                }
            }
        };
        CpcVm.prototype.erl = function () {
            var errorLine = parseInt(String(this.errorLine), 10); // in cpcBasic we have an error label here, so return number only
            return errorLine || 0;
        };
        CpcVm.prototype.err = function () {
            return this.errorCode;
        };
        CpcVm.prototype.vmComposeError = function (error, err, errInfo) {
            var errors = CpcVm.errors, errorString = errors[err] || errors[errors.length - 1]; // maybe Unknown error
            this.errorCode = err;
            this.errorLine = this.line;
            var errorWithInfo = errorString + " in " + this.errorLine + (errInfo ? (": " + errInfo) : "");
            var hidden = false; // hide errors wich are catched
            if (this.errorGotoLine && !this.errorResumeLine) {
                this.errorResumeLine = this.errorLine;
                this.vmGoto(this.errorGotoLine, "onError");
                this.vmStop("onError", 50);
                hidden = true;
            }
            else {
                this.vmStop("error", 50);
            }
            if (!this.quiet) {
                Utils_21.Utils.console.log("BASIC error(" + err + "):", errorWithInfo + (hidden ? " (hidden: " + hidden + ")" : ""));
            }
            var traceLine = this.line, sourceMapEntry = this.sourceMap[traceLine], pos = sourceMapEntry && sourceMapEntry[0], len = sourceMapEntry && sourceMapEntry[1];
            return Utils_21.Utils.composeError("CpcVm", error, errorString, errInfo, pos, len, this.line, hidden);
        };
        CpcVm.prototype.error = function (err, errInfo) {
            err = this.vmInRangeRound(err, 0, 255, "ERROR"); // could trigger another error
            throw this.vmComposeError(Error(), err, errInfo);
        };
        CpcVm.prototype.everyGosub = function (interval, timer, line) {
            this.vmAfterEveryGosub("EVERY", interval, timer, line);
        };
        CpcVm.prototype.exp = function (n) {
            this.vmAssertNumber(n, "EXP");
            return Math.exp(n);
        };
        CpcVm.prototype.fill = function (gPen) {
            gPen = this.vmInRangeRound(gPen, 0, 15, "FILL");
            this.canvas.fill(gPen);
        };
        CpcVm.prototype.fix = function (n) {
            this.vmAssertNumber(n, "FIX");
            return Math.trunc(n); // (ES6: Math.trunc)
        };
        CpcVm.prototype.frame = function () {
            this.vmStop("waitFrame", 40);
        };
        CpcVm.prototype.fre = function (arg) {
            if (typeof arg !== "number" && typeof arg !== "string") {
                throw this.vmComposeError(Error(), 2, "FRE"); // Syntax Error
            }
            return this.himemValue; // example, e.g. 42245;
        };
        CpcVm.prototype.vmGosub = function (retLabel, n) {
            this.vmGoto(n, "gosub (ret=" + retLabel + ")");
            this.gosubStack.push(retLabel);
        };
        CpcVm.prototype.gosub = function (retLabel, n) {
            this.vmLineInRange(n, "GOSUB");
            if (this.gosubStack.length >= this.maxGosubStackLength) { // limit stack size (not necessary in JS, but...)
                throw this.vmComposeError(Error(), 7, "GOSUB " + n); // Memory full
            }
            this.vmGosub(retLabel, n);
        };
        CpcVm.prototype["goto"] = function (line) {
            this.vmLineInRange(line, "GOTO");
            this.vmGoto(line, "goto");
        };
        CpcVm.prototype.graphicsPaper = function (gPaper) {
            gPaper = this.vmInRangeRound(gPaper, 0, 15, "GRAPHICS PAPER");
            this.canvas.setGPaper(gPaper);
        };
        CpcVm.prototype.graphicsPen = function (gPen, transparentMode) {
            if (gPen === undefined && transparentMode === undefined) {
                throw this.vmComposeError(Error(), 22, "GRAPHICS PEN"); // Operand missing
            }
            if (gPen !== undefined) {
                gPen = this.vmInRangeRound(gPen, 0, 15, "GRAPHICS PEN");
                this.canvas.setGPen(gPen);
            }
            if (transparentMode !== undefined) {
                transparentMode = this.vmInRangeRound(transparentMode, 0, 1, "GRAPHICS PEN");
                this.canvas.setGTransparentMode(Boolean(transparentMode));
            }
        };
        CpcVm.prototype.hex$ = function (n, pad) {
            n = this.vmRound2Complement(n, "HEX$");
            pad = this.vmInRangeRound(pad || 0, 0, 16, "HEX$");
            return n.toString(16).toUpperCase().padStart(pad, "0");
        };
        CpcVm.prototype.himem = function () {
            return this.himemValue;
        };
        CpcVm.prototype.ink = function (pen, ink1, ink2) {
            pen = this.vmInRangeRound(pen, 0, 15, "INK");
            ink1 = this.vmInRangeRound(ink1, 0, 31, "INK");
            if (ink2 === undefined) {
                ink2 = ink1;
            }
            else {
                ink2 = this.vmInRangeRound(ink2, 0, 31, "INK");
            }
            this.canvas.setInk(pen, ink1, ink2);
        };
        CpcVm.prototype.inkey = function (key) {
            key = this.vmInRangeRound(key, 0, 79, "INKEY");
            return this.keyboard.getKeyState(key);
        };
        CpcVm.prototype.inkey$ = function () {
            var key = this.keyboard.getKeyFromBuffer();
            // do some slowdown, if checked too early again without key press
            if (key !== "") { // some key pressed?
                this.inkeyTimeMs = 0;
            }
            else { // no key
                var now = Date.now();
                if (this.inkeyTimeMs && now < this.inkeyTimeMs) { // last inkey without key was in range of frame fly?
                    this.frame(); // then insert a frame fly
                }
                this.inkeyTimeMs = now + CpcVm.frameTimeMs; // next time of frame fly
            }
            return key;
        };
        CpcVm.prototype.inp = function (port) {
            port = this.vmRound2Complement(port, "INP"); // two's complement of 16 bit address
            // eslint-disable-next-line no-bitwise
            var byte = (port & 0xff);
            // eslint-disable-next-line no-bitwise
            byte |= 0xff; // we return always the same 0xff
            return byte;
        };
        CpcVm.prototype.vmSetInputValues = function (inputValues) {
            this.inputValues = inputValues;
        };
        CpcVm.prototype.vmGetNextInput = function () {
            var inputValues = this.inputValues, value = inputValues.shift();
            return value;
        };
        CpcVm.prototype.vmInputCallback = function () {
            var inputParas = this.vmGetStopObject().paras, stream = inputParas.stream, input = inputParas.input, inputValues = input.split(","), convertedInputValues = [], types = inputParas.types;
            var inputOk = true;
            if (Utils_21.Utils.debug > 0) {
                Utils_21.Utils.console.debug("vmInputCallback:", input);
            }
            if (types && (inputValues.length === types.length)) {
                for (var i = 0; i < types.length; i += 1) {
                    var varType = types[i], type = this.vmDetermineVarType(varType), value = inputValues[i];
                    if (type !== "$") { // not a string?
                        var valueNumber = CpcVm.vmVal(value); // convert to number (also binary, hex), empty string gets 0
                        if (isNaN(valueNumber)) {
                            inputOk = false;
                        }
                        convertedInputValues.push(valueNumber);
                    }
                    else {
                        convertedInputValues.push(value);
                    }
                }
            }
            else {
                inputOk = false;
            }
            this.cursor(stream, 0);
            if (!inputOk) {
                this.print(stream, "?Redo from start\r\n");
                inputParas.input = "";
                this.print(stream, inputParas.message);
                this.cursor(stream, 1);
            }
            else {
                this.vmSetInputValues(convertedInputValues);
            }
            return inputOk;
        };
        CpcVm.prototype.fnFileInputGetString = function (fileData) {
            var line = fileData[0].replace(/^\s+/, ""), // remove preceding whitespace
            value;
            if (line.charAt(0) === '"') { // quoted string?
                var index = line.indexOf('"', 1); // closing quotes in this line?
                if (index >= 0) {
                    value = line.substring(1, index + 1 - 1); // take string without quotes
                    line = line.substring(index + 1);
                    line = line.replace(/^\s*,/, ""); // multiple args => remove next comma
                }
                else if (fileData.length > 1) { // no closing quotes in this line => try to combine with next line
                    fileData.shift(); // remove line
                    line += "\n" + fileData[0]; // combine lines
                }
                else {
                    throw this.vmComposeError(Error(), 13, "INPUT #9: no closing quotes: " + line);
                }
            }
            else { // unquoted string
                var index = line.indexOf(","); // multiple args?
                if (index >= 0) {
                    value = line.substring(0, index); // take arg
                    line = line.substring(index + 1);
                }
                else {
                    value = line; // take line
                    line = "";
                }
            }
            fileData[0] = line;
            return value;
        };
        CpcVm.prototype.fnFileInputGetNumber = function (fileData) {
            var line = fileData[0].replace(/^\s+/, ""), // remove preceding whitespace
            index = line.indexOf(","), // multiple args?
            value;
            if (index >= 0) {
                value = line.substring(0, index); // take arg
                line = line.substring(index + 1);
            }
            else {
                index = line.indexOf(" "); // space?
                if (index >= 0) {
                    value = line.substring(0, index); // take item until space
                    line = line.substring(index);
                    line = line.replace(/^\s*/, ""); // remove spaces after number
                }
                else {
                    value = line; // take line
                    line = "";
                }
            }
            var nValue = CpcVm.vmVal(value); // convert to number (also binary, hex)
            if (isNaN(nValue)) { // eslint-disable-line max-depth
                throw this.vmComposeError(Error(), 13, "INPUT #9 " + nValue + ": " + value); // Type mismatch
            }
            fileData[0] = line;
            return nValue;
        };
        CpcVm.prototype.vmInputNextFileItem = function (type) {
            var fileData = this.inFile.fileData;
            var value;
            while (fileData.length && value === undefined) {
                if (type === "$") {
                    value = this.fnFileInputGetString(fileData);
                }
                else { // number type
                    value = this.fnFileInputGetNumber(fileData);
                }
                if (!fileData[0].length) {
                    fileData.shift(); // remove empty line
                }
            }
            return value;
        };
        CpcVm.prototype.vmInputFromFile = function (types) {
            var inputValues = [];
            for (var i = 0; i < types.length; i += 1) {
                var varType = types[i], type = this.vmDetermineVarType(varType), value = this.vmInputNextFileItem(type);
                inputValues[i] = this.vmAssign(varType, value);
            }
            this.vmSetInputValues(inputValues);
        };
        CpcVm.prototype.input = function (stream, noCRLF, msg) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            stream = this.vmInRangeRound(stream, 0, 9, "INPUT");
            if (stream < 8) {
                this.print(stream, msg);
                this.vmStop("waitInput", 45, false, {
                    command: "input",
                    stream: stream,
                    message: msg,
                    noCRLF: noCRLF,
                    fnInputCallback: this.vmInputCallback.bind(this),
                    types: args,
                    input: "",
                    line: this.line // to repeat in case of break
                });
                this.cursor(stream, 1);
            }
            else if (stream === 8) {
                this.vmSetInputValues(["I am the printer!"]);
            }
            else if (stream === 9) {
                if (!this.inFile.open) {
                    throw this.vmComposeError(Error(), 31, "INPUT #" + stream); // File not open
                }
                else if (this.eof()) {
                    throw this.vmComposeError(Error(), 24, "INPUT #" + stream); // EOF met
                }
                this.vmInputFromFile(args); // remaining arguments
            }
        };
        CpcVm.prototype.instr = function (p1, p2, p3) {
            var startPos = typeof p1 === "number" ? this.vmInRangeRound(p1, 1, 255, "INSTR") - 1 : 0, // p1=startpos
            str = typeof p1 === "number" ? p2 : p1, search = typeof p1 === "number" ? p3 : p2;
            this.vmAssertString(str, "INSTR");
            this.vmAssertString(search, "INSTR");
            if (startPos >= str.length) {
                return 0; // not found
            }
            if (!search.length) {
                return startPos + 1;
            }
            return str.indexOf(search, startPos) + 1;
        };
        CpcVm.prototype["int"] = function (n) {
            this.vmAssertNumber(n, "INT");
            return Math.floor(n);
        };
        CpcVm.prototype.joy = function (joy) {
            joy = this.vmInRangeRound(joy, 0, 1, "JOY");
            return this.keyboard.getJoyState(joy);
        };
        CpcVm.prototype.key = function (token, s) {
            token = this.vmRound(token, "KEY");
            if (token >= 128 && token <= 159) {
                token -= 128;
            }
            token = this.vmInRangeRound(token, 0, 31, "KEY"); // round again, but we want the check
            this.vmAssertString(s, "KEY");
            this.keyboard.setExpansionToken(token, s);
        };
        CpcVm.prototype.keyDef = function (cpcKey, repeat, normal, shift, ctrl) {
            var options = {
                cpcKey: this.vmInRangeRound(cpcKey, 0, 79, "KEY DEF"),
                repeat: this.vmInRangeRound(repeat, 0, 1, "KEY DEF"),
                normal: (normal !== undefined) ? this.vmInRangeRound(normal, 0, 255, "KEY DEF") : undefined,
                shift: (shift !== undefined) ? this.vmInRangeRound(shift, 0, 255, "KEY DEF") : undefined,
                ctrl: (ctrl !== undefined) ? this.vmInRangeRound(ctrl, 0, 255, "KEY DEF") : undefined
            };
            this.keyboard.setCpcKeyExpansion(options);
        };
        CpcVm.prototype.left$ = function (s, len) {
            this.vmAssertString(s, "LEFT$");
            len = this.vmInRangeRound(len, 0, 255, "LEFT$");
            return s.substring(0, len);
        };
        CpcVm.prototype.len = function (s) {
            this.vmAssertString(s, "LEN");
            return s.length;
        };
        // let
        CpcVm.prototype.vmLineInputCallback = function () {
            var inputParas = this.vmGetStopObject().paras, input = inputParas.input;
            if (Utils_21.Utils.debug > 0) {
                Utils_21.Utils.console.debug("vmLineInputCallback:", input);
            }
            this.vmSetInputValues([input]);
            this.cursor(inputParas.stream, 0);
            return true;
        };
        CpcVm.prototype.lineInput = function (stream, noCRLF, msg, varType) {
            stream = this.vmInRangeRound(stream, 0, 9, "LINE INPUT");
            if (stream < 8) {
                this.vmAssertString(varType, "LINE INPUT");
                this.print(stream, msg);
                var type = this.vmDetermineVarType(varType);
                if (type !== "$") { // not string?
                    this.print(stream, "\r\n");
                    throw this.vmComposeError(Error(), 13, "LINE INPUT " + type); // Type mismatch
                }
                this.cursor(stream, 1);
                this.vmStop("waitInput", 45, false, {
                    command: "lineinput",
                    stream: stream,
                    message: msg,
                    noCRLF: noCRLF,
                    fnInputCallback: this.vmLineInputCallback.bind(this),
                    input: "",
                    line: this.line // to repeat in case of break
                });
            }
            else if (stream === 8) {
                this.vmSetInputValues(["I am the printer!"]);
            }
            else if (stream === 9) {
                if (!this.inFile.open) {
                    throw this.vmComposeError(Error(), 31, "LINE INPUT #" + stream); // File not open
                }
                else if (this.eof()) {
                    throw this.vmComposeError(Error(), 24, "LINE INPUT #" + stream); // EOF met
                }
                this.vmSetInputValues(this.inFile.fileData.splice(0, arguments.length - 3)); // always 1 element
            }
        };
        CpcVm.prototype.list = function (stream, first, last) {
            stream = this.vmInRangeRound(stream, 0, 9, "LIST");
            if (first === undefined) {
                first = 1;
                if (last === undefined) { // no first and last parameter?
                    last = 65535;
                }
            }
            else {
                first = this.vmInRangeRound(first, 1, 65535, "LIST");
                if (last === undefined) { // just one parameter?
                    last = first;
                }
                else { // range
                    last = this.vmInRangeRound(last, 1, 65535, "LIST");
                }
            }
            if (stream === 9) {
                if (!this.outFile.open) { // catch here
                    throw this.vmComposeError(Error(), 31, "LIST #" + stream); // File not open
                }
            }
            this.vmStop("list", 90, false, {
                command: "list",
                stream: stream,
                first: first,
                last: last,
                line: this.line // unused
            });
        };
        CpcVm.prototype.vmLoadCallback = function (input, meta) {
            var inFile = this.inFile;
            var putInMemory = false;
            if (input !== null && meta) {
                if (meta.typeString === "B" || inFile.start !== undefined) { // only for binary files or when a load address is specified (feature)
                    var start = inFile.start !== undefined ? inFile.start : Number(meta.start);
                    var length_1 = Number(meta.length); // we do not really need the length from metadata
                    if (isNaN(length_1)) {
                        length_1 = input.length; // only valid after atob()
                    }
                    if (Utils_21.Utils.debug > 1) {
                        Utils_21.Utils.console.debug("vmLoadCallback:", inFile.name + ": putting data in memory", start, "-", start + length_1);
                    }
                    for (var i = 0; i < length_1; i += 1) {
                        var byte = input.charCodeAt(i);
                        this.poke((start + i) & 0xffff, byte); // eslint-disable-line no-bitwise
                    }
                    putInMemory = true;
                }
            }
            this.closein();
            return putInMemory;
        };
        CpcVm.prototype.load = function (name, start) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "LOAD");
            if (start !== undefined) {
                start = this.vmRound2Complement(start, "LOAD");
            }
            this.closein();
            inFile.open = true;
            inFile.command = "load";
            inFile.name = name;
            inFile.start = start;
            inFile.fnFileCallback = this.fnLoadHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.vmLocate = function (stream, pos, vpos) {
            var win = this.windowDataList[stream];
            win.pos = pos - 1;
            win.vpos = vpos - 1;
        };
        CpcVm.prototype.locate = function (stream, pos, vpos) {
            stream = this.vmInRangeRound(stream, 0, 7, "LOCATE");
            pos = this.vmInRangeRound(pos, 1, 255, "LOCATE");
            vpos = this.vmInRangeRound(vpos, 1, 255, "LOCATE");
            this.vmDrawUndrawCursor(stream); // undraw
            this.vmLocate(stream, pos, vpos);
            this.vmDrawUndrawCursor(stream); // draw
        };
        CpcVm.prototype.log = function (n) {
            this.vmAssertNumber(n, "LOG");
            if (n <= 0) {
                throw this.vmComposeError(Error(), 6, "LOG " + n);
            }
            return Math.log(n);
        };
        CpcVm.prototype.log10 = function (n) {
            this.vmAssertNumber(n, "LOG10");
            if (n <= 0) {
                throw this.vmComposeError(Error(), 6, "LOG10 " + n);
            }
            return Math.log10(n);
        };
        CpcVm.fnLowerCase = function (match) {
            return match.toLowerCase();
        };
        CpcVm.prototype.lower$ = function (s) {
            this.vmAssertString(s, "LOWER$");
            s = s.replace(/[A-Z]/g, CpcVm.fnLowerCase); // replace only characters A-Z
            return s;
        };
        CpcVm.prototype.mask = function (mask, first) {
            if (mask === undefined && first === undefined) {
                throw this.vmComposeError(Error(), 22, "MASK"); // Operand missing
            }
            if (mask !== undefined) {
                mask = this.vmInRangeRound(mask, 0, 255, "MASK");
                this.canvas.setMask(mask);
            }
            if (first !== undefined) {
                first = this.vmInRangeRound(first, 0, 1, "MASK");
                this.canvas.setMaskFirst(first);
            }
        };
        CpcVm.prototype.max = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (!args.length) {
                throw this.vmComposeError(Error(), 22, "MAX"); // Operand missing
            }
            else if (args.length === 1) { // if just one argument, return it, even if it is a string
                if (typeof args[0] !== "number" && !this.quiet) {
                    Utils_21.Utils.console.warn("MAX: Not a number:", args[0]);
                }
                return args[0];
            }
            for (var i = 0; i < args.length; i += 1) {
                this.vmAssertNumber(args[i], "MAX");
            }
            return Math.max.apply(null, args);
        };
        CpcVm.prototype.memory = function (n) {
            n = this.vmRound2Complement(n, "MEMORY");
            if (n < CpcVm.minHimem || n > this.minCharHimem) {
                throw this.vmComposeError(Error(), 7, "MEMORY " + n); // Memory full
            }
            this.himemValue = n;
        };
        CpcVm.prototype.merge = function (name) {
            var inFile = this.inFile;
            name = this.vmAdaptFilename(name, "MERGE");
            this.closein();
            inFile.open = true;
            inFile.command = "merge";
            inFile.name = name;
            inFile.fnFileCallback = this.fnCloseinHandler;
            this.vmStop("fileLoad", 90);
        };
        CpcVm.prototype.mid$ = function (s, start, len) {
            this.vmAssertString(s, "MID$");
            start = this.vmInRangeRound(start, 1, 255, "MID$");
            if (len !== undefined) {
                len = this.vmInRangeRound(len, 0, 255, "MID$");
            }
            return s.substr(start - 1, len); // or: s.substring(start - 1, len === undefined ? len : start - 1 + len);
        };
        CpcVm.prototype.mid$Assign = function (s, start, len, newString) {
            this.vmAssertString(s, "MID$");
            this.vmAssertString(newString, "MID$");
            start = this.vmInRangeRound(start, 1, 255, "MID$") - 1;
            len = (len !== undefined) ? this.vmInRangeRound(len, 0, 255, "MID$") : newString.length;
            if (len > newString.length) {
                len = newString.length;
            }
            if (len > s.length - start) {
                len = s.length - start;
            }
            s = s.substring(0, start) + newString.substring(0, len) + s.substring(start + len);
            return s;
        };
        CpcVm.prototype.min = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (!args.length) {
                throw this.vmComposeError(Error(), 22, "MIN"); // Operand missing
            }
            else if (args.length === 1) { // if just one argument, return it, even if it is a string
                if (typeof args[0] !== "number" && !this.quiet) {
                    Utils_21.Utils.console.warn("MIN: Not a number:", args[0]);
                }
                return args[0];
            }
            for (var i = 0; i < args.length; i += 1) {
                this.vmAssertNumber(args[i], "MIN");
            }
            return Math.min.apply(null, args);
        };
        // mod
        // changing the mode without clearing the screen (called by rsx |MODE)
        CpcVm.prototype.vmChangeMode = function (mode) {
            this.modeValue = mode;
            var winData = CpcVm.winData[this.modeValue];
            for (var i = 0; i < CpcVm.streamCount - 2; i += 1) { // for window streams
                var win = this.windowDataList[i];
                Object.assign(win, winData);
            }
            this.canvas.changeMode(mode);
        };
        CpcVm.prototype.mode = function (mode) {
            mode = this.vmInRangeRound(mode, 0, 3, "MODE");
            this.modeValue = mode;
            this.vmResetWindowData(false); // do not reset pen and paper
            this.outBuffer = ""; // clear console
            this.canvas.setMode(mode); // does not clear canvas
            this.canvas.clearFullWindow(); // always with paper 0 (SCR MODE CLEAR)
            this.textCanvas.clearFullWindow();
        };
        CpcVm.prototype.move = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "MOVE");
            y = this.vmInRangeRound(y, -32768, 32767, "MOVE");
            this.vmDrawMovePlot("MOVE", gPen, gColMode);
            this.canvas.move(x, y);
        };
        CpcVm.prototype.mover = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "MOVER") + this.canvas.getXpos();
            y = this.vmInRangeRound(y, -32768, 32767, "MOVER") + this.canvas.getYpos();
            this.vmDrawMovePlot("MOVER", gPen, gColMode);
            this.canvas.move(x, y);
        };
        CpcVm.prototype["new"] = function () {
            this.clear();
            var lineParas = {
                command: "new",
                stream: 0,
                first: 0,
                last: 0,
                line: this.line // unused
            };
            this.vmStop("new", 90, false, lineParas);
        };
        CpcVm.prototype.onBreakCont = function () {
            this.breakGosubLine = -1;
            this.breakResumeLine = 0;
        };
        CpcVm.prototype.onBreakGosub = function (line) {
            this.breakGosubLine = this.vmLineInRange(line, "ON BREAK GOSUB");
            this.breakResumeLine = 0;
        };
        CpcVm.prototype.onBreakStop = function () {
            this.breakGosubLine = 0;
            this.breakResumeLine = 0;
        };
        CpcVm.prototype.onErrorGoto = function (line) {
            this.errorGotoLine = (line !== 0) ? this.vmLineInRange(line, "ON ERROR GOTO") : 0;
            if (!line && this.errorResumeLine) { // line=0 but an error to resume?
                throw this.vmComposeError(Error(), this.errorCode, "ON ERROR GOTO without RESUME from " + this.errorLine);
            }
        };
        CpcVm.prototype.onGosub = function (retLabel, n) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            n = this.vmInRangeRound(n, 0, 255, "ON GOSUB");
            var line;
            if (!n || n > args.length) { // out of range? => continue with line after onGosub
                if (Utils_21.Utils.debug > 1) {
                    Utils_21.Utils.console.debug("onGosub: out of range: n=" + n + " in " + this.line);
                }
                line = retLabel;
            }
            else {
                line = this.vmLineInRange(args[n - 1], "ON GOSUB"); // n=1...
                if (this.gosubStack.length >= this.maxGosubStackLength) { // limit stack size (not necessary in JS, but...)
                    throw this.vmComposeError(Error(), 7, "ON GOSUB " + n); // Memory full
                }
                this.gosubStack.push(retLabel);
            }
            this.vmGoto(line, "onGosub (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
        };
        CpcVm.prototype.onGoto = function (retLabel, n) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            n = this.vmInRangeRound(n, 0, 255, "ON GOTO");
            var line;
            if (!n || n > args.length) { // out of range? => continue with line after onGoto
                if (Utils_21.Utils.debug > 1) {
                    Utils_21.Utils.console.debug("onGoto: out of range: n=" + n + " in " + this.line);
                }
                line = retLabel;
            }
            else {
                line = this.vmLineInRange(args[n - 1], "ON GOTO");
            }
            this.vmGoto(line, "onGoto (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
        };
        CpcVm.fnChannel2ChannelIndex = function (channel) {
            if (channel === 4) {
                channel = 2;
            }
            else {
                channel -= 1;
            }
            return channel;
        };
        CpcVm.prototype.onSqGosub = function (channel, line) {
            channel = this.vmInRangeRound(channel, 1, 4, "ON SQ GOSUB");
            if (channel === 3) {
                throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + channel); // Improper argument
            }
            channel = CpcVm.fnChannel2ChannelIndex(channel);
            var sqTimer = this.sqTimer[channel];
            sqTimer.line = this.vmLineInRange(line, "ON SQ GOSUB");
            sqTimer.active = true;
            sqTimer.repeat = true; // means reloaded for sq
        };
        CpcVm.prototype.vmOpeninCallback = function (input) {
            if (input !== null) {
                input = input.replace(/\r\n/g, "\n"); // remove CR (maybe from ASCII file in "binary" form)
                if (input.endsWith("\n")) {
                    input = input.substring(0, input.length - 1); // remove last "\n" (TTT: also for data files?)
                }
                var inFile = this.inFile;
                inFile.fileData = input.split("\n");
            }
            else {
                this.closein();
            }
        };
        CpcVm.prototype.openin = function (name) {
            name = this.vmAdaptFilename(name, "OPENIN");
            var inFile = this.inFile;
            if (!inFile.open) {
                if (name) {
                    inFile.open = true;
                    inFile.command = "openin";
                    inFile.name = name;
                    inFile.fnFileCallback = this.fnOpeninHandler;
                    this.vmStop("fileLoad", 90);
                }
            }
            else {
                throw this.vmComposeError(Error(), 27, "OPENIN " + inFile.name); // file already open
            }
        };
        CpcVm.prototype.openout = function (name) {
            var outFile = this.outFile;
            if (outFile.open) {
                throw this.vmComposeError(Error(), 27, "OPENOUT " + outFile.name); // file already open
            }
            name = this.vmAdaptFilename(name, "OPENOUT");
            outFile.open = true;
            outFile.command = "openout";
            outFile.name = name;
            outFile.fileData.length = 0; // no data yet
            outFile.typeString = "A"; // ASCII
        };
        // or
        CpcVm.prototype.origin = function (xOff, yOff, xLeft, xRight, yTop, yBottom) {
            xOff = this.vmInRangeRound(xOff, -32768, 32767, "ORIGIN");
            yOff = this.vmInRangeRound(yOff, -32768, 32767, "ORIGIN");
            this.canvas.setOrigin(xOff, yOff);
            if (xLeft !== undefined) {
                xLeft = this.vmInRangeRound(xLeft, -32768, 32767, "ORIGIN");
                xRight = this.vmInRangeRound(xRight, -32768, 32767, "ORIGIN");
                yTop = this.vmInRangeRound(yTop, -32768, 32767, "ORIGIN");
                yBottom = this.vmInRangeRound(yBottom, -32768, 32767, "ORIGIN");
                this.canvas.setGWindow(xLeft, xRight, yTop, yBottom);
            }
        };
        CpcVm.prototype.vmSetRamSelect = function (bank) {
            // we support RAM select for banks 0,4... (so not for 1 to 3)
            if (!bank) {
                this.ramSelect = 0;
            }
            else if (bank >= 4) {
                this.ramSelect = bank - 3; // bank 4 gets position 1
            }
        };
        CpcVm.prototype.vmSetCrtcData = function (byte) {
            var crtcReg = this.crtcReg, crtcData = this.crtcData;
            crtcData[crtcReg] = byte;
            if (crtcReg === 12 || crtcReg === 13) { // screen offset changed
                var offset = (((crtcData[12] || 0) & 0x03) << 9) | ((crtcData[13] || 0) << 1); // eslint-disable-line no-bitwise
                this.vmSetScreenOffset(offset);
            }
        };
        CpcVm.prototype.out = function (port, byte) {
            port = this.vmRound2Complement(port, "OUT");
            byte = this.vmInRangeRound(byte, 0, 255, "OUT");
            var portHigh = port >> 8; // eslint-disable-line no-bitwise
            if (portHigh === 0x7f) { // 7Fxx = RAM select
                this.vmSetRamSelect(byte - 0xc0);
            }
            else if (portHigh === 0xbc) { // limited support for CRTC 12, 13
                this.crtcReg = byte % 14;
            }
            else if (portHigh === 0xbd) {
                this.vmSetCrtcData(byte);
                this.crtcData[this.crtcReg] = byte;
            }
            else if (Utils_21.Utils.debug > 0) {
                Utils_21.Utils.console.debug("OUT", Number(port).toString(16), byte, ": unknown port");
            }
        };
        CpcVm.prototype.paper = function (stream, paper) {
            stream = this.vmInRangeRound(stream, 0, 7, "PAPER");
            paper = this.vmInRangeRound(paper, 0, 15, "PAPER");
            var win = this.windowDataList[stream];
            win.paper = paper;
        };
        CpcVm.prototype.vmGetCharDataByte = function (addr) {
            var dataPos = (addr - 1 - this.minCharHimem) % 8, char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8, charData = this.canvas.getCharData(char);
            return charData[dataPos];
        };
        CpcVm.prototype.vmSetCharDataByte = function (addr, byte) {
            var dataPos = (addr - 1 - this.minCharHimem) % 8, char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8, charData = this.canvas.getCharData(char), charDataCopy = charData.slice(); // we need a copy to not modify original data
            charDataCopy[dataPos] = byte; // change one byte
            this.canvas.setCustomChar(char, charDataCopy);
        };
        CpcVm.prototype.peek = function (addr) {
            addr = this.vmRound2Complement(addr, "PEEK");
            // check two higher bits of 16 bit address to get 16K page
            var page = addr >> 14; // eslint-disable-line no-bitwise
            var byte;
            if (page === this.screenPage) { // screen memory page?
                byte = this.canvas.getByte(addr); // get byte from screen memory
                if (byte === null) { // byte not visible on screen?
                    byte = this.mem[addr] || 0; // get it from our memory
                }
            }
            else if (page === 1 && this.ramSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
                addr = (this.ramSelect - 1) * 0x4000 + 0x10000 + addr;
                byte = this.mem[addr] || 0;
            }
            else if (addr > this.minCharHimem && addr <= this.maxCharHimem) { // character map; TODO: can also be in memory mapped area
                byte = this.vmGetCharDataByte(addr);
            }
            else {
                byte = this.mem[addr] || 0;
            }
            return byte;
        };
        CpcVm.prototype.pen = function (stream, pen, transparent) {
            stream = this.vmInRangeRound(stream, 0, 7, "PEN");
            if (pen !== undefined) {
                var win = this.windowDataList[stream];
                pen = this.vmInRangeRound(pen, 0, 15, "PEN");
                win.pen = pen;
            }
            if (transparent !== undefined) {
                transparent = this.vmInRangeRound(transparent, 0, 1, "PEN");
                this.vmSetTransparentMode(stream, transparent);
            }
        };
        CpcVm.prototype.pi = function () {
            return Math.PI; // or less precise: 3.14159265
        };
        CpcVm.prototype.plot = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "PLOT");
            y = this.vmInRangeRound(y, -32768, 32767, "PLOT");
            this.vmDrawMovePlot("PLOT", gPen, gColMode);
            this.canvas.plot(x, y);
        };
        CpcVm.prototype.plotr = function (x, y, gPen, gColMode) {
            x = this.vmInRangeRound(x, -32768, 32767, "PLOTR") + this.canvas.getXpos();
            y = this.vmInRangeRound(y, -32768, 32767, "PLOTR") + this.canvas.getYpos();
            this.vmDrawMovePlot("PLOTR", gPen, gColMode);
            this.canvas.plot(x, y);
        };
        CpcVm.prototype.poke = function (addr, byte) {
            addr = this.vmRound2Complement(addr, "POKE address");
            byte = this.vmInRangeRound(byte, 0, 255, "POKE byte");
            // check two higher bits of 16 bit address to get 16K page
            var page = addr >> 14; // eslint-disable-line no-bitwise
            if (page === 1 && this.ramSelect) { // memory mapped RAM with page 1=0x4000..0x7fff?
                addr = (this.ramSelect - 1) * 0x4000 + 0x10000 + addr;
            }
            else if (page === this.screenPage) { // screen memory page?
                this.canvas.setByte(addr, byte); // write byte also to screen memory
            }
            else if (addr > this.minCharHimem && addr <= this.maxCharHimem) { // character map; TODO: can also be in memory mapped area
                this.vmSetCharDataByte(addr, byte);
            }
            this.mem[addr] = byte;
        };
        CpcVm.prototype.pos = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 9, "POS");
            var pos;
            if (stream < 8) {
                pos = this.vmGetAllowedPosOrVpos(stream, false) + 1; // get allowed pos
            }
            else if (stream === 8) { // printer position (starting with 1)
                pos = 1; // TODO
            }
            else { // stream 9: number of characters written since last CR (\r), \n in CpcEmu, starting with one)
                var win = this.windowDataList[stream];
                pos = win.pos + 1;
            }
            return pos;
        };
        CpcVm.prototype.vmGetAllowedPosOrVpos = function (stream, vpos) {
            var win = this.windowDataList[stream], left = win.left, right = win.right, top = win.top, bottom = win.bottom;
            var x = win.pos, y = win.vpos;
            if (x > (right - left)) {
                y += 1;
                x = 0;
            }
            if (x < 0) {
                y -= 1;
                x = right - left;
            }
            if (!vpos) {
                return x;
            }
            if (y < 0) {
                y = 0;
            }
            if (y > (bottom - top)) {
                y = bottom - top;
            }
            return y;
        };
        CpcVm.prototype.vmMoveCursor2AllowedPos = function (stream) {
            var win = this.windowDataList[stream], left = win.left, right = win.right, top = win.top, bottom = win.bottom;
            var x = win.pos, y = win.vpos;
            if (x > (right - left)) {
                y += 1;
                x = 0;
                this.outBuffer += "\n";
            }
            if (x < 0) {
                y -= 1;
                x = right - left;
            }
            if (y < 0) {
                y = 0;
                if (stream < 8) {
                    this.canvas.windowScrollDown(left, right, top, bottom, win.paper);
                    this.textCanvas.windowScrollDown(left, right, top, bottom, win.paper);
                }
            }
            if (y > (bottom - top)) {
                y = bottom - top;
                if (stream < 8) {
                    this.canvas.windowScrollUp(left, right, top, bottom, win.paper);
                    this.textCanvas.windowScrollUp(left, right, top, bottom, win.paper);
                }
            }
            win.pos = x;
            win.vpos = y;
        };
        CpcVm.prototype.vmPrintChars = function (stream, str) {
            var win = this.windowDataList[stream];
            if (!win.textEnabled) {
                if (Utils_21.Utils.debug > 0) {
                    Utils_21.Utils.console.debug("vmPrintChars: text output disabled:", str);
                }
                return;
            }
            // put cursor in next line if string does not fit in line any more
            this.vmMoveCursor2AllowedPos(stream);
            if (win.pos && (win.pos + str.length > (win.right + 1 - win.left))) {
                win.pos = 0;
                win.vpos += 1; // "\r\n", newline if string does not fit in line
            }
            for (var i = 0; i < str.length; i += 1) {
                var char = CpcVm.vmGetCpcCharCode(str.charCodeAt(i));
                this.vmMoveCursor2AllowedPos(stream);
                this.canvas.printChar(char, win.pos + win.left, win.vpos + win.top, win.pen, win.paper, win.transparent);
                this.textCanvas.printChar(char, win.pos + win.left, win.vpos + win.top, win.pen, win.paper, win.transparent);
                win.pos += 1;
            }
        };
        CpcVm.prototype.vmControlSymbol = function (para) {
            var paraList = [];
            for (var i = 0; i < para.length; i += 1) {
                paraList.push(para.charCodeAt(i));
            }
            var char = paraList[0];
            if (char >= this.minCustomChar) {
                this.symbol.apply(this, paraList);
            }
            else if (Utils_21.Utils.debug > 0) {
                Utils_21.Utils.console.debug("vmControlSymbol: define SYMBOL ignored:", char);
            }
        };
        CpcVm.prototype.vmControlWindow = function (para, stream) {
            var paraList = [];
            // args in para: left, right, top, bottom (all -1 !)
            for (var i = 0; i < para.length; i += 1) {
                var value = para.charCodeAt(i) + 1; // control ranges start with 0!
                value %= 256;
                if (!value) {
                    value = 1; // avoid error
                }
                paraList.push(value);
            }
            this.window(stream, paraList[0], paraList[1], paraList[2], paraList[3]);
        };
        CpcVm.prototype.vmHandleControlCode = function (code, para, stream) {
            var win = this.windowDataList[stream], out = ""; // no controls for text window
            switch (code) {
                case 0x00: // NUL, ignore
                    break;
                case 0x01: // SOH 0-255
                    this.vmPrintChars(stream, para);
                    break;
                case 0x02: // STX
                    win.cursorEnabled = false; // cursor disable (user)
                    break;
                case 0x03: // ETX
                    win.cursorEnabled = true; // cursor enable (user)
                    break;
                case 0x04: // EOT 0-3 (on CPC: 0-2, 3 is ignored; really mod 4)
                    this.mode(para.charCodeAt(0) & 0x03); // eslint-disable-line no-bitwise
                    break;
                case 0x05: // ENQ
                    this.vmPrintGraphChars(para);
                    break;
                case 0x06: // ACK
                    win.cursorEnabled = true;
                    win.textEnabled = true;
                    break;
                case 0x07: // BEL
                    this.sound(135, 90, 20, 12, 0, 0, 0);
                    break;
                case 0x08: // BS
                    this.vmMoveCursor2AllowedPos(stream);
                    win.pos -= 1;
                    break;
                case 0x09: // TAB
                    this.vmMoveCursor2AllowedPos(stream);
                    win.pos += 1;
                    break;
                case 0x0a: // LF
                    this.vmMoveCursor2AllowedPos(stream);
                    win.vpos += 1;
                    break;
                case 0x0b: // VT
                    this.vmMoveCursor2AllowedPos(stream);
                    win.vpos -= 1;
                    break;
                case 0x0c: // FF
                    this.cls(stream);
                    break;
                case 0x0d: // CR
                    this.vmMoveCursor2AllowedPos(stream);
                    win.pos = 0;
                    break;
                case 0x0e: // SO
                    this.paper(stream, para.charCodeAt(0) & 0x0f); // eslint-disable-line no-bitwise
                    break;
                case 0x0f: // SI
                    this.pen(stream, para.charCodeAt(0) & 0x0f); // eslint-disable-line no-bitwise
                    break;
                case 0x10: // DLE
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, 1, 1, win.paper); // clear character under cursor
                    this.textCanvas.fillTextBox(win.left + win.pos, win.top + win.vpos, 1, 1); // clear character under cursor
                    break;
                case 0x11: // DC1
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor
                    this.textCanvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor
                    break;
                case 0x12: // DC2
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor
                    this.textCanvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor
                    break;
                case 0x13: // DC3
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left, win.top, win.right - win.left + 1, win.top - win.vpos, win.paper); // clear window up to cursor line -1
                    this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor (DC1)
                    this.textCanvas.fillTextBox(win.left, win.top, win.right - win.left + 1, win.top - win.vpos, win.paper); // clear window up to cursor line -1
                    this.textCanvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper); // clear line up to cursor (DC1)
                    break;
                case 0x14: // DC4
                    this.vmMoveCursor2AllowedPos(stream);
                    this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor (DC2)
                    this.canvas.fillTextBox(win.left, win.top + win.vpos + 1, win.right - win.left + 1, win.bottom - win.top - win.vpos, win.paper); // clear window from cursor line +1
                    this.textCanvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper); // clear line from cursor (DC2)
                    this.textCanvas.fillTextBox(win.left, win.top + win.vpos + 1, win.right - win.left + 1, win.bottom - win.top - win.vpos, win.paper); // clear window from cursor line +1
                    break;
                case 0x15: // NAK
                    win.cursorEnabled = false;
                    win.textEnabled = false;
                    break;
                case 0x16: // SYN
                    // parameter: only bit 0 relevant (ROM: &14E3)
                    this.vmSetTransparentMode(stream, para.charCodeAt(0) & 0x01); // eslint-disable-line no-bitwise
                    break;
                case 0x17: // ETB
                    this.canvas.setGColMode(para.charCodeAt(0) % 4);
                    break;
                case 0x18: // CAN
                    this.vmTxtInverse(stream);
                    break;
                case 0x19: // EM
                    this.vmControlSymbol(para);
                    break;
                case 0x1a: // SUB
                    this.vmControlWindow(para, stream);
                    break;
                case 0x1b: // ESC, ignored
                    break;
                case 0x1c: // FS
                    this.ink(para.charCodeAt(0) & 0x0f, para.charCodeAt(1) & 0x1f, para.charCodeAt(2) & 0x1f); // eslint-disable-line no-bitwise
                    break;
                case 0x1d: // GS
                    this.border(para.charCodeAt(0) & 0x1f, para.charCodeAt(1) & 0x1f); // eslint-disable-line no-bitwise
                    break;
                case 0x1e: // RS
                    win.pos = 0;
                    win.vpos = 0;
                    break;
                case 0x1f: // US
                    this.vmLocate(stream, para.charCodeAt(0), para.charCodeAt(1));
                    break;
                default:
                    Utils_21.Utils.console.warn("vmHandleControlCode: Unknown control code:", code);
                    break;
            }
            return out;
        };
        CpcVm.prototype.vmPrintCharsOrControls = function (stream, str) {
            var buf = "", out = "", i = 0;
            while (i < str.length) {
                var code = str.charCodeAt(i);
                i += 1;
                if (code <= 0x1f) { // control code?
                    if (out !== "") {
                        this.vmPrintChars(stream, out); // print chars collected so far
                        out = "";
                    }
                    var paraCount = CpcVm.controlCodeParameterCount[code];
                    if (i + paraCount <= str.length) {
                        out += this.vmHandleControlCode(code, str.substring(i, i + paraCount), stream);
                        i += paraCount;
                    }
                    else {
                        buf = str.substring(i - 1); // not enough parameters, put code in buffer and wait for more
                        i = str.length;
                    }
                }
                else {
                    out += String.fromCharCode(code);
                }
            }
            if (out !== "") {
                this.vmPrintChars(stream, out); // print chars collected so far
            }
            return buf;
        };
        CpcVm.prototype.vmPrintGraphChars = function (str) {
            for (var i = 0; i < str.length; i += 1) {
                var char = CpcVm.vmGetCpcCharCode(str.charCodeAt(i));
                this.canvas.printGChar(char);
            }
        };
        CpcVm.prototype.print = function (stream) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            stream = this.vmInRangeRound(stream, 0, 9, "PRINT");
            var win = this.windowDataList[stream];
            if (stream < 8) {
                if (!win.tag) {
                    this.vmDrawUndrawCursor(stream); // undraw
                }
            }
            else if (stream === 9) {
                if (!this.outFile.open) {
                    throw this.vmComposeError(Error(), 31, "PRINT #" + stream); // File not open
                }
                this.outFile.stream = stream;
            }
            var buf = this.printControlBuf;
            for (var i = 0; i < args.length; i += 1) {
                var arg = args[i];
                var str = void 0;
                if (typeof arg === "object") { // delayed call for spc(), tab(), commaTab() with side effect (position)
                    var specialArgs = arg.args;
                    switch (arg.type) {
                        case "commaTab":
                            str = this.commaTab(stream);
                            break;
                        case "spc":
                            str = this.spc(stream, specialArgs[0]);
                            break;
                        case "tab":
                            str = this.tab(stream, specialArgs[0]);
                            break;
                        default:
                            throw this.vmComposeError(Error(), 5, "PRINT " + arg.type); // Improper argument
                    }
                }
                else if (typeof arg === "number") {
                    str = ((arg >= 0) ? " " : "") + Utils_21.Utils.toPrecision9(arg) + " ";
                }
                else { // e.g. string
                    str = String(arg);
                }
                if (stream < 8) {
                    if (win.tag) {
                        this.vmPrintGraphChars(str);
                    }
                    else {
                        if (buf.length) {
                            str = buf + str;
                        }
                        buf = this.vmPrintCharsOrControls(stream, str);
                    }
                    this.outBuffer += str; // console
                }
                else if (stream === 8) { // printer?
                    this.outBuffer += str; // put also in console
                }
                else { // stream === 9
                    var lastCrPos = buf.lastIndexOf("\r");
                    if (lastCrPos >= 0) {
                        win.pos = str.length - lastCrPos; // number of characters written since last CR (\r)
                    }
                    else {
                        win.pos += str.length;
                    }
                    if (str === "\r\n") { // for now we replace CRLF by LF
                        str = "\n";
                        win.pos = 0;
                    }
                    if (win.pos >= win.right) {
                        str = "\n" + str; // e.g. after tab(256)
                        win.pos = 0;
                    }
                    buf += str;
                }
            }
            if (stream < 8) {
                if (!win.tag) {
                    this.vmDrawUndrawCursor(stream); // draw cursor
                    this.printControlBuf = buf; // maybe some parameters missing
                }
            }
            else if (stream === 9) {
                this.outFile.fileData.push(buf);
            }
        };
        CpcVm.prototype.rad = function () {
            this.degFlag = false;
        };
        // https://en.wikipedia.org/wiki/Jenkins_hash_function
        CpcVm.vmHashCode = function (s) {
            var hash = 0;
            /* eslint-disable no-bitwise */
            for (var i = 0; i < s.length; i += 1) {
                hash += s.charCodeAt(i);
                hash += hash << 10;
                hash ^= hash >> 6;
            }
            hash += hash << 3;
            hash ^= hash >> 11;
            hash += hash << 15;
            /* eslint-enable no-bitwise */
            return hash;
        };
        CpcVm.prototype.vmRandomizeCallback = function () {
            var inputParas = this.vmGetStopObject().paras, input = inputParas.input, value = CpcVm.vmVal(input); // convert to number (also binary, hex)
            var inputOk = true;
            if (Utils_21.Utils.debug > 0) {
                Utils_21.Utils.console.debug("vmRandomizeCallback:", input);
            }
            if (isNaN(value)) {
                inputOk = false;
                inputParas.input = "";
                this.print(inputParas.stream, inputParas.message);
            }
            else {
                this.vmSetInputValues([value]);
            }
            return inputOk;
        };
        CpcVm.prototype.randomize = function (n) {
            var rndInit = 0x89656c07, // an arbitrary 32 bit number <> 0 (this one is used by the CPC)
            stream = 0;
            if (n === undefined) { // no argument? input...
                var msg = "Random number seed ? ";
                this.print(stream, msg);
                var inputParas = {
                    command: "randomize",
                    stream: stream,
                    message: msg,
                    fnInputCallback: this.vmRandomizeCallback.bind(this),
                    input: "",
                    line: this.line // to repeat in case of break
                };
                this.vmStop("waitInput", 45, false, inputParas);
            }
            else { // n can also be floating point, so compute a hash value of n
                this.vmAssertNumber(n, "RANDOMIZE");
                n = CpcVm.vmHashCode(String(n));
                if (n === 0) {
                    n = rndInit;
                }
                if (Utils_21.Utils.debug > 1) {
                    Utils_21.Utils.console.debug("randomize:", n);
                }
                this.random.init(n);
            }
        };
        CpcVm.prototype.read = function (varType) {
            this.vmAssertString(varType, "READ");
            var type = this.vmDetermineVarType(varType);
            var item;
            if (this.dataIndex < this.dataList.length) {
                var dataItem = this.dataList[this.dataIndex];
                this.dataIndex += 1;
                if (dataItem === undefined) { // empty arg?
                    item = type === "$" ? "" : 0; // set arg depending on expected type
                }
                else if (type !== "$") { // not string expected? => convert to number (also binary, hex)
                    // Note : Using a number variable to read a string would cause a syntax error on a real CPC. We cannot detect it since we get always strings.
                    item = this.val(String(dataItem));
                }
                else {
                    item = dataItem;
                }
                item = this.vmAssign(varType, item); // maybe rounding for type I
            }
            else {
                throw this.vmComposeError(Error(), 4, "READ"); // DATA exhausted
            }
            return item;
        };
        CpcVm.prototype.release = function (channelMask) {
            channelMask = this.vmInRangeRound(channelMask, 0, 7, "RELEASE");
            this.soundClass.release(channelMask);
        };
        // rem
        CpcVm.prototype.remain = function (timerNumber) {
            timerNumber = this.vmInRangeRound(timerNumber, 0, 3, "REMAIN");
            var timerEntry = this.timerList[timerNumber];
            var remain = 0;
            if (timerEntry.active) {
                remain = timerEntry.nextTimeMs - Date.now();
                remain /= CpcVm.frameTimeMs;
                timerEntry.active = false; // switch off timer
            }
            return remain;
        };
        CpcVm.prototype.renum = function (newLine, oldLine, step, keep) {
            if (newLine === void 0) { newLine = 10; }
            if (oldLine === void 0) { oldLine = 1; }
            if (step === void 0) { step = 10; }
            if (keep === void 0) { keep = 65535; }
            newLine = this.vmInRangeRound(newLine, 1, 65535, "RENUM");
            oldLine = this.vmInRangeRound(oldLine, 1, 65535, "RENUM");
            step = this.vmInRangeRound(step, 1, 65535, "RENUM");
            keep = this.vmInRangeRound(keep, 1, 65535, "RENUM");
            var lineRenumParas = {
                command: "renum",
                stream: 0,
                line: this.line,
                newLine: newLine,
                oldLine: oldLine,
                step: step,
                keep: keep // keep lines
            };
            this.vmStop("renumLines", 85, false, lineRenumParas);
        };
        CpcVm.prototype.restore = function (line) {
            line = line === undefined ? 0 : this.vmLineInRange(line, "RESTORE");
            var dataLineIndex = this.dataLineIndex;
            if (line in dataLineIndex) {
                this.dataIndex = dataLineIndex[line];
            }
            else {
                if (Utils_21.Utils.debug > 0) {
                    Utils_21.Utils.console.debug("restore: search for dataLine >", line);
                }
                for (var dataLine in dataLineIndex) { // linear search a data line > line
                    if (dataLineIndex.hasOwnProperty(dataLine)) {
                        if (Number(dataLine) >= line) {
                            dataLineIndex[line] = dataLineIndex[dataLine]; // set data index also for line
                            break;
                        }
                    }
                }
                if (line in dataLineIndex) { // now found a data line?
                    this.dataIndex = dataLineIndex[line];
                }
                else {
                    if (Utils_21.Utils.debug > 0) {
                        Utils_21.Utils.console.debug("restore", line + ": No DATA found starting at line");
                    }
                    this.dataIndex = this.dataList.length;
                }
            }
        };
        CpcVm.prototype.resume = function (line) {
            if (this.errorGotoLine) {
                var label = line === undefined ? this.errorResumeLine : this.vmLineInRange(line, "RESUME");
                this.vmGoto(label, "resume");
                this.errorResumeLine = 0;
            }
            else {
                throw this.vmComposeError(Error(), 20, String(line)); // Unexpected RESUME
            }
        };
        CpcVm.prototype.resumeNext = function () {
            if (!this.errorGotoLine || !this.errorResumeLine) {
                throw this.vmComposeError(Error(), 20, "RESUME NEXT"); // Unexpected RESUME
            }
            var resumeLineIndex = this.labelList.indexOf(this.errorResumeLine);
            if (resumeLineIndex < 0) {
                Utils_21.Utils.console.error("resumeNext: line not found: " + this.errorResumeLine);
                this.errorResumeLine = 0;
                return;
            }
            var line = this.labelList[resumeLineIndex + 1]; // get next line
            this.vmGoto(line, "resumeNext");
            this.errorResumeLine = 0;
        };
        CpcVm.prototype["return"] = function () {
            var line = this.gosubStack.pop();
            if (line === undefined) {
                throw this.vmComposeError(Error(), 3, ""); // Unexpected Return [in <line>]
            }
            else {
                this.vmGoto(line, "return");
            }
            if (line === this.breakResumeLine) { // end of break handler?
                this.breakResumeLine = 0; // can start another one
            }
            this.vmCheckTimerHandlers(); // if we are at end of a BASIC timer handler, delete handler flag
            if (this.vmCheckSqTimerHandlers()) { // same for sq timers, timer reloaded?
                this.fnCheckSqTimer(); // next one early
            }
        };
        CpcVm.prototype.right$ = function (s, len) {
            this.vmAssertString(s, "RIGHT$");
            len = this.vmInRangeRound(len, 0, 255, "RIGHT$");
            return s.slice(-len);
        };
        CpcVm.prototype.rnd = function (n) {
            if (n !== undefined) {
                this.vmAssertNumber(n, "RND");
            }
            var x;
            if (n === undefined || n > 0) {
                x = this.random.random();
                this.lastRnd = x;
            }
            else if (n < 0) {
                x = this.lastRnd || this.random.random();
            }
            else { // n === 0
                x = this.lastRnd || this.random.random();
            }
            return x;
        };
        CpcVm.prototype.round = function (n, decimals) {
            this.vmAssertNumber(n, "ROUND");
            decimals = this.vmInRangeRound(decimals || 0, -39, 39, "ROUND");
            var maxDecimals = 20 - Math.floor(Math.log10(n)); // limit for JS
            if (decimals >= 0 && decimals > maxDecimals) {
                decimals = maxDecimals;
            }
            // To avoid rounding errors: https://www.jacklmoore.com/notes/rounding-in-javascript
            // Use Math.abs(n) and Math.sign(n) To round negative numbers to larger negative numbers
            return Math.sign(n) * Number(Math.round(Number(Math.abs(n) + "e" + decimals)) + "e" + ((decimals >= 0) ? "-" + decimals : "+" + -decimals));
        };
        CpcVm.prototype.vmRunCallback = function (input, meta) {
            var inFile = this.inFile, putInMemory = input !== null && meta && (meta.typeString === "B" || inFile.start !== undefined);
            // TODO: we could put it in memory as we do it for LOAD
            if (input !== null) {
                var lineParas = {
                    command: "run",
                    stream: 0,
                    first: inFile.line,
                    last: 0,
                    line: this.line
                };
                this.vmStop("run", 95, false, lineParas);
            }
            this.closein();
            return putInMemory;
        };
        CpcVm.prototype.run = function (numOrString) {
            var inFile = this.inFile;
            if (typeof numOrString === "string") { // filename?
                var name_11 = this.vmAdaptFilename(numOrString, "RUN");
                this.closein();
                inFile.open = true;
                inFile.command = "run";
                inFile.name = name_11;
                inFile.start = undefined;
                inFile.fnFileCallback = this.fnRunHandler;
                this.vmStop("fileLoad", 90);
            }
            else { // line number or no argument = undefined
                if (numOrString !== undefined) {
                    this.vmLineInRange(numOrString, "RUN");
                }
                var lineParas = {
                    command: "run",
                    stream: 0,
                    first: numOrString || 0,
                    last: 0,
                    line: this.line
                };
                this.vmStop("run", 95, false, lineParas);
            }
        };
        CpcVm.prototype.save = function (name, type, start, length, entry) {
            var outFile = this.outFile;
            name = this.vmAdaptFilename(name, "SAVE");
            if (!type) {
                type = "T"; // default is tokenized BASIC
            }
            else {
                type = String(type).toUpperCase();
            }
            var fileData = outFile.fileData;
            fileData.length = 0;
            if (type === "B") { // binary
                start = this.vmRound2Complement(start, "SAVE");
                length = this.vmRound2Complement(length, "SAVE");
                if (entry !== undefined) {
                    entry = this.vmRound2Complement(entry, "SAVE");
                }
                for (var i = 0; i < length; i += 1) {
                    var address = (start + i) & 0xffff; // eslint-disable-line no-bitwise
                    fileData[i] = String.fromCharCode(this.peek(address));
                }
            }
            else if ((type === "A" || type === "T" || type === "P") && start === undefined) {
                // ASCII or tokenized BASIC or protected BASIC, and no load address specified
                start = 368; // BASIC start
                // need file data from controller (text box)
            }
            else {
                throw this.vmComposeError(Error(), 2, "SAVE " + type); // Syntax Error
            }
            outFile.open = true;
            outFile.command = "save";
            outFile.name = name;
            outFile.typeString = type;
            outFile.start = start;
            outFile.length = length || 0;
            outFile.entry = entry || 0;
            outFile.fnFileCallback = this.fnCloseoutHandler; // we use closeout handler to reset out file handling
            this.vmStop("fileSave", 90); // must stop directly after save
        };
        CpcVm.prototype.sgn = function (n) {
            this.vmAssertNumber(n, "SGN");
            return Math.sign(n);
        };
        CpcVm.prototype.sin = function (n) {
            this.vmAssertNumber(n, "SIN");
            return Math.sin((this.degFlag) ? Utils_21.Utils.toRadians(n) : n);
        };
        CpcVm.prototype.sound = function (state, period, duration, volume, volEnv, toneEnv, noise) {
            state = this.vmInRangeRound(state, 1, 255, "SOUND");
            period = this.vmInRangeRound(period, 0, 4095, "SOUND ,");
            var soundData = {
                state: state,
                period: period,
                duration: (duration !== undefined) ? this.vmInRangeRound(duration, -32768, 32767, "SOUND ,,") : 20,
                volume: (volume !== undefined) ? this.vmInRangeRound(volume, 0, 15, "SOUND ,,,") : 12,
                volEnv: (volEnv !== undefined) ? this.vmInRangeRound(volEnv, 0, 15, "SOUND ,,,,") : 0,
                toneEnv: (toneEnv !== undefined) ? this.vmInRangeRound(toneEnv, 0, 15, "SOUND ,,,,,") : 0,
                noise: (noise !== undefined) ? this.vmInRangeRound(noise, 0, 31, "SOUND ,,,,,,") : 0
            };
            if (this.soundClass.testCanQueue(state)) {
                this.soundClass.sound(soundData);
            }
            else {
                this.soundData.push(soundData);
                this.vmStop("waitSound", 43);
                for (var i = 0; i < 3; i += 1) {
                    if (state & (1 << i)) { // eslint-disable-line no-bitwise
                        var sqTimer = this.sqTimer[i];
                        sqTimer.active = false; // set onSq timer to inactive
                    }
                }
            }
        };
        CpcVm.prototype.space$ = function (n) {
            n = this.vmInRangeRound(n, 0, 255, "SPACE$");
            return " ".repeat(n);
        };
        CpcVm.prototype.spc = function (stream, n) {
            stream = this.vmInRangeRound(stream, 0, 9, "SPC");
            n = this.vmInRangeRound(n, -32768, 32767, "SPC");
            var str = "";
            if (n >= 0) {
                var win = this.windowDataList[stream], width = win.right - win.left + 1;
                if (width) {
                    n %= width;
                }
                str = " ".repeat(n);
            }
            else if (!this.quiet) {
                Utils_21.Utils.console.log("SPC: negative number ignored:", n);
            }
            return str;
        };
        CpcVm.prototype.speedInk = function (time1, time2) {
            time1 = this.vmInRangeRound(time1, 1, 255, "SPEED INK");
            time2 = this.vmInRangeRound(time2, 1, 255, "SPEED INK");
            this.canvas.setSpeedInk(time1, time2);
        };
        CpcVm.prototype.speedKey = function (delay, repeat) {
            delay = this.vmInRangeRound(delay, 1, 255, "SPEED KEY");
            repeat = this.vmInRangeRound(repeat, 1, 255, "SPEED KEY");
            this.vmNotImplemented("SPEED KEY " + delay + " " + repeat);
        };
        CpcVm.prototype.speedWrite = function (n) {
            n = this.vmInRangeRound(n, 0, 1, "SPEED WRITE");
            this.vmNotImplemented("SPEED WRITE " + n);
        };
        CpcVm.prototype.sq = function (channel) {
            channel = this.vmInRangeRound(channel, 1, 4, "SQ");
            if (channel === 3) {
                throw this.vmComposeError(Error(), 5, "SQ " + channel); // Improper argument
            }
            channel = CpcVm.fnChannel2ChannelIndex(channel);
            var sq = this.soundClass.sq(channel), sqTimer = this.sqTimer[channel];
            // no space in queue and handler active?
            if (!(sq & 0x07) && sqTimer.active) { // eslint-disable-line no-bitwise
                sqTimer.active = false; // set onSq timer to inactive
            }
            return sq;
        };
        CpcVm.prototype.sqr = function (n) {
            this.vmAssertNumber(n, "SQR");
            if (n < 0) {
                throw this.vmComposeError(Error(), 5, "SQR " + n); // Improper argument
            }
            return Math.sqrt(n);
        };
        // step
        CpcVm.prototype.stop = function (label) {
            this.vmGoto(label, "stop");
            this.vmStop("stop", 60);
        };
        CpcVm.prototype.str$ = function (n) {
            this.vmAssertNumber(n, "STR$");
            return ((n >= 0) ? " " : "") + String(n);
        };
        CpcVm.prototype.string$ = function (len, chr) {
            len = this.vmInRangeRound(len, 0, 255, "STRING$");
            if (typeof chr === "number") {
                chr = this.vmInRangeRound(chr, 0, 255, "STRING$");
                chr = String.fromCharCode(chr); // chr$
            }
            else { // expect string
                this.vmAssertString(chr, "STRING$");
                chr = chr.charAt(0); // only one char
            }
            return chr.repeat(len);
        };
        // swap (window swap)
        CpcVm.prototype.symbol = function (char) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            char = this.vmInRangeRound(char, this.minCustomChar, 255, "SYMBOL");
            var charData = [];
            for (var i = 0; i < args.length; i += 1) { // start with 1, get available args
                var bitMask = this.vmInRangeRound(args[i], 0, 255, "SYMBOL");
                charData.push(bitMask);
            }
            // Note: If there are less than 8 rows, the others are assumed as 0 (actually empty)
            this.canvas.setCustomChar(char, charData);
        };
        CpcVm.prototype.symbolAfter = function (char) {
            char = this.vmInRangeRound(char, 0, 256, "SYMBOL AFTER");
            if (this.minCustomChar < 256) { // symbol after <256 set?
                if (this.minCharHimem !== this.himemValue) { // himem changed?
                    throw this.vmComposeError(Error(), 5, "SYMBOL AFTER " + char); // Improper argument
                }
            }
            else {
                this.maxCharHimem = this.himemValue; // no characters defined => use current himem
            }
            var minCharHimem = this.maxCharHimem - (256 - char) * 8;
            if (minCharHimem < CpcVm.minHimem) {
                throw this.vmComposeError(Error(), 7, "SYMBOL AFTER " + minCharHimem); // Memory full
            }
            this.himemValue = minCharHimem;
            this.canvas.resetCustomChars();
            if (char === 256) { // maybe move up again
                minCharHimem = CpcVm.maxHimem;
                this.maxCharHimem = minCharHimem;
            }
            // TODO: Copy char data to screen memory, if screen starts at 0x4000 and chardata is in that range (and ram 0 is selected)
            this.minCustomChar = char;
            this.minCharHimem = minCharHimem;
        };
        CpcVm.prototype.tab = function (stream, n) {
            stream = this.vmInRangeRound(stream, 0, 9, "TAB");
            n = this.vmInRangeRound(n, -32768, 32767, "TAB");
            var str = "";
            if (n > 0) {
                n -= 1;
                var win = this.windowDataList[stream], width = win.right - win.left + 1;
                if (width) {
                    n %= width;
                }
                var count = n - win.pos;
                if (count < 0) { // does it fit until tab position?
                    win.pos = win.right + 1;
                    this.vmMoveCursor2AllowedPos(stream);
                    count = n; // set tab in next line
                }
                str = " ".repeat(count);
            }
            else if (!this.quiet) {
                Utils_21.Utils.console.log("TAB: no tab for value", n);
            }
            return str;
        };
        CpcVm.prototype.tag = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "TAG");
            var win = this.windowDataList[stream];
            win.tag = true;
        };
        CpcVm.prototype.tagoff = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "TAGOFF");
            var win = this.windowDataList[stream];
            win.tag = false;
        };
        CpcVm.prototype.tan = function (n) {
            this.vmAssertNumber(n, "TAN");
            return Math.tan((this.degFlag) ? Utils_21.Utils.toRadians(n) : n);
        };
        CpcVm.prototype.test = function (x, y) {
            x = this.vmInRangeRound(x, -32768, 32767, "TEST");
            y = this.vmInRangeRound(y, -32768, 32767, "TEST");
            return this.canvas.test(x, y);
        };
        CpcVm.prototype.testr = function (x, y) {
            x = this.vmInRangeRound(x, -32768, 32767, "TESTR") + this.canvas.getXpos();
            y = this.vmInRangeRound(y, -32768, 32767, "TESTR") + this.canvas.getYpos();
            return this.canvas.test(x, y);
        };
        CpcVm.prototype.time = function () {
            return ((Date.now() - this.startTime) * 300 / 1000) | 0; // eslint-disable-line no-bitwise
        };
        CpcVm.prototype.troff = function () {
            this.tronFlag1 = false;
        };
        CpcVm.prototype.tron = function () {
            this.tronFlag1 = true;
        };
        CpcVm.prototype.unt = function (n) {
            n = this.vmInRangeRound(n, -32768, 65535, "UNT");
            if (n > 32767) { // two's complement
                n -= 65536;
            }
            return n;
        };
        CpcVm.fnUpperCase = function (match) {
            return match.toUpperCase();
        };
        CpcVm.prototype.upper$ = function (s) {
            this.vmAssertString(s, "UPPER$");
            return s.replace(/[a-z]/g, CpcVm.fnUpperCase); // replace only characters a-z
        };
        CpcVm.prototype.using = function (format) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var reFormat = /(!|&|\\ *\\|(?:\*\*|\$\$|\*\*\$)?\+?(?:#|,)+\.?#*(?:\^\^\^\^)?[+-]?)/g, formatList = [];
            this.vmAssertString(format, "USING");
            // We simulate format.split(reFormat) here since it does not work with IE8
            var index = 0, match;
            while ((match = reFormat.exec(format)) !== null) {
                formatList.push(format.substring(index, match.index)); // non-format characters at the beginning
                formatList.push(match[0]);
                index = match.index + match[0].length;
            }
            if (index < format.length) { // non-format characters at the end
                formatList.push(format.substring(index));
            }
            if (formatList.length < 2) {
                if (!this.quiet) {
                    Utils_21.Utils.console.warn("USING: empty or invalid format:", format);
                }
                throw this.vmComposeError(Error(), 5, "USING format " + format); // Improper argument
            }
            var formatIndex = 0, s = "";
            for (var i = 0; i < args.length; i += 1) { // start with 1
                formatIndex %= formatList.length;
                if (formatIndex === 0) {
                    s += formatList[formatIndex]; // non-format characters at the beginning of the format string
                    formatIndex += 1;
                }
                if (formatIndex < formatList.length) {
                    var arg = args[i];
                    s += this.vmUsingFormat(formatList[formatIndex], arg); // format characters
                    formatIndex += 1;
                }
                if (formatIndex < formatList.length) {
                    s += formatList[formatIndex]; // following non-format characters
                    formatIndex += 1;
                }
            }
            return s;
        };
        CpcVm.vmVal = function (s) {
            var num = 0;
            s = s.trim().toLowerCase();
            if (s.startsWith("&x")) { // binary &x
                s = s.slice(2);
                num = parseInt(s, 2);
            }
            else if (s.startsWith("&h")) { // hex &h
                s = s.slice(2);
                num = parseInt(s, 16);
                if (num > 32767) { // two's complement
                    num -= 65536;
                }
            }
            else if (s.startsWith("&")) { // hex &
                s = s.slice(1);
                num = parseInt(s, 16);
                if (num > 32767) { // two's complement
                    num -= 65536;
                }
            }
            else if (s !== "") { // not empty string?
                num = parseFloat(s);
            }
            return num;
        };
        CpcVm.prototype.val = function (s) {
            this.vmAssertString(s, "VAL");
            var num = CpcVm.vmVal(s);
            if (isNaN(num)) {
                num = 0;
            }
            return num;
        };
        CpcVm.prototype.vpos = function (stream) {
            stream = this.vmInRangeRound(stream, 0, 7, "VPOS");
            return this.vmGetAllowedPosOrVpos(stream, true) + 1;
        };
        CpcVm.prototype.wait = function (port, mask, inv) {
            port = this.vmRound2Complement(port, "WAIT");
            mask = this.vmInRangeRound(mask, 0, 255, "WAIT");
            if (inv !== undefined) {
                /* inv = */ this.vmInRangeRound(inv, 0, 255, "WAIT");
            }
            if ((port & 0xff00) === 0xf500) { // eslint-disable-line no-bitwise
                if (mask === 1) {
                    this.frame();
                }
            }
        };
        // wend
        // while
        CpcVm.prototype.width = function (width) {
            width = this.vmInRangeRound(width, 1, 255, "WIDTH");
            var win = this.windowDataList[8];
            win.right = win.left + width;
        };
        CpcVm.forceInRange = function (num, min, max) {
            if (num < min) {
                num = min;
            }
            else if (num > max) {
                num = max;
            }
            return num;
        };
        CpcVm.prototype.window = function (stream, left, right, top, bottom) {
            stream = this.vmInRangeRound(stream, 0, 7, "WINDOW");
            left = this.vmInRangeRound(left, 1, 255, "WINDOW");
            right = this.vmInRangeRound(right, 1, 255, "WINDOW");
            top = this.vmInRangeRound(top, 1, 255, "WINDOW");
            bottom = this.vmInRangeRound(bottom, 1, 255, "WINDOW");
            var win = this.windowDataList[stream], winData = CpcVm.winData[this.modeValue];
            // make left and top the smaller; make sure the window fits on the screen
            win.left = CpcVm.forceInRange(Math.min(left, right) - 1, winData.left, winData.right);
            win.right = CpcVm.forceInRange(Math.max(left, right) - 1, winData.left, winData.right);
            win.top = CpcVm.forceInRange(Math.min(top, bottom) - 1, winData.top, winData.bottom);
            win.bottom = CpcVm.forceInRange(Math.max(top, bottom) - 1, winData.top, winData.bottom);
            win.pos = 0;
            win.vpos = 0;
        };
        CpcVm.prototype.windowSwap = function (stream1, stream2) {
            stream1 = this.vmInRangeRound(stream1, 0, 7, "WINDOW SWAP");
            stream2 = this.vmInRangeRound(stream2 || 0, 0, 7, "WINDOW SWAP");
            var temp = this.windowDataList[stream1];
            this.windowDataList[stream1] = this.windowDataList[stream2];
            this.windowDataList[stream2] = temp;
        };
        CpcVm.prototype.write = function (stream) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            stream = this.vmInRangeRound(stream, 0, 9, "WRITE");
            var writeArgs = [];
            var str;
            for (var i = 0; i < args.length; i += 1) {
                var arg = args[i];
                if (typeof arg === "number") {
                    str = Utils_21.Utils.toPrecision9(arg);
                }
                else {
                    str = '"' + String(arg) + '"';
                }
                writeArgs.push(str);
            }
            str = writeArgs.join(",");
            if (stream < 8) {
                var win = this.windowDataList[stream];
                if (win.tag) {
                    this.vmPrintGraphChars(str + "\r\n");
                }
                else {
                    this.vmDrawUndrawCursor(stream); // undraw
                    this.vmPrintChars(stream, str);
                    this.vmPrintCharsOrControls(stream, "\r\n");
                    this.vmDrawUndrawCursor(stream); // draw
                }
                this.outBuffer += str + "\n"; // console
            }
            else if (stream === 8) { // printer?
                this.outBuffer += str + "\n"; // console
            }
            else if (stream === 9) {
                this.outFile.stream = stream;
                if (!this.outFile.open) {
                    throw this.vmComposeError(Error(), 31, "WRITE #" + stream); // File not open
                }
                this.outFile.fileData.push(str + "\n"); // real CPC would use CRLF, we use LF
                // currently we print data also to console...
            }
        };
        CpcVm.prototype.xpos = function () {
            return this.canvas.getXpos();
        };
        CpcVm.prototype.ypos = function () {
            return this.canvas.getYpos();
        };
        CpcVm.prototype.zone = function (n) {
            this.zoneValue = this.vmInRangeRound(n, 1, 255, "ZONE");
        };
        // access some private stuff for testing
        CpcVm.prototype.vmTestGetTimerList = function () {
            return this.timerList;
        };
        CpcVm.prototype.vmTestGetWindowDataList = function () {
            return this.windowDataList;
        };
        CpcVm.frameTimeMs = 1000 / 50; // 50 Hz => 20 ms
        CpcVm.timerCount = 4; // number of timers
        CpcVm.sqTimerCount = 3; // sound queue timers
        CpcVm.streamCount = 10; // 0..7 window, 8 printer, 9 cassette
        CpcVm.minHimem = 370;
        CpcVm.maxHimem = 42747; // high memory limit (42747 after symbol after 256)
        CpcVm.emptyParas = {};
        CpcVm.winData = [
            {
                left: 0,
                right: 19,
                top: 0,
                bottom: 24
            },
            {
                left: 0,
                right: 39,
                top: 0,
                bottom: 24
            },
            {
                left: 0,
                right: 79,
                top: 0,
                bottom: 24
            },
            {
                left: 0,
                right: 79,
                top: 0,
                bottom: 49
            }
        ];
        CpcVm.utf8ToCpc = {
            8364: 128,
            8218: 130,
            402: 131,
            8222: 132,
            8230: 133,
            8224: 134,
            8225: 135,
            710: 136,
            8240: 137,
            352: 138,
            8249: 139,
            338: 140,
            381: 142,
            8216: 145,
            8217: 146,
            8220: 147,
            8221: 148,
            8226: 149,
            8211: 150,
            8212: 151,
            732: 152,
            8482: 153,
            353: 154,
            8250: 155,
            339: 156,
            382: 158,
            376: 159
        };
        CpcVm.controlCodeParameterCount = [
            0,
            1,
            0,
            0,
            1,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            1,
            0,
            9,
            4,
            0,
            3,
            2,
            0,
            2 //  0x1f
        ];
        CpcVm.errors = [
            "Improper argument",
            "Unexpected NEXT",
            "Syntax Error",
            "Unexpected RETURN",
            "DATA exhausted",
            "Improper argument",
            "Overflow",
            "Memory full",
            "Line does not exist",
            "Subscript out of range",
            "Array already dimensioned",
            "Division by zero",
            "Invalid direct command",
            "Type mismatch",
            "String space full",
            "String too long",
            "String expression too complex",
            "Cannot CONTinue",
            "Unknown user function",
            "RESUME missing",
            "Unexpected RESUME",
            "Direct command found",
            "Operand missing",
            "Line too long",
            "EOF met",
            "File type error",
            "NEXT missing",
            "File already open",
            "Unknown command",
            "WEND missing",
            "Unexpected WEND",
            "File not open",
            "Broken",
            "Unknown error" // 33...
        ];
        CpcVm.stopPriority = {
            "": 0,
            direct: 0,
            timer: 20,
            waitFrame: 40,
            waitKey: 41,
            waitSound: 43,
            waitInput: 45,
            fileCat: 45,
            fileDir: 45,
            fileEra: 45,
            fileRen: 45,
            error: 50,
            onError: 50,
            stop: 60,
            "break": 80,
            escape: 85,
            renumLines: 85,
            deleteLines: 85,
            editLine: 85,
            end: 90,
            list: 90,
            fileLoad: 90,
            fileSave: 90,
            "new": 90,
            run: 95,
            parse: 95,
            parseRun: 95,
            reset: 99 // reset system
        };
        return CpcVm;
    }());
    exports.CpcVm = CpcVm;
});
// CpcVmRst.ts - CPC Virtual Machine: RSX
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
define("CpcVmRsx", ["require", "exports", "Utils"], function (require, exports, Utils_22) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CpcVmRsx = void 0;
    var CpcVmRsx = /** @class */ (function () {
        function CpcVmRsx(vm) {
            this.vm = vm;
        }
        CpcVmRsx.prototype.rsxIsAvailable = function (name) {
            return name in this;
        };
        CpcVmRsx.prototype.rsxExec = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (this.rsxIsAvailable(name)) {
                this[name].apply(this, args);
            }
            else {
                throw this.vm.vmComposeError(Error(), 28, "|" + name); // Unknown command
            }
        };
        CpcVmRsx.prototype.a = function () {
            this.vm.vmNotImplemented("|A");
        };
        CpcVmRsx.prototype.b = function () {
            this.vm.vmNotImplemented("|B");
        };
        CpcVmRsx.prototype.basic = function () {
            Utils_22.Utils.console.log("basic: |BASIC");
            this.vm.vmStop("reset", 90);
        };
        CpcVmRsx.prototype.cpm = function () {
            this.vm.vmNotImplemented("|CPM");
        };
        CpcVmRsx.prototype.fnGetVariableByAddress = function (index) {
            return this.vm.variables.getVariableByIndex(index) || "";
        };
        CpcVmRsx.prototype.fnGetParameterAsString = function (stringOrAddress) {
            var string = ""; // for undefined
            if (typeof stringOrAddress === "number") { // assuming addressOf
                string = String(this.fnGetVariableByAddress(stringOrAddress));
            }
            else if (typeof stringOrAddress === "string") {
                string = stringOrAddress;
            }
            return string;
        };
        CpcVmRsx.prototype.dir = function (fileMask) {
            var stream = 0;
            var fileMaskString = this.fnGetParameterAsString(fileMask);
            if (fileMaskString) {
                fileMaskString = this.vm.vmAdaptFilename(fileMaskString, "|DIR");
            }
            var fileParas = {
                stream: stream,
                command: "|dir",
                fileMask: fileMaskString,
                line: this.vm.line
            };
            this.vm.vmStop("fileDir", 45, false, fileParas);
        };
        CpcVmRsx.prototype.disc = function () {
            this.vm.vmNotImplemented("|DISC");
        };
        CpcVmRsx.prototype.disc_in = function () {
            this.vm.vmNotImplemented("|DISC.IN");
        };
        CpcVmRsx.prototype.disc_out = function () {
            this.vm.vmNotImplemented("|DISC.OUT");
        };
        CpcVmRsx.prototype.drive = function () {
            this.vm.vmNotImplemented("|DRIVE");
        };
        CpcVmRsx.prototype.era = function (fileMask) {
            var stream = 0;
            var fileMaskString = this.fnGetParameterAsString(fileMask);
            fileMaskString = this.vm.vmAdaptFilename(fileMaskString, "|ERA");
            var fileParas = {
                stream: stream,
                command: "|era",
                fileMask: fileMaskString,
                line: this.vm.line
            };
            this.vm.vmStop("fileEra", 45, false, fileParas);
        };
        CpcVmRsx.prototype.ren = function (newName, oldName) {
            var stream = 0;
            var newName2 = this.fnGetParameterAsString(newName), oldName2 = this.fnGetParameterAsString(oldName);
            newName2 = this.vm.vmAdaptFilename(newName2, "|REN");
            oldName2 = this.vm.vmAdaptFilename(oldName2, "|REN");
            var fileParas = {
                stream: stream,
                command: "|ren",
                fileMask: "",
                newName: newName2,
                oldName: oldName2,
                line: this.vm.line
            };
            this.vm.vmStop("fileRen", 45, false, fileParas);
        };
        CpcVmRsx.prototype.tape = function () {
            this.vm.vmNotImplemented("|TAPE");
        };
        CpcVmRsx.prototype.tape_in = function () {
            this.vm.vmNotImplemented("|TAPE.IN");
        };
        CpcVmRsx.prototype.tape_out = function () {
            this.vm.vmNotImplemented("|TAPE.OUT");
        };
        CpcVmRsx.prototype.user = function () {
            this.vm.vmNotImplemented("|USER");
        };
        CpcVmRsx.prototype.mode = function (mode) {
            mode = this.vm.vmInRangeRound(mode, 0, 3, "|MODE");
            this.vm.vmChangeMode(mode);
        };
        CpcVmRsx.prototype.renum = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.vm.renum.apply(this.vm, args); // execute in vm context
        };
        return CpcVmRsx;
    }());
    exports.CpcVmRsx = CpcVmRsx;
});
// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("FileHandler", ["require", "exports", "Utils", "DiskImage", "ZipFile"], function (require, exports, Utils_23, DiskImage_1, ZipFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileHandler = void 0;
    var FileHandler = /** @class */ (function () {
        function FileHandler(options) {
            this.adaptFilename = {};
            this.updateStorageDatabase = {};
            this.outputError = {};
            this.adaptFilename = options.adaptFilename;
            this.updateStorageDatabase = options.updateStorageDatabase;
            this.outputError = options.outputError;
        }
        FileHandler.fnLocalStorageName = function (name, defaultExtension) {
            // modify name so we do not clash with localstorage methods/properites
            if (name.indexOf(".") < 0) { // no dot inside name?
                name += "." + (defaultExtension || ""); // append dot or default extension
            }
            return name;
        };
        FileHandler.createMinimalAmsdosHeader = function (type, start, length) {
            return {
                typeString: type,
                start: start,
                length: length
            };
        };
        FileHandler.joinMeta = function (meta) {
            return [
                FileHandler.metaIdent,
                meta.typeString,
                meta.start,
                meta.length,
                meta.entry
            ].join(";");
        };
        // starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
        FileHandler.prototype.processZipFile = function (uint8Array, name, imported) {
            var zip;
            try {
                zip = new ZipFile_1.ZipFile(uint8Array, name); // rather data
            }
            catch (e) {
                Utils_23.Utils.console.error(e);
                if (e instanceof Error) {
                    this.outputError(e, true);
                }
            }
            if (zip) {
                var zipDirectory = zip.getZipDirectory(), entries = Object.keys(zipDirectory);
                for (var i = 0; i < entries.length; i += 1) {
                    var name2 = entries[i];
                    var data2 = void 0;
                    try {
                        data2 = zip.readData(name2);
                    }
                    catch (e) {
                        Utils_23.Utils.console.error(e);
                        if (e instanceof Error) { // eslint-disable-line max-depth
                            this.outputError(e, true);
                        }
                    }
                    if (data2) {
                        this.fnLoad2(data2, name2, "", imported); // type not known but without meta
                    }
                }
            }
        };
        FileHandler.prototype.processDskFile = function (data, name, imported) {
            try {
                var dsk = new DiskImage_1.DiskImage({
                    data: data,
                    diskName: name
                }), dir = dsk.readDirectory(), diskFiles = Object.keys(dir);
                for (var i = 0; i < diskFiles.length; i += 1) {
                    var fileName = diskFiles[i];
                    try { // eslint-disable-line max-depth
                        data = dsk.readFile(dir[fileName]);
                        this.fnLoad2(data, fileName, "", imported); // recursive
                    }
                    catch (e) {
                        Utils_23.Utils.console.error(e);
                        if (e instanceof Error) { // eslint-disable-line max-depth
                            this.outputError(e, true);
                        }
                    }
                }
            }
            catch (e) {
                Utils_23.Utils.console.error(e);
                if (e instanceof Error) {
                    this.outputError(e, true);
                }
            }
        };
        FileHandler.prototype.fnLoad2 = function (data, name, type, imported) {
            if (data instanceof Uint8Array) { // FileSelect filereader zip file?
                this.processZipFile(data, name, imported);
                return;
            }
            var header, storageName = this.adaptFilename(name, "FILE");
            storageName = FileHandler.fnLocalStorageName(storageName);
            if (type === "") { // detetermine type
                header = DiskImage_1.DiskImage.parseAmsdosHeader(data);
                if (header) {
                    type = "H"; // with header
                    data = data.substring(0x80); // remove header
                }
                else if (FileHandler.reRegExpIsText.test(data)) {
                    type = "A";
                }
                else if (DiskImage_1.DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
                    type = "X";
                }
            }
            switch (type) {
                case "A": // "text/plain"
                case "B": // binary?
                    header = FileHandler.createMinimalAmsdosHeader(type, 0, data.length);
                    break;
                case "Z": // zip file?
                    this.processZipFile(Utils_23.Utils.string2Uint8Array(data), name, imported);
                    break;
                case "X": // dsk file?
                    this.processDskFile(data, name, imported);
                    break;
                case "H": // with header?
                    break;
                default:
                    Utils_23.Utils.console.warn("fnLoad2: " + name + ": Unknown file type: " + type + ", assuming B");
                    header = FileHandler.createMinimalAmsdosHeader("B", 0, data.length);
                    break;
            }
            if (header) {
                var meta = FileHandler.joinMeta(header);
                try {
                    Utils_23.Utils.localStorage.setItem(storageName, meta + "," + data);
                    this.updateStorageDatabase("set", storageName);
                    Utils_23.Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
                    imported.push(name);
                }
                catch (e) { // maybe quota exceeded
                    Utils_23.Utils.console.error(e);
                    if (e instanceof Error) {
                        if (e.name === "QuotaExceededError") {
                            e.shortMessage = storageName + ": Quota exceeded";
                        }
                        this.outputError(e, true);
                    }
                }
            }
        };
        FileHandler.metaIdent = "CPCBasic";
        FileHandler.reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
        return FileHandler;
    }());
    exports.FileHandler = FileHandler;
});
// FileSelect.ts - FileSelect
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("FileSelect", ["require", "exports", "Utils", "View"], function (require, exports, Utils_24, View_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSelect = void 0;
    var FileSelect = /** @class */ (function () {
        function FileSelect(options) {
            this.fnEndOfImport = {};
            this.fnLoad2 = {};
            this.files = {}; // = dataTransfer ? dataTransfer.files : ((event.target as any).files as FileList), // dataTransfer for drag&drop, target.files for file input
            this.fileIndex = 0;
            this.imported = []; // imported file names
            this.file = {}; // current file
            this.fnEndOfImport = options.fnEndOfImport;
            this.fnLoad2 = options.fnLoad2;
        }
        FileSelect.prototype.fnReadNextFile = function (reader) {
            if (this.fileIndex < this.files.length) {
                var file = this.files[this.fileIndex];
                this.fileIndex += 1;
                var lastModified = file.lastModified, lastModifiedDate = lastModified ? new Date(lastModified) : file.lastModifiedDate, // lastModifiedDate deprecated, but for old IE
                text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");
                Utils_24.Utils.console.log(text);
                if (file.type === "text/plain") {
                    reader.readAsText(file);
                }
                else if (file.type === "application/x-zip-compressed") {
                    reader.readAsArrayBuffer(file);
                }
                else {
                    reader.readAsDataURL(file);
                }
                this.file = file;
            }
            else {
                this.fnEndOfImport(this.imported);
            }
        };
        FileSelect.prototype.fnOnLoad = function (event) {
            var reader = event.target, file = this.file, name = file.name;
            var data = (reader && reader.result) || null, type = file.type;
            if (type === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
                type = "Z";
                this.fnLoad2(new Uint8Array(data), name, type, this.imported);
            }
            else if (typeof data === "string") {
                if (type === "text/plain") { // "text/plain"
                    type = "A";
                }
                else if (data.indexOf("data:") === 0) {
                    // check for meta info in data: data:application/octet-stream;base64, or: data:text/javascript;base64,
                    var index = data.indexOf(",");
                    if (index >= 0) {
                        var info1 = data.substring(0, index);
                        // remove meta prefix
                        data = data.substring(index + 1);
                        if (info1.indexOf("base64") >= 0) {
                            data = Utils_24.Utils.atob(data); // decode base64
                        }
                        if (info1.indexOf("text/") >= 0) {
                            type = "A";
                        }
                    }
                }
                this.fnLoad2(data, name, type, this.imported);
            }
            else {
                Utils_24.Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        FileSelect.prototype.fnErrorHandler = function (event, file) {
            var reader = event.target;
            var msg = "fnErrorHandler: Error reading file " + file.name;
            if (reader && reader.error !== null) {
                if (reader.error.NOT_FOUND_ERR) {
                    msg += ": File not found";
                }
                else if (reader.error.ABORT_ERR) {
                    msg = ""; // nothing
                }
            }
            if (msg) {
                Utils_24.Utils.console.warn(msg);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        // https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
        // https://www.w3.org/TR/file-upload/#dfn-filereader
        FileSelect.prototype.fnHandleFileSelect = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var dataTransfer = event.dataTransfer, files = dataTransfer ? dataTransfer.files : View_6.View.getEventTarget(event).files; // dataTransfer for drag&drop, target.files for file input
            if (!files || !files.length) {
                Utils_24.Utils.console.error("fnHandleFileSelect: No files!");
                return;
            }
            this.files = files;
            this.fileIndex = 0;
            this.imported.length = 0;
            if (window.FileReader) {
                var reader = new FileReader();
                reader.onerror = this.fnErrorHandler.bind(this);
                reader.onload = this.fnOnLoad.bind(this);
                this.fnReadNextFile(reader);
            }
            else {
                Utils_24.Utils.console.warn("fnHandleFileSelect: FileReader API not supported.");
            }
        };
        //TODO: can we use View.attachEventHandler() somehow?
        FileSelect.prototype.addFileSelectHandler = function (element, type) {
            element.addEventListener(type, this.fnHandleFileSelect.bind(this), false);
        };
        return FileSelect;
    }());
    exports.FileSelect = FileSelect;
});
// Controller.ts - Controller
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("Controller", ["require", "exports", "Utils", "BasicFormatter", "BasicLexer", "BasicParser", "BasicTokenizer", "Canvas", "CodeGeneratorBasic", "CodeGeneratorJs", "CodeGeneratorToken", "CommonEventHandler", "cpcCharset", "CpcVm", "CpcVmRsx", "Diff", "DiskImage", "FileHandler", "FileSelect", "InputStack", "Keyboard", "TextCanvas", "VirtualKeyboard", "Sound", "Variables", "View"], function (require, exports, Utils_25, BasicFormatter_1, BasicLexer_1, BasicParser_2, BasicTokenizer_1, Canvas_1, CodeGeneratorBasic_1, CodeGeneratorJs_1, CodeGeneratorToken_1, CommonEventHandler_1, cpcCharset_1, CpcVm_1, CpcVmRsx_1, Diff_1, DiskImage_2, FileHandler_1, FileSelect_1, InputStack_1, Keyboard_1, TextCanvas_1, VirtualKeyboard_1, Sound_1, Variables_1, View_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Controller = void 0;
    var Controller = /** @class */ (function () {
        function Controller(model, view) {
            this.fnScript = undefined; // eslint-disable-line @typescript-eslint/ban-types
            this.timeoutHandlerActive = false;
            this.nextLoopTimeOut = 0; // next timeout for the main loop
            this.initialLoopTimeout = 0;
            this.inputSet = false;
            this.inputStack = new InputStack_1.InputStack();
            this.sound = new Sound_1.Sound({
                AudioContextConstructor: window.AudioContext
            });
            /* eslint-disable no-invalid-this */
            this.handlers = {
                timer: this.fnTimer,
                waitKey: this.fnWaitKey,
                waitFrame: this.fnWaitFrame,
                waitSound: this.fnWaitSound,
                waitInput: this.fnWaitInput,
                fileCat: this.fnFileCat,
                fileDir: this.fnFileDir,
                fileEra: this.fnFileEra,
                fileRen: this.fnFileRen,
                error: Controller.fnDummy,
                onError: this.fnOnError,
                stop: Controller.fnDummy,
                "break": Controller.fnDummy,
                escape: Controller.fnDummy,
                renumLines: this.fnRenumLines,
                deleteLines: this.fnDeleteLines,
                end: Controller.fnDummy,
                editLine: this.fnEditLine,
                list: this.fnList,
                fileLoad: this.fnFileLoad,
                fileSave: this.fnFileSave,
                "new": this.fnNew,
                run: this.fnRun,
                parse: this.fnParse,
                parseRun: this.fnParseRun,
                reset: this.fnReset
            };
            this.fnRunLoopHandler = this.fnRunLoop.bind(this);
            this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
            this.fnWaitInputHandler = this.fnWaitInput.bind(this);
            this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
            this.fnDirectInputHandler = this.fnDirectInput.bind(this);
            this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
            this.model = model;
            this.view = view;
            this.commonEventHandler = new CommonEventHandler_1.CommonEventHandler(model, view, this);
            this.view.attachEventHandler("click", this.commonEventHandler);
            this.view.attachEventHandler("change", this.commonEventHandler);
            view.setHidden("consoleBox", !model.getProperty("showConsole"));
            view.setHidden("inputArea", !model.getProperty("showInput"));
            view.setHidden("inp2Area", !model.getProperty("showInp2"));
            view.setHidden("outputArea", !model.getProperty("showOutput"));
            view.setHidden("resultArea", !model.getProperty("showResult"));
            this.textCanvas = new TextCanvas_1.TextCanvas({
                onClickKey: this.fnPutKeyInBufferHandler
            });
            view.setHidden("textArea", !model.getProperty("showText"));
            view.setHidden("variableArea", !model.getProperty("showVariable"));
            view.setHidden("kbdArea", !model.getProperty("showKbd"), "flex");
            view.setHidden("kbdLayoutArea", model.getProperty("showKbd"), "inherit"); // kbd visible => kbdlayout invisible
            view.setHidden("cpcArea", false); // make sure canvas is not hidden (allows to get width, height)
            var palette = model.getProperty("palette");
            this.canvas = new Canvas_1.Canvas({
                charset: cpcCharset_1.cpcCharset,
                colors: palette === "grey" ? Controller.paletteGrey : Controller.paletteColors,
                onClickKey: this.fnPutKeyInBufferHandler
            });
            view.setHidden("cpcArea", !model.getProperty("showCpc"));
            view.setHidden("settingsArea", !model.getProperty("showSettings"), "flex");
            view.setHidden("galleryArea", !model.getProperty("showGallery"), "flex");
            view.setHidden("convertArea", !model.getProperty("showConvert"), "flex");
            view.setInputChecked("implicitLinesInput", model.getProperty("implicitLines"));
            view.setInputChecked("arrayBoundsInput", model.getProperty("arrayBounds"));
            this.variables = new Variables_1.Variables({
                arrayBounds: model.getProperty("arrayBounds")
            });
            view.setInputChecked("traceInput", model.getProperty("trace"));
            view.setInputValue("speedInput", String(model.getProperty("speed")));
            this.fnSpeed();
            var kbdLayout = model.getProperty("kbdLayout");
            view.setSelectValue("kbdLayoutSelect", kbdLayout);
            this.commonEventHandler.onKbdLayoutSelectChange();
            this.keyboard = new Keyboard_1.Keyboard({
                fnOnEscapeHandler: this.fnOnEscapeHandler
            });
            if (this.model.getProperty("showKbd")) { // maybe we need to draw virtual keyboard
                this.virtualKeyboardCreate();
            }
            this.commonEventHandler.fnSetUserAction(this.onUserAction.bind(this)); // check first user action, also if sound is not yet on
            this.vm = new CpcVm_1.CpcVm({
                canvas: this.canvas,
                textCanvas: this.textCanvas,
                keyboard: this.keyboard,
                sound: this.sound,
                variables: this.variables
            });
            this.vm.vmReset();
            this.rsx = new CpcVmRsx_1.CpcVmRsx(this.vm);
            this.vm.vmSetRsxClass(this.rsx);
            this.noStop = Object.assign({}, this.vm.vmGetStopObject());
            this.savedStop = {
                reason: "",
                priority: 0,
                paras: {
                    command: "",
                    stream: 0,
                    line: 0,
                    first: 0,
                    last: 0 // unused
                }
            }; // backup of stop object
            this.setStopObject(this.noStop);
            this.codeGeneratorJs = new CodeGeneratorJs_1.CodeGeneratorJs({
                lexer: new BasicLexer_1.BasicLexer({
                    keywords: BasicParser_2.BasicParser.keywords
                }),
                parser: new BasicParser_2.BasicParser(),
                trace: model.getProperty("trace"),
                rsx: this.rsx,
                implicitLines: model.getProperty("implicitLines")
            });
            if (model.getProperty("sound")) { // activate sound needs user action
                this.setSoundActive(); // activate in waiting state
            }
            if (model.getProperty("showCpc")) {
                this.canvas.startUpdateCanvas();
            }
            if (model.getProperty("showText")) {
                this.textCanvas.startUpdateCanvas();
            }
            this.initDropZone();
            var example = model.getProperty("example");
            view.setSelectValue("exampleSelect", example);
            this.initDatabases();
        }
        Controller.prototype.initDatabases = function () {
            var model = this.model, databases = {}, databaseDirs = model.getProperty("databaseDirs").split(",");
            for (var i = 0; i < databaseDirs.length; i += 1) {
                var databaseDir = databaseDirs[i], parts = databaseDir.split("/"), name_12 = parts[parts.length - 1];
                databases[name_12] = {
                    text: name_12,
                    title: databaseDir,
                    src: databaseDir
                };
            }
            this.model.addDatabases(databases);
            this.setDatabaseSelectOptions();
        };
        Controller.prototype.onUserAction = function ( /* event, id */) {
            this.commonEventHandler.fnSetUserAction(undefined); // deactivate user action
            this.sound.setActivatedByUser();
            this.setSoundActive();
        };
        // Also called from index file 0index.js
        Controller.prototype.addIndex = function (dir, input) {
            input = input.trim();
            var index = JSON.parse(input);
            for (var i = 0; i < index.length; i += 1) {
                index[i].dir = dir;
                this.model.setExample(index[i]);
            }
        };
        // Also called from example files xxxxx.js
        Controller.prototype.addItem = function (key, input) {
            if (!key) { // maybe ""
                key = (document.currentScript && document.currentScript.getAttribute("data-key")) || this.model.getProperty("example");
                // on IE we can just get the current example
            }
            input = input.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
            // beware of data files ending with newlines! (do not use trimEnd)
            var example = this.model.getExample(key);
            example.key = key; // maybe changed
            example.script = input;
            example.loaded = true;
            Utils_25.Utils.console.log("addItem:", key);
            return key;
        };
        Controller.prototype.setDatabaseSelectOptions = function () {
            var select = "databaseSelect", items = [], databases = this.model.getAllDatabases(), database = this.model.getProperty("database");
            for (var value in databases) {
                if (databases.hasOwnProperty(value)) {
                    var db = databases[value], item = {
                        value: value,
                        text: db.text,
                        title: db.title,
                        selected: value === database
                    };
                    items.push(item);
                }
            }
            this.view.setSelectOptions(select, items);
        };
        Controller.getPathFromExample = function (example) {
            var index = example.lastIndexOf("/");
            var path = "";
            if (index >= 0) {
                path = example.substring(0, index);
            }
            return path;
        };
        Controller.getNameFromExample = function (example) {
            var index = example.lastIndexOf("/");
            var name = example;
            if (index >= 0) {
                name = example.substring(index + 1);
            }
            return name;
        };
        Controller.prototype.setDirectorySelectOptions = function () {
            var select = "directorySelect", items = [], allExamples = this.model.getAllExamples(), examplePath = Controller.getPathFromExample(this.model.getProperty("example")), directorySeen = {};
            for (var key in allExamples) {
                if (allExamples.hasOwnProperty(key)) {
                    var exampleEntry = allExamples[key], value = Controller.getPathFromExample(exampleEntry.key);
                    if (!directorySeen[value]) {
                        var item = {
                            value: value,
                            text: value,
                            title: value,
                            selected: value === examplePath
                        };
                        items.push(item);
                        directorySeen[value] = true;
                    }
                }
            }
            this.view.setSelectOptions(select, items);
        };
        Controller.prototype.setExampleSelectOptions = function () {
            var maxTitleLength = 160, maxTextLength = 60, // (32 visible?)
            select = "exampleSelect", items = [], exampleName = Controller.getNameFromExample(this.model.getProperty("example")), allExamples = this.model.getAllExamples(), directoryName = this.view.getSelectValue("directorySelect");
            var exampleSelected = false;
            for (var key in allExamples) {
                if (allExamples.hasOwnProperty(key) && (Controller.getPathFromExample(key) === directoryName)) {
                    var exampleEntry = allExamples[key], exampleName2 = Controller.getNameFromExample(exampleEntry.key);
                    if (exampleEntry.meta !== "D") { // skip data files
                        var title = (exampleName2 + ": " + exampleEntry.title).substring(0, maxTitleLength), item = {
                            value: exampleName2,
                            title: title,
                            text: title.substring(0, maxTextLength),
                            selected: exampleName2 === exampleName
                        };
                        if (item.selected) {
                            exampleSelected = true;
                        }
                        items.push(item);
                    }
                }
            }
            if (!exampleSelected && items.length) {
                items[0].selected = true; // if example is not found, select first element
            }
            this.view.setSelectOptions(select, items);
        };
        Controller.prototype.setGalleryAreaInputs = function () {
            var database = this.model.getDatabase(), directory = this.view.getSelectValue("directorySelect"), options = this.view.getSelectOptions("exampleSelect"), inputs = [];
            for (var i = 0; i < options.length; i += 1) {
                var item = options[i], input = {
                    value: item.value,
                    title: item.title,
                    checked: item.selected,
                    imgUrl: database.src + "/" + directory + "/img/" + item.value + ".png"
                };
                inputs.push(input);
            }
            this.view.setAreaInputList("galleryAreaItems", inputs);
        };
        Controller.prototype.setVarSelectOptions = function (select, variables) {
            var maxVarLength = 35, varNames = variables.getAllVariableNames(), items = [], fnSortByStringProperties = function (a, b) {
                var x = a.value, y = b.value;
                if (x < y) {
                    return -1;
                }
                else if (x > y) {
                    return 1;
                }
                return 0;
            };
            for (var i = 0; i < varNames.length; i += 1) {
                var key = varNames[i], value = variables.getVariable(key), title = key + "=" + value;
                var strippedTitle = title.substring(0, maxVarLength); // limit length
                if (title !== strippedTitle) {
                    strippedTitle += " ...";
                }
                var item = {
                    value: key,
                    text: strippedTitle,
                    title: strippedTitle,
                    selected: false
                };
                item.text = item.title;
                items.push(item);
            }
            items.sort(fnSortByStringProperties);
            this.view.setSelectOptions(select, items);
        };
        Controller.prototype.updateStorageDatabase = function (action, key) {
            var database = this.model.getProperty("database"), storage = Utils_25.Utils.localStorage;
            if (database !== "storage") {
                this.model.setProperty("database", "storage"); // switch to storage database
            }
            var dir;
            if (!key) { // no key => get all
                dir = Controller.fnGetStorageDirectoryEntries();
            }
            else {
                dir = [key];
            }
            for (var i = 0; i < dir.length; i += 1) {
                key = dir[i];
                if (action === "remove") {
                    this.model.removeExample(key);
                }
                else if (action === "set") {
                    var example = this.model.getExample(key);
                    if (!example) {
                        var dataString = storage.getItem(key) || "", data = Controller.splitMeta(dataString);
                        example = {
                            key: key,
                            title: "",
                            meta: data.meta.typeString // currently we take only the type
                        };
                        this.model.setExample(example);
                    }
                }
                else {
                    Utils_25.Utils.console.error("updateStorageDatabase: unknown action", action);
                }
            }
            if (database === "storage") {
                this.setDirectorySelectOptions();
                this.setExampleSelectOptions();
            }
            else {
                this.model.setProperty("database", database); // restore database
            }
        };
        Controller.prototype.removeKeyBoardHandler = function () {
            this.keyboard.setKeyDownHandler();
        };
        Controller.prototype.setInputText = function (input, keepStack) {
            this.view.setAreaValue("inputText", input);
            if (!keepStack) {
                this.fnInitUndoRedoButtons();
            }
            else {
                this.fnUpdateUndoRedoButtons();
            }
        };
        Controller.prototype.invalidateScript = function () {
            this.fnScript = undefined;
        };
        Controller.prototype.fnWaitForContinue = function () {
            var stream = 0, key = this.keyboard.getKeyFromBuffer();
            if (key !== "") {
                this.vm.cursor(stream, 0);
                this.removeKeyBoardHandler();
                this.startContinue();
            }
        };
        Controller.prototype.fnOnEscape = function () {
            var stop = this.vm.vmGetStopObject(), stream = 0;
            if (this.vm.vmOnBreakContSet()) {
                // ignore break
            }
            else if (stop.reason === "direct" || this.vm.vmOnBreakHandlerActive()) {
                stop.paras.input = "";
                var msg = "*Break*\r\n";
                this.vm.print(stream, msg);
            }
            else if (stop.reason !== "escape") { // first escape?
                this.vm.cursor(stream, 1);
                this.keyboard.clearInput();
                this.keyboard.setKeyDownHandler(this.fnWaitForContinue.bind(this));
                this.setStopObject(stop);
                this.vm.vmStop("escape", 85, false, {
                    command: "escape",
                    stream: stream,
                    first: 0,
                    last: 0,
                    line: this.vm.line
                });
            }
            else { // second escape
                this.removeKeyBoardHandler();
                this.vm.cursor(stream, 0);
                var savedStop = this.getStopObject();
                if (savedStop.reason === "waitInput") { // sepcial handling: set line to repeat input
                    this.vm.vmGoto(savedStop.paras.line);
                }
                if (!this.vm.vmEscape()) {
                    this.vm.vmStop("", 0, true); // continue program, in break handler?
                    this.setStopObject(this.noStop);
                }
                else {
                    this.vm.vmStop("stop", 0, true); // stop
                    var msg = "Break in " + this.vm.line + "\r\n";
                    this.vm.print(stream, msg);
                }
            }
            this.startMainLoop();
        };
        Controller.prototype.fnWaitSound = function () {
            var stop = this.vm.vmGetStopObject();
            this.vm.vmLoopCondition(); // update nextFrameTime, timers, inks; schedule sound: free queue
            if (this.sound.isActivatedByUser()) { // only if activated
                var soundDataList = this.vm.vmGetSoundData();
                while (soundDataList.length && this.sound.testCanQueue(soundDataList[0].state)) {
                    var soundData = soundDataList.shift();
                    this.sound.sound(soundData);
                }
                if (!soundDataList.length) {
                    if (stop.reason === "waitSound") { // only for this reason
                        this.vm.vmStop("", 0, true); // no more wait
                    }
                }
            }
            this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
        };
        Controller.prototype.fnWaitKey = function () {
            var key = this.keyboard.getKeyFromBuffer();
            if (key !== "") { // do we have a key from the buffer already?
                Utils_25.Utils.console.log("Wait for key:", key);
                this.vm.vmStop("", 0, true);
                this.removeKeyBoardHandler();
            }
            else {
                this.fnWaitSound(); // sound and blinking events
                this.keyboard.setKeyDownHandler(this.fnWaitKeyHandler); // wait until keypress handler (for call &bb18)
            }
            return key;
        };
        Controller.prototype.fnWaitInput = function () {
            var stop = this.vm.vmGetStopObject(), inputParas = stop.paras, stream = inputParas.stream;
            var input = inputParas.input, key;
            if (input === undefined || stream === undefined) {
                this.outputError(this.vm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"), true);
                return;
            }
            do {
                key = this.keyboard.getKeyFromBuffer(); // (inkey$ could insert frame if checked too often)
                // chr13 shows as empty string!
                switch (key) {
                    case "": // no key?
                        break;
                    case "\r": // cr (\x0d)
                        break;
                    case "\x10": // DLE (clear character under cursor)
                        key = "\x07"; // currently ignore (BEL)
                        break;
                    case "\x7f": // del
                        if (input.length) {
                            input = input.slice(0, -1);
                            key = "\x08\x10"; // use BS and DLE
                        }
                        else {
                            key = "\x07"; // ignore BS, use BEL
                        }
                        break;
                    case "\xe0": // copy
                        key = this.vm.copychr$(stream);
                        if (key.length) {
                            input += key;
                            key = "\x09"; // TAB
                        }
                        else {
                            key = "\x07"; // ignore (BEL)
                        }
                        break;
                    case "\xf0": // cursor up
                        if (!input.length) {
                            key = "\x0b"; // VT
                        }
                        else {
                            key = "\x07"; // ignore (BEL)
                        }
                        break;
                    case "\xf1": // cursor down
                        if (!input.length) {
                            key = "\x0a"; // LF
                        }
                        else {
                            key = "\x07"; // ignore (BEL)
                        }
                        break;
                    case "\xf2": // cursor left
                        if (!input.length) {
                            key = "\x08"; // BS
                        }
                        else {
                            key = "\x07"; // ignore (BEL) TODO
                        }
                        break;
                    case "\xf3": // cursor right
                        if (!input.length) {
                            key = "\x09"; // TAB
                        }
                        else {
                            key = "\x07"; // ignore (BEL) TODO
                        }
                        break;
                    case "\xf4": // shift+cursor up
                        key = ""; // currently ignore
                        break;
                    case "\xf5": // shift+cursor down
                        key = ""; // currently ignore
                        break;
                    case "\xf6": // shift+cursor left
                        key = ""; // currently ignore
                        break;
                    case "\xf7": // shift+cursor right
                        key = ""; // currently ignore
                        break;
                    case "\xf8": // ctrl+cursor up
                        key = ""; // currently ignore
                        break;
                    case "\xf9": // ctrl+cursor down
                        key = ""; // currently ignore
                        break;
                    case "\xfa": // ctrl+cursor left
                        key = ""; // currently ignore
                        break;
                    case "\xfb": // ctrl+cursor right
                        key = ""; // currently ignore
                        break;
                    default:
                        input += key;
                        if (key < "\x20") { // control code
                            key = "\x01" + key; // print control code (do not execute)
                        }
                        break;
                }
                if (key && key !== "\r") {
                    this.vm.print(stream, key);
                }
            } while (key !== "" && key !== "\r"); // get all keys until CR or no more key
            inputParas.input = input;
            var inputOk = false;
            if (key === "\r") {
                Utils_25.Utils.console.log("fnWaitInput:", input, "reason", stop.reason);
                if (!inputParas.noCRLF) {
                    this.vm.print(stream, "\r\n");
                }
                if (inputParas.fnInputCallback) {
                    inputOk = inputParas.fnInputCallback();
                }
                else {
                    inputOk = true;
                }
                if (inputOk) {
                    this.removeKeyBoardHandler();
                    if (stop.reason === "waitInput") { // only for this reason
                        this.vm.vmStop("", 0, true); // no more wait
                    }
                    else {
                        this.startContinue();
                    }
                }
            }
            if (!inputOk) {
                if (stop.reason === "waitInput") { // only for this reason
                    this.fnWaitSound(); // sound and blinking events
                }
                this.keyboard.setKeyDownHandler(this.fnWaitInputHandler); // make sure it is set
            }
        };
        Controller.parseLineNumber = function (line) {
            var lineNumber = parseInt(line, 10);
            if (lineNumber < 0 || lineNumber > 65535) {
                // we must not throw an error
            }
            return lineNumber;
        };
        Controller.addLineNumbers = function (input) {
            var lineParts = input.split("\n");
            var lastLine = 0;
            for (var i = 0; i < lineParts.length; i += 1) {
                var lineNum = parseInt(lineParts[i], 10);
                if (isNaN(lineNum)) {
                    lineNum = lastLine + 1;
                    lineParts[i] = String(lastLine + 1) + " " + lineParts[i];
                }
                lastLine = lineNum;
            }
            return lineParts.join("\n");
        };
        Controller.prototype.splitLines = function (input) {
            if (this.model.getProperty("implicitLines")) {
                input = Controller.addLineNumbers(input);
            }
            // get numbers starting at the beginning of a line (allows some simple multi line strings)
            var lineParts = input.split(/^(\s*\d+)/m), lines = [];
            if (lineParts[0] === "") {
                lineParts.shift(); // remove first empty item
            }
            for (var i = 0; i < lineParts.length; i += 2) {
                var number = lineParts[i];
                var content = lineParts[i + 1];
                if (content.endsWith("\n")) {
                    content = content.substring(0, content.length - 1);
                }
                lines.push(number + content);
            }
            return lines;
        };
        // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
        Controller.prototype.mergeScripts = function (script1, script2) {
            var lines1 = this.splitLines(Utils_25.Utils.stringTrimEnd(script1)), lines2 = this.splitLines(Utils_25.Utils.stringTrimEnd(script2));
            var result = [], lineNumber1, lineNumber2;
            while (lines1.length && lines2.length) {
                lineNumber1 = lineNumber1 || Controller.parseLineNumber(lines1[0]);
                lineNumber2 = lineNumber2 || Controller.parseLineNumber(lines2[0]);
                if (lineNumber1 < lineNumber2) { // use line from script1
                    result.push(lines1.shift());
                    lineNumber1 = 0;
                }
                else { // use line from script2
                    var line2 = lines2.shift();
                    if (String(lineNumber2) !== line2) { // line not empty?
                        result.push(line2);
                    }
                    if (lineNumber1 === lineNumber2) { // same line number in script1 and script2
                        lines1.shift(); // ignore line from script1 (overwrite it)
                        lineNumber1 = 0;
                    }
                    lineNumber2 = 0;
                }
            }
            result = result.concat(lines1, lines2); // put in remaining lines from one source
            if (result.length >= 2) {
                if (result[result.length - 2] === "" && result[result.length - 1] === "") {
                    result.pop(); // remove additional newline
                }
            }
            return result.join("\n");
        };
        // get line range from a script with sorted line numbers
        Controller.prototype.fnGetLinesInRange = function (script, firstLine, lastLine) {
            var lines = script ? this.splitLines(script) : [];
            while (lines.length && parseInt(lines[0], 10) < firstLine) {
                lines.shift();
            }
            if (lines.length && lines[lines.length - 1] === "") { // trailing empty line?
                lines.pop(); // remove
            }
            while (lines.length && parseInt(lines[lines.length - 1], 10) > lastLine) {
                lines.pop();
            }
            return lines;
        };
        Controller.fnPrepareMaskRegExp = function (mask) {
            mask = mask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
            mask = mask.replace(/\?/g, ".");
            mask = mask.replace(/\*/g, ".*");
            return new RegExp("^" + mask + "$");
        };
        Controller.prototype.fnGetExampleDirectoryEntries = function (mask) {
            var dir = [], allExamples = this.model.getAllExamples();
            var regExp;
            if (mask) {
                regExp = Controller.fnPrepareMaskRegExp(mask);
            }
            for (var key in allExamples) {
                if (allExamples.hasOwnProperty(key)) {
                    var example = allExamples[key], key2 = example.key, matchKey2 = key2 + ((key2.indexOf(".") < 0) ? "." : "");
                    if (!regExp || regExp.test(matchKey2)) {
                        dir.push(key2);
                    }
                }
            }
            return dir;
        };
        Controller.fnGetStorageDirectoryEntries = function (mask) {
            var storage = Utils_25.Utils.localStorage, dir = [];
            var regExp;
            if (mask) {
                regExp = Controller.fnPrepareMaskRegExp(mask);
            }
            for (var i = 0; i < storage.length; i += 1) {
                var key = storage.key(i);
                if (key !== null && storage[key].startsWith(this.metaIdent)) { // take only cpcBasic files
                    if (!regExp || regExp.test(key)) {
                        dir.push(key);
                    }
                }
            }
            return dir;
        };
        Controller.prototype.fnPrintDirectoryEntries = function (stream, dir, sort) {
            // first, format names
            for (var i = 0; i < dir.length; i += 1) {
                var parts = dir[i].split(".");
                dir[i] = parts[0].padEnd(8, " ") + "." + (parts.length >= 2 ? parts[1] : "").padEnd(3, " ");
                /*
                if (parts.length === 2) {
                    dir[i] = parts[0].padEnd(8, " ") + "." + parts[1].padEnd(3, " ");
                }
                */
            }
            if (sort) {
                dir.sort();
            }
            this.vm.print(stream, "\r\nDrive A: user  0\r\n\r\n");
            for (var i = 0; i < dir.length; i += 1) {
                var key = dir[i] + "  ";
                this.vm.print(stream, key);
            }
            this.vm.print(stream, "\r\n\r\n999K free\r\n\r\n");
        };
        Controller.prototype.fnFileCat = function (paras) {
            var stream = paras.stream, dirList = Controller.fnGetStorageDirectoryEntries();
            this.fnPrintDirectoryEntries(stream, dirList, true);
            // currently only from localstorage
            this.vm.vmStop("", 0, true);
        };
        Controller.prototype.fnFileDir = function (paras) {
            var stream = paras.stream, example = this.model.getProperty("example"), lastSlash = example.lastIndexOf("/");
            var fileMask = paras.fileMask ? Controller.fnLocalStorageName(paras.fileMask) : "";
            var dirList = Controller.fnGetStorageDirectoryEntries(fileMask);
            var path = "";
            if (lastSlash >= 0) {
                path = example.substring(0, lastSlash) + "/";
                fileMask = path + (fileMask ? fileMask : "*.*"); // only in same directory
            }
            var fileExists = {};
            for (var i = 0; i < dirList.length; i += 1) {
                fileExists[dirList[i]] = true;
            }
            var dirListEx = this.fnGetExampleDirectoryEntries(fileMask); // also from examples
            for (var i = 0; i < dirListEx.length; i += 1) {
                var file = dirListEx[i].substring(path.length); // remove preceding path including "/"
                if (!fileExists[file]) { // ignore duplicates
                    fileExists[file] = true;
                    dirList.push(file);
                }
            }
            this.fnPrintDirectoryEntries(stream, dirList, false);
            this.vm.vmStop("", 0, true);
        };
        Controller.prototype.fnFileEra = function (paras) {
            var stream = paras.stream, storage = Utils_25.Utils.localStorage, fileMask = Controller.fnLocalStorageName(paras.fileMask || ""), dir = Controller.fnGetStorageDirectoryEntries(fileMask);
            if (!dir.length) {
                this.vm.print(stream, fileMask + " not found\r\n");
            }
            for (var i = 0; i < dir.length; i += 1) {
                var name_13 = dir[i];
                if (storage.getItem(name_13) !== null) {
                    storage.removeItem(name_13);
                    this.updateStorageDatabase("remove", name_13);
                    if (Utils_25.Utils.debug > 0) {
                        Utils_25.Utils.console.debug("fnEraseFile: name=" + name_13 + ": removed from localStorage");
                    }
                }
                else {
                    this.vm.print(stream, name_13 + " not found\r\n");
                    Utils_25.Utils.console.warn("fnEraseFile: file not found in localStorage:", name_13);
                }
            }
            this.vm.vmStop("", 0, true);
        };
        Controller.prototype.fnFileRen = function (paras) {
            var stream = paras.stream, storage = Utils_25.Utils.localStorage, newName = Controller.fnLocalStorageName(paras.newName), oldName = Controller.fnLocalStorageName(paras.oldName), item = storage.getItem(oldName);
            if (item !== null) {
                if (!storage.getItem(newName)) {
                    storage.setItem(newName, item);
                    this.updateStorageDatabase("set", newName);
                    storage.removeItem(oldName);
                    this.updateStorageDatabase("remove", oldName);
                }
                else {
                    this.vm.print(stream, oldName + " already exists\r\n");
                }
            }
            else {
                this.vm.print(stream, oldName + " not found\r\n");
            }
            this.vm.vmStop("", 0, true);
        };
        // Hisoft Devpac GENA3 Z80 Assember (http://www.cpcwiki.eu/index.php/Hisoft_Devpac)
        Controller.asmGena3Convert = function (data) {
            var fnUInt16 = function (pos2) {
                return data.charCodeAt(pos2) + data.charCodeAt(pos2 + 1) * 256;
            }, length = data.length;
            var pos = 0, out = "";
            pos += 4; // what is the meaning of these bytes?
            while (pos < length) {
                var lineNum = fnUInt16(pos);
                pos += 2;
                var index1 = data.indexOf("\r", pos); // EOL marker 0x0d
                if (index1 < 0) {
                    index1 = length;
                }
                var index2 = data.indexOf("\x1c", pos); // EOL marker 0x1c
                if (index2 < 0) {
                    index2 = length;
                }
                index1 = Math.min(index1, index2);
                out += lineNum + " " + data.substring(pos, index1) + "\n";
                pos = index1 + 1;
            }
            return out;
        };
        Controller.prototype.decodeTokenizedBasic = function (input) {
            if (!this.basicTokenizer) {
                this.basicTokenizer = new BasicTokenizer_1.BasicTokenizer();
            }
            return this.basicTokenizer.decode(input);
        };
        Controller.prototype.encodeTokenizedBasic = function (input, name) {
            if (name === void 0) { name = "test"; }
            if (!this.codeGeneratorToken) {
                this.codeGeneratorToken = new CodeGeneratorToken_1.CodeGeneratorToken({
                    lexer: new BasicLexer_1.BasicLexer({
                        keywords: BasicParser_2.BasicParser.keywords,
                        keepWhiteSpace: true
                    }),
                    parser: new BasicParser_2.BasicParser({
                        keepTokens: true,
                        keepBrackets: true,
                        keepColons: true,
                        keepDataComma: true
                    }),
                    implicitLines: this.model.getProperty("implicitLines")
                });
            }
            var output = this.codeGeneratorToken.generate(input);
            if (output.error) {
                this.outputError(output.error);
            }
            else if (Utils_25.Utils.debug > 1) {
                var outputText = output.text, hex = outputText.split("").map(function (s) { return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); }).join(","), decoded = this.decodeTokenizedBasic(outputText), diff = Diff_1.Diff.testDiff(input.toUpperCase(), decoded.toUpperCase()); // for testing
                Utils_25.Utils.console.debug("TokenizerInput (" + name + "):\n" + input);
                Utils_25.Utils.console.debug("TokenizerHex (" + name + "):\n" + hex);
                Utils_25.Utils.console.debug("TokenizerDecoded (" + name + "):\n" + decoded);
                Utils_25.Utils.console.debug("TokenizerDiff (" + name + "):\n" + diff);
            }
            return output.text;
        };
        Controller.prototype.prettyPrintBasic = function (input, keepWhiteSpace, keepBrackets, keepColons) {
            if (!this.codeGeneratorBasic) {
                this.codeGeneratorBasic = new CodeGeneratorBasic_1.CodeGeneratorBasic({
                    lexer: new BasicLexer_1.BasicLexer({
                        keywords: BasicParser_2.BasicParser.keywords
                    }),
                    parser: new BasicParser_2.BasicParser()
                });
            }
            var keepDataComma = true;
            this.codeGeneratorBasic.getOptions().lexer.setOptions({
                keepWhiteSpace: keepWhiteSpace
            });
            this.codeGeneratorBasic.getOptions().parser.setOptions({
                keepTokens: true,
                keepBrackets: keepBrackets,
                keepColons: keepColons,
                keepDataComma: keepDataComma
            });
            var output = this.codeGeneratorBasic.generate(input);
            if (output.error) {
                this.outputError(output.error);
            }
            return output.text;
        };
        Controller.prototype.loadFileContinue = function (input) {
            var inFile = this.vm.vmGetInFileObject(), command = inFile.command;
            var startLine = 0, putInMemory = false, data;
            if (input !== null && input !== undefined) {
                data = Controller.splitMeta(input);
                input = data.data; // maybe changed
                if (data.meta.encoding === "base64") {
                    input = Utils_25.Utils.atob(input); // decode base64
                }
                var type = data.meta.typeString;
                if (type === "T") { // tokenized basic?
                    input = this.decodeTokenizedBasic(input);
                }
                else if (type === "P") { // BASIC?
                    input = DiskImage_2.DiskImage.unOrProtectData(input);
                    input = this.decodeTokenizedBasic(input);
                }
                else if (type === "B") { // binary?
                }
                else if (type === "A") { // ASCII?
                    // remove EOF character(s) (0x1a) from the end of file
                    input = input.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
                }
                else if (type === "G") { // Hisoft Devpac GENA3 Z80 Assember
                    input = Controller.asmGena3Convert(input);
                }
                else if (type === "X") { // (Extended) Disk image file
                    var fileHandler = this.fileHandler || this.createFileHandler(), imported = [];
                    fileHandler.fnLoad2(input, inFile.name, type, imported); // no meta in data
                    input = "1 ' " + imported.join(", "); // imported files
                }
                else if (type === "Z") { // ZIP file
                    var fileHandler = this.fileHandler || this.createFileHandler(), imported = [];
                    fileHandler.fnLoad2(input, inFile.name, type, imported);
                    input = "1 ' " + imported.join(", "); // imported files
                }
            }
            if (inFile.fnFileCallback) {
                try {
                    putInMemory = inFile.fnFileCallback(input, data && data.meta);
                }
                catch (e) {
                    Utils_25.Utils.console.warn(e);
                }
            }
            if (input === undefined) {
                Utils_25.Utils.console.error("loadFileContinue: File " + inFile.name + ": input undefined!");
                this.vm.vmStop("stop", 60, true);
                this.startMainLoop();
                return;
            }
            if (input === null) {
                this.startMainLoop();
                return;
            }
            switch (command) {
                case "openin":
                    break;
                case "chainMerge":
                    input = this.mergeScripts(this.view.getAreaValue("inputText"), input);
                    this.setInputText(input);
                    this.view.setAreaValue("resultText", "");
                    startLine = inFile.line || 0;
                    this.invalidateScript();
                    this.fnParseRun();
                    break;
                case "load":
                    if (!putInMemory) {
                        this.setInputText(input);
                        this.view.setAreaValue("resultText", "");
                        this.invalidateScript();
                        this.vm.vmStop("end", 90);
                    }
                    break;
                case "merge":
                    input = this.mergeScripts(this.view.getAreaValue("inputText"), input);
                    this.setInputText(input);
                    this.view.setAreaValue("resultText", "");
                    this.invalidateScript();
                    this.vm.vmStop("end", 90);
                    break;
                case "chain": // TODO: if we have a line number, make sure it is not optimized away when compiling
                    this.setInputText(input);
                    this.view.setAreaValue("resultText", "");
                    startLine = inFile.line || 0;
                    this.invalidateScript();
                    this.fnParseRun();
                    break;
                case "run":
                    if (!putInMemory) {
                        this.setInputText(input);
                        this.view.setAreaValue("resultText", "");
                        startLine = inFile.line || 0;
                        this.fnReset();
                        this.fnParseRun();
                    }
                    else {
                        this.fnReset();
                    }
                    break;
                default:
                    Utils_25.Utils.console.error("loadExample: Unknown command:", command);
                    break;
            }
            this.vm.vmSetStartLine(startLine);
            this.startMainLoop();
        };
        Controller.prototype.createFnExampleLoaded = function (example, url, inFile) {
            var _this = this;
            return function (_sFullUrl, key, suppressLog) {
                if (key !== example) {
                    Utils_25.Utils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
                }
                var exampleEntry = _this.model.getExample(example);
                if (!suppressLog) {
                    Utils_25.Utils.console.log("Example", url, (exampleEntry.meta ? exampleEntry.meta + " " : "") + " loaded");
                }
                var input = exampleEntry.script;
                _this.model.setProperty("example", inFile.memorizedExample);
                _this.vm.vmStop("", 0, true);
                _this.loadFileContinue(input);
            };
        };
        Controller.prototype.createFnExampleError = function (example, url, inFile) {
            var _this = this;
            return function () {
                Utils_25.Utils.console.log("Example", url, "error");
                _this.model.setProperty("example", inFile.memorizedExample);
                _this.vm.vmStop("", 0, true);
                var error = _this.vm.vmComposeError(Error(), 32, example + " not found"); // TODO: set also derr=146 (xx not found)
                // error or onError set
                if (error.hidden) {
                    _this.vm.vmStop("", 0, true); // clear onError
                }
                _this.outputError(error, true);
                _this.loadFileContinue(null);
            };
        };
        Controller.prototype.loadExample = function () {
            var inFile = this.vm.vmGetInFileObject(), key = this.model.getProperty("example");
            var name = inFile.name;
            if (name.charAt(0) === "/") { // absolute path?
                name = name.substring(1); // remove "/"
                inFile.memorizedExample = name; // change!
            }
            else {
                inFile.memorizedExample = key;
                var lastSlash = key.lastIndexOf("/");
                if (lastSlash >= 0) {
                    var path = key.substring(0, lastSlash); // take path from selected example
                    name = path + "/" + name;
                    name = name.replace(/\w+\/\.\.\//, ""); // simplify 2 dots (go back) in path: "dir/.."" => ""
                }
            }
            var example = name;
            if (Utils_25.Utils.debug > 0) {
                Utils_25.Utils.console.debug("loadExample: name=" + name + " (current=" + key + ")");
            }
            var exampleEntry = this.model.getExample(example); // already loaded
            var url;
            if (exampleEntry && exampleEntry.loaded) {
                this.model.setProperty("example", example);
                url = example;
                var fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);
                fnExampleLoaded("", example, true);
            }
            else if (example && exampleEntry) { // need to load
                this.model.setProperty("example", example);
                var databaseDir = this.model.getDatabase().src;
                url = databaseDir + "/" + example + ".js";
                Utils_25.Utils.loadScript(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
            }
            else { // keep original example in this error case
                url = example;
                if (example !== "") { // only if not empty
                    Utils_25.Utils.console.warn("loadExample: Unknown file:", example);
                    var fnExampleError = this.createFnExampleError(example, url, inFile);
                    fnExampleError();
                }
                else {
                    this.model.setProperty("example", example);
                    this.vm.vmStop("", 0, true);
                    this.loadFileContinue(""); // empty input?
                }
            }
        };
        Controller.fnLocalStorageName = function (name, defaultExtension) {
            // modify name so we do not clash with localstorage methods/properites
            if (name.indexOf(".") < 0) { // no dot inside name?
                name += "." + (defaultExtension || ""); // append dot or default extension
            }
            return name;
        };
        Controller.tryLoadingFromLocalStorage = function (name) {
            var storage = Utils_25.Utils.localStorage;
            var input = null;
            if (name.indexOf(".") >= 0) { // extension specified?
                input = storage.getItem(name);
            }
            else {
                for (var i = 0; i < Controller.defaultExtensions.length; i += 1) {
                    var storageName = Controller.fnLocalStorageName(name, Controller.defaultExtensions[i]);
                    input = storage.getItem(storageName);
                    if (input !== null) {
                        break; // found
                    }
                }
            }
            return input; // null=not found
        };
        Controller.prototype.fnFileLoad = function () {
            var inFile = this.vm.vmGetInFileObject();
            if (inFile.open) {
                if (inFile.command === "chainMerge" && inFile.first && inFile.last) { // special handling to delete line numbers first
                    this.fnDeleteLines({
                        first: inFile.first,
                        last: inFile.last,
                        command: "CHAIN MERGE",
                        stream: 0,
                        line: this.vm.line
                    });
                    this.vm.vmStop("fileLoad", 90); // restore
                }
                var name_14 = inFile.name;
                if (Utils_25.Utils.debug > 1) {
                    Utils_25.Utils.console.debug("fnFileLoad:", inFile.command, name_14, "details:", inFile);
                }
                var input = Controller.tryLoadingFromLocalStorage(name_14);
                if (input !== null) {
                    if (Utils_25.Utils.debug > 0) {
                        Utils_25.Utils.console.debug("fnFileLoad:", inFile.command, name_14, "from localStorage");
                    }
                    this.vm.vmStop("", 0, true);
                    this.loadFileContinue(input);
                }
                else { // load from example
                    this.loadExample( /* name */);
                }
            }
            else {
                Utils_25.Utils.console.error("fnFileLoad:", inFile.name, "File not open!"); // hopefully isName is defined
            }
            this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
        };
        Controller.joinMeta = function (meta) {
            return [
                Controller.metaIdent,
                meta.typeString,
                meta.start,
                meta.length,
                meta.entry
            ].join(";");
        };
        Controller.splitMeta = function (input) {
            var fileMeta;
            if (input.indexOf(Controller.metaIdent) === 0) { // starts with metaIdent?
                var index = input.indexOf(","); // metadata separator
                if (index >= 0) {
                    var metaString = input.substring(0, index);
                    input = input.substring(index + 1);
                    var meta = metaString.split(";");
                    fileMeta = {
                        typeString: meta[1],
                        start: Number(meta[2]),
                        length: Number(meta[3]),
                        entry: Number(meta[4]),
                        encoding: meta[5]
                    };
                }
            }
            if (!fileMeta) {
                fileMeta = {
                    typeString: ""
                };
            }
            var metaAndData = {
                meta: fileMeta,
                data: input
            };
            return metaAndData;
        };
        Controller.prototype.fnFileSave = function () {
            var outFile = this.vm.vmGetOutFileObject(), storage = Utils_25.Utils.localStorage;
            var defaultExtension = "";
            if (outFile.open) {
                var type = outFile.typeString, name_15 = outFile.name;
                if (type === "P" || type === "T") {
                    defaultExtension = "bas";
                }
                else if (type === "B") {
                    defaultExtension = "bin";
                }
                var storageName = Controller.fnLocalStorageName(name_15, defaultExtension);
                var fileData = void 0;
                if (outFile.fileData.length || (type === "B") || (outFile.command === "openout")) { // type A(for openout) or B
                    fileData = outFile.fileData.join("");
                }
                else { // no file data (assuming type A, P or T) => get text
                    fileData = this.view.getAreaValue("inputText");
                    if (type === "T" || type === "P") {
                        fileData = this.encodeTokenizedBasic(fileData, storageName);
                        if (fileData === "") {
                            outFile.typeString = "A"; // override type
                        }
                        else if (type === "P") {
                            fileData = DiskImage_2.DiskImage.unOrProtectData(fileData);
                        }
                    }
                    outFile.length = fileData.length; // set length
                }
                if (Utils_25.Utils.debug > 0) {
                    Utils_25.Utils.console.debug("fnFileSave: name=" + name_15 + ": put into localStorage");
                }
                var meta = Controller.joinMeta(outFile);
                storage.setItem(storageName, meta + "," + fileData);
                this.updateStorageDatabase("set", storageName);
                if (outFile.fnFileCallback) {
                    try {
                        outFile.fnFileCallback(fileData); // close file
                    }
                    catch (e) {
                        Utils_25.Utils.console.warn(e);
                    }
                }
                this.vm.vmResetOutFileHandling(); // make sure it is closed
            }
            else {
                Utils_25.Utils.console.error("fnFileSave: file not open!");
            }
            this.vm.vmStop("", 0, true); // continue
        };
        Controller.prototype.fnDeleteLines = function (paras) {
            var inputText = this.view.getAreaValue("inputText"), lines = this.fnGetLinesInRange(inputText, paras.first || 0, paras.last || 65535);
            var error;
            if (lines.length) {
                for (var i = 0; i < lines.length; i += 1) {
                    var line = parseInt(lines[i], 10);
                    if (isNaN(line)) {
                        error = this.vm.vmComposeError(Error(), 21, paras.command); // "Direct command found"
                        this.outputError(error, true);
                        break;
                    }
                    lines[i] = String(line); // keep just the line numbers
                }
                if (!error) {
                    var input = lines.join("\n");
                    input = this.mergeScripts(inputText, input); // delete input lines
                    this.setInputText(input);
                }
            }
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
        };
        Controller.prototype.fnNew = function () {
            var input = "";
            this.setInputText(input);
            this.variables.removeAllVariables();
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
            this.invalidateScript();
        };
        Controller.prototype.fnList = function (paras) {
            var input = this.view.getAreaValue("inputText"), stream = paras.stream, lines = this.fnGetLinesInRange(input, paras.first || 0, paras.last || 65535), regExp = new RegExp(/([\x00-\x1f])/g); // eslint-disable-line no-control-regex
            for (var i = 0; i < lines.length; i += 1) {
                var line = lines[i];
                if (stream !== 9) {
                    line = line.replace(regExp, "\x01$1"); // escape control characters to print them directly
                }
                this.vm.print(stream, line, "\r\n");
            }
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
        };
        Controller.prototype.fnReset = function () {
            var vm = this.vm;
            this.variables.removeAllVariables();
            vm.vmReset();
            if (this.virtualKeyboard) {
                this.virtualKeyboard.reset();
            }
            vm.vmStop("end", 0, true); // set "end" with priority 0, so that "compile only" still works
            vm.outBuffer = "";
            this.view.setAreaValue("outputText", "");
            this.invalidateScript();
        };
        Controller.prototype.outputError = function (error, noSelection) {
            var stream = 0;
            var shortError;
            if (Utils_25.Utils.isCustomError(error)) {
                shortError = error.shortMessage || error.message;
                if (!noSelection) {
                    var startPos = error.pos || 0, len = error.len || ((error.value !== undefined) ? String(error.value).length : 0), endPos = startPos + len;
                    this.view.setAreaSelection("inputText", error.pos, endPos);
                }
            }
            else {
                shortError = error.message;
            }
            var escapedShortError = shortError.replace(/([\x00-\x1f])/g, "\x01$1"); // eslint-disable-line no-control-regex
            this.vm.print(stream, escapedShortError + "\r\n");
            return shortError;
        };
        Controller.createBasicFormatter = function () {
            return new BasicFormatter_1.BasicFormatter({
                lexer: new BasicLexer_1.BasicLexer({
                    keywords: BasicParser_2.BasicParser.keywords
                }),
                parser: new BasicParser_2.BasicParser()
            });
        };
        Controller.prototype.fnRenumLines = function (paras) {
            var vm = this.vm, input = this.view.getAreaValue("inputText");
            if (!this.basicFormatter) {
                this.basicFormatter = Controller.createBasicFormatter();
            }
            var output = this.basicFormatter.renumber(input, paras.newLine || 10, paras.oldLine || 1, paras.step || 10, paras.keep || 65535);
            if (output.error) {
                Utils_25.Utils.console.warn(output.error);
                this.outputError(output.error);
            }
            else {
                this.fnPutChangedInputOnStack();
                this.setInputText(output.text, true);
                this.fnPutChangedInputOnStack();
            }
            this.vm.vmGoto(0); // reset current line
            vm.vmStop("end", 0, true);
        };
        Controller.prototype.fnEditLineCallback = function () {
            var inputParas = this.vm.vmGetStopObject().paras, inputText = this.view.getAreaValue("inputText");
            var input = inputParas.input;
            input = this.mergeScripts(inputText, input);
            this.setInputText(input);
            this.vm.vmSetStartLine(0);
            this.vm.vmGoto(0); // to be sure
            this.view.setDisabled("continueButton", true);
            this.vm.cursor(inputParas.stream, 0);
            this.vm.vmStop("end", 90);
            return true;
        };
        Controller.prototype.fnEditLine = function (paras) {
            var input = this.view.getAreaValue("inputText"), stream = paras.stream, lineNumber = paras.first || 0, lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
            if (lines.length) {
                var lineString = lines[0];
                this.vm.print(stream, lineString);
                this.vm.cursor(stream, 1);
                var inputParas = {
                    command: paras.command,
                    line: paras.line,
                    stream: stream,
                    message: "",
                    fnInputCallback: this.fnEditLineCallback.bind(this),
                    input: lineString
                };
                this.vm.vmStop("waitInput", 45, true, inputParas);
                this.fnWaitInput();
            }
            else {
                var error = this.vm.vmComposeError(Error(), 8, String(lineNumber)); // "Line does not exist"
                this.outputError(error);
                this.vm.vmStop("stop", 60, true);
            }
        };
        Controller.prototype.fnParseBench = function (input, bench) {
            var output;
            for (var i = 0; i < bench; i += 1) {
                var time = Date.now();
                output = this.codeGeneratorJs.generate(input, this.variables);
                time = Date.now() - time;
                Utils_25.Utils.console.debug("bench size", input.length, "labels", this.codeGeneratorJs.debugGetLabelsCount(), "loop", i, ":", time, "ms");
                if (output.error) {
                    break;
                }
            }
            return output;
        };
        Controller.prototype.fnParse = function () {
            var input = this.view.getAreaValue("inputText"), bench = this.model.getProperty("bench");
            this.variables.removeAllVariables();
            var output;
            if (!bench) {
                output = this.codeGeneratorJs.generate(input, this.variables);
            }
            else {
                output = this.fnParseBench(input, bench);
            }
            var outputString;
            if (output.error) {
                outputString = this.outputError(output.error);
            }
            else {
                outputString = output.text;
                this.vm.vmSetSourceMap(this.codeGeneratorJs.getSourceMap());
                // optional: tokenize to put tokens into memory...
                var tokens = this.encodeTokenizedBasic(input), addr = 0x170;
                for (var i = 0; i < tokens.length; i += 1) {
                    var code = tokens.charCodeAt(i);
                    if (code > 255) {
                        Utils_25.Utils.console.warn("Put token in memory: addr=" + (addr + i) + ", code=" + code + ", char=" + tokens.charAt(i));
                        code = 0x20;
                    }
                    this.vm.poke(addr + i, code);
                }
            }
            if (outputString && outputString.length > 0) {
                outputString += "\n";
            }
            this.view.setAreaValue("outputText", outputString);
            this.invalidateScript();
            this.setVarSelectOptions("varSelect", this.variables);
            this.commonEventHandler.onVarSelectChange();
            return output;
        };
        Controller.prototype.fnPretty = function () {
            var input = this.view.getAreaValue("inputText"), keepWhiteSpace = this.view.getInputChecked("prettySpaceInput"), keepBrackets = this.view.getInputChecked("prettyBracketsInput"), keepColons = this.view.getInputChecked("prettyColonsInput"), output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);
            if (output) {
                this.fnPutChangedInputOnStack();
                this.setInputText(output, true);
                this.fnPutChangedInputOnStack();
                // for testing:
                var diff = Diff_1.Diff.testDiff(input.toUpperCase(), output.toUpperCase());
                this.view.setAreaValue("outputText", diff);
            }
        };
        Controller.prototype.fnAddLines = function () {
            var input = this.view.getAreaValue("inputText"), output = Controller.addLineNumbers(input);
            if (output) {
                this.fnPutChangedInputOnStack();
                this.setInputText(output, true);
                this.fnPutChangedInputOnStack();
            }
        };
        Controller.prototype.fnRemoveLines = function () {
            if (!this.basicFormatter) {
                this.basicFormatter = Controller.createBasicFormatter();
            }
            var input = this.view.getAreaValue("inputText"), output = this.basicFormatter.removeUnusedLines(input);
            if (output.error) {
                this.outputError(output.error);
            }
            else {
                this.fnPutChangedInputOnStack();
                this.setInputText(output.text, true);
                this.fnPutChangedInputOnStack();
            }
        };
        // https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
        Controller.fnDownloadBlob = function (blob, filename) {
            var url = URL.createObjectURL(blob), a = document.createElement("a"), clickHandler = function () {
                setTimeout(function () {
                    URL.revokeObjectURL(url);
                    a.removeEventListener("click", clickHandler);
                }, 150);
            };
            a.href = url;
            a.download = filename || "download";
            a.addEventListener("click", clickHandler, false);
            a.click();
            return a;
        };
        Controller.prototype.fnDownloadNewFile = function (data, fileName) {
            var type = "octet/stream", buffer = new ArrayBuffer(data.length), data8 = new Uint8Array(buffer);
            for (var i = 0; i < data.length; i += 1) {
                data8[i] = data.charCodeAt(i);
            }
            if (typeof Blob === "undefined") {
                Utils_25.Utils.console.warn("fnDownloadNewFile: Blob undefined");
                return;
            }
            var blob = new Blob([data8.buffer], {
                type: type
            });
            if (window.navigator && window.navigator.msSaveOrOpenBlob) { // IE11 support
                window.navigator.msSaveOrOpenBlob(blob, fileName);
            }
            else {
                Controller.fnDownloadBlob(blob, fileName);
            }
        };
        Controller.prototype.fnDownload = function () {
            var input = this.view.getAreaValue("inputText"), tokens = this.encodeTokenizedBasic(input);
            if (tokens !== "") {
                var header = FileHandler_1.FileHandler.createMinimalAmsdosHeader("T", 0x170, tokens.length), headerString = DiskImage_2.DiskImage.combineAmsdosHeader(header), data = headerString + tokens;
                this.fnDownloadNewFile(data, "file.bas");
            }
        };
        Controller.prototype.selectJsError = function (script, e) {
            var lineNumber = e.lineNumber, // only on FireFox
            columnNumber = e.columnNumber;
            if (lineNumber || columnNumber) { // only available on Firefox
                var errLine = lineNumber - 3; // for some reason line 0 is 3
                var pos = 0, line = 0;
                while (pos < script.length && line < errLine) {
                    pos = script.indexOf("\n", pos) + 1;
                    line += 1;
                }
                pos += columnNumber;
                Utils_25.Utils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);
                this.view.setAreaSelection("outputText", pos, pos + 1);
            }
        };
        Controller.prototype.fnRun = function (paras) {
            var script = this.view.getAreaValue("outputText"), vm = this.vm;
            var line = paras && paras.first || 0;
            line = line || 0;
            if (line === 0) {
                vm.vmResetData(); // start from the beginning => also reset data! (or put it in line 0 in the script)
            }
            if (this.vm.vmGetOutFileObject().open) {
                this.fnFileSave();
            }
            if (!this.fnScript) {
                vm.clear(); // init variables
                try {
                    this.fnScript = new Function("o", script); // eslint-disable-line no-new-func
                }
                catch (e) {
                    Utils_25.Utils.console.error(e);
                    if (e instanceof Error) {
                        this.selectJsError(script, e);
                        e.shortMessage = "JS " + String(e);
                        this.outputError(e, true);
                    }
                    this.fnScript = undefined;
                }
            }
            else {
                vm.clear(); // we do a clear as well here
            }
            vm.vmReset4Run();
            if (this.fnScript) {
                vm.outBuffer = this.view.getAreaValue("resultText");
                vm.vmStop("", 0, true);
                vm.vmGoto(0); // to load DATA lines
                this.vm.vmSetStartLine(line); // clear resets also startline
                this.view.setDisabled("runButton", true);
                this.view.setDisabled("stopButton", false);
                this.view.setDisabled("continueButton", true);
            }
            if (!this.inputSet) {
                this.inputSet = true;
                var input = this.model.getProperty("input");
                if (input !== "") {
                    this.view.setAreaValue("inp2Text", input);
                    var that_1 = this, timeout = 1;
                    setTimeout(function () {
                        that_1.startEnter();
                    }, timeout);
                }
            }
            if (Utils_25.Utils.debug > 1) {
                Utils_25.Utils.console.debug("End of fnRun");
            }
        };
        Controller.prototype.fnParseRun = function () {
            var output = this.fnParse();
            if (!output.error) {
                this.fnRun();
            }
        };
        Controller.prototype.fnRunPart1 = function (fnScript) {
            try {
                fnScript(this.vm);
            }
            catch (e) {
                if (e instanceof Error) {
                    if (e.name === "CpcVm" || e.name === "Variables") { //TTT
                        var customError = e;
                        if (customError.errCode !== undefined) {
                            customError = this.vm.vmComposeError(customError, customError.errCode, customError.value);
                        }
                        if (!customError.hidden) {
                            Utils_25.Utils.console.warn(customError);
                            this.outputError(customError, !customError.pos);
                        }
                        else {
                            Utils_25.Utils.console.log(customError.message);
                        }
                    }
                    else {
                        Utils_25.Utils.console.error(e);
                        this.selectJsError(this.view.getAreaValue("outputText"), e);
                        this.vm.vmComposeError(e, 2, "JS " + String(e)); // generate Syntax Error, set also err and erl and set stop
                        this.outputError(e, true);
                    }
                }
                else {
                    Utils_25.Utils.console.error(e);
                }
            }
        };
        Controller.prototype.fnDirectInput = function () {
            var inputParas = this.vm.vmGetStopObject().paras, stream = inputParas.stream;
            var input = inputParas.input;
            input = input.trim();
            inputParas.input = "";
            if (input !== "") { // direct input
                this.vm.cursor(stream, 0);
                var inputText = this.view.getAreaValue("inputText");
                if ((/^\d+($| )/).test(input)) { // start with number?
                    if (Utils_25.Utils.debug > 0) {
                        Utils_25.Utils.console.debug("fnDirectInput: insert line=" + input);
                    }
                    input = this.mergeScripts(inputText, input);
                    this.setInputText(input, true);
                    this.vm.vmSetStartLine(0);
                    this.vm.vmGoto(0); // to be sure
                    this.view.setDisabled("continueButton", true);
                    this.vm.cursor(stream, 1);
                    this.updateResultText();
                    return false; // continue direct input
                }
                Utils_25.Utils.console.log("fnDirectInput: execute:", input);
                var codeGeneratorJs = this.codeGeneratorJs;
                var output = void 0, outputString = void 0;
                if (inputText && ((/^\d+($| )/).test(inputText) || this.model.getProperty("implicitLines"))) { // do we have a program starting with a line number?
                    var separator = inputText.endsWith("\n") ? "" : "\n";
                    output = codeGeneratorJs.generate(inputText + separator + input, this.variables, true); // compile both; allow direct command
                    if (output.error) {
                        var error = output.error;
                        if (error.pos < inputText.length + 1) { // error not in direct?
                            error.message = "[prg] " + error.message;
                            output = undefined;
                        }
                    }
                }
                if (!output) {
                    output = codeGeneratorJs.generate(input, this.variables, true); // compile direct input only
                }
                if (output.error) {
                    outputString = this.outputError(output.error, true);
                }
                else {
                    outputString = output.text;
                }
                if (outputString && outputString.length > 0) {
                    outputString += "\n";
                }
                this.view.setAreaValue("outputText", outputString);
                if (!output.error) {
                    this.vm.vmSetStartLine(this.vm.line); // fast hack
                    this.vm.vmGoto("direct");
                    try {
                        var fnScript = new Function("o", outputString); // eslint-disable-line no-new-func
                        this.fnScript = fnScript;
                        this.vm.vmSetSourceMap(codeGeneratorJs.getSourceMap());
                    }
                    catch (e) {
                        Utils_25.Utils.console.error(e);
                        if (e instanceof Error) {
                            this.outputError(e, true);
                        }
                    }
                }
                if (!output.error) {
                    this.updateResultText();
                    return true;
                }
                var msg = inputParas.message;
                this.vm.print(stream, msg);
                this.vm.cursor(stream, 1);
            }
            this.updateResultText();
            return false;
        };
        Controller.prototype.startWithDirectInput = function () {
            var vm = this.vm, stream = 0, msg = "Ready\r\n";
            this.vm.tagoff(stream);
            this.vm.vmResetControlBuffer();
            if (this.vm.pos(stream) > 1) {
                this.vm.print(stream, "\r\n");
            }
            this.vm.print(stream, msg);
            this.vm.cursor(stream, 1, 1);
            vm.vmStop("direct", 0, true, {
                command: "direct",
                stream: stream,
                message: msg,
                // noCRLF: true,
                fnInputCallback: this.fnDirectInputHandler,
                input: "",
                line: this.vm.line
            });
            this.fnWaitInput();
        };
        Controller.prototype.updateResultText = function () {
            this.view.setAreaValue("resultText", this.vm.outBuffer);
            this.view.setAreaScrollTop("resultText"); // scroll to bottom
        };
        Controller.prototype.exitLoop = function () {
            var stop = this.vm.vmGetStopObject(), reason = stop.reason;
            this.updateResultText();
            this.view.setDisabled("runButton", reason === "reset");
            this.view.setDisabled("stopButton", reason !== "fileLoad" && reason !== "fileSave");
            this.view.setDisabled("continueButton", reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");
            this.setVarSelectOptions("varSelect", this.variables);
            this.commonEventHandler.onVarSelectChange();
            if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
                this.startWithDirectInput();
            }
        };
        Controller.prototype.fnWaitFrame = function () {
            this.vm.vmStop("", 0, true);
            this.nextLoopTimeOut = this.vm.vmGetTimeUntilFrame(); // wait until next frame
        };
        Controller.prototype.fnOnError = function () {
            this.vm.vmStop("", 0, true); // continue
        };
        Controller.fnDummy = function () {
            // empty
        };
        Controller.prototype.fnTimer = function () {
            this.vm.vmStop("", 0, true); // continue
        };
        Controller.prototype.fnRunLoop = function () {
            var stop = this.vm.vmGetStopObject();
            this.nextLoopTimeOut = this.initialLoopTimeout;
            if (!stop.reason && this.fnScript) {
                this.fnRunPart1(this.fnScript); // could change reason
            }
            if (stop.reason in this.handlers) {
                this.handlers[stop.reason].call(this, stop.paras);
            }
            else {
                Utils_25.Utils.console.warn("runLoop: Unknown run mode:", stop.reason);
                this.vm.vmStop("error", 50);
            }
            if (stop.reason && stop.reason !== "waitSound" && stop.reason !== "waitKey" && stop.reason !== "waitInput") {
                this.timeoutHandlerActive = false; // not running any more
                this.exitLoop();
            }
            else {
                setTimeout(this.fnRunLoopHandler, this.nextLoopTimeOut);
            }
        };
        Controller.prototype.startMainLoop = function () {
            if (!this.timeoutHandlerActive) {
                this.timeoutHandlerActive = true;
                this.fnRunLoop();
            }
        };
        Controller.prototype.setStopObject = function (stop) {
            Object.assign(this.savedStop, stop);
        };
        Controller.prototype.getStopObject = function () {
            return this.savedStop;
        };
        Controller.prototype.startParse = function () {
            this.removeKeyBoardHandler();
            this.vm.vmStop("parse", 95);
            this.startMainLoop();
        };
        Controller.prototype.startRenum = function () {
            var stream = 0;
            this.vm.vmStop("renumLines", 85, false, {
                command: "renum",
                stream: 0,
                newLine: Number(this.view.getInputValue("renumNewInput")),
                oldLine: Number(this.view.getInputValue("renumStartInput")),
                step: Number(this.view.getInputValue("renumStepInput")),
                keep: Number(this.view.getInputValue("renumKeepInput")),
                line: this.vm.line
            });
            if (this.vm.pos(stream) > 1) {
                this.vm.print(stream, "\r\n");
            }
            this.vm.print(stream, "renum\r\n");
            this.startMainLoop();
        };
        Controller.prototype.startRun = function () {
            this.setStopObject(this.noStop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("run", 95);
            this.startMainLoop();
        };
        Controller.prototype.startParseRun = function () {
            this.setStopObject(this.noStop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("parseRun", 95);
            this.startMainLoop();
        };
        Controller.prototype.startBreak = function () {
            var vm = this.vm, stop = vm.vmGetStopObject();
            this.setStopObject(stop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("break", 80);
            this.startMainLoop();
        };
        Controller.prototype.startContinue = function () {
            var vm = this.vm, stop = vm.vmGetStopObject(), savedStop = this.getStopObject();
            this.view.setDisabled("runButton", true);
            this.view.setDisabled("stopButton", false);
            this.view.setDisabled("continueButton", true);
            if (stop.reason === "break" || stop.reason === "escape" || stop.reason === "stop" || stop.reason === "direct") {
                if (savedStop.paras && !savedStop.paras.fnInputCallback) { // no keyboard callback? make sure no handler is set (especially for direct->continue)
                    this.removeKeyBoardHandler();
                }
                if (stop.reason === "direct" || stop.reason === "escape") {
                    this.vm.cursor(stop.paras.stream, 0); // switch it off (for continue button)
                }
                Object.assign(stop, savedStop); // fast hack
                this.setStopObject(this.noStop);
            }
            this.startMainLoop();
        };
        Controller.prototype.startReset = function () {
            this.setStopObject(this.noStop);
            this.removeKeyBoardHandler();
            this.vm.vmStop("reset", 99);
            this.startMainLoop();
        };
        Controller.prototype.startScreenshot = function () {
            var canvas = this.canvas.getCanvasElement();
            if (canvas.toDataURL) {
                return canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you do not replace you will get a DOM 18 exception.
            }
            Utils_25.Utils.console.warn("Screenshot not available");
            return "";
        };
        Controller.prototype.fnPutKeysInBuffer = function (keys) {
            for (var i = 0; i < keys.length; i += 1) {
                this.keyboard.putKeyInBuffer(keys.charAt(i));
            }
            var keyDownHandler = this.keyboard.getKeyDownHandler();
            if (keyDownHandler) {
                keyDownHandler();
            }
        };
        Controller.prototype.startEnter = function () {
            var input = this.view.getAreaValue("inp2Text");
            input = input.replace(/\n/g, "\r"); // LF => CR
            this.fnPutKeysInBuffer(input);
            this.view.setAreaValue("inp2Text", "");
        };
        Controller.generateFunction = function (par, functionString) {
            if (functionString.startsWith("function anonymous(")) { // already a modified function (inside an anonymous function)?
                var firstIndex = functionString.indexOf("{"), lastIndex = functionString.lastIndexOf("}");
                if (firstIndex >= 0 && lastIndex >= 0) {
                    functionString = functionString.substring(firstIndex + 1, lastIndex - 1); // remove anonymous function
                }
                functionString = functionString.trim();
            }
            else {
                functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
            }
            var match = (/function \(([^)]*)/).exec(functionString), args = match ? match[1].split(",") : [], fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString); // eslint-disable-line no-new-func
            // we support at most 5 arguments
            return fnFunction;
        };
        Controller.prototype.changeVariable = function () {
            var par = this.view.getSelectValue("varSelect"), valueString = this.view.getSelectValue("varText"), variables = this.variables;
            var value = variables.getVariable(par);
            if (typeof value === "function") {
                value = Controller.generateFunction(par, valueString);
                variables.setVariable(par, value);
            }
            else {
                var varType = this.variables.determineStaticVarType(par), type = this.vm.vmDetermineVarType(varType); // do we know dynamic type?
                if (type !== "$") { // not string? => convert to number
                    value = parseFloat(valueString);
                }
                else {
                    value = valueString;
                }
                try {
                    var value2 = this.vm.vmAssign(varType, value);
                    variables.setVariable(par, value2);
                    Utils_25.Utils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
                }
                catch (e) {
                    Utils_25.Utils.console.warn(e);
                }
            }
            this.setVarSelectOptions("varSelect", variables);
            this.commonEventHandler.onVarSelectChange(); // title change?
        };
        Controller.prototype.setSoundActive = function () {
            var sound = this.sound, soundButton = View_7.View.getElementById1("soundButton"), active = this.model.getProperty("sound");
            var text;
            if (active) {
                try {
                    sound.soundOn();
                    text = (sound.isActivatedByUser()) ? "Sound is on" : "Sound on (waiting)";
                }
                catch (e) {
                    Utils_25.Utils.console.warn("soundOn:", e);
                    text = "Sound unavailable";
                }
            }
            else {
                sound.soundOff();
                text = "Sound is off";
                var stop_1 = this.vm && this.vm.vmGetStopObject();
                if (stop_1 && stop_1.reason === "waitSound") {
                    this.vm.vmStop("", 0, true); // do not wait
                }
            }
            soundButton.innerText = text;
        };
        Controller.prototype.fnEndOfImport = function (imported) {
            var stream = 0, vm = this.vm;
            for (var i = 0; i < imported.length; i += 1) {
                vm.print(stream, imported[i], " ");
            }
            vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
            this.updateResultText();
        };
        Controller.fnHandleDragOver = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer !== null) {
                evt.dataTransfer.dropEffect = "copy"; // explicitly show this is a copy
            }
        };
        Controller.prototype.adaptFilename = function (name, err) {
            return this.vm.vmAdaptFilename(name, err);
        };
        Controller.prototype.createFileHandler = function () {
            if (!this.fileHandler) {
                this.fileHandler = new FileHandler_1.FileHandler({
                    adaptFilename: this.adaptFilename.bind(this),
                    updateStorageDatabase: this.updateStorageDatabase.bind(this),
                    outputError: this.outputError.bind(this)
                });
            }
            return this.fileHandler;
        };
        Controller.prototype.initDropZone = function () {
            var fileHandler = this.fileHandler || this.createFileHandler();
            /*
            if (!this.fileHandler) {
                this.fileHandler = new FileHandler({
                    adaptFilename: this.adaptFilename.bind(this),
                    updateStorageDatabase: this.updateStorageDatabase.bind(this),
                    outputError: this.outputError.bind(this)
                });
            }
            */
            if (!this.fileSelect) {
                this.fileSelect = new FileSelect_1.FileSelect({
                    fnEndOfImport: this.fnEndOfImport.bind(this),
                    //outputError: this.outputError.bind(this),
                    fnLoad2: fileHandler.fnLoad2.bind(fileHandler)
                });
            }
            var dropZone = View_7.View.getElementById1("dropZone");
            dropZone.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false);
            this.fileSelect.addFileSelectHandler(dropZone, "drop");
            var canvasElement = this.canvas.getCanvasElement();
            canvasElement.addEventListener("dragover", Controller.fnHandleDragOver.bind(this), false);
            this.fileSelect.addFileSelectHandler(canvasElement, "drop");
            var fileInput = View_7.View.getElementById1("fileInput");
            this.fileSelect.addFileSelectHandler(fileInput, "change");
        };
        Controller.prototype.fnUpdateUndoRedoButtons = function () {
            this.view.setDisabled("undoButton", !this.inputStack.canUndoKeepOne());
            this.view.setDisabled("redoButton", !this.inputStack.canRedo());
        };
        Controller.prototype.fnInitUndoRedoButtons = function () {
            this.inputStack.reset();
            this.fnUpdateUndoRedoButtons();
        };
        Controller.prototype.fnPutChangedInputOnStack = function () {
            var input = this.view.getAreaValue("inputText"), stackInput = this.inputStack.getInput();
            if (stackInput !== input) {
                this.inputStack.save(input);
                this.fnUpdateUndoRedoButtons();
            }
        };
        Controller.prototype.startUpdateCanvas = function () {
            this.canvas.startUpdateCanvas();
        };
        Controller.prototype.startUpdateTextCanvas = function () {
            this.textCanvas.startUpdateCanvas();
        };
        Controller.prototype.stopUpdateCanvas = function () {
            this.canvas.stopUpdateCanvas();
        };
        Controller.prototype.stopUpdateTextCanvas = function () {
            this.textCanvas.stopUpdateCanvas();
        };
        Controller.prototype.virtualKeyboardCreate = function () {
            if (!this.virtualKeyboard) {
                this.virtualKeyboard = new VirtualKeyboard_1.VirtualKeyboard({
                    fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
                    fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
                });
            }
        };
        Controller.prototype.getVariable = function (par) {
            return this.variables.getVariable(par);
        };
        Controller.prototype.undoStackElement = function () {
            return this.inputStack.undo();
        };
        Controller.prototype.redoStackElement = function () {
            return this.inputStack.redo();
        };
        Controller.prototype.createFnDatabaseLoaded = function (url) {
            var _this = this;
            return function (_sFullUrl, key) {
                var selectedName = _this.model.getProperty("database");
                if (selectedName === key) {
                    _this.model.getDatabase().loaded = true;
                }
                else { // should not occur
                    Utils_25.Utils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
                    _this.model.setProperty("database", key);
                    var database = _this.model.getDatabase();
                    if (database) {
                        database.loaded = true;
                    }
                    _this.model.setProperty("database", selectedName);
                }
                Utils_25.Utils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
                _this.setDirectorySelectOptions();
                _this.onDirectorySelectChange();
            };
        };
        Controller.prototype.createFnDatabaseError = function (url) {
            var _this = this;
            return function (_sFullUrl, key) {
                Utils_25.Utils.console.error("fnDatabaseError: database error: " + key + ": " + url);
                _this.setDirectorySelectOptions();
                _this.onDirectorySelectChange();
                _this.setInputText("");
                _this.view.setAreaValue("resultText", "Cannot load database: " + key);
            };
        };
        Controller.prototype.onDatabaseSelectChange = function () {
            var databaseName = this.view.getSelectValue("databaseSelect");
            this.model.setProperty("database", databaseName);
            this.view.setSelectTitleFromSelectedOption("databaseSelect");
            var database = this.model.getDatabase();
            if (!database) {
                Utils_25.Utils.console.error("onDatabaseSelectChange: database not available:", databaseName);
                return;
            }
            if (database.text === "storage") { // sepcial handling: browser localStorage
                this.updateStorageDatabase("set", ""); // set all
                database.loaded = true;
            }
            if (database.loaded) {
                this.setDirectorySelectOptions();
                this.onDirectorySelectChange();
            }
            else {
                this.setInputText("#loading database " + databaseName + "...");
                var exampleIndex = this.model.getProperty("exampleIndex"), url = database.src + "/" + exampleIndex;
                Utils_25.Utils.loadScript(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
            }
        };
        Controller.prototype.onDirectorySelectChange = function () {
            this.setExampleSelectOptions();
            this.onExampleSelectChange();
        };
        Controller.prototype.onExampleSelectChange = function () {
            var vm = this.vm, inFile = vm.vmGetInFileObject(), dataBaseName = this.model.getProperty("database"), directoryName = this.view.getSelectValue("directorySelect");
            vm.closein();
            if (!this.view.getHidden("galleryArea")) { // close gallery, if open
                this.view.setHidden("galleryArea", true, "flex");
                this.model.setProperty("showGallery", false);
            }
            inFile.open = true;
            var exampleName = this.view.getSelectValue("exampleSelect");
            if (directoryName) {
                exampleName = directoryName + "/" + exampleName;
            }
            var exampleEntry = this.model.getExample(exampleName);
            inFile.command = "run";
            if (exampleEntry && exampleEntry.meta) { // TTT TODO: this is just a workaround, meta is in input now; should change command after loading!
                var type = exampleEntry.meta.charAt(0);
                if (type === "B" || type === "D" || type === "G") { // binary, data only, Gena Assembler?
                    inFile.command = "load";
                }
            }
            if (dataBaseName !== "storage") {
                exampleName = "/" + exampleName; // load absolute
            }
            else {
                this.model.setProperty("example", exampleName);
            }
            inFile.name = exampleName;
            inFile.start = undefined;
            inFile.fnFileCallback = vm.fnLoadHandler;
            vm.vmStop("fileLoad", 90);
            this.startMainLoop();
        };
        // currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
        Controller.prototype.exportAsBase64 = function (storageName) {
            var storage = Utils_25.Utils.localStorage;
            var data = storage.getItem(storageName), out = "";
            if (data !== null) {
                var index = data.indexOf(","); // metadata separator
                if (index >= 0) {
                    var meta = data.substring(0, index);
                    data = data.substring(index + 1);
                    data = Utils_25.Utils.btoa(data);
                    out = meta + ";base64," + data;
                }
                else { // hmm, no meta info
                    data = Utils_25.Utils.btoa(data);
                    out = "base64," + data;
                }
            }
            Utils_25.Utils.console.log(out);
            return out;
        };
        Controller.prototype.onCpcCanvasClick = function (event) {
            if (this.model.getProperty("showSettings")) {
                this.model.setProperty("showSettings", false);
                this.view.setHidden("settingsArea", !this.model.getProperty("showSettings"), "flex");
            }
            if (this.model.getProperty("showConvert")) {
                this.model.setProperty("showConvert", false);
                this.view.setHidden("convertArea", !this.model.getProperty("showConvert"), "flex");
            }
            this.canvas.onCpcCanvasClick(event);
            this.textCanvas.onWindowClick(event);
            this.keyboard.setActive(true);
        };
        Controller.prototype.onWindowClick = function (event) {
            this.canvas.onWindowClick(event);
            this.textCanvas.onWindowClick(event);
            this.keyboard.setActive(false);
        };
        Controller.prototype.onTextTextClick = function (event) {
            this.textCanvas.onTextCanvasClick(event);
            this.canvas.onWindowClick(event);
            this.keyboard.setActive(true);
        };
        Controller.prototype.fnArrayBounds = function () {
            var arrayBounds = this.model.getProperty("arrayBounds");
            this.variables.setOptions({
                arrayBounds: arrayBounds
            });
            this.vm.vmGoto(0); // reset current line
            this.vm.vmStop("end", 0, true);
            this.variables.removeAllVariables();
        };
        Controller.prototype.fnImplicitLines = function () {
            var implicitLines = this.model.getProperty("implicitLines");
            this.codeGeneratorJs.setOptions({
                implicitLines: implicitLines
            });
            if (this.codeGeneratorToken) {
                this.codeGeneratorToken.setOptions({
                    implicitLines: implicitLines
                });
            }
        };
        Controller.prototype.fnTrace = function () {
            var trace = this.model.getProperty("trace");
            this.codeGeneratorJs.setOptions({
                trace: trace
            });
        };
        Controller.prototype.fnSpeed = function () {
            var speed = this.model.getProperty("speed");
            this.initialLoopTimeout = 1000 - speed * 10;
        };
        Controller.metaIdent = "CPCBasic";
        // http://www.cpcwiki.eu/index.php/CPC_Palette
        Controller.paletteColors = [
            "#000000",
            "#000080",
            "#0000FF",
            "#800000",
            "#800080",
            "#8000FF",
            "#FF0000",
            "#FF0080",
            "#FF00FF",
            "#008000",
            "#008080",
            "#0080FF",
            "#808000",
            "#808080",
            "#8080FF",
            "#FF8000",
            "#FF8080",
            "#FF80FF",
            "#00FF00",
            "#00FF80",
            "#00FFFF",
            "#80FF00",
            "#80FF80",
            "#80FFFF",
            "#FFFF00",
            "#FFFF80",
            "#FFFFFF",
            "#808080",
            "#FF00FF",
            "#FFFF80",
            "#000080",
            "#00FF80" //  31 Sea Green (same as 19)
        ];
        Controller.paletteGrey = [
            "#000000",
            "#0A0A0A",
            "#131313",
            "#1D1D1D",
            "#262626",
            "#303030",
            "#393939",
            "#434343",
            "#4C4C4C",
            "#575757",
            "#606060",
            "#6A6A6A",
            "#737373",
            "#7D7D7D",
            "#868686",
            "#909090",
            "#999999",
            "#A3A3A3",
            "#ACACAC",
            "#B5B5B5",
            "#BFBFBF",
            "#C9C9C9",
            "#D2D2D2",
            "#DCDCDC",
            "#E5E5E5",
            "#EFEFEF",
            "#F8F8F8",
            "#7D7D7D",
            "#434343",
            "#EFEFEF",
            "#A0A0A0",
            "#B5B5B5"
        ];
        Controller.defaultExtensions = [
            "",
            "bas",
            "bin"
        ];
        return Controller;
    }());
    exports.Controller = Controller;
});
/* cpcconfig.ts - configuration file for CPCBasicTS */
define("cpcconfig", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cpcconfig = void 0;
    exports.cpcconfig = {
        databaseDirs: "./examples,https://benchmarko.github.io/CPCBasicApps/apps,storage",
        //databaseDirs: "./examples,../../CPCBasicApps/apps,storage", // local test
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
// cpcbasic.ts - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define("cpcbasic", ["require", "exports", "Utils", "Controller", "cpcconfig", "Model", "View", "NodeAdapt"], function (require, exports, Utils_26, Controller_1, cpcconfig_1, Model_1, View_8, NodeAdapt_1) {
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
                var nameValue = args[i], nameValueList = Utils_26.Utils.split2(nameValue, "="), name_16 = nameValueList[0];
                if (config.hasOwnProperty(name_16)) {
                    var value = nameValueList[1]; // string|number|boolean
                    if (value !== undefined && config.hasOwnProperty(name_16)) {
                        switch (typeof config[name_16]) {
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
                    config[name_16] = value;
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
                Utils_26.Utils.console.error(err);
            }
            return decoded;
        };
        // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
        cpcBasic.fnParseUri = function (urlQuery, config) {
            var rSearch = /([^&=]+)=?([^&]*)/g, args = [];
            var match;
            while ((match = rSearch.exec(urlQuery)) !== null) {
                var name_17 = cpcBasic.fnDecodeUri(match[1]), value = cpcBasic.fnDecodeUri(match[2]);
                if (value !== null && config.hasOwnProperty(name_17)) {
                    args.push(name_17 + "=" + value);
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
            var currentConsole = Utils_26.Utils.console;
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
            var name = this.model.getProperty("database") + "/" + this.model.getProperty("example");
            if (redirectExamples[name]) {
                this.model.setProperty("database", redirectExamples[name].database);
                this.model.setProperty("example", redirectExamples[name].example);
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
            cpcBasic.view = new View_8.View();
            var debug = Number(cpcBasic.model.getProperty("debug"));
            Utils_26.Utils.debug = debug;
            var UtilsConsole = Utils_26.Utils.console, cpcBasicLog = "";
            if (UtilsConsole.cpcBasicLog) {
                cpcBasicLog = UtilsConsole.cpcBasicLog;
                UtilsConsole.cpcBasicLog = undefined; // do not log any more to dummy console
            }
            if (Utils_26.Utils.debug > 1 && cpcBasic.model.getProperty("showConsole")) { // console log window?
                UtilsConsole = cpcBasic.createDebugUtilsConsole(cpcBasicLog);
                Utils_26.Utils.console = UtilsConsole;
                Utils_26.Utils.console.log("CPCBasic log started at", Utils_26.Utils.dateFormat(new Date()));
                UtilsConsole.changeLog(View_8.View.getElementById1("consoleText"));
            }
            if (redirectExamples) {
                this.fnRedirectExamples(redirectExamples);
            }
            cpcBasic.controller = new Controller_1.Controller(cpcBasic.model, cpcBasic.view);
            cpcBasic.controller.onDatabaseSelectChange(); // trigger loading example
        };
        cpcBasic.fnOnLoad = function () {
            Utils_26.Utils.console.log("CPCBasic started at", Utils_26.Utils.dateFormat(new Date()));
            cpcBasic.fnDoStart();
        };
        cpcBasic.config = {
            arrayBounds: false,
            bench: 0,
            debug: 0,
            databaseDirs: "examples",
            database: "examples",
            example: "cpcbasic",
            exampleIndex: "0index.js",
            implicitLines: false,
            input: "",
            kbdLayout: "alphanum",
            showInput: true,
            showInp2: false,
            showCpc: true,
            showKbd: false,
            showOutput: false,
            showResult: false,
            showText: false,
            showVariable: false,
            showConsole: false,
            showConvert: false,
            showSettings: false,
            showGallery: false,
            sound: true,
            speed: 100,
            palette: "color",
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
        Utils_26.Utils.console.debug("End of main.");
    }
});
//# sourceMappingURL=cpcbasicts.js.map