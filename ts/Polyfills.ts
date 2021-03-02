// Polyfills.ts - Some Polyfills for old browsers, e.g. IE8, and nodeJS
//

/* globals globalThis */

import { Utils } from "./Utils";

export var Polyfills = {
	iCount: 0 //TTT
	// empty
};

// IE: window.console is only available when Dev Tools are open
if (!Utils.console) {
	const oUtilsConsole: any = {
		cpcBasicLog: "LOG:\n",
		log: function () { // varargs
			if (oUtilsConsole.cpcBasicLog) {
				oUtilsConsole.cpcBasicLog += Array.prototype.slice.call(arguments).join(" ") + "\n";
			}
		}
	};

	oUtilsConsole.info = oUtilsConsole.log;
	oUtilsConsole.warn = oUtilsConsole.log;
	oUtilsConsole.error = oUtilsConsole.log;
	oUtilsConsole.debug = oUtilsConsole.log;

	(Utils.console as any) = oUtilsConsole;
}

if (!Utils.console.debug) { // IE8 has no console.debug
	Utils.console.debug = Utils.console.log;
	Utils.console.debug("Polyfill: window.console.debug");
}

if ((typeof globalThis !== "undefined") && !globalThis.window) { // nodeJS
	Utils.console.debug("Polyfill: window");
	(globalThis.window as any) = {};
}

if (!Array.prototype.indexOf) { // IE8
	Array.prototype.indexOf = function (searchElement, iFrom?: number) { // eslint-disable-line no-extend-native
		const iLen = this.length >>> 0; // eslint-disable-line no-bitwise

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
	Utils.console.debug("Polyfill: Array.prototype.map");
	Array.prototype.map = function (callback, thisArg) { // eslint-disable-line no-extend-native,func-names
		const aValues = [],
			oObject = Object(this),
			len = oObject.length;
		let T;

		if (arguments.length > 1) {
			T = thisArg;
		}

		for (let i = 0; i < len; i += 1) {
			if (i in oObject) {
				const kValue = oObject[i],
					mappedValue = callback.call(T, kValue, i, oObject);

				aValues[i] = mappedValue;
			}
		}
		return aValues;
	};
}

if (window.Element) {
	if (!Element.prototype.addEventListener) { // IE8
		Utils.console.debug("Polyfill: Element.prototype.addEventListener");
		Element.prototype.addEventListener = function (sEvent: string, fnCallback: (e: Event) => void) {
			sEvent = "on" + sEvent;
			return (this as any).attachEvent(sEvent, fnCallback);
		};
	}

	if (!Element.prototype.removeEventListener) { // IE8
		Utils.console.debug("Polyfill: Element.prototype.removeEventListener");
		Element.prototype.removeEventListener = function (sEvent: string, fnCallback: (e: Event) => void) {
			sEvent = "on" + sEvent;
			return (this as any).detachEvent(sEvent, fnCallback);
		};
	}
}

if (window.Event) {
	if (!Event.prototype.preventDefault) { // IE8
		Utils.console.debug("Polyfill: Event.prototype.preventDefault");
		Event.prototype.preventDefault = function () {
			// empty
		};
	}

	if (!Event.prototype.stopPropagation) { // IE8
		Utils.console.debug("Polyfill: Event.prototype.stopPropagation");
		Event.prototype.stopPropagation = function () {
			// empty
		};
	}
}

if (!Date.now) { // IE8
	Utils.console.debug("Polyfill: Date.now");
	Date.now = function () {
		return new Date().getTime();
	};
}


if (window.document) {
	if (!document.addEventListener) {
		// or check: https://gist.github.com/fuzzyfox/6762206
		Utils.console.debug("Polyfill: document.addEventListener, removeEventListener");
		if ((document as any).attachEvent) {
			(function () {
				type EventListenerEntry = {
					object: Document,
					sEvent: string,
					fnHandler: (e: Event) => void,
					fnOnEvent: (e: Event) => boolean
				};
				const aEventListeners: EventListenerEntry[] = [];

				document.addEventListener = function (sEvent: string, fnHandler: (e: Event) => void) {
					const fnFindCaret = function (event: Event) {
							const documentSelection = (document as any).selection; // IE only

							if (documentSelection) {
								const eventTarget = event.target as HTMLTextAreaElement;

								eventTarget.focus();
								const oRange = documentSelection.createRange(),
									oRange2 = oRange.duplicate();

								if (oRange2.moveToElementTxt) { // not on IE8
									oRange2.moveToElementTxt(event.target);
								}
								oRange2.setEndPoint("EndToEnd", oRange);
								eventTarget.selectionStart = oRange2.text.length - oRange.text.length;
								eventTarget.selectionEnd = eventTarget.selectionStart + oRange.text.length;
							}
						},
						fnOnEvent = function (event: Event) {
							event = event || window.event;
							const eventTarget = event.target || event.srcElement;

							if (event.type === "click" && eventTarget && (eventTarget as HTMLTextAreaElement).tagName === "TEXTAREA") {
								fnFindCaret(event);
							}
							fnHandler(event);
							return false;
						};

					// The change event is not bubbled and fired on document for old IE8. So attach it to every select tag
					if (sEvent === "change") {
						const aElements = document.getElementsByTagName("select");

						for (let i = 0; i < aElements.length; i += 1) {
							(aElements[i] as any).attachEvent("on" + sEvent, fnOnEvent);
							aEventListeners.push({ //TTT does this work?
								object: this,
								sEvent: sEvent,
								fnHandler: fnHandler,
								fnOnEvent: fnOnEvent
							});
						}
					} else { // e.g. "Click"
						(document as any).attachEvent("on" + sEvent, fnOnEvent);
						aEventListeners.push({
							object: this,
							sEvent: sEvent,
							fnHandler: fnHandler,
							fnOnEvent: fnOnEvent
						});
					}
				};

				document.removeEventListener = function (sEvent: string, fnHandler: (e: Event) => void) {
					let counter = 0;

					while (counter < aEventListeners.length) {
						const oEventListener = aEventListeners[counter];

						if (oEventListener.object === this && oEventListener.sEvent === sEvent && oEventListener.fnHandler === fnHandler) {
							(this as any).detachEvent("on" + sEvent, oEventListener.fnOnEvent);
							aEventListeners.splice(counter, 1);
							break;
						}
						counter += 1;
					}
				};
			}());
		} else {
			Utils.console.log("No document.attachEvent found."); // will be ignored
			// debug: trying to fix
			if ((document as any).__proto__.addEventListener) { // eslint-disable-line no-proto
				document.addEventListener = (document as any).__proto__.addEventListener; // eslint-disable-line no-proto
			}
		}
	}
}

if (!Function.prototype.bind) { // IE8
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	// Does not work with `new funcA.bind(thisArg, args)`
	Utils.console.debug("Polyfill: Function.prototype.bind");
	(function () {
		const ArrayPrototypeSlice = Array.prototype.slice; // since IE6

		Function.prototype.bind = function () { // eslint-disable-line no-extend-native
			const that = this, // eslint-disable-line @typescript-eslint/no-this-alias
				thatArg = arguments[0],
				args = ArrayPrototypeSlice.call(arguments, 1),
				argLen = args.length;

			if (typeof that !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}
			return function () {
				args.length = argLen;
				args.push.apply(args, arguments as any);
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
	Utils.console.debug("Polyfill: Math.sign");
	Math.sign = function (x) {
		return (Number(x > 0) - Number(x < 0)) || Number(x);
	};
}

if (!Math.trunc) { // IE11
	Utils.console.debug("Polyfill: Math.trunc");
	Math.trunc = function (v) {
		return v < 0 ? Math.ceil(v) : Math.floor(v);
	};
}

if (!Object.assign) { // IE11
	Utils.console.debug("Polyfill: Object.assign");
	Object.assign = function (oTarget: Record<string, unknown>) { // varargs // Object.assign is ES6, not in IE
		const oTo = oTarget;

		for (let i = 1; i < arguments.length; i += 1) {
			const oNextSource = arguments[i];

			for (const sNextKey in oNextSource) {
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
	Utils.console.debug("Polyfill: Object.keys");
	// https://tokenposts.blogspot.com/2012/04/javascript-objectkeys-browser.html
	Object.keys = function (o: object): string[] { // eslint-disable-line @typescript-eslint/ban-types
		const k: string[] = [];

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

if (!String.prototype.endsWith) {
	Utils.console.debug("Polyfill: String.prototype.endsWith");
	String.prototype.endsWith = function (sSearch: string, iPosition?: number) { // eslint-disable-line no-extend-native
		if (iPosition === undefined) {
			iPosition = this.length;
		}
		iPosition -= sSearch.length;
		const iLastIndex = this.indexOf(sSearch, iPosition);

		return iLastIndex !== -1 && iLastIndex === iPosition;
	};
}

if (!String.prototype.includes) { // IE11
	Utils.console.debug("Polyfill: String.prototype.includes");
	String.prototype.includes = function (sSearch: string, iStart = 0) { // eslint-disable-line no-extend-native
		let bRet: boolean;

		if (iStart + sSearch.length > this.length) {
			bRet = false;
		} else {
			bRet = this.indexOf(sSearch, iStart) !== -1;
		}
		return bRet;
	};
}

if (!String.prototype.padStart) { // IE11
	Utils.console.debug("Polyfill: String.prototype.padStart");
	String.prototype.padStart = function (iTargetLength: number, sPad?: string) { // eslint-disable-line no-extend-native
		let sRet = String(this);

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
	Utils.console.debug("Polyfill: String.prototype.padEnd");
	String.prototype.padEnd = function (iTargetLength: number, sPad?: string) { // eslint-disable-line no-extend-native
		let sRet = String(this);

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
	Utils.console.debug("Polyfill: String.prototype.repeat");
	String.prototype.repeat = function (iCount: number) { // eslint-disable-line no-extend-native
		const sStr = String(this);
		let	sOut = "";

		for (let i = 0; i < iCount; i += 1) {
			sOut += sStr;
		}
		return sOut;
	};
}

if (!String.prototype.startsWith) {
	Utils.console.debug("Polyfill: String.prototype.startsWith");
	String.prototype.startsWith = function (sSearch, iPosition) { // eslint-disable-line no-extend-native
		iPosition = iPosition || 0;
		return this.indexOf(sSearch, iPosition) === iPosition;
	};
}

if (!String.prototype.trim) { // IE8
	Utils.console.debug("Polyfill: String.prototype.trim");
	String.prototype.trim = function () { // eslint-disable-line no-extend-native
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
	};
}

// based on: https://github.com/mathiasbynens/base64/blob/master/base64.js
// https://mths.be/base64 v0.1.0 by @mathias | MIT license
if (!Utils.atob) { // IE9 (and node.js)
	Utils.console.debug("Polyfill: window.atob, btoa");
	(function () {
		const sTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
			reSpaceCharacters = /[\t\n\f\r ]/g; // http://whatwg.org/html/common-microsyntaxes.html#space-character

		/* eslint-disable no-bitwise */
		Utils.atob = function (sInput: string) { // decode
			sInput = String(sInput).replace(reSpaceCharacters, "");
			let length = sInput.length;

			if (length % 4 === 0) {
				sInput = sInput.replace(/[=]=?$/, ""); // additional brackets to maks eslint happy
				length = sInput.length;
			}
			if (length % 4 === 1 || (/[^+a-zA-Z0-9/]/).test(sInput)) { // http://whatwg.org/C#alphanumeric-ascii-characters
				throw new TypeError("Polyfills:atob: Invalid character: the string to be decoded is not correctly encoded.");
			}

			let bitCounter = 0,
				output = "",
				position = 0,
				bitStorage = 0;

			while (position < length) {
				const buffer = sTable.indexOf(sInput.charAt(position));

				bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
				bitCounter += 1;
				if ((bitCounter - 1) % 4) { // Unless this is the first of a group of 4 characters...
					output += String.fromCharCode(0xFF & bitStorage >> (-2 * bitCounter & 6)); // ...convert the first 8 bits to a single ASCII character
				}
				position += 1;
			}
			return output;
		};

		Utils.btoa = function (input: string) { // encode
			input = String(input);
			if ((/[^\0-\xFF]/).test(input)) {
				throw new TypeError("Polyfills:btoa: The string to be encoded contains characters outside of the Latin1 range.");
			}

			const padding = input.length % 3,
				length = input.length - padding; // Make sure any padding is handled outside of the loop
			let output = "",
				position = 0;

			while (position < length) {
				// Read three bytes, i.e. 24 bits.
				const a = input.charCodeAt(position) << 16;

				position += 1;
				const b = input.charCodeAt(position) << 8;

				position += 1;
				const c = input.charCodeAt(position);

				position += 1;
				const buffer = a + b + c;

				// Turn the 24 bits into four chunks of 6 bits each, and append the matching character for each of them to the output
				output += sTable.charAt(buffer >> 18 & 0x3F) + sTable.charAt(buffer >> 12 & 0x3F) + sTable.charAt(buffer >> 6 & 0x3F) + sTable.charAt(buffer & 0x3F);
			}

			if (padding === 2) {
				const a = input.charCodeAt(position) << 8;

				position += 1;
				const b = input.charCodeAt(position),
					buffer = a + b;

				output += sTable.charAt(buffer >> 10) + sTable.charAt((buffer >> 4) & 0x3F) + sTable.charAt((buffer << 2) & 0x3F) + "=";
			} else if (padding === 1) {
				const buffer = input.charCodeAt(position);

				output += sTable.charAt(buffer >> 2) + sTable.charAt((buffer << 4) & 0x3F) + "==";
			}
			return output;
		};
		/* eslint-enable no-bitwise */
	}());
}

// For IE and Edge, localStorage is only available if page is hosted on web server, so we simulate it (do not use property "length" or method names as keys!)
if (!Utils.localStorage) {
	Utils.console.debug("Polyfill: window.localStorage");
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
		class Storage {
			length = 0;

			clear() {
				for (const key in this) {
					if (this.hasOwnProperty(key)) {
						delete this[key];
					}
				}
				this.length = 0;
			}

			key(index: number) {
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
			}

			getItem(sKey: string) {
				return this.hasOwnProperty(sKey) ? (this as any)[sKey] : null;
			}

			setItem(sKey: string, value: string) {
				if (this.getItem(sKey) === null) {
					this.length += 1;
				}
				(this as any)[sKey] = String(value);
			}

			removeItem(sKey: string) {
				if (this.getItem(sKey) !== null) {
					delete (this as any)[sKey];
					this.length -= 1;
				}
			}
		}

		Utils.localStorage = new Storage();
	}());
}

if (!window.ArrayBuffer) { // IE9
	Utils.console.debug("Polyfill: window.ArrayBuffer");
	window.ArrayBuffer = Array as any;
}

if (!window.AudioContext) { // ? not for IE
	window.AudioContext = (window as any).webkitAudioContext || (window as any).mozAudioContext;
	if (window.AudioContext) {
		Utils.console.debug("Polyfill: window.AudioContext");
	} else {
		Utils.console.warn("Polyfill: window.AudioContext: not ok!");
	}
}

if (!window.JSON) { // simple polyfill for JSON.parse only
	// for a better implementation, see https://github.com/douglascrockford/JSON-js/blob/master/json2.js
	Utils.console.debug("Polyfill: window.JSON.parse");
	(window as any).JSON = {
		parse: function (sText: string) {
			const oJson = eval("(" + sText + ")"); // eslint-disable-line no-eval

			return oJson;
		},
		stringify: function (o: Object) { // eslint-disable-line @typescript-eslint/ban-types
			Utils.console.error("Not implemented: window.JSON.stringify");
			return String(o);
		}
		//how to set: Symbol(Symbol.toStringTag): "JSON" ?
	};
}

if (!window.requestAnimationFrame) { // IE9, SliTaz tazweb browser
	// https://wiki.selfhtml.org/wiki/JavaScript/Window/requestAnimationFrame
	window.requestAnimationFrame = (window as any).mozRequestAnimationFrame || window.webkitRequestAnimationFrame || (window as any).msRequestAnimationFrame;
	window.cancelAnimationFrame = (window as any).mozCancelAnimationFrame || window.webkitCancelAnimationFrame || (window as any).msCancelAnimationFrame;
	if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
		(function () {
			let lastTime = 0;

			Utils.console.debug("Polyfill: window.requestAnimationFrame, cancelAnimationFrame");
			window.requestAnimationFrame = function (callback /* , element */) {
				const currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);

				lastTime = currTime + timeToCall;
				return id;
			};
			window.cancelAnimationFrame = function (id) {
				clearTimeout(id);
			};
		}());
	} else {
		Utils.console.debug("Polyfill: window.requestAnimationFrame, cancelAnimationFrame: Using vendor specific method.");
	}
}

if (!window.Uint8Array) { // IE9
	Utils.console.debug("Polyfill: Uint8Array (fallback only)");
	(window as any).Uint8Array = function (oArrayBuffer: ArrayBufferConstructor) {
		return oArrayBuffer; // we just return the ArrayBuffer as fallback; enough for our needs
	};
	(window.Uint8Array as any).BYTES_PER_ELEMENT = 1;
	// A more complex solution would be: https://github.com/inexorabletash/polyfill/blob/master/typedarray.js
}

Utils.console.debug("Polyfill: end of Polyfills");

// end
