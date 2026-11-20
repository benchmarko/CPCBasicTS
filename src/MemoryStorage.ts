import type { IStorage } from "./Interfaces";

export function createMemoryStorage(): IStorage {
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
