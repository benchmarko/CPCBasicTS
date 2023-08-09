// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils, CustomError } from "./Utils";
import { FileMeta } from "./CpcVm";
import { DiskImage, AmsdosHeader } from "./DiskImage";
import { ZipFile } from "./ZipFile";


export interface FileHandlerOptions {
	adaptFilename: (name: string, err: string) => string;
	updateStorageDatabase: (action: string, key: string) => void;
	outputError: (error: Error, noSelection?: boolean) => void;
}

export class FileHandler {
	private static readonly metaIdent = "CPCBasic";

	private adaptFilename = {} as (name: string, err: string) => string;
	private updateStorageDatabase = {} as (action: string, key: string) => void;
	private outputError = {} as (error: Error, noSelection?: boolean) => void;

	constructor(options: FileHandlerOptions) {
		this.adaptFilename = options.adaptFilename;
		this.updateStorageDatabase = options.updateStorageDatabase;
		this.outputError = options.outputError;
	}

	private static fnLocalStorageName(name: string, defaultExtension?: string) {
		// modify name so we do not clash with localstorage methods/properites
		if (name.indexOf(".") < 0) { // no dot inside name?
			name += "." + (defaultExtension || ""); // append dot or default extension
		}
		return name;
	}

	static createMinimalAmsdosHeader(type: string,	start: number,	length: number): AmsdosHeader {
		return {
			typeString: type,
			start: start,
			length: length
		} as AmsdosHeader;
	}

	private static joinMeta(meta: FileMeta) {
		return [
			FileHandler.metaIdent,
			meta.typeString,
			meta.start,
			meta.length,
			meta.entry
		].join(";");
	}

	private static reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
	// starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF


	private processZipFile(uint8Array: Uint8Array, name: string, imported: string[]) {
		let zip: ZipFile | undefined;

		try {
			zip = new ZipFile(uint8Array, name); // rather data
		} catch (e) {
			Utils.console.error(e);
			if (e instanceof Error) {
				this.outputError(e, true);
			}
		}
		if (zip) {
			const zipDirectory = zip.getZipDirectory(),
				entries = Object.keys(zipDirectory);

			for (let i = 0; i < entries.length; i += 1) {
				const name2 = entries[i];
				let data2: string | undefined;

				try {
					data2 = zip.readData(name2);
				} catch (e) {
					Utils.console.error(e);
					if (e instanceof Error) { // eslint-disable-line max-depth
						this.outputError(e, true);
					}
				}

				if (data2) {
					this.fnLoad2(data2, name2, "", imported); // type not known but without meta
				}
			}
		}
	}

	private processDskFile(data: string, name: string, imported: string[]) {
		try {
			const dsk = new DiskImage({
					data: data,
					diskName: name
				}),
				dir = dsk.readDirectory(),
				diskFiles = Object.keys(dir);

			for (let i = 0; i < diskFiles.length; i += 1) {
				const fileName = diskFiles[i];

				try { // eslint-disable-line max-depth
					data = dsk.readFile(dir[fileName]);
					this.fnLoad2(data, fileName, "", imported); // recursive
				} catch (e) {
					Utils.console.error(e);
					if (e instanceof Error) { // eslint-disable-line max-depth
						this.outputError(e, true);
					}
				}
			}
		} catch (e) {
			Utils.console.error(e);
			if (e instanceof Error) {
				this.outputError(e, true);
			}
		}
	}

	fnLoad2(data: string | Uint8Array, name: string, type: string, imported: string[]): void { // eslint-disable-line complexity
		if (data instanceof Uint8Array) { // FileSelect filereader zip file?
			this.processZipFile(data, name, imported);
			return;
		}

		let header: AmsdosHeader | undefined,
			storageName = this.adaptFilename(name, "FILE");

		storageName = FileHandler.fnLocalStorageName(storageName);

		if (type === "") { // detetermine type
			header = DiskImage.parseAmsdosHeader(data);
			if (header) {
				type = "H"; // with header
				data = data.substring(0x80); // remove header
			} else if (FileHandler.reRegExpIsText.test(data)) {
				type = "A";
			} else if (DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
				type = "X";
			}
		}

		switch (type) {
		case "A": // "text/plain"
		case "B": // binary?
			header = FileHandler.createMinimalAmsdosHeader(type, 0, data.length);
			break;

		case "Z": // zip file?
			this.processZipFile(Utils.string2Uint8Array(data), name, imported);
			break;

		case "X": // dsk file?
			this.processDskFile(data, name, imported);
			break;

		case "H": // with header?
			break;

		default:
			Utils.console.warn("fnLoad2: " + name + ": Unknown file type: " + type + ", assuming B");
			header = FileHandler.createMinimalAmsdosHeader("B", 0, data.length);
			break;
		}

		if (header) {
			const meta = FileHandler.joinMeta(header);

			try {
				Utils.localStorage.setItem(storageName, meta + "," + data);
				this.updateStorageDatabase("set", storageName);
				Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
				imported.push(name);
			} catch (e) { // maybe quota exceeded
				Utils.console.error(e);
				if (e instanceof Error) {
					if (e.name === "QuotaExceededError") {
						(e as CustomError).shortMessage = storageName + ": Quota exceeded";
					}
					this.outputError(e, true);
				}
			}
		}
	}
}
