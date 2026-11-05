import type { RuntimeHost } from "../Interfaces";
import { UiUtils } from "./UiUtils";

export function createBrowserHost(overrides: Partial<RuntimeHost> = {}): RuntimeHost {
	return {
		get storage() {
			return overrides.storage ?? (Polyfills.localStorage || window.localStorage);
		},
		loadScript: overrides.loadScript ?? UiUtils.loadScript,
		atobFn: (input) => overrides.atobFn ? overrides.atobFn(input) : window.atob(input),
		btoaFn: (input) => overrides.btoaFn ? overrides.btoaFn(input) : window.btoa(input),
		setTimeout: (callback, delay) => overrides.setTimeout ? overrides.setTimeout(callback, delay) : window.setTimeout(callback, delay)
	};
}