import "../Polyfills";

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";
import { Utils } from "../Utils";
import { UiUtils } from "./UiUtils";

const uiStartupAdapter: CpcBasicStartupAdapter = {
	getConfigOverrides: () => window.cpcConfig || {},
	getUrlQuery: () => window.location.search.substring(1),
	getArgs: () => [],
	isNodeRuntime: () => false
};

window.cpcBasic = cpcBasic;
Utils.setLoadScript(UiUtils.loadScript);

window.onload = () => {
	cpcBasic.start(uiStartupAdapter);
};
