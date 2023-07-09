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
//# sourceMappingURL=Polyfills.js.map