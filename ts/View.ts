// View.ts - View Module to access HTML DOM
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//

"use strict";

import { Utils } from "./Utils";

export interface SelectOptionElement { // similar to HtmlOptionElement
	value: string,
	text: string,
	title: string
	selected: boolean
}

export class View {

	static fnEventHandler = null;

	constructor() {
		this.init();
	}

	init() {
		//this.bDirty = false;
	}

	static getElementById1(sId: string) {
		const element = document.getElementById(sId);

		if (!element) {
			throw new Error("Unknown " + sId);
		}
		return element;
	}

	getHidden(sId: string) {
		const element = View.getElementById1(sId);

		return element.className.indexOf("displayNone") >= 0;
	}
	setHidden(sId: string, bHidden: boolean, sDisplay: string) { // optional sDisplay: block or flex
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

	setDisabled(sId: string, bDisabled: boolean) {
		var element = View.getElementById1(sId);

		(element as HTMLButtonElement).disabled = bDisabled;
		return this;
	}

	toggleClass(sId: string, sClassName: string) {
		const element = View.getElementById1(sId);
		let sClasses = element.className;
		const iNameIndex = sClasses.indexOf(sClassName);

		if (iNameIndex === -1) {
			sClasses += " " + sClassName;
		} else {
			sClasses = sClasses.substr(0, iNameIndex) + sClasses.substr(iNameIndex + sClassName.length + 1);
		}
		element.className = sClasses;
	}

	getAreaValue(sId: string) {
		const element = View.getElementById1(sId);

		return (element as HTMLTextAreaElement).value;
	}
	setAreaValue(sId: string, sValue: string) {
		const element = View.getElementById1(sId);

		(element as HTMLTextAreaElement).value = sValue;
		return this;
	}

	setSelectOptions(sId: string, aOptions: SelectOptionElement[]) {
		const element = View.getElementById1(sId),
			select = element as HTMLSelectElement;

		for (let i = 0; i < aOptions.length; i += 1) {
			const oItem = aOptions[i];
			if (i >= select.length) {
				const option = document.createElement("option");
				option.value = oItem.value;
				option.text = oItem.text;
				option.title = oItem.title;
				option.selected = oItem.selected; // multi-select
				select.add(option, null); // null needed for old FF 3.x
			} else {
				const option = select.options[i];
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
			}

			/*
			if (oItem.selected) { // multi-select
				option.selected = oItem.selected;
			}
			*/
		}
		// remove additional select options
		select.options.length = aOptions.length;
		return this;
	}
	getSelectValue(sId: string) {
		const element = View.getElementById1(sId);

		return (element as HTMLSelectElement).value;
	}
	setSelectValue(sId: string, sValue: string) {
		const element = View.getElementById1(sId);

		if (sValue) {
			(element as HTMLSelectElement).value = sValue;
		}
		return this;
	}
	setSelectTitleFromSelectedOption(sId: string) {
		const element = View.getElementById1(sId),
			select = element as HTMLSelectElement,
			iSelectedIndex = select.selectedIndex,
			sTitle = (iSelectedIndex >= 0) ? select.options[iSelectedIndex].title : "";

		select.title = sTitle;
		return this;
	}

	setAreaScrollTop(sId: string, iScrollTop?: number) {
		const element = View.getElementById1(sId),
			area = element as HTMLTextAreaElement;

		if (iScrollTop === undefined) {
			iScrollTop = area.scrollHeight;
		}
		area.scrollTop = iScrollTop;
	}

	private setSelectionRange(textarea: HTMLTextAreaElement, selectionStart: number, selectionEnd: number) {
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
	}

	setAreaSelection(sId: string, iPos: number, iEndPos: number) {
		const element = View.getElementById1(sId),
			area = element as HTMLTextAreaElement;

		if (area.selectionStart !== undefined) {
			if (area.setSelectionRange !== undefined) {
				area.focus(); // not needed for scrolling but we want to see the selected text
				this.setSelectionRange(area, iPos, iEndPos);
			} else {
				area.focus();
				area.selectionStart = iPos;
				area.selectionEnd = iEndPos;
			}
		}
		return this;
	}

	attachEventHandler(sType: string, fnEventHandler: EventListener) {
		if (Utils.debug) {
			Utils.console.debug("attachEventHandler: type=" + sType + ", fnEventHandler=" + ((fnEventHandler != undefined) ? "[function]" : null));
		}
		document.addEventListener(sType, fnEventHandler, false);
		return this;
	}
};
