// FileSelect.ts - FileSelect
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { View } from "./View";


export interface FileSelectOptions {
	fnEndOfImport: (imported: string[]) => void;
	fnLoad2: (data: string | Uint8Array, name: string, type: string, imported: string[]) => void;
}

export class FileSelect {
	private fnEndOfImport = {} as (imported: string[]) => void;
	private fnLoad2 = {} as (data: string | Uint8Array, name: string, type: string, imported: string[]) => void;

	private files = {} as FileList; // = dataTransfer ? dataTransfer.files : ((event.target as any).files as FileList), // dataTransfer for drag&drop, target.files for file input
	private fileIndex = 0;
	private imported: string[] = []; // imported file names
	private file = {} as File; // current file

	constructor(options: FileSelectOptions) {
		this.fnEndOfImport = options.fnEndOfImport;
		this.fnLoad2 = options.fnLoad2;
	}

	private fnReadNextFile(reader: FileReader) {
		if (this.fileIndex < this.files.length) {
			const file = this.files[this.fileIndex];

			this.fileIndex += 1;
			const lastModified = file.lastModified,
				lastModifiedDate = lastModified ? new Date(lastModified) : (file as any).lastModifiedDate as Date, // lastModifiedDate deprecated, but for old IE
				text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");

			Utils.console.log(text);
			if (file.type === "text/plain") {
				reader.readAsText(file);
			} else if (file.type === "application/x-zip-compressed") {
				reader.readAsArrayBuffer(file);
			} else {
				reader.readAsDataURL(file);
			}
			this.file = file;
		} else {
			this.fnEndOfImport(this.imported);
		}
	}

	private fnOnLoad(event: ProgressEvent<FileReader>) {
		const reader = event.target,
			file = this.file,
			name = file.name;
		let data = (reader && reader.result) || null,
			type = file.type;

		if (type === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
			type = "Z";
			this.fnLoad2(new Uint8Array(data), name, type, this.imported);
		} else if (typeof data === "string") {
			if (type === "text/plain") { // "text/plain"
				type = "A";
			} else if (data.indexOf("data:") === 0) {
				// check for meta info in data: data:application/octet-stream;base64, or: data:text/javascript;base64,
				const index = data.indexOf(",");

				if (index >= 0) {
					const info1 = data.substring(0, index);

					// remove meta prefix
					data = data.substring(index + 1);
					if (info1.indexOf("base64") >= 0) {
						data = Utils.atob(data); // decode base64
					}
					if (info1.indexOf("text/") >= 0) {
						type = "A";
					}
				}
			}
			this.fnLoad2(data, name, type, this.imported);
		} else {
			Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
		}

		if (reader) {
			this.fnReadNextFile(reader);
		}
	}

	private fnErrorHandler(event: ProgressEvent<FileReader>, file: File) {
		const reader = event.target;
		let msg = "fnErrorHandler: Error reading file " + file.name;

		if (reader && reader.error !== null) {
			if (reader.error.NOT_FOUND_ERR) {
				msg += ": File not found";
			} else if (reader.error.ABORT_ERR) {
				msg = ""; // nothing
			}
		}
		if (msg) {
			Utils.console.warn(msg);
		}

		if (reader) {
			this.fnReadNextFile(reader);
		}
	}

	// https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
	// https://www.w3.org/TR/file-upload/#dfn-filereader
	private fnHandleFileSelect(event: Event) {
		event.stopPropagation();
		event.preventDefault();

		const dataTransfer = (event as DragEvent).dataTransfer,
			files = dataTransfer ? dataTransfer.files : View.getEventTarget<HTMLInputElement>(event).files; // dataTransfer for drag&drop, target.files for file input

		if (!files || !files.length) {
			Utils.console.error("fnHandleFileSelect: No files!");
			return;
		}
		this.files = files;
		this.fileIndex = 0;
		this.imported.length = 0;

		if (window.FileReader) {
			const reader = new FileReader();

			reader.onerror = this.fnErrorHandler.bind(this);
			reader.onload = this.fnOnLoad.bind(this);
			this.fnReadNextFile(reader);
		} else {
			Utils.console.warn("fnHandleFileSelect: FileReader API not supported.");
		}
	}

	//TODO: can we use View.attachEventHandler() somehow?
	addFileSelectHandler(element: HTMLElement, type: string): void {
		element.addEventListener(type, this.fnHandleFileSelect.bind(this), false);
	}
}
