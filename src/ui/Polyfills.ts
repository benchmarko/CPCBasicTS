// Polyfills.ts - Some Polyfills for old browsers, e.g. IE8, and nodeJS
//

/* globals globalThis */

type LegacyElement = Element & {
	attachEvent?: (type: string, listener: (event: Event) => void | boolean) => void
	detachEvent?: (type: string, listener: (event: Event) => void | boolean) => void
	currentStyle?: Record<string, string | undefined>
};

interface LegacyTextRange {
	duplicate(): LegacyTextRange
	moveToElementTxt?: (element: HTMLTextAreaElement) => void
	setEndPoint(type: string, range: LegacyTextRange): void
	text: string
}

type LegacyDocument = Document & {
	attachEvent?: (type: string, listener: (event: Event) => void | boolean) => void
	detachEvent?: (type: string, listener: (event: Event) => void | boolean) => void
	selection?: { createRange(): LegacyTextRange }
	__proto__?: Partial<Document>
};

type LegacyWindow = Window & {
	webkitAudioContext?: typeof AudioContext
	mozAudioContext?: typeof AudioContext
	mozRequestAnimationFrame?: typeof window.requestAnimationFrame
	webkitRequestAnimationFrame?: typeof window.requestAnimationFrame
	msRequestAnimationFrame?: typeof window.requestAnimationFrame
	mozCancelAnimationFrame?: typeof window.cancelAnimationFrame
	webkitCancelAnimationFrame?: typeof window.cancelAnimationFrame
	msCancelAnimationFrame?: typeof window.cancelAnimationFrame
};

type LegacyJson = {
	parse(text: string): unknown
	stringify(value: object): string
};

type LegacyUint8ArrayConstructor = {
	new(arrayBuffer: ArrayBuffer): ArrayBuffer
	BYTES_PER_ELEMENT: number
	prototype: { copyWithin?: typeof Array.prototype.copyWithin }
};

type PolyfillConsole = Pick<Console, "log" | "info" | "warn" | "error" | "debug"> & {
	cpcBasicLog: string
};

type LegacyComputedStyleHost = Window & {
	getPropertyValue?: (property: string) => string | null
};

type LegacyComputedStyleWindow = {
	getComputedStyle?: (this: LegacyComputedStyleHost, element: Element, pseudo?: string) => LegacyComputedStyleHost
};

type LegacyCurrentStyleElement = Element & {
	currentStyle?: Record<string, string | undefined>
};

var Polyfills = {
	list: [] as string[],
	getList: function (): string[] {
		return Polyfills.list;
	},
	log: function (part: string): void {
		Polyfills.list.push(part);
	},
	console: (typeof window !== "undefined" ? window.console : globalThis.console) as Console | PolyfillConsole,

	localStorage: (function () {
		let rc: Storage | undefined;

		if (typeof window !== "undefined") {
			try {
				rc = window.localStorage; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
			} catch (_e) {
				// empty
			}
		}
		return rc as Storage; // if it is undefined, localStorage is set in Polyfills
	}()),

	isDefinePropertyOk: (function () {
		if (!Object.defineProperty) {
			return false;
		}
		try { // IE8 cannot do this...
			Object.defineProperty({}, "p1", {
				value: "1"
			});
		} catch (_e) { // on IE8 we get "TypeError: Object does not support this action"
			return false;
		}
		return true;
	}()),

	atob: typeof window !== "undefined" ? window.atob : undefined,
	btoa: typeof window !== "undefined" ? window.btoa : undefined

};

// IE: window.console is only available when Dev Tools are open
if (!Polyfills.console) { // browser or node.js
	let logText = "LOG:\n";
	const appendLog = (...args: unknown[]) => {
		if (logText) {
			logText += args.join(" ") + "\n";
		}
	};
	const polyFillConsole: PolyfillConsole = {
		get cpcBasicLog() { return logText; },
		set cpcBasicLog(value: string) { logText = value; },
		log: appendLog,
		info: appendLog,
		warn: appendLog,
		error: appendLog,
		debug: appendLog
	};

	Polyfills.console = polyFillConsole;
	Polyfills.log("window.console");
}

if (!Polyfills.console.debug) { // IE8 has no console.debug
	Polyfills.console.debug = Polyfills.console.log;
	Polyfills.log("window.console.debug");
}

if ((typeof globalThis !== "undefined") && !globalThis.window) { // nodeJS
	Polyfills.log("window");
	(globalThis as unknown as { window?: typeof globalThis }).window = globalThis;
}

if (!Array.prototype.copyWithin) {
	Polyfills.log("Array.prototype.copyWithin"); // a simple polyfill where the parts must not overlap and "end" is defined!
	// a more complex solution would be: https://github.com/gearcase/array-copyWithin/blob/master/index.js
	// or: https://github.com/zloirock/core-js/blob/master/packages/core-js/internals/array-copy-within.js
	Array.prototype.copyWithin = function (target: number, start: number, end: number) { // eslint-disable-line no-extend-native
		for (let i = start; i <= end; i += 1) {
			this[target] = this[i];
			target += 1;
		}
		return this;
	};
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
	Array.prototype.fill = function <T>(this: T[], value: T, start?: number, end?: number): T[] { // eslint-disable-line no-extend-native
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

if (!Array.prototype.filter) { // IE8
	Polyfills.log("Array.prototype.filter");
	Array.prototype.filter = function <T>(this: T[], callbackFn: (value: T, index: number, array: T[]) => unknown): T[] { // eslint-disable-line no-extend-native,func-names
		const arr: T[] = [];

		for (let i = 0; i < this.length; i += 1) {
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
			(this as LegacyElement).attachEvent?.(event, fnCallback);
		};
	}

	if (!Element.prototype.removeEventListener) { // IE8
		Polyfills.log("Element.prototype.removeEventListener");
		Element.prototype.removeEventListener = function (event: string, fnCallback: (e: Event) => void) {
			event = "on" + event;
			(this as LegacyElement).detachEvent?.(event, fnCallback);
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
	const legacyWindow = window as unknown as LegacyComputedStyleWindow;
	legacyWindow.getComputedStyle = function (this: LegacyComputedStyleHost, el: Element, _pseudo?: string) {
		this.getPropertyValue = function (prop: string) {
			const re = /(-([a-z]){1})/g;

			if (prop === "float") {
				prop = "styleFloat";
			}
			if (re.test(prop)) {
				prop = prop.replace(re, function () {
					return arguments[2].toUpperCase();
				});
			}

			const currentStyle = (el as LegacyCurrentStyleElement).currentStyle,
				currentStyleValue = currentStyle ? currentStyle[prop] : undefined;

			return currentStyleValue ? currentStyleValue : null;
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
		if ((document as LegacyDocument).attachEvent) {
			(function () {
				type fnHandlerType = ((e: Event) => void) | { handleEvent: ((e: Event) => void)};
				type EventListenerEntry = {
					object: Document,
					eventString: string,
					fnHandler: fnHandlerType,
					fnOnEvent: (e: Event) => boolean
				};
				const eventListeners: EventListenerEntry[] = [];

				document.addEventListener = function (eventString: string, fnHandler: fnHandlerType) {
					const fnFindCaret = function (event: Event) {
							const documentSelection = (document as LegacyDocument).selection; // IE only

							if (documentSelection) {
								const target = (event.target || event.srcElement) as HTMLTextAreaElement;

								target.focus();
								const range = documentSelection.createRange(),
									range2 = range.duplicate();

								if (range2.moveToElementTxt) { // not on IE8
									range2.moveToElementTxt(target);
								}
								range2.setEndPoint("EndToEnd", range);
								target.selectionStart = range2.text.length - range.text.length;
								target.selectionEnd = target.selectionStart + range.text.length;
							}
						},
						fnOnEvent = function (event: Event) {
							event = event || window.event;
							const target = event.target || event.srcElement;

							if (event.type === "click" && target && (target as HTMLTextAreaElement).tagName === "TEXTAREA") {
								fnFindCaret(event);
							}
							if (typeof fnHandler === "function") {
								fnHandler(event);
							} else if (typeof fnHandler === "object") {
								fnHandler.handleEvent(event);
							} else {
								Polyfills.console.error("Unknown fnHandler:", fnHandler);
							}
							return false;
						};

					// The change event is not bubbled and fired on document for old IE8. So attach it to every select tag
					if (eventString === "change") {
						const elements = document.getElementsByTagName("select");

						for (let i = 0; i < elements.length; i += 1) {
							(elements[i] as LegacyElement).attachEvent?.("on" + eventString, fnOnEvent);
							eventListeners.push({ //TTT does this work?
								object: this,
								eventString: eventString,
								fnHandler: fnHandler,
								fnOnEvent: fnOnEvent
							});
						}
					} else { // e.g. "Click"
						(document as LegacyDocument).attachEvent?.("on" + eventString, fnOnEvent);
						eventListeners.push({
							object: this,
							eventString: eventString,
							fnHandler: fnHandler,
							fnOnEvent: fnOnEvent
						});
					}
				};

				document.removeEventListener = function (event: string, fnHandler: fnHandlerType) {
					let counter = 0;

					while (counter < eventListeners.length) {
						const eventListener = eventListeners[counter];

						if (eventListener.object === this && eventListener.eventString === event && eventListener.fnHandler === fnHandler) {
							(this as LegacyDocument).detachEvent?.("on" + event, eventListener.fnOnEvent);
							eventListeners.splice(counter, 1);
							break;
						}
						counter += 1;
					}
				};
			}());
		} else {
			(Polyfills.console || window.console).error("No document.attachEvent found."); // will be ignored
			// debug: trying to fix
			const documentPrototype = (document as LegacyDocument).__proto__;
			if (documentPrototype?.addEventListener) { // eslint-disable-line no-proto
				document.addEventListener = documentPrototype.addEventListener; // eslint-disable-line no-proto
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
				for (let i = 0; i < arguments.length; i += 1) {
					args.push(arguments[i]);
				}
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
				if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
					to[nextKey] = nextSource[nextKey];
				}
			}
		}
		return to;
	};
}

if (!Object.defineProperty || !Polyfills.isDefinePropertyOk) { // IE8
	Polyfills.log("Object.defineProperty");
	Object.defineProperty = function <T>(target: T, prop: PropertyKey, PropDescriptor: PropertyDescriptor): T {
		// can handle simple case: Object.defineProperty(exports, "__esModule", { value: true });
		const targetWithProperty = target as unknown as Record<PropertyKey, unknown>;

		targetWithProperty[prop] = PropDescriptor.value;
		return target;
	};
}

if (!Object.keys) { // IE8
	Polyfills.log("Object.keys");
	// based on: https://tokenposts.blogspot.com/2012/04/javascript-objectkeys-browser.html
	Object.keys = function (o: object): string[] { // eslint-disable-line @typescript-eslint/no-unsafe-function-type
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
	Object.values = function (o: object): unknown[] { // eslint-disable-line @typescript-eslint/no-unsafe-function-type
		const objectRecord = o as Record<string, unknown>;

		return Object.keys(o).map(function (key) {
			return objectRecord[key];
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
if (!window.atob) { // IE9 (and node.js)
	Polyfills.log("window.atob, window.btoa");
	(function () {
		const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
			reSpaceCharacters = /[\t\n\f\r ]/g; // http://whatwg.org/html/common-microsyntaxes.html#space-character

		/* eslint-disable no-bitwise */
		window.atob = function (input: string) { // decode
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

		window.btoa = function (input: string) { // encode
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
	// Assign polyfilled versions to Polyfills object
	Polyfills.atob = window.atob;
	Polyfills.btoa = window.btoa;
}

// For IE and Edge, localStorage is only available if page is hosted on web server, so we simulate it (do not use property "length" or method names as keys!)
if (!Polyfills.localStorage) {
	Polyfills.log("window.localStorage");
	(function () {
		class Storage {
			length = 0;

			private get data(): Record<string, unknown> {
				return this as unknown as Record<string, unknown>;
			}

			clear() {
				for (const key in this) {
					if (Object.prototype.hasOwnProperty.call(this, key)) {
						delete this[key];
					}
				}
				this.length = 0;
			}

			key(index: number) {
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

			getItem(key: string) {
				return Object.prototype.hasOwnProperty.call(this, key) ? this.data[key] as string : null;
			}

			setItem(key: string, value: string) {
				if (this.getItem(key) === null) {
					this.length += 1;
				}
				this.data[key] = String(value);
			}

			removeItem(key: string) {
				if (this.getItem(key) !== null) {
					delete this.data[key];
					this.length -= 1;
				}
			}
		}

		Polyfills.localStorage = new Storage();
	}());
}

if (!window.ArrayBuffer) { // IE9
	Polyfills.log("window.ArrayBuffer");
	window.ArrayBuffer = Array as unknown as typeof ArrayBuffer;
}

if (!window.AudioContext) { // ? not for IE
	const legacyWindow = window as LegacyWindow,
		audioContext = legacyWindow.webkitAudioContext || legacyWindow.mozAudioContext;

	if (audioContext) {
		window.AudioContext = audioContext;
		Polyfills.log("window.AudioContext");
	} else {
		Polyfills.log("window.AudioContext not ok!");
	}
}

if (!window.JSON) { // simple polyfill for JSON.parse only
	// for a better implementation, see https://github.com/douglascrockford/JSON-js/blob/master/json2.js
	Polyfills.log("window.JSON.parse");
	(window as unknown as { JSON?: LegacyJson }).JSON = {
		parse: function (text: string) {
			return eval("(" + text + ")"); // eslint-disable-line no-eval
		},
		stringify: function (o: Object) { // eslint-disable-line @typescript-eslint/no-unsafe-function-type,@typescript-eslint/no-wrapper-object-types
			(Polyfills.console || window.console).error("Not implemented: window.JSON.stringify");
			return String(o);
		}
	};
}

if (!window.requestAnimationFrame) { // IE9, SliTaz tazweb browser
	// https://wiki.selfhtml.org/wiki/JavaScript/Window/requestAnimationFrame
	const legacyWindow = window as LegacyWindow;
	const requestAnimationFrame = legacyWindow.mozRequestAnimationFrame || legacyWindow.webkitRequestAnimationFrame || legacyWindow.msRequestAnimationFrame,
		cancelAnimationFrame = legacyWindow.mozCancelAnimationFrame || legacyWindow.webkitCancelAnimationFrame || legacyWindow.msCancelAnimationFrame;

	if (requestAnimationFrame) {
		window.requestAnimationFrame = requestAnimationFrame;
	}
	if (cancelAnimationFrame) {
		window.cancelAnimationFrame = cancelAnimationFrame;
	}
	if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
		(function () {
			let lastTime = 0;

			Polyfills.log("window.requestAnimationFrame, cancelAnimationFrame");
			window.requestAnimationFrame = function (callback /* , element */) {
				const currTime = Date.now(),
					frameDuration = 1000 / 60, // e.g. 60 Hz
					timeToCall = Math.max(0, frameDuration - (currTime - lastTime)),
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
	const polyfillUint8Array = function (arrayBuffer: ArrayBuffer) {
		return arrayBuffer; // we just return the ArrayBuffer as fallback; enough for our needs
	} as unknown as LegacyUint8ArrayConstructor;

	polyfillUint8Array.BYTES_PER_ELEMENT = 1;
	(window as unknown as { Uint8Array?: LegacyUint8ArrayConstructor }).Uint8Array = polyfillUint8Array;
	// A more complex solution would be: https://github.com/inexorabletash/polyfill/blob/master/typedarray.js
}

if (!window.Uint8Array.prototype.copyWithin) {
	Polyfills.log("Uint8Array.prototype.copyWithin");
	(window as unknown as { Uint8Array: LegacyUint8ArrayConstructor }).Uint8Array.prototype.copyWithin = Array.prototype.copyWithin;
}

(Polyfills.console || window.console).debug("Polyfills: (" + Polyfills.getList().length + ") " + Polyfills.getList().join("; "));

window.Polyfills = Polyfills;

// end
