// View.ts - View Module to access HTML DOM
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";

export interface SelectOptionElement { // similar to HtmlOptionElement
	value: string,
	text: string,
	title: string
	selected: boolean
}

export class View {
	static getElementById1(id: string): HTMLElement {
		const element = window.document.getElementById(id);

		if (!element) {
			throw new Error("Unknown " + id);
		}
		return element;
	}

	private static getElementByIdAs<T extends HTMLButtonElement| HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id: string) {
		return View.getElementById1(id) as T;
	}

	getHidden(id: string): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(id);

		return element.className.indexOf("displayNone") >= 0;
	}
	setHidden(id: string, hidden: boolean, display?: string): this { // eslint-disable-line class-methods-use-this
		// optional display: block or flex
		const element = View.getElementById1(id),
			displayVisible = "display" + Utils.stringCapitalize(display || "block");

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

	setDisabled(id: string, disabled: boolean): this {
		const element = View.getElementByIdAs<HTMLButtonElement>(id);

		element.disabled = disabled;
		return this;
	}

	toggleClass(id: string, className: string): void { // eslint-disable-line class-methods-use-this
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

	getAreaValue(id: string): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLTextAreaElement>(id);

		return element.value;
	}
	setAreaValue(id: string, value: string): this {
		const element = View.getElementByIdAs<HTMLTextAreaElement>(id);

		element.value = value;
		return this;
	}

	getInputValue(id: string): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		return element.value;
	}
	setInputValue(id: string, value: string): this {
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		element.value = value;
		return this;
	}

	getInputChecked(id: string): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		return element.checked;
	}

	setSelectOptions(id: string, options: SelectOptionElement[]): this {
		const element = View.getElementByIdAs<HTMLSelectElement>(id);

		for (let i = 0; i < options.length; i += 1) {
			const item = options[i];
			let option: HTMLOptionElement;

			if (i >= element.length) {
				option = window.document.createElement("option");
				option.value = item.value;
				option.text = item.text;
				option.title = item.title;
				option.selected = item.selected; // multi-select
				element.add(option, null); // null needed for old FF 3.x
			} else {
				option = element.options[i];
				if (option.value !== item.value) {
					option.value = item.value;
				}
				if (option.text !== item.text) {
					if (Utils.debug > 3) {
						Utils.console.debug("setSelectOptions: " + id + ": text changed for index " + i + ": " + item.text);
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
	getSelectValue(id: string): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLSelectElement>(id);

		return element.value;
	}
	setSelectValue(id: string, value: string): this {
		const element = View.getElementByIdAs<HTMLSelectElement>(id);

		if (value) {
			element.value = value;
		}
		return this;
	}
	setSelectTitleFromSelectedOption(id: string): this {
		const element = View.getElementByIdAs<HTMLSelectElement>(id),
			selectedIndex = element.selectedIndex,
			title = (selectedIndex >= 0) ? element.options[selectedIndex].title : "";

		element.title = title;
		return this;
	}

	setAreaScrollTop(id: string, scrollTop?: number): this { // eslint-disable-line class-methods-use-this
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

	setAreaSelection(id: string, pos: number, endPos: number): this {
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

	attachEventHandler(type: string, eventHandler: EventListenerOrEventListenerObject): this {
		if (Utils.debug) {
			Utils.console.debug("attachEventHandler: type=" + type + ", eventHandler=" + ((eventHandler !== undefined) ? "[?]" : null));
		}
		window.document.addEventListener(type, eventHandler, false);
		return this;
	}
}
