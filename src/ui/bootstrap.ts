import "../Polyfills";
import "../amdLoader";

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";

const uiStartupAdapter: CpcBasicStartupAdapter = {
	getConfigOverrides: () => window.cpcConfig || {},
	getUrlQuery: () => window.location.search.substring(1),
	getArgs: () => [],
	isNodeRuntime: () => false
};

window.cpcBasic = cpcBasic;

window.onload = () => {
	cpcBasic.start(uiStartupAdapter);
};
