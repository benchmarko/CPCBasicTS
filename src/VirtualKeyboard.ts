// VirtualKeyboard.ts - VirtualKeyboard
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { PressReleaseCpcKey } from "./Keyboard";
import { View } from "./View";

interface VirtualKeyboardOptions {
	fnPressCpcKey: PressReleaseCpcKey,
	fnReleaseCpcKey: PressReleaseCpcKey
}

interface CpcKey2Key {
	keys: string
	key: string
	keyShift?: string
	text?: string
	title?: string
	style?: number
	numLockCpcKey?: number

	keyNumLock?: string
	textNumLock?: string
	titleNumLock?: string
	textShift?: string
	titleShift?: string
}

type VirtualVirtualKeyboardLayoutType1 = { key: number, style?: number };

type VirtualVirtualKeyboardLayoutType2 = number | VirtualVirtualKeyboardLayoutType1;

interface VirtualButtonRowOptions {
	key: number,
	text: string,
	title: string,
	className: string
}

export class VirtualKeyboard {
	private readonly fnPressCpcKey: PressReleaseCpcKey;
	private readonly fnReleaseCpcKey: PressReleaseCpcKey;

	private readonly pointerOutEvent?: string;
	private readonly fnVirtualKeyout?: EventListener;

	private shiftLock = false;
	private numLock = false;

	constructor(options: VirtualKeyboardOptions) {
		this.fnPressCpcKey = options.fnPressCpcKey;
		this.fnReleaseCpcKey = options.fnReleaseCpcKey;

		const eventNames = this.fnAttachPointerEvents("kbdArea", this.onVirtualVirtualKeyboardKeydown.bind(this), undefined, this.onVirtualVirtualKeyboardKeyup.bind(this));

		if (eventNames.out) {
			this.pointerOutEvent = eventNames.out;
			this.fnVirtualKeyout = this.onVirtualVirtualKeyboardKeyout.bind(this);
		}

		this.dragInit("pageBody", "kbdAreaBox");

		this.virtualKeyboardCreate();
	}

	private static readonly cpcKey2Key: CpcKey2Key[] = [
		{
			keys: "38ArrowUp", // 0: cursor up
			key: "ArrowUp",
			text: "\u2191",
			title: "Cursor up"
		},
		{
			keys: "39ArrowRight", // 1: cursor right
			key: "ArrowRight",
			text: "\u2192",
			title: "Cursor right",
			style: 1
		},
		{
			keys: "40ArrowDown", // 2: cursor down
			key: "ArrowDown",
			text: "\u2193",
			title: "Cursor down"
		},
		{
			keys: "105Numpad9,120F9", // 3: numpad f9
			key: "9",
			text: "f9",
			style: 1,
			numLockCpcKey: 81 // joy 0 up+right
		},
		{
			keys: "102Numpad6,117F6", // 4: numpad f6
			key: "6",
			text: "f6",
			style: 1,
			numLockCpcKey: 75 // joy 0 right
		},
		{
			keys: "99Numpad3,114F3", // 5: numpad f3
			key: "3",
			text: "f3",
			style: 1,
			numLockCpcKey: 83 // joy 0 down+right
		},
		{
			keys: "13NumpadEnter", // 6: numpad enter
			key: "Enter",
			style: 4
		},
		{
			keys: "110NumpadDecimal", // 7: numpad .
			key: ".",
			numLockCpcKey: 77 // joy 0 fire 1
		},
		{
			keys: "37ArrowLeft", // 8: cursor left
			key: "ArrowLeft",
			text: "\u2190",
			title: "Cursor left",
			style: 1
		},
		{
			keys: "18AltLeft", // 9: copy
			key: "Alt",
			text: "Copy",
			style: 2
		},
		{
			keys: "103Numpad7,118F7", // 10: numpad f7
			key: "7",
			text: "f7",
			style: 1,
			numLockCpcKey: 80 // joy 0 up+left
		},
		{
			keys: "104Numpad8,119F8", // 11: numpad f8
			key: "8",
			text: "f8",
			style: 1,
			numLockCpcKey: 72 // joy 0 up
		},
		{
			keys: "101Numpad5,116F5", // 12: numpad f5
			key: "5",
			text: "f5",
			style: 1,
			numLockCpcKey: 76 // joy 0 fire 2
		},
		{
			keys: "97Numpad1,112F1", // 13: numpad f1
			key: "1",
			text: "f1",
			style: 1,
			numLockCpcKey: 82 // joy 0 down+left
		},
		{
			keys: "98Numpad2,113F2", // 14: numpad f2
			key: "2",
			text: "f2",
			style: 1,
			numLockCpcKey: 73 // joy 0 down
		},
		{
			keys: "96Numpad0,121F10", // 15: numpad f0
			key: "0",
			text: "f0",
			style: 1
			// numLockCpcKey: 90 // Num lock
		},
		{
			keys: "46Delete", // 16: clr
			key: "Delete",
			text: "Clr",
			title: "Clear",
			style: 1
		},
		{
			keys: "187BracketRight,171BracketRight,221BracketRight", // 17: [ { (Chrome: 187; FF: 171); EN: 221BracketRight
			key: "[",
			keyShift: "{"
		},
		{
			keys: "13Enter", // 18: return
			key: "Enter",
			text: "Ret",
			title: "Return",
			style: 2
		},
		{
			keys: "191Backslash,163Backslash,220Backslash", // 19: ] } => # ' (Chrome: 191; FF: 163); EN: 220Backslash
			key: "]",
			keyShift: "}"
		},
		{
			keys: "100Numpad4,115F4", // 20: numpad f4
			key: "4",
			text: "f4",
			style: 1,
			numLockCpcKey: 74 // joy 0 left
		},
		{
			keys: "16ShiftLeft,16ShiftRight", // 21: shift left, shift right (2 keys!)
			key: "Shift",
			style: 4
		},
		{
			keys: "220Backquote,160Backquote,192Backquote", // 22: \ ` (different location, key!; Chrome: 220; FF: 160); EN: 192Backquote, 226IntlBackslash?
			key: "\\",
			keyShift: "`"
		},
		{
			keys: "17ControlLeft,17ControlRight", // 23: Note: alt-gr also triggers ctrl-left and alt-gr!
			key: "Control",
			text: "Ctrl",
			title: "Control",
			style: 4
		},
		{
			keys: "221Equal,192Equal,187Equal", // 24: ^ £ (pound: \u00A3) (Chrome: 221; FF: 192); EN: 187Equal
			key: "^",
			keyShift: "£"
		},
		{
			keys: "219Minus,63Minus,189Minus", // 25: - = (Chrome: 219; FF: 63); EN: 189Minus
			key: "-",
			keyShift: "="
		},
		{
			keys: "186BracketLeft,59BracketLeft,219BracketLeft", // 26: @ | (Chrome: 168; FF: 59); EN: 219BracketLeft
			key: "@",
			keyShift: "|",
			style: 1
		},
		{
			keys: "80KeyP", // 27: P
			key: "p",
			keyShift: "P"
		},
		{
			keys: "222Quote,192Quote", // 28: ; + (same on Chrome, FF); Android Bluetooth EN: 192Quote
			key: ";",
			keyShift: "+"
		},
		{
			keys: "192Semicolon,186Semicolon", // 29: : * (same on Chrome, FF); EN: 186Semicolon
			key: ":",
			keyShift: "*"
		},
		{
			keys: "189Slash,173Slash,191Slash", // 30: / ? (Chrome: 189; FF: 173); EN: 191Slash
			key: "/",
			keyShift: "?"
		},
		{
			keys: "190Period", // 31: . <
			key: ".",
			keyShift: "<"
		},
		{
			keys: "48Digit0", // 32: 0 _
			key: "0",
			keyShift: "_"
		},
		{
			keys: "57Digit9", // 33: 9 )
			key: "9",
			keyShift: ")"
		},
		{
			keys: "79KeyO", // 34:
			key: "o",
			keyShift: "O"
		},
		{
			keys: "73KeyI", // 35:
			key: "i",
			keyShift: "I"
		},
		{
			keys: "76KeyL", // 36:
			key: "l",
			keyShift: "L"
		},
		{
			keys: "75KeyK", // 37:
			key: "k",
			keyShift: "K"
		},
		{
			keys: "77KeyM", // 38:
			key: "m",
			keyShift: "M"
		},
		{
			keys: "188Comma", // 39: , >
			key: ",",
			keyShift: ">"
		},
		{
			keys: "56Digit8", // 40: 8 (
			key: "8",
			keyShift: "("
		},
		{
			keys: "55Digit7", // 41: 7 '
			key: "7",
			keyShift: "'"
		},
		{
			keys: "85KeyU", // 42:
			key: "u",
			keyShift: "U"
		},
		{
			keys: "90KeyY,89KeyY", // 43:
			key: "y",
			keyShift: "Y"
		},
		{
			keys: "72KeyH", // 44:
			key: "h",
			keyShift: "H"
		},
		{
			keys: "74KeyJ", // 45:
			key: "j",
			keyShift: "J"
		},
		{
			keys: "78KeyN", // 46:
			key: "n",
			keyShift: "N"
		},
		{
			keys: "32Space", // 47: space
			key: " ",
			text: "Space",
			style: 5
		},
		{
			keys: "54Digit6", // 48: 6 &
			key: "6",
			keyShift: "("
		},
		{
			keys: "53Digit5", // 49: 5 %
			key: "5",
			keyShift: "%"
		},
		{
			keys: "82KeyR", // 50:
			key: "r",
			keyShift: "R"
		},
		{
			keys: "84KeyT", // 51:
			key: "t",
			keyShift: "T"
		},
		{
			keys: "71KeyG", // 52:
			key: "g",
			keyShift: "G"
		},
		{
			keys: "70KeyF", // 53:
			key: "f",
			keyShift: "F"
		},
		{
			keys: "66KeyB", // 54:
			key: "b",
			keyShift: "B"
		},
		{
			keys: "86KeyV", // 55:
			key: "v",
			keyShift: "V"
		},
		{
			keys: "52Digit4", // 56: 4 $
			key: "4",
			keyShift: "$"
		},
		{
			keys: "51Digit3", // 57: 3 #
			key: "3",
			keyShift: "#"
		},
		{
			keys: "69KeyE", // 58:
			key: "e",
			keyShift: "E"
		},
		{
			keys: "87KeyW", // 59:
			key: "w",
			keyShift: "W"
		},
		{
			keys: "83KeyS", // 60:
			key: "s",
			keyShift: "S"
		},
		{
			keys: "68KeyD", // 61:
			key: "d",
			keyShift: "D"
		},
		{
			keys: "67KeyC", // 62:
			key: "c",
			keyShift: "C"
		},
		{
			keys: "88KeyX", // 63:
			key: "x",
			keyShift: "X"
		},
		{
			keys: "49Digit1", // 64: 1 !
			key: "1",
			keyShift: "!"
		},
		{
			keys: "50Digit2", // 65: 2 "
			key: "2",
			keyShift: "\""
		},
		{
			keys: "27Escape", // 66: esc
			key: "Escape",
			text: "Esc",
			title: "Escape",
			style: 1
		},
		{
			keys: "81KeyQ", // 67:
			key: "q",
			keyShift: "Q"
		},
		{
			keys: "9Tab", // 68:
			key: "Tab",
			style: 2
		},
		{
			keys: "65KeyA", // 69:
			key: "a",
			keyShift: "A"
		},
		{
			keys: "20CapsLock", // 70: caps lock
			key: "CapsLock",
			text: "Caps",
			title: "Caps Lock",
			style: 3
		},
		{
			keys: "89KeyZ,90KeyZ", // 71: DE,EN
			key: "z",
			keyShift: "Z"
		},
		{
			keys: "38Numpad8", // 72: joy 0 up (arrow up)
			key: "JoyUp",
			text: "\u21D1",
			title: "Joy up"
		},
		{
			keys: "40Numpad2", // 73: joy 0 down
			key: "JoyDown",
			text: "\u21D3",
			title: "Joy down"
		},
		{
			keys: "37Numpad4", // 74: joy 0 left
			key: "JoyLeft",
			text: "\u21D0",
			title: "Joy left"
		},
		{
			keys: "39Numpad6", // 75: joy 0 right
			key: "JoyRight",
			text: "\u21D2",
			title: "Joy right"
		},
		{
			keys: "12Numpad5,45Numpad0", // 76: joy 0 fire 2 (clear,...)
			key: "X",
			text: "\u29BF",
			title: "Joy fire"
		},
		{
			keys: "46NumpadDecimal", // 77: joy 0 fire 1
			key: "Z",
			text: "\u25E6",
			title: "Joy fire 1"
		},
		{
			keys: "", // 78: ""? not null? (joy 0 fire 3?) TTT
			key: ""
		},
		{
			keys: "8Backspace", // 79: del
			key: "Backspace", // 79: del
			text: "Del",
			title: "Delete",
			style: 1
		},
		// starting with 80, not on CPC
		// not on CPC:
		{
			keys: "36Numpad7", // 80: joy 0 up+left
			key: "",
			text: "\u21D6",
			title: "Joy up+left"
		},
		{
			keys: "33Numpad9", // 81: joy 0 up+right
			key: "",
			text: "\u21D7",
			title: "Joy up+right"
		},
		{
			keys: "35Numpad1", // 82: joy 0 down+left
			key: "",
			text: "\u21D9",
			title: "Joy down+leftt"
		},
		{
			keys: "34Numpad3", // 83: joy 0 down+right
			key: "",
			text: "\u21D8",
			title: "Joy down+right"
		},
		{
			keys: "", // 84: (not null?) TTT
			key: ""
		},
		{
			keys: "226IntlBackslash,60IntlBackslash,220IntlBackslash", // 85: < > | // key not on CPC! (Chrome: 226, FF: 60);  Android Bluetooth EN: 220IntlBackslash
			key: ""
		},
		{
			keys: "111NumpadDivide", // 86:
			key: ""
		},
		{
			keys: "106NumpadMultiply", // 87:
			key: ""
		},
		{
			keys: "109NumpadSubtract", // 88:
			key: ""
		},
		{
			keys: "107NumpadAdd", // 89:
			key: ""
		},
		{
			keys: "",
			key: "", // 90: special num lock key to switch between joystick and numpad
			text: "Num",
			title: "Num / Joy",
			style: 1
		}
		// only on PC:
		// "226IntlBackslash", "122F11", "123F12", "44PrintScreen", "145ScrollLock", "19Pause", "45Insert", "36Home", "33PageUp", "35End", "34PageDown", "111NumpadDivide", "106NumpadMultiply", "109NumpadSubtract", "107NumpadAdd"
	];

	/* eslint-disable array-element-newline */
	private static readonly virtualVirtualKeyboardAlpha: VirtualVirtualKeyboardLayoutType2[][] = [
		[66, 64, 65, 57, 56, 49, 48, 41, 40, 33, 32, 25, 24, 16, 79],
		[68, 67, 59, 58, 50, 51, 43, 42, 35, 34, 27, 26, 17, 18],
		[70, 69, 60, 61, 53, 52, 44, 45, 37, 36, 29, 28, 19, 90], // 90=virtual numpad button
		[
			21, 71, 63, 62, 55, 54, 46, 38, 39, 31, 30, 22,
			{
				key: 21, // right shift has same code and style
				style: 2
			}
		],
		[23, 9, 47, 6]
	];

	private static readonly virtualVirtualKeyboardNum: VirtualVirtualKeyboardLayoutType2[][] = [ // numpad
		[10, 11, 3],
		[20, 12, 4],
		[13, 14, 5],
		[15, 0, 7],
		[8, 2, 1]
	];
	/* eslint-enable array-element-newline */

	private readonly dragInfo = {
		dragItem: undefined as (HTMLElement | undefined),
		active: false,
		xOffset: 0,
		yOffset: 0,
		initialX: 0,
		initialY: 0,
		currentX: 0,
		currentY: 0
	};

	private static readonly pointerEventNames = {
		down: "pointerdown",
		move: "pointermove",
		up: "pointerup",
		cancel: "pointercancel",
		out: "pointerout",
		type: "pointer"
	};

	private static readonly touchEventNames = {
		down: "touchstart",
		move: "touchmove",
		up: "touchend",
		cancel: "touchcancel",
		out: "", // n.a.
		type: "touch"
	};

	private static readonly mouseEventNames = {
		down: "mousedown",
		move: "mousemove",
		up: "mouseup",
		cancel: "", // n.a.
		out: "mouseout",
		type: "mouse"
	};

	private fnAttachPointerEvents(id: string, fnDown?: EventListener, fnMove?: EventListener, fnUp?: EventListener) { // eslint-disable-line class-methods-use-this
		const area = View.getElementById1(id);
		let eventNames: typeof VirtualKeyboard.pointerEventNames;

		if (window.PointerEvent) {
			eventNames = VirtualKeyboard.pointerEventNames;
		} else if ("ontouchstart" in window || navigator.maxTouchPoints) {
			eventNames = VirtualKeyboard.touchEventNames;
		} else {
			eventNames = VirtualKeyboard.mouseEventNames;
		}

		if (Utils.debug > 0) {
			Utils.console.log("fnAttachPointerEvents: Using", eventNames.type, "events");
		}

		if (fnDown) {
			area.addEventListener(eventNames.down, fnDown, false); // +clicked for pointer, touch?
		}
		if (fnMove) {
			area.addEventListener(eventNames.move, fnMove, false);
		}
		if (fnUp) {
			area.addEventListener(eventNames.up, fnUp, false);
			if (eventNames.cancel) {
				area.addEventListener(eventNames.cancel, fnUp, false);
			}
		}
		return eventNames;
	}

	reset(): void {
		this.virtualKeyboardAdaptKeys(false, false);
	}

	private mapNumLockCpcKey(cpcKey: number) { // eslint-disable-line class-methods-use-this
		const key = VirtualKeyboard.cpcKey2Key[cpcKey];

		if (key.numLockCpcKey) {
			cpcKey = key.numLockCpcKey;
		}
		return cpcKey;
	}

	private fnVirtualGetAscii(cpcKey: number, shiftKey: boolean, numLock: boolean) { // eslint-disable-line class-methods-use-this
		const keyEntry = VirtualKeyboard.cpcKey2Key[cpcKey];
		let key: string,
			text: string,
			title: string;

		if (numLock && keyEntry.keyNumLock) {
			key = keyEntry.keyNumLock;
			text = keyEntry.textNumLock || key;
			title = keyEntry.titleNumLock || text;
		} else if (shiftKey && keyEntry.keyShift) {
			key = keyEntry.keyShift;
			text = keyEntry.textShift || key;
			title = keyEntry.titleShift || text;
		} else {
			key = keyEntry.key;
			text = keyEntry.text || key;
			title = keyEntry.title || text;
		}

		return {
			key: key,
			text: text,
			title: title
		};
	}

	private createButtonRow(id: string, options: VirtualButtonRowOptions[]) {
		const place = View.getElementById1(id);

		if (place.insertAdjacentElement) {
			const buttonList = document.createElement("div");

			buttonList.className = "displayFlex";
			for (let i = 0; i < options.length; i += 1) {
				const item = options[i],
					button = document.createElement("button");

				button.innerText = item.text;
				button.setAttribute("title", item.title);
				button.className = item.className;
				button.setAttribute("data-key", String(item.key));
				buttonList.insertAdjacentElement("beforeend", button);
			}
			place.insertAdjacentElement("beforeend", buttonList);
		} else { // Polyfill for old browsers
			let html = "<div class=displayFlex>\n";

			for (let i = 0; i < options.length; i += 1) {
				const item = options[i];

				html += '<button title="' + item.title + '" class="' + item.className + '" data-key="' + item.key + '">' + item.text + "</button>\n";
			}
			html += "</div>";
			place.innerHTML += html;
		}
		return this;
	}

	private virtualKeyboardCreatePart(id: string, virtualVirtualKeyboard: VirtualVirtualKeyboardLayoutType2[][]) {
		const keyArea = View.getElementById1(id),
			shiftLock = this.shiftLock,
			numLock = this.numLock,
			cpcKey2Key = VirtualKeyboard.cpcKey2Key,
			buttons = keyArea.getElementsByTagName("button");

		if (!buttons.length) { // not yet created?
			for (let row = 0; row < virtualVirtualKeyboard.length; row += 1) {
				const rowList = virtualVirtualKeyboard[row],
					optionsList = [] as VirtualButtonRowOptions[];

				for (let col = 0; col < rowList.length; col += 1) {
					let	cpcKeyEntry: VirtualVirtualKeyboardLayoutType1;

					if (typeof rowList[col] === "number") {
						cpcKeyEntry = {
							key: rowList[col] as number
						};
					} else { // object
						cpcKeyEntry = rowList[col] as VirtualVirtualKeyboardLayoutType1;
					}
					const cpcKey = numLock ? this.mapNumLockCpcKey(cpcKeyEntry.key) : cpcKeyEntry.key,
						keyEntry = cpcKey2Key[cpcKeyEntry.key],
						ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock),
						className = "kbdButton" + (cpcKeyEntry.style || keyEntry.style || "") + ((col === rowList.length - 1) ? " kbdNoRightMargin" : ""),
						options: VirtualButtonRowOptions = {
							key: cpcKey,
							text: ascii.text,
							title: ascii.title,
							className: className
						};

					optionsList.push(options);
				}
				this.createButtonRow(id, optionsList);
			}
		}
	}

	private virtualKeyboardCreate(): void {
		this.virtualKeyboardCreatePart("kbdAlpha", VirtualKeyboard.virtualVirtualKeyboardAlpha);
		this.virtualKeyboardCreatePart("kbdNum", VirtualKeyboard.virtualVirtualKeyboardNum);
	}

	private virtualKeyboardAdaptKeys(shiftLock: boolean, numLock: boolean) {
		const keyArea = View.getElementById1("kbdArea"),
			buttons = keyArea.getElementsByTagName("button"); // or: keyArea.childNodes and filter

		for (let i = 0; i < buttons.length; i += 1) {
			const button = buttons[i];
			let cpcKey = Number(button.getAttribute("data-key"));

			if (numLock) {
				cpcKey = this.mapNumLockCpcKey(cpcKey);
			}

			const ascii = this.fnVirtualGetAscii(cpcKey, shiftLock, numLock);

			if (ascii.key !== button.innerText) {
				button.innerText = ascii.text;
				button.title = ascii.title;
			}
		}
	}

	private fnVirtualGetPressedKey(cpcKey: number) { // eslint-disable-line class-methods-use-this
		const key = VirtualKeyboard.cpcKey2Key[cpcKey];
		let pressedKey = "";

		if (key) {
			pressedKey = key.keys;
			if (pressedKey.indexOf(",") >= 0) { // maybe more
				pressedKey = pressedKey.substring(0, pressedKey.indexOf(",")); // take the first
			}
		}
		return pressedKey;
	}

	private onVirtualVirtualKeyboardKeydown(event: Event) {
		const node = View.getEventTarget<HTMLElement>(event),
			cpcKey = node.getAttribute("data-key");

		if (Utils.debug > 1) {
			Utils.console.debug("onVirtualVirtualKeyboardKeydown: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", cpcKey);
		}

		if (cpcKey !== null) {
			let cpcKeyCode = Number(cpcKey);

			if (this.numLock) {
				cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
			}

			const pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode),
				pointerEvent = event as PointerEvent,
				ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || pointerEvent.shiftKey, this.numLock);

			this.fnPressCpcKey(cpcKeyCode, pressedKey, ascii.key, pointerEvent.shiftKey, pointerEvent.ctrlKey);
		}

		if (this.pointerOutEvent && this.fnVirtualKeyout) {
			node.addEventListener(this.pointerOutEvent, this.fnVirtualKeyout, false);
		}
		event.preventDefault();
		return false;
	}

	private fnVirtualVirtualKeyboardKeyupOrKeyout(event: Event) {
		const node = View.getEventTarget<HTMLElement>(event),
			cpcKey = node.getAttribute("data-key");

		if (cpcKey !== null) {
			let cpcKeyCode = Number(cpcKey);

			if (this.numLock) {
				cpcKeyCode = this.mapNumLockCpcKey(cpcKeyCode);
			}
			const pressedKey = this.fnVirtualGetPressedKey(cpcKeyCode),
				pointerEvent = event as PointerEvent,
				ascii = this.fnVirtualGetAscii(cpcKeyCode, this.shiftLock || pointerEvent.shiftKey, this.numLock);

			this.fnReleaseCpcKey(cpcKeyCode, pressedKey, ascii.key, pointerEvent.shiftKey, pointerEvent.ctrlKey);

			if (cpcKeyCode === 70) { // Caps Lock?
				this.shiftLock = !this.shiftLock;
				this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
			} else if (cpcKeyCode === 90) { // Num lock
				this.numLock = !this.numLock;
				this.virtualKeyboardAdaptKeys(this.shiftLock, this.numLock);
			}
		}
	}

	private onVirtualVirtualKeyboardKeyup(event: Event) {
		const node = View.getEventTarget<HTMLElement>(event);

		if (Utils.debug > 1) {
			Utils.console.debug("onVirtualVirtualKeyboardKeyup: event", String(event), "type:", event.type, "title:", node.title, "cpcKey:", node.getAttribute("data-key"));
		}

		this.fnVirtualVirtualKeyboardKeyupOrKeyout(event);

		if (this.pointerOutEvent && this.fnVirtualKeyout) {
			node.removeEventListener(this.pointerOutEvent, this.fnVirtualKeyout); // do not need out event any more
		}
		event.preventDefault();
		return false;
	}

	private onVirtualVirtualKeyboardKeyout(event: Event) {
		const node = View.getEventTarget<HTMLElement>(event);

		if (Utils.debug > 1) {
			Utils.console.debug("onVirtualVirtualKeyboardKeyout: event=", event);
		}
		this.fnVirtualVirtualKeyboardKeyupOrKeyout(event);
		if (this.pointerOutEvent && this.fnVirtualKeyout) {
			node.removeEventListener(this.pointerOutEvent, this.fnVirtualKeyout);
		}
		event.preventDefault();
		return false;
	}

	// based on https://www.kirupa.com/html5/drag.htm
	private dragInit(containerId: string, itemId: string) {
		const drag = this.dragInfo;

		drag.dragItem = View.getElementById1(itemId);
		drag.active = false;
		drag.xOffset = 0;
		drag.yOffset = 0;

		this.fnAttachPointerEvents(containerId, this.dragStart.bind(this), this.drag.bind(this), this.dragEnd.bind(this));
	}

	private dragStart(event: Event) {
		const node = View.getEventTarget<HTMLElement>(event),
			parent = node.parentElement ? node.parentElement.parentElement : null,
			drag = this.dragInfo;

		if (node === drag.dragItem || parent === drag.dragItem) {
			if (event.type === "touchstart") {
				const touchEvent = event as TouchEvent;

				drag.initialX = touchEvent.touches[0].clientX - drag.xOffset;
				drag.initialY = touchEvent.touches[0].clientY - drag.yOffset;
			} else {
				const dragEvent = event as DragEvent;

				drag.initialX = dragEvent.clientX - drag.xOffset;
				drag.initialY = dragEvent.clientY - drag.yOffset;
			}
			drag.active = true;
		}
	}

	private dragEnd(/* event */) {
		const drag = this.dragInfo;

		drag.initialX = drag.currentX;
		drag.initialY = drag.currentY;

		drag.active = false;
	}

	private setTranslate(xPos: number, yPos: number, el: HTMLElement) { // eslint-disable-line class-methods-use-this
		el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
	}

	private drag(event: Event) {
		const drag = this.dragInfo;

		if (drag.active) {
			event.preventDefault();

			if (event.type === "touchmove") {
				const touchEvent = event as TouchEvent;

				drag.currentX = touchEvent.touches[0].clientX - drag.initialX;
				drag.currentY = touchEvent.touches[0].clientY - drag.initialY;
			} else {
				const dragEvent = event as DragEvent;

				drag.currentX = dragEvent.clientX - drag.initialX;
				drag.currentY = dragEvent.clientY - drag.initialY;
			}

			drag.xOffset = drag.currentX;
			drag.yOffset = drag.currentY;

			if (drag.dragItem) {
				this.setTranslate(drag.currentX, drag.currentY, drag.dragItem);
			}
		}
	}
}
