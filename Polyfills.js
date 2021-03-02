"use strict";
// Polyfills.ts - Some Polyfills for old browsers, e.g. IE8, and nodeJS
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.Polyfills = void 0;
/* globals globalThis */
var Utils_1 = require("./Utils");
exports.Polyfills = {
    iCount: 0 //TTT
    // empty
};
// IE: window.console is only available when Dev Tools are open
if (!Utils_1.Utils.console) {
    var oUtilsConsole_1 = {
        cpcBasicLog: "LOG:\n",
        log: function () {
            if (oUtilsConsole_1.cpcBasicLog) {
                oUtilsConsole_1.cpcBasicLog += Array.prototype.slice.call(arguments).join(" ") + "\n";
            }
        }
    };
    oUtilsConsole_1.info = oUtilsConsole_1.log;
    oUtilsConsole_1.warn = oUtilsConsole_1.log;
    oUtilsConsole_1.error = oUtilsConsole_1.log;
    oUtilsConsole_1.debug = oUtilsConsole_1.log;
    Utils_1.Utils.console = oUtilsConsole_1;
}
if (!Utils_1.Utils.console.debug) { // IE8 has no console.debug
    Utils_1.Utils.console.debug = Utils_1.Utils.console.log;
    Utils_1.Utils.console.debug("Polyfill: window.console.debug");
}
if ((typeof globalThis !== "undefined") && !globalThis.window) { // nodeJS
    Utils_1.Utils.console.debug("Polyfill: window");
    globalThis.window = {};
}
if (!Array.prototype.indexOf) { // IE8
    Array.prototype.indexOf = function (searchElement, iFrom) {
        var iLen = this.length >>> 0; // eslint-disable-line no-bitwise
        iFrom = Number(iFrom) || 0;
        iFrom = (iFrom < 0) ? Math.ceil(iFrom) : Math.floor(iFrom);
        if (iFrom < 0) {
            iFrom += iLen;
        }
        for (; iFrom < iLen; iFrom += 1) {
            if (iFrom in this && this[iFrom] === searchElement) {
                return iFrom;
            }
        }
        return -1;
    };
}
if (!Array.prototype.map) { // IE8
    // based on: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    Utils_1.Utils.console.debug("Polyfill: Array.prototype.map");
    Array.prototype.map = function (callback, thisArg) {
        var aValues = [], oObject = Object(this), len = oObject.length;
        var T;
        if (arguments.length > 1) {
            T = thisArg;
        }
        for (var i = 0; i < len; i += 1) {
            if (i in oObject) {
                var kValue = oObject[i], mappedValue = callback.call(T, kValue, i, oObject);
                aValues[i] = mappedValue;
            }
        }
        return aValues;
    };
}
if (window.Element) {
    if (!Element.prototype.addEventListener) { // IE8
        Utils_1.Utils.console.debug("Polyfill: Element.prototype.addEventListener");
        Element.prototype.addEventListener = function (sEvent, fnCallback) {
            sEvent = "on" + sEvent;
            return this.attachEvent(sEvent, fnCallback);
        };
    }
    if (!Element.prototype.removeEventListener) { // IE8
        Utils_1.Utils.console.debug("Polyfill: Element.prototype.removeEventListener");
        Element.prototype.removeEventListener = function (sEvent, fnCallback) {
            sEvent = "on" + sEvent;
            return this.detachEvent(sEvent, fnCallback);
        };
    }
}
if (window.Event) {
    if (!Event.prototype.preventDefault) { // IE8
        Utils_1.Utils.console.debug("Polyfill: Event.prototype.preventDefault");
        Event.prototype.preventDefault = function () {
            // empty
        };
    }
    if (!Event.prototype.stopPropagation) { // IE8
        Utils_1.Utils.console.debug("Polyfill: Event.prototype.stopPropagation");
        Event.prototype.stopPropagation = function () {
            // empty
        };
    }
}
if (!Date.now) { // IE8
    Utils_1.Utils.console.debug("Polyfill: Date.now");
    Date.now = function () {
        return new Date().getTime();
    };
}
if (window.document) {
    if (!document.addEventListener) {
        // or check: https://gist.github.com/fuzzyfox/6762206
        Utils_1.Utils.console.debug("Polyfill: document.addEventListener, removeEventListener");
        if (document.attachEvent) {
            (function () {
                var aEventListeners = [];
                document.addEventListener = function (sEvent, fnHandler) {
                    var fnFindCaret = function (event) {
                        var documentSelection = document.selection; // IE only
                        if (documentSelection) {
                            var eventTarget = event.target;
                            eventTarget.focus();
                            var oRange = documentSelection.createRange(), oRange2 = oRange.duplicate();
                            if (oRange2.moveToElementTxt) { // not on IE8
                                oRange2.moveToElementTxt(event.target);
                            }
                            oRange2.setEndPoint("EndToEnd", oRange);
                            eventTarget.selectionStart = oRange2.text.length - oRange.text.length;
                            eventTarget.selectionEnd = eventTarget.selectionStart + oRange.text.length;
                        }
                    }, fnOnEvent = function (event) {
                        event = event || window.event;
                        var eventTarget = event.target || event.srcElement;
                        if (event.type === "click" && eventTarget && eventTarget.tagName === "TEXTAREA") {
                            fnFindCaret(event);
                        }
                        fnHandler(event);
                        return false;
                    };
                    // The change event is not bubbled and fired on document for old IE8. So attach it to every select tag
                    if (sEvent === "change") {
                        var aElements = document.getElementsByTagName("select");
                        for (var i = 0; i < aElements.length; i += 1) {
                            aElements[i].attachEvent("on" + sEvent, fnOnEvent);
                            aEventListeners.push({
                                object: this,
                                sEvent: sEvent,
                                fnHandler: fnHandler,
                                fnOnEvent: fnOnEvent
                            });
                        }
                    }
                    else { // e.g. "Click"
                        document.attachEvent("on" + sEvent, fnOnEvent);
                        aEventListeners.push({
                            object: this,
                            sEvent: sEvent,
                            fnHandler: fnHandler,
                            fnOnEvent: fnOnEvent
                        });
                    }
                };
                document.removeEventListener = function (sEvent, fnHandler) {
                    var counter = 0;
                    while (counter < aEventListeners.length) {
                        var oEventListener = aEventListeners[counter];
                        if (oEventListener.object === this && oEventListener.sEvent === sEvent && oEventListener.fnHandler === fnHandler) {
                            this.detachEvent("on" + sEvent, oEventListener.fnOnEvent);
                            aEventListeners.splice(counter, 1);
                            break;
                        }
                        counter += 1;
                    }
                };
            }());
        }
        else {
            Utils_1.Utils.console.log("No document.attachEvent found."); // will be ignored
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
    Utils_1.Utils.console.debug("Polyfill: Function.prototype.bind");
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
    /* does not work:
    (function () {
        //const ArrayPrototypeSlice = Array.prototype.slice; // since IE6

        Function.prototype.bind = function (thatArg: object, ...aArgs: any[]) { // eslint-disable-line no-extend-native, @typescript-eslint/ban-types
            const that = this,
                iArgs = aArgs.length;

            if (typeof that !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }
            return function (...aArgs2: any[]) {
                aArgs.length = iArgs; // set args to length of bound args
                aArgs.concat(aArgs2); // concat current args
                return that.apply(thatArg, aArgs);
            };
        };
    }());
    */
}
if (!Math.sign) { // IE11
    Utils_1.Utils.console.debug("Polyfill: Math.sign");
    Math.sign = function (x) {
        return (Number(x > 0) - Number(x < 0)) || Number(x);
    };
}
if (!Math.trunc) { // IE11
    Utils_1.Utils.console.debug("Polyfill: Math.trunc");
    Math.trunc = function (v) {
        return v < 0 ? Math.ceil(v) : Math.floor(v);
    };
}
if (!Object.assign) { // IE11
    Utils_1.Utils.console.debug("Polyfill: Object.assign");
    Object.assign = function (oTarget) {
        var oTo = oTarget;
        for (var i = 1; i < arguments.length; i += 1) {
            var oNextSource = arguments[i];
            for (var sNextKey in oNextSource) {
                if (oNextSource.hasOwnProperty(sNextKey)) {
                    oTo[sNextKey] = oNextSource[sNextKey];
                }
            }
        }
        return oTo;
    };
}
/*
if (!Object.create) { // IE8
    Utils.console.debug("Polyfill: Object.create");
    Object.create = function (proto) { // props are not supported
        function Ctor() {
            // empty
        }
        Ctor.prototype = proto;
        return new Ctor();
    };
}
*/
if (!Object.keys) { // IE8
    Utils_1.Utils.console.debug("Polyfill: Object.keys");
    // https://tokenposts.blogspot.com/2012/04/javascript-objectkeys-browser.html
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
if (!String.prototype.endsWith) {
    Utils_1.Utils.console.debug("Polyfill: String.prototype.endsWith");
    String.prototype.endsWith = function (sSearch, iPosition) {
        if (iPosition === undefined) {
            iPosition = this.length;
        }
        iPosition -= sSearch.length;
        var iLastIndex = this.indexOf(sSearch, iPosition);
        return iLastIndex !== -1 && iLastIndex === iPosition;
    };
}
if (!String.prototype.includes) { // IE11
    Utils_1.Utils.console.debug("Polyfill: String.prototype.includes");
    String.prototype.includes = function (sSearch, iStart) {
        if (iStart === void 0) { iStart = 0; }
        var bRet;
        if (iStart + sSearch.length > this.length) {
            bRet = false;
        }
        else {
            bRet = this.indexOf(sSearch, iStart) !== -1;
        }
        return bRet;
    };
}
if (!String.prototype.padStart) { // IE11
    Utils_1.Utils.console.debug("Polyfill: String.prototype.padStart");
    String.prototype.padStart = function (iTargetLength, sPad) {
        var sRet = String(this);
        iTargetLength >>= 0; // eslint-disable-line no-bitwise
        if (this.length < iTargetLength) {
            sPad = String(typeof sPad !== "undefined" ? sPad : " ");
            iTargetLength -= this.length;
            if (iTargetLength > sPad.length) {
                sPad += sPad.repeat(iTargetLength / sPad.length);
            }
            sRet = sPad.slice(0, iTargetLength) + sRet;
        }
        return sRet;
    };
}
if (!String.prototype.padEnd) { // IE11
    // based on: https://github.com/behnammodi/polyfill/blob/master/string.polyfill.js
    Utils_1.Utils.console.debug("Polyfill: String.prototype.padEnd");
    String.prototype.padEnd = function (iTargetLength, sPad) {
        var sRet = String(this);
        iTargetLength >>= 0; // eslint-disable-line no-bitwise
        if (this.length < iTargetLength) {
            sPad = String(typeof sPad !== "undefined" ? sPad : " ");
            iTargetLength -= this.length;
            if (iTargetLength > sPad.length) {
                sPad += sPad.repeat(iTargetLength / sPad.length);
            }
            sRet += sPad.slice(0, iTargetLength); // this line differs from padStart
        }
        return sRet;
    };
}
if (!String.prototype.repeat) { // IE11
    Utils_1.Utils.console.debug("Polyfill: String.prototype.repeat");
    String.prototype.repeat = function (iCount) {
        var sStr = String(this);
        var sOut = "";
        for (var i = 0; i < iCount; i += 1) {
            sOut += sStr;
        }
        return sOut;
    };
}
if (!String.prototype.startsWith) {
    Utils_1.Utils.console.debug("Polyfill: String.prototype.startsWith");
    String.prototype.startsWith = function (sSearch, iPosition) {
        iPosition = iPosition || 0;
        return this.indexOf(sSearch, iPosition) === iPosition;
    };
}
if (!String.prototype.trim) { // IE8
    Utils_1.Utils.console.debug("Polyfill: String.prototype.trim");
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    };
}
// based on: https://github.com/mathiasbynens/base64/blob/master/base64.js
// https://mths.be/base64 v0.1.0 by @mathias | MIT license
if (!Utils_1.Utils.atob) { // IE9 (and node.js)
    Utils_1.Utils.console.debug("Polyfill: window.atob, btoa");
    (function () {
        var sTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", reSpaceCharacters = /[\t\n\f\r ]/g; // http://whatwg.org/html/common-microsyntaxes.html#space-character
        /* eslint-disable no-bitwise */
        Utils_1.Utils.atob = function (sInput) {
            sInput = String(sInput).replace(reSpaceCharacters, "");
            var length = sInput.length;
            if (length % 4 === 0) {
                sInput = sInput.replace(/[=]=?$/, ""); // additional brackets to maks eslint happy
                length = sInput.length;
            }
            if (length % 4 === 1 || (/[^+a-zA-Z0-9/]/).test(sInput)) { // http://whatwg.org/C#alphanumeric-ascii-characters
                throw new TypeError("Polyfills:atob: Invalid character: the string to be decoded is not correctly encoded.");
            }
            var bitCounter = 0, output = "", position = 0, bitStorage = 0;
            while (position < length) {
                var buffer = sTable.indexOf(sInput.charAt(position));
                bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
                bitCounter += 1;
                if ((bitCounter - 1) % 4) { // Unless this is the first of a group of 4 characters...
                    output += String.fromCharCode(0xFF & bitStorage >> (-2 * bitCounter & 6)); // ...convert the first 8 bits to a single ASCII character
                }
                position += 1;
            }
            return output;
        };
        Utils_1.Utils.btoa = function (input) {
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
                output += sTable.charAt(buffer >> 18 & 0x3F) + sTable.charAt(buffer >> 12 & 0x3F) + sTable.charAt(buffer >> 6 & 0x3F) + sTable.charAt(buffer & 0x3F);
            }
            if (padding === 2) {
                var a = input.charCodeAt(position) << 8;
                position += 1;
                var b = input.charCodeAt(position), buffer = a + b;
                output += sTable.charAt(buffer >> 10) + sTable.charAt((buffer >> 4) & 0x3F) + sTable.charAt((buffer << 2) & 0x3F) + "=";
            }
            else if (padding === 1) {
                var buffer = input.charCodeAt(position);
                output += sTable.charAt(buffer >> 2) + sTable.charAt((buffer << 4) & 0x3F) + "==";
            }
            return output;
        };
        /* eslint-enable no-bitwise */
    }());
}
// For IE and Edge, localStorage is only available if page is hosted on web server, so we simulate it (do not use property "length" or method names as keys!)
if (!Utils_1.Utils.localStorage) {
    Utils_1.Utils.console.debug("Polyfill: window.localStorage");
    (function () {
        /*
            const Storage = function (this: any) {
                this.clear();
            };
    
            Storage.prototype = {
                clear: function () {
                    for (const key in this) {
                        if (this.hasOwnProperty(key)) {
                            delete this[key];
                        }
                    }
                    this.length = 0;
                },
                key: function (index: number) {
                    let i = 0;
    
                    for (const key in this) {
                        if (this.hasOwnProperty(key) && key !== "length") {
                            if (i === index) {
                                return key;
                            }
                            i += 1;
                        }
                    }
                    return null;
                },
                getItem: function (sKey: string) {
                    return this.hasOwnProperty(sKey) ? this[sKey] : null;
                },
                setItem: function (sKey: string, value: string) {
                    if (this.getItem(sKey) === null) {
                        this.length += 1;
                    }
                    this[sKey] = String(value);
                },
                removeItem: function (sKey: string) {
                    if (this.getItem(sKey) !== null) {
                        delete this[sKey];
                        this.length -= 1;
                    }
                }
            };
            */
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
            Storage.prototype.getItem = function (sKey) {
                return this.hasOwnProperty(sKey) ? this[sKey] : null;
            };
            Storage.prototype.setItem = function (sKey, value) {
                if (this.getItem(sKey) === null) {
                    this.length += 1;
                }
                this[sKey] = String(value);
            };
            Storage.prototype.removeItem = function (sKey) {
                if (this.getItem(sKey) !== null) {
                    delete this[sKey];
                    this.length -= 1;
                }
            };
            return Storage;
        }());
        Utils_1.Utils.localStorage = new Storage();
    }());
}
if (!window.ArrayBuffer) { // IE9
    Utils_1.Utils.console.debug("Polyfill: window.ArrayBuffer");
    window.ArrayBuffer = Array;
}
if (!window.AudioContext) { // ? not for IE
    window.AudioContext = window.webkitAudioContext || window.mozAudioContext;
    if (window.AudioContext) {
        Utils_1.Utils.console.debug("Polyfill: window.AudioContext");
    }
    else {
        Utils_1.Utils.console.warn("Polyfill: window.AudioContext: not ok!");
    }
}
if (!window.JSON) { // simple polyfill for JSON.parse only
    // for a better implementation, see https://github.com/douglascrockford/JSON-js/blob/master/json2.js
    Utils_1.Utils.console.debug("Polyfill: window.JSON.parse");
    window.JSON = {
        parse: function (sText) {
            var oJson = eval("(" + sText + ")"); // eslint-disable-line no-eval
            return oJson;
        },
        stringify: function (o) {
            Utils_1.Utils.console.error("Not implemented: window.JSON.stringify");
            return String(o);
        }
        //how to set: Symbol(Symbol.toStringTag): "JSON" ?
    };
}
if (!window.requestAnimationFrame) { // IE9, SliTaz tazweb browser
    // https://wiki.selfhtml.org/wiki/JavaScript/Window/requestAnimationFrame
    window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
        (function () {
            var lastTime = 0;
            Utils_1.Utils.console.debug("Polyfill: window.requestAnimationFrame, cancelAnimationFrame");
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
        Utils_1.Utils.console.debug("Polyfill: window.requestAnimationFrame, cancelAnimationFrame: Using vendor specific method.");
    }
}
if (!window.Uint8Array) { // IE9
    Utils_1.Utils.console.debug("Polyfill: Uint8Array (fallback only)");
    window.Uint8Array = function (oArrayBuffer) {
        return oArrayBuffer; // we just return the ArrayBuffer as fallback; enough for our needs
    };
    window.Uint8Array.BYTES_PER_ELEMENT = 1;
    // A more complex solution would be: https://github.com/inexorabletash/polyfill/blob/master/typedarray.js
}
Utils_1.Utils.console.debug("Polyfill: end of Polyfills");
// end
//# sourceMappingURL=Polyfills.js.map