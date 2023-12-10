// DragElement.ts - DragElement
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragElement = void 0;
    var DragElement = /** @class */ (function () {
        function DragElement(options) {
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
        DragElement.prototype.getOptions = function () {
            return this.options;
        };
        DragElement.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
            var entries = this.options.entries;
            for (var key in entries) {
                if (entries.hasOwnProperty(key)) {
                    var item = entries[key];
                    if (item.enabled) {
                        this.options.view.fnAttachPointerEvents(item.itemId, this.fnDragStartHandler);
                    }
                    else {
                        this.options.view.fnDetachPointerEvents(item.itemId, this.fnDragStartHandler);
                    }
                }
            }
        };
        DragElement.prototype.dragStart = function (event) {
            var node = View_1.View.getEventTarget(event), entries = this.options.entries;
            var entry = entries[node.id];
            if (!entry) {
                var parentElement = node.parentElement;
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
            var dragInfo = this.dragInfo, clientObject = (event.type === "touchstart") ? event.touches[0] : event; // special handling for TouchEvent (otherwise MouseEvent or similar PointerEvent)
            this.initialX = clientObject.clientX - dragInfo.xOffset;
            this.initialY = clientObject.clientY - dragInfo.yOffset;
            this.options.view.fnAttachPointerEvents(this.containerId, undefined, this.fnDragMoveHandler, this.fnDragEndHandler);
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("dragStart: " + dragInfo.itemId + ": x=" + this.initialX + ", y=" + this.initialY);
            }
        };
        DragElement.setDragTranslate = function (xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        };
        DragElement.prototype.dragMove = function (event) {
            var dragInfo = this.dragInfo;
            if (dragInfo) {
                event.preventDefault();
                var clientObject = (event.type === "touchstart") ? event.touches[0] : event;
                this.currentX = clientObject.clientX - this.initialX;
                this.currentY = clientObject.clientY - this.initialY;
                dragInfo.xOffset = this.currentX;
                dragInfo.yOffset = this.currentY;
                DragElement.setDragTranslate(this.currentX, this.currentY, this.dragItem);
            }
        };
        DragElement.prototype.dragEnd = function (_event) {
            var dragInfo = this.dragInfo;
            if (dragInfo) {
                this.options.view.fnDetachPointerEvents(this.containerId, undefined, this.fnDragMoveHandler, this.fnDragEndHandler);
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("dragEnd: " + dragInfo.itemId + ": x=" + this.currentX + ", y=" + this.currentY);
                }
            }
        };
        return DragElement;
    }());
    exports.DragElement = DragElement;
});
//# sourceMappingURL=DragElement.js.map