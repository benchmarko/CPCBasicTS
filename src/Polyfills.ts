// Polyfills.ts - Some Polyfills for old browsers, e.g. IE8, and nodeJS
//

/* globals globalThis */

import { Utils } from "./Utils";

export var Polyfills = {
	count: 0,
	// empty

	log: function (part: string): void {
		Utils.console.debug("Polyfill: " + part);
		Polyfills.count += 1;
	}
};

// IE: window.console is only available when Dev Tools are open
if (!Utils.console) {
	const utilsConsole: any = {
		cpcBasicLog: "LOG:\n",
		log: function () { // varargs
			if (utilsConsole.cpcBasicLog) {
				utilsConsole.cpcBasicLog += Array.prototype.slice.call(arguments).join(" ") + "\n";
			}
		}
	};

	utilsConsole.info = utilsConsole.log;
	utilsConsole.warn = utilsConsole.log;
	utilsConsole.error = utilsConsole.log;
	utilsConsole.debug = utilsConsole.log;

	(Utils.console as any) = utilsConsole;
}

if (!Utils.console.debug) { // IE8 has no console.debug
	Utils.console.debug = Utils.console.log;
	Polyfills.log("window.console.debug");
}

if ((typeof globalThis !== "undefined") && !globalThis.window) { // nodeJS
	Polyfills.log("window");
	(globalThis.window as any) = globalThis;
}

if (!Array.prototype.indexOf) { // IE8
	Polyfills.log("Array.prototype.indexOf");
	Array.prototype.indexOf = function (searchElement, from?: number) { // eslint-disable-line no-extend-native
		const len = this.length >>> 0; // eslint-disable-line no-bitwise

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
	Array.prototype.fill = function (value: any, start?: number, end?: number) { // eslint-disable-line no-extend-native
		const length = this.length;

		start = start || 0;
		end = end === undefined ? length : (end || 0);

		let i = start < 0 ? Math.max(length + start, 0) : Math.min(start, length);
		const l = end < 0 ? Math.max(length + end, 0) : Math.min(end, length);

		for (; i < l; i += 1) {
			this[i] = value;
		}
		return this;
	};
}

if (!Array.prototype.map) { // IE8
	// based on: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/map
	Polyfills.log("Array.prototype.map");
	Array.prototype.map = function (callback, thisArg) { // eslint-disable-line no-extend-native,func-names
		const values = [],
			object = Object(this),
			len = object.length;
		let T;

		if (arguments.length > 1) {
			T = thisArg;
		}

		for (let i = 0; i < len; i += 1) {
			if (i in object) {
				const kValue = object[i],
					mappedValue = callback.call(T, kValue, i, object);

				values[i] = mappedValue;
			}
		}
		return values;
	};
}

if (window.Element) {
	if (!Element.prototype.addEventListener) { // IE8
		Polyfills.log("Element.prototype.addEventListener");
		Element.prototype.addEventListener = function (event: string, fnCallback: (e: Event) => void) {
			event = "on" + event;
			return (this as any).attachEvent(event, fnCallback);
		};
	}

	if (!Element.prototype.removeEventListener) { // IE8
		Polyfills.log("Element.prototype.removeEventListener");
		Element.prototype.removeEventListener = function (event: string, fnCallback: (e: Event) => void) {
			event = "on" + event;
			return (this as any).detachEvent(event, fnCallback);
		};
	}
}

if (window.Event) {
	if (!Event.prototype.preventDefault) { // IE8
		Polyfills.log("Polyfill: Event.prototype.preventDefault");
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
		if ((document as any).attachEvent) {
			(function () {
				type EventListenerEntry = {
					object: Document,
					eventString: string,
					fnHandler: (e: Event) => void,
					fnOnEvent: (e: Event) => boolean
				};
				const eventListeners: EventListenerEntry[] = [];

				document.addEventListener = function (eventString: string, fnHandler: (e: Event) => void) {
					const fnFindCaret = function (event: Event) {
							const documentSelection = (document as any).selection; // IE only

							if (documentSelection) {
								const eventTarget = event.target as HTMLTextAreaElement;

								eventTarget.focus();
								const range = documentSelection.createRange(),
									range2 = range.duplicate();

								if (range2.moveToElementTxt) { // not on IE8
									range2.moveToElementTxt(event.target);
								}
								range2.setEndPoint("EndToEnd", range);
								eventTarget.selectionStart = range2.text.length - range.text.length;
								eventTarget.selectionEnd = eventTarget.selectionStart + range.text.length;
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
					if (eventString === "change") {
						const elements = document.getElementsByTagName("select");

						for (let i = 0; i < elements.length; i += 1) {
							(elements[i] as any).attachEvent("on" + eventString, fnOnEvent);
							eventListeners.push({ //TTT does this work?
								object: this,
								eventString: eventString,
								fnHandler: fnHandler,
								fnOnEvent: fnOnEvent
							});
						}
					} else { // e.g. "Click"
						(document as any).attachEvent("on" + eventString, fnOnEvent);
						eventListeners.push({
							object: this,
							eventString: eventString,
							fnHandler: fnHandler,
							fnOnEvent: fnOnEvent
						});
					}
				};

				document.removeEventListener = function (event: string, fnHandler: (e: Event) => void) {
					let counter = 0;

					while (counter < eventListeners.length) {
						const eventListener = eventListeners[counter];

						if (eventListener.object === this && eventListener.eventString === event && eventListener.fnHandler === fnHandler) {
							(this as any).detachEvent("on" + event, eventListener.fnOnEvent);
							eventListeners.splice(counter, 1);
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
	Polyfills.log("Function.prototype.bind");
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
	Object.assign = function (target: Record<string, unknown>) { // varargs // Object.assign is ES6, not in IE
		const to = target;

		for (let i = 1; i < arguments.length; i += 1) {
			const nextSource = arguments[i];

			for (const nextKey in nextSource) {
				if (nextSource.hasOwnProperty(nextKey)) {
					to[nextKey] = nextSource[nextKey];
				}
			}
		}
		return to;
	};
}

if (!Object.keys) { // IE8
	Polyfills.log("Object.keys");
	// based on: https://tokenposts.blogspot.com/2012/04/javascript-objectkeys-browser.html
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

if (!Object.values) { // IE11
	Polyfills.log("Object.values");
	// based on: https://github.com/KhaledElAnsari/Object.values/blob/master/index.js
	Object.values = function (o: object): any[] { // eslint-disable-line @typescript-eslint/ban-types
		return Object.keys(o).map(function (key) {
			return (o as Record<string, any>)[key];
		});
	};
}

if (!String.prototype.endsWith) {
	Polyfills.log("String.prototype.endsWith");
	String.prototype.endsWith = function (search: string, position?: number) { // eslint-disable-line no-extend-native
		if (position === undefined) {
			position = this.length;
		}
		position -= search.length;
		const lastIndex = this.indexOf(search, position);

		return lastIndex !== -1 && lastIndex === position;
	};
}

if (!String.prototype.includes) { // IE11
	Polyfills.log("String.prototype.includes");
	String.prototype.includes = function (search: string, start = 0) { // eslint-disable-line no-extend-native
		let ret: boolean;

		if (start + search.length > this.length) {
			ret = false;
		} else {
			ret = this.indexOf(search, start) !== -1;
		}
		return ret;
	};
}

if (!String.prototype.padStart) { // IE11
	Polyfills.log("String.prototype.padStart");
	String.prototype.padStart = function (targetLength: number, pad?: string) { // eslint-disable-line no-extend-native
		let ret = String(this);

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
	String.prototype.padEnd = function (targetLength: number, pad?: string) { // eslint-disable-line no-extend-native
		let ret = String(this);

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
	String.prototype.repeat = function (count: number) { // eslint-disable-line no-extend-native
		const str = String(this);
		let	out = "";

		for (let i = 0; i < count; i += 1) {
			out += str;
		}
		return out;
	};
}

if (!String.prototype.startsWith) {
	Polyfills.log("String.prototype.startsWith");
	String.prototype.startsWith = function (search, position) { // eslint-disable-line no-extend-native
		position = position || 0;
		return this.indexOf(search, position) === position;
	};
}

if (!String.prototype.trim) { // IE8
	Polyfills.log("String.prototype.trim");
	String.prototype.trim = function () { // eslint-disable-line no-extend-native
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
	};
}

// based on: https://github.com/mathiasbynens/base64/blob/master/base64.js
// https://mths.be/base64 v0.1.0 by @mathias | MIT license
if (!Utils.atob) { // IE9 (and node.js)
	Polyfills.log("window.atob, btoa");
	(function () {
		const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
			reSpaceCharacters = /[\t\n\f\r ]/g; // http://whatwg.org/html/common-microsyntaxes.html#space-character

		/* eslint-disable no-bitwise */
		Utils.atob = function (input: string) { // decode
			input = String(input).replace(reSpaceCharacters, "");
			let length = input.length;

			if (length % 4 === 0) {
				input = input.replace(/[=]=?$/, ""); // additional brackets to maks eslint happy
				length = input.length;
			}
			if (length % 4 === 1 || (/[^+a-zA-Z0-9/]/).test(input)) { // http://whatwg.org/C#alphanumeric-ascii-characters
				throw new TypeError("Polyfills:atob: Invalid character: the string to be decoded is not correctly encoded.");
			}

			let bitCounter = 0,
				output = "",
				position = 0,
				bitStorage = 0;

			while (position < length) {
				const buffer = table.indexOf(input.charAt(position));

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
				output += table.charAt(buffer >> 18 & 0x3F) + table.charAt(buffer >> 12 & 0x3F) + table.charAt(buffer >> 6 & 0x3F) + table.charAt(buffer & 0x3F);
			}

			if (padding === 2) {
				const a = input.charCodeAt(position) << 8;

				position += 1;
				const b = input.charCodeAt(position),
					buffer = a + b;

				output += table.charAt(buffer >> 10) + table.charAt((buffer >> 4) & 0x3F) + table.charAt((buffer << 2) & 0x3F) + "=";
			} else if (padding === 1) {
				const buffer = input.charCodeAt(position);

				output += table.charAt(buffer >> 2) + table.charAt((buffer << 4) & 0x3F) + "==";
			}
			return output;
		};
		/* eslint-enable no-bitwise */
	}());
}

// For IE and Edge, localStorage is only available if page is hosted on web server, so we simulate it (do not use property "length" or method names as keys!)
if (!Utils.localStorage) {
	Polyfills.log("window.localStorage");
	(function () {
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

			getItem(key: string) {
				return this.hasOwnProperty(key) ? (this as any)[key] : null;
			}

			setItem(key: string, value: string) {
				if (this.getItem(key) === null) {
					this.length += 1;
				}
				(this as any)[key] = String(value);
			}

			removeItem(key: string) {
				if (this.getItem(key) !== null) {
					delete (this as any)[key];
					this.length -= 1;
				}
			}
		}

		Utils.localStorage = new Storage();
	}());
}

if (!window.ArrayBuffer) { // IE9
	Polyfills.log("window.ArrayBuffer");
	window.ArrayBuffer = Array as any;
}

if (!window.AudioContext) { // ? not for IE
	window.AudioContext = (window as any).webkitAudioContext || (window as any).mozAudioContext;
	if (window.AudioContext) {
		Polyfills.log("window.AudioContext");
	} else {
		Utils.console.warn("Polyfill: window.AudioContext: not ok!");
	}
}

if (!window.JSON) { // simple polyfill for JSON.parse only
	// for a better implementation, see https://github.com/douglascrockford/JSON-js/blob/master/json2.js
	Polyfills.log("window.JSON.parse");
	(window as any).JSON = {
		parse: function (text: string) {
			return eval("(" + text + ")"); // eslint-disable-line no-eval
		},
		stringify: function (o: Object) { // eslint-disable-line @typescript-eslint/ban-types
			Utils.console.error("Not implemented: window.JSON.stringify");
			return String(o);
		}
	};
}

if (!window.requestAnimationFrame) { // IE9, SliTaz tazweb browser
	// https://wiki.selfhtml.org/wiki/JavaScript/Window/requestAnimationFrame
	window.requestAnimationFrame = (window as any).mozRequestAnimationFrame || (window as any).webkitRequestAnimationFrame || (window as any).msRequestAnimationFrame;
	window.cancelAnimationFrame = (window as any).mozCancelAnimationFrame || (window as any).webkitCancelAnimationFrame || (window as any).msCancelAnimationFrame;
	if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
		(function () {
			let lastTime = 0;

			Polyfills.log("window.requestAnimationFrame, cancelAnimationFrame");
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
		Polyfills.log("window.requestAnimationFrame, cancelAnimationFrame: Using vendor specific method.");
	}
}

if (!window.Uint8Array) { // IE9
	Polyfills.log("Uint8Array (fallback only)");
	(window as any).Uint8Array = function (arrayBuffer: ArrayBufferConstructor) {
		return arrayBuffer; // we just return the ArrayBuffer as fallback; enough for our needs
	};
	(window.Uint8Array as any).BYTES_PER_ELEMENT = 1;
	// A more complex solution would be: https://github.com/inexorabletash/polyfill/blob/master/typedarray.js
}

Utils.console.debug("Polyfill: end of Polyfills: count=" + Polyfills.count);

// end
