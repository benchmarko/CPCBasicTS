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

export interface AreaInputElement {
	value: string,
	title: string,
	checked: boolean,
	imgUrl: string
}

export class View {
	static getElementById1(id: string): HTMLElement {
		const element = window.document.getElementById(id);

		if (!element) {
			throw new Error("Unknown " + id);
		}
		return element;
	}

	static getElementByIdAs<T extends HTMLButtonElement| HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement>(id: string): T {
		return View.getElementById1(id) as T;
	}

	getHidden(id: string): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(id);

		return element.className.indexOf("displayNone") >= 0;
	}
	setHidden(id: string, hidden: boolean, display?: string): this { // eslint-disable-line class-methods-use-this
		// optional display: block or flex or inherit
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
	setInputChecked(id: string, checked: boolean): this {
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		element.checked = checked;
		return this;
	}

	/*
	getInputDisabled(id: string): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		return element.disabled;
	}
	setInputDisabled(id: string, disabled: boolean): this {
		const element = View.getElementByIdAs<HTMLInputElement>(id);

		element.disabled = disabled;
		return this;
	}
	*/

	setAreaInputList(id: string, inputs: AreaInputElement[]): this {
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
				input = window.document.createElement("input");
				input.type = "radio";
				input.id = "galleryItem" + i;
				input.name = "gallery";
				input.value = item.value;
				input.checked = item.checked;

				label = window.document.createElement("label");
				label.setAttribute("for", "galleryItem" + i);
				label.setAttribute("style", 'background: url("' + item.imgUrl + '"); background-size: cover');
				label.setAttribute("title", item.title);

				element.appendChild(input);
				element.appendChild(label);
			} else {
				input = childNodes[i * 2] as HTMLInputElement;
				if (input.value !== item.value) {
					if (Utils.debug > 3) {
						Utils.console.debug("setInputList: " + id + ": value changed for index " + i + ": " + item.value);
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

	getSelectOptions(id: string): SelectOptionElement[] { // eslint-disable-line class-methods-use-this
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

	static getEventTarget<T extends HTMLElement>(event: Event): T {
		const target = event.target || event.srcElement; // target, not currentTarget; srcElement for IE8

		if (!target) {
			Utils.console.error("getEventTarget: Undefined event target: " + target);
		}
		return target as T;
	}

	static requestFullscreenForId(id: string): boolean {
		const element = View.getElementById1(id),
			anyEl = element as any,
			requestMethod = element.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.mozRequestFullscreen || anyEl.msRequestFullscreen;
			//parameter = anyEl.webkitRequestFullscreen ? (Element as any).ALLOW_KEYBOARD_INPUT : undefined; // does this work?

		if (requestMethod) {
			requestMethod.call(element); // can we ALLOW_KEYBOARD_INPUT?
		} else if (typeof (window as any).ActiveXObject !== "undefined") { // older IE
			const wscript = new (window as any).ActiveXObject("WScript.Shell");

			if (wscript !== null) {
				wscript.SendKeys("{F11}"); // eslint-disable-line new-cap
			}
		} else {
			return false;
		}
		return true;
	}
}
