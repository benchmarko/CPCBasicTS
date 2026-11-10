import { Core } from "./Core";
import { FileHandler, type FileHandlerOptions } from "./FileHandler";
import type { ConfigType, IEngine } from "./Interfaces";
import { NullCanvas } from "./NullCanvas";
import { Runtime, type RuntimeOptions } from "./Runtime";
import { Utils } from "./Utils";

export class Engine implements IEngine {
	static readonly NullCanvas = NullCanvas;

	readonly core: Core;
	readonly files: IEngine["files"] = {
		createExampleLoadRequest: FileHandler.createExampleLoadRequest,
		prepareExampleLoad: FileHandler.prepareExampleLoad,
		loadFromStorage: FileHandler.loadFromStorage,
		splitMeta: FileHandler.splitMeta,
		decodeStoredFile: FileHandler.decodeStoredFile,
		getStorageDirectoryEntries: FileHandler.getStorageDirectoryEntries,
		getDirectoryEntries: FileHandler.getDirectoryEntries,
		joinMeta: FileHandler.joinMeta
	};

	constructor(defaultConfig: ConfigType) {
		this.core = new Core(defaultConfig);
	}

	createRuntime(options: RuntimeOptions): Runtime {
		return new Runtime(options);
	}

	createFileHandler(options: FileHandlerOptions): FileHandler {
		return new FileHandler(options);
	}

	createDiagnostic(error: Error, noSelection = false, errCode?: number) {
		return Utils.createDiagnostic(error, noSelection, errCode);
	}

	escapeControlCharacters(input: string): string {
		return Utils.escapeControlCharacters(input);
	}

	getLoopDelay(speed: number): number {
		return Runtime.getLoopDelay(speed);
	}
}