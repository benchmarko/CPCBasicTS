import type { IStorage, RuntimeHost } from "../Interfaces";
import { UiUtils } from "./UiUtils";

function createMemoryStorage(): IStorage {
	const items = new Map<string, string>();

	return {
		get length() {
			return items.size;
		},
		clear: () => { items.clear(); },
		getItem: (key) => items.get(key) ?? null,
		key: (index) => Array.from(items.keys())[index] ?? null,
		removeItem: (key) => { items.delete(key); },
		setItem: (key, value) => { items.set(key, String(value)); }
	};
}

export function createBrowserHost(overrides: Partial<RuntimeHost> = {}): RuntimeHost {
	let fallbackStorage: IStorage | undefined;

	return {
		get storage() {
			if (overrides.storage) {
				return overrides.storage;
			}
			if (fallbackStorage) {
				return fallbackStorage;
			}

			let storage: Storage | undefined,
				accessFailed = false,
				accessError: unknown;

			try {
				storage = window.localStorage;
			} catch (error) {
				accessFailed = true;
				accessError = error;
			}

			if (storage) {
				return storage;
			}

			if (accessFailed) {
				UiUtils.console.warn("BrowserHost: localStorage is inaccessible; using temporary in-memory storage.", accessError);
			} else {
				UiUtils.console.warn("BrowserHost: localStorage is unavailable; using temporary in-memory storage.");
			}
			fallbackStorage = createMemoryStorage();
			return fallbackStorage;
		},
		loadScript: overrides.loadScript ?? UiUtils.loadScript,
		atobFn: (input) => overrides.atobFn ? overrides.atobFn(input) : window.atob(input),
		btoaFn: (input) => overrides.btoaFn ? overrides.btoaFn(input) : window.btoa(input),
		setTimeout: (callback, delay) => overrides.setTimeout ? overrides.setTimeout(callback, delay) : window.setTimeout(callback, delay)
	};
}