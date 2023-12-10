// DragElement.ts - DragElement
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/
//

import { ViewID } from "./Constants";
import { Utils } from "./Utils";
import { View } from "./View";

// see also:
// https://www.kirupa.com/html5/drag.htm
// https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_draggable

type DragElementOptionEntryType = {
	itemId: ViewID,
	xOffset: number,
	yOffset: number,
	enabled: boolean
};

export type DragElementOptions = {
	view: View,
	entries: Record<string, DragElementOptionEntryType>
};

export class DragElement {
	private readonly fnDragStartHandler: (event: Event) => boolean;
	private readonly fnDragMoveHandler: (event: Event) => boolean;
	private readonly fnDragEndHandler: (event: Event) => boolean;

	private readonly options: DragElementOptions;

	private containerId = ViewID.window;

	private initialX = 0;
	private initialY = 0;
	private currentX = 0;
	private currentY = 0;

	private dragInfo?: DragElementOptionEntryType;
	private dragItem?: HTMLElement;

	constructor(options: DragElementOptions) {
		this.fnDragStartHandler = this.dragStart.bind(this);
		this.fnDragMoveHandler = this.dragMove.bind(this);
		this.fnDragEndHandler = this.dragEnd.bind(this);

		this.options = {} as DragElementOptions;
		this.setOptions(options);
	}

	getOptions(): DragElementOptions {
		return this.options;
	}

	setOptions(options: Partial<DragElementOptions>): void {
		Object.assign(this.options, options);

		const entries = this.options.entries;

		for (const key in entries) {
			if (entries.hasOwnProperty(key)) {
				const item = entries[key];

				if (item.enabled) {
					this.options.view.fnAttachPointerEvents(item.itemId, this.fnDragStartHandler);
				} else {
					this.options.view.fnDetachPointerEvents(item.itemId, this.fnDragStartHandler);
				}
			}
		}
	}

	private dragStart(event: PointerEvent | TouchEvent) {
		const node = View.getEventTarget<HTMLElement>(event),
			entries = this.options.entries;
		let	entry = entries[node.id];

		if (!entry) {
			const parentElement = node.parentElement;

			if (parentElement && entries[parentElement.id]) {
				entry = entries[parentElement.id];
				this.dragItem = parentElement;
			} else {
				return;
			}
		} else {
			this.dragItem = node;
		}
		this.dragInfo = entry;
		const dragInfo = this.dragInfo,
			clientObject = (event.type === "touchstart") ? (event as TouchEvent).touches[0] : event as PointerEvent; // special handling for TouchEvent (otherwise MouseEvent or similar PointerEvent)

		this.initialX = clientObject.clientX - dragInfo.xOffset;
		this.initialY = clientObject.clientY - dragInfo.yOffset;

		this.options.view.fnAttachPointerEvents(this.containerId, undefined, this.fnDragMoveHandler, this.fnDragEndHandler);
		if (Utils.debug > 0) {
			Utils.console.debug("dragStart: " + dragInfo.itemId + ": x=" + this.initialX + ", y=" + this.initialY);
		}
	}

	private static setDragTranslate(xPos: number, yPos: number, el: HTMLElement) {
		el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
	}

	private dragMove(event: PointerEvent | TouchEvent) {
		const dragInfo = this.dragInfo;

		if (dragInfo) {
			event.preventDefault();
			const clientObject = (event.type === "touchstart") ? (event as TouchEvent).touches[0] : event as PointerEvent;

			this.currentX = clientObject.clientX - this.initialX;
			this.currentY = clientObject.clientY - this.initialY;
			dragInfo.xOffset = this.currentX;
			dragInfo.yOffset = this.currentY;

			DragElement.setDragTranslate(this.currentX, this.currentY, this.dragItem as HTMLElement);
		}
	}

	private dragEnd(_event: PointerEvent | TouchEvent) {
		const dragInfo = this.dragInfo;

		if (dragInfo) {
			this.options.view.fnDetachPointerEvents(this.containerId, undefined, this.fnDragMoveHandler, this.fnDragEndHandler);
			if (Utils.debug > 0) {
				Utils.console.debug("dragEnd: " + dragInfo.itemId + ": x=" + this.currentX + ", y=" + this.currentY);
			}
		}
	}
}
