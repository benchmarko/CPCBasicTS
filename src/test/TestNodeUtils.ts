import { Utils } from "../Utils";
import type { LoadScriptFn } from "../Interfaces";

type NodeHttps = typeof import("node:https");
type NodeFs = typeof import("node:fs");
type TestNodeGlobalThis = typeof globalThis & { process?: { cwd: () => string } };

function requireNodeModule(moduleName: "https"): NodeHttps;
function requireNodeModule(moduleName: "fs"): NodeFs;
function requireNodeModule(moduleName: "https" | "fs"): NodeHttps | NodeFs {
	// eslint-disable-next-line no-eval, @typescript-eslint/no-unsafe-call
	return eval("require")(moduleName) as NodeHttps | NodeFs;
}

// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func, @typescript-eslint/no-unsafe-call
const myGlobalThis: TestNodeGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")() as TestNodeGlobalThis; // for old IE

export class TestNodeUtils {
	private static nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeHttps = requireNodeModule("https");

		nodeHttps.get(url, (resp) => {
			let data = "";

			resp.on("data", (chunk: string) => {
				data += chunk;
			});

			resp.on("end", () => {
				fnDataLoaded(undefined, data);
			});
		}).on("error", (err: Error) => {
			Utils.console.log("Error: " + err.message);
			fnDataLoaded(err);
		});
	}

	private static nodeReadFile(name: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeFs = requireNodeModule("fs"),
			cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "",
			name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;

		nodeFs.readFile(name2, "utf8", (error, data) => {
			fnDataLoaded(error ?? undefined, data);
		});
	}

	private static isUrl(s: string) {
		return s.startsWith("http"); // http or https
	}

	public static readonly loadScript: LoadScriptFn = (fileOrUrl: string, fnSuccess: (url2: string, key: string) => void, _fnError, key: string) => {
		const fnLoaded = (error: Error | undefined, data?: string) => {
			if (error) {
				Utils.console.error("file error: ", error);
			}
			if (data) {
				eval(data); // eslint-disable-line no-eval
			}
			fnSuccess(fileOrUrl, key);
		};

		if (TestNodeUtils.isUrl(fileOrUrl)) {
			TestNodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
		} else {
			TestNodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
		}
	};

	/*
	static setLoadScriptForNode() {
		Utils.setLoadScript(TestNodeUtils.loadScript);
	}
	*/

	// https://dirask.com/posts/Node-js-atob-btoa-functions-equivalents-1Aqb51
	public static atob(input: string) { // decode
		return Buffer.from(input, "base64").toString("binary");
	}

	public static btoa(input: string) { // encode
		return Buffer.from(input, "binary").toString("base64");
	}

	public static isNodeRuntime() {
		return Boolean(myGlobalThis.process);
	}
}
