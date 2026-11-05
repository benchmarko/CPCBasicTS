// NoCanvas.ts - No Canvas
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
import { NullCanvas } from "../NullCanvas";
export class NoCanvas extends NullCanvas {
    constructor(options) {
        super();
        this.options = {};
        this.setOptions(options);
        this.reset();
    }
    getOptions() {
        return this.options;
    }
    setOptions(options) {
        Object.assign(this.options, options);
    }
    onCanvasClick(_event) {
    }
    takeScreenShot() {
        return "";
    }
    startUpdateCanvas() {
    }
    stopUpdateCanvas() {
    }
    onWindowClick(_event) {
    }
}
//# sourceMappingURL=NoCanvas.js.map