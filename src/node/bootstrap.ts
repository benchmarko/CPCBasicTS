import "../Polyfills";
import "../amdLoader";

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";
import { NodeAdapt } from "../NodeAdapt";
import { Utils } from "../Utils";
import { View } from "../View";
import { Controller } from "../Controller";

const nodeStartupAdapter: CpcBasicStartupAdapter = {
	getConfigOverrides: () => window.cpcConfig || {},
	getUrlQuery: () => "",
	getArgs: () => {
		// eslint-disable-next-line no-new-func
		const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE

		return (myGlobalThis.process && myGlobalThis.process.argv) ? myGlobalThis.process.argv.slice(2) : [];
	},
	isNodeRuntime: () => true
};

window.cpcBasic = cpcBasic;

if (window.Polyfills.isNodeAvailable) {
	NodeAdapt.doAdapt({
		View,
		Controller,
		Utils
	});
	cpcBasic.start(nodeStartupAdapter);
	Utils.console.debug("End of main.");
}
