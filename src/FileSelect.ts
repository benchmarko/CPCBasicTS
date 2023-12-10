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
	private readonly options: FileSelectOptions;

	private readonly fnOnErrorHandler: () => void;
	private readonly fnOnLoadHandler: () => void;
	private readonly fnOnFileSelectHandler: () => void;

	private files?: FileList;
	private fileIndex = 0;
	private imported: string[] = []; // imported file names
	private file?: File; // current file

	constructor(options: FileSelectOptions) {
		this.fnOnLoadHandler = this.fnOnLoad.bind(this);
		this.fnOnErrorHandler = this.fnOnError.bind(this);
		this.fnOnFileSelectHandler = this.fnOnFileSelect.bind(this);

		this.options = {} as FileSelectOptions;
		this.setOptions(options);
	}

	getOptions(): FileSelectOptions {
		return this.options;
	}

	setOptions(options: Partial<FileSelectOptions>): void {
		Object.assign(this.options, options);
	}

	private fnReadNextFile(reader: FileReader) {
		if (this.files && this.fileIndex < this.files.length) {
			const file = this.files[this.fileIndex];

			this.fileIndex += 1;
			const lastModified = file.lastModified,
				lastModifiedDate = lastModified ? new Date(lastModified) : (file as any).lastModifiedDate as Date, // lastModifiedDate deprecated, but for old IE
				text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");

			Utils.console.log(text);
			if (file.type === "text/plain") {
				reader.readAsText(file);
			} else if (file.type === "application/x-zip-compressed" || file.type === "application/zip") { // on Mac OS it is "application/zip"
				reader.readAsArrayBuffer(file);
			} else {
				reader.readAsDataURL(file);
			}
			this.file = file;
		} else {
			this.options.fnEndOfImport(this.imported);
		}
	}

	private fnOnLoad(event: ProgressEvent<FileReader>) {
		if (!this.file) {
			Utils.console.error("fnOnLoad: Programming error: No file");
			return;
		}
		const file = this.file,
			name = file.name,
			reader = event.target;
		let data = (reader && reader.result) || null,
			type = file.type;

		if ((type === "application/x-zip-compressed" || type === "application/zip") && data instanceof ArrayBuffer) { // on Mac OS it is "application/zip"
			type = "Z";
			this.options.fnLoad2(new Uint8Array(data), name, type, this.imported);
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
			this.options.fnLoad2(data, name, type, this.imported);
		} else {
			Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
		}

		if (reader) {
			this.fnReadNextFile(reader);
		}
	}

	private fnOnError(event: ProgressEvent<FileReader>) {
		const reader = event.target,
			filename = (this.file && this.file.name) || "unknown";
		let msg = "fnOnError: " + filename;

		if (reader && reader.error) {
			msg += ": " + String(reader.error);
		}

		Utils.console.error(msg);

		if (reader) {
			this.fnReadNextFile(reader);
		}
	}

	// https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
	// https://www.w3.org/TR/file-upload/#dfn-filereader
	private fnOnFileSelect(event: Event) {
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
			const reader = new window.FileReader();

			reader.onerror = this.fnOnErrorHandler;
			reader.onload = this.fnOnLoadHandler;
			this.fnReadNextFile(reader);
		} else {
			Utils.console.warn("fnHandleFileSelect: FileReader API not supported.");
		}
	}

	//TODO: can we use View.attachEventHandler() somehow?
	addFileSelectHandler(element: HTMLElement, type: string): void {
		element.addEventListener(type, this.fnOnFileSelectHandler, false);
	}
}
