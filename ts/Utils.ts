// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

export interface CustomError extends Error {
	value: string
	pos: number
	line?: number | string
	hidden?: boolean
	shortMessage?: string
}

export class Utils { // eslint-disable-line vars-on-top
	static debug = 0;

	static console = (function () {
		return typeof window !== "undefined" ? window.console : globalThis.console; // browser or node.js
	}());

	private static fnLoadScriptOrStyle(script: HTMLScriptElement | HTMLLinkElement, fnSuccess: (sUrl: string, sKey: string) => void, fnError: (sUrl: string, sKey: string) => void) {
		// inspired by https://github.com/requirejs/requirejs/blob/master/require.js
		let iIEtimeoutCount = 3;
		const onScriptLoad = function (event: Event) {
				const sType = event.type, // "load" or "error"
					node = (event.currentTarget || event.srcElement) as HTMLScriptElement | HTMLLinkElement,
					sFullUrl = (node as HTMLScriptElement).src || (node as HTMLLinkElement).href, // src for script, href for link
					sKey = node.getAttribute("data-key") as string;

				if (Utils.debug > 1) {
					Utils.console.debug("onScriptLoad:", sType, sFullUrl, sKey);
				}
				node.removeEventListener("load", onScriptLoad, false);
				node.removeEventListener("error", onScriptLoad, false);

				if (sType === "load") {
					fnSuccess(sFullUrl, sKey);
				} else {
					fnError(sFullUrl, sKey);
				}
			},
			onScriptReadyStateChange = function (event?: Event) { // for old IE8
				const node = (event ? (event.currentTarget || event.srcElement) : script) as HTMLScriptElement | HTMLLinkElement,
					sFullUrl = (node as HTMLScriptElement).src || (node as HTMLLinkElement).href, // src for script, href for link
					sKey = node.getAttribute("data-key") as string,
					node2 = node as any;

				if (node2.detachEvent) {
					node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
				}

				if (Utils.debug > 1) {
					Utils.console.debug("onScriptReadyStateChange: " + sFullUrl);
				}
				// check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
				if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
					if (node2.readyState === "loading" && iIEtimeoutCount) {
						iIEtimeoutCount -= 1;
						const iTimeout = 200; // some delay

						Utils.console.error("onScriptReadyStateChange: Still loading: " + sFullUrl + " Waiting " + iTimeout + "ms (count=" + iIEtimeoutCount + ")");
						setTimeout(function () {
							onScriptReadyStateChange(undefined); // check again
						}, iTimeout);
					} else {
						// iIEtimeoutCount = 3;
						Utils.console.error("onScriptReadyStateChange: Cannot load file " + sFullUrl + " readystate=" + node2.readyState);
						fnError(sFullUrl, sKey);
					}
				} else {
					fnSuccess(sFullUrl, sKey);
				}
			};

		if ((script as any).readyState) { // old IE8
			iIEtimeoutCount = 3;
			(script as any).attachEvent("onreadystatechange", onScriptReadyStateChange);
		} else { // Others
			script.addEventListener("load", onScriptLoad, false);
			script.addEventListener("error", onScriptLoad, false);
		}
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	static loadScript(sUrl: string, fnSuccess: (sUrl2: string, sKey: string) => void, fnError: (sUrl2: string, sKey: string) => void, sKey: string): void {
		const script = document.createElement("script");

		script.type = "text/javascript";
		script.charset = "utf-8";
		script.async = true;
		script.src = sUrl;

		script.setAttribute("data-key", sKey);

		this.fnLoadScriptOrStyle(script, fnSuccess, fnError);
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
		const aParts = String(x).split(".");

		aParts[0] = aParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return aParts.join(".");
	}

	static toRadians(deg: number): number {
		return deg * Math.PI / 180;
	}

	static toDegrees(rad: number): number {
		return rad * 180 / Math.PI;
	}

	private static testIsSupported(sTestExpression: string) { // does the browser support something?
		try {
			Function(sTestExpression); // eslint-disable-line no-new-func
		} catch (e) {
			return false;
		}
		return true;
	}

	static bSupportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?

	static bSupportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)

	static stringTrimEnd(sStr: string): string {
		return sStr.replace(/[\s\uFEFF\xA0]+$/, "");
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

	static composeError(name: string, oErrorObject: Error, message: string, value: string, pos: number, line?: string | number, hidden?: boolean): CustomError {
		const oCustomError = oErrorObject as CustomError;

		oCustomError.name = name;
		oCustomError.message = message;
		oCustomError.value = value;
		if (pos !== undefined) {
			oCustomError.pos = pos;
		}
		if (line !== undefined) {
			oCustomError.line = line;
		}
		if (hidden !== undefined) {
			oCustomError.hidden = hidden;
		}

		const iEndPos = (oCustomError.pos || 0) + ((oCustomError.value !== undefined) ? String(oCustomError.value).length : 0);

		oCustomError.shortMessage = oCustomError.message + (oCustomError.line !== undefined ? " in " + oCustomError.line : " at pos " + (oCustomError.pos || 0) + "-" + iEndPos) + ": " + oCustomError.value;
		oCustomError.message += (oCustomError.line !== undefined ? " in " + oCustomError.line : "") + " at pos " + (oCustomError.pos || 0) + "-" + iEndPos + ": " + oCustomError.value;
		return oCustomError;
	}
}
