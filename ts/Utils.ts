// Utils.js - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//

export interface CustomError extends Error {
	value: any
	pos?: number
	line?: number | string
	hidden?: boolean
	shortMessage?: string
}

export var Utils = { // eslint-disable-line vars-on-top
	debug: 0,
	console: typeof window !== "undefined" ? window.console : globalThis.console, // browser or node.js

	fnLoadScriptOrStyle: function (script: HTMLScriptElement | HTMLLinkElement, sFullUrl: string, fnSuccess, fnError) {
		// inspired by https://github.com/requirejs/requirejs/blob/master/require.js
		var iIEtimeoutCount = 3,
			onScriptLoad = function (event: Event) {
				const node = event.currentTarget || event.srcElement;

				if (Utils.debug > 1) {
					Utils.console.debug("onScriptLoad:", (node as any).src || (node as any).href);
				}
				node.removeEventListener("load", onScriptLoad, false);
				node.removeEventListener("error", onScriptError, false); // eslint-disable-line no-use-before-define

				if (fnSuccess) {
					fnSuccess(sFullUrl);
				}
			},
			onScriptError = function (event: Event) {
				const node = event.currentTarget || event.srcElement;

				if (Utils.debug > 1) {
					Utils.console.debug("onScriptError:", (node as any).src || (node as any).href);
				}
				node.removeEventListener("load", onScriptLoad, false);
				node.removeEventListener("error", onScriptError, false);

				if (fnError) {
					fnError(sFullUrl);
				}
			},
			onScriptReadyStateChange = function (event: Event) { // for old IE8
				const node = event ? (event.currentTarget || event.srcElement) : script,
					node2 = node as any;

				if (node2.detachEvent) {
					node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
				}

				if (Utils.debug > 1) {
					Utils.console.debug("onScriptReadyStateChange: " + node2.src || node2.href);
				}
				// check also: https://stackoverflow.com/questions/1929742/can-script-readystate-be-trusted-to-detect-the-end-of-dynamic-script-loading
				if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
					if (node2.readyState === "loading" && iIEtimeoutCount) {
						iIEtimeoutCount -= 1;
						const iTimeout = 200; // some delay

						Utils.console.error("onScriptReadyStateChange: Still loading: " + (node2.src || node2.href) + " Waiting " + iTimeout + "ms (count=" + iIEtimeoutCount + ")");
						setTimeout(function () {
							onScriptReadyStateChange(null); // check again
						}, iTimeout);
					} else {
						// iIEtimeoutCount = 3;
						Utils.console.error("onScriptReadyStateChange: Cannot load file " + (node2.src || node2.href) + " readystate=" + node2.readyState);
						if (fnError) {
							fnError(sFullUrl);
						}
					}
				} else if (fnSuccess) {
					fnSuccess(sFullUrl);
				}
			};

		if ((script as any).readyState) { // old IE8
			iIEtimeoutCount = 3;
			(script as any).attachEvent("onreadystatechange", onScriptReadyStateChange);
		} else { // Others
			script.addEventListener("load", onScriptLoad, false);
			script.addEventListener("error", onScriptError, false);
		}
		document.getElementsByTagName("head")[0].appendChild(script);
		return sFullUrl;
	},
	loadScript: function (sUrl: string, fnSuccess, fnError) {
		const script = document.createElement("script");

		script.type = "text/javascript";
		script.charset = "utf-8";
		script.async = true;
		script.src = sUrl;

		const sFullUrl = script.src;

		this.fnLoadScriptOrStyle(script, sFullUrl, fnSuccess, fnError);
	},
	loadStyle: function (sUrl: string, fnSuccess, fnError) {
		const link = document.createElement("link");

		link.rel = "stylesheet";
		link.href = sUrl;

		const sFullUrl = link.href;

		this.fnLoadScriptOrStyle(link, sFullUrl, fnSuccess, fnError);
	},

	dateFormat: function (d: Date) {
		return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
			+ ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
	},
	stringCapitalize: function (str: string) { // capitalize first letter
		return str.charAt(0).toUpperCase() + str.substring(1);
	},
	numberWithCommas: function (x: number) {
		// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
		var aParts = String(x).split(".");

		aParts[0] = aParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return aParts.join(".");
	},
	toRadians: function (deg: number) {
		return deg * Math.PI / 180;
	},
	toDegrees: function (rad: number) {
		return rad * 180 / Math.PI;
	},
	getChangedParameters: function (current, initial) {
		const oChanged = {};

		for (const sName in current) {
			if (current.hasOwnProperty(sName)) {
				if (current[sName] !== initial[sName]) {
					oChanged[sName] = current[sName];
				}
			}
		}
		return oChanged;
	},
	bSupportsBinaryLiterals: (function () { // does the browser support binary literals?
		try {
			Function("0b01"); // eslint-disable-line no-new-func
		} catch (e) {
			return false;
		}
		return true;
	}()),

	bSupportReservedNames: (function () { // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
		try {
			Function("({}).return()"); // eslint-disable-line no-new-func
		} catch (e) {
			return false;
		}
		return true;
	}()),

	localStorage: (function () {
		var rc;

		try {
			rc = typeof window !== "undefined" ? window.localStorage : null; // due to a bug in MS Edge this will throw an error when hosting locally (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8816771/)
		} catch (e) {
			rc = null;
		}
		return rc;
	}()),

	atob: typeof window !== "undefined" && window.atob && window.atob.bind ? window.atob.bind(window) : null, // we need bind: https://stackoverflow.com/questions/9677985/uncaught-typeerror-illegal-invocation-in-chrome
	btoa: typeof window !== "undefined" && window.btoa && window.btoa.bind ? window.btoa.bind(window) : null,

	composeError: function (name: string, oErrorObject: Error, message: string, value, pos?: number, line?: string | number, hidden?: boolean): CustomError {
		const oCustomError = oErrorObject as CustomError;

		if (name !== undefined) {
			oCustomError.name = name;
		}
		if (message !== undefined) {
			oCustomError.message = message;
		}
		if (value !== undefined) {
			oCustomError.value = value;
		}
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
		oCustomError.message += " in " + oCustomError.line + " at pos " + (oCustomError.pos || 0) + "-" + iEndPos + ": " + oCustomError.value;
		return oCustomError;
	}
};
