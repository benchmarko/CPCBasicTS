import { LoadScriptFn, Utils } from "../Utils";

interface NodeHttps {
	get: (url: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (name: string, encoding: string, fn: (res: any) => void) => any
}

export class NodeUtils {
	private static nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeHttps = eval("require")("https") as NodeHttps; // eslint-disable-line no-eval

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
		const nodeFs = eval("require")("fs") as NodeFs, // eslint-disable-line no-eval
			myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(), // eslint-disable-line no-new-func
			cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "",
			name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;

		nodeFs.readFile(name2, "utf8", fnDataLoaded);
	}

	private static isUrl(s: string) {
		return s.startsWith("http"); // http or https
	}

	static readonly loadScript: LoadScriptFn = (fileOrUrl, fnSuccess, _fnError, key) => {
		const fnLoaded = (error: Error | undefined, data?: string) => {
			if (error) {
				Utils.console.error("file error: ", error);
			}
			if (data) {
				eval(data); // eslint-disable-line no-eval
			}
			fnSuccess(fileOrUrl, key);
		};

		if (NodeUtils.isUrl(fileOrUrl)) {
			NodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
		} else {
			NodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
		}
	};

	static setLoadScriptForNode() {
		Utils.setLoadScript(NodeUtils.loadScript);
	}
}