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
	/*
	constructor() {
	}
	*/

	static getElementById1(sId: string): HTMLElement {
		const element = document.getElementById(sId);

		if (!element) {
			throw new Error("Unknown " + sId);
		}
		return element;
	}

	getHidden(sId: string): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId);

		return element.className.indexOf("displayNone") >= 0;
	}
	setHidden(sId: string, bHidden: boolean, sDisplay?: string): this { // eslint-disable-line class-methods-use-this
		// optional sDisplay: block or flex
		const element = View.getElementById1(sId),
			sDisplayVisible = "display" + Utils.stringCapitalize(sDisplay || "block");

		if (bHidden) {
			if (element.className.indexOf("displayNone") < 0) {
				this.toggleClass(sId, "displayNone");
			}
			if (element.className.indexOf(sDisplayVisible) >= 0) {
				this.toggleClass(sId, sDisplayVisible);
			}
		} else {
			if (element.className.indexOf("displayNone") >= 0) {
				this.toggleClass(sId, "displayNone");
			}
			if (element.className.indexOf(sDisplayVisible) < 0) {
				this.toggleClass(sId, sDisplayVisible);
			}
		}

		return this;
	}

	setDisabled(sId: string, bDisabled: boolean): this {
		const element = View.getElementById1(sId) as HTMLButtonElement;

		element.disabled = bDisabled;
		return this;
	}

	toggleClass(sId: string, sClassName: string): void { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId);
		let sClasses = element.className;
		const iNameIndex = sClasses.indexOf(sClassName);

		if (iNameIndex === -1) {
			sClasses = sClasses.trim() + " " + sClassName;
		} else {
			sClasses = sClasses.substr(0, iNameIndex) + sClasses.substr(iNameIndex + sClassName.length + 1).trim();
		}
		element.className = sClasses;
	}

	getAreaValue(sId: string): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId) as HTMLTextAreaElement;

		return element.value;
	}
	setAreaValue(sId: string, sValue: string): this {
		const element = View.getElementById1(sId) as HTMLTextAreaElement;

		element.value = sValue;
		return this;
	}

	getInputValue(sId: string): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId) as HTMLInputElement;

		return element.value;
	}
	setInputValue(sId: string, sValue: string): this {
		const element = View.getElementById1(sId) as HTMLInputElement;

		element.value = sValue;
		return this;
	}

	getInputChecked(sId: string): boolean { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId) as HTMLInputElement;

		return element.checked;
	}

	setSelectOptions(sId: string, aOptions: SelectOptionElement[]): this {
		const element = View.getElementById1(sId) as HTMLSelectElement;

		for (let i = 0; i < aOptions.length; i += 1) {
			const oItem = aOptions[i];
			let option: HTMLOptionElement;

			if (i >= element.length) {
				option = document.createElement("option");
				option.value = oItem.value;
				option.text = oItem.text;
				option.title = oItem.title;
				option.selected = oItem.selected; // multi-select
				element.add(option, null); // null needed for old FF 3.x
			} else {
				option = element.options[i];
				if (option.value !== oItem.value) {
					option.value = oItem.value;
				}
				if (option.text !== oItem.text) {
					if (Utils.debug > 3) {
						Utils.console.debug("setSelectOptions: " + sId + ": text changed for index " + i + ": " + oItem.text);
					}
					option.text = oItem.text;
					option.title = oItem.title;
				}
				option.selected = oItem.selected; // multi-select
			}
		}
		// remove additional select options
		element.options.length = aOptions.length;
		return this;
	}
	getSelectValue(sId: string): string { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId) as HTMLSelectElement;

		return element.value;
	}
	setSelectValue(sId: string, sValue: string): this {
		const element = View.getElementById1(sId) as HTMLSelectElement;

		if (sValue) {
			element.value = sValue;
		}
		return this;
	}
	setSelectTitleFromSelectedOption(sId: string): this {
		const element = View.getElementById1(sId) as HTMLSelectElement,
			iSelectedIndex = element.selectedIndex,
			sTitle = (iSelectedIndex >= 0) ? element.options[iSelectedIndex].title : "";

		element.title = sTitle;
		return this;
	}

	setAreaScrollTop(sId: string, iScrollTop?: number): this { // eslint-disable-line class-methods-use-this
		const element = View.getElementById1(sId) as HTMLTextAreaElement;

		if (iScrollTop === undefined) {
			iScrollTop = element.scrollHeight;
		}
		element.scrollTop = iScrollTop;
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

	setAreaSelection(sId: string, iPos: number, iEndPos: number): this {
		const element = View.getElementById1(sId) as HTMLTextAreaElement;

		if (element.selectionStart !== undefined) {
			if (element.setSelectionRange !== undefined) {
				element.focus(); // not needed for scrolling but we want to see the selected text
				this.setSelectionRange(element, iPos, iEndPos);
			} else {
				element.focus();
				element.selectionStart = iPos;
				element.selectionEnd = iEndPos;
			}
		}
		return this;
	}

	attachEventHandler(sType: string, eventHandler: EventListenerOrEventListenerObject): this {
		if (Utils.debug) {
			Utils.console.debug("attachEventHandler: type=" + sType + ", eventHandler=" + ((eventHandler !== undefined) ? "[?]" : null));
		}
		document.addEventListener(sType, eventHandler, false);
		return this;
	}
}
