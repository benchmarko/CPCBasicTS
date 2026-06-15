import { Utils } from "../Utils";
import type { LoadScriptFn } from "../Interfaces";

interface PolyfillProperties {
	atob: typeof window.atob;
	getList: () => string[];
}

declare const Polyfills: PolyfillProperties | undefined;

export class TestUiUtils {
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
				if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
					if (node2.readyState === "loading" && ieTimeoutCount) {
						ieTimeoutCount -= 1;
						const timeout = 200;

						Utils.console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
						setTimeout(function () {
							onScriptReadyStateChange();
						}, timeout);
					} else {
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
		} else {
			script.addEventListener("load", onScriptLoad, false);
			script.addEventListener("error", onScriptLoad, false);
		}
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	static readonly loadScript: LoadScriptFn = (url: string, fnSuccess: (url2: string, key: string) => void, fnError: (url2: string, key: string) => void, key: string) => {
		const script = document.createElement("script");

		script.type = "text/javascript";
		script.charset = "utf-8";
		script.async = true;
		script.src = url;
		script.setAttribute("data-key", key);

		TestUiUtils.fnLoadScriptOrStyle(script, fnSuccess, fnError);
	};

	public static atob(s: string): string {
		const atobFn = typeof Polyfills !== "undefined" ? Polyfills.atob : window.atob;
		return atobFn(s);
	}

	public static getPolyfills() {
		const polyfills = typeof Polyfills !== "undefined" ? Polyfills.getList() : [];
		return polyfills;
	}
}
