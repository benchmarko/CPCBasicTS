import "../Polyfills";

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";
import { NodeUtils } from "./NodeUtils";
import { NodeDocumentAdapter } from "./NodeDocumentAdapter";
import { Utils } from "../Utils";
import { View } from "../View";

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
	const nodeDocument = new NodeDocumentAdapter();

	(window as any).console = console;
	(window as any).document = nodeDocument;
	(window as any).AudioContext = () => {
		throw new Error("AudioContext not supported");
	};
	View.setDocument(nodeDocument as unknown as Document);

	NodeUtils.setLoadScriptForNode();
	cpcBasic.start(nodeStartupAdapter);
	Utils.console.debug("End of main.");
}
