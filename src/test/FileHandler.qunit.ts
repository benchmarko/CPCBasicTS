import { DiskImage } from "../DiskImage";
import { FileHandler } from "../FileHandler";
import type { FileMeta } from "../CpcVm";
import type { IStorage } from "../Interfaces";

function saveFile(typeString: string, fileData: string[] = []) {
	return { typeString, name: "demo", command: "save", fileData } as FileMeta & { name: string, command: string, fileData: string[] };
}

function stored(typeString: string, data: string, encoding = ""): string {
	return FileHandler.joinMeta({ typeString, encoding }) + "," + data;
}

function createDecoder() {
	const events: string[] = [];
	return {
		events,
		options: {
			atobFn: (input: string) => { events.push("base64:" + input); return "decoded\x1a\x1a"; },
			decodeTokenizedBasic: (input: string) => { events.push("tokens:" + input); return "10 END"; },
			applySnapshot: (input: string) => { events.push("snapshot:" + input); return "memory"; },
			importArchive: (input: string, type: "X" | "Z") => { events.push(type + ":" + input); return ["first.bas", "second.bin"]; }
		}
	};
}
function createFileOperations() {
	const data = new Map<string, string>(),
		events: string[] = [],
		storage: IStorage = {
			get length() { return data.size; },
			clear: () => data.clear(),
			getItem: (key) => data.get(key) ?? null,
			key: (index) => Array.from(data.keys())[index] ?? null,
			removeItem: (key) => { data.delete(key); },
			setItem: (key, value) => { data.set(key, value); }
		},
		handler = new FileHandler({
			adaptFilename: (name) => name,
			updateStorageDatabase: (action, key) => { events.push(action + ":" + key); },
			outputError: () => undefined,
			storage
		});
	return { data, events, storage, handler };
}

QUnit.module("FileHandler", function () {
	QUnit.test("ERA deletes matching CPC files and reports storage races", function (assert) {
		const host = createFileOperations(),
			meta = stored("A", "10 END");
		host.data.set("one.bas", meta);
		host.data.set("two.bin", meta);
		host.data.set("other.bas", meta);
		host.data.set("foreign.bas", "not CPC metadata");
		const erased = host.handler.eraseFiles("*.bas");
		assert.deepEqual(erased, { name: "*.bas", matched: true, removed: ["one.bas", "other.bas"], missing: [] });
		assert.deepEqual(host.events, ["remove:one.bas", "remove:other.bas"]);
		assert.strictEqual(host.data.has("two.bin"), true);
		assert.strictEqual(host.data.has("foreign.bas"), true);

		let firstRead = true;
		const racingStorage: IStorage = {
			get length() { return 1; }, clear: () => undefined,
			getItem: () => { if (firstRead) { firstRead = false; return meta; } return null; },
			key: () => "gone.bas", removeItem: () => undefined, setItem: () => undefined
		};
		const racing = new FileHandler({
			adaptFilename: (name) => name,
			updateStorageDatabase: () => assert.ok(false, "Missing entry must not update database"),
			outputError: () => undefined,
			storage: racingStorage
		});
		assert.deepEqual(racing.eraseFiles("gone.bas"), { name: "gone.bas", matched: true, removed: [], missing: ["gone.bas"] });
	});

	QUnit.test("REN moves data and updates the database in write-then-remove order", function (assert) {
		const host = createFileOperations();
		host.data.set("old.", stored("A", "10 END"));
		const renamed = host.handler.renameFile("old", "new");
		assert.deepEqual(renamed, { status: "renamed", oldName: "old.", newName: "new." });
		assert.strictEqual(host.data.has("old."), false);
		assert.strictEqual(host.data.get("new."), stored("A", "10 END"));
		assert.deepEqual(host.events, ["set:new.", "remove:old."]);
	});

	QUnit.test("REN preserves missing, existing, and empty-destination behavior", function (assert) {
		const host = createFileOperations();
		host.data.set("old.", "old data");
		host.data.set("occupied.", "occupied data");
		assert.deepEqual(host.handler.renameFile("missing", "new"), { status: "oldNotFound", oldName: "missing.", newName: "new." });
		assert.deepEqual(host.handler.renameFile("old", "occupied"), { status: "newExists", oldName: "old.", newName: "occupied." });
		host.data.set("empty.", "");
		assert.deepEqual(host.handler.renameFile("old", "empty"), { status: "renamed", oldName: "old.", newName: "empty." });
		assert.strictEqual(host.data.get("empty."), "old data");
	});

	QUnit.test("relative example paths preserve the selected example as their base", function (assert) {
		assert.deepEqual(FileHandler.resolveExamplePath("next", "folder/main"), { name: "folder/next", memorizedExample: "folder/main" });
		assert.deepEqual(FileHandler.resolveExamplePath("next", "main"), { name: "next", memorizedExample: "main" });
		assert.deepEqual(FileHandler.resolveExamplePath("../next", "folder/sub/main"), { name: "folder/next", memorizedExample: "folder/sub/main" });
		assert.deepEqual(FileHandler.resolveExamplePath("../../next", "folder/sub/main"), { name: "folder/../next", memorizedExample: "folder/sub/main" });
	});

	QUnit.test("absolute example paths replace the memorized example and preserve empty names", function (assert) {
		assert.deepEqual(FileHandler.resolveExamplePath("/other/demo", "folder/main"), { name: "other/demo", memorizedExample: "other/demo" });
		assert.deepEqual(FileHandler.resolveExamplePath("/", "folder/main"), { name: "", memorizedExample: "" });
		assert.deepEqual(FileHandler.resolveExamplePath("", "main"), { name: "", memorizedExample: "main" });
		assert.deepEqual(FileHandler.resolveExamplePath("", "folder/main"), { name: "folder/", memorizedExample: "folder/main" });
	});

	QUnit.test("example load plans distinguish loaded, fetchable, and missing entries", function (assert) {
		const examples = {
			"folder/ready": { key: "folder/ready", title: "", meta: "", loaded: true },
			"folder/lazy": { key: "folder/lazy", title: "", meta: "" }
		};
		assert.deepEqual(FileHandler.prepareExampleLoad("ready", "folder/main", examples, "examples"), {
			name: "folder/ready", memorizedExample: "folder/main", entry: examples["folder/ready"], url: "folder/ready", status: "loaded"
		});
		assert.deepEqual(FileHandler.prepareExampleLoad("lazy", "folder/main", examples, "examples"), {
			name: "folder/lazy", memorizedExample: "folder/main", entry: examples["folder/lazy"], url: "examples/folder/lazy.js", status: "fetch"
		});
		assert.deepEqual(FileHandler.prepareExampleLoad("absent", "folder/main", examples, "examples"), {
			name: "folder/absent", memorizedExample: "folder/main", entry: undefined, url: "folder/absent", status: "missing"
		});
	});

	QUnit.test("directory formatting preserves CPC padding and output chunks", function (assert) {
		const entries = ["demo.bas", "bare"];
		assert.deepEqual(FileHandler.formatDirectoryEntries(entries), [
			"\r\nDrive A: user  0\r\n\r\n",
			"demo    .bas  ",
			"bare    .     ",
			"\r\n\r\n999K free\r\n\r\n"
		]);
		assert.deepEqual(entries, ["demo.bas", "bare"]);
	});

	QUnit.test("directory sorting uses formatted names without reordering input", function (assert) {
		const entries = ["z.bin", "a", "b."];
		assert.deepEqual(FileHandler.formatDirectoryEntries(entries, true).slice(1, -1), ["a       .     ", "b       .     ", "z       .bin  "]);
		assert.deepEqual(entries, ["z.bin", "a", "b."]);
		assert.strictEqual(FileHandler.formatDirectoryEntries(entries, false)[1], "z       .bin  ");
	});

	QUnit.test("DIR merges scoped examples with storage entries and removes duplicates", function (assert) {
		const host = createFileOperations(),
			examples = {
				duplicate: { key: "folder/duplicate.bas", title: "", meta: "" },
				newFile: { key: "folder/new.bas", title: "", meta: "" },
				other: { key: "other/ignored.bas", title: "", meta: "" }
			};
		host.data.set("stored.bas", stored("A", "10 END"));
		host.data.set("duplicate.bas", stored("A", "10 END"));
		assert.deepEqual(FileHandler.getDirectoryEntries(host.storage, examples, "folder/main", "*.bas"), ["stored.bas", "duplicate.bas", "new.bas"]);
	});

	QUnit.test("directory formatting retains legacy handling of long and multi-dot names", function (assert) {
		assert.deepEqual(FileHandler.formatDirectoryEntries(["longfilename.long", "multi.bas.extra"]).slice(1, -1), ["longfilename.long  ", "multi   .bas  "]);
		assert.deepEqual(FileHandler.formatDirectoryEntries([]), ["\r\nDrive A: user  0\r\n\r\n", "\r\n\r\n999K free\r\n\r\n"]);
	});

	QUnit.test("ASCII save uses source text and updates length", function (assert) {
		const file = saveFile("A"),
			source = "10 END",
			result = FileHandler.prepareSave(file, () => source, () => { throw new Error("Unexpected tokenization"); });
		assert.strictEqual(result.name, "demo.");
		assert.strictEqual(result.data, source);
		assert.strictEqual(file.length, source.length);
		assert.strictEqual(FileHandler.splitMeta(result.storedData).data, source);
	});

	QUnit.test("saveFile persists prepared data and refreshes the storage database", function (assert) {
		const host = createFileOperations(),
			file = saveFile("A"),
			result = host.handler.saveFile(file, () => "10 END", () => { throw new Error("Unexpected tokenization"); }),
			expectedStored = FileHandler.joinMeta(file) + ",10 END";
		assert.deepEqual(result, { name: "demo.", data: "10 END", storedData: expectedStored });
		assert.strictEqual(host.data.get("demo."), expectedStored);
		assert.deepEqual(host.events, ["set:demo."]);
	});

	QUnit.test("tokenized and protected saves pass the resolved name to tokenization", function (assert) {
		const tokens = "\x01\x02\xff\x00";
		for (const type of ["T", "P"]) {
			const file = saveFile(type);
			const result = FileHandler.prepareSave(file, () => "10 END", (input, name) => {
				assert.strictEqual(input, "10 END");
				assert.strictEqual(name, "demo.bas");
				return tokens;
			});
			assert.strictEqual(result.data, type === "P" ? DiskImage.unOrProtectData(tokens) : tokens);
			assert.strictEqual(file.length, tokens.length);
			assert.strictEqual(FileHandler.splitMeta(result.storedData).meta.typeString, type);
		}
	});

	QUnit.test("failed tokenization preserves the existing ASCII fallback metadata", function (assert) {
		const file = saveFile("P"),
			result = FileHandler.prepareSave(file, () => "invalid", () => "");
		assert.strictEqual(result.name, "demo.bas");
		assert.strictEqual(result.data, "");
		assert.strictEqual(file.typeString, "A");
		assert.strictEqual(file.length, 0);
		assert.strictEqual(FileHandler.splitMeta(result.storedData).meta.typeString, "A");
	});

	QUnit.test("buffered and binary files do not read BASIC source", function (assert) {
		const noSource = () => { throw new Error("Unexpected source read"); };
		const binary = saveFile("B", ["\x00,", "\xff"]);
		binary.length = 99;
		const result = FileHandler.prepareSave(binary, noSource, noSource);
		assert.strictEqual(result.name, "demo.bin");
		assert.strictEqual(result.data, "\x00,\xff");
		assert.strictEqual(binary.length, 99);
		const buffered = saveFile("A", ["first", "second"]);
		assert.strictEqual(FileHandler.prepareSave(buffered, noSource, noSource).data, "firstsecond");
		assert.strictEqual(buffered.length, 11);
		const empty = saveFile("A");
		empty.command = "openout";
		assert.strictEqual(FileHandler.prepareSave(empty, noSource, noSource).data, "");
		assert.strictEqual(empty.length, 0);
	});

	QUnit.test("example loading preserves absolute example keys and relative storage names", function (assert) {
		assert.deepEqual(FileHandler.createExampleLoadRequest("folder/demo", "examples", "A", true), { name: "/folder/demo", command: "run" });
		assert.deepEqual(FileHandler.createExampleLoadRequest("demo.bas", "storage", "A", true), { name: "demo.bas", command: "run" });
		assert.deepEqual(FileHandler.createExampleLoadRequest("", "examples", undefined, false), { name: "/", command: "load" });
	});

	QUnit.test("binary, data, and assembler metadata disable autorun", function (assert) {
		for (const metadata of ["B", "D", "G", "B;extra", "D;extra", "G;extra"]) {
			assert.strictEqual(FileHandler.createExampleLoadRequest("demo", "examples", metadata, true).command, "load", metadata);
		}
	});

	QUnit.test("other example types respect the requested autorun setting", function (assert) {
		for (const metadata of [undefined, "", "A", "T", "P", "S", "X", "Z"]) {
			assert.strictEqual(FileHandler.createExampleLoadRequest("demo", "examples", metadata, true).command, "run", String(metadata));
			assert.strictEqual(FileHandler.createExampleLoadRequest("demo", "examples", metadata, false).command, "load", String(metadata));
		}
	});

	QUnit.test("base64 decoding precedes ASCII EOF removal and preserves metadata", function (assert) {
		const host = createDecoder(),
			output = FileHandler.decodeStoredFile(stored("A", "encoded", "base64"), host.options);
		assert.strictEqual(output.data, "decoded");
		assert.strictEqual(output.meta.typeString, "A");
		assert.strictEqual(output.meta.encoding, "base64");
		assert.deepEqual(host.events, ["base64:encoded"]);
		assert.strictEqual(FileHandler.decodeStoredFile(stored("A", "a\x1ab\x1a"), host.options).data, "a\x1ab");
	});

	QUnit.test("tokenized and protected BASIC use the same token decoder", function (assert) {
		const host = createDecoder(),
			tokens = "\x01\x02\xff\x00";
		assert.strictEqual(FileHandler.decodeStoredFile(stored("T", tokens), host.options).data, "10 END");
		assert.strictEqual(FileHandler.decodeStoredFile(stored("P", DiskImage.unOrProtectData(tokens)), host.options).data, "10 END");
		assert.deepEqual(host.events, ["tokens:" + tokens, "tokens:" + tokens]);
	});

	QUnit.test("binary, plain, and unknown formats preserve their payloads", function (assert) {
		const host = createDecoder(),
			data = "\x00,\xff\x1a";
		for (const type of ["B", "?"]) {
			assert.strictEqual(FileHandler.decodeStoredFile(stored(type, data), host.options).data, data);
		}
		assert.strictEqual(FileHandler.decodeStoredFile(data, host.options).data, data);
		assert.deepEqual(host.events, []);
	});

	QUnit.test("GENA assembler lines retain little-endian numbers and both terminators", function (assert) {
		const host = createDecoder(),
			data = "\x00\x00\x00\x00\x0a\x00LD A,1\r\x14\x00RET\x1c";
		assert.strictEqual(FileHandler.decodeStoredFile(stored("G", data), host.options).data, "10 LD A,1\n20 RET\n");
		assert.deepEqual(host.events, []);
	});

	QUnit.test("snapshot and archive side effects are delegated to host callbacks", function (assert) {
		const host = createDecoder();
		assert.strictEqual(FileHandler.decodeStoredFile(stored("S", "snapshot"), host.options).data, "memory");
		assert.strictEqual(FileHandler.decodeStoredFile(stored("X", "disk"), host.options).data, "1 ' first.bas, second.bin");
		assert.strictEqual(FileHandler.decodeStoredFile(stored("Z", "zip"), host.options).data, "1 ' first.bas, second.bin");
		assert.deepEqual(host.events, ["snapshot:snapshot", "X:disk", "Z:zip"]);
	});

	QUnit.test("decoder callback errors remain visible to the caller", function (assert) {
		const host = createDecoder(),
			error = new Error("decode failure");
		host.options.atobFn = () => { throw error; };
		assert.throws(() => FileHandler.decodeStoredFile(stored("A", "encoded", "base64"), host.options), error);
	});
});