(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('./cpcbasic.js')) :
	typeof define === 'function' && define.amd ? define(['exports', './cpcbasic'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.cpcbasicUI = {}, global.cpcbasic));
})(this, (function (exports, Engine) { 'use strict';

	var Polyfills$1 = {
	  list: [],
	  getList: function() {
	    return Polyfills$1.list;
	  },
	  log: function(part) {
	    Polyfills$1.list.push(part);
	  },
	  console: typeof window !== "undefined" ? window.console : globalThis.console,
	  localStorage: (function() {
	    let rc;
	    if (typeof window !== "undefined") {
	      try {
	        rc = window.localStorage;
	      } catch (_e) {
	      }
	    }
	    return rc;
	  })(),
	  isDefinePropertyOk: (function() {
	    if (!Object.defineProperty) {
	      return false;
	    }
	    try {
	      Object.defineProperty({}, "p1", {
	        value: "1"
	      });
	    } catch (_e) {
	      return false;
	    }
	    return true;
	  })(),
	  atob: typeof window !== "undefined" ? window.atob : void 0,
	  btoa: typeof window !== "undefined" ? window.btoa : void 0
	};
	if (!Polyfills$1.console) {
	  let logText = "LOG:\n";
	  const appendLog = (...args) => {
	    if (logText) {
	      logText += args.join(" ") + "\n";
	    }
	  };
	  const polyFillConsole = {
	    get cpcBasicLog() {
	      return logText;
	    },
	    set cpcBasicLog(value) {
	      logText = value;
	    },
	    log: appendLog,
	    info: appendLog,
	    warn: appendLog,
	    error: appendLog,
	    debug: appendLog
	  };
	  Polyfills$1.console = polyFillConsole;
	  Polyfills$1.log("window.console");
	}
	if (!Polyfills$1.console.debug) {
	  Polyfills$1.console.debug = Polyfills$1.console.log;
	  Polyfills$1.log("window.console.debug");
	}
	if (!Array.prototype.copyWithin) {
	  Polyfills$1.log("Array.prototype.copyWithin");
	  Array.prototype.copyWithin = function(target, start, end) {
	    for (let i = start; i <= end; i += 1) {
	      this[target] = this[i];
	      target += 1;
	    }
	    return this;
	  };
	}
	if (!Array.prototype.indexOf) {
	  Polyfills$1.log("Array.prototype.indexOf");
	  Array.prototype.indexOf = function(searchElement, from) {
	    const len = this.length >>> 0;
	    from = Number(from) || 0;
	    from = from < 0 ? Math.ceil(from) : Math.floor(from);
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
	if (!Array.prototype.fill) {
	  Polyfills$1.log("Array.prototype.fill");
	  Array.prototype.fill = function(value, start, end) {
	    const length = this.length;
	    start = start || 0;
	    end = end === void 0 ? length : end || 0;
	    let i = start < 0 ? Math.max(length + start, 0) : Math.min(start, length);
	    const l = end < 0 ? Math.max(length + end, 0) : Math.min(end, length);
	    for (; i < l; i += 1) {
	      this[i] = value;
	    }
	    return this;
	  };
	}
	if (!Array.prototype.filter) {
	  Polyfills$1.log("Array.prototype.filter");
	  Array.prototype.filter = function(callbackFn) {
	    const arr = [];
	    for (let i = 0; i < this.length; i += 1) {
	      if (callbackFn.call(this, this[i], i, this)) {
	        arr.push(this[i]);
	      }
	    }
	    return arr;
	  };
	}
	if (!Array.prototype.map) {
	  Polyfills$1.log("Array.prototype.map");
	  Array.prototype.map = function(callback, thisArg) {
	    const values = [], object = Object(this), len = object.length;
	    let T;
	    if (arguments.length > 1) {
	      T = thisArg;
	    }
	    for (let i = 0; i < len; i += 1) {
	      if (i in object) {
	        const kValue = object[i], mappedValue = callback.call(T, kValue, i, object);
	        values[i] = mappedValue;
	      }
	    }
	    return values;
	  };
	}
	if (window.Element) {
	  if (!Element.prototype.addEventListener) {
	    Polyfills$1.log("Element.prototype.addEventListener");
	    Element.prototype.addEventListener = function(event, fnCallback) {
	      event = "on" + event;
	      this.attachEvent?.(event, fnCallback);
	    };
	  }
	  if (!Element.prototype.removeEventListener) {
	    Polyfills$1.log("Element.prototype.removeEventListener");
	    Element.prototype.removeEventListener = function(event, fnCallback) {
	      event = "on" + event;
	      this.detachEvent?.(event, fnCallback);
	    };
	  }
	}
	if (window.Event) {
	  if (!Event.prototype.preventDefault) {
	    Polyfills$1.log("Event.prototype.preventDefault");
	    Event.prototype.preventDefault = function() {
	    };
	  }
	  if (!Event.prototype.stopPropagation) {
	    Polyfills$1.log("Event.prototype.stopPropagation");
	    Event.prototype.stopPropagation = function() {
	    };
	  }
	}
	if (!window.getComputedStyle) {
	  Polyfills$1.log("window.getComputedStyle");
	  const legacyWindow = window;
	  legacyWindow.getComputedStyle = function(el, _pseudo) {
	    this.getPropertyValue = function(prop) {
	      const re = /(-([a-z]){1})/g;
	      if (prop === "float") {
	        prop = "styleFloat";
	      }
	      if (re.test(prop)) {
	        prop = prop.replace(re, function() {
	          return arguments[2].toUpperCase();
	        });
	      }
	      const currentStyle = el.currentStyle, currentStyleValue = currentStyle ? currentStyle[prop] : void 0;
	      return currentStyleValue ? currentStyleValue : null;
	    };
	    return this;
	  };
	}
	if (!Date.now) {
	  Polyfills$1.log("Date.now");
	  Date.now = function() {
	    return (/* @__PURE__ */ new Date()).getTime();
	  };
	}
	if (window.document) {
	  if (!document.addEventListener) {
	    Polyfills$1.log("document.addEventListener, removeEventListener");
	    if (document.attachEvent) {
	      (function() {
	        const eventListeners = [];
	        document.addEventListener = function(eventString, fnHandler) {
	          const fnFindCaret = function(event) {
	            const documentSelection = document.selection;
	            if (documentSelection) {
	              const target = event.target || event.srcElement;
	              target.focus();
	              const range = documentSelection.createRange(), range2 = range.duplicate();
	              if (range2.moveToElementTxt) {
	                range2.moveToElementTxt(target);
	              }
	              range2.setEndPoint("EndToEnd", range);
	              target.selectionStart = range2.text.length - range.text.length;
	              target.selectionEnd = target.selectionStart + range.text.length;
	            }
	          }, fnOnEvent = function(event) {
	            event = event || window.event;
	            const target = event.target || event.srcElement;
	            if (event.type === "click" && target && target.tagName === "TEXTAREA") {
	              fnFindCaret(event);
	            }
	            if (typeof fnHandler === "function") {
	              fnHandler(event);
	            } else if (typeof fnHandler === "object") {
	              fnHandler.handleEvent(event);
	            } else {
	              Polyfills$1.console.error("Unknown fnHandler:", fnHandler);
	            }
	            return false;
	          };
	          if (eventString === "change") {
	            const elements = document.getElementsByTagName("select");
	            for (let i = 0; i < elements.length; i += 1) {
	              elements[i].attachEvent?.("on" + eventString, fnOnEvent);
	              eventListeners.push({
	                //TTT does this work?
	                object: this,
	                eventString,
	                fnHandler,
	                fnOnEvent
	              });
	            }
	          } else {
	            document.attachEvent?.("on" + eventString, fnOnEvent);
	            eventListeners.push({
	              object: this,
	              eventString,
	              fnHandler,
	              fnOnEvent
	            });
	          }
	        };
	        document.removeEventListener = function(event, fnHandler) {
	          let counter = 0;
	          while (counter < eventListeners.length) {
	            const eventListener = eventListeners[counter];
	            if (eventListener.object === this && eventListener.eventString === event && eventListener.fnHandler === fnHandler) {
	              this.detachEvent?.("on" + event, eventListener.fnOnEvent);
	              eventListeners.splice(counter, 1);
	              break;
	            }
	            counter += 1;
	          }
	        };
	      })();
	    } else {
	      (Polyfills$1.console || window.console).error("No document.attachEvent found.");
	      const documentPrototype = document.__proto__;
	      if (documentPrototype?.addEventListener) {
	        document.addEventListener = documentPrototype.addEventListener;
	      }
	    }
	  }
	}
	if (!Function.prototype.bind) {
	  Polyfills$1.log("Function.prototype.bind");
	  (function() {
	    const ArrayPrototypeSlice = Array.prototype.slice;
	    Function.prototype.bind = function() {
	      const that = this, thatArg = arguments[0], args = ArrayPrototypeSlice.call(arguments, 1), argLen = args.length;
	      if (typeof that !== "function") {
	        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	      }
	      return function() {
	        args.length = argLen;
	        for (let i = 0; i < arguments.length; i += 1) {
	          args.push(arguments[i]);
	        }
	        return that.apply(thatArg, args);
	      };
	    };
	  })();
	}
	if (!Math.log10) {
	  Polyfills$1.log("Math.log10");
	  Math.log10 = function(x) {
	    return Math.log(x) * Math.LOG10E;
	  };
	}
	if (!Math.sign) {
	  Polyfills$1.log("Math.sign");
	  Math.sign = function(x) {
	    return Number(x > 0) - Number(x < 0) || Number(x);
	  };
	}
	if (!Math.trunc) {
	  Polyfills$1.log("Math.trunc");
	  Math.trunc = function(v) {
	    return v < 0 ? Math.ceil(v) : Math.floor(v);
	  };
	}
	if (!Object.assign) {
	  Polyfills$1.log("Object.assign");
	  Object.assign = function(target) {
	    const to = target;
	    for (let i = 1; i < arguments.length; i += 1) {
	      const nextSource = arguments[i];
	      for (const nextKey in nextSource) {
	        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
	          to[nextKey] = nextSource[nextKey];
	        }
	      }
	    }
	    return to;
	  };
	}
	if (!Object.defineProperty || !Polyfills$1.isDefinePropertyOk) {
	  Polyfills$1.log("Object.defineProperty");
	  Object.defineProperty = function(target, prop, PropDescriptor) {
	    const targetWithProperty = target;
	    targetWithProperty[prop] = PropDescriptor.value;
	    return target;
	  };
	}
	if (!Object.keys) {
	  Polyfills$1.log("Object.keys");
	  Object.keys = function(o) {
	    const k = [];
	    if (o !== Object(o)) {
	      throw new TypeError("Object.keys called on a non-object");
	    }
	    for (const p in o) {
	      if (Object.prototype.hasOwnProperty.call(o, p)) {
	        k.push(p);
	      }
	    }
	    return k;
	  };
	}
	if (!Object.values) {
	  Polyfills$1.log("Object.values");
	  Object.values = function(o) {
	    const objectRecord = o;
	    return Object.keys(o).map(function(key) {
	      return objectRecord[key];
	    });
	  };
	}
	if (!String.prototype.endsWith) {
	  Polyfills$1.log("String.prototype.endsWith");
	  String.prototype.endsWith = function(search, position) {
	    if (position === void 0) {
	      position = this.length;
	    }
	    position -= search.length;
	    const lastIndex = this.indexOf(search, position);
	    return lastIndex !== -1 && lastIndex === position;
	  };
	}
	if (!String.prototype.includes) {
	  Polyfills$1.log("String.prototype.includes");
	  String.prototype.includes = function(search, start = 0) {
	    let ret;
	    if (start + search.length > this.length) {
	      ret = false;
	    } else {
	      ret = this.indexOf(search, start) !== -1;
	    }
	    return ret;
	  };
	}
	if (!String.prototype.padStart) {
	  Polyfills$1.log("String.prototype.padStart");
	  String.prototype.padStart = function(targetLength, pad) {
	    let ret = String(this);
	    targetLength >>= 0;
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
	if (!String.prototype.padEnd) {
	  Polyfills$1.log("String.prototype.padEnd");
	  String.prototype.padEnd = function(targetLength, pad) {
	    let ret = String(this);
	    targetLength >>= 0;
	    if (this.length < targetLength) {
	      pad = String(typeof pad !== "undefined" ? pad : " ");
	      targetLength -= this.length;
	      if (targetLength > pad.length) {
	        pad += pad.repeat(targetLength / pad.length);
	      }
	      ret += pad.slice(0, targetLength);
	    }
	    return ret;
	  };
	}
	if (!String.prototype.repeat) {
	  Polyfills$1.log("String.prototype.repeat");
	  String.prototype.repeat = function(count) {
	    const str = String(this);
	    let out = "";
	    for (let i = 0; i < count; i += 1) {
	      out += str;
	    }
	    return out;
	  };
	}
	if (!String.prototype.startsWith) {
	  Polyfills$1.log("String.prototype.startsWith");
	  String.prototype.startsWith = function(search, position) {
	    position = position || 0;
	    return this.indexOf(search, position) === position;
	  };
	}
	if (!String.prototype.trim) {
	  Polyfills$1.log("String.prototype.trim");
	  String.prototype.trim = function() {
	    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
	  };
	}
	if (!window.atob) {
	  Polyfills$1.log("window.atob, window.btoa");
	  (function() {
	    const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", reSpaceCharacters = /[\t\n\f\r ]/g;
	    window.atob = function(input) {
	      input = String(input).replace(reSpaceCharacters, "");
	      let length = input.length;
	      if (length % 4 === 0) {
	        input = input.replace(/[=]=?$/, "");
	        length = input.length;
	      }
	      if (length % 4 === 1 || /[^+a-zA-Z0-9/]/.test(input)) {
	        throw new TypeError("Polyfills:atob: Invalid character: the string to be decoded is not correctly encoded.");
	      }
	      let bitCounter = 0, output = "", position = 0, bitStorage = 0;
	      while (position < length) {
	        const buffer = table.indexOf(input.charAt(position));
	        bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
	        bitCounter += 1;
	        if ((bitCounter - 1) % 4) {
	          output += String.fromCharCode(255 & bitStorage >> (-2 * bitCounter & 6));
	        }
	        position += 1;
	      }
	      return output;
	    };
	    window.btoa = function(input) {
	      input = String(input);
	      if (/[^\0-\xFF]/.test(input)) {
	        throw new TypeError("Polyfills:btoa: The string to be encoded contains characters outside of the Latin1 range.");
	      }
	      const padding = input.length % 3, length = input.length - padding;
	      let output = "", position = 0;
	      while (position < length) {
	        const a = input.charCodeAt(position) << 16;
	        position += 1;
	        const b = input.charCodeAt(position) << 8;
	        position += 1;
	        const c = input.charCodeAt(position);
	        position += 1;
	        const buffer = a + b + c;
	        output += table.charAt(buffer >> 18 & 63) + table.charAt(buffer >> 12 & 63) + table.charAt(buffer >> 6 & 63) + table.charAt(buffer & 63);
	      }
	      if (padding === 2) {
	        const a = input.charCodeAt(position) << 8;
	        position += 1;
	        const b = input.charCodeAt(position), buffer = a + b;
	        output += table.charAt(buffer >> 10) + table.charAt(buffer >> 4 & 63) + table.charAt(buffer << 2 & 63) + "=";
	      } else if (padding === 1) {
	        const buffer = input.charCodeAt(position);
	        output += table.charAt(buffer >> 2) + table.charAt(buffer << 4 & 63) + "==";
	      }
	      return output;
	    };
	  })();
	  Polyfills$1.atob = window.atob;
	  Polyfills$1.btoa = window.btoa;
	}
	if (!Polyfills$1.localStorage) {
	  Polyfills$1.log("window.localStorage");
	  (function() {
	    class Storage {
	      constructor() {
	        this.length = 0;
	      }
	      get data() {
	        return this;
	      }
	      clear() {
	        for (const key in this) {
	          if (Object.prototype.hasOwnProperty.call(this, key)) {
	            delete this[key];
	          }
	        }
	        this.length = 0;
	      }
	      key(index) {
	        let i = 0;
	        for (const key in this) {
	          if (Object.prototype.hasOwnProperty.call(this, key) && key !== "length") {
	            if (i === index) {
	              return key;
	            }
	            i += 1;
	          }
	        }
	        return null;
	      }
	      getItem(key) {
	        return Object.prototype.hasOwnProperty.call(this, key) ? this.data[key] : null;
	      }
	      setItem(key, value) {
	        if (this.getItem(key) === null) {
	          this.length += 1;
	        }
	        this.data[key] = String(value);
	      }
	      removeItem(key) {
	        if (this.getItem(key) !== null) {
	          delete this.data[key];
	          this.length -= 1;
	        }
	      }
	    }
	    Polyfills$1.localStorage = new Storage();
	  })();
	}
	if (!window.ArrayBuffer) {
	  Polyfills$1.log("window.ArrayBuffer");
	  window.ArrayBuffer = Array;
	}
	if (!window.AudioContext) {
	  const legacyWindow = window, audioContext = legacyWindow.webkitAudioContext || legacyWindow.mozAudioContext;
	  if (audioContext) {
	    window.AudioContext = audioContext;
	    Polyfills$1.log("window.AudioContext");
	  } else {
	    Polyfills$1.log("window.AudioContext not ok!");
	  }
	}
	if (!window.JSON) {
	  Polyfills$1.log("window.JSON.parse");
	  window.JSON = {
	    parse: function(text) {
	      return eval("(" + text + ")");
	    },
	    stringify: function(o) {
	      (Polyfills$1.console || window.console).error("Not implemented: window.JSON.stringify");
	      return String(o);
	    }
	  };
	}
	if (!window.requestAnimationFrame) {
	  const legacyWindow = window;
	  const requestAnimationFrame = legacyWindow.mozRequestAnimationFrame || legacyWindow.webkitRequestAnimationFrame || legacyWindow.msRequestAnimationFrame, cancelAnimationFrame = legacyWindow.mozCancelAnimationFrame || legacyWindow.webkitCancelAnimationFrame || legacyWindow.msCancelAnimationFrame;
	  if (requestAnimationFrame) {
	    window.requestAnimationFrame = requestAnimationFrame;
	  }
	  if (cancelAnimationFrame) {
	    window.cancelAnimationFrame = cancelAnimationFrame;
	  }
	  if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
	    (function() {
	      let lastTime = 0;
	      Polyfills$1.log("window.requestAnimationFrame, cancelAnimationFrame");
	      window.requestAnimationFrame = function(callback) {
	        const currTime = Date.now(), frameDuration = 1e3 / 60, timeToCall = Math.max(0, frameDuration - (currTime - lastTime)), id = window.setTimeout(function() {
	          callback(currTime + timeToCall);
	        }, timeToCall);
	        lastTime = currTime + timeToCall;
	        return id;
	      };
	      window.cancelAnimationFrame = function(id) {
	        clearTimeout(id);
	      };
	    })();
	  } else {
	    Polyfills$1.log("window.requestAnimationFrame, cancelAnimationFrame: Using vendor specific method.");
	  }
	}
	if (!window.Uint8Array) {
	  Polyfills$1.log("Uint8Array (fallback only)");
	  const polyfillUint8Array = function(arrayBuffer) {
	    return arrayBuffer;
	  };
	  polyfillUint8Array.BYTES_PER_ELEMENT = 1;
	  window.Uint8Array = polyfillUint8Array;
	}
	if (!window.Uint8Array.prototype.copyWithin) {
	  Polyfills$1.log("Uint8Array.prototype.copyWithin");
	  window.Uint8Array.prototype.copyWithin = Array.prototype.copyWithin;
	}
	(Polyfills$1.console || window.console).debug("Polyfills: (" + Polyfills$1.getList().length + ") " + Polyfills$1.getList().join("; "));
	window.Polyfills = Polyfills$1;

	const _UiUtils = class _UiUtils {
	  static setDebug(debug) {
	    _UiUtils.debug = debug;
	  }
	  static fnLoadScriptOrStyle(script, fnSuccess, fnError) {
	    let ieTimeoutCount = 3;
	    const onScriptLoad = function(event) {
	      const type = event.type, node = event.currentTarget || event.srcElement, fullUrl = node.src || node.href, key = node.getAttribute("data-key");
	      if (_UiUtils.debug > 1) {
	        console.debug("onScriptLoad:", type, fullUrl, key);
	      }
	      node.removeEventListener("load", onScriptLoad, false);
	      node.removeEventListener("error", onScriptLoad, false);
	      if (type === "load") {
	        fnSuccess(fullUrl, key);
	      } else {
	        fnError(fullUrl, key);
	      }
	    }, onScriptReadyStateChange = function(event) {
	      const node = event ? event.currentTarget || event.srcElement : script, fullUrl = node.src || node.href, key = node.getAttribute("data-key"), node2 = node;
	      if (node2.detachEvent) {
	        node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
	      }
	      if (_UiUtils.debug > 1) {
	        console.debug("onScriptReadyStateChange: " + fullUrl);
	      }
	      if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
	        if (node2.readyState === "loading" && ieTimeoutCount) {
	          ieTimeoutCount -= 1;
	          const timeout = 200;
	          console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
	          setTimeout(function() {
	            onScriptReadyStateChange();
	          }, timeout);
	        } else {
	          console.error("onScriptReadyStateChange: Cannot load file " + fullUrl + " readystate=" + node2.readyState);
	          fnError(fullUrl, key);
	        }
	      } else {
	        fnSuccess(fullUrl, key);
	      }
	    };
	    const legacyScript = script;
	    if (legacyScript.readyState && legacyScript.attachEvent) {
	      ieTimeoutCount = 3;
	      legacyScript.attachEvent("onreadystatechange", onScriptReadyStateChange);
	    } else {
	      script.addEventListener("load", onScriptLoad, false);
	      script.addEventListener("error", onScriptLoad, false);
	    }
	    document.getElementsByTagName("head")[0].appendChild(script);
	  }
	  static stringCapitalize(str) {
	    return str.charAt(0).toUpperCase() + str.substring(1);
	  }
	  static stringTrimEnd(str) {
	    return str.replace(/[\s\uFEFF\xA0]+$/, "");
	  }
	  static string2Uint8Array(data) {
	    const buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
	    for (let i = 0; i < data.length; i += 1) {
	      view[i] = data.charCodeAt(i);
	    }
	    return view;
	  }
	  static isCustomError(e) {
	    return e.pos !== void 0;
	  }
	  static uint8Array2string(data) {
	    const callSize = 25e3;
	    let len = data.length, offset = 0, out = "";
	    while (len) {
	      const chunkLen = Math.min(len, callSize), chunk = data.slice ? data.slice(offset, offset + chunkLen) : data.subarray(offset, offset + chunkLen);
	      out += String.fromCharCode.apply(null, Array.from(chunk));
	      offset += chunkLen;
	      len -= chunkLen;
	    }
	    return out;
	  }
	  static composeError(name, errorObject, message, value, pos, len, line, hidden) {
	    const customError = errorObject;
	    customError.name = name;
	    customError.message = message;
	    customError.value = value;
	    if (pos !== void 0) {
	      customError.pos = pos;
	    }
	    if (len !== void 0) {
	      customError.len = len;
	    }
	    if (line !== customError.line) {
	      customError.line = line;
	    }
	    if (hidden !== void 0) {
	      customError.hidden = hidden;
	    }
	    let errorLen = customError.len;
	    if (errorLen === void 0 && customError.value !== void 0) {
	      errorLen = String(customError.value).length;
	    }
	    const endPos = (customError.pos || 0) + (errorLen || 0), lineMsg = customError.line !== void 0 ? " in " + customError.line : "", posMsg = pos !== void 0 ? " at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos) : "";
	    customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
	    customError.message += lineMsg + posMsg + ": " + customError.value;
	    return customError;
	  }
	};
	_UiUtils.debug = 0;
	_UiUtils.console = console;
	_UiUtils.loadScript = (url, fnSuccess, fnError, key) => {
	  const script = document.createElement("script");
	  script.type = "text/javascript";
	  script.charset = "utf-8";
	  script.async = true;
	  script.src = url;
	  script.setAttribute("data-key", key);
	  _UiUtils.fnLoadScriptOrStyle(script, fnSuccess, fnError);
	};
	let UiUtils = _UiUtils;

	var ModelPropID = /* @__PURE__ */ ((ModelPropID2) => {
	  ModelPropID2["arrayBounds"] = "arrayBounds";
	  ModelPropID2["autorun"] = "autorun";
	  ModelPropID2["basicVersion"] = "basicVersion";
	  ModelPropID2["canvasType"] = "canvasType";
	  ModelPropID2["databaseDirs"] = "databaseDirs";
	  ModelPropID2["database"] = "database";
	  ModelPropID2["debug"] = "debug";
	  ModelPropID2["example"] = "example";
	  ModelPropID2["exampleIndex"] = "exampleIndex";
	  ModelPropID2["implicitLines"] = "implicitLines";
	  ModelPropID2["input"] = "input";
	  ModelPropID2["integerOverflow"] = "integerOverflow";
	  ModelPropID2["kbdLayout"] = "kbdLayout";
	  ModelPropID2["linesOnLoad"] = "linesOnLoad";
	  ModelPropID2["dragElements"] = "dragElements";
	  ModelPropID2["palette"] = "palette";
	  ModelPropID2["prettyBrackets"] = "prettyBrackets";
	  ModelPropID2["prettyColons"] = "prettyColons";
	  ModelPropID2["prettyLowercaseVars"] = "prettyLowercaseVars";
	  ModelPropID2["prettySpace"] = "prettySpace";
	  ModelPropID2["processFileImports"] = "processFileImports";
	  ModelPropID2["random"] = "random";
	  ModelPropID2["selectDataFiles"] = "selectDataFiles";
	  ModelPropID2["showConsoleLog"] = "showConsoleLog";
	  ModelPropID2["showCpc"] = "showCpc";
	  ModelPropID2["showDisass"] = "showDisass";
	  ModelPropID2["showExport"] = "showExport";
	  ModelPropID2["showGallery"] = "showGallery";
	  ModelPropID2["showInput"] = "showInput";
	  ModelPropID2["showInp2"] = "showInp2";
	  ModelPropID2["showKbd"] = "showKbd";
	  ModelPropID2["showKbdSettings"] = "showKbdSettings";
	  ModelPropID2["showMore"] = "showMore";
	  ModelPropID2["showOutput"] = "showOutput";
	  ModelPropID2["showPretty"] = "showPretty";
	  ModelPropID2["showRenum"] = "showRenum";
	  ModelPropID2["showResult"] = "showResult";
	  ModelPropID2["showSettings"] = "showSettings";
	  ModelPropID2["showVariable"] = "showVariable";
	  ModelPropID2["showView"] = "showView";
	  ModelPropID2["sound"] = "sound";
	  ModelPropID2["speed"] = "speed";
	  ModelPropID2["trace"] = "trace";
	  return ModelPropID2;
	})(ModelPropID || {});

	var ViewID = /* @__PURE__ */ ((ViewID2) => {
	  ViewID2["arrayBoundsInput"] = "arrayBoundsInput";
	  ViewID2["autorunInput"] = "autorunInput";
	  ViewID2["basicVersionSelect"] = "basicVersionSelect";
	  ViewID2["canvasTypeSelect"] = "canvasTypeSelect";
	  ViewID2["clearInputButton"] = "clearInputButton";
	  ViewID2["consoleLogArea"] = "consoleLogArea";
	  ViewID2["consoleLogText"] = "consoleLogText";
	  ViewID2["continueButton"] = "continueButton";
	  ViewID2["copyTextButton"] = "copyTextButton";
	  ViewID2["cpcArea"] = "cpcArea";
	  ViewID2["cpcCanvas"] = "cpcCanvas";
	  ViewID2["databaseSelect"] = "databaseSelect";
	  ViewID2["debugInput"] = "debugInput";
	  ViewID2["directorySelect"] = "directorySelect";
	  ViewID2["disassArea"] = "disassArea";
	  ViewID2["disassInput"] = "disassInput";
	  ViewID2["disassText"] = "disassText";
	  ViewID2["downloadButton"] = "downloadButton";
	  ViewID2["dropZone"] = "dropZone";
	  ViewID2["enterButton"] = "enterButton";
	  ViewID2["exampleSelect"] = "exampleSelect";
	  ViewID2["exportArea"] = "exportArea";
	  ViewID2["exportButton"] = "exportButton";
	  ViewID2["exportBase64Input"] = "exportBase64Input";
	  ViewID2["exportDSKInput"] = "exportDSKInput";
	  ViewID2["exportDSKFormatSelect"] = "exportDSKFormatSelect";
	  ViewID2["exportDSKStripEmptyInput"] = "exportDSKStripEmptyInput";
	  ViewID2["exportFileSelect"] = "exportFileSelect";
	  ViewID2["exportTokenizedInput"] = "exportTokenizedInput";
	  ViewID2["fileInput"] = "fileInput";
	  ViewID2["fullscreenButton"] = "fullscreenButton";
	  ViewID2["galleryArea"] = "galleryArea";
	  ViewID2["galleryAreaItems"] = "galleryAreaItems";
	  ViewID2["galleryButton"] = "galleryButton";
	  ViewID2["galleryItem"] = "galleryItem";
	  ViewID2["helpButton"] = "helpButton";
	  ViewID2["implicitLinesInput"] = "implicitLinesInput";
	  ViewID2["inp2Area"] = "inp2Area";
	  ViewID2["inp2Text"] = "inp2Text";
	  ViewID2["inputArea"] = "inputArea";
	  ViewID2["inputText"] = "inputText";
	  ViewID2["integerOverflowInput"] = "integerOverflowInput";
	  ViewID2["kbdAlpha"] = "kbdAlpha";
	  ViewID2["kbdArea"] = "kbdArea";
	  ViewID2["kbdAreaInner"] = "kbdAreaInner";
	  ViewID2["kbdLayoutSelect"] = "kbdLayoutSelect";
	  ViewID2["kbdNum"] = "kbdNum";
	  ViewID2["lineNumberAddButton"] = "lineNumberAddButton";
	  ViewID2["lineNumberRemoveButton"] = "lineNumberRemoveButton";
	  ViewID2["linesOnLoadInput"] = "linesOnLoadInput";
	  ViewID2["mainArea"] = "mainArea";
	  ViewID2["moreArea"] = "moreArea";
	  ViewID2["moreButton"] = "moreButton";
	  ViewID2["dragElementsInput"] = "dragElementsInput";
	  ViewID2["noCanvas"] = "noCanvas";
	  ViewID2["outputArea"] = "outputArea";
	  ViewID2["outputText"] = "outputText";
	  ViewID2["pageBody"] = "pageBody";
	  ViewID2["paletteSelect"] = "paletteSelect";
	  ViewID2["parseButton"] = "parseButton";
	  ViewID2["parseRunButton"] = "parseRunButton";
	  ViewID2["prettyArea"] = "prettyArea";
	  ViewID2["prettyBracketsInput"] = "prettyBracketsInput";
	  ViewID2["prettyButton"] = "prettyButton";
	  ViewID2["prettyColonsInput"] = "prettyColonsInput";
	  ViewID2["prettyLowercaseVarsInput"] = "prettyLowercaseVarsInput";
	  ViewID2["prettyPopoverButton"] = "prettyPopoverButton";
	  ViewID2["prettySpaceInput"] = "prettySpaceInput";
	  ViewID2["redoButton"] = "redoButton";
	  ViewID2["redoButton2"] = "redoButton2";
	  ViewID2["renumArea"] = "renumArea";
	  ViewID2["renumButton"] = "renumButton";
	  ViewID2["renumKeepInput"] = "renumKeepInput";
	  ViewID2["renumNewInput"] = "renumNewInput";
	  ViewID2["renumPopoverButton"] = "renumPopoverButton";
	  ViewID2["renumStartInput"] = "renumStartInput";
	  ViewID2["renumStepInput"] = "renumStepInput";
	  ViewID2["resetButton"] = "resetButton";
	  ViewID2["resultArea"] = "resultArea";
	  ViewID2["resultText"] = "resultText";
	  ViewID2["runButton"] = "runButton";
	  ViewID2["screenshotButton"] = "screenshotButton";
	  ViewID2["screenshotLink"] = "screenshotLink";
	  ViewID2["selectDataFilesInput"] = "selectDataFilesInput";
	  ViewID2["settingsArea"] = "settingsArea";
	  ViewID2["settingsButton"] = "settingsButton";
	  ViewID2["showConsoleLogInput"] = "showConsoleLogInput";
	  ViewID2["showCpcInput"] = "showCpcInput";
	  ViewID2["showDisassInput"] = "showDisassInput";
	  ViewID2["showInp2Input"] = "showInp2Input";
	  ViewID2["showInputInput"] = "showInputInput";
	  ViewID2["showKbdInput"] = "showKbdInput";
	  ViewID2["showOutputInput"] = "showOutputInput";
	  ViewID2["showResultInput"] = "showResultInput";
	  ViewID2["showVariableInput"] = "showVariableInput";
	  ViewID2["soundInput"] = "soundInput";
	  ViewID2["speedInput"] = "speedInput";
	  ViewID2["stopButton"] = "stopButton";
	  ViewID2["traceInput"] = "traceInput";
	  ViewID2["textCanvasDiv"] = "textCanvasDiv";
	  ViewID2["textText"] = "textText";
	  ViewID2["undoButton"] = "undoButton";
	  ViewID2["undoButton2"] = "undoButton2";
	  ViewID2["variableArea"] = "variableArea";
	  ViewID2["varSelect"] = "varSelect";
	  ViewID2["varText"] = "varText";
	  ViewID2["userKeys"] = "userKeys";
	  ViewID2["viewArea"] = "viewArea";
	  ViewID2["viewButton"] = "viewButton";
	  ViewID2["window"] = "window";
	  return ViewID2;
	})(ViewID || {});

	const _View = class _View {
	  static setDocument(doc) {
	    _View.myDocument = doc;
	  }
	  static getDocument() {
	    const doc = _View.myDocument ?? (typeof document !== "undefined" ? document : void 0);
	    if (!doc) {
	      throw new Error("View requires a document");
	    }
	    return doc;
	  }
	  static getElementById1(id) {
	    const element = _View.getDocument().getElementById(id);
	    if (!element) {
	      throw new Error("Unknown " + id);
	    }
	    return element;
	  }
	  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	  static getElementByIdAs(id) {
	    return _View.getElementById1(id);
	  }
	  getHidden(id) {
	    const element = _View.getElementById1(id);
	    return element.className.indexOf("displayNone") >= 0;
	  }
	  setHidden(id, hidden, display) {
	    const element = _View.getElementById1(id), displayVisible = "display" + UiUtils.stringCapitalize(display || "block");
	    if (hidden) {
	      if (element.className.indexOf("displayNone") < 0) {
	        this.toggleClass(id, "displayNone");
	      }
	      if (element.className.indexOf(displayVisible) >= 0) {
	        this.toggleClass(id, displayVisible);
	      }
	    } else {
	      if (element.className.indexOf("displayNone") >= 0) {
	        this.toggleClass(id, "displayNone");
	      }
	      if (element.className.indexOf(displayVisible) < 0) {
	        this.toggleClass(id, displayVisible);
	      }
	    }
	    return this;
	  }
	  setDisabled(id, disabled) {
	    const element = _View.getElementByIdAs(id);
	    element.disabled = disabled;
	    return this;
	  }
	  toggleClass(id, className) {
	    const element = _View.getElementById1(id);
	    let classes = element.className;
	    const nameIndex = classes.indexOf(className);
	    if (nameIndex === -1) {
	      classes = classes.trim() + " " + className;
	    } else {
	      classes = classes.substring(0, nameIndex) + classes.substring(nameIndex + className.length + 1).trim();
	    }
	    element.className = classes;
	  }
	  getAreaValue(id) {
	    const element = _View.getElementByIdAs(id);
	    return element.value;
	  }
	  setAreaValue(id, value) {
	    const element = _View.getElementByIdAs(id);
	    element.value = value;
	    return this;
	  }
	  getInputValue(id) {
	    const element = _View.getElementByIdAs(id);
	    return element.value;
	  }
	  setInputValue(id, value) {
	    const element = _View.getElementByIdAs(id);
	    element.value = value;
	    return this;
	  }
	  getInputChecked(id) {
	    const element = _View.getElementByIdAs(id);
	    return element.checked;
	  }
	  setInputChecked(id, checked) {
	    const element = _View.getElementByIdAs(id);
	    element.checked = checked;
	    return this;
	  }
	  setAreaInputList(id, inputs) {
	    const element = _View.getElementByIdAs(id), childNodes = element.childNodes;
	    while (childNodes.length && childNodes[0].nodeType !== Node.ELEMENT_NODE) {
	      element.removeChild(element.firstChild);
	    }
	    for (let i = 0; i < inputs.length; i += 1) {
	      const item = inputs[i];
	      let input, label;
	      if (i * 2 >= childNodes.length) {
	        input = _View.getDocument().createElement("input");
	        input.type = "radio";
	        input.id = "galleryItem" + i;
	        input.name = "gallery";
	        input.value = item.value;
	        input.checked = item.checked;
	        label = _View.getDocument().createElement("label");
	        label.setAttribute("for", "galleryItem" + i);
	        label.setAttribute("style", 'background: url("' + item.imgUrl + '"); background-size: cover');
	        label.setAttribute("title", item.title);
	        element.appendChild(input);
	        element.appendChild(label);
	      } else {
	        input = childNodes[i * 2];
	        if (input.value !== item.value) {
	          if (UiUtils.debug > 3) {
	            UiUtils.console.debug("setInputList: " + id + ": value changed for index " + i + ": " + item.value);
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
	    while (element.childElementCount > inputs.length * 2) {
	      element.removeChild(element.lastChild);
	    }
	    return this;
	  }
	  setSelectOptions(id, options) {
	    const element = _View.getElementByIdAs(id), optionList = [], existingElements = element.length;
	    for (let i = existingElements; i < options.length; i += 1) {
	      const item = options[i], option = _View.getDocument().createElement("option");
	      option.value = item.value;
	      option.text = item.text;
	      option.title = item.title;
	      option.selected = item.selected;
	      optionList.push(option);
	    }
	    for (let i = 0; i < options.length; i += 1) {
	      if (i >= existingElements) {
	        element.add(optionList[i - existingElements], null);
	      } else {
	        const item = options[i], option = element.options[i];
	        if (option.value !== item.value) {
	          option.value = item.value;
	        }
	        if (option.text !== item.text) {
	          if (UiUtils.debug > 3) {
	            UiUtils.console.debug("setSelectOptions: " + id + ": text changed for index " + i + ": " + item.text);
	          }
	          option.text = item.text;
	          option.title = item.title;
	        }
	        option.selected = item.selected;
	      }
	    }
	    element.options.length = options.length;
	    return this;
	  }
	  getSelectOptions(id) {
	    const element = _View.getElementByIdAs(id), elementOptions = element.options, options = [];
	    for (let i = 0; i < elementOptions.length; i += 1) {
	      const elementOption = elementOptions[i];
	      options.push({
	        value: elementOption.value,
	        text: elementOption.text,
	        title: elementOption.title,
	        selected: elementOption.selected
	      });
	    }
	    return options;
	  }
	  getSelectValue(id) {
	    const element = _View.getElementByIdAs(id);
	    return element.value;
	  }
	  setSelectValue(id, value) {
	    const element = _View.getElementByIdAs(id);
	    if (value) {
	      element.value = value;
	    }
	    return this;
	  }
	  setSelectTitleFromSelectedOption(id) {
	    const element = _View.getElementByIdAs(id), selectedIndex = element.selectedIndex, title = selectedIndex >= 0 ? element.options[selectedIndex].title : "";
	    element.title = title;
	    return this;
	  }
	  setAreaScrollTop(id, scrollTop) {
	    const element = _View.getElementByIdAs(id);
	    if (scrollTop === void 0) {
	      scrollTop = element.scrollHeight;
	    }
	    element.scrollTop = scrollTop;
	    return this;
	  }
	  setSelectionRange(textarea, selectionStart, selectionEnd) {
	    const fullText = textarea.value;
	    textarea.value = fullText.substring(0, selectionEnd);
	    const scrollHeight = textarea.scrollHeight;
	    textarea.value = fullText;
	    const textareaHeight = textarea.clientHeight;
	    let scrollTop = scrollHeight;
	    if (scrollTop > textareaHeight) {
	      scrollTop -= textareaHeight / 2;
	    } else {
	      scrollTop = 0;
	    }
	    textarea.scrollTop = scrollTop;
	    textarea.setSelectionRange(selectionStart, selectionEnd);
	    return this;
	  }
	  setAreaSelection(id, pos, endPos) {
	    const element = _View.getElementByIdAs(id);
	    if (element.selectionStart !== void 0) {
	      if (element.setSelectionRange !== void 0) {
	        element.focus();
	        this.setSelectionRange(element, pos, endPos);
	      } else {
	        element.focus();
	        element.selectionStart = pos;
	        element.selectionEnd = endPos;
	      }
	    }
	    return this;
	  }
	  addEventListener(type, eventListener, element) {
	    if (element) {
	      element.addEventListener(type, eventListener, false);
	    } else {
	      _View.getDocument().addEventListener(type, eventListener, false);
	    }
	    return this;
	  }
	  addEventListenerById(type, eventListener, id) {
	    if (UiUtils.debug) {
	      UiUtils.console.debug("addEventListenerById: type=" + type + ", id=" + id);
	    }
	    const element = id === ViewID.window ? void 0 : _View.getElementById1(id);
	    this.addEventListener(type, eventListener, element);
	    return this;
	  }
	  removeEventListener(type, eventListener, element) {
	    if (element) {
	      element.removeEventListener(type, eventListener, false);
	    } else {
	      _View.getDocument().removeEventListener(type, eventListener, false);
	    }
	    return this;
	  }
	  removeEventListenerById(type, eventListener, id) {
	    if (UiUtils.debug) {
	      UiUtils.console.debug("removeEventListener: type=" + type + ", id=" + id);
	    }
	    const element = id === ViewID.window ? void 0 : _View.getElementById1(id);
	    this.removeEventListener(type, eventListener, element);
	    return this;
	  }
	  static getPointerEventNames() {
	    let eventNames;
	    if (window.PointerEvent) {
	      eventNames = _View.pointerEventNames;
	    } else if ("ontouchstart" in window || navigator.maxTouchPoints) {
	      eventNames = _View.touchEventNames;
	    } else {
	      eventNames = _View.mouseEventNames;
	    }
	    return eventNames;
	  }
	  fnAttachPointerEvents(id, fnDown, fnMove, fnUp) {
	    const element = id === ViewID.window ? void 0 : _View.getElementById1(id), eventNames = _View.getPointerEventNames();
	    if (fnDown) {
	      this.addEventListener(eventNames.down, fnDown, element);
	    }
	    if (fnMove) {
	      this.addEventListener(eventNames.move, fnMove, element);
	    }
	    if (fnUp) {
	      this.addEventListener(eventNames.up, fnUp, element);
	      if (eventNames.cancel) {
	        this.addEventListener(eventNames.cancel, fnUp, element);
	      }
	    }
	    return eventNames;
	  }
	  fnDetachPointerEvents(id, fnDown, fnMove, fnUp) {
	    const element = id === ViewID.window ? void 0 : _View.getElementById1(id), eventNames = _View.getPointerEventNames();
	    if (fnDown) {
	      this.removeEventListener(eventNames.down, fnDown, element);
	    }
	    if (fnMove) {
	      this.removeEventListener(eventNames.move, fnMove, element);
	    }
	    if (fnUp) {
	      this.removeEventListener(eventNames.up, fnUp, element);
	      if (eventNames.cancel) {
	        this.removeEventListener(eventNames.cancel, fnUp, element);
	      }
	    }
	    return eventNames;
	  }
	  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	  static getEventTarget(event) {
	    const target = event.target || event.srcElement;
	    if (!target) {
	      UiUtils.console.error("getEventTarget: Undefined event target: " + target);
	    }
	    return target;
	  }
	  requestFullscreenForId(id) {
	    const element = _View.getElementById1(id), legacyElement = element, activeXObject = window.ActiveXObject, requestMethod = element.requestFullscreen || legacyElement.webkitRequestFullscreen || legacyElement.mozRequestFullScreen || legacyElement.msRequestFullscreen, fullscreenchangedHandler = (event) => {
	      const target = _View.getEventTarget(event), fullscreenElement = _View.getDocument().fullscreenElement;
	      if (fullscreenElement) {
	        if (UiUtils.debug > 0) {
	          UiUtils.console.debug("Entered fullscreen mode: " + fullscreenElement.id);
	        }
	      } else {
	        if (UiUtils.debug > 0) {
	          UiUtils.console.debug("Leaving fullscreen mode.");
	        }
	        this.removeEventListener("fullscreenchange", fullscreenchangedHandler, target);
	        this.setHidden(id, true);
	        window.setTimeout(() => {
	          this.setHidden(id, false);
	        }, 0);
	      }
	    };
	    if (requestMethod) {
	      const promise = requestMethod.call(element);
	      if (promise) {
	        promise.then(() => {
	          if (UiUtils.debug > 0) {
	            UiUtils.console.debug("requestFullscreenForId: " + id + ": success");
	          }
	          this.addEventListenerById("fullscreenchange", fullscreenchangedHandler, id);
	        }).catch(function(err) {
	          UiUtils.console.error("requestFullscreenForId: " + id + ": Error attempting to enable fullscreen mode: ", err);
	        });
	      }
	    } else if (activeXObject) {
	      const wscript = new activeXObject("WScript.Shell");
	      if (wscript !== null) {
	        wscript.SendKeys("{F11}");
	      }
	    } else {
	      return false;
	    }
	    return true;
	  }
	  // https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
	  fnDownloadBlob(data, filename) {
	    if (typeof Blob === "undefined") {
	      UiUtils.console.warn("fnDownloadBlob: Blob undefined");
	      return;
	    }
	    const data8 = UiUtils.string2Uint8Array(data), type = "octet/stream", blob = new Blob([data8.buffer], {
	      type
	    });
	    const legacyNavigator = window.navigator;
	    if (window.navigator && legacyNavigator.msSaveOrOpenBlob) {
	      legacyNavigator.msSaveOrOpenBlob(blob, filename);
	      return;
	    }
	    const url = URL.createObjectURL(blob), a = _View.getDocument().createElement("a"), clickHandler = function() {
	      setTimeout(function() {
	        URL.revokeObjectURL(url);
	        a.removeEventListener("click", clickHandler);
	      }, 150);
	    };
	    a.href = url;
	    a.download = filename || "download";
	    this.addEventListener("click", clickHandler, a);
	    a.click();
	  }
	};
	_View.pointerEventNames = {
	  down: "pointerdown",
	  move: "pointermove",
	  up: "pointerup",
	  cancel: "pointercancel",
	  out: "pointerout",
	  type: "pointer"
	};
	_View.touchEventNames = {
	  down: "touchstart",
	  move: "touchmove",
	  up: "touchend",
	  cancel: "touchcancel",
	  out: "",
	  // n.a.
	  type: "touch"
	};
	_View.mouseEventNames = {
	  down: "mousedown",
	  move: "mousemove",
	  up: "mouseup",
	  cancel: "",
	  // n.a.
	  out: "mouseout",
	  type: "mouse"
	};
	let View = _View;

	const _Canvas = class _Canvas {
	  constructor(options) {
	    this.fps = 15;
	    // FPS for canvas update
	    this.isRunning = false;
	    this.customCharset = {};
	    this.gColMode = 0;
	    // 0=normal, 1=xor, 2=and, 3=or
	    this.mask = 255;
	    this.maskBit = 128;
	    this.maskFirst = 1;
	    this.offset = 0;
	    this.borderWidth = 4;
	    this.needUpdate = false;
	    this.colorValues = [];
	    this.currentInks = [];
	    this.speedInk = [];
	    this.inkSet = 0;
	    this.pen2ColorMap = [];
	    this.littleEndian = true;
	    this.use32BitCopy = true;
	    // determined later
	    this.gPen = 0;
	    this.gPaper = 0;
	    this.speedInkCount = 0;
	    // usually 10
	    this.hasFocus = false;
	    // canvas has focus
	    this.mode = 0;
	    this.modeData = _Canvas.modeData[0];
	    this.xPos = 0;
	    this.yPos = 0;
	    this.xOrig = 0;
	    this.yOrig = 0;
	    this.xLeft = 0;
	    this.xRight = 639;
	    this.yTop = 399;
	    this.yBottom = 0;
	    this.gTransparent = false;
	    this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
	    this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);
	    this.options = {};
	    this.setOptions(options, true);
	    const canvas = View.getElementByIdAs(this.options.canvasID);
	    this.canvas = canvas;
	    this.cpcAreaBox = View.getElementById1(ViewID.cpcArea);
	    if (canvas.offsetParent === null) {
	      UiUtils.console.error("Error: canvas is not visible!");
	    }
	    const width = canvas.width, height = canvas.height;
	    this.width = width;
	    this.height = height;
	    this.dataset8 = new Uint8Array(new ArrayBuffer(width * height));
	    this.animationTimeoutId = void 0;
	    this.animationFrame = void 0;
	    if (this.canvas.getContext) {
	      this.ctx = this.canvas.getContext("2d");
	      this.imageData = this.ctx.getImageData(0, 0, width, height);
	      if (typeof Uint32Array !== "undefined" && this.imageData.data.buffer) {
	        this.littleEndian = _Canvas.isLittleEndian();
	        this.pen2Color32 = new Uint32Array(new ArrayBuffer(_Canvas.modeData[3].pens * 4));
	        this.data32 = new Uint32Array(this.imageData.data.buffer);
	        this.use32BitCopy = true;
	        UiUtils.console.log("Canvas: using optimized copy2Canvas32bit, littleEndian:", this.littleEndian);
	      } else {
	        this.setAlpha(255);
	        this.use32BitCopy = false;
	        UiUtils.console.log("Canvas: using copy2Canvas8bit");
	      }
	      this.fnCopy2Canvas = this.getCopy2CanvasFunction(this.offset);
	    } else {
	      UiUtils.console.warn("Error: canvas.getContext is not supported.");
	      this.fnCopy2Canvas = () => {
	      };
	      this.ctx = {};
	      this.imageData = {};
	    }
	    this.reset();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options, force) {
	    const currentPalette = this.options.palette;
	    Object.assign(this.options, options);
	    if (force || this.options.palette !== currentPalette) {
	      this.applyPalette();
	    }
	  }
	  applyBorderColor() {
	    this.canvas.style.borderColor = _Canvas.palettes[this.options.palette][this.currentInks[this.inkSet][16]];
	  }
	  reset() {
	    this.changeMode(1);
	    this.inkSet = 0;
	    this.setDefaultInks();
	    this.speedInk[0] = 10;
	    this.speedInk[1] = 10;
	    this.speedInkCount = this.speedInk[this.inkSet];
	    this.applyBorderColor();
	    this.setGPen(1);
	    this.setGPaper(0);
	    this.setGColMode(0);
	    this.resetCustomChars();
	    this.setMode(1);
	    this.clearGraphicsWindow();
	  }
	  resetCustomChars() {
	    this.customCharset = {};
	  }
	  static computePalette(palette) {
	    if (palette === "green" || palette === "grey") {
	      const colorPalette = _Canvas.palettes.color, colorValues = [], monoPalette = [];
	      _Canvas.extractAllColorValues(colorPalette, colorValues);
	      for (let i = 0; i < colorPalette.length; i += 1) {
	        const monoValue = 0.299 * colorValues[i][0] + 0.587 * colorValues[i][1] + 0.114 * colorValues[i][2] | 0, monoHex = monoValue.toString(16).toUpperCase().padStart(2, "0");
	        monoPalette[i] = palette === "green" ? "#00" + monoHex + "00" : "#" + monoHex + monoHex + monoHex;
	      }
	      _Canvas.palettes[palette] = monoPalette;
	    }
	  }
	  applyPalette() {
	    const palette = this.options.palette;
	    if (!_Canvas.palettes[palette]) {
	      _Canvas.computePalette(palette);
	    }
	    this.setColorValues(_Canvas.palettes[palette]);
	    if (this.currentInks.length) {
	      this.updateColorMap();
	      this.setNeedUpdate();
	      this.applyBorderColor();
	    }
	  }
	  static isLittleEndian() {
	    const b = new ArrayBuffer(4), a = new Uint32Array(b), c = new Uint8Array(b);
	    a[0] = 3735928559;
	    return c[0] === 239;
	  }
	  static extractColorValues(color) {
	    return [
	      parseInt(color.substring(1, 3), 16),
	      parseInt(color.substring(3, 5), 16),
	      parseInt(color.substring(5, 7), 16)
	    ];
	  }
	  static extractAllColorValues(colors, colorValues) {
	    for (let i = 0; i < colors.length; i += 1) {
	      colorValues[i] = _Canvas.extractColorValues(colors[i]);
	    }
	  }
	  setColorValues(palette) {
	    _Canvas.extractAllColorValues(palette, this.colorValues);
	  }
	  setAlpha(alpha) {
	    const buf8 = this.imageData.data, length = this.dataset8.length;
	    for (let i = 0; i < length; i += 1) {
	      buf8[i * 4 + 3] = alpha;
	    }
	  }
	  setNeedUpdate() {
	    this.needUpdate = true;
	  }
	  updateCanvas2() {
	    if (!this.isRunning) {
	      return;
	    }
	    this.animationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
	    if (this.needUpdate) {
	      this.needUpdate = false;
	      this.fnCopy2Canvas();
	    }
	  }
	  // http://creativejs.com/resources/requestanimationframe/ (set frame rate)
	  // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
	  updateCanvas() {
	    this.animationTimeoutId = window.setTimeout(this.fnUpdateCanvas2Handler, 1e3 / this.fps);
	  }
	  startUpdateCanvas() {
	    if (!this.isRunning && this.canvas.offsetParent !== null) {
	      this.isRunning = true;
	      this.updateCanvas();
	    }
	  }
	  stopUpdateCanvas() {
	    if (this.isRunning) {
	      this.isRunning = false;
	      if (this.animationFrame) {
	        cancelAnimationFrame(this.animationFrame);
	        this.animationFrame = void 0;
	      }
	      clearTimeout(this.animationTimeoutId);
	      this.animationTimeoutId = void 0;
	    }
	  }
	  copy2Canvas8bit() {
	    const buf8 = this.imageData.data, dataset8 = this.dataset8, length = dataset8.length, pen2ColorMap = this.pen2ColorMap;
	    for (let i = 0; i < length; i += 1) {
	      const color = pen2ColorMap[dataset8[i]], j = i * 4;
	      buf8[j] = color[0];
	      buf8[j + 1] = color[1];
	      buf8[j + 2] = color[2];
	    }
	    this.ctx.putImageData(this.imageData, 0, 0);
	  }
	  copy2Canvas32bit() {
	    const dataset8 = this.dataset8, data32 = this.data32, pen2Color32 = this.pen2Color32;
	    for (let i = 0; i < data32.length; i += 1) {
	      data32[i] = pen2Color32[dataset8[i]];
	    }
	    this.ctx.putImageData(this.imageData, 0, 0);
	  }
	  copy2Canvas32bitWithOffset() {
	    const dataset8 = this.dataset8, data32 = this.data32, pen2Color32 = this.pen2Color32, offset = this.offset;
	    for (let i = 0; i < data32.length - offset; i += 1) {
	      data32[i + offset] = pen2Color32[dataset8[i]];
	    }
	    for (let i = data32.length - offset; i < data32.length; i += 1) {
	      data32[i + offset - data32.length] = pen2Color32[dataset8[i]];
	    }
	    this.ctx.putImageData(this.imageData, 0, 0);
	  }
	  getCopy2CanvasFunction(offset) {
	    if (this.use32BitCopy) {
	      return offset ? this.copy2Canvas32bitWithOffset : this.copy2Canvas32bit;
	    }
	    return offset ? this.copy2Canvas8bit : this.copy2Canvas8bit;
	  }
	  setScreenOffset(offset) {
	    if (offset) {
	      offset = offset % 80 * 8 + (offset / 80 | 0) * 80 * 16 * 8;
	      offset = 640 * 400 - offset;
	    }
	    if (offset !== this.offset) {
	      this.offset = offset;
	      this.fnCopy2Canvas = this.getCopy2CanvasFunction(offset);
	      this.setNeedUpdate();
	    }
	  }
	  updateColorMap() {
	    const colorValues = this.colorValues, currentInksInSet = this.currentInks[this.inkSet], pen2ColorMap = this.pen2ColorMap, pen2Color32 = this.pen2Color32, maxPens = 16, alpha = 255;
	    for (let i = 0; i < maxPens; i += 1) {
	      pen2ColorMap[i] = colorValues[currentInksInSet[i]];
	    }
	    if (pen2Color32) {
	      for (let i = 0; i < maxPens; i += 1) {
	        const color = pen2ColorMap[i];
	        if (this.littleEndian) {
	          pen2Color32[i] = color[0] + color[1] * 256 + color[2] * 65536 + alpha * 65536 * 256;
	        } else {
	          pen2Color32[i] = color[2] + color[1] * 256 + color[0] * 65536 + alpha * 65536 * 256;
	        }
	      }
	    }
	  }
	  updateColorsAndCanvasImmediately(inkList) {
	    const currentInksInSet = this.currentInks[this.inkSet], memorizedInks = currentInksInSet.slice();
	    this.currentInks[this.inkSet] = inkList;
	    this.updateColorMap();
	    this.fnCopy2Canvas();
	    this.currentInks[this.inkSet] = memorizedInks.slice();
	    this.updateColorMap();
	    this.needUpdate = true;
	  }
	  updateSpeedInk() {
	    const pens = this.modeData.pens;
	    this.speedInkCount -= 1;
	    if (this.speedInkCount <= 0) {
	      const currentInkSet = this.inkSet, newInkSet = currentInkSet ^ 1;
	      this.inkSet = newInkSet;
	      this.speedInkCount = this.speedInk[newInkSet];
	      for (let i = 0; i < pens; i += 1) {
	        if (this.currentInks[newInkSet][i] !== this.currentInks[currentInkSet][i]) {
	          this.updateColorMap();
	          this.needUpdate = true;
	          break;
	        }
	      }
	      if (this.currentInks[newInkSet][16] !== this.currentInks[currentInkSet][16]) {
	        this.applyBorderColor();
	      }
	    }
	  }
	  setCustomChar(char, charData) {
	    this.customCharset[char] = charData;
	  }
	  getCharData(char) {
	    return this.customCharset[char] || this.options.charset[char];
	  }
	  setDefaultInks() {
	    this.currentInks[0] = _Canvas.defaultInks[0].slice();
	    this.currentInks[1] = _Canvas.defaultInks[1].slice();
	    this.updateColorMap();
	    this.setGPen(this.gPen);
	  }
	  setFocusOnCanvas() {
	    this.cpcAreaBox.style.background = "#463c3c";
	    if (this.canvas) {
	      this.canvas.focus();
	    }
	    this.hasFocus = true;
	  }
	  getMousePos(event) {
	    const legacyDocument = document, isFullScreen = Boolean(document.fullscreenElement || legacyDocument.mozFullScreenElement || legacyDocument.webkitFullscreenElement || legacyDocument.msFullscreenElement), rect = this.canvas.getBoundingClientRect();
	    if (isFullScreen) {
	      const areaX = 0, areaY = 0, rectwidth = rect.right - rect.left - (this.borderWidth + areaX) * 2, rectHeight = rect.bottom - rect.top - (this.borderWidth + areaY) * 2, ratioX = rectwidth / this.canvas.width, ratioY = rectHeight / this.canvas.height, minRatio = ratioX <= ratioY ? ratioX : ratioY, diffX = rectwidth - this.canvas.width * minRatio, diffY = rectHeight - this.canvas.height * minRatio;
	      return {
	        x: (event.clientX - this.borderWidth - rect.left - diffX / 2) / ratioX * ratioX / minRatio,
	        y: (event.clientY - this.borderWidth - rect.top - diffY / 2) / ratioY * ratioY / minRatio
	      };
	    }
	    return {
	      x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * this.canvas.width,
	      y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * this.canvas.height
	    };
	  }
	  canvasClickAction(event) {
	    const pos = this.getMousePos(event), x = pos.x | 0, y = pos.y | 0;
	    if (this.options.onCanvasClick) {
	      if (x >= 0 && x <= this.width - 1 && y >= 0 && y <= this.height - 1) {
	        const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, xTxt = x / charWidth | 0, yTxt = y / charHeight | 0;
	        this.options.onCanvasClick(event, x, y, xTxt, yTxt);
	      }
	    }
	  }
	  onCanvasClick(event) {
	    if (!this.hasFocus) {
	      this.setFocusOnCanvas();
	    } else {
	      this.canvasClickAction(event);
	    }
	    event.stopPropagation();
	  }
	  onWindowClick(_event) {
	    if (this.hasFocus) {
	      this.hasFocus = false;
	      this.cpcAreaBox.style.background = "";
	    }
	  }
	  getXpos() {
	    return this.xPos;
	  }
	  getYpos() {
	    return this.yPos;
	  }
	  fillMyRect(x, y, width, height, paper) {
	    const canvasWidth = this.width, dataset8 = this.dataset8;
	    for (let row = 0; row < height; row += 1) {
	      const idx = x + (y + row) * canvasWidth;
	      dataset8.fill(paper, idx, idx + width);
	    }
	  }
	  fillTextBox(left, top, width, height, paper) {
	    const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8;
	    paper %= this.modeData.pens;
	    this.fillMyRect(left * charWidth, top * charHeight, width * charWidth, height * charHeight, paper);
	    this.setNeedUpdate();
	  }
	  moveMyRectUp(x, y, width, height, x2, y2) {
	    const canvasWidth = this.width, dataset8 = this.dataset8;
	    for (let row = 0; row < height; row += 1) {
	      const idx1 = x + (y + row) * canvasWidth, idx2 = x2 + (y2 + row) * canvasWidth;
	      dataset8.copyWithin(idx2, idx1, idx1 + width);
	    }
	  }
	  moveMyRectDown(x, y, width, height, x2, y2) {
	    const canvasWidth = this.width, dataset8 = this.dataset8;
	    for (let row = height - 1; row >= 0; row -= 1) {
	      const idx1 = x + (y + row) * canvasWidth, idx2 = x2 + (y2 + row) * canvasWidth;
	      dataset8.copyWithin(idx2, idx1, idx1 + width);
	    }
	  }
	  invertChar(x, y, pen, paper) {
	    const pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, penXorPaper = pen ^ paper;
	    for (let row = 0; row < 8; row += 1) {
	      for (let col = 0; col < 8; col += 1) {
	        let testPen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);
	        testPen ^= penXorPaper;
	        this.setSubPixelsNormal(x + col * pixelWidth, y + row * pixelHeight, testPen);
	      }
	    }
	  }
	  setChar(char, x, y, pen, paper, transparent, gColMode, textAtGraphics) {
	    const charData = this.customCharset[char] || this.options.charset[char], pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight;
	    for (let row = 0; row < 8; row += 1) {
	      for (let col = 0; col < 8; col += 1) {
	        const charValue = charData[row], bit = charValue & 128 >> col;
	        if (!(transparent && !bit)) {
	          const penOrPaper = bit ? pen : paper;
	          if (textAtGraphics) {
	            this.setPixel(x + col * pixelWidth, y - row * pixelHeight, penOrPaper, gColMode);
	          } else {
	            this.setSubPixels(x + col * pixelWidth, y + row * pixelHeight, penOrPaper, gColMode);
	          }
	        }
	      }
	    }
	  }
	  readCharData(x, y, expectedPen) {
	    const charData = [], pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight;
	    for (let row = 0; row < 8; row += 1) {
	      let charValue = 0;
	      for (let col = 0; col < 8; col += 1) {
	        const pen = this.testSubPixel(x + col * pixelWidth, y + row * pixelHeight);
	        if (pen === expectedPen) {
	          charValue |= 128 >> col;
	        }
	      }
	      charData[row] = charValue;
	    }
	    return charData;
	  }
	  // set subpixels with normal mode (gColmode=0)
	  setSubPixelsNormal(x, y, gPen) {
	    const pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, width = this.width;
	    x &= ~(pixelWidth - 1);
	    y &= ~(pixelHeight - 1);
	    for (let row = 0; row < pixelHeight; row += 1) {
	      const i = x + width * (y + row);
	      for (let col = 0; col < pixelWidth; col += 1) {
	        this.dataset8[i + col] = gPen;
	      }
	    }
	  }
	  setSubPixels(x, y, gPen, gColMode) {
	    const pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, width = this.width;
	    x &= ~(pixelWidth - 1);
	    y &= ~(pixelHeight - 1);
	    for (let row = 0; row < pixelHeight; row += 1) {
	      let i = x + width * (y + row);
	      for (let col = 0; col < pixelWidth; col += 1) {
	        switch (gColMode) {
	          case 0:
	            this.dataset8[i] = gPen;
	            break;
	          case 1:
	            this.dataset8[i] ^= gPen;
	            break;
	          case 2:
	            this.dataset8[i] &= gPen;
	            break;
	          case 3:
	            this.dataset8[i] |= gPen;
	            break;
	          default:
	            UiUtils.console.warn("setSubPixels: Unknown colMode:", gColMode);
	            break;
	        }
	        i += 1;
	      }
	    }
	  }
	  // some rounding needed before applying origin:
	  static roundCoordinate(cor, widthOrHeight) {
	    return cor >= 0 ? cor & ~(widthOrHeight - 1) : -(-cor & ~(widthOrHeight - 1));
	  }
	  setPixel(x, y, gPen, gColMode) {
	    x = _Canvas.roundCoordinate(x, this.modeData.pixelWidth);
	    y = _Canvas.roundCoordinate(y, this.modeData.pixelHeight);
	    x += this.xOrig;
	    y = this.height - 1 - (y + this.yOrig);
	    if (x < this.xLeft || x > this.xRight || y < this.height - 1 - this.yTop || y > this.height - 1 - this.yBottom) {
	      return;
	    }
	    this.setSubPixels(x, y, gPen, gColMode);
	  }
	  setPixelOriginIncluded(x, y, gPen, gColMode) {
	    if (x < this.xLeft || x > this.xRight || y < this.height - 1 - this.yTop || y > this.height - 1 - this.yBottom) {
	      return;
	    }
	    this.setSubPixels(x, y, gPen, gColMode);
	  }
	  testSubPixel(x, y) {
	    const i = x + this.width * y, pen = this.dataset8[i];
	    return pen;
	  }
	  testPixel(x, y) {
	    x = _Canvas.roundCoordinate(x, this.modeData.pixelWidth);
	    y = _Canvas.roundCoordinate(y, this.modeData.pixelHeight);
	    x += this.xOrig;
	    y = this.height - 1 - (y + this.yOrig);
	    if (x < this.xLeft || x > this.xRight || y < this.height - 1 - this.yTop || y > this.height - 1 - this.yBottom) {
	      return this.gPaper;
	    }
	    const i = x + this.width * y, pen = this.dataset8[i];
	    return pen;
	  }
	  getByte(addr) {
	    const mode = this.mode, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, x = (addr & 2047) % 80 * 8, y = ((addr & 14336) / 2048 + ((addr & 2047) / 80 | 0) * 8) * pixelHeight;
	    let byte = null, gPen;
	    if (y < this.height) {
	      if (mode === 0) {
	        gPen = this.dataset8[x + this.width * y];
	        byte = gPen >> 2 & 2 | gPen << 3 & 32 | gPen << 2 & 8 | gPen << 7 & 128;
	        gPen = this.dataset8[x + pixelWidth + this.width * y];
	        byte |= gPen >> 3 & 1 | gPen << 2 & 16 | gPen << 1 & 4 | gPen << 6 & 64;
	      } else if (mode === 1) {
	        byte = 0;
	        gPen = this.dataset8[x + this.width * y];
	        byte |= (gPen & 2) << 2 | (gPen & 1) << 7;
	        gPen = this.dataset8[x + pixelWidth + this.width * y];
	        byte |= (gPen & 2) << 1 | (gPen & 1) << 6;
	        gPen = this.dataset8[x + pixelWidth * 2 + this.width * y];
	        byte |= (gPen & 2) << 0 | (gPen & 1) << 5;
	        gPen = this.dataset8[x + pixelWidth * 3 + this.width * y];
	        byte |= (gPen & 2) >> 1 | (gPen & 1) << 4;
	      } else if (mode === 2) {
	        byte = 0;
	        for (let i = 0; i <= 7; i += 1) {
	          gPen = this.dataset8[x + i + this.width * y];
	          byte |= (gPen & 1) << 7 - i;
	        }
	      } else ;
	    }
	    return byte;
	  }
	  setByte(addr, byte) {
	    const mode = this.mode, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, x = (addr & 2047) % 80 * 8, y = ((addr & 14336) / 2048 + ((addr & 2047) / 80 | 0) * 8) * pixelHeight;
	    let gPen;
	    if (y < this.height) {
	      if (mode === 0) {
	        gPen = byte << 2 & 8 | byte >> 3 & 4 | byte >> 2 & 2 | byte >> 7 & 1;
	        this.setSubPixelsNormal(x, y, gPen);
	        gPen = byte << 3 & 8 | byte >> 2 & 4 | byte >> 1 & 2 | byte >> 6 & 1;
	        this.setSubPixelsNormal(x + pixelWidth, y, gPen);
	        this.setNeedUpdate();
	      } else if (mode === 1) {
	        gPen = byte >> 2 & 2 | byte >> 7 & 1;
	        this.setSubPixelsNormal(x, y, gPen);
	        gPen = byte >> 1 & 2 | byte >> 6 & 1;
	        this.setSubPixelsNormal(x + pixelWidth, y, gPen);
	        gPen = byte >> 0 & 2 | byte >> 5 & 1;
	        this.setSubPixelsNormal(x + pixelWidth * 2, y, gPen);
	        gPen = byte << 1 & 2 | byte >> 4 & 1;
	        this.setSubPixelsNormal(x + pixelWidth * 3, y, gPen);
	        this.setNeedUpdate();
	      } else if (mode === 2) {
	        for (let i = 0; i <= 7; i += 1) {
	          gPen = byte >> 7 - i & 1;
	          this.setSubPixelsNormal(x + i * pixelWidth, y, gPen);
	        }
	        this.setNeedUpdate();
	      } else ;
	    }
	  }
	  // https://de.wikipedia.org/wiki/Bresenham-Algorithmus
	  drawBresenhamLine(xstart, ystart, xend, yend) {
	    const pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, gPen = this.gPen, gPaper = this.gPaper, mask = this.mask, maskFirst = this.maskFirst, gColMode = this.gColMode, transparent = this.gTransparent;
	    let maskBit = this.maskBit;
	    xstart = _Canvas.roundCoordinate(xstart, pixelWidth);
	    ystart = _Canvas.roundCoordinate(ystart, pixelHeight);
	    xend = _Canvas.roundCoordinate(xend, pixelWidth);
	    yend = _Canvas.roundCoordinate(yend, pixelHeight);
	    xstart += this.xOrig;
	    ystart = this.height - 1 - (ystart + this.yOrig);
	    xend += this.xOrig;
	    yend = this.height - 1 - (yend + this.yOrig);
	    let dx = (xend - xstart) / pixelWidth | 0, dy = (yend - ystart) / pixelHeight | 0;
	    const incx = Math.sign(dx) * pixelWidth, incy = Math.sign(dy) * pixelHeight;
	    if (dx < 0) {
	      dx = -dx;
	    }
	    if (dy < 0) {
	      dy = -dy;
	    }
	    let pdx, pdy, ddx, ddy, deltaslowdirection, deltafastdirection;
	    if (dx > dy) {
	      pdx = incx;
	      pdy = 0;
	      ddx = incx;
	      ddy = incy;
	      deltaslowdirection = dy;
	      deltafastdirection = dx;
	    } else {
	      pdx = 0;
	      pdy = incy;
	      ddx = incx;
	      ddy = incy;
	      deltaslowdirection = dx;
	      deltafastdirection = dy;
	    }
	    let x = xstart, y = ystart, err = deltafastdirection >> 1;
	    if (maskFirst) {
	      const bit = mask & maskBit;
	      if (!(transparent && !bit)) {
	        this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode);
	      }
	      maskBit = maskBit >> 1 | maskBit << 7 & 255;
	    }
	    for (let t = 0; t < deltafastdirection; t += 1) {
	      err -= deltaslowdirection;
	      if (err < 0) {
	        err += deltafastdirection;
	        x += ddx;
	        y += ddy;
	      } else {
	        x += pdx;
	        y += pdy;
	      }
	      const bit = mask & maskBit;
	      if (!(transparent && !bit)) {
	        this.setPixelOriginIncluded(x, y, bit ? gPen : gPaper, gColMode);
	      }
	      maskBit = maskBit >> 1 | maskBit << 7 & 255;
	    }
	    this.maskBit = maskBit;
	  }
	  draw(x, y) {
	    const xStart = this.xPos, yStart = this.yPos;
	    this.move(x, y);
	    this.drawBresenhamLine(xStart, yStart, x, y);
	    this.setNeedUpdate();
	  }
	  move(x, y) {
	    this.xPos = x;
	    this.yPos = y;
	  }
	  plot(x, y) {
	    this.move(x, y);
	    this.setPixel(x, y, this.gPen, this.gColMode);
	    this.setNeedUpdate();
	  }
	  test(x, y) {
	    this.move(x, y);
	    return this.testPixel(this.xPos, this.yPos);
	  }
	  setInk(pen, ink1, ink2) {
	    let needInkUpdate = false;
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
	      this.setNeedUpdate();
	    }
	    return needInkUpdate;
	  }
	  setBorder(ink1, ink2) {
	    const needInkUpdate = this.setInk(16, ink1, ink2);
	    if (needInkUpdate) {
	      this.applyBorderColor();
	    }
	  }
	  setGPen(gPen) {
	    this.gPen = gPen % this.modeData.pens;
	  }
	  setGPaper(gPaper) {
	    this.gPaper = gPaper % this.modeData.pens;
	  }
	  setGTransparentMode(transparent) {
	    this.gTransparent = transparent;
	  }
	  printGChar(char) {
	    const charWidth = this.modeData.pixelWidth * 8;
	    if (char >= this.options.charset.length) {
	      UiUtils.console.warn("printGChar: Ignoring char with code", char);
	      return;
	    }
	    this.setChar(char, this.xPos, this.yPos, this.gPen, this.gPaper, this.gTransparent, this.gColMode, true);
	    this.xPos += charWidth;
	    this.setNeedUpdate();
	  }
	  printChar(char, x, y, pen, paper, transparent) {
	    const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
	    if (char >= this.options.charset.length) {
	      UiUtils.console.warn("printChar: Ignoring char with code", char);
	      return;
	    }
	    pen %= pens;
	    paper %= pens;
	    this.setChar(char, x * charWidth, y * charHeight, pen, paper, transparent, 0, false);
	    this.setNeedUpdate();
	  }
	  drawCursor(x, y, pen, paper) {
	    const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
	    pen %= pens;
	    paper %= pens;
	    this.invertChar(x * charWidth, y * charHeight, pen, paper);
	    this.setNeedUpdate();
	  }
	  findMatchingChar(charData) {
	    const charset = this.options.charset;
	    let char = -1;
	    for (let i = 0; i < charset.length; i += 1) {
	      const charData2 = this.customCharset[i] || charset[i];
	      let match = true;
	      for (let j = 0; j < 8; j += 1) {
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
	  }
	  readChar(x, y, pen, paper) {
	    const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, pens = this.modeData.pens;
	    pen %= pens;
	    paper %= pens;
	    x *= charWidth;
	    y *= charHeight;
	    let charData = this.readCharData(x, y, pen), char = this.findMatchingChar(charData);
	    if (char < 0 || char === 32) {
	      charData = this.readCharData(x, y, paper);
	      for (let i = 0; i < charData.length; i += 1) {
	        charData[i] ^= 255;
	      }
	      let char2 = this.findMatchingChar(charData);
	      if (char2 >= 0) {
	        if (char2 === 143) {
	          char2 = 32;
	        }
	        char = char2;
	      }
	    }
	    return char;
	  }
	  // fill: idea from: https://simpledevcode.wordpress.com/2015/12/29/flood-fill-algorithm-using-c-net/
	  fnIsNotInWindow(x, y) {
	    return x < this.xLeft || x > this.xRight || y < this.height - 1 - this.yTop || y > this.height - 1 - this.yBottom;
	  }
	  fill(fillPen) {
	    const gPen = this.gPen, pixelWidth = this.modeData.pixelWidth, pixelHeight = this.modeData.pixelHeight, pixels = [], fnIsStopPen = function(p) {
	      return p === fillPen || p === gPen;
	    };
	    let xPos = this.xPos, yPos = this.yPos;
	    fillPen %= this.modeData.pens;
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
	      const pixel = pixels.pop();
	      let y1 = pixel.y, p1 = this.testSubPixel(pixel.x, y1);
	      while (y1 >= this.height - 1 - this.yTop && !fnIsStopPen(p1)) {
	        y1 -= pixelHeight;
	        p1 = this.testSubPixel(pixel.x, y1);
	      }
	      y1 += pixelHeight;
	      let spanLeft = false, spanRight = false;
	      p1 = this.testSubPixel(pixel.x, y1);
	      while (y1 <= this.height - 1 - this.yBottom && !fnIsStopPen(p1)) {
	        this.setSubPixelsNormal(pixel.x, y1, fillPen);
	        let x1 = pixel.x - pixelWidth;
	        const p2 = this.testSubPixel(x1, y1);
	        if (!spanLeft && x1 >= this.xLeft && !fnIsStopPen(p2)) {
	          pixels.push({
	            x: x1,
	            y: y1
	          });
	          spanLeft = true;
	        } else if (spanLeft && (x1 < this.xLeft || fnIsStopPen(p2))) {
	          spanLeft = false;
	        }
	        x1 = pixel.x + pixelWidth;
	        const p3 = this.testSubPixel(x1, y1);
	        if (!spanRight && x1 <= this.xRight && !fnIsStopPen(p3)) {
	          pixels.push({
	            x: x1,
	            y: y1
	          });
	          spanRight = true;
	        } else if (spanRight && (x1 > this.xRight || fnIsStopPen(p3))) {
	          spanRight = false;
	        }
	        y1 += pixelHeight;
	        p1 = this.testSubPixel(pixel.x, y1);
	      }
	    }
	    this.setNeedUpdate();
	  }
	  static fnPutInRange(n, min, max) {
	    if (n < min) {
	      n = min;
	    } else if (n > max) {
	      n = max;
	    }
	    return n;
	  }
	  setOrigin(xOrig, yOrig) {
	    const pixelWidth = this.modeData.pixelWidth;
	    xOrig &= ~(pixelWidth - 1);
	    this.xOrig = xOrig;
	    this.yOrig = yOrig;
	    this.move(0, 0);
	  }
	  getXOrigin() {
	    return this.xOrig;
	  }
	  getYOrigin() {
	    return this.yOrig;
	  }
	  setGWindow(xLeft, xRight, yTop, yBottom) {
	    const pixelWidth = 8, pixelHeight = this.modeData.pixelHeight;
	    xLeft = _Canvas.fnPutInRange(xLeft, 0, this.width - 1);
	    xRight = _Canvas.fnPutInRange(xRight, 0, this.width - 1);
	    yTop = _Canvas.fnPutInRange(yTop, 0, this.height - 1);
	    yBottom = _Canvas.fnPutInRange(yBottom, 0, this.height - 1);
	    if (xRight < xLeft) {
	      const tmp = xRight;
	      xRight = xLeft;
	      xLeft = tmp;
	    }
	    if (yTop < yBottom) {
	      const tmp = yTop;
	      yTop = yBottom;
	      yBottom = tmp;
	    }
	    xLeft &= -8;
	    xRight |= pixelWidth - 1;
	    yTop |= pixelHeight - 1;
	    yBottom &= ~(pixelHeight - 1);
	    this.xLeft = xLeft;
	    this.xRight = xRight;
	    this.yTop = yTop;
	    this.yBottom = yBottom;
	  }
	  setGColMode(gColMode) {
	    if (gColMode !== this.gColMode) {
	      this.gColMode = gColMode;
	    }
	  }
	  clearTextWindow(left, right, top, bottom, paper) {
	    const width = right + 1 - left, height = bottom + 1 - top;
	    this.fillTextBox(left, top, width, height, paper);
	  }
	  clearGraphicsWindow() {
	    this.fillMyRect(this.xLeft, this.height - 1 - this.yTop, this.xRight + 1 - this.xLeft, this.yTop + 1 - this.yBottom, this.gPaper);
	    this.move(0, 0);
	    this.setNeedUpdate();
	  }
	  clearFullWindow() {
	    const paper = 0;
	    this.fillMyRect(0, 0, this.width, this.height, paper);
	    this.setNeedUpdate();
	  }
	  windowScrollUp(left, right, top, bottom, paper) {
	    const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, width = right + 1 - left, height = bottom + 1 - top;
	    if (height > 1) {
	      this.moveMyRectUp(left * charWidth, (top + 1) * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, top * charHeight);
	    }
	    this.fillTextBox(left, bottom, width, 1, paper);
	    this.setNeedUpdate();
	  }
	  windowScrollDown(left, right, top, bottom, paper) {
	    const charWidth = this.modeData.pixelWidth * 8, charHeight = this.modeData.pixelHeight * 8, width = right + 1 - left, height = bottom + 1 - top;
	    if (height > 1) {
	      this.moveMyRectDown(left * charWidth, top * charHeight, width * charWidth, (height - 1) * charHeight, left * charWidth, (top + 1) * charHeight);
	    }
	    this.fillTextBox(left, top, width, 1, paper);
	    this.setNeedUpdate();
	  }
	  setSpeedInk(time1, time2) {
	    this.speedInk[0] = time1;
	    this.speedInk[1] = time2;
	  }
	  setMask(mask) {
	    this.mask = mask;
	    this.maskBit = 128;
	  }
	  setMaskFirst(maskFirst) {
	    this.maskFirst = maskFirst;
	  }
	  getMode() {
	    return this.mode;
	  }
	  changeMode(mode) {
	    const modeData = _Canvas.modeData[mode];
	    this.mode = mode;
	    this.modeData = modeData;
	  }
	  setMode(mode) {
	    this.setScreenOffset(0);
	    this.changeMode(mode);
	    this.setOrigin(0, 0);
	    this.setGWindow(0, this.width - 1, this.height - 1, 0);
	    this.setMask(255);
	    this.setMaskFirst(1);
	    this.setGPen(this.gPen);
	    this.setGPaper(this.gPaper);
	    this.setGTransparentMode(false);
	  }
	  takeScreenShot() {
	    if (this.canvas.toDataURL) {
	      return this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
	    }
	    UiUtils.console.warn("Screenshot not available");
	    return "";
	  }
	};
	// http://www.cpcwiki.eu/index.php/CPC_Palette
	// (green and gray palette will be computed if needed)
	_Canvas.palettes = {
	  color: [
	    "#000000",
	    //  0 Black
	    "#000080",
	    //  1 Blue
	    "#0000FF",
	    //  2 Bright Blue
	    "#800000",
	    //  3 Red
	    "#800080",
	    //  4 Magenta
	    "#8000FF",
	    //  5 Mauve
	    "#FF0000",
	    //  6 Bright Red
	    "#FF0080",
	    //  7 Purple
	    "#FF00FF",
	    //  8 Bright Magenta
	    "#008000",
	    //  9 Green
	    "#008080",
	    // 10 Cyan
	    "#0080FF",
	    // 11 Sky Blue
	    "#808000",
	    // 12 Yellow
	    "#808080",
	    // 13 White
	    "#8080FF",
	    // 14 Pastel Blue
	    "#FF8000",
	    // 15 Orange
	    "#FF8080",
	    // 16 Pink
	    "#FF80FF",
	    // 17 Pastel Magenta
	    "#00FF00",
	    // 18 Bright Green
	    "#00FF80",
	    // 19 Sea Green
	    "#00FFFF",
	    // 20 Bright Cyan
	    "#80FF00",
	    // 21 Lime
	    "#80FF80",
	    // 22 Pastel Green
	    "#80FFFF",
	    // 23 Pastel Cyan
	    "#FFFF00",
	    // 24 Bright Yellow
	    "#FFFF80",
	    // 25 Pastel Yellow
	    "#FFFFFF",
	    // 26 Bright White
	    "#808080",
	    // 27 White (same as 13)
	    "#FF00FF",
	    // 28 Bright Magenta (same as 8)
	    "#FFFF80",
	    // 29 Pastel Yellow (same as 25)
	    "#000080",
	    // 30 Blue (same as 1)
	    "#00FF80"
	    //  31 Sea Green (same as 19)
	  ]
	};
	// mode 0: pen 0-15,16=border; inks for pen 14,15 are alternating: "1,24", "16,11"
	_Canvas.defaultInks = [
	  [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 1, 16, 1],
	  // eslint-disable-line array-element-newline
	  [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 24, 11, 1]
	  // eslint-disable-line array-element-newline
	];
	_Canvas.modeData = [
	  {
	    // mode 0
	    pens: 16,
	    // number of pens
	    pixelWidth: 4,
	    // pixel width
	    pixelHeight: 2
	    // pixel height
	  },
	  {
	    // mode 1
	    pens: 4,
	    pixelWidth: 2,
	    pixelHeight: 2
	  },
	  {
	    // mode 2
	    pens: 2,
	    pixelWidth: 1,
	    pixelHeight: 2
	  },
	  {
	    // mode 3
	    pens: 16,
	    // mode 3 not available on a real CPC
	    pixelWidth: 1,
	    pixelHeight: 1
	  }
	];
	let Canvas = _Canvas;

	const cpcCharset = [
	  // eslint-disable-line no-unused-vars
	  [255, 195, 195, 195, 195, 195, 195, 255],
	  // 0x00
	  [255, 192, 192, 192, 192, 192, 192, 192],
	  // 0x01
	  [24, 24, 24, 24, 24, 24, 24, 255],
	  // 0x02
	  [3, 3, 3, 3, 3, 3, 3, 255],
	  // 0x03
	  [12, 24, 48, 126, 12, 24, 48, 0],
	  // 0x04
	  [255, 195, 231, 219, 219, 231, 195, 255],
	  // 0x05
	  [0, 1, 3, 6, 204, 120, 48, 0],
	  // 0x06
	  [60, 102, 195, 195, 255, 36, 231, 0],
	  // 0x07
	  [0, 0, 48, 96, 255, 96, 48, 0],
	  // 0x08
	  [0, 0, 12, 6, 255, 6, 12, 0],
	  // 0x09
	  [24, 24, 24, 24, 219, 126, 60, 24],
	  // 0x0a
	  [24, 60, 126, 219, 24, 24, 24, 24],
	  // 0x0b
	  [24, 90, 60, 153, 219, 126, 60, 24],
	  // 0x0c
	  [0, 3, 51, 99, 254, 96, 48, 0],
	  // 0x0d
	  [60, 102, 255, 219, 219, 255, 102, 60],
	  // 0x0e
	  [60, 102, 195, 219, 219, 195, 102, 60],
	  // 0x0f
	  [255, 195, 195, 255, 195, 195, 195, 255],
	  // 0x10
	  [60, 126, 219, 219, 223, 195, 102, 60],
	  // 0x11
	  [60, 102, 195, 223, 219, 219, 126, 60],
	  // 0x12
	  [60, 102, 195, 251, 219, 219, 126, 60],
	  // 0x13
	  [60, 126, 219, 219, 251, 195, 102, 60],
	  // 0x14
	  [0, 1, 51, 30, 206, 123, 49, 0],
	  // 0x15
	  [126, 102, 102, 102, 102, 102, 102, 231],
	  // 0x16
	  [3, 3, 3, 255, 3, 3, 3, 0],
	  // 0x17
	  [255, 102, 60, 24, 24, 60, 102, 255],
	  // 0x18
	  [24, 24, 60, 60, 60, 60, 24, 24],
	  // 0x19
	  [60, 102, 102, 48, 24, 0, 24, 0],
	  // 0x1a
	  [60, 102, 195, 255, 195, 195, 102, 60],
	  // 0x1b
	  [255, 219, 219, 219, 251, 195, 195, 255],
	  // 0x1c
	  [255, 195, 195, 251, 219, 219, 219, 255],
	  // 0x1d
	  [255, 195, 195, 223, 219, 219, 219, 255],
	  // 0x1e
	  [255, 219, 219, 219, 223, 195, 195, 255],
	  // 0x1f
	  [0, 0, 0, 0, 0, 0, 0, 0],
	  // 0x20
	  [24, 24, 24, 24, 24, 0, 24, 0],
	  // 0x21
	  [108, 108, 108, 0, 0, 0, 0, 0],
	  // 0x22
	  [108, 108, 254, 108, 254, 108, 108, 0],
	  // 0x23
	  [24, 62, 88, 60, 26, 124, 24, 0],
	  // 0x24
	  [0, 198, 204, 24, 48, 102, 198, 0],
	  // 0x25
	  [56, 108, 56, 118, 220, 204, 118, 0],
	  // 0x26
	  [24, 24, 48, 0, 0, 0, 0, 0],
	  // 0x27
	  [12, 24, 48, 48, 48, 24, 12, 0],
	  // 0x28
	  [48, 24, 12, 12, 12, 24, 48, 0],
	  // 0x29
	  [0, 102, 60, 255, 60, 102, 0, 0],
	  // 0x2a
	  [0, 24, 24, 126, 24, 24, 0, 0],
	  // 0x2b
	  [0, 0, 0, 0, 0, 24, 24, 48],
	  // 0x2c
	  [0, 0, 0, 126, 0, 0, 0, 0],
	  // 0x2d
	  [0, 0, 0, 0, 0, 24, 24, 0],
	  // 0x2e
	  [6, 12, 24, 48, 96, 192, 128, 0],
	  // 0x2f
	  [124, 198, 206, 214, 230, 198, 124, 0],
	  // 0x30
	  [24, 56, 24, 24, 24, 24, 126, 0],
	  // 0x31
	  [60, 102, 6, 60, 96, 102, 126, 0],
	  // 0x32
	  [60, 102, 6, 28, 6, 102, 60, 0],
	  // 0x33
	  [28, 60, 108, 204, 254, 12, 30, 0],
	  // 0x34
	  [126, 98, 96, 124, 6, 102, 60, 0],
	  // 0x35
	  [60, 102, 96, 124, 102, 102, 60, 0],
	  // 0x36
	  [126, 102, 6, 12, 24, 24, 24, 0],
	  // 0x37
	  [60, 102, 102, 60, 102, 102, 60, 0],
	  // 0x38
	  [60, 102, 102, 62, 6, 102, 60, 0],
	  // 0x39
	  [0, 0, 24, 24, 0, 24, 24, 0],
	  // 0x3a
	  [0, 0, 24, 24, 0, 24, 24, 48],
	  // 0x3b
	  [12, 24, 48, 96, 48, 24, 12, 0],
	  // 0x3c
	  [0, 0, 126, 0, 0, 126, 0, 0],
	  // 0x3d
	  [96, 48, 24, 12, 24, 48, 96, 0],
	  // 0x3e
	  [60, 102, 102, 12, 24, 0, 24, 0],
	  // 0x3f
	  [124, 198, 222, 222, 222, 192, 124, 0],
	  // 0x40
	  [24, 60, 102, 102, 126, 102, 102, 0],
	  // 0x41
	  [252, 102, 102, 124, 102, 102, 252, 0],
	  // 0x42
	  [60, 102, 192, 192, 192, 102, 60, 0],
	  // 0x43
	  [248, 108, 102, 102, 102, 108, 248, 0],
	  // 0x44
	  [254, 98, 104, 120, 104, 98, 254, 0],
	  // 0x45
	  [254, 98, 104, 120, 104, 96, 240, 0],
	  // 0x46
	  [60, 102, 192, 192, 206, 102, 62, 0],
	  // 0x47
	  [102, 102, 102, 126, 102, 102, 102, 0],
	  // 0x48
	  [126, 24, 24, 24, 24, 24, 126, 0],
	  // 0x49
	  [30, 12, 12, 12, 204, 204, 120, 0],
	  // 0x4a
	  [230, 102, 108, 120, 108, 102, 230, 0],
	  // 0x4b
	  [240, 96, 96, 96, 98, 102, 254, 0],
	  // 0x4c
	  [198, 238, 254, 254, 214, 198, 198, 0],
	  // 0x4d
	  [198, 230, 246, 222, 206, 198, 198, 0],
	  // 0x4e
	  [56, 108, 198, 198, 198, 108, 56, 0],
	  // 0x4f
	  [252, 102, 102, 124, 96, 96, 240, 0],
	  // 0x50
	  [56, 108, 198, 198, 218, 204, 118, 0],
	  // 0x51
	  [252, 102, 102, 124, 108, 102, 230, 0],
	  // 0x52
	  [60, 102, 96, 60, 6, 102, 60, 0],
	  // 0x53
	  [126, 90, 24, 24, 24, 24, 60, 0],
	  // 0x54
	  [102, 102, 102, 102, 102, 102, 60, 0],
	  // 0x55
	  [102, 102, 102, 102, 102, 60, 24, 0],
	  // 0x56
	  [198, 198, 198, 214, 254, 238, 198, 0],
	  // 0x57
	  [198, 108, 56, 56, 108, 198, 198, 0],
	  // 0x58
	  [102, 102, 102, 60, 24, 24, 60, 0],
	  // 0x59
	  [254, 198, 140, 24, 50, 102, 254, 0],
	  // 0x5a
	  [60, 48, 48, 48, 48, 48, 60, 0],
	  // 0x5b
	  [192, 96, 48, 24, 12, 6, 2, 0],
	  // 0x5c
	  [60, 12, 12, 12, 12, 12, 60, 0],
	  // 0x5d
	  [24, 60, 126, 24, 24, 24, 24, 0],
	  // 0x5e
	  [0, 0, 0, 0, 0, 0, 0, 255],
	  // 0x5f
	  [48, 24, 12, 0, 0, 0, 0, 0],
	  // 0x60
	  [0, 0, 120, 12, 124, 204, 118, 0],
	  // 0x61
	  [224, 96, 124, 102, 102, 102, 220, 0],
	  // 0x62
	  [0, 0, 60, 102, 96, 102, 60, 0],
	  // 0x63
	  [28, 12, 124, 204, 204, 204, 118, 0],
	  // 0x64
	  [0, 0, 60, 102, 126, 96, 60, 0],
	  // 0x65
	  [28, 54, 48, 120, 48, 48, 120, 0],
	  // 0x66
	  [0, 0, 62, 102, 102, 62, 6, 124],
	  // 0x67
	  [224, 96, 108, 118, 102, 102, 230, 0],
	  // 0x68
	  [24, 0, 56, 24, 24, 24, 60, 0],
	  // 0x69
	  [6, 0, 14, 6, 6, 102, 102, 60],
	  // 0x6a
	  [224, 96, 102, 108, 120, 108, 230, 0],
	  // 0x6b
	  [56, 24, 24, 24, 24, 24, 60, 0],
	  // 0x6c
	  [0, 0, 108, 254, 214, 214, 198, 0],
	  // 0x6d
	  [0, 0, 220, 102, 102, 102, 102, 0],
	  // 0x6e
	  [0, 0, 60, 102, 102, 102, 60, 0],
	  // 0x6f
	  [0, 0, 220, 102, 102, 124, 96, 240],
	  // 0x70
	  [0, 0, 118, 204, 204, 124, 12, 30],
	  // 0x71
	  [0, 0, 220, 118, 96, 96, 240, 0],
	  // 0x72
	  [0, 0, 60, 96, 60, 6, 124, 0],
	  // 0x73
	  [48, 48, 124, 48, 48, 54, 28, 0],
	  // 0x74
	  [0, 0, 102, 102, 102, 102, 62, 0],
	  // 0x75
	  [0, 0, 102, 102, 102, 60, 24, 0],
	  // 0x76
	  [0, 0, 198, 214, 214, 254, 108, 0],
	  // 0x77
	  [0, 0, 198, 108, 56, 108, 198, 0],
	  // 0x78
	  [0, 0, 102, 102, 102, 62, 6, 124],
	  // 0x79
	  [0, 0, 126, 76, 24, 50, 126, 0],
	  // 0x7a
	  [14, 24, 24, 112, 24, 24, 14, 0],
	  // 0x7b
	  [24, 24, 24, 24, 24, 24, 24, 0],
	  // 0x7c
	  [112, 24, 24, 14, 24, 24, 112, 0],
	  // 0x7d
	  [118, 220, 0, 0, 0, 0, 0, 0],
	  // 0x7e
	  [204, 51, 204, 51, 204, 51, 204, 51],
	  // 0x7f
	  [0, 0, 0, 0, 0, 0, 0, 0],
	  // 0x80
	  [240, 240, 240, 240, 0, 0, 0, 0],
	  // 0x81
	  [15, 15, 15, 15, 0, 0, 0, 0],
	  // 0x82
	  [255, 255, 255, 255, 0, 0, 0, 0],
	  // 0x83
	  [0, 0, 0, 0, 240, 240, 240, 240],
	  // 0x84
	  [240, 240, 240, 240, 240, 240, 240, 240],
	  // 0x85
	  [15, 15, 15, 15, 240, 240, 240, 240],
	  // 0x86
	  [255, 255, 255, 255, 240, 240, 240, 240],
	  // 0x87
	  [0, 0, 0, 0, 15, 15, 15, 15],
	  // 0x88
	  [240, 240, 240, 240, 15, 15, 15, 15],
	  // 0x89
	  [15, 15, 15, 15, 15, 15, 15, 15],
	  // 0x8a
	  [255, 255, 255, 255, 15, 15, 15, 15],
	  // 0x8b
	  [0, 0, 0, 0, 255, 255, 255, 255],
	  // 0x8c
	  [240, 240, 240, 240, 255, 255, 255, 255],
	  // 0x8d
	  [15, 15, 15, 15, 255, 255, 255, 255],
	  // 0x8e
	  [255, 255, 255, 255, 255, 255, 255, 255],
	  // 0x8f
	  [0, 0, 0, 24, 24, 0, 0, 0],
	  // 0x90
	  [24, 24, 24, 24, 24, 0, 0, 0],
	  // 0x91
	  [0, 0, 0, 31, 31, 0, 0, 0],
	  // 0x92
	  [24, 24, 24, 31, 15, 0, 0, 0],
	  // 0x93
	  [0, 0, 0, 24, 24, 24, 24, 24],
	  // 0x94
	  [24, 24, 24, 24, 24, 24, 24, 24],
	  // 0x95
	  [0, 0, 0, 15, 31, 24, 24, 24],
	  // 0x96
	  [24, 24, 24, 31, 31, 24, 24, 24],
	  // 0x97
	  [0, 0, 0, 248, 248, 0, 0, 0],
	  // 0x98
	  [24, 24, 24, 248, 240, 0, 0, 0],
	  // 0x99
	  [0, 0, 0, 255, 255, 0, 0, 0],
	  // 0x9a
	  [24, 24, 24, 255, 255, 0, 0, 0],
	  // 0x9b
	  [0, 0, 0, 240, 248, 24, 24, 24],
	  // 0x9c
	  [24, 24, 24, 248, 248, 24, 24, 24],
	  // 0x9d
	  [0, 0, 0, 255, 255, 24, 24, 24],
	  // 0x9e
	  [24, 24, 24, 255, 255, 24, 24, 24],
	  // 0x9f
	  [16, 56, 108, 198, 0, 0, 0, 0],
	  // 0xa0
	  [12, 24, 48, 0, 0, 0, 0, 0],
	  // 0xa1
	  [102, 102, 0, 0, 0, 0, 0, 0],
	  // 0xa2
	  [60, 102, 96, 248, 96, 102, 254, 0],
	  // 0xa3
	  [56, 68, 186, 162, 186, 68, 56, 0],
	  // 0xa4
	  [126, 244, 244, 116, 52, 52, 52, 0],
	  // 0xa5
	  [30, 48, 56, 108, 56, 24, 240, 0],
	  // 0xa6
	  [24, 24, 12, 0, 0, 0, 0, 0],
	  // 0xa7
	  [64, 192, 68, 76, 84, 30, 4, 0],
	  // 0xa8
	  [64, 192, 76, 82, 68, 8, 30, 0],
	  // 0xa9
	  [224, 16, 98, 22, 234, 15, 2, 0],
	  // 0xaa
	  [0, 24, 24, 126, 24, 24, 126, 0],
	  // 0xab
	  [24, 24, 0, 126, 0, 24, 24, 0],
	  // 0xac
	  [0, 0, 0, 126, 6, 6, 0, 0],
	  // 0xad
	  [24, 0, 24, 48, 102, 102, 60, 0],
	  // 0xae
	  [24, 0, 24, 24, 24, 24, 24, 0],
	  // 0xaf
	  [0, 0, 115, 222, 204, 222, 115, 0],
	  // 0xb0
	  [124, 198, 198, 252, 198, 198, 248, 192],
	  // 0xb1
	  [0, 102, 102, 60, 102, 102, 60, 0],
	  // 0xb2
	  [60, 96, 96, 60, 102, 102, 60, 0],
	  // 0xb3
	  [0, 0, 30, 48, 124, 48, 30, 0],
	  // 0xb4
	  [56, 108, 198, 254, 198, 108, 56, 0],
	  // 0xb5
	  [0, 192, 96, 48, 56, 108, 198, 0],
	  // 0xb6
	  [0, 0, 102, 102, 102, 124, 96, 96],
	  // 0xb7
	  [0, 0, 0, 254, 108, 108, 108, 0],
	  // 0xb8
	  [0, 0, 0, 126, 216, 216, 112, 0],
	  // 0xb9
	  [3, 6, 12, 60, 102, 60, 96, 192],
	  // 0xba
	  [3, 6, 12, 102, 102, 60, 96, 192],
	  // 0xbb
	  [0, 230, 60, 24, 56, 108, 199, 0],
	  // 0xbc
	  [0, 0, 102, 195, 219, 219, 126, 0],
	  // 0xbd
	  [254, 198, 96, 48, 96, 198, 254, 0],
	  // 0xbe
	  [0, 124, 198, 198, 198, 108, 238, 0],
	  // 0xbf
	  [24, 48, 96, 192, 128, 0, 0, 0],
	  // 0xc0
	  [24, 12, 6, 3, 1, 0, 0, 0],
	  // 0xc1
	  [0, 0, 0, 1, 3, 6, 12, 24],
	  // 0xc2
	  [0, 0, 0, 128, 192, 96, 48, 24],
	  // 0xc3
	  [24, 60, 102, 195, 129, 0, 0, 0],
	  // 0xc4
	  [24, 12, 6, 3, 3, 6, 12, 24],
	  // 0xc5
	  [0, 0, 0, 129, 195, 102, 60, 24],
	  // 0xc6
	  [24, 48, 96, 192, 192, 96, 48, 24],
	  // 0xc7
	  [24, 48, 96, 193, 131, 6, 12, 24],
	  // 0xc8
	  [24, 12, 6, 131, 193, 96, 48, 24],
	  // 0xc9
	  [24, 60, 102, 195, 195, 102, 60, 24],
	  // 0xca
	  [195, 231, 126, 60, 60, 126, 231, 195],
	  // 0xcb
	  [3, 7, 14, 28, 56, 112, 224, 192],
	  // 0xcc
	  [192, 224, 112, 56, 28, 14, 7, 3],
	  // 0xcd
	  [204, 204, 51, 51, 204, 204, 51, 51],
	  // 0xce
	  [170, 85, 170, 85, 170, 85, 170, 85],
	  // 0xcf
	  [255, 255, 0, 0, 0, 0, 0, 0],
	  // 0xd0
	  [3, 3, 3, 3, 3, 3, 3, 3],
	  // 0xd1
	  [0, 0, 0, 0, 0, 0, 255, 255],
	  // 0xd2
	  [192, 192, 192, 192, 192, 192, 192, 192],
	  // 0xd3
	  [255, 254, 252, 248, 240, 224, 192, 128],
	  // 0xd4
	  [255, 127, 63, 31, 15, 7, 3, 1],
	  // 0xd5
	  [1, 3, 7, 15, 31, 63, 127, 255],
	  // 0xd6
	  [128, 192, 224, 240, 248, 252, 254, 255],
	  // 0xd7
	  [170, 85, 170, 85, 0, 0, 0, 0],
	  // 0xd8
	  [10, 5, 10, 5, 10, 5, 10, 5],
	  // 0xd9
	  [0, 0, 0, 0, 170, 85, 170, 85],
	  // 0xda
	  [160, 80, 160, 80, 160, 80, 160, 80],
	  // 0xdb
	  [170, 84, 168, 80, 160, 64, 128, 0],
	  // 0xdc
	  [170, 85, 42, 21, 10, 5, 2, 1],
	  // 0xdd
	  [1, 2, 5, 10, 21, 42, 85, 170],
	  // 0xde
	  [0, 128, 64, 160, 80, 168, 84, 170],
	  // 0xdf
	  [126, 255, 153, 255, 189, 195, 255, 126],
	  // 0xe0
	  [126, 255, 153, 255, 195, 189, 255, 126],
	  // 0xe1
	  [56, 56, 254, 254, 254, 16, 56, 0],
	  // 0xe2
	  [16, 56, 124, 254, 124, 56, 16, 0],
	  // 0xe3
	  [108, 254, 254, 254, 124, 56, 16, 0],
	  // 0xe4
	  [16, 56, 124, 254, 254, 16, 56, 0],
	  // 0xe5
	  [0, 60, 102, 195, 195, 102, 60, 0],
	  // 0xe6
	  [0, 60, 126, 255, 255, 126, 60, 0],
	  // 0xe7
	  [0, 126, 102, 102, 102, 102, 126, 0],
	  // 0xe8
	  [0, 126, 126, 126, 126, 126, 126, 0],
	  // 0xe9
	  [15, 7, 13, 120, 204, 204, 204, 120],
	  // 0xea
	  [60, 102, 102, 102, 60, 24, 126, 24],
	  // 0xeb
	  [12, 12, 12, 12, 12, 60, 124, 56],
	  // 0xec
	  [24, 28, 30, 27, 24, 120, 248, 112],
	  // 0xed
	  [153, 90, 36, 195, 195, 36, 90, 153],
	  // 0xee
	  [16, 56, 56, 56, 56, 56, 124, 214],
	  // 0xef
	  [24, 60, 126, 255, 24, 24, 24, 24],
	  // 0xf0
	  [24, 24, 24, 24, 255, 126, 60, 24],
	  // 0xf1
	  [16, 48, 112, 255, 255, 112, 48, 16],
	  // 0xf2
	  [8, 12, 14, 255, 255, 14, 12, 8],
	  // 0xf3
	  [0, 0, 24, 60, 126, 255, 255, 0],
	  // 0xf4
	  [0, 0, 255, 255, 126, 60, 24, 0],
	  // 0xf5
	  [128, 224, 248, 254, 248, 224, 128, 0],
	  // 0xf6
	  [2, 14, 62, 254, 62, 14, 2, 0],
	  // 0xf7
	  [56, 56, 146, 124, 16, 40, 40, 40],
	  // 0xf8
	  [56, 56, 16, 254, 16, 40, 68, 130],
	  // 0xf9
	  [56, 56, 18, 124, 144, 40, 36, 34],
	  // 0xfa
	  [56, 56, 144, 124, 18, 40, 72, 136],
	  // 0xfb
	  [0, 60, 24, 60, 60, 60, 24, 0],
	  // 0xfc
	  [60, 255, 255, 24, 12, 24, 48, 24],
	  // 0xfd
	  [24, 60, 126, 24, 24, 126, 60, 24],
	  // 0xfe
	  [0, 36, 102, 255, 102, 36, 0, 0]
	  //  0xff
	];

	class FileSelect {
	  // current file
	  constructor(options) {
	    this.fileIndex = 0;
	    this.imported = [];
	    this.fnOnLoadHandler = this.fnOnLoad.bind(this);
	    this.fnOnErrorHandler = this.fnOnError.bind(this);
	    this.fnOnFileSelectHandler = this.fnOnFileSelect.bind(this);
	    this.options = {};
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  fnReadNextFile(reader) {
	    if (this.files && this.fileIndex < this.files.length) {
	      const file = this.files[this.fileIndex];
	      this.fileIndex += 1;
	      const lastModified = file.lastModified, lastModifiedDate = lastModified ? new Date(lastModified) : file.lastModifiedDate, text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");
	      UiUtils.console.log(text);
	      if (file.type === "text/plain") {
	        reader.readAsText(file);
	      } else if (file.type === "application/x-zip-compressed" || file.type === "application/zip") {
	        reader.readAsArrayBuffer(file);
	      } else {
	        reader.readAsDataURL(file);
	      }
	      this.file = file;
	    } else {
	      this.options.fnEndOfImport(this.imported);
	    }
	  }
	  fnOnLoad(event) {
	    if (!this.file) {
	      UiUtils.console.error("fnOnLoad: Programming error: No file");
	      return;
	    }
	    const file = this.file, name = file.name, reader = event.target;
	    let data = reader && reader.result || null, type = "";
	    if ((file.type === "application/x-zip-compressed" || file.type === "application/zip") && data instanceof ArrayBuffer) {
	      type = "Z";
	      this.options.fnLoad2(new Uint8Array(data), name, type, this.imported);
	    } else if (typeof data === "string") {
	      if (file.type === "text/plain") {
	        type = "A";
	      } else if (data.indexOf("data:") === 0) {
	        const index = data.indexOf(",");
	        if (index >= 0) {
	          const info1 = data.substring(0, index);
	          data = data.substring(index + 1);
	          if (info1.indexOf("base64") >= 0) {
	            data = window.atob(data);
	          }
	          if (info1.indexOf("text/") >= 0 && info1.indexOf("text/x-basic") < 0) {
	            type = "A";
	          }
	        }
	      }
	      this.options.fnLoad2(data, name, type, this.imported);
	    } else {
	      UiUtils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
	    }
	    if (reader) {
	      this.fnReadNextFile(reader);
	    }
	  }
	  fnOnError(event) {
	    const reader = event.target, filename = this.file && this.file.name || "unknown";
	    let msg = "fnOnError: " + filename;
	    if (reader && reader.error) {
	      msg += ": " + String(reader.error);
	    }
	    UiUtils.console.error(msg);
	    if (reader) {
	      this.fnReadNextFile(reader);
	    }
	  }
	  // https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
	  // https://www.w3.org/TR/file-upload/#dfn-filereader
	  fnOnFileSelect(event) {
	    event.stopPropagation();
	    event.preventDefault();
	    const dataTransfer = event.dataTransfer, files = dataTransfer ? dataTransfer.files : View.getEventTarget(event).files;
	    if (!files || !files.length) {
	      UiUtils.console.error("fnHandleFileSelect: No files!");
	      return;
	    }
	    this.files = files;
	    this.fileIndex = 0;
	    this.imported.length = 0;
	    if (window.FileReader) {
	      const reader = new window.FileReader();
	      reader.onerror = this.fnOnErrorHandler;
	      reader.onload = this.fnOnLoadHandler;
	      this.fnReadNextFile(reader);
	    } else {
	      UiUtils.console.warn("fnHandleFileSelect: FileReader API not supported.");
	    }
	  }
	  addFileSelectHandler(element, type) {
	    element.addEventListener(type, this.fnOnFileSelectHandler, false);
	  }
	}

	const _Keyboard = class _Keyboard {
	  // simulated num lock for Mac OS
	  constructor(options) {
	    this.keyBuffer = [];
	    // buffered pressed keys
	    this.expansionTokens = [];
	    // cpc keys to expansion tokens for normal, shift, ctrl; also repeat
	    this.active = false;
	    this.codeStringsRemoved = false;
	    this.pressedKeys = {};
	    this.fnKeydownOrKeyupHandler = (event) => this.onKeydownOrKeyup(event);
	    this.options = {};
	    this.setOptions(options);
	    this.key2CpcKey = _Keyboard.key2CpcKey;
	    this.cpcKeyExpansions = {
	      normal: {},
	      shift: {},
	      ctrl: {},
	      repeat: {}
	    };
	    const view = this.options.view;
	    view.addEventListenerById("keydown", this.fnKeydownOrKeyupHandler, ViewID.cpcArea);
	    view.addEventListenerById("keyup", this.fnKeydownOrKeyupHandler, ViewID.cpcArea);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  /* eslint-enable array-element-newline */
	  reset() {
	    this.options.fnOnKeyDown = void 0;
	    this.clearInput();
	    this.pressedKeys = {};
	    this.resetExpansionTokens();
	    this.resetCpcKeysExpansions();
	  }
	  clearInput() {
	    this.keyBuffer.length = 0;
	  }
	  resetExpansionTokens() {
	    const expansionTokens = this.expansionTokens;
	    for (let i = 0; i <= 9; i += 1) {
	      expansionTokens[i] = String(i);
	    }
	    expansionTokens[10] = ".";
	    expansionTokens[11] = "\r";
	    expansionTokens[12] = 'RUN"\r';
	    for (let i = 13; i <= 31; i += 1) {
	      expansionTokens[i] = "0";
	    }
	  }
	  resetCpcKeysExpansions() {
	    const cpcKeyExpansions = this.cpcKeyExpansions;
	    cpcKeyExpansions.normal = {
	      // cpcKey => ExpansionToken (128-159)
	      15: 0 + 128,
	      // F0
	      13: 1 + 128,
	      // F1
	      14: 2 + 128,
	      // F2
	      5: 3 + 128,
	      // F3
	      20: 4 + 128,
	      // F4
	      12: 5 + 128,
	      // F5
	      4: 6 + 128,
	      // F6
	      10: 7 + 128,
	      // F7
	      11: 8 + 128,
	      // F8
	      3: 9 + 128,
	      // F9
	      7: 10 + 128,
	      // F.
	      6: 11 + 128
	      // Enter
	    };
	    cpcKeyExpansions.shift = {};
	    cpcKeyExpansions.ctrl = {
	      6: 12 + 128
	      // ctrl+Enter
	    };
	    cpcKeyExpansions.repeat = {};
	  }
	  setActive(active) {
	    this.active = active;
	  }
	  removeCodeStringsFromKeymap() {
	    const key2CpcKey = this.key2CpcKey, newMap = {};
	    if (UiUtils.debug > 1) {
	      UiUtils.console.log("removeCodeStringsFromKeymap: Unfortunately not all keys can be used.");
	    }
	    for (const key in key2CpcKey) {
	      if (Object.prototype.hasOwnProperty.call(key2CpcKey, key)) {
	        const keyCode = parseInt(key, 10);
	        newMap[keyCode] = key2CpcKey[key];
	      }
	    }
	    this.key2CpcKey = newMap;
	  }
	  fnPressCpcKey(event, cpcKeyCode, pressedKey, key) {
	    const shiftKey = event.shiftKey, ctrlKey = event.ctrlKey, pressedKeys = this.pressedKeys, cpcKeyExpansions = this.cpcKeyExpansions, specialKeys = _Keyboard.specialKeys, cpcKey = String(cpcKeyCode);
	    let cpcKeyEntry = pressedKeys[cpcKey];
	    if (!cpcKeyEntry) {
	      pressedKeys[cpcKey] = {
	        keys: {},
	        shift: false,
	        ctrl: false
	      };
	      cpcKeyEntry = pressedKeys[cpcKey];
	    }
	    const keyAlreadyPressed = cpcKeyEntry.keys[pressedKey];
	    cpcKeyEntry.keys[pressedKey] = true;
	    cpcKeyEntry.shift = shiftKey;
	    cpcKeyEntry.ctrl = ctrlKey;
	    if (UiUtils.debug > 1) {
	      UiUtils.console.log("fnPressCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKey);
	    }
	    const repeat = cpcKeyExpansions.repeat;
	    if (keyAlreadyPressed && (cpcKey in repeat && !repeat[cpcKey])) {
	      key = "";
	    } else {
	      let expansions;
	      if (ctrlKey) {
	        expansions = cpcKeyExpansions.ctrl;
	      } else if (shiftKey) {
	        expansions = cpcKeyExpansions.shift;
	      } else {
	        expansions = cpcKeyExpansions.normal;
	      }
	      if (cpcKey in expansions) {
	        const expKey = expansions[cpcKey];
	        if (expKey >= 128 && expKey <= 159) {
	          key = this.expansionTokens[expKey - 128];
	          for (let i = 0; i < key.length; i += 1) {
	            this.putKeyInBuffer(key.charAt(i));
	          }
	        } else {
	          key = String.fromCharCode(expKey);
	          this.putKeyInBuffer(key.charAt(0));
	        }
	        key = "";
	      }
	    }
	    const shiftCtrlKey = key + (shiftKey ? "Shift" : "") + (ctrlKey ? "Ctrl" : "");
	    if (shiftCtrlKey in specialKeys) {
	      key = specialKeys[shiftCtrlKey];
	    } else if (key in specialKeys) {
	      key = specialKeys[key];
	    } else if (ctrlKey) {
	      if (key >= "a" && key <= "z") {
	        key = String.fromCharCode(key.charCodeAt(0) - 96);
	      }
	    }
	    if (key.length === 1) {
	      this.putKeyInBuffer(key);
	    }
	    if (cpcKeyCode === 66 && this.options.fnOnEscapeHandler) {
	      this.options.fnOnEscapeHandler(key, pressedKey);
	    }
	    if (this.options.fnOnKeyDown) {
	      this.options.fnOnKeyDown();
	    }
	  }
	  fnReleaseCpcKey(event, cpcKeyCode, pressedKey, key) {
	    const shiftKey = event.shiftKey, ctrlKey = event.ctrlKey, pressedKeys = this.pressedKeys, cpcKey = pressedKeys[cpcKeyCode];
	    if (UiUtils.debug > 1) {
	      UiUtils.console.log("fnReleaseCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKeyCode + ", keys:", cpcKey ? cpcKey.keys : "undef.");
	    }
	    if (!cpcKey) {
	      UiUtils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", cpcKeyCode);
	    } else {
	      delete cpcKey.keys[pressedKey];
	      if (!Object.keys(cpcKey.keys).length) {
	        delete pressedKeys[cpcKeyCode];
	      } else {
	        cpcKey.shift = shiftKey;
	        cpcKey.ctrl = ctrlKey;
	      }
	    }
	  }
	  static keyIdentifier2Char(event) {
	    const identifier = event.keyIdentifier ?? "", shiftKey = event.shiftKey;
	    let char;
	    if (/^U\+/i.test(identifier || "")) {
	      char = String.fromCharCode(parseInt(identifier.slice(2), 16));
	      if (char === "\0") {
	        char = "";
	      }
	      char = shiftKey ? char.toUpperCase() : char.toLowerCase();
	    } else {
	      char = identifier;
	    }
	    return char;
	  }
	  fnKeyboardKeydown(event) {
	    const keyCode = event.which || event.keyCode;
	    let pressedKey = String(keyCode) + (event.code ? event.code : ""), key = event.key || _Keyboard.keyIdentifier2Char(event) || "";
	    if (!event.code && !this.codeStringsRemoved) {
	      this.removeCodeStringsFromKeymap();
	      this.codeStringsRemoved = true;
	    }
	    if (UiUtils.debug > 1) {
	      UiUtils.console.log("fnKeyboardKeydown: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
	    }
	    if (pressedKey in this.key2CpcKey) {
	      const numTabOffKey = this.simulatedNumLock === false ? _Keyboard.numPadOffKeyMap[pressedKey] : void 0;
	      if (numTabOffKey) {
	        pressedKey = numTabOffKey;
	      }
	      let cpcKey = this.key2CpcKey[pressedKey];
	      if (cpcKey === 85) {
	        cpcKey = 22;
	      }
	      if (cpcKey === 72) {
	        key = "JoyUp";
	      } else if (cpcKey === 73) {
	        key = "JoyDown";
	      } else if (cpcKey === 74) {
	        key = "JoyLeft";
	      } else if (cpcKey === 75) {
	        key = "JoyRight";
	      } else if (key === "Dead") {
	        key += event.code + (event.shiftKey ? "Shift" : "");
	      } else if (key === "Unidentified") {
	        if (keyCode === 220) {
	          key = event.shiftKey ? "\xB0" : "DeadBackquote";
	        } else if (keyCode === 221) {
	          key = "DeadEqual" + (event.shiftKey ? "Shift" : "");
	        } else if (keyCode === 226) {
	          key = "|";
	        }
	      } else if (key.length === 2) {
	        if (key.charAt(0) === "^" || key.charAt(0) === "\xB4" || key.charAt(0) === "`") {
	          key = key.substring(1);
	        }
	      }
	      this.fnPressCpcKey(event, cpcKey, pressedKey, key);
	    } else if (key.length === 1) {
	      this.putKeyInBuffer(key);
	      UiUtils.console.log("fnKeyboardKeydown: Partly unhandled key", pressedKey + ":", key);
	    } else if (pressedKey === "12NumLock") {
	      this.simulatedNumLock = this.simulatedNumLock !== void 0 ? !this.simulatedNumLock : false;
	      if (UiUtils.debug > 1) {
	        UiUtils.console.log("fnKeyboardKeydown: simulatedNumLock=" + this.simulatedNumLock);
	      }
	    } else {
	      UiUtils.console.log("fnKeyboardKeydown: Unhandled key", pressedKey + ":", key);
	    }
	  }
	  fnKeyboardKeyup(event) {
	    const keyCode = event.which || event.keyCode, key = event.key || _Keyboard.keyIdentifier2Char(event) || "";
	    let pressedKey = String(keyCode) + (event.code ? event.code : "");
	    if (UiUtils.debug > 1) {
	      UiUtils.console.log("fnKeyboardKeyup: keyCode=" + keyCode + " pressedKey=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
	    }
	    if (pressedKey in this.key2CpcKey) {
	      const numTabOffKey = this.simulatedNumLock === false ? _Keyboard.numPadOffKeyMap[pressedKey] : void 0;
	      if (numTabOffKey) {
	        pressedKey = numTabOffKey;
	      }
	      let cpcKey = this.key2CpcKey[pressedKey];
	      if (cpcKey === 85) {
	        cpcKey = 22;
	      }
	      this.fnReleaseCpcKey(event, cpcKey, pressedKey, key);
	    } else if (pressedKey === "12NumLock") {
	      if (UiUtils.debug > 1) {
	        UiUtils.console.log("fnKeyboardKeyup: simulatedNumLock=" + this.simulatedNumLock);
	      }
	    } else {
	      UiUtils.console.log("fnKeyboardKeyup: Unhandled key", pressedKey + ":", key);
	    }
	  }
	  getKeyFromBuffer() {
	    const keyBuffer = this.keyBuffer, key = keyBuffer.length ? keyBuffer.shift() : "";
	    return key;
	  }
	  putKeyInBuffer(key, triggerOnKeyDown) {
	    this.keyBuffer.push(key);
	    if (triggerOnKeyDown) {
	      const keyDownHandler = this.options.fnOnKeyDown;
	      if (keyDownHandler) {
	        keyDownHandler();
	      }
	    }
	  }
	  putKeysInBuffer(input) {
	    for (let i = 0; i < input.length; i += 1) {
	      const key = input.charAt(i);
	      this.keyBuffer.push(key);
	    }
	  }
	  getKeyState(cpcKeyCode) {
	    const pressedKeys = this.pressedKeys;
	    let state = -1;
	    if (cpcKeyCode in pressedKeys) {
	      const cpcKeyEntry = pressedKeys[cpcKeyCode];
	      state = 0 + (cpcKeyEntry.shift ? 32 : 0) + (cpcKeyEntry.ctrl ? 128 : 0);
	    }
	    return state;
	  }
	  getJoyState(joy) {
	    const joyKeyList = _Keyboard.joyKeyCodes[joy];
	    let value = 0;
	    for (let i = 0; i < joyKeyList.length; i += 1) {
	      if (this.getKeyState(joyKeyList[i]) !== -1) {
	        value |= 1 << i;
	      }
	    }
	    if (joy === 0) {
	      if (this.getKeyState(80) !== -1) {
	        value |= 1 + 4;
	      }
	      if (this.getKeyState(81) !== -1) {
	        value |= 1 + 8;
	      }
	      if (this.getKeyState(82) !== -1) {
	        value |= 2 + 4;
	      }
	      if (this.getKeyState(83) !== -1) {
	        value |= 2 + 8;
	      }
	    }
	    return value;
	  }
	  setExpansionToken(token, string) {
	    this.expansionTokens[token] = string;
	  }
	  setCpcKeyExpansion(options) {
	    const cpcKeyExpansions = this.cpcKeyExpansions, cpcKey = options.cpcKey;
	    cpcKeyExpansions.repeat[cpcKey] = options.repeat;
	    if (options.normal !== void 0) {
	      cpcKeyExpansions.normal[cpcKey] = options.normal;
	    }
	    if (options.shift !== void 0) {
	      cpcKeyExpansions.shift[cpcKey] = options.shift;
	    }
	    if (options.ctrl !== void 0) {
	      cpcKeyExpansions.ctrl[cpcKey] = options.ctrl;
	    }
	  }
	  onKeydownOrKeyup(event) {
	    if (this.active) {
	      if (event.type === "keydown") {
	        this.fnKeyboardKeydown(event);
	      } else if (event.type === "keyup") {
	        this.fnKeyboardKeyup(event);
	      } else {
	        UiUtils.console.error("onKeydownOrKeyup: Unknown type:", event.type);
	      }
	      event.preventDefault();
	      return false;
	    }
	    return void 0;
	  }
	};
	// use this:
	_Keyboard.key2CpcKey = {
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
	_Keyboard.specialKeys = {
	  Alt: String.fromCharCode(224),
	  // Copy
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
	  // joy fire 2
	  Spacebar: " ",
	  // for IE
	  Tab: String.fromCharCode(9),
	  \u00E4: ";",
	  \u00C4: "+",
	  \u00F6: ":",
	  \u00D6: "*",
	  \u00FC: "@",
	  \u00DC: "|",
	  \u00DF: "-",
	  DeadBackquote: "^",
	  "\xB0": "\xA3",
	  DeadEqual: String.fromCharCode(161),
	  // tick
	  "\xB4": String.fromCharCode(161),
	  // IE: tick
	  DeadEqualShift: "`"
	  // backtick
	};
	/* eslint-disable array-element-newline */
	_Keyboard.joyKeyCodes = [
	  [72, 73, 74, 75, 76, 77],
	  [48, 49, 50, 51, 52, 53]
	];
	_Keyboard.numPadOffKeyMap = {
	  "96Numpad0": "45Numpad0",
	  "97Numpad1": "35Numpad1",
	  "98Numpad2": "40Numpad2",
	  "99Numpad3": "34Numpad3",
	  "100Numpad4": "37Numpad4",
	  "101Numpad5": "12Numpad5",
	  "102Numpad6": "39Numpad6",
	  "103Numpad7": "36Numpad7",
	  "104Numpad8": "38Numpad8",
	  "105Numpad9": "33Numpad9",
	  "110NumpadDecimal": "46NumpadDecimal"
	};
	let Keyboard = _Keyboard;

	class NoCanvas extends Engine.Engine.NullCanvas {
	  constructor(options) {
	    super();
	    this.options = {};
	    this.setOptions(options);
	    this.reset();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  onCanvasClick(_event) {
	  }
	  takeScreenShot() {
	    return "";
	  }
	  startUpdateCanvas() {
	  }
	  stopUpdateCanvas() {
	  }
	  onWindowClick(_event) {
	  }
	}

	const _TextCanvas = class _TextCanvas {
	  constructor(options) {
	    this.fps = 15;
	    // FPS for canvas update
	    this.isRunning = false;
	    this.borderWidth = 1;
	    this.needUpdate = false;
	    this.textBuffer = [];
	    // textbuffer characters at row,column
	    this.hasFocus = false;
	    // canvas has focus
	    this.customCharset = {};
	    this.options = {};
	    this.setOptions(options);
	    this.textText = View.getElementByIdAs(this.options.canvasID);
	    this.cpcAreaBox = View.getElementById1(ViewID.cpcArea);
	    this.fnUpdateCanvasHandler = this.updateCanvas.bind(this);
	    this.fnUpdateCanvas2Handler = this.updateCanvas2.bind(this);
	    this.cols = parseFloat(this.textText.getAttribute("cols") || "0");
	    this.rows = parseFloat(this.textText.getAttribute("rows") || "0");
	    this.animationTimeoutId = void 0;
	    this.animationFrame = void 0;
	    this.reset();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  reset() {
	    this.resetTextBuffer();
	    this.setNeedUpdate();
	  }
	  resetCustomChars() {
	  }
	  setScreenOffset(_offset) {
	  }
	  updateColorsAndCanvasImmediately(_inkList) {
	  }
	  updateSpeedInk() {
	  }
	  setCustomChar(char, charData) {
	    this.customCharset[char] = charData;
	  }
	  getCharData(char) {
	    return this.customCharset[char] || this.options.charset[char];
	  }
	  setDefaultInks() {
	  }
	  getXpos() {
	    return 0;
	  }
	  getYpos() {
	    return 0;
	  }
	  getByte(_addr) {
	    return 0;
	  }
	  setByte(_addr, _byte) {
	  }
	  draw(_x, _y) {
	  }
	  move(_x, _y) {
	  }
	  plot(_x, _y) {
	  }
	  test(_x, _y) {
	    return 0;
	  }
	  setInk(_pen, _ink1, _ink2) {
	    return false;
	  }
	  setBorder(_ink1, _ink2) {
	  }
	  setGPen(_gPen) {
	  }
	  setGPaper(_gPaper) {
	  }
	  setGTransparentMode(_transparent) {
	  }
	  printGChar(_char) {
	  }
	  drawCursor(_x, _y, _pen, _paper) {
	  }
	  fill(_fillPen) {
	  }
	  setOrigin(_xOrig, _yOrig) {
	  }
	  getXOrigin() {
	    return 0;
	  }
	  getYOrigin() {
	    return 0;
	  }
	  setGWindow(_xLeft, _xRight, _yTop, _yBottom) {
	  }
	  setGColMode(_gColMode) {
	  }
	  clearGraphicsWindow() {
	  }
	  setSpeedInk(_time1, _time2) {
	  }
	  setMask(_mask) {
	  }
	  setMaskFirst(_maskFirst) {
	  }
	  getMode() {
	    return 0;
	  }
	  changeMode(_mode) {
	  }
	  takeScreenShot() {
	    return "";
	  }
	  resetTextBuffer() {
	    this.textBuffer.length = 0;
	  }
	  setNeedUpdate() {
	    this.needUpdate = true;
	  }
	  updateCanvas2() {
	    if (!this.isRunning) {
	      return;
	    }
	    this.animationFrame = requestAnimationFrame(this.fnUpdateCanvasHandler);
	    if (this.textText.offsetParent) {
	      if (this.needUpdate) {
	        this.needUpdate = false;
	        this.updateTextWindow();
	      }
	    }
	  }
	  updateCanvas() {
	    this.animationTimeoutId = window.setTimeout(this.fnUpdateCanvas2Handler, 1e3 / this.fps);
	  }
	  startUpdateCanvas() {
	    if (!this.isRunning && this.textText.offsetParent !== null) {
	      this.isRunning = true;
	      this.updateCanvas();
	    }
	  }
	  stopUpdateCanvas() {
	    if (this.isRunning) {
	      this.isRunning = false;
	      if (this.animationFrame) {
	        cancelAnimationFrame(this.animationFrame);
	        this.animationFrame = void 0;
	      }
	      clearTimeout(this.animationTimeoutId);
	      this.animationTimeoutId = void 0;
	    }
	  }
	  updateTextWindow() {
	    const textBuffer = this.textBuffer, cpc2Unicode = _TextCanvas.cpc2Unicode;
	    let out = "";
	    for (let y = 0; y < textBuffer.length; y += 1) {
	      const textBufferRow = textBuffer[y];
	      if (textBufferRow) {
	        for (let x = 0; x < textBufferRow.length; x += 1) {
	          out += cpc2Unicode[textBufferRow[x] || 32];
	        }
	      }
	      out += "\n";
	    }
	    this.textText.value = out;
	  }
	  setFocusOnCanvas() {
	    this.cpcAreaBox.style.background = "#463c3c";
	    if (this.textText) {
	      this.textText.focus();
	    }
	    this.hasFocus = true;
	  }
	  getMousePos(event, canvasWidth, canvasHeight) {
	    const rect = this.textText.getBoundingClientRect(), pos = {
	      x: (event.clientX - this.borderWidth - rect.left) / (rect.right - rect.left - this.borderWidth * 2) * canvasWidth,
	      y: (event.clientY - this.borderWidth - rect.top) / (rect.bottom - rect.top - this.borderWidth * 2) * canvasHeight
	    };
	    return pos;
	  }
	  canvasClickAction(event) {
	    const canvasWidth = 640, canvasHeight = 400, pos = this.getMousePos(event, canvasWidth, canvasHeight), x = pos.x | 0, y = pos.y | 0;
	    if (this.options.onCanvasClick) {
	      const charWidth = canvasWidth / this.cols, charHeight = canvasHeight / this.rows, xTxt = x / charWidth | 0, yTxt = y / charHeight | 0;
	      this.options.onCanvasClick(event, x, y, xTxt, yTxt);
	    }
	  }
	  onCanvasClick(event) {
	    if (!this.hasFocus) {
	      this.setFocusOnCanvas();
	    } else {
	      this.canvasClickAction(event);
	    }
	    event.stopPropagation();
	  }
	  onWindowClick(_event) {
	    if (this.hasFocus) {
	      this.hasFocus = false;
	      this.cpcAreaBox.style.background = "";
	    }
	  }
	  fillTextBox(left, top, width, height, _paper) {
	    this.clearTextBufferBox(left, top, width, height);
	  }
	  clearTextBufferBox(left, top, width, height) {
	    const textBuffer = this.textBuffer;
	    for (let y = top; y < top + height; y += 1) {
	      const textBufferRow = textBuffer[y];
	      if (textBufferRow) {
	        for (let x = left; x < left + width; x += 1) {
	          delete textBufferRow[x];
	        }
	      }
	    }
	    this.setNeedUpdate();
	  }
	  copyTextBufferBoxUp(left, top, width, height, left2, top2) {
	    const textBuffer = this.textBuffer;
	    for (let y = 0; y < height; y += 1) {
	      const sourceRow = textBuffer[top + y];
	      let destinationRow = textBuffer[top2 + y];
	      if (sourceRow) {
	        if (!destinationRow) {
	          destinationRow = [];
	          textBuffer[top2 + y] = destinationRow;
	        }
	        for (let x = 0; x < width; x += 1) {
	          destinationRow[left2 + x] = sourceRow[left + x];
	        }
	      } else if (destinationRow) {
	        delete textBuffer[top2 + y];
	      }
	    }
	    this.setNeedUpdate();
	  }
	  copyTextBufferBoxDown(left, top, width, height, left2, top2) {
	    const textBuffer = this.textBuffer;
	    for (let y = height - 1; y >= 0; y -= 1) {
	      const sourceRow = textBuffer[top + y];
	      let destinationRow = textBuffer[top2 + y];
	      if (sourceRow) {
	        if (!destinationRow) {
	          destinationRow = [];
	          textBuffer[top2 + y] = destinationRow;
	        }
	        for (let x = 0; x < width; x += 1) {
	          destinationRow[left2 + x] = sourceRow[left + x];
	        }
	      } else if (destinationRow) {
	        delete textBuffer[top2 + y];
	      }
	    }
	    this.setNeedUpdate();
	  }
	  putCharInTextBuffer(char, x, y) {
	    const textBuffer = this.textBuffer;
	    if (!textBuffer[y]) {
	      textBuffer[y] = [];
	    }
	    this.textBuffer[y][x] = char;
	    this.setNeedUpdate();
	  }
	  getCharFromTextBuffer(x, y) {
	    const textBuffer = this.textBuffer;
	    let char;
	    if (textBuffer[y]) {
	      char = this.textBuffer[y][x];
	    }
	    return char;
	  }
	  printChar(char, x, y, _pen, _paper, _transparent) {
	    this.putCharInTextBuffer(char, x, y);
	  }
	  readChar(x, y, _pen, _paper) {
	    let char = this.getCharFromTextBuffer(x, y);
	    if (char === void 0) {
	      char = -1;
	    }
	    return char;
	  }
	  clearTextWindow(left, right, top, bottom, _paper) {
	    const width = right + 1 - left, height = bottom + 1 - top;
	    this.fillTextBox(left, top, width, height);
	  }
	  setMode(mode) {
	    const winData = _TextCanvas.winData[mode], cols = winData.right + 1, rows = winData.bottom + 1;
	    if (this.cols !== cols) {
	      this.cols = cols;
	      this.textText.setAttribute("cols", String(cols));
	    }
	    if (this.rows !== rows) {
	      this.rows = rows;
	      this.textText.setAttribute("rows", String(rows));
	    }
	  }
	  clearFullWindow() {
	    this.resetTextBuffer();
	    this.setNeedUpdate();
	  }
	  windowScrollUp(left, right, top, bottom, _paper) {
	    const width = right + 1 - left, height = bottom + 1 - top;
	    if (height > 1) {
	      this.copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
	    }
	    this.fillTextBox(left, bottom, width, 1);
	  }
	  windowScrollDown(left, right, top, bottom, _paper) {
	    const width = right + 1 - left, height = bottom + 1 - top;
	    if (height > 1) {
	      this.copyTextBufferBoxDown(left, top, width, height - 1, left, top + 1);
	    }
	    this.fillTextBox(left, top, width, 1);
	  }
	};
	// CPC Unicode map for text mode (https://www.unicode.org/L2/L2019/19025-terminals-prop.pdf AMSCPC.TXT) incomplete; wider chars replaced by "."
	// tooWide = [132,134,135,136,137,139,141,142,224,225,226,227,245];
	// For equal height we set line-height: 15px;
	_TextCanvas.cpc2Unicode = "................................ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]\u2195_`abcdefghijklmnopqrstuvwxyz{|}~\u2591\xA0\u2598\u259D\u2580.\u258C....\u2590.\u2584..\u2588\xB7\u2575\u2576\u2514\u2577\u2502\u250C\u251C\u2574\u2518\u2500\u2534\u2510\u2524\u252C\u253C^\xB4\xA8\xA3\xA9\xB6\xA7\u2018\xBC\xBD\xBE\xB1\xF7\xAC\xBF\xA1\u03B1\u03B2\u03B3\u03B4\u03B5\u03B8\u03BB\u03BC\u03C0\u03C3\u03C6\u03C8\u03C7\u03C9\u03A3\u03A9\u1FBA0\u1FBA1\u1FBA3\u1FBA2\u1FBA7\u1FBA5\u1FBA6\u1FBA4\u1FBA8\u1FBA9\u1FBAE\u2573\u2571\u2572\u1FB95\u2592\u23BA\u23B9\u23BD\u23B8....\u1FB8E\u1FB8D\u1FB8F\u1FB8C\u1FB9C\u1FB9D\u1FB9E\u1FB9F\u263A.\u2663\u2666\u2665\u2660\u25CB\u25CF\u25A1\u25A0\u2642\u2640";
	// same as in CpcVm
	_TextCanvas.winData = [
	  // window data for mode mode 0,1,2,3 (we are counting from 0 here)
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
	    // mode 3 not available on CPC
	    right: 79,
	    top: 0,
	    bottom: 49
	  }
	];
	let TextCanvas = _TextCanvas;

	const _VirtualKeyboard = class _VirtualKeyboard {
	  constructor(options) {
	    this.shiftLock = false;
	    this.numLock = false;
	    this.fnVirtualKeyboardKeydownHandler = (event) => this.onVirtualKeyboardKeydown(event);
	    this.fnVirtualKeyboardKeyupOrKeyoutHandler = (event) => this.onVirtualKeyboardKeyupOrKeyout(event);
	    this.fnKeydownOrKeyupHandler = (event) => this.onKeydownOrKeyup(event);
	    this.options = {};
	    this.setOptions(options);
	    const view = this.options.view;
	    this.eventNames = this.options.view.fnAttachPointerEvents(ViewID.kbdAreaInner, this.fnVirtualKeyboardKeydownHandler, void 0, this.fnVirtualKeyboardKeyupOrKeyoutHandler);
	    view.addEventListenerById("keydown", this.fnKeydownOrKeyupHandler, ViewID.kbdAreaInner);
	    view.addEventListenerById("keyup", this.fnKeydownOrKeyupHandler, ViewID.kbdAreaInner);
	    this.virtualKeyboardCreate();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  /* eslint-enable array-element-newline */
	  reset() {
	    this.virtualKeyboardAdaptKeys(false, false);
	  }
	  mapNumLockCpcKey(cpcKey) {
	    const key = _VirtualKeyboard.cpcKey2Key[cpcKey];
	    if (key.numLockCpcKey) {
	      cpcKey = key.numLockCpcKey;
	    }
	    return cpcKey;
	  }
	  fnVirtualGetAscii(cpcKey, shiftKey, numLock) {
	    const keyEntry = _VirtualKeyboard.cpcKey2Key[cpcKey];
	    let key, text, title;
	    if (numLock && keyEntry.keyNumLock) {
	      key = keyEntry.keyNumLock;
	      text = keyEntry.textNumLock || key;
	      title = keyEntry.titleNumLock || text;
	    } else if (shiftKey && keyEntry.keyShift) {
	      key = keyEntry.keyShift;
	      text = keyEntry.textShift || key;
	      title = keyEntry.titleShift || text;
	    } else {
	      key = keyEntry.key;
	      text = keyEntry.text || key;
	      title = keyEntry.title || text;
	    }
	    return {
	      key,
	      text,
	      title
	    };
	  }
	  createButtonRow(id, options) {
	    const place = View.getElementById1(id);
	    if (place.insertAdjacentElement) {
	      const buttonList = document.createElement("div");
	      buttonList.className = "displayFlex";
	      for (let i = 0; i < options.length; i += 1) {
	        const item = options[i], button = document.createElement("button");
	        button.innerText = item.text;
	        button.setAttribute("title", item.title);
	        button.className = item.className;
	        button.setAttribute("data-key", String(item.key));
	        buttonList.insertAdjacentElement("beforeend", button);
	      }
	      place.insertAdjacentElement("beforeend", buttonList);
	    } else {
	      let html = "<div class=displayFlex>\n";
	      for (let i = 0; i < options.length; i += 1) {
	        const item = options[i];
	        html += '<button title="' + item.title + '" class="' + item.className + '" data-key="' + item.key + '">' + item.text + "</button>\n";
	      }
	      html += "</div>";
	      place.innerHTML += html;
	    }
	    return this;
	  }
	  virtualKeyboardCreatePart(id, virtualKeyboard) {
	    const keyArea = View.getElementById1(id), shiftLock = this.shiftLock, numLock = this.numLock, cpcKey2Key = _VirtualKeyboard.cpcKey2Key, buttons = keyArea.getElementsByTagName("button");
	    if (!buttons.length) {
	      for (let row = 0; row < virtualKeyboard.length; row += 1) {
	        const rowList = virtualKeyboard[row], optionsList = [];
	        for (let col = 0; col < rowList.length; col += 1) {
	          let cpcKeyEntry;
	          if (typeof rowList[col] === "number") {
	            cpcKeyEntry = {
	              key: rowList[col]
	            };
	          } else {
	            cpcKeyEntry = rowList[col];
	          }
	          const cpcKey = numLock ? this.mapNumLockCpcKey(cpcKeyEntry.key) : cpcKeyEntry.key, keyEntry = cpcKey2Key[cpcKeyEntry.key], ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock), className = "kbdButton" + (cpcKeyEntry.style || keyEntry.style || "") + (col === rowList.length - 1 ? " kbdNoRightMargin" : ""), options = {
	            key: cpcKey,
	            text: ascii.text,
	            title: ascii.title,
	            className
	          };
	          optionsList.push(options);
	        }
	        this.createButtonRow(id, optionsList);
	      }
	    }
	  }
	  virtualKeyboardCreate() {
	    this.virtualKeyboardCreatePart(ViewID.kbdAlpha, _VirtualKeyboard.virtualKeyboardAlpha);
	    this.virtualKeyboardCreatePart(ViewID.kbdNum, _VirtualKeyboard.virtualKeyboardNum);
	  }
	  virtualKeyboardAdaptKeys(shiftLock, numLock) {
	    const keyArea = View.getElementById1(ViewID.kbdAreaInner), buttons = keyArea.getElementsByTagName("button");
	    for (let i = 0; i < buttons.length; i += 1) {
	      const button = buttons[i];
	      let cpcKey = Number(button.getAttribute("data-key"));
	      if (numLock) {
	        cpcKey = this.mapNumLockCpcKey(cpcKey);
	      }
	      const ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock);
	      if (ascii.key !== button.innerText) {
	        button.innerText = ascii.text;
	        button.title = ascii.title;
	      }
	    }
	  }
	  fnVirtualGetPressedKey(cpcKey) {
	    const key = _VirtualKeyboard.cpcKey2Key[cpcKey];
	    let pressedKey = "";
	    if (key) {
	      pressedKey = key.keys;
	      if (pressedKey.indexOf(",") >= 0) {
	        pressedKey = pressedKey.substring(0, pressedKey.indexOf(","));
	      }
	    }
	    return pressedKey;
	  }
	  onVirtualKeyboardKeydown(event) {
	    const node = View.getEventTarget(event), cpcKey = node.getAttribute("data-key");
	    if (UiUtils.debug > 1) {
	      UiUtils.console.debug("onVirtualKeyboardKeydown: event type:", event.type, "title:", node.title, "cpcKey:", cpcKey);
	    }
	    if (cpcKey !== null) {
	      let cpcKeyCode = Number(cpcKey);
	      if (this.numLock) {
	        cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
	      }
	      const pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode), ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || event.shiftKey, this.numLock);
	      this.options.fnPressCpcKey(event, cpcKeyCode, pressedKey, ascii.key);
	    }
	    if (this.eventNames.out) {
	      this.options.view.addEventListener(this.eventNames.out, this.fnVirtualKeyboardKeyupOrKeyoutHandler, node);
	    }
	    event.preventDefault();
	    return false;
	  }
	  fnVirtualKeyboardKeyupOrKeyout(event) {
	    const node = View.getEventTarget(event), cpcKey = node.getAttribute("data-key");
	    if (cpcKey !== null) {
	      let cpcKeyCode = Number(cpcKey);
	      if (this.numLock) {
	        cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
	      }
	      const pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode), ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || event.shiftKey, this.numLock);
	      this.options.fnReleaseCpcKey(event, cpcKeyCode, pressedKey, ascii.key);
	      if (cpcKeyCode === 70) {
	        this.shiftLock = !this.shiftLock;
	        this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
	      } else if (cpcKeyCode === 90) {
	        this.numLock = !this.numLock;
	        this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
	      }
	    }
	  }
	  onVirtualKeyboardKeyupOrKeyout(event) {
	    const node = View.getEventTarget(event);
	    if (UiUtils.debug > 1) {
	      UiUtils.console.debug("onVirtualKeyboardKeyupOrKeyout: event type:", event.type, "title:", node.title, "cpcKey:", node.getAttribute("data-key"));
	    }
	    this.fnVirtualKeyboardKeyupOrKeyout(event);
	    if (this.eventNames.out) {
	      this.options.view.removeEventListener(this.eventNames.out, this.fnVirtualKeyboardKeyupOrKeyoutHandler, node);
	    }
	    event.preventDefault();
	    return false;
	  }
	  static keyIdentifier2Char(event) {
	    const identifier = event.keyIdentifier ?? "", shiftKey = event.shiftKey;
	    let char;
	    if (/^U\+/i.test(identifier || "")) {
	      char = String.fromCharCode(parseInt(identifier.slice(2), 16));
	      if (char === "\0") {
	        char = "";
	      }
	      char = shiftKey ? char.toUpperCase() : char.toLowerCase();
	    } else {
	      char = identifier;
	    }
	    return char;
	  }
	  onKeydownOrKeyup(event) {
	    const key = event.key || _VirtualKeyboard.keyIdentifier2Char(event) || "", activeElement = window.document.activeElement;
	    if (key === "Enter" || key === " ") {
	      const simPointerEvent = {
	        type: event.type,
	        target: activeElement,
	        // active selected element
	        preventDefault: function() {
	        }
	      };
	      if (event.type === "keydown") {
	        this.onVirtualKeyboardKeydown(simPointerEvent);
	      } else if (event.type === "keyup") {
	        this.onVirtualKeyboardKeyupOrKeyout(simPointerEvent);
	      } else {
	        UiUtils.console.error("onKeydownOrKeyup: Unknown type:", event.type);
	      }
	      event.preventDefault();
	      return false;
	    }
	    return void 0;
	  }
	};
	_VirtualKeyboard.cpcKey2Key = [
	  {
	    keys: "38ArrowUp",
	    // 0: cursor up
	    key: "ArrowUp",
	    text: "\u2191",
	    title: "Cursor up"
	  },
	  {
	    keys: "39ArrowRight",
	    // 1: cursor right
	    key: "ArrowRight",
	    text: "\u2192",
	    title: "Cursor right",
	    style: 1
	  },
	  {
	    keys: "40ArrowDown",
	    // 2: cursor down
	    key: "ArrowDown",
	    text: "\u2193",
	    title: "Cursor down"
	  },
	  {
	    keys: "105Numpad9,120F9",
	    // 3: numpad f9
	    key: "9",
	    text: "f9",
	    style: 1,
	    numLockCpcKey: 81
	    // joy 0 up+right
	  },
	  {
	    keys: "102Numpad6,117F6",
	    // 4: numpad f6
	    key: "6",
	    text: "f6",
	    style: 1,
	    numLockCpcKey: 75
	    // joy 0 right
	  },
	  {
	    keys: "99Numpad3,114F3",
	    // 5: numpad f3
	    key: "3",
	    text: "f3",
	    style: 1,
	    numLockCpcKey: 83
	    // joy 0 down+right
	  },
	  {
	    keys: "13NumpadEnter",
	    // 6: numpad enter
	    key: "Enter",
	    style: 4
	  },
	  {
	    keys: "110NumpadDecimal",
	    // 7: numpad .
	    key: ".",
	    numLockCpcKey: 77
	    // joy 0 fire 1
	  },
	  {
	    keys: "37ArrowLeft",
	    // 8: cursor left
	    key: "ArrowLeft",
	    text: "\u2190",
	    title: "Cursor left",
	    style: 1
	  },
	  {
	    keys: "18AltLeft",
	    // 9: copy
	    key: "Alt",
	    text: "Copy",
	    style: 2
	  },
	  {
	    keys: "103Numpad7,118F7",
	    // 10: numpad f7
	    key: "7",
	    text: "f7",
	    style: 1,
	    numLockCpcKey: 80
	    // joy 0 up+left
	  },
	  {
	    keys: "104Numpad8,119F8",
	    // 11: numpad f8
	    key: "8",
	    text: "f8",
	    style: 1,
	    numLockCpcKey: 72
	    // joy 0 up
	  },
	  {
	    keys: "101Numpad5,116F5",
	    // 12: numpad f5
	    key: "5",
	    text: "f5",
	    style: 1,
	    numLockCpcKey: 76
	    // joy 0 fire 2
	  },
	  {
	    keys: "97Numpad1,112F1",
	    // 13: numpad f1
	    key: "1",
	    text: "f1",
	    style: 1,
	    numLockCpcKey: 82
	    // joy 0 down+left
	  },
	  {
	    keys: "98Numpad2,113F2",
	    // 14: numpad f2
	    key: "2",
	    text: "f2",
	    style: 1,
	    numLockCpcKey: 73
	    // joy 0 down
	  },
	  {
	    keys: "96Numpad0,121F10",
	    // 15: numpad f0
	    key: "0",
	    text: "f0",
	    style: 1
	    // numLockCpcKey: 90 // Num lock
	  },
	  {
	    keys: "46Delete",
	    // 16: clr
	    key: "Delete",
	    text: "Clr",
	    title: "Clear",
	    style: 1
	  },
	  {
	    keys: "187BracketRight,171BracketRight,221BracketRight",
	    // 17: [ { (Chrome: 187; FF: 171); EN: 221BracketRight
	    key: "[",
	    keyShift: "{"
	  },
	  {
	    keys: "13Enter",
	    // 18: return
	    key: "Enter",
	    text: "Ret",
	    title: "Return",
	    style: 2
	  },
	  {
	    keys: "191Backslash,163Backslash,220Backslash",
	    // 19: ] } => # ' (Chrome: 191; FF: 163); EN: 220Backslash
	    key: "]",
	    keyShift: "}"
	  },
	  {
	    keys: "100Numpad4,115F4",
	    // 20: numpad f4
	    key: "4",
	    text: "f4",
	    style: 1,
	    numLockCpcKey: 74
	    // joy 0 left
	  },
	  {
	    keys: "16ShiftLeft,16ShiftRight",
	    // 21: shift left, shift right (2 keys!)
	    key: "Shift",
	    style: 4
	  },
	  {
	    keys: "220Backquote,160Backquote,192Backquote",
	    // 22: \ ` (different location, key!; Chrome: 220; FF: 160); EN: 192Backquote, 226IntlBackslash?
	    key: "\\",
	    keyShift: "`"
	  },
	  {
	    keys: "17ControlLeft,17ControlRight",
	    // 23: Note: alt-gr also triggers ctrl-left and alt-gr!
	    key: "Control",
	    text: "Ctrl",
	    title: "Control",
	    style: 4
	  },
	  {
	    keys: "221Equal,192Equal,187Equal",
	    // 24: ^ £ (pound: \u00A3) (Chrome: 221; FF: 192); EN: 187Equal
	    key: "^",
	    keyShift: "\xA3"
	  },
	  {
	    keys: "219Minus,63Minus,189Minus",
	    // 25: - = (Chrome: 219; FF: 63); EN: 189Minus
	    key: "-",
	    keyShift: "="
	  },
	  {
	    keys: "186BracketLeft,59BracketLeft,219BracketLeft",
	    // 26: @ | (Chrome: 168; FF: 59); EN: 219BracketLeft
	    key: "@",
	    keyShift: "|",
	    style: 1
	  },
	  {
	    keys: "80KeyP",
	    // 27: P
	    key: "p",
	    keyShift: "P"
	  },
	  {
	    keys: "222Quote,192Quote",
	    // 28: ; + (same on Chrome, FF); Android Bluetooth EN: 192Quote
	    key: ";",
	    keyShift: "+"
	  },
	  {
	    keys: "192Semicolon,186Semicolon",
	    // 29: : * (same on Chrome, FF); EN: 186Semicolon
	    key: ":",
	    keyShift: "*"
	  },
	  {
	    keys: "189Slash,173Slash,191Slash",
	    // 30: / ? (Chrome: 189; FF: 173); EN: 191Slash
	    key: "/",
	    keyShift: "?"
	  },
	  {
	    keys: "190Period",
	    // 31: . <
	    key: ".",
	    keyShift: "<"
	  },
	  {
	    keys: "48Digit0",
	    // 32: 0 _
	    key: "0",
	    keyShift: "_"
	  },
	  {
	    keys: "57Digit9",
	    // 33: 9 )
	    key: "9",
	    keyShift: ")"
	  },
	  {
	    keys: "79KeyO",
	    // 34:
	    key: "o",
	    keyShift: "O"
	  },
	  {
	    keys: "73KeyI",
	    // 35:
	    key: "i",
	    keyShift: "I"
	  },
	  {
	    keys: "76KeyL",
	    // 36:
	    key: "l",
	    keyShift: "L"
	  },
	  {
	    keys: "75KeyK",
	    // 37:
	    key: "k",
	    keyShift: "K"
	  },
	  {
	    keys: "77KeyM",
	    // 38:
	    key: "m",
	    keyShift: "M"
	  },
	  {
	    keys: "188Comma",
	    // 39: , >
	    key: ",",
	    keyShift: ">"
	  },
	  {
	    keys: "56Digit8",
	    // 40: 8 (
	    key: "8",
	    keyShift: "("
	  },
	  {
	    keys: "55Digit7",
	    // 41: 7 '
	    key: "7",
	    keyShift: "'"
	  },
	  {
	    keys: "85KeyU",
	    // 42:
	    key: "u",
	    keyShift: "U"
	  },
	  {
	    keys: "90KeyY,89KeyY",
	    // 43:
	    key: "y",
	    keyShift: "Y"
	  },
	  {
	    keys: "72KeyH",
	    // 44:
	    key: "h",
	    keyShift: "H"
	  },
	  {
	    keys: "74KeyJ",
	    // 45:
	    key: "j",
	    keyShift: "J"
	  },
	  {
	    keys: "78KeyN",
	    // 46:
	    key: "n",
	    keyShift: "N"
	  },
	  {
	    keys: "32Space",
	    // 47: space
	    key: " ",
	    text: "Space",
	    style: 5
	  },
	  {
	    keys: "54Digit6",
	    // 48: 6 &
	    key: "6",
	    keyShift: "("
	  },
	  {
	    keys: "53Digit5",
	    // 49: 5 %
	    key: "5",
	    keyShift: "%"
	  },
	  {
	    keys: "82KeyR",
	    // 50:
	    key: "r",
	    keyShift: "R"
	  },
	  {
	    keys: "84KeyT",
	    // 51:
	    key: "t",
	    keyShift: "T"
	  },
	  {
	    keys: "71KeyG",
	    // 52:
	    key: "g",
	    keyShift: "G"
	  },
	  {
	    keys: "70KeyF",
	    // 53:
	    key: "f",
	    keyShift: "F"
	  },
	  {
	    keys: "66KeyB",
	    // 54:
	    key: "b",
	    keyShift: "B"
	  },
	  {
	    keys: "86KeyV",
	    // 55:
	    key: "v",
	    keyShift: "V"
	  },
	  {
	    keys: "52Digit4",
	    // 56: 4 $
	    key: "4",
	    keyShift: "$"
	  },
	  {
	    keys: "51Digit3",
	    // 57: 3 #
	    key: "3",
	    keyShift: "#"
	  },
	  {
	    keys: "69KeyE",
	    // 58:
	    key: "e",
	    keyShift: "E"
	  },
	  {
	    keys: "87KeyW",
	    // 59:
	    key: "w",
	    keyShift: "W"
	  },
	  {
	    keys: "83KeyS",
	    // 60:
	    key: "s",
	    keyShift: "S"
	  },
	  {
	    keys: "68KeyD",
	    // 61:
	    key: "d",
	    keyShift: "D"
	  },
	  {
	    keys: "67KeyC",
	    // 62:
	    key: "c",
	    keyShift: "C"
	  },
	  {
	    keys: "88KeyX",
	    // 63:
	    key: "x",
	    keyShift: "X"
	  },
	  {
	    keys: "49Digit1",
	    // 64: 1 !
	    key: "1",
	    keyShift: "!"
	  },
	  {
	    keys: "50Digit2",
	    // 65: 2 "
	    key: "2",
	    keyShift: '"'
	  },
	  {
	    keys: "27Escape",
	    // 66: esc
	    key: "Escape",
	    text: "Esc",
	    title: "Escape",
	    style: 1
	  },
	  {
	    keys: "81KeyQ",
	    // 67:
	    key: "q",
	    keyShift: "Q"
	  },
	  {
	    keys: "9Tab",
	    // 68:
	    key: "Tab",
	    style: 2
	  },
	  {
	    keys: "65KeyA",
	    // 69:
	    key: "a",
	    keyShift: "A"
	  },
	  {
	    keys: "20CapsLock",
	    // 70: caps lock
	    key: "CapsLock",
	    text: "Caps",
	    title: "Caps Lock",
	    style: 3
	  },
	  {
	    keys: "89KeyZ,90KeyZ",
	    // 71: DE,EN
	    key: "z",
	    keyShift: "Z"
	  },
	  {
	    keys: "38Numpad8",
	    // 72: joy 0 up (arrow up)
	    key: "JoyUp",
	    text: "\u21D1",
	    title: "Joy up"
	  },
	  {
	    keys: "40Numpad2",
	    // 73: joy 0 down
	    key: "JoyDown",
	    text: "\u21D3",
	    title: "Joy down"
	  },
	  {
	    keys: "37Numpad4",
	    // 74: joy 0 left
	    key: "JoyLeft",
	    text: "\u21D0",
	    title: "Joy left"
	  },
	  {
	    keys: "39Numpad6",
	    // 75: joy 0 right
	    key: "JoyRight",
	    text: "\u21D2",
	    title: "Joy right"
	  },
	  {
	    keys: "12Numpad5,45Numpad0",
	    // 76: joy 0 fire 2 (clear,...)
	    key: "X",
	    text: "\u29BF",
	    title: "Joy fire"
	  },
	  {
	    keys: "46NumpadDecimal",
	    // 77: joy 0 fire 1
	    key: "Z",
	    text: "\u25E6",
	    title: "Joy fire 1"
	  },
	  {
	    keys: "",
	    // 78: ""? not null? (joy 0 fire 3?)
	    key: ""
	  },
	  {
	    keys: "8Backspace",
	    // 79: del
	    key: "Backspace",
	    // 79: del
	    text: "Del",
	    title: "Delete",
	    style: 1
	  },
	  // starting with 80, not on CPC
	  // not on CPC:
	  {
	    keys: "36Numpad7",
	    // 80: joy 0 up+left
	    key: "",
	    text: "\u21D6",
	    title: "Joy up+left"
	  },
	  {
	    keys: "33Numpad9",
	    // 81: joy 0 up+right
	    key: "",
	    text: "\u21D7",
	    title: "Joy up+right"
	  },
	  {
	    keys: "35Numpad1",
	    // 82: joy 0 down+left
	    key: "",
	    text: "\u21D9",
	    title: "Joy down+leftt"
	  },
	  {
	    keys: "34Numpad3",
	    // 83: joy 0 down+right
	    key: "",
	    text: "\u21D8",
	    title: "Joy down+right"
	  },
	  {
	    keys: "",
	    // 84: (not null?)
	    key: ""
	  },
	  {
	    keys: "226IntlBackslash,60IntlBackslash,220IntlBackslash",
	    // 85: < > | // key not on CPC! (Chrome: 226, FF: 60);  Android Bluetooth EN: 220IntlBackslash
	    key: ""
	  },
	  {
	    keys: "111NumpadDivide",
	    // 86:
	    key: ""
	  },
	  {
	    keys: "106NumpadMultiply",
	    // 87:
	    key: ""
	  },
	  {
	    keys: "109NumpadSubtract",
	    // 88:
	    key: ""
	  },
	  {
	    keys: "107NumpadAdd",
	    // 89:
	    key: ""
	  },
	  {
	    keys: "",
	    key: "",
	    // 90: special num lock key to switch between joystick and numpad
	    text: "Num",
	    title: "Num / Joy",
	    style: 1
	  }
	  // only on PC:
	  // "226IntlBackslash", "122F11", "123F12", "44PrintScreen", "145ScrollLock", "19Pause", "45Insert", "36Home", "33PageUp", "35End", "34PageDown", "111NumpadDivide", "106NumpadMultiply", "109NumpadSubtract", "107NumpadAdd"
	];
	/* eslint-disable array-element-newline */
	_VirtualKeyboard.virtualKeyboardAlpha = [
	  [66, 64, 65, 57, 56, 49, 48, 41, 40, 33, 32, 25, 24, 16, 79],
	  [68, 67, 59, 58, 50, 51, 43, 42, 35, 34, 27, 26, 17, 18],
	  [70, 69, 60, 61, 53, 52, 44, 45, 37, 36, 29, 28, 19, 90],
	  // 90=virtual numpad button
	  [
	    21,
	    71,
	    63,
	    62,
	    55,
	    54,
	    46,
	    38,
	    39,
	    31,
	    30,
	    22,
	    {
	      key: 21,
	      // right shift has same code and style
	      style: 2
	    }
	  ],
	  [23, 9, 47, 6]
	];
	_VirtualKeyboard.virtualKeyboardNum = [
	  // numpad
	  [10, 11, 3],
	  [20, 12, 4],
	  [13, 14, 5],
	  [15, 0, 7],
	  [8, 2, 1]
	];
	let VirtualKeyboard = _VirtualKeyboard;

	class Sound {
	  constructor(options) {
	    this.isSoundOn = false;
	    this.isActivatedByUserFlag = false;
	    this.contextNotAvailable = false;
	    this.contextStartTime = 0;
	    this.gainNodes = [];
	    this.oscillators = [];
	    // 3 oscillators left, middle, right
	    this.queues = [];
	    // node queues and info for the three channels
	    this.fScheduleAheadTime = 0.1;
	    // 100 ms
	    this.volEnv = [];
	    this.toneEnv = [];
	    this.options = {};
	    this.setOptions(options);
	    for (let i = 0; i < 3; i += 1) {
	      this.queues[i] = {
	        soundData: [],
	        fNextNoteTime: 0,
	        onHold: false,
	        rendevousMask: 0
	      };
	    }
	    if (UiUtils.debug > 1) {
	      this.debugLogList = [];
	    }
	  }
	  /*
	  private getOptions(): SoundOptions {
	  	return this.options;
	  }
	  */
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  reset() {
	    const oscillators = this.oscillators, volEnvData = {
	      steps: 1,
	      diff: 0,
	      time: 200
	    };
	    this.resetQueue();
	    for (let i = 0; i < 3; i += 1) {
	      if (oscillators[i]) {
	        this.stopOscillator(i);
	      }
	    }
	    this.volEnv.length = 0;
	    this.setVolEnv(0, [volEnvData]);
	    this.toneEnv.length = 0;
	    if (this.debugLogList) {
	      this.debugLogList.length = 0;
	    }
	  }
	  stopOscillator(n) {
	    const oscillators = this.oscillators, oscillatorNode = oscillators[n];
	    if (oscillatorNode) {
	      oscillatorNode.frequency.value = 0;
	      oscillatorNode.stop();
	      oscillatorNode.disconnect();
	      oscillators[n] = void 0;
	    }
	  }
	  debugLog(msg) {
	    if (this.debugLogList) {
	      this.debugLogList.push([
	        this.context ? this.context.currentTime : 0,
	        msg
	      ]);
	    }
	  }
	  resetQueue() {
	    const queues = this.queues;
	    for (let i = 0; i < queues.length; i += 1) {
	      const queue = queues[i];
	      queue.soundData.length = 0;
	      queue.fNextNoteTime = 0;
	      queue.onHold = false;
	      queue.rendevousMask = 0;
	    }
	  }
	  createSoundContext() {
	    const channelMap2Cpc = [
	      // channel map for CPC: left, middle (center), right; so swap middle and right
	      0,
	      2,
	      1
	    ], AudioContextConstructor = this.options.AudioContextConstructor;
	    let context;
	    if (!AudioContextConstructor) {
	      if (!this.contextNotAvailable) {
	        UiUtils.console.warn("createSoundContext: AudioContext not available");
	      }
	      this.contextNotAvailable = true;
	      return context;
	    }
	    try {
	      context = new AudioContextConstructor();
	      const mergerNode = context.createChannelMerger(6);
	      this.mergerNode = mergerNode;
	      for (let i = 0; i < 3; i += 1) {
	        const gainNode = context.createGain();
	        gainNode.connect(mergerNode, 0, channelMap2Cpc[i]);
	        this.gainNodes[i] = gainNode;
	      }
	    } catch (e) {
	      UiUtils.console.warn("createSoundContext:", e);
	      this.contextNotAvailable = true;
	    }
	    const oldContextStartTime = this.contextStartTime;
	    this.contextStartTime = Date.now() / 1e3;
	    if (oldContextStartTime && context) {
	      const correctionTime = context.currentTime + (this.contextStartTime - oldContextStartTime), queues = this.queues;
	      for (let i = 0; i < 3; i += 1) {
	        if (queues[i].soundData.length) {
	          queues[i].fNextNoteTime -= correctionTime;
	        }
	      }
	    }
	    return context;
	  }
	  playNoise(oscillator, fTime, fDuration, noise) {
	    const context = this.context, bufferSize = context.sampleRate * fDuration, buffer = context.createBuffer(1, bufferSize, context.sampleRate), data = buffer.getChannelData(0), noiseNode = context.createBufferSource();
	    for (let i = 0; i < bufferSize; i += 1) {
	      data[i] = Math.random() * 2 - 1;
	    }
	    noiseNode.buffer = buffer;
	    if (noise > 1) {
	      const bandHz = 2e4 / noise, bandpass = context.createBiquadFilter();
	      bandpass.type = "bandpass";
	      bandpass.frequency.value = bandHz;
	      noiseNode.connect(bandpass).connect(this.gainNodes[oscillator]);
	    } else {
	      noiseNode.connect(this.gainNodes[oscillator]);
	    }
	    noiseNode.start(fTime);
	    noiseNode.stop(fTime + fDuration);
	  }
	  simulateApplyVolEnv(volData, duration, volEnvRepeat) {
	    let time = 0;
	    for (let loop = 0; loop < volEnvRepeat; loop += 1) {
	      for (let part = 0; part < volData.length; part += 1) {
	        const group = volData[part];
	        if (group.steps !== void 0) {
	          const group1 = group, volTime = group1.time;
	          let volSteps = group1.steps;
	          if (!volSteps) {
	            volSteps = 1;
	          }
	          for (let i = 0; i < volSteps; i += 1) {
	            time += volTime;
	            if (duration && time >= duration) {
	              loop = volEnvRepeat;
	              part = volData.length;
	              break;
	            }
	          }
	        } else {
	          const group2 = group, register = group2.register, period = group2.period, volTime = period;
	          if (register === 0) {
	            time += volTime;
	          }
	        }
	      }
	    }
	    if (duration === 0) {
	      duration = time;
	    }
	    return duration;
	  }
	  applyVolEnv(volData, gain, fTime, volume, duration, volEnvRepeat) {
	    const maxVolume = 15, i100ms2sec = 100;
	    let time = 0;
	    for (let loop = 0; loop < volEnvRepeat; loop += 1) {
	      for (let part = 0; part < volData.length; part += 1) {
	        const group = volData[part];
	        if (group.steps !== void 0) {
	          const group1 = group, volDiff = group1.diff, volTime = group1.time;
	          let volSteps = group1.steps;
	          if (!volSteps) {
	            volSteps = 1;
	            volume = 0;
	          }
	          for (let i = 0; i < volSteps; i += 1) {
	            volume = (volume + volDiff) % (maxVolume + 1);
	            const fVolume = volume / maxVolume;
	            gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
	            time += volTime;
	            if (duration && time >= duration) {
	              loop = volEnvRepeat;
	              part = volData.length;
	              break;
	            }
	          }
	        } else {
	          const group2 = group, register = group2.register, period = group2.period, volTime = period;
	          if (register === 0) {
	            volume = 15;
	            let fVolume = volume / maxVolume;
	            gain.setValueAtTime(fVolume * fVolume, fTime + time / i100ms2sec);
	            time += volTime;
	            fVolume = 0;
	            gain.linearRampToValueAtTime(fVolume, fTime + time / i100ms2sec);
	          }
	        }
	      }
	    }
	    if (duration === 0) {
	      duration = time;
	    }
	    return duration;
	  }
	  applyToneEnv(toneData, frequency, fTime, period, duration) {
	    const i100ms2sec = 100, repeat = toneData[0], toneEnvRepeat = repeat ? 5 : 1;
	    let time = 0;
	    for (let loop = 0; loop < toneEnvRepeat; loop += 1) {
	      for (let part = 0; part < toneData.length; part += 1) {
	        const group = toneData[part];
	        if (group.steps !== void 0) {
	          const group1 = group, toneSteps = group1.steps || 1, toneDiff = group1.diff, toneTime = group1.time;
	          for (let i = 0; i < toneSteps; i += 1) {
	            const fFrequency = period >= 3 ? 62500 / period : 0;
	            frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
	            period += toneDiff;
	            time += toneTime;
	            if (duration && time >= duration) {
	              loop = toneEnvRepeat;
	              part = toneData.length;
	              break;
	            }
	          }
	        } else {
	          const group2 = group, toneTime = group2.time;
	          period = group2.period;
	          const fFrequency = period >= 3 ? 62500 / period : 0;
	          frequency.setValueAtTime(fFrequency, fTime + time / i100ms2sec);
	          time += toneTime;
	        }
	      }
	    }
	  }
	  // simulate schedule note when sound is off
	  simulateScheduleNote(soundData) {
	    let duration = soundData.duration, volEnv = soundData.volEnv, volEnvRepeat = 1;
	    if (duration < 0) {
	      volEnvRepeat = Math.min(5, -duration);
	      duration = 0;
	    }
	    if (volEnv || !duration) {
	      if (!this.volEnv[volEnv]) {
	        volEnv = 0;
	      }
	      duration = this.simulateApplyVolEnv(this.volEnv[volEnv], duration, volEnvRepeat);
	    }
	    const i100ms2sec = 100, fDuration = duration / i100ms2sec;
	    return fDuration;
	  }
	  scheduleNote(oscillator, fTime, soundData) {
	    if (UiUtils.debug > 1) {
	      this.debugLog("scheduleNote: " + oscillator + " " + fTime);
	    }
	    if (!this.isSoundOn) {
	      return this.simulateScheduleNote(soundData);
	    }
	    const context = this.context, oscillatorNode = context.createOscillator();
	    oscillatorNode.type = "square";
	    oscillatorNode.frequency.value = soundData.period >= 3 ? 62500 / soundData.period : 0;
	    oscillatorNode.connect(this.gainNodes[oscillator]);
	    if (fTime < context.currentTime) {
	      if (UiUtils.debug) {
	        UiUtils.console.debug("Test: sound: scheduleNote:", fTime, "<", context.currentTime);
	      }
	    }
	    const volume = soundData.volume, gain = this.gainNodes[oscillator].gain, maxVolume = 15, fVolume = volume / maxVolume;
	    gain.setValueAtTime(fVolume * fVolume, fTime);
	    let duration = soundData.duration, volEnv = soundData.volEnv, volEnvRepeat = 1;
	    if (duration < 0) {
	      volEnvRepeat = Math.min(5, -duration);
	      duration = 0;
	    }
	    if (volEnv || !duration) {
	      if (!this.volEnv[volEnv]) {
	        volEnv = 0;
	      }
	      duration = this.applyVolEnv(this.volEnv[volEnv], gain, fTime, volume, duration, volEnvRepeat);
	    }
	    const toneEnv = soundData.toneEnv;
	    if (toneEnv && this.toneEnv[toneEnv]) {
	      this.applyToneEnv(this.toneEnv[toneEnv], oscillatorNode.frequency, fTime, soundData.period, duration);
	    }
	    const i100ms2sec = 100, fDuration = duration / i100ms2sec;
	    oscillatorNode.start(fTime);
	    oscillatorNode.stop(fTime + fDuration);
	    this.oscillators[oscillator] = oscillatorNode;
	    if (soundData.noise) {
	      this.playNoise(oscillator, fTime, fDuration, soundData.noise);
	    }
	    return fDuration;
	  }
	  testCanQueue(state) {
	    let canQueue = true;
	    if (this.isSoundOn && !this.isActivatedByUserFlag) {
	      canQueue = false;
	    } else if (!(state & 128)) {
	      const queues = this.queues;
	      if (state & 1 && queues[0].soundData.length >= 4 || state & 2 && queues[1].soundData.length >= 4 || state & 4 && queues[2].soundData.length >= 4) {
	        canQueue = false;
	      }
	    }
	    return canQueue;
	  }
	  sound(soundData) {
	    const queues = this.queues, state = soundData.state;
	    for (let i = 0; i < 3; i += 1) {
	      if (state >> i & 1) {
	        const queue = queues[i];
	        if (state & 128) {
	          queue.soundData.length = 0;
	          queue.fNextNoteTime = 0;
	          this.stopOscillator(i);
	        }
	        queue.soundData.push(soundData);
	        if (UiUtils.debug > 1) {
	          this.debugLog("sound: " + i + " " + state + ":" + queue.soundData.length);
	        }
	        this.updateQueueStatus(i, queue);
	      }
	    }
	    this.scheduler();
	  }
	  setVolEnv(volEnv, volEnvData) {
	    this.volEnv[volEnv] = volEnvData;
	  }
	  setToneEnv(toneEnv, toneEnvData) {
	    this.toneEnv[toneEnv] = toneEnvData;
	  }
	  updateQueueStatus(i, queue) {
	    const soundData = queue.soundData;
	    if (soundData.length) {
	      queue.onHold = Boolean(soundData[0].state & 64);
	      queue.rendevousMask = soundData[0].state & 7;
	      queue.rendevousMask &= ~(1 << i);
	      queue.rendevousMask |= soundData[0].state >> 3 & 7;
	    } else {
	      queue.onHold = false;
	      queue.rendevousMask = 0;
	    }
	  }
	  // idea from: https://www.html5rocks.com/en/tutorials/audio/scheduling/
	  scheduler() {
	    if (!this.isActivatedByUserFlag) {
	      return;
	    }
	    const context = this.context, fCurrentTime = context ? context.currentTime : Date.now() / 1e3 - this.contextStartTime, queues = this.queues;
	    let canPlayMask = 0;
	    for (let i = 0; i < 3; i += 1) {
	      const queue = queues[i];
	      while (queue.soundData.length && !queue.onHold && queue.fNextNoteTime < fCurrentTime + this.fScheduleAheadTime) {
	        if (!queue.rendevousMask) {
	          if (queue.fNextNoteTime < fCurrentTime) {
	            queue.fNextNoteTime = fCurrentTime;
	          }
	          const soundData = queue.soundData.shift();
	          queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
	          this.updateQueueStatus(i, queue);
	        } else {
	          canPlayMask |= 1 << i;
	          break;
	        }
	      }
	    }
	    if (!canPlayMask) {
	      return;
	    }
	    for (let i = 0; i < 3; i += 1) {
	      const queue = queues[i];
	      if (canPlayMask >> i & 1 && (queue.rendevousMask & canPlayMask) === queue.rendevousMask) {
	        if (queue.fNextNoteTime < fCurrentTime) {
	          queue.fNextNoteTime = fCurrentTime;
	        }
	        const soundData = queue.soundData.shift();
	        queue.fNextNoteTime += this.scheduleNote(i, queue.fNextNoteTime, soundData);
	        this.updateQueueStatus(i, queue);
	      }
	    }
	  }
	  release(releaseMask) {
	    const queues = this.queues;
	    if (!queues.length) {
	      return;
	    }
	    if (UiUtils.debug > 1) {
	      this.debugLog("release: " + releaseMask);
	    }
	    for (let i = 0; i < 3; i += 1) {
	      const queue = queues[i], soundData = queue.soundData;
	      if (releaseMask >> i & 1 && soundData.length && queue.onHold) {
	        queue.onHold = false;
	      }
	    }
	    this.scheduler();
	  }
	  sq(n) {
	    const queues = this.queues, queue = queues[n], soundData = queue.soundData, context = this.context;
	    let sq = 4 - soundData.length;
	    if (sq < 0) {
	      sq = 0;
	    }
	    sq |= queue.rendevousMask << 3;
	    if (this.oscillators[n] && queues[n].fNextNoteTime > context.currentTime) {
	      sq |= 128;
	    } else if (soundData.length && soundData[0].state & 64) {
	      sq |= 64;
	    }
	    return sq;
	  }
	  setActivatedByUser() {
	    this.isActivatedByUserFlag = true;
	    if (!this.contextStartTime) {
	      this.contextStartTime = Date.now() / 1e3;
	    }
	  }
	  isActivatedByUser() {
	    return this.isActivatedByUserFlag;
	  }
	  soundOn() {
	    if (!this.isSoundOn) {
	      if (!this.context && !this.contextNotAvailable) {
	        this.context = this.createSoundContext();
	      }
	      if (this.context) {
	        this.mergerNode.connect(this.context.destination);
	      }
	      this.isSoundOn = true;
	      if (UiUtils.debug) {
	        UiUtils.console.debug("soundOn: Sound switched on");
	      }
	    }
	    return Boolean(this.context);
	  }
	  soundOff() {
	    if (this.isSoundOn) {
	      if (this.context) {
	        this.mergerNode.disconnect(this.context.destination);
	      }
	      this.isSoundOn = false;
	      if (UiUtils.debug) {
	        UiUtils.console.debug("soundOff: Sound switched off");
	      }
	    }
	  }
	}

	class InputStack {
	  constructor() {
	    this.input = [];
	    this.stackPosition = -1;
	  }
	  reset() {
	    this.input.length = 0;
	    this.stackPosition = -1;
	  }
	  getInput() {
	    return this.input[this.stackPosition];
	  }
	  clearRedo() {
	    this.input = this.input.slice(0, this.stackPosition + 1);
	  }
	  save(input) {
	    this.clearRedo();
	    this.input.push(input);
	    this.stackPosition += 1;
	  }
	  canUndoKeepOne() {
	    return this.stackPosition > 0;
	  }
	  undo() {
	    this.stackPosition -= 1;
	    return this.getInput();
	  }
	  canRedo() {
	    return this.stackPosition < this.input.length - 1;
	  }
	  redo() {
	    this.stackPosition += 1;
	    return this.getInput();
	  }
	}

	class DragElement {
	  constructor(options) {
	    this.containerId = ViewID.window;
	    this.initialX = 0;
	    this.initialY = 0;
	    this.currentX = 0;
	    this.currentY = 0;
	    this.fnDragStartHandler = this.dragStart.bind(this);
	    this.fnDragMoveHandler = this.dragMove.bind(this);
	    this.fnDragEndHandler = this.dragEnd.bind(this);
	    this.options = {};
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	    const entries = this.options.entries;
	    for (const key in entries) {
	      if (Object.prototype.hasOwnProperty.call(entries, key)) {
	        const item = entries[key];
	        if (item.enabled) {
	          this.options.view.fnAttachPointerEvents(item.itemId, this.fnDragStartHandler);
	        } else {
	          this.options.view.fnDetachPointerEvents(item.itemId, this.fnDragStartHandler);
	        }
	      }
	    }
	  }
	  dragStart(event) {
	    const node = View.getEventTarget(event), entries = this.options.entries;
	    let entry = entries[node.id];
	    if (!entry) {
	      const parentElement = node.parentElement;
	      if (parentElement && entries[parentElement.id]) {
	        entry = entries[parentElement.id];
	        this.dragItem = parentElement;
	      } else {
	        return;
	      }
	    } else {
	      this.dragItem = node;
	    }
	    this.dragInfo = entry;
	    const dragInfo = this.dragInfo, clientObject = event.type === "touchstart" ? event.touches[0] : event;
	    this.initialX = clientObject.clientX - dragInfo.xOffset;
	    this.initialY = clientObject.clientY - dragInfo.yOffset;
	    this.options.view.fnAttachPointerEvents(this.containerId, void 0, this.fnDragMoveHandler, this.fnDragEndHandler);
	    if (UiUtils.debug > 0) {
	      UiUtils.console.debug("dragStart: " + dragInfo.itemId + ": x=" + this.initialX + ", y=" + this.initialY);
	    }
	  }
	  static setDragTranslate(xPos, yPos, el) {
	    el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
	  }
	  dragMove(event) {
	    const dragInfo = this.dragInfo;
	    if (dragInfo) {
	      event.preventDefault();
	      const clientObject = event.type === "touchstart" ? event.touches[0] : event;
	      this.currentX = clientObject.clientX - this.initialX;
	      this.currentY = clientObject.clientY - this.initialY;
	      dragInfo.xOffset = this.currentX;
	      dragInfo.yOffset = this.currentY;
	      DragElement.setDragTranslate(this.currentX, this.currentY, this.dragItem);
	    }
	  }
	  dragEnd(_event) {
	    const dragInfo = this.dragInfo;
	    if (dragInfo) {
	      this.options.view.fnDetachPointerEvents(this.containerId, void 0, this.fnDragMoveHandler, this.fnDragEndHandler);
	      if (UiUtils.debug > 0) {
	        UiUtils.console.debug("dragEnd: " + dragInfo.itemId + ": x=" + this.currentX + ", y=" + this.currentY);
	      }
	    }
	  }
	}

	class CommonEventHandler {
	  constructor(options) {
	    this.eventDefInternalMap = {};
	    this.fnUserAction = void 0;
	    this.options = {};
	    this.setOptions(options);
	    this.model = this.options.model;
	    this.view = this.options.view;
	    this.controller = this.options.controller;
	    this.model.setPropertyChangeCallback(() => {
	      this.updateUrlFromConfig();
	    });
	    this.createEventDefMap();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  fnSetUserAction(fnAction) {
	    this.fnUserAction = fnAction;
	  }
	  initOneToggle(_type, id, eventDef) {
	    if (eventDef.property) {
	      if (eventDef.toggleId) {
	        const isEnabled = this.model.getProperty(eventDef.property);
	        this.view.setHidden(eventDef.toggleId, !isEnabled, eventDef.display);
	        if (UiUtils.debug > 3) {
	          UiUtils.console.debug("initToggles: setHidden: togglId:", eventDef.toggleId, ", property:", eventDef.property, ", hidden:", !isEnabled, ", display:", eventDef.display);
	        }
	      }
	      if (eventDef.viewType === "checked") {
	        const isEnabled2 = this.model.getProperty(eventDef.property);
	        this.view.setInputChecked(id, isEnabled2);
	        if (UiUtils.debug > 3) {
	          UiUtils.console.debug("initToggles: checked: id:", id, ", property:", eventDef.property, ", checked:", isEnabled2);
	        }
	      } else if (eventDef.viewType === "select") {
	        const value = this.model.getProperty(eventDef.property);
	        this.view.setSelectValue(id, value);
	        if (UiUtils.debug > 3) {
	          UiUtils.console.debug("initToggles: select: id:", id, ", property:", eventDef.property, ", value:", value);
	        }
	      } else if (eventDef.viewType === "numberInput") {
	        const value = this.model.getProperty(eventDef.property);
	        this.view.setInputValue(id, String(value));
	        if (UiUtils.debug > 3) {
	          UiUtils.console.debug("initToggles: numberInput: id:", id, ", property:", eventDef.property, ", value:", value);
	        }
	      }
	    }
	  }
	  initToggles() {
	    const eventDefInternalMap = this.eventDefInternalMap;
	    for (const type in eventDefInternalMap) {
	      if (Object.prototype.hasOwnProperty.call(eventDefInternalMap, type)) {
	        const eventDefMap4Type = eventDefInternalMap[type];
	        for (const id in eventDefMap4Type) {
	          if (Object.prototype.hasOwnProperty.call(eventDefMap4Type, id)) {
	            const eventDef = eventDefMap4Type[id];
	            this.initOneToggle(type, id, eventDef);
	          }
	        }
	      }
	    }
	  }
	  static getToggleId(eventDef) {
	    if (!eventDef.toggleId) {
	      UiUtils.console.error("getToggleId: id=" + eventDef.id + ": toggleId missing!");
	      return "";
	    }
	    return eventDef.toggleId;
	  }
	  static getproperty(eventDef) {
	    if (!eventDef.property) {
	      UiUtils.console.error("setPopoversHiddenExcept: id=" + eventDef.id + ": property missing!");
	      return "";
	    }
	    return eventDef.property;
	  }
	  setPopoversHiddenExcept(exceptId) {
	    const eventDefInternalMap = this.eventDefInternalMap, eventDefMapClick = eventDefInternalMap.click;
	    for (const id in eventDefMapClick) {
	      if (Object.prototype.hasOwnProperty.call(eventDefMapClick, id)) {
	        const eventDef = eventDefMapClick[id];
	        if (eventDef.isPopover && eventDef.toggleId !== exceptId) {
	          const toggleId = CommonEventHandler.getToggleId(eventDef), property = CommonEventHandler.getproperty(eventDef);
	          if (!this.view.getHidden(toggleId)) {
	            this.model.setProperty(property, false);
	            this.view.setHidden(toggleId, true, eventDef.display);
	          }
	        }
	      }
	    }
	  }
	  toggleAreaHidden(eventDef) {
	    const toggleId = CommonEventHandler.getToggleId(eventDef), property = CommonEventHandler.getproperty(eventDef), visible = !this.model.getProperty(property);
	    this.model.setProperty(property, visible);
	    this.view.setHidden(toggleId, !visible, eventDef.display);
	    if (visible && eventDef.display === "flex" && this.view.getHidden(toggleId)) {
	      this.view.setHidden(toggleId, !visible);
	    }
	    if (visible && eventDef.isPopover) {
	      this.setPopoversHiddenExcept(toggleId);
	    }
	    return visible;
	  }
	  // maybe we can avoid this...
	  getEventDefById(type, id) {
	    const eventDefForType = this.eventDefInternalMap[type], eventDef = eventDefForType[id];
	    if (!eventDef) {
	      UiUtils.console.error("getEventDefById: type=" + type + ", id=" + id + ": No eventDef!");
	    }
	    return eventDef;
	  }
	  toggleAreaHiddenById(type, id) {
	    const eventDef = this.getEventDefById(type, id);
	    return this.toggleAreaHidden(eventDef);
	  }
	  onCheckedChange(eventDef) {
	    const id = eventDef.id, property = CommonEventHandler.getproperty(eventDef), checked = this.view.getInputChecked(id);
	    this.model.setProperty(property, checked);
	    return checked;
	  }
	  onNumberInputChange(eventDef) {
	    const id = eventDef.id, property = CommonEventHandler.getproperty(eventDef), valueAsString = this.view.getInputValue(id), value = Number(valueAsString);
	    this.model.setProperty(property, value);
	    return value;
	  }
	  onSelectChange(eventDef) {
	    const id = eventDef.id, property = CommonEventHandler.getproperty(eventDef), value = this.view.getSelectValue(id);
	    this.model.setProperty(property, value);
	    this.view.setSelectTitleFromSelectedOption(id);
	    return value;
	  }
	  onExportButtonClick(eventDef) {
	    if (this.toggleAreaHidden(eventDef)) {
	      this.controller.setExportSelectOptions(ViewID.exportFileSelect);
	    }
	  }
	  onGalleryButtonClick(eventDef) {
	    if (this.toggleAreaHidden(eventDef)) {
	      this.controller.setGalleryAreaInputs();
	    }
	  }
	  fnUpdateAreaText(input) {
	    this.controller.setInputText(input, true);
	    this.controller.setOutputText("");
	  }
	  onOutputTextChange() {
	    this.controller.setOutputText(this.view.getAreaValue(ViewID.outputText));
	  }
	  onUndoButtonClick() {
	    const input = this.controller.undoStackElement();
	    this.fnUpdateAreaText(input);
	  }
	  onRedoButtonClick() {
	    const input = this.controller.redoStackElement();
	    this.fnUpdateAreaText(input);
	  }
	  onContinueButtonClick(eventDef, event) {
	    this.controller.startContinue();
	    this.onCpcCanvasClick(eventDef, event);
	  }
	  onParseRunButtonClick(eventDef, event) {
	    this.controller.startParseRun();
	    this.onCpcCanvasClick(eventDef, event);
	  }
	  static onHelpButtonClick() {
	    window.open("https://github.com/benchmarko/CPCBasicTS/#readme");
	  }
	  onGalleryItemClick(_eventDef, event) {
	    const target = View.getEventTarget(event), value = target.value;
	    this.view.setSelectValue(ViewID.exampleSelect, value);
	    this.setPopoversHiddenExcept();
	    this.controller.onExampleSelectChange();
	  }
	  // eslint-disable-next-line class-methods-use-this
	  onCopyTextButtonClick() {
	    const textText = View.getElementByIdAs(ViewID.textText);
	    textText.select();
	    this.view.setAreaSelection(ViewID.textText, 0, 99999);
	    if (window.navigator && window.navigator.clipboard) {
	      void window.navigator.clipboard.writeText(textText.value);
	    } else {
	      UiUtils.console.warn("Copy to clipboard not available");
	    }
	  }
	  updateUrlFromConfig() {
	    const url = new URL(window.location.href), initial = this.model.getAllInitialProperties(), changed = this.model.getChangedProperties();
	    for (const name in initial) {
	      if (Object.prototype.hasOwnProperty.call(initial, name)) {
	        url.searchParams.delete(name);
	      }
	    }
	    for (const name in changed) {
	      if (Object.prototype.hasOwnProperty.call(changed, name)) {
	        url.searchParams.set(name, String(changed[name]));
	      }
	    }
	    if (url.href !== window.location.href) {
	      window.history.replaceState(window.history.state, "", url.href);
	    }
	  }
	  onVarSelectChange() {
	    const par = this.view.getSelectValue(ViewID.varSelect), value = this.controller.getVariable(par), valueString = value !== void 0 ? String(value) : "";
	    this.view.setAreaValue(ViewID.varText, valueString);
	  }
	  onKbdLayoutSelectChange(eventDef) {
	    const value = this.onSelectChange(eventDef);
	    this.view.setHidden(ViewID.kbdAlpha, value === "num");
	    this.view.setHidden(ViewID.kbdNum, value === "alpha");
	  }
	  onBasicVersionSelectChange(eventDef) {
	    const value = this.onSelectChange(eventDef);
	    this.controller.setBasicVersion(value);
	  }
	  onPaletteSelectChange(eventDef) {
	    const value = this.onSelectChange(eventDef);
	    this.controller.setPalette(value);
	  }
	  onCanvasTypeSelectChange(eventDef) {
	    const value = this.onSelectChange(eventDef);
	    this.controller.setCanvasType(value);
	  }
	  onDebugInputChange(eventDef) {
	    const value = this.onNumberInputChange(eventDef);
	    UiUtils.debug = value;
	  }
	  onDragElementsInputChange(eventDef) {
	    const checked = this.onCheckedChange(eventDef);
	    this.controller.fnDragElementsActive(checked);
	  }
	  onShowCpcInputChange(eventDef) {
	    if (this.toggleAreaHidden(eventDef)) {
	      this.controller.startUpdateCanvas();
	    } else {
	      this.controller.stopUpdateCanvas();
	    }
	  }
	  onShowKbdInputChange(eventDef) {
	    if (this.toggleAreaHidden(eventDef)) {
	      this.controller.getVirtualKeyboard();
	    }
	  }
	  onDisassInputChange() {
	    const addressStr = this.view.getInputValue(ViewID.disassInput), addrList = addressStr.split("-"), addr = parseInt(addrList[0], 16), endAddr = addrList[1] ? parseInt(addrList[1], 16) : void 0;
	    this.controller.setDisassAddr(addr, endAddr);
	  }
	  onSoundInputChange(eventDef) {
	    this.onCheckedChange(eventDef);
	    this.controller.setSoundActive();
	  }
	  onScreenshotButtonClick() {
	    const example = this.view.getSelectValue(ViewID.exampleSelect), image = this.controller.startScreenshot(), link = View.getElementById1(ViewID.screenshotLink), name = example + ".png";
	    if (image) {
	      link.setAttribute("download", name);
	      link.setAttribute("href", image);
	      link.click();
	    }
	  }
	  onClearInputButtonClick() {
	    this.view.setAreaValue(ViewID.inp2Text, "");
	  }
	  onFullscreenButtonClick() {
	    let id;
	    if (!this.view.getHidden(ViewID.cpcCanvas)) {
	      id = ViewID.cpcCanvas;
	    } else if (!this.view.getHidden(ViewID.textText)) {
	      id = ViewID.textCanvasDiv;
	    } else {
	      UiUtils.console.warn("Fullscreen only possible for graphics or text canvas");
	      return;
	    }
	    const switched = this.view.requestFullscreenForId(id);
	    if (!switched) {
	      UiUtils.console.warn("Switch to fullscreen not available");
	    }
	  }
	  onCpcCanvasClick(_eventDef, event) {
	    this.setPopoversHiddenExcept();
	    this.controller.onCpcCanvasClick(event);
	  }
	  createEventDefMap() {
	    const eventDefInternalMap = this.eventDefInternalMap, eventDefs = {
	      click: [
	        {
	          id: ViewID.clearInputButton,
	          func: this.onClearInputButtonClick
	        },
	        {
	          id: ViewID.continueButton,
	          func: this.onContinueButtonClick
	        },
	        {
	          id: ViewID.cpcCanvas,
	          func: this.onCpcCanvasClick
	        },
	        {
	          id: ViewID.copyTextButton,
	          func: this.onCopyTextButtonClick
	        },
	        {
	          id: ViewID.downloadButton,
	          controllerFunc: this.controller.fnDownload
	        },
	        {
	          id: ViewID.enterButton,
	          controllerFunc: this.controller.startEnter
	        },
	        {
	          id: ViewID.exportButton,
	          toggleId: ViewID.exportArea,
	          property: ModelPropID.showExport,
	          display: "flex",
	          isPopover: true,
	          func: this.onExportButtonClick
	        },
	        {
	          id: ViewID.fullscreenButton,
	          func: this.onFullscreenButtonClick
	        },
	        {
	          id: ViewID.galleryButton,
	          toggleId: ViewID.galleryArea,
	          property: ModelPropID.showGallery,
	          display: "flex",
	          isPopover: true,
	          func: this.onGalleryButtonClick
	        },
	        {
	          id: ViewID.galleryItem,
	          func: this.onGalleryItemClick
	        },
	        {
	          id: ViewID.helpButton,
	          func: CommonEventHandler.onHelpButtonClick
	        },
	        {
	          id: ViewID.lineNumberAddButton,
	          controllerFunc: this.controller.fnAddLines
	        },
	        {
	          id: ViewID.lineNumberRemoveButton,
	          controllerFunc: this.controller.fnRemoveLines
	        },
	        {
	          id: ViewID.moreButton,
	          toggleId: ViewID.moreArea,
	          property: ModelPropID.showMore,
	          display: "flex",
	          isPopover: true,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.parseButton,
	          controllerFunc: this.controller.startParse
	        },
	        {
	          id: ViewID.parseRunButton,
	          func: this.onParseRunButtonClick
	        },
	        {
	          id: ViewID.prettyButton,
	          controllerFunc: this.controller.fnPretty
	        },
	        {
	          id: ViewID.prettyPopoverButton,
	          toggleId: ViewID.prettyArea,
	          property: ModelPropID.showPretty,
	          display: "flex",
	          isPopover: true,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.redoButton,
	          func: this.onRedoButtonClick
	        },
	        {
	          id: ViewID.redoButton2,
	          func: this.onRedoButtonClick
	          // same redo
	        },
	        {
	          id: ViewID.renumButton,
	          controllerFunc: () => {
	            this.controller.startRenum();
	          }
	        },
	        {
	          id: ViewID.renumPopoverButton,
	          toggleId: ViewID.renumArea,
	          property: ModelPropID.showRenum,
	          display: "flex",
	          isPopover: true,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.resetButton,
	          controllerFunc: this.controller.startReset
	        },
	        {
	          id: ViewID.runButton,
	          controllerFunc: this.controller.startRun
	        },
	        {
	          id: ViewID.screenshotButton,
	          func: this.onScreenshotButtonClick
	        },
	        {
	          id: ViewID.screenshotLink
	          // nothing
	        },
	        {
	          id: ViewID.settingsButton,
	          toggleId: ViewID.settingsArea,
	          property: ModelPropID.showSettings,
	          display: "flex",
	          isPopover: true,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.stopButton,
	          controllerFunc: this.controller.startBreak
	        },
	        {
	          id: ViewID.textText,
	          func: this.onCpcCanvasClick
	          // same as for cpcCanvas
	        },
	        {
	          id: ViewID.undoButton,
	          func: this.onUndoButtonClick
	        },
	        {
	          id: ViewID.undoButton2,
	          func: this.onUndoButtonClick
	          // same undo
	        },
	        {
	          id: ViewID.viewButton,
	          toggleId: ViewID.viewArea,
	          property: ModelPropID.showView,
	          display: "flex",
	          isPopover: true,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.window,
	          //TTT do we need this?
	          controllerFunc: this.controller.onWindowClick
	        }
	      ],
	      change: [
	        {
	          id: ViewID.arrayBoundsInput,
	          viewType: "checked",
	          property: ModelPropID.arrayBounds,
	          func: this.onCheckedChange,
	          controllerFunc: this.controller.fnArrayBounds
	        },
	        {
	          id: ViewID.autorunInput,
	          viewType: "checked",
	          property: ModelPropID.autorun,
	          func: this.onCheckedChange
	        },
	        {
	          id: ViewID.basicVersionSelect,
	          viewType: "select",
	          property: ModelPropID.basicVersion,
	          func: this.onBasicVersionSelectChange
	        },
	        {
	          id: ViewID.canvasTypeSelect,
	          viewType: "select",
	          property: ModelPropID.canvasType,
	          func: this.onCanvasTypeSelectChange
	        },
	        {
	          id: ViewID.databaseSelect,
	          controllerFunc: this.controller.onDatabaseSelectChange
	        },
	        {
	          id: ViewID.debugInput,
	          viewType: "numberInput",
	          property: ModelPropID.debug,
	          func: this.onDebugInputChange
	        },
	        {
	          id: ViewID.directorySelect,
	          controllerFunc: this.controller.onDirectorySelectChange
	        },
	        {
	          id: ViewID.disassInput,
	          func: this.onDisassInputChange
	        },
	        {
	          id: ViewID.exampleSelect,
	          controllerFunc: this.controller.onExampleSelectChange
	        },
	        {
	          id: ViewID.implicitLinesInput,
	          viewType: "checked",
	          property: ModelPropID.implicitLines,
	          func: this.onCheckedChange,
	          controllerFunc: this.controller.fnImplicitLines
	        },
	        {
	          id: ViewID.integerOverflowInput,
	          viewType: "checked",
	          property: ModelPropID.integerOverflow,
	          func: this.onCheckedChange,
	          controllerFunc: this.controller.fnIntegerOverflow
	        },
	        {
	          id: ViewID.kbdLayoutSelect,
	          viewType: "select",
	          property: ModelPropID.kbdLayout,
	          func: this.onKbdLayoutSelectChange
	        },
	        {
	          id: ViewID.linesOnLoadInput,
	          viewType: "checked",
	          property: ModelPropID.linesOnLoad,
	          func: this.onCheckedChange
	        },
	        {
	          id: ViewID.dragElementsInput,
	          viewType: "checked",
	          property: ModelPropID.dragElements,
	          func: this.onDragElementsInputChange
	        },
	        {
	          id: ViewID.outputText,
	          func: this.onOutputTextChange
	        },
	        {
	          id: ViewID.paletteSelect,
	          viewType: "select",
	          property: ModelPropID.palette,
	          func: this.onPaletteSelectChange
	        },
	        {
	          id: ViewID.prettyBracketsInput,
	          viewType: "checked",
	          property: ModelPropID.prettyBrackets,
	          func: this.onCheckedChange
	        },
	        {
	          id: ViewID.prettyColonsInput,
	          viewType: "checked",
	          property: ModelPropID.prettyColons,
	          func: this.onCheckedChange
	        },
	        {
	          id: ViewID.prettyLowercaseVarsInput,
	          viewType: "checked",
	          property: ModelPropID.prettyLowercaseVars,
	          func: this.onCheckedChange,
	          controllerFunc: this.controller.fnPrettyLowercaseVars
	        },
	        {
	          id: ViewID.prettySpaceInput,
	          viewType: "checked",
	          property: ModelPropID.prettySpace,
	          func: this.onCheckedChange
	        },
	        {
	          id: ViewID.selectDataFilesInput,
	          viewType: "checked",
	          property: ModelPropID.selectDataFiles,
	          func: this.onCheckedChange
	        },
	        {
	          id: ViewID.showConsoleLogInput,
	          viewType: "checked",
	          toggleId: ViewID.consoleLogArea,
	          property: ModelPropID.showConsoleLog,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.showCpcInput,
	          viewType: "checked",
	          toggleId: ViewID.cpcArea,
	          property: ModelPropID.showCpc,
	          func: this.onShowCpcInputChange
	        },
	        {
	          id: ViewID.showDisassInput,
	          viewType: "checked",
	          toggleId: ViewID.disassArea,
	          property: ModelPropID.showDisass,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.showInp2Input,
	          viewType: "checked",
	          toggleId: ViewID.inp2Area,
	          property: ModelPropID.showInp2,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.showInputInput,
	          viewType: "checked",
	          toggleId: ViewID.inputArea,
	          property: ModelPropID.showInput,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.showKbdInput,
	          viewType: "checked",
	          toggleId: ViewID.kbdArea,
	          property: ModelPropID.showKbd,
	          func: this.onShowKbdInputChange
	        },
	        {
	          id: ViewID.showOutputInput,
	          viewType: "checked",
	          toggleId: ViewID.outputArea,
	          property: ModelPropID.showOutput,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.showResultInput,
	          viewType: "checked",
	          toggleId: ViewID.resultArea,
	          property: ModelPropID.showResult,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.showVariableInput,
	          viewType: "checked",
	          toggleId: ViewID.variableArea,
	          property: ModelPropID.showVariable,
	          func: this.toggleAreaHidden
	        },
	        {
	          id: ViewID.soundInput,
	          viewType: "checked",
	          property: ModelPropID.sound,
	          func: this.onSoundInputChange
	        },
	        {
	          id: ViewID.speedInput,
	          viewType: "numberInput",
	          property: ModelPropID.speed,
	          func: this.onNumberInputChange,
	          controllerFunc: this.controller.fnSpeed
	        },
	        {
	          id: ViewID.traceInput,
	          viewType: "checked",
	          property: ModelPropID.trace,
	          func: this.onCheckedChange,
	          controllerFunc: this.controller.fnTrace
	        },
	        {
	          id: ViewID.varSelect,
	          func: this.onVarSelectChange
	        },
	        {
	          id: ViewID.varText,
	          controllerFunc: this.controller.changeVariable
	        }
	      ]
	    };
	    for (const type in eventDefs) {
	      if (Object.prototype.hasOwnProperty.call(eventDefs, type)) {
	        eventDefInternalMap[type] = {};
	        const eventDefList = eventDefs[type], itemForType = eventDefInternalMap[type];
	        for (let i = 0; i < eventDefList.length; i += 1) {
	          itemForType[eventDefList[i].id] = eventDefList[i];
	        }
	      }
	    }
	  }
	  handleEvent(event) {
	    const target = View.getEventTarget(event), type = event.type;
	    let id = target ? target.getAttribute("id") : String(target);
	    if (this.fnUserAction) {
	      this.fnUserAction(event, id);
	    }
	    if (id) {
	      if (target.disabled) {
	        return;
	      }
	      if (id.startsWith("galleryItem")) {
	        id = "galleryItem";
	      }
	      if (this.eventDefInternalMap[type] && this.eventDefInternalMap[type][id]) {
	        const eventDef = this.eventDefInternalMap[type][id];
	        if (UiUtils.debug) {
	          UiUtils.console.debug("handleEvent: " + type + ", " + id + ":", eventDef);
	        }
	        if (eventDef.func) {
	          eventDef.func.call(this, eventDef, event);
	        }
	        if (eventDef.controllerFunc) {
	          eventDef.controllerFunc.call(this.controller, eventDef, event);
	        }
	        this.updateUrlFromConfig();
	      } else if (!id.endsWith("Select") && !id.endsWith("Input")) {
	        UiUtils.console.log("handleEvent: " + type + ", " + id + ": No handler");
	      }
	    } else if (UiUtils.debug) {
	      UiUtils.console.log("handleEvent: " + type + ": unknown target:", target.tagName, target.id);
	    }
	    if (type === "click") {
	      if (id !== String(ViewID.cpcCanvas) && id !== String(ViewID.textText)) {
	        this.controller.onWindowClick(event);
	      }
	    }
	  }
	}

	class ExecutionControls {
	  constructor(view) {
	    this.view = view;
	  }
	  update(state) {
	    if (state.reason === "direct") {
	      return;
	    }
	    const reason = state.reason;
	    this.view.setDisabled(ViewID.runButton, state.isRunning || reason === "reset");
	    this.view.setDisabled(ViewID.stopButton, !state.isRunning && reason !== "fileLoad" && reason !== "fileSave");
	    this.view.setDisabled(ViewID.continueButton, state.isRunning || reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");
	  }
	  programEdited() {
	    this.view.setDisabled(ViewID.continueButton, true);
	  }
	}

	class UiController {
	  constructor(core, view, controller, onUserAction) {
	    this.view = view;
	    this.controller = controller;
	    this.executionControls = new ExecutionControls(view);
	    this.commonEventHandler = new CommonEventHandler({
	      model: core.getModel(),
	      view,
	      controller
	    });
	    view.addEventListener("click", this.commonEventHandler);
	    view.addEventListener("change", this.commonEventHandler);
	    this.commonEventHandler.initToggles();
	    this.commonEventHandler.onKbdLayoutSelectChange(this.commonEventHandler.getEventDefById("change", ViewID.kbdLayoutSelect));
	    this.commonEventHandler.fnSetUserAction(onUserAction);
	  }
	  deactivateUserAction() {
	    this.commonEventHandler.fnSetUserAction(void 0);
	  }
	  onExecutionState(state) {
	    this.executionControls.update(state);
	  }
	  onDiagnostic(diagnostic) {
	    if (diagnostic.selectSource && diagnostic.pos !== void 0) {
	      const length = diagnostic.len || (diagnostic.value !== void 0 ? String(diagnostic.value).length : 0);
	      this.view.setAreaSelection(ViewID.inputText, diagnostic.pos, diagnostic.pos + length);
	    }
	  }
	  onProgramEdited() {
	    this.executionControls.programEdited();
	  }
	  getRenumOptions() {
	    return {
	      newLine: Number(this.view.getInputValue(ViewID.renumNewInput)),
	      oldLine: Number(this.view.getInputValue(ViewID.renumStartInput)),
	      step: Number(this.view.getInputValue(ViewID.renumStepInput)),
	      keep: Number(this.view.getInputValue(ViewID.renumKeepInput))
	    };
	  }
	  onVarSelectChange() {
	    this.commonEventHandler.onVarSelectChange();
	  }
	  refreshVariables() {
	    const items = this.controller.getVariableNames().map((name) => {
	      const title = name + "=" + this.controller.getVariable(name), label = title.length > 35 ? title.substring(0, 35) + " ..." : title;
	      return { value: name, text: label, title: label, selected: false };
	    });
	    items.sort((first, second) => first.value < second.value ? -1 : first.value > second.value ? 1 : 0);
	    this.view.setSelectOptions(ViewID.varSelect, items);
	  }
	  setPopoversHiddenExcept(exceptId) {
	    this.commonEventHandler.setPopoversHiddenExcept(exceptId);
	  }
	  toggleAreaHiddenById(type, id) {
	    return this.commonEventHandler.toggleAreaHiddenById(type, id);
	  }
	}

	const _Z80Disass = class _Z80Disass {
	  // actual prefix: 0=none, 1=0xDD, 2=0xFD, 4=0xED
	  constructor(options) {
	    // hex-marker, "&" or "#" or ""
	    this.dissOp = 0;
	    // actual op-code
	    this.prefix = 0;
	    this.options = {
	      format: 7
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  readByte(i) {
	    const data = this.options.data;
	    return data[i] | 0;
	  }
	  readWord(i) {
	    const data = this.options.data;
	    return data[i] | data[i + 1] << 8;
	  }
	  bget() {
	    const by = this.readByte(this.options.addr);
	    this.options.addr += 1;
	    return by;
	  }
	  // byte-out: returns byte xx at PC; PC++
	  bout() {
	    const by = this.bget();
	    return _Z80Disass.hexMark + by.toString(16).toUpperCase().padStart(2, "0");
	  }
	  // word-out: returns word xxyy from PC, PC+=2
	  wout() {
	    const wo = this.readWord(this.options.addr);
	    this.options.addr += 2;
	    return _Z80Disass.hexMark + wo.toString(16).toUpperCase().padStart(4, "0");
	  }
	  // relative-address-out : gets it from PC and returns PC+(signed)tt ; PC++
	  radrout() {
	    let dis = this.bget();
	    dis = dis << 24 >> 24;
	    let addr = this.options.addr + dis;
	    if (addr < 0) {
	      addr += 65536;
	    }
	    return _Z80Disass.hexMark + addr.toString(16).toUpperCase().padStart(4, "0");
	  }
	  /* eslint-enable array-element-newline */
	  // byte-register-out : returns string to an 8-bit register
	  // handles prefix, special op-codes with IX,IY and h,l
	  bregout(nr) {
	    const dissOp = this.dissOp;
	    nr &= 7;
	    let prefix = this.prefix;
	    if (prefix === 4 || (this.prefix === 1 || this.prefix === 2) && (dissOp === 102 || dissOp === 110 || dissOp === 116 || dissOp === 117) && nr !== 6) {
	      prefix = 0;
	    }
	    return _Z80Disass.bregtab[prefix][nr] + (prefix && nr === 6 ? this.bout() + ")" : "");
	  }
	  /* eslint-enable array-element-newline */
	  // word-register-out : returns string to a 16-bit-register
	  // handles prefix
	  wregout(nr) {
	    const prefix = this.prefix === 1 || this.prefix === 2 ? this.prefix : 0;
	    return _Z80Disass.wregtab[prefix][nr & 3];
	  }
	  // push-pop-register-out: like wregout, only SP substituted by AF
	  pupoRegout(nr) {
	    nr &= 3;
	    if (nr === 3) {
	      return "AF";
	    }
	    return this.wregout(nr);
	  }
	  onlyPrefix() {
	    let out;
	    if (this.prefix === 1) {
	      out = "[DD]-prefix";
	    } else if (this.prefix === 2) {
	      out = "[FD]-prefix";
	    } else {
	      out = "[ED]-prefix";
	    }
	    this.options.addr -= 1;
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  operdisCB() {
	    let out, newop;
	    if (this.prefix === 1 || this.prefix === 2) {
	      newop = this.readByte(this.options.addr + 1) & 254 | 6;
	    } else {
	      newop = this.readByte(this.options.addr);
	    }
	    const b6b7 = newop >> 6, b3b4b5 = newop >> 3 & 7;
	    if (b6b7 === 0) {
	      out = _Z80Disass.rlcTable[b3b4b5] + " " + this.bregout(newop);
	    } else {
	      out = _Z80Disass.bitResSetTable[b6b7 - 1] + " " + b3b4b5 + "," + this.bregout(newop);
	    }
	    if (this.prefix === 1 || this.prefix === 2) {
	      if (newop !== this.readByte(this.options.addr) && newop >> 6 !== 1) {
	        const premem = this.prefix;
	        this.prefix = 0;
	        out += " & LD " + this.bregout(this.readByte(this.options.addr));
	        this.prefix = premem;
	      }
	    }
	    this.options.addr += 1;
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  operdisEDpart40To7F(dissOp) {
	    let out = "";
	    switch (dissOp & 7) {
	      // test b0,b1,b2
	      case 0:
	        if (dissOp === 112) {
	          out = "*IN X,(C)";
	        } else {
	          out = "IN " + this.bregout(dissOp >> 3) + ",(C)";
	        }
	        break;
	      case 1:
	        if (dissOp === 113) {
	          out = "*OUT (C),0";
	        } else {
	          out = "OUT (C)," + this.bregout(dissOp >> 3);
	        }
	        break;
	      case 2:
	        out = (dissOp & 8 ? "ADC" : "SBC") + " HL," + this.wregout(dissOp >> 4);
	        break;
	      case 3:
	        if (dissOp & 8) {
	          out = "LD " + this.wregout(dissOp >> 4) + ",(" + this.wout() + ")";
	        } else {
	          out = "LD (" + this.wout() + ")," + this.wregout(dissOp >> 4);
	        }
	        break;
	      case 4:
	        out = dissOp === 68 ? "NEG" : "*NEG";
	        break;
	      case 5:
	        if (dissOp === 69) {
	          out = "RETN";
	        } else if (dissOp === 77) {
	          out = "RETI";
	        } else if ((dissOp & 15) === 5) {
	          out = "*RETN";
	        } else {
	          out = "*RETI";
	        }
	        break;
	      case 6:
	        switch (dissOp) {
	          case 70:
	            out = "IM 0";
	            break;
	          case 86:
	            out = "IM 1";
	            break;
	          case 94:
	            out = "IM 2";
	            break;
	          case 78:
	          // *im 0
	          case 102:
	          case 110:
	            out = "*IM 0";
	            break;
	          case 118:
	            out = "*IM 1";
	            break;
	          case 126:
	            out = "*IM 2";
	            break;
	        }
	        break;
	      case 7:
	        out = _Z80Disass.ldIaTable[dissOp >> 3 & 7];
	        break;
	    }
	    return out;
	  }
	  /* eslint-enable array-element-newline */
	  operdisED(dissOp) {
	    let out = "";
	    switch (dissOp >> 6) {
	      // test b6,7
	      case 0:
	        out = _Z80Disass.unknownOp;
	        break;
	      case 1:
	        out = this.operdisEDpart40To7F(dissOp);
	        break;
	      default:
	        break;
	      case 2:
	        if ((dissOp & 36) === 32) {
	          out = _Z80Disass.repeatTable[dissOp & 3][dissOp >> 3 & 3];
	        } else {
	          out = _Z80Disass.unknownOp;
	        }
	        break;
	      case 3:
	        out = _Z80Disass.unknownOp;
	        break;
	    }
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  //
	  // Disassemble 00-3F
	  //
	  operdis00To3Fpart00(b3b4b5) {
	    let out;
	    switch (b3b4b5) {
	      // test b3,b4,b5
	      case 0:
	        out = "NOP";
	        break;
	      case 1:
	        out = "EX AF,AF'";
	        break;
	      case 2:
	        out = "DJNZ " + this.radrout();
	        break;
	      case 3:
	        out = "JR " + this.radrout();
	        break;
	      default:
	        out = "JR " + _Z80Disass.conditionTable[b3b4b5 & 3] + "," + this.radrout();
	        break;
	    }
	    return out;
	  }
	  operdis00To3Fpart01(dissOp) {
	    let out;
	    if (dissOp & 8) {
	      out = "ADD " + this.wregout(2) + "," + this.wregout(dissOp >> 4);
	    } else {
	      out = "LD " + this.wregout(dissOp >> 4) + "," + this.wout();
	    }
	    return out;
	  }
	  operdis00To3Fpart02(b3b4b5) {
	    let out = "";
	    if (b3b4b5 & 4) {
	      switch (b3b4b5 & 3) {
	        // test b3,b4
	        case 0:
	          out = "LD (" + this.wout() + ")," + this.wregout(2);
	          break;
	        case 1:
	          out = "LD " + this.wregout(2) + ",(" + this.wout() + ")";
	          break;
	        case 2:
	          out = "LD (" + this.wout() + "),A";
	          break;
	        case 3:
	          out = "LD A,(" + this.wout() + ")";
	          break;
	      }
	    } else {
	      switch (b3b4b5 & 3) {
	        // test b3,b4
	        case 0:
	          out = "LD (BC),A";
	          break;
	        case 1:
	          out = "LD A,(BC)";
	          break;
	        case 2:
	          out = "LD (DE),A";
	          break;
	        case 3:
	          out = "LD A,(DE)";
	          break;
	      }
	    }
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  operdis00To3F(dissOp) {
	    let out = "";
	    switch (dissOp & 7) {
	      // test b0,b1,b2
	      case 0:
	        out = this.operdis00To3Fpart00(dissOp >> 3 & 7);
	        break;
	      case 1:
	        out = this.operdis00To3Fpart01(dissOp);
	        break;
	      case 2:
	        out = this.operdis00To3Fpart02(dissOp >> 3 & 7);
	        break;
	      case 3:
	        out = (dissOp & 8 ? "DEC " : "INC ") + this.wregout(dissOp >> 4);
	        break;
	      case 4:
	        out = "INC " + this.bregout(dissOp >> 3);
	        break;
	      case 5:
	        out = "DEC " + this.bregout(dissOp >> 3);
	        break;
	      case 6:
	        out = "LD " + this.bregout(dissOp >> 3) + "," + this.bout();
	        break;
	      case 7:
	        out = _Z80Disass.rlcaTable[dissOp >> 3 & 7];
	        break;
	    }
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  //
	  // Disassemble C0-FF
	  //
	  operdisC0ToFFpart01(dissOp) {
	    let out = "";
	    const b4b5 = dissOp >> 4 & 3;
	    if (dissOp & 8) {
	      switch (b4b5) {
	        // test b4,b5
	        case 0:
	          out = "RET";
	          break;
	        case 1:
	          out = "EXX";
	          break;
	        case 2:
	          out = "JP (" + this.wregout(2) + ")";
	          break;
	        case 3:
	          out = "LD SP," + this.wregout(2);
	          break;
	      }
	    } else {
	      out = "POP " + this.pupoRegout(b4b5);
	    }
	    return out;
	  }
	  operdisC0ToFFpart03(b3b4b5) {
	    let out = "";
	    switch (b3b4b5) {
	      // test b3,b4,b5
	      case 0:
	        out = "JP " + this.wout();
	        break;
	      case 1:
	        out = this.operdisCB();
	        break;
	      case 2:
	        out = "OUT (" + this.bout() + "),A";
	        break;
	      case 3:
	        out = "IN A,(" + this.bout() + ")";
	        break;
	      case 4:
	        out = "EX (SP)," + this.wregout(2);
	        break;
	      case 5:
	        out = "EX DE,HL";
	        break;
	      case 6:
	        out = "DI";
	        break;
	      case 7:
	        out = "EI";
	        break;
	    }
	    return out;
	  }
	  operdisC0ToFFpart05(dissOp) {
	    let out;
	    const b4b5 = dissOp >> 4 & 3;
	    if (dissOp & 8) {
	      if (b4b5 === 0) {
	        out = "CALL " + this.wout();
	      } else {
	        out = this.onlyPrefix();
	      }
	    } else {
	      out = "PUSH " + this.pupoRegout(b4b5);
	    }
	    return out;
	  }
	  operdisC0ToFF(dissOp) {
	    let out = "";
	    switch (dissOp & 7) {
	      // test b0,b1,b2
	      case 0:
	        out = "RET " + _Z80Disass.conditionTable[dissOp >> 3 & 7];
	        break;
	      case 1:
	        out = this.operdisC0ToFFpart01(dissOp);
	        break;
	      case 2:
	        out = "JP " + _Z80Disass.conditionTable[dissOp >> 3 & 7] + "," + this.wout();
	        break;
	      case 3:
	        out = this.operdisC0ToFFpart03(dissOp >> 3 & 7);
	        break;
	      case 4:
	        out = "CALL " + _Z80Disass.conditionTable[dissOp >> 3 & 7] + "," + this.wout();
	        break;
	      case 5:
	        out = this.operdisC0ToFFpart05(dissOp);
	        break;
	      case 6:
	        out = _Z80Disass.arithMTab[dissOp >> 3 & 7] + this.bout();
	        break;
	      case 7:
	        out = "RST " + _Z80Disass.hexMark + (dissOp & 56).toString(16).toUpperCase().padStart(2, "0");
	        break;
	    }
	    return out;
	  }
	  // disassembles next instruction
	  getNextLine() {
	    let dissOp = this.bget();
	    const prefix = _Z80Disass.prefixMap[dissOp] || 0;
	    if (prefix) {
	      dissOp = this.bget();
	    }
	    this.prefix = prefix;
	    this.dissOp = dissOp;
	    let out = "";
	    if (prefix === 4) {
	      out = this.operdisED(dissOp);
	    } else {
	      switch (dissOp >> 6) {
	        // test b6,7
	        case 0:
	          out = this.operdis00To3F(dissOp);
	          break;
	        case 1:
	          out = dissOp === 118 ? "HALT" : "LD " + this.bregout(dissOp >> 3) + "," + this.bregout(dissOp);
	          break;
	        case 2:
	          out = _Z80Disass.arithMTab[dissOp >> 3 & 7] + this.bregout(dissOp);
	          break;
	        case 3:
	          out = this.operdisC0ToFF(dissOp);
	          break;
	      }
	    }
	    return out;
	  }
	  disassLine() {
	    const format = this.options.format ?? 7, startAddr = this.options.addr, line = this.getNextLine();
	    let out = "";
	    if (format & 1) {
	      out += startAddr.toString(16).toUpperCase().padStart(4, "0");
	    }
	    if (format & 2) {
	      const byteHex = [];
	      if (out.length) {
	        out += "  ";
	      }
	      for (let i = startAddr; i < this.options.addr; i += 1) {
	        const byte = this.readByte(i) || 0;
	        byteHex.push(byte.toString(16).toUpperCase().padStart(2, "0"));
	      }
	      while (byteHex.length < 4) {
	        byteHex.push("  ");
	      }
	      out += byteHex.join(" ");
	    }
	    if (format & 4) {
	      if (out.length) {
	        out += "  ";
	      }
	      out += line;
	    }
	    return out;
	  }
	};
	_Z80Disass.hexMark = "&";
	/* eslint-disable array-element-newline */
	_Z80Disass.bregtab = [
	  // byte-register-table
	  ["B", "C", "D", "E", "H", "L", "(HL)", "A"],
	  ["B", "C", "D", "E", "HX", "LX", "(IX+", "A"],
	  // DD-Prefix
	  ["B", "C", "D", "E", "HY", "LY", "(IY+", "A"]
	  // FD-Prefix
	];
	/* eslint-disable array-element-newline */
	_Z80Disass.wregtab = [
	  // byte-register-table
	  ["BC", "DE", "HL", "SP"],
	  ["BC", "DE", "IX", "SP"],
	  // DD-Prefix
	  ["BC", "DE", "IY", "SP"]
	  // FD-Prefix
	];
	_Z80Disass.unknownOp = "unknown";
	//
	// Disassemble CB
	//
	_Z80Disass.rlcTable = ["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLS*", "SRL"];
	// eslint-disable-line array-element-newline
	_Z80Disass.bitResSetTable = ["BIT", "RES", "SET"];
	//
	// Disassemble ED
	//
	_Z80Disass.ldIaTable = ["LD I,A", "LD R,A", "LD A,I", "LD A,R", "RRD", "RLD", _Z80Disass.unknownOp, _Z80Disass.unknownOp];
	/* eslint-disable array-element-newline */
	_Z80Disass.repeatTable = [
	  ["LDI", "LDD", "LDIR", "LDDR"],
	  ["CPI", "CPD", "CPIR", "CPDR"],
	  ["INI", "IND", "INIR", "INDR"],
	  ["OUTI", "OUTD", "OTIR", "OTDR"]
	];
	_Z80Disass.conditionTable = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"];
	_Z80Disass.rlcaTable = ["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"];
	_Z80Disass.arithMTab = ["ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "];
	//
	// Disassemble main
	//
	_Z80Disass.prefixMap = {
	  221: 1,
	  253: 2,
	  237: 4
	};
	let Z80Disass = _Z80Disass;

	function createBrowserHost(overrides = {}) {
	  return {
	    get storage() {
	      return overrides.storage ?? (Polyfills.localStorage || window.localStorage);
	    },
	    loadScript: overrides.loadScript ?? UiUtils.loadScript,
	    atobFn: (input) => overrides.atobFn ? overrides.atobFn(input) : window.atob(input),
	    btoaFn: (input) => overrides.btoaFn ? overrides.btoaFn(input) : window.btoa(input),
	    setTimeout: (callback, delay) => overrides.setTimeout ? overrides.setTimeout(callback, delay) : window.setTimeout(callback, delay)
	  };
	}

	const _Controller = class _Controller {
	  constructor(engine, view, options = {}) {
	    this.outScript = "";
	    this.initialLoopTimeout = 0;
	    this.inputSet = false;
	    this.canvases = {};
	    this.inputStack = new InputStack();
	    this.sound = new Sound({
	      AudioContextConstructor: window.AudioContext
	    });
	    this.dragElementsData = {
	      entries: {
	        consoleLogArea: {
	          itemId: ViewID.consoleLogArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        cpcArea: {
	          itemId: ViewID.cpcArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        disassArea: {
	          itemId: ViewID.disassArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        inp2Area: {
	          itemId: ViewID.inp2Area,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        inputArea: {
	          itemId: ViewID.inputArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        kbdArea: {
	          itemId: ViewID.kbdArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        mainArea: {
	          itemId: ViewID.mainArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        outputArea: {
	          itemId: ViewID.outputArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        resultArea: {
	          itemId: ViewID.resultArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        },
	        variableArea: {
	          itemId: ViewID.variableArea,
	          xOffset: 0,
	          yOffset: 0,
	          enabled: false
	        }
	      }
	    };
	    /* eslint-disable no-invalid-this */
	    this.handlers = {
	      waitKey: this.fnWaitKey,
	      waitSound: this.fnWaitSound,
	      waitInput: this.fnWaitInput,
	      fileCat: this.fnFileCat,
	      fileDir: this.fnFileDir,
	      fileEra: this.fnFileEra,
	      fileRen: (paras) => this.runtime.renameFile(this.getFileHandler(), paras),
	      renumLines: this.fnRenumLines,
	      deleteLines: this.fnDeleteLines,
	      editLine: this.fnEditLine,
	      list: this.fnList,
	      fileLoad: this.fnFileLoad,
	      fileSave: this.fnFileSave,
	      "new": this.fnNew,
	      run: this.fnRun,
	      parse: () => this.runtime.parseProgram(),
	      parseRun: this.fnParseRun,
	      reset: this.fnReset
	    };
	    this.fnWaitKeyHandler = this.fnWaitKey.bind(this);
	    this.fnWaitInputHandler = this.fnWaitInput.bind(this);
	    this.fnOnEscapeHandler = this.fnOnEscape.bind(this);
	    this.fnDirectInputHandler = this.fnDirectInput.bind(this);
	    this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
	    this.fnOnDragoverHandler = _Controller.fnOnDragover;
	    this.fnOnUserActionHandler = this.onUserAction.bind(this);
	    this.fnWaitForContinueHandler = this.fnWaitForContinue.bind(this);
	    this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);
	    this.fnOnUserKeyClickHandler = this.onUserKeyClick.bind(this);
	    this.engine = engine;
	    this.core = engine.core;
	    const model = this.core.getModel();
	    this.model = model;
	    this.view = view;
	    this.outScript = view.getAreaValue(ViewID.outputText);
	    this.options = options;
	    this.host = createBrowserHost(options);
	    this.view.addEventListenerById("click", this.fnOnUserKeyClickHandler, ViewID.userKeys);
	    this.uiController = new UiController(this.core, view, this, this.fnOnUserActionHandler);
	    this.canvas = this.setCanvasType(model.getProperty(ModelPropID.canvasType));
	    this.fnSpeed();
	    this.keyboard = new Keyboard({
	      view: this.view,
	      fnOnEscapeHandler: this.fnOnEscapeHandler
	    });
	    if (this.model.getProperty(ModelPropID.showKbd)) {
	      this.getVirtualKeyboard();
	    }
	    this.runtime = this.engine.createRuntime({
	      canvas: this.canvas,
	      keyboard: this.keyboard,
	      sound: this.sound,
	      randomMode: model.getProperty(ModelPropID.random),
	      arrayBounds: model.getProperty(ModelPropID.arrayBounds),
	      basicVersion: model.getProperty(ModelPropID.basicVersion),
	      trace: model.getProperty(ModelPropID.trace),
	      implicitLines: model.getProperty(ModelPropID.implicitLines),
	      integerOverflow: model.getProperty(ModelPropID.integerOverflow),
	      prettyLowercaseVars: model.getProperty(ModelPropID.prettyLowercaseVars),
	      onClickKey: this.fnPutKeyInBufferHandler,
	      outputError: this.outputError.bind(this),
	      onJsError: (error) => {
	        this.selectJsError(this.getOutputText(), error);
	      },
	      logger: UiUtils.console,
	      onVariablesCleared: () => {
	        this.uiController.refreshVariables();
	      },
	      onTokenized: (sourceLength, tokenLength) => {
	        if (UiUtils.debug) {
	          UiUtils.console.debug("parse: input length:", sourceLength, ", tokenized length:", tokenLength);
	        }
	      },
	      onMemoryError: (error) => {
	        UiUtils.console.error("vmPutProgramInMem", error);
	      },
	      programHost: {
	        getSource: () => this.getInputText(),
	        beforeCompileProgram: (source) => {
	          this.updateUserKeys(source);
	        },
	        prepareCompileOutput: (output) => this.presentCompileOutput(output),
	        beforeProgramStart: () => {
	          this.beforeProgramStart();
	        },
	        afterProgramStart: () => {
	          this.afterProgramStart();
	        }
	      },
	      handlers: Object.fromEntries(Object.entries(this.handlers).map(([reason, handler]) => [reason, handler.bind(this)])),
	      getInitialDelay: () => this.initialLoopTimeout,
	      setTimeout: (callback, delay) => this.host.setTimeout(callback, delay),
	      onExit: () => {
	        this.exitLoop();
	      },
	      onExecutionState: (state) => {
	        this.uiController.onExecutionState(state);
	        options.onExecutionState?.(state);
	      },
	      onUnknownReason: (reason) => {
	        UiUtils.console.warn("runLoop: Unknown run mode:", reason);
	      }
	    });
	    this.variables = this.runtime.variables;
	    this.vm = this.runtime.vm;
	    const onCanvasClick = (event, x, y, xTxt, yTxt) => {
	      const handler = this.vm.getOnCanvasClickHandler();
	      handler(x, y, xTxt, yTxt, event.detail === 2);
	    };
	    this.vmOnCanvasClickHandler = onCanvasClick;
	    this.vm.getOnCanvasClickHandler();
	    this.canvas.setOptions({
	      onCanvasClick
	    });
	    this.vm.setCanvas(this.canvas);
	    this.runtime.reset();
	    if (model.getProperty(ModelPropID.sound)) {
	      this.setSoundActive();
	    }
	    this.initDropZone();
	    const example = model.getProperty(ModelPropID.example);
	    view.setSelectValue(ViewID.exampleSelect, example);
	    this.setDatabaseSelectOptions();
	    this.hasStorageDatabase = this.getHasStorageDatabase();
	    if (model.getProperty(ModelPropID.showCpc)) {
	      this.canvas.startUpdateCanvas();
	    }
	    if (model.getProperty(ModelPropID.dragElements)) {
	      this.fnDragElementsActive(true);
	    }
	  }
	  getStorage() {
	    return this.host.storage;
	  }
	  getCanvas() {
	    return this.canvas;
	  }
	  getHasStorageDatabase() {
	    const databases = this.model.getAllDatabases();
	    let hasStorageDatabase = false;
	    for (const value in databases) {
	      if (Object.prototype.hasOwnProperty.call(databases, value)) {
	        if (value === "storage") {
	          hasStorageDatabase = true;
	        }
	      }
	    }
	    return hasStorageDatabase;
	  }
	  onUserAction() {
	    this.uiController.deactivateUserAction();
	    this.sound.setActivatedByUser();
	    this.setSoundActive();
	  }
	  setDatabaseSelectOptions() {
	    const items = [], databases = this.model.getAllDatabases(), database = this.model.getProperty(ModelPropID.database);
	    for (const value in databases) {
	      if (Object.prototype.hasOwnProperty.call(databases, value)) {
	        const db = databases[value], item = {
	          value,
	          text: db.text,
	          title: db.title,
	          selected: value === database
	        };
	        items.push(item);
	      }
	    }
	    this.view.setSelectOptions(ViewID.databaseSelect, items);
	  }
	  static getPathFromExample(example) {
	    const index = example.lastIndexOf("/");
	    let path = "";
	    if (index >= 0) {
	      path = example.substring(0, index);
	    }
	    return path;
	  }
	  static getNameFromExample(example) {
	    const index = example.lastIndexOf("/");
	    let name = example;
	    if (index >= 0) {
	      name = example.substring(index + 1);
	    }
	    return name;
	  }
	  setDirectorySelectOptions() {
	    const items = [], allExamples = this.model.getAllExamples(), examplePath = _Controller.getPathFromExample(this.model.getProperty(ModelPropID.example)), directorySeen = {};
	    for (const key in allExamples) {
	      if (Object.prototype.hasOwnProperty.call(allExamples, key)) {
	        const exampleEntry = allExamples[key], value = _Controller.getPathFromExample(exampleEntry.key);
	        if (!directorySeen[value]) {
	          const item = {
	            value,
	            text: value,
	            title: value,
	            selected: value === examplePath
	          };
	          items.push(item);
	          directorySeen[value] = true;
	        }
	      }
	    }
	    this.view.setSelectOptions(ViewID.directorySelect, items);
	  }
	  setExampleSelectOptions() {
	    const maxTitleLength = 160, maxTextLength = 60, items = [], exampleName = _Controller.getNameFromExample(this.model.getProperty(ModelPropID.example)), allExamples = this.model.getAllExamples(), directoryName = this.view.getSelectValue(ViewID.directorySelect), selectDataFiles = this.model.getProperty(ModelPropID.selectDataFiles);
	    let exampleSelected = false;
	    for (const key in allExamples) {
	      if (Object.prototype.hasOwnProperty.call(allExamples, key) && _Controller.getPathFromExample(key) === directoryName) {
	        const exampleEntry = allExamples[key], exampleName2 = _Controller.getNameFromExample(exampleEntry.key);
	        if (selectDataFiles || exampleEntry.meta !== "D") {
	          const title = (exampleName2 + ": " + exampleEntry.title).substring(0, maxTitleLength), item = {
	            value: exampleName2,
	            title,
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
	      items[0].selected = true;
	    }
	    this.view.setSelectOptions(ViewID.exampleSelect, items);
	  }
	  setGalleryAreaInputs() {
	    const database = this.model.getDatabase(), directory = this.view.getSelectValue(ViewID.directorySelect), options = this.view.getSelectOptions(ViewID.exampleSelect), inputs = [];
	    for (let i = 0; i < options.length; i += 1) {
	      const item = options[i], input = {
	        value: item.value,
	        title: item.title,
	        checked: item.selected,
	        imgUrl: database.src + "/" + directory + "/img/" + item.value + ".png"
	      };
	      inputs.push(input);
	    }
	    this.view.setAreaInputList(ViewID.galleryAreaItems, inputs);
	  }
	  setExportSelectOptions(select) {
	    const dirList = this.fnGetStorageDirectoryEntries(), items = [], editorText = _Controller.exportEditorText;
	    dirList.sort();
	    dirList.unshift(editorText);
	    for (let i = 0; i < dirList.length; i += 1) {
	      const key = dirList[i], title = key, item = {
	        value: key,
	        text: title,
	        title,
	        selected: title === editorText
	      };
	      items.push(item);
	    }
	    this.view.setSelectOptions(select, items);
	  }
	  updateStorageDatabase(action, key) {
	    if (!this.hasStorageDatabase) {
	      return;
	    }
	    const database = this.model.getProperty(ModelPropID.database), storage = this.getStorage();
	    let selectedExample = "", exampleChanged = false;
	    if (database !== "storage") {
	      this.model.setProperty(ModelPropID.database, "storage");
	    } else {
	      selectedExample = this.view.getSelectValue(ViewID.exampleSelect);
	    }
	    let dir;
	    if (!key) {
	      dir = this.fnGetStorageDirectoryEntries();
	      dir.sort();
	    } else {
	      dir = [key];
	    }
	    for (let i = 0; i < dir.length; i += 1) {
	      key = dir[i];
	      if (action === "remove") {
	        this.model.removeExample(key);
	      } else if (action === "set") {
	        let example = this.model.getExample(key);
	        if (selectedExample === "" || selectedExample === key) {
	          exampleChanged = true;
	        }
	        if (!example) {
	          const dataString = storage.getItem(key) || "", data = this.engine.files.splitMeta(dataString);
	          example = {
	            key,
	            title: "",
	            // or set key?
	            meta: data.meta.typeString
	            // currently we take only the type
	          };
	          this.model.setExample(example);
	        }
	      } else {
	        UiUtils.console.error("updateStorageDatabase: unknown action", action);
	      }
	    }
	    if (database === "storage") {
	      this.setDirectorySelectOptions();
	      if (exampleChanged) {
	        this.onDirectorySelectChange();
	      } else {
	        this.setExampleSelectOptions();
	      }
	    } else {
	      this.model.setProperty(ModelPropID.database, database);
	    }
	  }
	  removeKeyBoardHandler() {
	    this.keyboard.setOptions({
	      fnOnKeyDown: void 0
	    });
	  }
	  getInputText() {
	    return this.view.getAreaValue(ViewID.inputText);
	  }
	  setInputText(input, keepStack) {
	    this.view.setAreaValue(ViewID.inputText, input);
	    this.updateUserKeys(input);
	    if (!keepStack) {
	      this.fnInitUndoRedoButtons();
	    } else {
	      this.fnUpdateUndoRedoButtons();
	    }
	    this.options.onInputText?.(input, keepStack);
	  }
	  invalidateScript() {
	    this.runtime.invalidateProgram();
	  }
	  fnWaitForContinue() {
	    const stream = 0, key = this.keyboard.getKeyFromBuffer();
	    if (key !== "") {
	      this.vm.cursor(stream, 0);
	      this.removeKeyBoardHandler();
	      this.startContinue();
	    }
	  }
	  fnOnEscape() {
	    this.startEscape();
	  }
	  startEscape() {
	    const action = this.runtime.handleEscape(this.keyboard);
	    if (action === "ignored" || action === "input") {
	      this.updateResultText();
	      return;
	    }
	    if (action === "suspended") {
	      this.keyboard.setOptions({
	        fnOnKeyDown: this.fnWaitForContinueHandler
	      });
	    } else {
	      this.removeKeyBoardHandler();
	    }
	    this.startMainLoop();
	  }
	  fnWaitSound() {
	    this.runtime.handleWaitSound(this.sound.isActivatedByUser());
	  }
	  fnWaitKey() {
	    const key = this.runtime.handleWaitKey(
	      () => this.sound.isActivatedByUser(),
	      (key2) => {
	        UiUtils.console.log("Wait for key:", key2);
	      }
	    );
	    if (key !== "") {
	      this.removeKeyBoardHandler();
	    } else {
	      this.keyboard.setOptions({
	        fnOnKeyDown: this.fnWaitKeyHandler
	      });
	    }
	    return key;
	  }
	  fnWaitInput() {
	    const result = this.runtime.handleWaitInput({
	      onInvalid: (error) => this.outputError(error, true),
	      onInputReturn: (editedInput) => {
	        UiUtils.console.log("fnWaitInput:", editedInput, "reason", this.vm.vmGetStopObject().reason);
	      },
	      onInputSubmitted: () => {
	        this.removeKeyBoardHandler();
	      },
	      startMainLoop: () => {
	        this.startMainLoop();
	      },
	      continueExecution: () => {
	        this.startContinue();
	      }
	    });
	    if (result.status === "invalid") {
	      return;
	    }
	    if (result.status === "pending") {
	      if (result.reason === "waitInput") {
	        this.fnWaitSound();
	      }
	      this.keyboard.setOptions({
	        fnOnKeyDown: this.fnWaitInputHandler
	      });
	    }
	  }
	  // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	  mergeScripts(script1, script2) {
	    return this.runtime.mergeScripts(
	      script1,
	      script2,
	      this.model.getProperty(ModelPropID.implicitLines),
	      () => {
	        this.reportSplitLinesError();
	      }
	    );
	  }
	  // get line range from a script with sorted line numbers
	  fnGetLinesInRange(script, firstLine, lastLine) {
	    return this.runtime.getLinesInRangeFromScript(
	      script,
	      firstLine,
	      lastLine,
	      this.model.getProperty(ModelPropID.implicitLines),
	      () => {
	        this.reportSplitLinesError();
	      }
	    );
	  }
	  reportSplitLinesError() {
	    UiUtils.console.warn("splitLines: No line numbers?");
	    this.outputError(this.vm.vmComposeError(Error(), 21, "split"), true);
	  }
	  fnGetStorageDirectoryEntries(mask) {
	    return this.engine.files.getStorageDirectoryEntries(this.getStorage(), mask);
	  }
	  fnFileCat(paras) {
	    const stream = paras.stream, dirList = this.fnGetStorageDirectoryEntries();
	    this.runtime.printDirectoryEntries(dirList, stream, true);
	  }
	  fnFileDir(paras) {
	    const stream = paras.stream, example = this.model.getProperty(ModelPropID.example), dirList = this.engine.files.getDirectoryEntries(this.getStorage(), this.model.getAllExamples(), example, paras.fileMask);
	    this.runtime.printDirectoryEntries(dirList, stream, false);
	  }
	  fnFileEra(paras) {
	    this.runtime.eraseFiles(this.getFileHandler(), paras, (name) => {
	      if (UiUtils.debug > 0) {
	        UiUtils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
	      }
	    }, (name) => {
	      UiUtils.console.warn("fnEraseFile: file not found in localStorage:", name);
	    });
	  }
	  decodeTokenizedBasic(input) {
	    return this.runtime.basicTokenizer.decode(input);
	  }
	  prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons) {
	    const output = this.runtime.codeGeneratorBasic.generatePretty(input, keepWhiteSpace, keepBrackets, keepColons);
	    if (output.error) {
	      this.outputError(output.error);
	    }
	    return output.text;
	  }
	  loadFileContinue(input) {
	    const inFile = this.vm.vmGetInFileObject();
	    this.runtime.continueLoad(input, inFile, {
	      decode: (storedInput) => this.engine.files.decodeStoredFile(storedInput, {
	        atobFn: (value) => this.host.atobFn(value),
	        decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value),
	        applySnapshot: (value) => this.runtime.applySnapshot(value),
	        importArchive: (value, type) => {
	          const imported = [];
	          this.getFileHandler().fnLoad2(value, inFile.name, type, imported);
	          return imported;
	        }
	      }),
	      getSource: () => this.getInputText(),
	      setSource: (source) => {
	        this.setInputText(source);
	      },
	      clearResult: () => {
	        this.setResultText("");
	      },
	      merge: (source, loaded) => this.mergeScripts(source, loaded),
	      invalidate: () => {
	        this.invalidateScript();
	      },
	      removeVariables: () => {
	        this.fnRemoveAllVariables();
	      },
	      reset: () => {
	        this.fnReset();
	      },
	      parseRun: () => {
	        this.fnParseRun();
	      },
	      parseChain: () => {
	        this.fnParseChain();
	      },
	      onUnknownCommand: (value) => {
	        UiUtils.console.error("loadExample: Unknown command:", value);
	      },
	      startMainLoop: () => {
	        this.startMainLoop();
	      },
	      onWarning: (error) => {
	        UiUtils.console.warn(error);
	      },
	      onError: (message) => {
	        UiUtils.console.error(message);
	      },
	      decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value)
	    });
	  }
	  createFnExampleLoaded(example, url, inFile) {
	    return (_sFullUrl, key, suppressLog) => {
	      if (key !== example) {
	        UiUtils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
	      }
	      const exampleEntry = this.model.getExample(example);
	      if (!suppressLog) {
	        UiUtils.console.log("Example", url, (exampleEntry.meta ? exampleEntry.meta + " " : "") + "loaded");
	      }
	      this.model.setProperty(ModelPropID.example, inFile.memorizedExample);
	      const input = exampleEntry.script;
	      this.runtime.completeExampleLoad(input, exampleEntry.rsx, (loadedInput) => {
	        this.loadFileContinue(loadedInput);
	      });
	    };
	  }
	  createFnExampleError(example, url, inFile) {
	    return () => {
	      UiUtils.console.log("Example", url, "error");
	      this.model.setProperty(ModelPropID.example, inFile.memorizedExample);
	      this.runtime.failExampleLoad(example, (error, noSelection) => this.outputError(error, noSelection), (input) => {
	        this.loadFileContinue(input);
	      });
	    };
	  }
	  getLoadScript() {
	    return this.host.loadScript;
	  }
	  getOutputText() {
	    return this.outScript;
	  }
	  setOutputText(text) {
	    this.outScript = text;
	    this.invalidateScript();
	    this.view.setAreaValue(ViewID.outputText, text);
	    if (this.options.onOutputText) {
	      this.options.onOutputText(text);
	    }
	  }
	  setResultText(text, scroll = false) {
	    this.view.setAreaValue(ViewID.resultText, text);
	    if (this.options.onResultText) {
	      this.options.onResultText(text);
	    }
	    if (scroll) {
	      this.view.setAreaScrollTop(ViewID.resultText);
	    }
	  }
	  loadExampleFile() {
	    const inFile = this.vm.vmGetInFileObject(), key = this.model.getProperty(ModelPropID.example), plan = this.engine.files.prepareExampleLoad(inFile.name, key, this.model.getAllExamples(), this.model.getDatabase().src), example = plan.name, exampleEntry = plan.entry, url = plan.url;
	    inFile.memorizedExample = plan.memorizedExample;
	    if (UiUtils.debug > 0) {
	      UiUtils.console.debug("loadExample: name=" + example + " (current=" + key + ")");
	    }
	    if (plan.status === "loaded" && exampleEntry) {
	      this.model.setProperty(ModelPropID.example, example);
	      const fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);
	      fnExampleLoaded("", example, true);
	    } else if (plan.status === "fetch" && exampleEntry) {
	      this.model.setProperty(ModelPropID.example, example);
	      this.getLoadScript()(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
	    } else {
	      if (example !== "") {
	        UiUtils.console.warn("loadExample: Unknown file:", example);
	        const fnExampleError = this.createFnExampleError(example, url, inFile);
	        fnExampleError();
	      } else {
	        this.model.setProperty(ModelPropID.example, example);
	        this.runtime.completeExampleLoad("", void 0, (input) => {
	          this.loadFileContinue(input);
	        });
	      }
	    }
	  }
	  tryLoadingFromLocalStorage(name) {
	    return this.engine.files.loadFromStorage(this.getStorage(), name);
	  }
	  fnFileLoad() {
	    const inFile = this.vm.vmGetInFileObject();
	    this.runtime.dispatchFileLoad(inFile, {
	      deleteLines: (paras) => {
	        this.fnDeleteLines(paras);
	      },
	      logFile: (file) => {
	        if (UiUtils.debug > 1) {
	          UiUtils.console.debug("fnFileLoad:", file.command, file.name, "details:", file);
	        }
	      },
	      loadFromStorage: (name) => this.tryLoadingFromLocalStorage(name),
	      onStorageLoad: (input) => {
	        if (UiUtils.debug > 0) {
	          UiUtils.console.debug("fnFileLoad:", inFile.command, inFile.name, "from localStorage");
	        }
	        this.loadFileContinue(input);
	      },
	      loadExample: () => {
	        this.loadExampleFile();
	      },
	      onNotOpen: (name) => {
	        UiUtils.console.error("fnFileLoad:", name, "File not open!");
	      },
	      setNextDelay: (delay) => {
	        this.runtime.setNextDelay(delay);
	      }
	    });
	  }
	  fnFileSave() {
	    const outFile = this.vm.vmGetOutFileObject();
	    this.runtime.dispatchFileSave(
	      outFile,
	      (file) => this.getFileHandler().saveFile(file, () => this.getInputText(), (input, storageName) => this.runtime.encodeTokenizedBasic(input, storageName)).data,
	      (name) => {
	        if (UiUtils.debug > 0) {
	          UiUtils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
	        }
	      },
	      () => {
	        UiUtils.console.error("fnFileSave: file not open!");
	      },
	      (error) => {
	        UiUtils.console.warn(error);
	      }
	    );
	  }
	  fnDeleteLines(paras) {
	    const inputText = this.getInputText(), lines = this.fnGetLinesInRange(inputText, paras.first || 0, paras.last || 65535);
	    this.runtime.deleteProgramLines(
	      paras,
	      lines,
	      (deletion) => {
	        this.setInputText(this.mergeScripts(inputText, deletion));
	      },
	      (error) => this.outputError(error, true)
	    );
	  }
	  fnNew() {
	    this.runtime.newProgram(
	      () => {
	        this.setInputText("");
	      },
	      () => {
	        this.invalidateScript();
	      }
	    );
	  }
	  fnList(paras) {
	    const input = this.getInputText(), stream = paras.stream, lines = this.fnGetLinesInRange(input, paras.first || 0, paras.last || 65535);
	    this.runtime.listProgram(lines, stream);
	  }
	  fnReset() {
	    this.runtime.resetProgram(
	      () => this.virtualKeyboard?.reset(),
	      () => {
	        this.setOutputText("");
	      },
	      () => {
	        this.invalidateScript();
	      }
	    );
	  }
	  outputError(error, noSelection) {
	    const stream = 0, diagnostic = this.engine.createDiagnostic(error, noSelection, error.name === "CpcVm" ? this.vm.err() : void 0), shortError = diagnostic.shortMessage;
	    this.uiController.onDiagnostic(diagnostic);
	    this.options.onDiagnostic?.(diagnostic);
	    const escapedShortError = this.engine.escapeControlCharacters(shortError);
	    this.vm.print(stream, escapedShortError + "\r\n");
	    return shortError;
	  }
	  fnRenumLines(paras) {
	    this.runtime.renumProgram(
	      this.getInputText(),
	      paras,
	      (source, newLine, oldLine, step, keep) => this.runtime.basicFormatter.renumber(source, newLine, oldLine, step, keep),
	      (source) => {
	        this.fnPutChangedInputOnStack();
	        this.setInputText(source, true);
	        this.fnPutChangedInputOnStack();
	      },
	      (error) => {
	        UiUtils.console.warn(error);
	        this.outputError(error);
	      }
	    );
	  }
	  fnEditLineCallback() {
	    const inputParas = this.vm.vmGetStopObject().paras, inputText = this.getInputText();
	    return this.runtime.commitEditedLine(
	      inputParas,
	      inputText,
	      (source, edited) => this.mergeScripts(source, edited),
	      (source) => {
	        this.setInputText(source);
	      },
	      () => {
	        this.uiController.onProgramEdited();
	      }
	    );
	  }
	  fnEditLine(paras) {
	    const input = this.getInputText(), lineNumber = paras.first || 0, lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
	    if (this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler, (error) => this.outputError(error))) {
	      this.fnWaitInput();
	    }
	  }
	  presentCompileOutput(output) {
	    let outputString;
	    if (output.error) {
	      outputString = this.outputError(output.error);
	    } else {
	      outputString = output.text;
	    }
	    if (outputString && outputString.length > 0) {
	      outputString += "\n";
	    }
	    this.setOutputText(outputString);
	    this.invalidateScript();
	    this.uiController.refreshVariables();
	    this.uiController.onVarSelectChange();
	    return this.getOutputText();
	  }
	  fnParseAndStart(clearVariables, clearBeforeRun) {
	    this.runtime.compileAndStartProgram({
	      clearVariables,
	      clearBeforeRun
	    });
	  }
	  fnPretty() {
	    const input = this.getInputText(), keepWhiteSpace = this.view.getInputChecked(ViewID.prettySpaceInput), keepBrackets = this.view.getInputChecked(ViewID.prettyBracketsInput), keepColons = this.view.getInputChecked(ViewID.prettyColonsInput), output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);
	    if (output) {
	      this.fnPutChangedInputOnStack();
	      this.setInputText(output, true);
	      this.fnPutChangedInputOnStack();
	      const diff = this.runtime.formatDiff(input, output);
	      this.setOutputText(diff);
	    }
	  }
	  fnAddLines() {
	    const input = this.getInputText(), output = this.runtime.addLineNumbers(input);
	    if (output) {
	      this.fnPutChangedInputOnStack();
	      this.setInputText(output, true);
	      this.fnPutChangedInputOnStack();
	    }
	  }
	  fnRemoveLines() {
	    const input = this.getInputText(), output = this.runtime.basicFormatter.removeUnusedLines(input);
	    if (output.error) {
	      this.outputError(output.error);
	    } else {
	      this.fnPutChangedInputOnStack();
	      this.setInputText(output.text, true);
	      this.fnPutChangedInputOnStack();
	    }
	  }
	  fnGetFilename(input) {
	    let name = "file";
	    const reRemMatcher = /^\d* ?(?:REM|rem) ([\w.]+)+/, matches = input.match(reRemMatcher);
	    if (matches !== null) {
	      name = matches[1];
	    } else {
	      const example = this.model.getProperty(ModelPropID.example);
	      if (example !== "") {
	        if (example.indexOf("/") >= 0) {
	          name = example.substring(example.lastIndexOf("/") + 1);
	        }
	      }
	    }
	    if (name.indexOf(".") < 0) {
	      name += ".bas";
	    }
	    return name;
	  }
	  // eslint-disable-next-line complexity
	  fnDownload() {
	    const options = this.view.getSelectOptions(ViewID.exportFileSelect), exportTokenized = this.view.getInputChecked(ViewID.exportTokenizedInput), exportDSK = this.view.getInputChecked(ViewID.exportDSKInput), format = this.view.getSelectValue(ViewID.exportDSKFormatSelect), stripEmpty = this.view.getInputChecked(ViewID.exportDSKStripEmptyInput), exportBase64 = this.view.getInputChecked(ViewID.exportBase64Input), editorText = _Controller.exportEditorText, meta = {
	      typeString: "A",
	      // ASCII
	      start: 368,
	      length: 0,
	      entry: 0
	    };
	    let name = "", data = "";
	    const fileHandler = this.getFileHandler();
	    const fnExportBase64 = () => {
	      meta.encoding = "base64";
	      const metaString = this.engine.files.joinMeta(meta);
	      data = metaString + "," + this.host.btoaFn(data);
	      name += ".b64.txt";
	    };
	    if (exportDSK) {
	      fileHandler.startDiskImage(format);
	    }
	    for (let i = 0; i < options.length; i += 1) {
	      const item = options[i];
	      if (item.selected) {
	        if (item.value === editorText) {
	          data = this.getInputText();
	          name = this.fnGetFilename(data);
	          const eolStr = data.indexOf("\r\n") > 0 ? "\r\n" : "\n";
	          if (eolStr === "\n") {
	            data = data.replace(/\n/g, "\r\n");
	          }
	          meta.typeString = "A";
	          meta.start = 368;
	          meta.length = data.length;
	          meta.entry = 0;
	        } else {
	          name = item.value;
	          data = this.tryLoadingFromLocalStorage(name) || "";
	          const metaAndData = this.engine.files.splitMeta(data);
	          Object.assign(meta, metaAndData.meta);
	          data = metaAndData.data;
	        }
	        if (exportTokenized && meta.typeString === "A") {
	          const tokens = this.runtime.encodeTokenizedBasic(data);
	          if (tokens) {
	            data = tokens;
	            meta.typeString = "T";
	            meta.start = 368;
	            meta.length = data.length;
	            meta.entry = 0;
	          } else {
	            UiUtils.console.warn("Controller: Cannot tokenize, keeping ASCII: " + item.value);
	          }
	        }
	        if (exportDSK) {
	          data = fileHandler.addFileToDiskImage(name, data, meta);
	          name = name.substring(0, name.indexOf(".") + 1) + "dsk";
	          meta.length = data.length;
	          meta.typeString = "X";
	        } else {
	          data = fileHandler.prepareAmsdosFile(name, data, meta);
	          if (exportBase64) {
	            fnExportBase64();
	          }
	          if (data) {
	            this.view.fnDownloadBlob(data, name);
	          }
	        }
	      }
	    }
	    if (exportDSK) {
	      data = fileHandler.getDiskImageData(stripEmpty);
	      if (exportBase64) {
	        fnExportBase64();
	      }
	      if (data) {
	        this.view.fnDownloadBlob(data, name);
	      }
	    }
	  }
	  selectJsError(script, e) {
	    const firefoxError = e, lineNumber = firefoxError.lineNumber, columnNumber = firefoxError.columnNumber;
	    if (lineNumber || columnNumber) {
	      const errLine = Number(lineNumber) - 3;
	      let pos = 0, line = 0;
	      while (pos < script.length && line < errLine) {
	        pos = script.indexOf("\n", pos) + 1;
	        line += 1;
	      }
	      pos += Number(columnNumber);
	      UiUtils.console.warn("Info: JS Error occurred at line", lineNumber, "column", columnNumber, "pos", pos);
	      this.view.setAreaSelection(ViewID.outputText, pos, pos + 1);
	    }
	  }
	  fnChain(paras, clearBeforeRun = false) {
	    const script = this.getOutputText(), line = paras && paras.first || 0;
	    this.runtime.startProgram(script, line, clearBeforeRun);
	  }
	  beforeProgramStart() {
	    if (this.vm.vmGetOutFileObject().open) {
	      this.fnFileSave();
	    }
	  }
	  afterProgramStart() {
	    if (!this.inputSet) {
	      this.inputSet = true;
	      const input = this.model.getProperty(ModelPropID.input);
	      if (input !== "") {
	        this.view.setAreaValue(ViewID.inp2Text, input);
	        const timeout = 1;
	        this.host.setTimeout(() => {
	          this.startEnter();
	          this.view.setAreaValue(ViewID.inp2Text, "");
	        }, timeout);
	      }
	    }
	    if (UiUtils.debug > 1) {
	      UiUtils.console.debug("End of fnRun");
	    }
	  }
	  fnRun(paras) {
	    this.fnChain(paras, true);
	  }
	  fnParseRun() {
	    this.fnParseAndStart(true, true);
	  }
	  fnParseChain() {
	    this.fnParseAndStart(false, false);
	  }
	  fnDirectInput() {
	    const directInput = this.runtime.readDirectInput(), { input, stream } = directInput;
	    if (input !== "") {
	      const inputText = this.getInputText();
	      if (directInput.isProgramLine) {
	        if (UiUtils.debug > 0) {
	          UiUtils.console.debug("fnDirectInput: insert line=" + input);
	        }
	        this.runtime.insertDirectProgramLine(
	          inputText,
	          input,
	          stream,
	          (source, line) => this.mergeScripts(source, line),
	          (source) => {
	            this.setInputText(source, true);
	          },
	          () => {
	            this.uiController.onProgramEdited();
	          }
	        );
	        this.updateResultText();
	        return false;
	      }
	      if (UiUtils.debug > 0) {
	        UiUtils.console.log("fnDirectInput: execute:", input);
	      }
	      const output = this.runtime.executeDirectCommand(input, inputText, this.vm.line, stream, directInput.message, {
	        outputError: (error) => this.outputError(error, true),
	        setOutputText: (text) => {
	          this.setOutputText(text);
	        },
	        onPrepareError: (error) => {
	          UiUtils.console.error(error);
	          if (error instanceof Error) {
	            this.outputError(error, true);
	          }
	        }
	      });
	      if (!output.error) {
	        this.updateResultText();
	        return true;
	      }
	    }
	    this.updateResultText();
	    return false;
	  }
	  startWithDirectInput() {
	    if (this.options.isHeadlessDirectInput) {
	      this.stopUpdateCanvas();
	      if (UiUtils.debug) {
	        UiUtils.console.log("We are ready.");
	      }
	      if (this.options.onProgramEnd) {
	        this.options.onProgramEnd();
	      }
	      return;
	    }
	    this.runtime.enterDirectMode(this.fnDirectInputHandler);
	    this.fnWaitInput();
	  }
	  updateResultText() {
	    const outText = this.vm.vmGetOutBuffer();
	    this.setResultText(outText, true);
	  }
	  exitLoop() {
	    const stop = this.vm.vmGetStopObject(), reason = stop.reason;
	    this.updateResultText();
	    this.uiController.refreshVariables();
	    this.uiController.onVarSelectChange();
	    if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
	      this.startWithDirectInput();
	    }
	  }
	  getExecutionState() {
	    return this.runtime.getExecutionState();
	  }
	  startMainLoop() {
	    this.runtime.startMainLoop();
	  }
	  startParse() {
	    this.runtime.beginControl("parse", () => {
	      this.removeKeyBoardHandler();
	    });
	    this.startMainLoop();
	  }
	  startRenum(options = this.uiController.getRenumOptions()) {
	    const stream = 0;
	    this.runtime.beginRenumber(options);
	    if (this.vm.pos(stream) > 1) {
	      this.vm.print(stream, "\r\n");
	    }
	    this.vm.print(stream, "renum\r\n");
	    this.startMainLoop();
	  }
	  startRun() {
	    this.runtime.beginControl("run", () => {
	      this.removeKeyBoardHandler();
	    });
	    this.startMainLoop();
	  }
	  startParseRun() {
	    this.runtime.beginControl("parseRun", () => {
	      this.removeKeyBoardHandler();
	    });
	    this.startMainLoop();
	  }
	  startBreak() {
	    this.runtime.beginControl("break", () => {
	      this.removeKeyBoardHandler();
	    });
	    this.startMainLoop();
	  }
	  restoreSuspendedInputHandlers(stop) {
	    switch (stop.reason) {
	      case "waitInput":
	        this.vm.cursor(stop.paras.stream, 1);
	        this.keyboard.setOptions({
	          fnOnKeyDown: this.fnWaitInputHandler
	        });
	        break;
	      case "waitKey":
	        this.keyboard.setOptions({
	          fnOnKeyDown: this.fnWaitKeyHandler
	        });
	        break;
	    }
	  }
	  startContinue() {
	    this.view.setDisabled(ViewID.runButton, true);
	    this.view.setDisabled(ViewID.stopButton, false);
	    this.view.setDisabled(ViewID.continueButton, true);
	    this.runtime.continueProgram(
	      () => {
	        this.startMainLoop();
	      },
	      () => {
	        this.removeKeyBoardHandler();
	      },
	      (restored) => {
	        const stop = this.vm.vmGetStopObject();
	        if (restored || stop.reason === "waitInput") {
	          this.restoreSuspendedInputHandlers(stop);
	        }
	      }
	    );
	  }
	  startReset() {
	    this.runtime.beginControl("reset", () => {
	      this.removeKeyBoardHandler();
	    });
	    this.startMainLoop();
	  }
	  startScreenshot() {
	    return this.canvas.takeScreenShot();
	  }
	  putKeys(keys) {
	    this.fnPutKeysInBuffer(keys);
	  }
	  fnPutKeysInBuffer(keys) {
	    for (let i = 0; i < keys.length; i += 1) {
	      this.keyboard.putKeyInBuffer(keys.charAt(i));
	    }
	    const options = this.keyboard.getOptions(), keyDownHandler = options.fnOnKeyDown;
	    if (keyDownHandler) {
	      keyDownHandler();
	    }
	  }
	  static parseUserKeys(source) {
	    const keys = [];
	    for (const [index, line] of source.split(/\r?\n/).entries()) {
	      const declaration = /^\s*(?:\d+\s*)?(?:REM\s+|'\s*)CPCBasic-keys:\s*(\[.*\])\s*$/i.exec(line);
	      if (!declaration) {
	        continue;
	      }
	      let items;
	      try {
	        items = JSON.parse(declaration[1]);
	      } catch (error) {
	        UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid JSON", error);
	        continue;
	      }
	      if (!Array.isArray(items) || items.length % 2 !== 0) {
	        UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Expected key/label pairs");
	        continue;
	      }
	      for (let i = 0; i < items.length; i += 2) {
	        const key = items[i], label = items[i + 1];
	        let code, text;
	        if (typeof key === "string" && key.length) {
	          code = key.charCodeAt(0);
	        } else if (typeof key === "number" && Number.isInteger(key) && key >= 0 && key <= 65535) {
	          code = key;
	        } else {
	          UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid key", key);
	          continue;
	        }
	        if (typeof label === "string") {
	          text = label;
	        } else if (typeof label === "number" && Number.isInteger(label) && label >= 0 && label <= 65535) {
	          text = String.fromCharCode(label);
	        } else {
	          UiUtils.console.warn("CPCBasic-keys at line " + (index + 1) + ": Invalid label", label);
	          continue;
	        }
	        keys.push({
	          code,
	          text: text || String.fromCharCode(code)
	        });
	      }
	    }
	    return keys;
	  }
	  updateUserKeys(source) {
	    const container = View.getElementById1(ViewID.userKeys), keys = _Controller.parseUserKeys(source);
	    while (container.firstChild) {
	      container.removeChild(container.firstChild);
	    }
	    for (const item of keys) {
	      const button = document.createElement("button"), text = item.text || String.fromCharCode(item.code);
	      button.type = "button";
	      button.textContent = text;
	      button.setAttribute("data-key", String(item.code));
	      button.setAttribute("aria-label", text);
	      button.title = text + " (" + item.code + ")";
	      container.appendChild(button);
	    }
	    container.hidden = !keys.length;
	  }
	  onUserKeyClick(event) {
	    const target = View.getEventTarget(event);
	    if (target.tagName === "BUTTON") {
	      const code = Number(target.getAttribute("data-key"));
	      if (Number.isInteger(code) && code >= 0 && code <= 65535) {
	        this.fnPutKeysInBuffer(String.fromCharCode(code));
	      }
	    }
	  }
	  startEnter() {
	    let input = this.view.getAreaValue(ViewID.inp2Text);
	    input = input.replace(/\n/g, "\r");
	    this.fnPutKeysInBuffer(input);
	  }
	  static generateFunction(par, functionString) {
	    if (functionString.startsWith("function anonymous(")) {
	      const firstIndex = functionString.indexOf("{"), lastIndex = functionString.lastIndexOf("}");
	      if (firstIndex >= 0 && lastIndex >= 0) {
	        functionString = functionString.substring(firstIndex + 1, lastIndex - 1);
	      }
	      functionString = functionString.trim();
	    } else {
	      functionString = "var o=cpcBasic.controller.vm, v=o.vmGetAllVariables(); v." + par + " = " + functionString;
	    }
	    const match = /function \(([^)]*)/.exec(functionString), args = match ? match[1].split(",") : [], fnFunction = new Function(args[0], args[1], args[2], args[3], args[4], functionString);
	    return fnFunction;
	  }
	  changeVariable() {
	    const par = this.view.getSelectValue(ViewID.varSelect), valueString = this.view.getSelectValue(ViewID.varText), variables = this.variables;
	    let value = variables.getVariable(par);
	    if (typeof value === "function") {
	      value = _Controller.generateFunction(par, valueString);
	      variables.setVariable(par, value);
	    } else {
	      const varType = this.variables.determineStaticVarType(par), type = this.vm.vmDetermineVarType(varType);
	      if (type !== "$") {
	        value = parseFloat(valueString);
	      } else {
	        value = valueString;
	      }
	      try {
	        const value2 = this.vm.vmAssign(varType, value);
	        variables.setVariable(par, value2);
	        UiUtils.console.log("Variable", par, "changed:", variables.getVariable(par), "=>", value);
	      } catch (e) {
	        UiUtils.console.warn(e);
	      }
	    }
	    this.uiController.refreshVariables();
	    this.uiController.onVarSelectChange();
	  }
	  setBasicVersion(basicVersion) {
	    this.runtime.setBasicVersion(basicVersion);
	    this.invalidateScript();
	  }
	  setPalette(palette) {
	    const validPalette = palette === "green" || palette === "grey" ? palette : "color";
	    this.canvas.setOptions({
	      palette: validPalette
	    });
	  }
	  setCanvasType(canvasType) {
	    let canvas = this.canvas;
	    if (canvas) {
	      canvas.stopUpdateCanvas();
	      const canvasID = canvas.getOptions().canvasID;
	      this.view.setHidden(canvasID, true);
	    } else if (canvasType !== "graphics") {
	      this.view.setHidden(ViewID.cpcCanvas, true);
	    }
	    const palette = this.model.getProperty(ModelPropID.palette);
	    if (this.canvases[canvasType]) {
	      canvas = this.canvases[canvasType];
	      this.canvas = canvas;
	      this.setPalette(palette);
	    } else {
	      const validPalette = palette === "green" || palette === "grey" ? palette : "color";
	      if (canvasType === "text") {
	        canvas = new TextCanvas({
	          canvasID: ViewID.textText,
	          charset: cpcCharset,
	          palette: validPalette
	        });
	      } else if (canvasType === "none") {
	        canvas = new NoCanvas({
	          canvasID: ViewID.noCanvas,
	          charset: cpcCharset,
	          palette: validPalette
	        });
	      } else {
	        const isAreaHidden = this.view.getHidden(ViewID.cpcArea);
	        if (isAreaHidden) {
	          this.uiController.toggleAreaHiddenById("change", ViewID.showCpcInput);
	        }
	        this.view.setHidden(ViewID.cpcCanvas, false);
	        canvas = new Canvas({
	          canvasID: ViewID.cpcCanvas,
	          charset: cpcCharset,
	          palette: validPalette
	        });
	        if (isAreaHidden) {
	          this.uiController.toggleAreaHiddenById("change", ViewID.showCpcInput);
	        }
	      }
	      this.canvases[canvasType] = canvas;
	      this.canvas = canvas;
	    }
	    if (this.vm) {
	      this.canvas.setOptions({
	        onCanvasClick: this.vmOnCanvasClickHandler
	      });
	      this.vm.setCanvas(canvas);
	    }
	    const canvasId = canvas.getOptions().canvasID;
	    this.view.setHidden(canvasId, false);
	    if (this.model.getProperty(ModelPropID.showCpc)) {
	      this.canvas.startUpdateCanvas();
	    }
	    return canvas;
	  }
	  setSoundActive() {
	    const sound = this.sound, active = this.model.getProperty(ModelPropID.sound);
	    if (active) {
	      sound.soundOn();
	    } else {
	      sound.soundOff();
	      const stop = this.vm && this.vm.vmGetStopObject();
	      if (stop && stop.reason === "waitSound") {
	        this.vm.vmStop("", 0, true);
	      }
	    }
	  }
	  getZ80Disass() {
	    if (!this.z80Disass) {
	      const dataArr = this.vm.vmGetMem(), data = dataArr;
	      this.z80Disass = new Z80Disass({
	        data,
	        addr: 0
	      });
	    }
	    return this.z80Disass;
	  }
	  setDisassAddr(addr, endAddr) {
	    const z80Disass = this.getZ80Disass();
	    if (endAddr === void 0) {
	      endAddr = addr + 256;
	    }
	    z80Disass.setOptions({
	      addr
	    });
	    const opts = z80Disass.getOptions(), lines = [];
	    while (addr < endAddr) {
	      lines.push(z80Disass.disassLine());
	      if (opts.addr > addr) {
	        addr = opts.addr;
	      } else {
	        UiUtils.console.error("setDisassAddr: Not increasing:", addr, opts.addr);
	        break;
	      }
	    }
	    const out = lines.join("\n") + "\n";
	    this.view.setAreaValue(ViewID.disassText, out);
	  }
	  fnEndOfImport(imported) {
	    const stream = 0, vm = this.vm;
	    for (let i = 0; i < imported.length; i += 1) {
	      vm.print(stream, imported[i], " ");
	    }
	    vm.print(stream, "\r\n", imported.length + " file" + (imported.length !== 1 ? "s" : "") + " imported.\r\n");
	    this.updateResultText();
	  }
	  static fnOnDragover(evt) {
	    evt.stopPropagation();
	    evt.preventDefault();
	    if (evt.dataTransfer !== null) {
	      evt.dataTransfer.dropEffect = "copy";
	    }
	  }
	  adaptFilename(name, err) {
	    return this.vm.vmAdaptFilename(name, err);
	  }
	  getFileHandler() {
	    if (!this.fileHandler) {
	      this.fileHandler = this.engine.createFileHandler({
	        adaptFilename: this.adaptFilename.bind(this),
	        updateStorageDatabase: this.updateStorageDatabase.bind(this),
	        outputError: this.outputError.bind(this),
	        processFileImports: this.model.getProperty(ModelPropID.processFileImports),
	        storage: this.getStorage()
	      });
	    }
	    return this.fileHandler;
	  }
	  getFileSelect(fileHandler) {
	    if (!this.fileSelect) {
	      this.fileSelect = new FileSelect({
	        fnEndOfImport: this.fnEndOfImport.bind(this),
	        fnLoad2: fileHandler.fnLoad2.bind(fileHandler)
	      });
	    }
	    return this.fileSelect;
	  }
	  initDropZone() {
	    const fileHandler = this.getFileHandler(), fileSelect = this.getFileSelect(fileHandler), dropZone = View.getElementById1(ViewID.dropZone);
	    dropZone.addEventListener("dragover", this.fnOnDragoverHandler, false);
	    fileSelect.addFileSelectHandler(dropZone, "drop");
	    const canvasID = this.canvas.getOptions().canvasID, canvasElement = View.getElementById1(canvasID);
	    canvasElement.addEventListener("dragover", this.fnOnDragoverHandler, false);
	    fileSelect.addFileSelectHandler(canvasElement, "drop");
	    const fileInput = View.getElementById1(ViewID.fileInput);
	    fileSelect.addFileSelectHandler(fileInput, "change");
	  }
	  fnUpdateUndoRedoButtons() {
	    this.view.setDisabled(ViewID.undoButton, !this.inputStack.canUndoKeepOne());
	    this.view.setDisabled(ViewID.undoButton2, !this.inputStack.canUndoKeepOne());
	    this.view.setDisabled(ViewID.redoButton, !this.inputStack.canRedo());
	    this.view.setDisabled(ViewID.redoButton2, !this.inputStack.canRedo());
	  }
	  fnInitUndoRedoButtons() {
	    this.inputStack.reset();
	    this.fnUpdateUndoRedoButtons();
	  }
	  fnPutChangedInputOnStack() {
	    const input = this.getInputText(), stackInput = this.inputStack.getInput();
	    if (stackInput !== input) {
	      this.inputStack.save(input);
	      this.fnUpdateUndoRedoButtons();
	    }
	  }
	  startUpdateCanvas() {
	    this.canvas.startUpdateCanvas();
	  }
	  stopUpdateCanvas() {
	    this.canvas.stopUpdateCanvas();
	  }
	  getDragElement() {
	    if (!this.dragElement) {
	      this.dragElement = new DragElement({
	        view: this.view,
	        entries: {}
	      });
	    }
	    return this.dragElement;
	  }
	  getVirtualKeyboard() {
	    if (!this.virtualKeyboard) {
	      this.virtualKeyboard = new VirtualKeyboard({
	        view: this.view,
	        fnPressCpcKey: this.keyboard.fnPressCpcKey.bind(this.keyboard),
	        fnReleaseCpcKey: this.keyboard.fnReleaseCpcKey.bind(this.keyboard)
	      });
	    }
	    return this.virtualKeyboard;
	  }
	  fnDragElementsActive(enabled) {
	    const dragElement = this.getDragElement(), dragElementsData = this.dragElementsData;
	    for (const entry in dragElementsData.entries) {
	      if (Object.prototype.hasOwnProperty.call(dragElementsData.entries, entry)) {
	        dragElementsData.entries[entry].enabled = enabled;
	      }
	    }
	    dragElement.setOptions(this.dragElementsData);
	  }
	  getVariableNames() {
	    return this.variables.getAllVariableNames();
	  }
	  getVariable(par) {
	    return this.variables.getVariable(par);
	  }
	  undoStackElement() {
	    return this.inputStack.undo();
	  }
	  redoStackElement() {
	    return this.inputStack.redo();
	  }
	  createFnDatabaseLoaded(url) {
	    return (_sFullUrl, key) => {
	      const selectedName = this.model.getProperty(ModelPropID.database);
	      if (selectedName === key) {
	        this.model.getDatabase().loaded = true;
	      } else {
	        UiUtils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
	        this.model.setProperty(ModelPropID.database, key);
	        const database = this.model.getDatabase();
	        if (database) {
	          database.loaded = true;
	        }
	        this.model.setProperty(ModelPropID.database, selectedName);
	      }
	      UiUtils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
	      this.setDirectorySelectOptions();
	      this.onDirectorySelectChange();
	    };
	  }
	  createFnDatabaseError(url) {
	    return (_sFullUrl, key) => {
	      UiUtils.console.error("fnDatabaseError: database error: " + key + ": " + url);
	      this.setDirectorySelectOptions();
	      this.onDirectorySelectChange();
	      this.setInputText("");
	      this.setResultText("Cannot load database: " + key);
	    };
	  }
	  onDatabaseSelectChange() {
	    const databaseName = this.view.getSelectValue(ViewID.databaseSelect);
	    this.view.setSelectTitleFromSelectedOption(ViewID.databaseSelect);
	    this.loadDatabase(databaseName);
	  }
	  loadDatabase(name) {
	    if (name !== void 0) {
	      this.model.setProperty(ModelPropID.database, name);
	    }
	    const databaseName = this.model.getProperty(ModelPropID.database);
	    const database = this.model.getDatabase();
	    if (!database) {
	      UiUtils.console.error("onDatabaseSelectChange: database not available:", databaseName);
	      return;
	    }
	    if (database.text === "storage") {
	      this.updateStorageDatabase("set", "");
	      database.loaded = true;
	    }
	    if (database.loaded) {
	      this.setDirectorySelectOptions();
	      this.onDirectorySelectChange();
	    } else {
	      this.setInputText("#loading database " + databaseName + "...");
	      const exampleIndex = this.model.getProperty(ModelPropID.exampleIndex), url = database.src + "/" + exampleIndex;
	      this.getLoadScript()(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
	    }
	  }
	  onDirectorySelectChange() {
	    this.setExampleSelectOptions();
	    this.onExampleSelectChange();
	  }
	  onExampleSelectChange() {
	    const directoryName = this.view.getSelectValue(ViewID.directorySelect);
	    let exampleName = this.view.getSelectValue(ViewID.exampleSelect);
	    if (directoryName) {
	      exampleName = directoryName + "/" + exampleName;
	    }
	    this.loadExample(exampleName);
	  }
	  loadExample(key, options = {}) {
	    const vm = this.vm, inFile = vm.vmGetInFileObject(), dataBaseName = this.model.getProperty(ModelPropID.database);
	    this.model.setProperty(ModelPropID.example, key);
	    vm.closein();
	    this.uiController.setPopoversHiddenExcept();
	    inFile.open = true;
	    const request = this.engine.files.createExampleLoadRequest(key, dataBaseName, this.model.getExample(key)?.meta, options.autorun ?? this.model.getProperty(ModelPropID.autorun));
	    inFile.command = request.command;
	    inFile.name = request.name;
	    inFile.start = void 0;
	    inFile.fnFileCallback = vm.vmGetLoadHandler();
	    vm.vmStop("fileLoad", 90);
	    this.startMainLoop();
	  }
	  // currently not used. Can be called manually: cpcBasic.controller.exportAsBase64(file);
	  exportAsBase64(storageName) {
	    const storage = this.getStorage();
	    let data = storage.getItem(storageName), out = "";
	    if (data !== null) {
	      const index = data.indexOf(",");
	      if (index >= 0) {
	        const meta = data.substring(0, index);
	        data = data.substring(index + 1);
	        data = this.host.btoaFn(data);
	        out = meta + ";base64," + data;
	      } else {
	        data = this.host.btoaFn(data);
	        out = "base64," + data;
	      }
	    }
	    UiUtils.console.log(out);
	    return out;
	  }
	  onCpcCanvasClick(event) {
	    this.uiController.setPopoversHiddenExcept();
	    this.canvas.onCanvasClick(event);
	    this.keyboard.setActive(true);
	  }
	  onWindowClick(event) {
	    this.canvas.onWindowClick(event);
	    this.keyboard.setActive(false);
	  }
	  fnArrayBounds() {
	    const arrayBounds = this.model.getProperty(ModelPropID.arrayBounds);
	    this.runtime.setArrayBounds(arrayBounds);
	  }
	  fnImplicitLines() {
	    const implicitLines = this.model.getProperty(ModelPropID.implicitLines);
	    this.runtime.setImplicitLines(implicitLines);
	  }
	  fnRemoveAllVariables() {
	    if (Object.keys(this.variables.getAllVariables()).length) {
	      this.variables.removeAllVariables();
	      this.uiController.refreshVariables();
	    }
	  }
	  fnPrettyLowercaseVars() {
	    const prettyLowercaseVars = this.model.getProperty(ModelPropID.prettyLowercaseVars);
	    this.runtime.setPrettyLowercaseVars(prettyLowercaseVars);
	  }
	  fnIntegerOverflow() {
	    const integerOverflow = this.model.getProperty(ModelPropID.integerOverflow);
	    this.runtime.setIntegerOverflow(integerOverflow);
	  }
	  fnTrace() {
	    const trace = this.model.getProperty(ModelPropID.trace);
	    this.runtime.setTrace(trace);
	  }
	  fnSpeed() {
	    const speed = this.model.getProperty(ModelPropID.speed);
	    this.initialLoopTimeout = this.engine.getLoopDelay(speed);
	  }
	  /* eslint-enable no-invalid-this */
	};
	_Controller.exportEditorText = "<editor>";
	let Controller = _Controller;

	class UI {
	  constructor() {
	    this.view = new View();
	    this.controller = {};
	  }
	  //private core = {} as ICore;
	  /*
	  	private static fnMapObjectProperties(arg: any) {
	  		if (typeof arg === "object") {
	  			const res = [];
	  
	  			for (const key in arg) { // eslint-disable-line guard-for-in
	  				const value = arg[key];
	  
	  				if (typeof value !== "object" && typeof value !== "function") {
	  					res.push(key + ": " + value);
	  				}
	  			}
	  			arg = String(arg) + "{" + res.join(", ") + "}";
	  		}
	  		return arg;
	  	}
	  	*/
	  static fnDecodeUri(s) {
	    let decoded = "";
	    try {
	      decoded = decodeURIComponent(s.replace(/\+/g, " "));
	    } catch (err) {
	      if (err instanceof Error) {
	        err.message += ": " + s;
	      }
	      console.error(err);
	    }
	    return decoded;
	  }
	  static parseUri(config) {
	    const urlQuery = window.location.search.substring(1);
	    const rSearch = /([^&=]+)=?([^&]*)/g;
	    const args = [];
	    let match;
	    while ((match = rSearch.exec(urlQuery)) !== null) {
	      const name = UI.fnDecodeUri(match[1]);
	      const value = UI.fnDecodeUri(match[2]);
	      if (value !== null && config[name] !== void 0) {
	        args.push(name + "=" + value);
	      }
	    }
	    return args;
	  }
	  /*
	  	private static createDebugUtilsConsole(cpcBasicLog: string) {
	  		const currentConsole = UiUtils.console;
	  
	  		return {
	  			consoleLog: {
	  				value: cpcBasicLog || "" // already something collected?
	  			},
	  			console: currentConsole,
	  			rawLog: function (fnMethod: (args: any) => void, level: string, args: any) {
	  				if (level) {
	  					args.unshift(level);
	  				}
	  				if (fnMethod) {
	  					if (fnMethod.apply) {
	  						fnMethod.apply(console, args);
	  					}
	  				}
	  				if (this.consoleLog) {
	  					this.consoleLog.value += args.map(UI.fnMapObjectProperties).join(" ") + ((level !== null) ? "\n" : "");
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
	  			changeLog: function (log: any) {
	  				const oldLog = this.consoleLog;
	  
	  				this.consoleLog = log;
	  				if (oldLog && oldLog.value && log) { // some log entires collected?
	  					log.value += oldLog.value; // take collected log entries
	  				}
	  			}
	  		};
	  	}
	  	*/
	  getCanvasVm() {
	    return this.controller?.getCanvas();
	  }
	  getCurrentDataKey() {
	    return document.currentScript && document.currentScript.getAttribute("data-key") || "";
	  }
	  onWindowLoadContinue(engine) {
	    const core = engine.core;
	    const model = core.getModel();
	    const config = model.getAllProperties();
	    const args = UI.parseUri(config);
	    core.parseArgs(args, config);
	    const debug = model.getProperty("debug");
	    if (debug) {
	      core.setDebug(debug);
	      UiUtils.setDebug(debug);
	    }
	    core.init();
	    const controllerOptions = {};
	    this.controller = new Controller(engine, this.view, controllerOptions);
	    this.controller.onDatabaseSelectChange();
	  }
	}

	exports.UI = UI;

}));
//# sourceMappingURL=cpcbasicUI.js.map
