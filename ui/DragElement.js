// DragElement.ts - DragElement
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
import { UiUtils } from "./UiUtils";
import { View } from "./View";
export class DragElement {
    constructor(options) {
        this.containerId = "window" /* ViewID.window */;
        this.initialX = 0;
        this.initialY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.fnDragStartHandler = this.dragStart.bind(this);
        this.fnDragMoveHandler = this.dragMove.bind(this);
        this.fnDragEndHandler = this.dragEnd.bind(this);
        this.options = {};
        this.setOptions(options);
    }
    getOptions() {
        return this.options;
    }
    setOptions(options) {
        Object.assign(this.options, options);
        const entries = this.options.entries;
        for (const key in entries) {
            if (entries.hasOwnProperty(key)) {
                const item = entries[key];
                if (item.enabled) {
                    this.options.view.fnAttachPointerEvents(item.itemId, this.fnDragStartHandler);
                }
                else {
                    this.options.view.fnDetachPointerEvents(item.itemId, this.fnDragStartHandler);
                }
            }
        }
    }
    dragStart(event) {
        const node = View.getEventTarget(event), entries = this.options.entries;
        let entry = entries[node.id];
        if (!entry) {
            const parentElement = node.parentElement;
            if (parentElement && entries[parentElement.id]) {
                entry = entries[parentElement.id];
                this.dragItem = parentElement;
            }
            else {
                return;
            }
        }
        else {
            this.dragItem = node;
        }
        this.dragInfo = entry;
        const dragInfo = this.dragInfo, clientObject = (event.type === "touchstart") ? event.touches[0] : event; // special handling for TouchEvent (otherwise MouseEvent or similar PointerEvent)
        this.initialX = clientObject.clientX - dragInfo.xOffset;
        this.initialY = clientObject.clientY - dragInfo.yOffset;
        this.options.view.fnAttachPointerEvents(this.containerId, undefined, this.fnDragMoveHandler, this.fnDragEndHandler);
        if (UiUtils.debug > 0) {
            UiUtils.console.debug("dragStart: " + dragInfo.itemId + ": x=" + this.initialX + ", y=" + this.initialY);
        }
    }
    static setDragTranslate(xPos, yPos, el) {
        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }
    dragMove(event) {
        const dragInfo = this.dragInfo;
        if (dragInfo) {
            event.preventDefault();
            const clientObject = (event.type === "touchstart") ? event.touches[0] : event;
            this.currentX = clientObject.clientX - this.initialX;
            this.currentY = clientObject.clientY - this.initialY;
            dragInfo.xOffset = this.currentX;
            dragInfo.yOffset = this.currentY;
            DragElement.setDragTranslate(this.currentX, this.currentY, this.dragItem);
        }
    }
    dragEnd(_event) {
        const dragInfo = this.dragInfo;
        if (dragInfo) {
            this.options.view.fnDetachPointerEvents(this.containerId, undefined, this.fnDragMoveHandler, this.fnDragEndHandler);
            if (UiUtils.debug > 0) {
                UiUtils.console.debug("dragEnd: " + dragInfo.itemId + ": x=" + this.currentX + ", y=" + this.currentY);
            }
        }
    }
}
//# sourceMappingURL=DragElement.js.map