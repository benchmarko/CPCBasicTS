// NoCanvas.ts - No Canvas
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//

import { Engine } from "../Engine";
import type { CanvasOptions, ICanvas } from "./UiInterfaces";

export class NoCanvas extends Engine.NullCanvas implements ICanvas {
	private readonly options: CanvasOptions;

	constructor(options: CanvasOptions) {
		super();
		this.options = {} as CanvasOptions;
		this.setOptions(options);

		this.reset();
	}

	getOptions(): CanvasOptions {
		return this.options;
	}

	setOptions(options: Partial<CanvasOptions>): void {
		Object.assign(this.options, options);
	}

	onCanvasClick(_event: MouseEvent): void { // eslint-disable-line class-methods-use-this
	}

	takeScreenShot(): string { // eslint-disable-line class-methods-use-this
		return "";
	}

	startUpdateCanvas(): void { // eslint-disable-line class-methods-use-this
	}

	stopUpdateCanvas(): void { // eslint-disable-line class-methods-use-this
	}

	onWindowClick(_event: Event): void { // eslint-disable-line class-methods-use-this
	}
}
