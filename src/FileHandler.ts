// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import type { CustomError, ExampleEntry, IStorage } from "./Interfaces";
import { Utils } from "./Utils";
import { FileMeta } from "./CpcVm";
import { DiskImage, AmsdosHeader } from "./DiskImage";
import { Snapshot } from "./Snapshot";
import { ZipFile } from "./ZipFile";


export interface FileHandlerOptions {
	adaptFilename: (name: string, err: string) => string;
	updateStorageDatabase: (action: string, key: string) => void;
	outputError: (error: Error, noSelection?: boolean) => void;
	processFileImports?: boolean;
	storage: IStorage;
}

export interface FileMetaAndData {
	meta: FileMeta
	data: string
}

export interface EraseFilesResult {
	name: string
	matched: boolean
	removed: string[]
	missing: string[]
}

export interface RenameFileResult {
	status: "renamed" | "oldNotFound" | "newExists"
	oldName: string
	newName: string
}

export interface ExampleLoadPlan {
	name: string
	memorizedExample: string
	entry?: ExampleEntry
	url: string
	status: "loaded" | "fetch" | "missing"
}

interface StoredFileDecoderOptions {
	atobFn: (input: string) => string
	decodeTokenizedBasic: (input: string) => string
	applySnapshot: (input: string) => string
	importArchive: (input: string, type: "X" | "Z") => string[]
}

export class FileHandler {
	private readonly options: FileHandlerOptions;

	private static readonly metaIdent = "CPCBasic";
	private static readonly defaultExtensions = ["", "bas", "bin"];

	private processFileImports = true;

	private diskImage?: DiskImage;

	constructor(options: FileHandlerOptions) {
		this.options = {} as FileHandlerOptions;
		this.setOptions(options);
	}

	setOptions(options: Partial<FileHandlerOptions>): void {
		Object.assign(this.options, options);
	}

	getDiskImage(): DiskImage {
		if (!this.diskImage) {
			this.diskImage = new DiskImage({
				data: "" // will be set later
			});
		}
		return this.diskImage;
	}

	static getStorageName(name: string, defaultExtension?: string): string {
		// modify name so we do not clash with localstorage methods/properites
		if (name.indexOf(".") < 0) { // no dot inside name?
			name += "." + (defaultExtension || ""); // append dot or default extension
		}
		return name;
	}

	static createExampleLoadRequest(key: string, database: string, metadata: string | undefined, autorun: boolean): { name: string, command: "run" | "load" } {
		const type = metadata?.charAt(0),
			loadOnly = type === "B" || type === "D" || type === "G";
		return {
			name: database === "storage" ? key : "/" + key,
			command: autorun && !loadOnly ? "run" : "load"
		};
	}

	static resolveExamplePath(name: string, currentKey: string): { name: string, memorizedExample: string } {
		if (name.charAt(0) === "/") {
			const absolute = name.substring(1);
			return { name: absolute, memorizedExample: absolute };
		}
		const lastSlash = currentKey.lastIndexOf("/");
		if (lastSlash >= 0) {
			name = currentKey.substring(0, lastSlash) + "/" + name;
			name = name.replace(/\w+\/\.\.\//, "");
		}
		return { name, memorizedExample: currentKey };
	}

	static prepareExampleLoad(name: string, currentKey: string, examples: Record<string, ExampleEntry>, databaseDir: string): ExampleLoadPlan {
		const resolved = FileHandler.resolveExamplePath(name, currentKey),
			entry = examples[resolved.name],
			status = entry?.loaded ? "loaded" : resolved.name && entry ? "fetch" : "missing";
		return {
			name: resolved.name,
			memorizedExample: resolved.memorizedExample,
			entry,
			url: status === "fetch" ? databaseDir + "/" + resolved.name + ".js" : resolved.name,
			status
		};
	}

	static prepareSave(
		file: FileMeta & { name: string, command: string, fileData: string[] },
		getSource: () => string,
		encodeTokens: (input: string, name: string) => string
	): { name: string, data: string, storedData: string } {
		const type = file.typeString,
			extension = type === "P" || type === "T" ? "bas" : type === "B" ? "bin" : "",
			name = FileHandler.getStorageName(file.name, extension);
		let data: string;
		if (file.fileData.length || type === "B" || file.command === "openout") {
			data = file.fileData.join("");
			if (!file.length) {
				file.length = data.length;
			}
		} else {
			data = getSource();
			if (type === "T" || type === "P") {
				data = encodeTokens(data, name);
				if (data === "") {
					file.typeString = "A";
				} else if (type === "P") {
					data = DiskImage.unOrProtectData(data);
				}
			}
			file.length = data.length;
		}
		return { name, data, storedData: FileHandler.joinMeta(file) + "," + data };
	}

	saveFile(
		file: FileMeta & { name: string, command: string, fileData: string[] },
		getSource: () => string,
		encodeTokens: (input: string, name: string) => string
	): { name: string, data: string, storedData: string } {
		const prepared = FileHandler.prepareSave(file, getSource, encodeTokens);
		this.options.storage.setItem(prepared.name, prepared.storedData);
		this.options.updateStorageDatabase("set", prepared.name);
		return prepared;
	}

	static loadFromStorage(storage: IStorage, name: string): string | null {
		if (name.indexOf(".") >= 0) {
			return storage.getItem(name);
		}
		for (const extension of FileHandler.defaultExtensions) {
			const data = storage.getItem(FileHandler.getStorageName(name, extension));
			if (data !== null) {
				return data;
			}
		}
		return null;
	}

	static splitMeta(input: string): FileMetaAndData {
		if (input.indexOf(FileHandler.metaIdent) === 0) {
			const index = input.indexOf(",");
			if (index >= 0) {
				const meta = input.substring(0, index).split(";");
				return {
					meta: {
						typeString: meta[1],
						start: Number(meta[2]),
						length: Number(meta[3]),
						entry: Number(meta[4]),
						encoding: meta[5]
					},
					data: input.substring(index + 1)
				};
			}
		}
		return { meta: { typeString: "" }, data: input };
	}

	static getMetaIdent(): string {
		return FileHandler.metaIdent;
	}

	static formatDirectoryEntries(entries: readonly string[], sort = false): string[] {
		const names = entries.map((entry) => {
			const parts = entry.split(".");
			return parts[0].padEnd(8, " ") + "." + (parts.length >= 2 ? parts[1] : "").padEnd(3, " ");
		});
		if (sort) {
			names.sort();
		}
		return ["\r\nDrive A: user  0\r\n\r\n", ...names.map((name) => name + "  "), "\r\n\r\n999K free\r\n\r\n"];
	}

	static decodeStoredFile(input: string, options: StoredFileDecoderOptions): FileMetaAndData {
		const result = FileHandler.splitMeta(input),
			type = result.meta.typeString;
		let data = result.data;
		if (result.meta.encoding === "base64") {
			data = options.atobFn(data);
		}
		if (type === "T") {
			data = options.decodeTokenizedBasic(data);
		} else if (type === "P") {
			data = options.decodeTokenizedBasic(DiskImage.unOrProtectData(data));
		} else if (type === "A") {
			data = data.replace(/\x1a+$/, ""); // eslint-disable-line no-control-regex
		} else if (type === "G") {
			data = FileHandler.asmGena3Convert(data);
		} else if (type === "S") {
			data = options.applySnapshot(data);
		} else if (type === "X" || type === "Z") {
			data = "1 ' " + options.importArchive(data, type).join(", ");
		}
		return { meta: result.meta, data };
	}

	private static asmGena3Convert(data: string): string {
		const length = data.length;
		let pos = 4,
			output = "";
		while (pos < length) {
			const line = data.charCodeAt(pos) + data.charCodeAt(pos + 1) * 256;
			pos += 2;
			const cr = data.indexOf("\r", pos),
				separator = data.indexOf("\x1c", pos),
				end = Math.min(cr < 0 ? length : cr, separator < 0 ? length : separator);
			output += line + " " + data.substring(pos, end) + "\n";
			pos = end + 1;
		}
		return output;
	}

	static prepareMaskRegExp(mask: string): RegExp {
		mask = mask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
		mask = mask.replace(/\?/g, ".");
		mask = mask.replace(/\*/g, ".*");
		return new RegExp("^" + mask + "$");
	}

	static getStorageDirectoryEntries(storage: IStorage, mask?: string): string[] {
		const entries: string[] = [],
			regExp = mask ? FileHandler.prepareMaskRegExp(mask) : undefined;
		for (let index = 0; index < storage.length; index += 1) {
			const key = storage.key(index);
			if (key === null) {
				continue;
			}
			const data = storage.getItem(key);
			if (data !== null && data.startsWith(FileHandler.metaIdent)) {
				const matchKey = key.replace(/[\n\r]/g, "");
				if (!regExp || regExp.test(matchKey)) {
					entries.push(key);
				}
			}
		}
		return entries;
	}

	static getDirectoryEntries(storage: IStorage, examples: Record<string, ExampleEntry>, currentExample: string, mask?: string): string[] {
		let fileMask = mask ? FileHandler.getStorageName(mask) : "";
		const entries = FileHandler.getStorageDirectoryEntries(storage, fileMask),
			lastSlash = currentExample.lastIndexOf("/");
		let path = "";

		if (lastSlash >= 0) {
			path = currentExample.substring(0, lastSlash) + "/";
			fileMask = path + (fileMask || "*.*");
		}

		const regExp = fileMask ? FileHandler.prepareMaskRegExp(fileMask) : undefined,
			fileExists: Record<string, boolean> = {};
		for (const entry of entries) {
			fileExists[entry] = true;
		}
		for (const key in examples) {
			if (Object.prototype.hasOwnProperty.call(examples, key)) {
				const example = examples[key],
					name = example.key,
					matchName = name + (name.indexOf(".") < 0 ? "." : "");
				if (!regExp || regExp.test(matchName)) {
					const entry = name.substring(path.length);
					if (!fileExists[entry]) {
						fileExists[entry] = true;
						entries.push(entry);
					}
				}
			}
		}
		return entries;
	}

	eraseFiles(mask: string): EraseFilesResult {
		const name = FileHandler.getStorageName(mask),
			entries = FileHandler.getStorageDirectoryEntries(this.options.storage, name),
			removed: string[] = [],
			missing: string[] = [];
		for (const entry of entries) {
			if (this.options.storage.getItem(entry) !== null) {
				this.options.storage.removeItem(entry);
				this.options.updateStorageDatabase("remove", entry);
				removed.push(entry);
			} else {
				missing.push(entry);
			}
		}
		return { name, matched: entries.length > 0, removed, missing };
	}

	renameFile(oldName: string, newName: string): RenameFileResult {
		oldName = FileHandler.getStorageName(oldName);
		newName = FileHandler.getStorageName(newName);
		const item = this.options.storage.getItem(oldName);
		if (item === null) {
			return { status: "oldNotFound", oldName, newName };
		}
		if (this.options.storage.getItem(newName)) {
			return { status: "newExists", oldName, newName };
		}
		this.options.storage.setItem(newName, item);
		this.options.updateStorageDatabase("set", newName);
		this.options.storage.removeItem(oldName);
		this.options.updateStorageDatabase("remove", oldName);
		return { status: "renamed", oldName, newName };
	}

	static joinMeta(meta: FileMeta): string {
		return [
			FileHandler.metaIdent,
			meta.typeString,
			meta.start,
			meta.length,
			meta.entry,
			meta.encoding
		].join(";");
	}

	private static reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
	// starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF


	private processDskFile(data: string, name: string, imported: string[]) {
		try {
			const dsk = this.getDiskImage();

			dsk.setOptions({
				data: data,
				diskName: name
			});

			const dir = dsk.readDirectory(),
				diskFiles = Object.keys(dir);

			for (let i = 0; i < diskFiles.length; i += 1) {
				const fileName = diskFiles[i];

				try { // eslint-disable-line max-depth
					data = dsk.readFile(dir[fileName]);
					this.fnLoad2(data, fileName, "", imported); // recursive
				} catch (e) {
					Utils.console.error(e);
					if (e instanceof Error) { // eslint-disable-line max-depth
						this.options.outputError(e, true);
					}
				}
			}
		} catch (e) {
			Utils.console.error(e);
			if (e instanceof Error) {
				this.options.outputError(e, true);
			}
		}
	}

	private processZipFile(uint8Array: Uint8Array, name: string, imported: string[]) {
		let zip: ZipFile | undefined;

		try {
			zip = new ZipFile({
				data: uint8Array, // rather data
				zipName: name
			});
		} catch (e) {
			Utils.console.error(e);
			if (e instanceof Error) {
				this.options.outputError(e, true);
			}
		}
		if (zip) {
			const zipDirectory = zip.getZipDirectory(),
				entries = Object.keys(zipDirectory);

			for (let i = 0; i < entries.length; i += 1) {
				const name2 = entries[i];

				if (name2.startsWith("__MACOSX/")) { // MacOS X creates some extra folder in ZIP files
					Utils.console.log("processZipFile: Ignoring file:", name2);
				} else {
					let data2: string | undefined;

					try {
						data2 = zip.readData(name2);
					} catch (e) {
						Utils.console.error(e);
						if (e instanceof Error) { // eslint-disable-line max-depth
							this.options.outputError(e, true);
						}
					}

					if (data2) {
						this.fnLoad2(data2, name2, "", imported); // type not known but without meta
					}
				}
			}
		}
	}

	fnLoad2(data: string | Uint8Array, name: string, type: string, imported: string[]): void { // eslint-disable-line complexity
		let header: AmsdosHeader | undefined;

		if (type === "" && !(data instanceof Uint8Array)) { // detetermine type
			header = DiskImage.parseAmsdosHeader(data);
			if (header) {
				type = "H"; // with header
				data = data.substring(0x80); // remove header
			} else if (FileHandler.reRegExpIsText.test(data)) {
				type = "A";
			} else if (Snapshot.testSnapIdent(data.substring(0, 8))) { // snapshot file?
				type = "S";
			} else if (DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
				type = "X";
			}
		}

		switch (type) {
		case "A": // "text/plain"
		case "B": // binary?
			header = DiskImage.createAmsdosHeader({
				typeString: type,
				length: data.length
			});
			break;

		case "H": // with header?
			break;

		case "S": // sna file?
			header = DiskImage.createAmsdosHeader({
				typeString: type,
				length: data.length
			}); // currently we store it
			break;

		case "X": // dsk file?
			if (this.processFileImports) {
				this.processDskFile(data as string, name, imported); // we know data is string
			} else {
				header = DiskImage.createAmsdosHeader({
					typeString: type,
					length: data.length
				});
			}
			break;

		case "Z": // zip file?
			if (this.processFileImports) {
				this.processZipFile(data instanceof Uint8Array ? data : Utils.string2Uint8Array(data), name, imported);
			} else {
				header = DiskImage.createAmsdosHeader({
					typeString: type,
					length: data.length
				});
			}
			break;

		default:
			Utils.console.warn("fnLoad2: " + name + ": Unknown file type: " + type + ", assuming B");
			header = DiskImage.createAmsdosHeader({
				typeString: "B",
				length: data.length
			});
			break;
		}

		if (header) { // do we have a header? (means we should store it as a file in storage...)
			const storageName = FileHandler.getStorageName(this.options.adaptFilename(name, "FILE")),
				meta = FileHandler.joinMeta(header),
				dataAsString = data instanceof Uint8Array ? Utils.uint8Array2string(data) : data;

			try {
				this.options.storage.setItem(storageName, meta + "," + dataAsString);
				this.options.updateStorageDatabase("set", storageName);
				Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
				imported.push(name);
			} catch (e) { // maybe quota exceeded
				Utils.console.error(e);
				if (e instanceof Error) {
					if (e.name === "QuotaExceededError") {
						(e as CustomError).shortMessage = storageName + ": Quota exceeded";
					}
					this.options.outputError(e, true);
				}
			}
		}
	}
}
