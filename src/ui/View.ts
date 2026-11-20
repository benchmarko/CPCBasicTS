// View.ts - View Module to access HTML DOM
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { ViewID } from "./UiConstants";
import { UiUtils } from "./UiUtils";

export interface SelectOptionElement { // similar to HtmlOptionElement
	value: string,
	text: string,
	title: string
	selected: boolean
}

export interface AreaInputElement {
	value: string,
	title: string,
	checked: boolean,
	imgUrl: string
}

export type PointerEventNamesType = Record<"down"|"move"|"up"|"cancel"|"out"|"type", string>;

export class View {
	private static myDocument?: Document;

	static setDocument(doc: Document) {
		View.myDocument = doc;
	}

	private static getDocument(): Document {
		const doc = View.myDocument ?? (typeof document !== "undefined" ? document : undefined);

		if (!doc) {
			throw new Error("View requires a document");
		}
		return doc;
	}

	static getElementById1(id: ViewID): HTMLElement {
		const element = View.getDocument().getElementById(id);

		if (!element) {
			throw new Error("Unknown " + id);
		}
		return element;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	static getElementByIdAs<T extends HTMLButtonElement| HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement>(id: ViewID): T {
		return View.getElementById1(id) as T;
	}

	getHidden(id: ViewID): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(id);

		return element.className.indexOf("displayNone") >= 0;
	}
	setHidden(id: ViewID, hidden: boolean, display?: string): this { // eslint-disable-line class-methods-use-this
		// optional display: block or flex or inherit
		const element = View.getElementById1(id),
			displayVisible = "display" + UiUtils.stringCapitalize(display || "block");

		if (hidden) {
			if (element.className.indexOf("displayNone") < 0) {
				this.toggleClass(id, "displayNone");
			}
			if (element.className.indexOf(displayVisible) >= 0) {
				this.toggleClass(id, displayVisible);
			}
		} else {
			if (element.className.indexOf("displayNone") >= 0) {
				this.toggleClass(id, "displayNone");
			}
			if (element.className.indexOf(displayVisible) < 0) {
				this.toggleClass(id, displayVisible);
			}
		}

		return this;
	}

	setDisabled(id: ViewID, disabled: boolean): this {
		const element = View.getElementByIdAs<HTMLButtonElement | HTMLSelectElement>(id);

		element.disabled = disabled;
		return this;
	}

	toggleClass(id: ViewID, className: string): void { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(id);
		let classes = element.className;
		const nameIndex = classes.indexOf(className);

		if (nameIndex === -1) {
			classes = classes.trim() + " " + className;
		} else {
			classes = classes.substring(0, nameIndex) + classes.substring(nameIndex + className.length + 1).trim();
		}
		element.className = classes;
	}

	getAreaValue(id: ViewID): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLTextAreaElement>(id);

		return element.value;
	}
	setAreaValue(id: ViewID, value: string): this {
		const element = View.getElementByIdAs<HTMLTextAreaElement>(id);

		element.value = value;
		return this;
	}

	getInputValue(id: ViewID): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		return element.value;
	}
	setInputValue(id: ViewID, value: string): this {
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		element.value = value;
		return this;
	}

	getInputChecked(id: ViewID): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		return element.checked;
	}
	setInputChecked(id: ViewID, checked: boolean): this {
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		element.checked = checked;
		return this;
	}

	setAreaInputList(id: ViewID, inputs: AreaInputElement[]): this {
		const element = View.getElementByIdAs<HTMLElement>(id),
			childNodes = element.childNodes;

		while (childNodes.length && childNodes[0].nodeType !== Node.ELEMENT_NODE) { // remove all non-element nodes
			element.removeChild(element.firstChild as Element);
		}

		for (let i = 0; i < inputs.length; i += 1) {
			const item = inputs[i];
			let input: HTMLInputElement,
				label: HTMLLabelElement;

			if (i * 2 >= childNodes.length) {
				input = View.getDocument().createElement("input");
				input.type = "radio";
				input.id = "galleryItem" + i;
				input.name = "gallery";
				input.value = item.value;
				input.checked = item.checked;

				label = View.getDocument().createElement("label");
				label.setAttribute("for", "galleryItem" + i);
				label.setAttribute("style", 'background: url("' + item.imgUrl + '"); background-size: cover');
				label.setAttribute("title", item.title);

				element.appendChild(input);
				element.appendChild(label);
			} else {
				input = childNodes[i * 2] as HTMLInputElement;
				if (input.value !== item.value) {
					if (UiUtils.debug > 3) {
						UiUtils.console.debug("setInputList: " + id + ": value changed for index " + i + ": " + item.value);
					}
					input.value = item.value;
					label = childNodes[i * 2 + 1] as HTMLLabelElement;
					label.setAttribute("style", 'background: url("' + item.imgUrl + '");');
					label.setAttribute("title", item.title);
				}
				if (input.checked !== item.checked) {
					input.checked = item.checked;
				}
			}
		}
		// remove additional items
		while (element.childElementCount > inputs.length * 2) {
			element.removeChild(element.lastChild as Element);
		}
		return this;
	}

	setSelectOptions(id: ViewID, options: SelectOptionElement[]): this {
		const element = View.getElementByIdAs<HTMLSelectElement>(id),
			optionList: HTMLOptionElement[] = [],
			existingElements = element.length;

		// pre-create additional options
		for (let i = existingElements; i < options.length; i += 1) {
			const item = options[i],
				option = View.getDocument().createElement("option");

			option.value = item.value;
			option.text = item.text;
			option.title = item.title;
			option.selected = item.selected; // multi-select
			optionList.push(option);
		}

		for (let i = 0; i < options.length; i += 1) {
			if (i >= existingElements) {
				element.add(optionList[i - existingElements], null); // null needed for old FF 3.x
			} else {
				const item = options[i],
					option = element.options[i];

				if (option.value !== item.value) {
					option.value = item.value;
				}
				if (option.text !== item.text) {
					if (UiUtils.debug > 3) {
						UiUtils.console.debug("setSelectOptions: " + id + ": text changed for index " + i + ": " + item.text);
					}
					option.text = item.text;
					option.title = item.title;
				}
				option.selected = item.selected; // multi-select
			}
		}
		// remove additional select options
		element.options.length = options.length;
		return this;
	}

	getSelectOptions(id: ViewID): SelectOptionElement[] { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLSelectElement>(id),
			elementOptions = element.options,
			options: SelectOptionElement[] = [];

		for (let i = 0; i < elementOptions.length; i += 1) {
			const elementOption = elementOptions[i];

			options.push({
				value: elementOption.value,
				text: elementOption.text,
				title: elementOption.title,
				selected: elementOption.selected
			});
		}
		return options;
	}

	getSelectValue(id: ViewID): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLSelectElement>(id);

		return element.value;
	}
	setSelectValue(id: ViewID, value: string): this {
		const element = View.getElementByIdAs<HTMLSelectElement>(id);

		if (value) {
			element.value = value;
		}
		return this;
	}
	setSelectTitleFromSelectedOption(id: ViewID): this {
		const element = View.getElementByIdAs<HTMLSelectElement>(id),
			selectedIndex = element.selectedIndex,
			title = (selectedIndex >= 0) ? element.options[selectedIndex].title : "";

		element.title = title;
		return this;
	}

	setAreaScrollTop(id: ViewID, scrollTop?: number): this { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLTextAreaElement>(id);

		if (scrollTop === undefined) {
			scrollTop = element.scrollHeight;
		}
		element.scrollTop = scrollTop;
		return this;
	}

	private setSelectionRange(textarea: HTMLTextAreaElement, selectionStart: number, selectionEnd: number) { // eslint-disable-line class-methods-use-this
		// First scroll selection region to view
		const fullText = textarea.value;

		textarea.value = fullText.substring(0, selectionEnd);
		// For some unknown reason, you must store the scollHeight to a variable before setting the textarea value. Otherwise it won't work for long strings
		const scrollHeight = textarea.scrollHeight;

		textarea.value = fullText;
		const textareaHeight = textarea.clientHeight;
		let scrollTop = scrollHeight;

		if (scrollTop > textareaHeight) {
			// scroll selection to center of textarea
			scrollTop -= textareaHeight / 2;
		} else {
			scrollTop = 0;
		}
		textarea.scrollTop = scrollTop;

		// Continue to set selection range
		textarea.setSelectionRange(selectionStart, selectionEnd);
		return this;
	}

	setAreaSelection(id: ViewID, pos: number, endPos: number): this {
		const element = View.getElementByIdAs<HTMLTextAreaElement>(id);

		if (element.selectionStart !== undefined) {
			if (element.setSelectionRange !== undefined) {
				element.focus(); // not needed for scrolling but we want to see the selected text
				this.setSelectionRange(element, pos, endPos);
			} else {
				element.focus();
				element.selectionStart = pos;
				element.selectionEnd = endPos;
			}
		}
		return this;
	}

	addEventListener(type: string, eventListener: EventListenerOrEventListenerObject, element?: HTMLElement): this {
		if (element) {
			element.addEventListener(type, eventListener, false);
		} else {
			View.getDocument().addEventListener(type, eventListener, false);
		}
		return this;
	}

	addEventListenerById(type: string, eventListener: EventListenerOrEventListenerObject, id: ViewID): this {
		if (UiUtils.debug) {
			UiUtils.console.debug("addEventListenerById: type=" + type + ", id=" + id);
		}
		const element = id === ViewID.window ? undefined : View.getElementById1(id);

		this.addEventListener(type, eventListener, element);
		return this;
	}

	removeEventListener(type: string, eventListener: EventListenerOrEventListenerObject, element?: HTMLElement): this {
		if (element) {
			element.removeEventListener(type, eventListener, false);
		} else {
			View.getDocument().removeEventListener(type, eventListener, false);
		}
		return this;
	}

	removeEventListenerById(type: string, eventListener: EventListenerOrEventListenerObject, id: ViewID): this {
		if (UiUtils.debug) {
			UiUtils.console.debug("removeEventListener: type=" + type + ", id=" + id);
		}
		const element = id === ViewID.window ? undefined : View.getElementById1(id);

		this.removeEventListener(type, eventListener, element);
		return this;
	}

	private static readonly pointerEventNames: PointerEventNamesType = {
		down: "pointerdown",
		move: "pointermove",
		up: "pointerup",
		cancel: "pointercancel",
		out: "pointerout",
		type: "pointer"
	};

	fnAttachPointerEvents(id: ViewID, fnDown?: EventListener, fnMove?: EventListener, fnUp?: EventListener): PointerEventNamesType {
		const element = id === ViewID.window ? undefined : View.getElementById1(id),
			eventNames = View.pointerEventNames;

		if (fnDown) {
			this.addEventListener(eventNames.down, fnDown, element);
		}
		if (fnMove) {
			this.addEventListener(eventNames.move, fnMove, element);
		}
		if (fnUp) {
			this.addEventListener(eventNames.up, fnUp, element);
			if (eventNames.cancel) {
				this.addEventListener(eventNames.cancel, fnUp, element); // also fnUp handler
			}
		}
		return eventNames;
	}

	fnDetachPointerEvents(id: ViewID, fnDown?: EventListener, fnMove?: EventListener, fnUp?: EventListener): PointerEventNamesType {
		const element = id === ViewID.window ? undefined : View.getElementById1(id),
			eventNames = View.pointerEventNames;

		if (fnDown) {
			this.removeEventListener(eventNames.down, fnDown, element);
		}
		if (fnMove) {
			this.removeEventListener(eventNames.move, fnMove, element);
		}
		if (fnUp) {
			this.removeEventListener(eventNames.up, fnUp, element);
			if (eventNames.cancel) {
				this.removeEventListener(eventNames.cancel, fnUp, element); // also fnUp handler
			}
		}
		return eventNames;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	static getEventTarget<T extends HTMLElement>(event: Event): T {
		const target = event.target;

		if (!target) {
			throw new Error("getEventTarget: Event target is undefined");
		}
		return target as T;
	}

	requestFullscreenForId(id: ViewID): boolean {
		const element = View.getElementById1(id),
			fullscreenchangedHandler = (event: Event) => {
				const target = View.getEventTarget(event),
					fullscreenElement = View.getDocument().fullscreenElement;

				if (fullscreenElement) {
					if (UiUtils.debug > 0) {
						UiUtils.console.debug("Entered fullscreen mode: " + fullscreenElement.id);
					}
				} else {
					if (UiUtils.debug > 0) {
						UiUtils.console.debug("Leaving fullscreen mode.");
					}
					this.removeEventListener("fullscreenchange", fullscreenchangedHandler, target);

					// for Safari we need to do some change to make sure the window size is set (can we do better?)
					this.setHidden(id, true);
					window.setTimeout(() => {
						this.setHidden(id, false);
					}, 0);
				}
			};

		if (!element.requestFullscreen) {
			return false;
		}
		element.requestFullscreen().then(() => {
			if (UiUtils.debug > 0) {
				UiUtils.console.debug("requestFullscreenForId: " + id + ": success");
			}
			this.addEventListenerById("fullscreenchange", fullscreenchangedHandler, id);
		}).catch((err: unknown) => {
			UiUtils.console.error("requestFullscreenForId: " + id + ": Error attempting to enable fullscreen mode: ", err);
		});
		return true;
	}

	// https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
	fnDownloadBlob(data: string, filename: string): void {
		const data8 = UiUtils.string2Uint8Array(data),
			type = "octet/stream",
			blob = new Blob([data8.buffer as ArrayBuffer], {
				type: type
			});

		const url = URL.createObjectURL(blob),
			a = View.getDocument().createElement("a"),
			clickHandler = function () {
				setTimeout(function () {
					URL.revokeObjectURL(url);
					a.removeEventListener("click", clickHandler);
				}, 150);
			};

		a.href = url;
		a.download = filename || "download";

		this.addEventListener("click", clickHandler, a);

		a.click();
	}
}
