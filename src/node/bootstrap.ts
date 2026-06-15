//
// Examples:
// node ./dist/cpcbasic-node-bootstrap.js sound=false showCpc=false debug=0 databaseDirs=./examples example=test/testpage
// node ./dist/cpcbasic-node-bootstrap.js sound=false showCpc=false debug=0 databaseDirs=https://benchmarko.github.io/CPCBasicApps/apps database=apps example=math/euler

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";
import { NodeUtils } from "./NodeUtils";
import { Utils } from "../Utils";
import type { ConfigType } from "../Interfaces";

const nodeStartupAdapter: CpcBasicStartupAdapter = {
	getConfigOverrides: () => ({} as Partial<ConfigType>),
	getArgs: () => {
		// eslint-disable-next-line no-new-func
		const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE

		return (myGlobalThis.process && myGlobalThis.process.argv) ? myGlobalThis.process.argv.slice(2) : [];
	},
	isNodeRuntime: () => true,
	getUI: () => undefined,
	getNodeUtils: () => new NodeUtils()
};

//NodeUtils.setLoadScriptForNode();
cpcBasic.start(nodeStartupAdapter);
Utils.console.debug("End of main.");
