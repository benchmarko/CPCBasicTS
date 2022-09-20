// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

export interface CustomError extends Error {
	value: string
	pos: number
	len?: number,
	line?: number | string
	hidden?: boolean
	shortMessage?: string
}

export class Utils { // eslint-disable-line vars-on-top
	static debug = 0;

	static console = (function () {
		return typeof window !== "undefined" ? window.console : globalThis.console; // browser or node.js
	}());

	private static fnLoadScriptOrStyle(script: HTMLScriptElement | HTMLLinkElement, fnSuccess: (url: string, key: string) => void, fnError: (url: string, key: string) => void) {
		// inspired by https://github.com/requirejs/requirejs/blob/master/require.js
		let ieTimeoutCount = 3; // IE timeout count
		const onScriptLoad = function (event: Event) {
				const type = event.type, // "load" or "error"
					node = (event.currentTarget || event.srcElement) as HTMLScriptElement | HTMLLinkElement,
					fullUrl = (node as HTMLScriptElement).src || (node as HTMLLinkElement).href, // src for script, href for link
					key = node.getAttribute("data-key") as string;

				if (Utils.debug > 1) {
					Utils.console.debug("onScriptLoad:", type, fullUrl, key);
				}
				node.removeEventListener("load", onScriptLoad, false);
				node.removeEventListener("error", onScriptLoad, false);

				if (type === "load") {
					fnSuccess(fullUrl, key);
				} else {
					fnError(fullUrl, key);
				}
			},
			onScriptReadyStateChange = function (event?: Event) { // for old IE8
				const node = (event ? (event.currentTarget || event.srcElement) : script) as HTMLScriptElement | HTMLLinkElement,
					fullUrl = (node as HTMLScriptElement).src || (node as HTMLLinkElement).href, // src for script, href for link
					key = node.getAttribute("data-key") as string,
					node2 = node as any;

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
						const timeout = 200; // some delay

						Utils.console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
						setTimeout(function () {
							onScriptReadyStateChange(); // check again
						}, timeout);
					} else {
						// ieTimeoutCount = 3;
						Utils.console.error("onScriptReadyStateChange: Cannot load file " + fullUrl + " readystate=" + node2.readyState);
						fnError(fullUrl, key);
					}
				} else {
					fnSuccess(fullUrl, key);
				}
			};

		if ((script as any).readyState) { // old IE8
			ieTimeoutCount = 3;
			(script as any).attachEvent("onreadystatechange", onScriptReadyStateChange);
		} else { // Others
			script.addEventListener("load", onScriptLoad, false);
			script.addEventListener("error", onScriptLoad, false);
		}
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	static loadScript(url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string): void {
		const script = document.createElement("script");

		script.type = "text/javascript";
		script.charset = "utf-8";
		script.async = true;
		script.src = url;

		script.setAttribute("data-key", key);

		this.fnLoadScriptOrStyle(script, fnSuccess, fnError);
	}

	static hexEscape(str: string): string { // as hex
		return str.replace(/[\x00-\x1f]/g, function (char: string) { // eslint-disable-line no-control-regex
			return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
		});
	}

	static hexUnescape(str: string): string {
		return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
			return String.fromCharCode(parseInt(arguments[1], 16));
		});
	}

	static dateFormat(d: Date): string {
		return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
			+ ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
	}

	static stringCapitalize(str: string): string { // capitalize first letter
		return str.charAt(0).toUpperCase() + str.substring(1);
	}

	static numberWithCommas(x: number | string): string {
		// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
		const parts = String(x).split(".");

		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	static toRadians(deg: number): number {
		return deg * Math.PI / 180;
	}

	static toDegrees(rad: number): number {
		return rad * 180 / Math.PI;
	}

	static toPrecision9(num: number): string {
		const numStr = num.toPrecision(9), // some rounding, formatting
			[decimal, exponent] = numStr.split("e"), // eslint-disable-line array-element-newline
			result = String(Number(decimal)) + (exponent !== undefined ? ("E" + exponent.replace(/(\D)(\d)$/, "$10$2")) : "");

		// Number(): strip trailing decimal point and/or zeros (replace(/\.?0*$/, ""))
		// exponent 1 digit to 2 digits
		return result;
	}

	private static testIsSupported(testExpression: string) { // does the browser support something?
		try {
			Function(testExpression); // eslint-disable-line no-new-func
		} catch (e) {
			return false;
		}
		return true;
	}

	static supportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?

	static supportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)

	static stringTrimEnd(str: string): string {
		return str.replace(/[\s\uFEFF\xA0]+$/, "");
	}

	static localStorage = (function () {
		let rc: Storage | undefined;

		if (typeof window !== "undefined") {
			try {
				rc = window.localStorage; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
			} catch (_e) {
				// empty
			}
		}
		return rc as Storage; // if it is undefined, localStorage is set in Polyfills
	}());

	static atob = (function () {
		return typeof window !== "undefined" && window.atob && window.atob.bind ? window.atob.bind(window) : null; // we need bind: https://stackoverflow.com/questions/9677985/uncaught-typeerror-illegal-invocation-in-chrome
	}()) as (arg0: string) => string;

	static btoa = (function () {
		return typeof window !== "undefined" && window.btoa && window.btoa.bind ? window.btoa.bind(window) : null; // we need bind!
	}()) as (arg0: string) => string;

	static isCustomError(e: unknown): e is CustomError {
		return (e as CustomError).pos !== undefined;
	}

	static split2(str: string, char: string): string[] {
		const index = str.indexOf(char);

		return index >= 0 ? [str.slice(0, index), str.slice(index + 1)] : [str]; // eslint-disable-line array-element-newline
	}

	static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError {
		const customError = errorObject as CustomError;

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

		let errorLen = customError.len;

		if (errorLen === undefined && customError.value !== undefined) {
			errorLen = String(customError.value).length;
		}

		const endPos = (customError.pos || 0) + (errorLen || 0),
			lineMsg = (customError.line !== undefined ? " in " + customError.line : ""),
			posMsg = pos !== undefined ? (" at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos)) : "";

		customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
		customError.message += lineMsg + posMsg + ": " + customError.value;

		return customError;
	}
}
