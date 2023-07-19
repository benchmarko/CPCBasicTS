// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils, CustomError } from "./Utils";
import { FileMeta } from "./CpcVm";
import { DiskImage, AmsdosHeader } from "./DiskImage";


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

	fnLoad2(data: string, name: string, type: string, imported: string[]): void {
		let header: AmsdosHeader | undefined,
			storageName = this.adaptFilename(name, "FILE");

		storageName = FileHandler.fnLocalStorageName(storageName);

		if (type === "text/plain") {
			header = FileHandler.createMinimalAmsdosHeader("A", 0, data.length);
		} else {
			if (type === "application/x-zip-compressed" || type === "cpcBasic/binary") { // are we a file inside zip?
				// empty
			} else { // e.g. "data:application/octet-stream;base64,..."
				const index = data.indexOf(",");

				if (index >= 0) {
					const info1 = data.substring(0, index);

					data = data.substring(index + 1); // remove meta prefix
					if (info1.indexOf("base64") >= 0) {
						data = Utils.atob(data); // decode base64
					}
				}
			}

			header = DiskImage.parseAmsdosHeader(data);
			if (header) {
				data = data.substring(0x80); // remove header
			} else if (FileHandler.reRegExpIsText.test(data)) {
				header = FileHandler.createMinimalAmsdosHeader("A", 0, data.length);
			} else if (DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
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
							this.fnLoad2(data, fileName, "cpcBasic/binary", imported); // recursive
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
				header = undefined; // ignore dsk file
			} else { // binary
				header = FileHandler.createMinimalAmsdosHeader("B", 0, data.length);
			}
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
