// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import { Utils } from "./Utils";
import { View } from "./View";

export interface CpcKeyExpansionsOptions {
	iCpcKey: number
	iRepeat: number
	iNormal?: number
	iShift?: number
	iCtrl?: number
}

export type PressReleaseCpcKey = (iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean) => void;
interface KeyboardOptions {
	fnOnEscapeHandler?: (sKey: string, sPressedKey: string) => void
	fnOnKeyDown?: () => void
}

type KeyExpansionsType = { [k in string]: number }; // numbers as keys are stored as string anyway, so use string

type KeyExpansionsRepeatType = { [k in string]: number }; // numbers as keys are stored as string anyway, so use string

type Key2CpcKeyType = { [k in string]: number };

type PressedBrowseKeysType = { [k in string]: boolean };

type PressedKeysType = { [k in string]: {oKeys: PressedBrowseKeysType, shift: boolean, ctrl: boolean } };
interface CpcKeyExpansions {
	normal: KeyExpansionsType
	shift: KeyExpansionsType
	ctrl: KeyExpansionsType
	repeat: KeyExpansionsRepeatType
}

export class Keyboard {
	options: KeyboardOptions;

	fnOnKeyDown?: () => void;
	aKeyBuffer: string[]; // buffered pressed keys
	aExpansionTokens: string[]; // strings for expansion tokens 0..31 (in reality: 128..159)
	oCpcKeyExpansions: CpcKeyExpansions; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat

	bActive: boolean; // flag if keyboard is active/focused, set from outside

	oKey2CpcKey: Key2CpcKeyType;
	bCodeStringsRemoved: boolean;

	sPointerOutEvent?: string;
	fnVirtualKeyout?: EventListener;

	oPressedKeys: PressedKeysType; // currently pressed browser keys
	bShiftLock: boolean; // for virtual keyboard
	bNumLock: boolean;

	// use this:
	private static mKey2CpcKey = {
		"38ArrowUp": 0,
		"39ArrowRight": 1,
		"40ArrowDown": 2,
		"105Numpad9": 3,
		"120F9": 3,
		"102Numpad6": 4,
		"117F6": 4,
		"99Numpad3": 5,
		"114F3": 5,
		"13NumpadEnter": 6,
		"110NumpadDecimal": 7,
		"37ArrowLeft": 8,
		"18AltLeft": 9,
		"103Numpad7": 10,
		"118F7": 10,
		"104Numpad8": 11,
		"119F8": 11,
		"101Numpad5": 12,
		"116F5": 12,
		"97Numpad1": 13,
		"112F1": 13,
		"98Numpad2": 14,
		"113F2": 14,
		"96Numpad0": 15,
		"121F10": 15,
		"46Delete": 16,
		"187BracketRight": 17,
		"171BracketRight": 17,
		"221BracketRight": 17,
		"13Enter": 18,
		"191Backslash": 19,
		"163Backslash": 19,
		"220Backslash": 19,
		"100Numpad4": 20,
		"115F4": 20,
		"16ShiftLeft": 21,
		"16ShiftRight": 21,
		"220Backquote": 22,
		"160Backquote": 22,
		"192Backquote": 22,
		"17ControlLeft": 23,
		"17ControlRight": 23,
		"221Equal": 24,
		"192Equal": 24,
		"187Equal": 24,
		"219Minus": 25,
		"63Minus": 25,
		"189Minus": 25,
		"186BracketLeft": 26,
		"59BracketLeft": 26,
		"219BracketLeft": 26,
		"80KeyP": 27,
		"222Quote": 28,
		"192Quote": 28,
		"192Semicolon": 29,
		"186Semicolon": 29,
		"189Slash": 30,
		"173Slash": 30,
		"191Slash": 30,
		"190Period": 31,
		"48Digit0": 32,
		"57Digit9": 33,
		"79KeyO": 34,
		"73KeyI": 35,
		"76KeyL": 36,
		"75KeyK": 37,
		"77KeyM": 38,
		"188Comma": 39,
		"56Digit8": 40,
		"55Digit7": 41,
		"85KeyU": 42,
		"90KeyY": 43,
		"89KeyY": 43,
		"72KeyH": 44,
		"74KeyJ": 45,
		"78KeyN": 46,
		"32Space": 47,
		"54Digit6": 48,
		"53Digit5": 49,
		"82KeyR": 50,
		"84KeyT": 51,
		"71KeyG": 52,
		"70KeyF": 53,
		"66KeyB": 54,
		"86KeyV": 55,
		"52Digit4": 56,
		"51Digit3": 57,
		"69KeyE": 58,
		"87KeyW": 59,
		"83KeyS": 60,
		"68KeyD": 61,
		"67KeyC": 62,
		"88KeyX": 63,
		"49Digit1": 64,
		"50Digit2": 65,
		"27Escape": 66,
		"81KeyQ": 67,
		"9Tab": 68,
		"65KeyA": 69,
		"20CapsLock": 70,
		"89KeyZ": 71,
		"90KeyZ": 71,
		"38Numpad8": 72,
		"40Numpad2": 73,
		"37Numpad4": 74,
		"39Numpad6": 75,
		"12Numpad5": 76,
		"45Numpad0": 76,
		"46NumpadDecimal": 77,
		"8Backspace": 79,
		"36Numpad7": 80,
		"33Numpad9": 81,
		"35Numpad1": 82,
		"34Numpad3": 83,
		"226IntlBackslash": 85,
		"60IntlBackslash": 85,
		"220IntlBackslash": 85,
		"111NumpadDivide": 86,
		"106NumpadMultiply": 87,
		"109NumpadSubtract": 88,
		"107NumpadAdd": 89
	};

	private static mSpecialKeys: {[k in string]: string} = {
		Alt: String.fromCharCode(224), // Copy

		ArrowUp: String.fromCharCode(240),
		ArrowDown: String.fromCharCode(241),
		ArrowLeft: String.fromCharCode(242),
		ArrowRight: String.fromCharCode(243),

		ArrowUpShift: String.fromCharCode(244),
		ArrowDownShift: String.fromCharCode(245),
		ArrowLeftShift: String.fromCharCode(246),
		ArrowRightShift: String.fromCharCode(247),

		ArrowUpCtrl: String.fromCharCode(248),
		ArrowDownCtrl: String.fromCharCode(249),
		ArrowLeftCtrl: String.fromCharCode(250),
		ArrowRightCtrl: String.fromCharCode(251),

		Backspace: String.fromCharCode(127),
		Delete: String.fromCharCode(16),
		Enter: "\r",
		JoyUp: String.fromCharCode(11),
		JoyDown: String.fromCharCode(10),
		JoyLeft: String.fromCharCode(8),
		JoyRight: String.fromCharCode(9),
		Clear: "X", // joy fire 2
		Spacebar: " ", // for IE
		Tab: String.fromCharCode(9),
		ä: ";",
		Ä: "+",
		ö: ":",
		Ö: "*",
		ü: "@",
		Ü: "|",
		ß: "-",
		DeadBackquote: "^",
		"°": "£",
		DeadEqual: String.fromCharCode(161), // tick
		"´": String.fromCharCode(161), // IE: tick
		DeadEqualShift: "`" // backtick
	};

	/* eslint-disable array-element-newline */
	private static aJoyKeyCodes = [
		[72, 73, 74, 75, 76, 77],
		[48, 49, 50, 51, 52, 53]
	];
	/* eslint-enable array-element-newline */


	constructor(options: KeyboardOptions) {
		this.options = Object.assign({}, options);

		this.fnOnKeyDown = this.options.fnOnKeyDown;
		this.oKey2CpcKey = Keyboard.mKey2CpcKey;

		this.aKeyBuffer = []; // buffered pressed keys

		this.aExpansionTokens = []; // expansion tokens 0..31 (in reality: 128..159)

		this.oCpcKeyExpansions = {
			normal: {},
			shift: {},
			ctrl: {},
			repeat: {}
		}; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat

		this.bActive = false; // flag if keyboard is active/focused, set from outside

		this.bCodeStringsRemoved = false;

		const cpcArea = View.getElementById1("cpcArea");

		cpcArea.addEventListener("keydown", this.onCpcAreaKeydown.bind(this), false);
		cpcArea.addEventListener("keyup", this.oncpcAreaKeyup.bind(this), false);

		// reset
		this.oPressedKeys = {}; // currently pressed browser keys
		this.bShiftLock = false; // for virtual keyboard
		this.bNumLock = false;
	}

	reset(): void {
		this.fnOnKeyDown = undefined;
		this.clearInput();
		this.oPressedKeys = {}; // currently pressed browser keys
		this.bShiftLock = false; // for virtual keyboard
		this.bNumLock = false;
		this.resetExpansionTokens();
		this.resetCpcKeysExpansions();
	}

	clearInput(): void {
		this.aKeyBuffer.length = 0;
	}

	resetExpansionTokens(): void {
		const aExpansionTokens = this.aExpansionTokens;

		for (let i = 0; i <= 9; i += 1) {
			aExpansionTokens[i] = String(i);
		}
		aExpansionTokens[10] = ".";
		aExpansionTokens[11] = "\r";
		aExpansionTokens[12] = 'RUN"\r';
		for (let i = 13; i <= 31; i += 1) {
			aExpansionTokens[i] = "0"; //TTT was 0
		}
	}

	resetCpcKeysExpansions(): void {
		const oCpcKeyExpansions = this.oCpcKeyExpansions;

		oCpcKeyExpansions.normal = { // cpcKey => ExpansionToken (128-159)
			15: 0 + 128, // F0
			13: 1 + 128, // F1
			14: 2 + 128, // F2
			5: 3 + 128, // F3
			20: 4 + 128, // F4
			12: 5 + 128, // F5
			4: 6 + 128, // F6
			10: 7 + 128, // F7
			11: 8 + 128, // F8
			3: 9 + 128, // F9
			7: 10 + 128, // F.
			6: 11 + 128 // Enter
		};

		oCpcKeyExpansions.shift = {};

		oCpcKeyExpansions.ctrl = {
			6: 12 + 128 // ctrl+Enter
		};

		oCpcKeyExpansions.repeat = {};
	}

	getKeyDownHandler(): (() => void) | undefined {
		return this.fnOnKeyDown;
	}

	setKeyDownHandler(fnOnKeyDown?: () => void): void {
		this.fnOnKeyDown = fnOnKeyDown;
	}

	setActive(bActive: boolean): void {
		this.bActive = bActive;
	}

	private removeCodeStringsFromKeymap() { // for certain browsers (IE, Edge) we get only codes but no code strings from the keyboard, so remove the code strings
		const oKey2CpcKey = this.oKey2CpcKey,
			oNewMap: Key2CpcKeyType = {};

		if (Utils.debug > 1) {
			Utils.console.log("removeCodeStringsFromKeymap: Unfortunately not all keys can be used.");
		}
		for (const sKey in oKey2CpcKey) {
			if (oKey2CpcKey.hasOwnProperty(sKey)) {
				const iKey = parseInt(sKey, 10); // get just the number

				oNewMap[iKey] = oKey2CpcKey[sKey];
			}
		}
		this.oKey2CpcKey = oNewMap;
	}

	fnPressCpcKey(iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean): void { // eslint-disable-line complexity
		const oPressedKeys = this.oPressedKeys,
			oCpcKeyExpansions = this.oCpcKeyExpansions,
			mSpecialKeys = Keyboard.mSpecialKeys,
			sCpcKey = String(iCpcKey);

		let	oCpcKey = oPressedKeys[sCpcKey];

		if (!oCpcKey) {
			oPressedKeys[sCpcKey] = {
				oKeys: {},
				shift: false,
				ctrl: false
			};
			oCpcKey = oPressedKeys[sCpcKey];
		}
		const bKeyAlreadyPressed = oCpcKey.oKeys[sPressedKey];

		oCpcKey.oKeys[sPressedKey] = true;
		oCpcKey.shift = bShiftKey;
		oCpcKey.ctrl = bCtrlKey;
		if (Utils.debug > 1) {
			Utils.console.log("fnPressCpcKey: sPressedKey=" + sPressedKey + ", sKey=" + sKey + ", affected cpc key=" + sCpcKey);
		}

		const oRepeat = oCpcKeyExpansions.repeat;

		if (bKeyAlreadyPressed && ((sCpcKey in oRepeat) && !oRepeat[sCpcKey])) {
			sKey = ""; // repeat off => ignore key
		} else {
			let oExpansions: KeyExpansionsType;

			if (bCtrlKey) {
				oExpansions = oCpcKeyExpansions.ctrl;
			} else if (bShiftKey) {
				oExpansions = oCpcKeyExpansions.shift;
			} else {
				oExpansions = oCpcKeyExpansions.normal;
			}

			if (sCpcKey in oExpansions) {
				const iExpKey = oExpansions[sCpcKey];

				if (iExpKey >= 128 && iExpKey <= 159) {
					sKey = this.aExpansionTokens[iExpKey - 128];
					for (let i = 0; i < sKey.length; i += 1) {
						this.putKeyInBuffer(sKey.charAt(i));
					}
				} else { // ascii code
					sKey = String.fromCharCode(iExpKey);
					this.putKeyInBuffer(sKey.charAt(0));
				}
				sKey = ""; // already done, ignore sKey form keyboard
			}
		}

		const sShiftCtrlKey = sKey + (bShiftKey ? "Shift" : "") + (bCtrlKey ? "Ctrl" : "");

		if (sShiftCtrlKey in mSpecialKeys) {
			sKey = mSpecialKeys[sShiftCtrlKey];
		} else if (sKey in mSpecialKeys) {
			sKey = mSpecialKeys[sKey];
		} else if (bCtrlKey) {
			if (sKey >= "a" && sKey <= "z") { // map keys with ctrl to control codes (problem: some control codes are browser functions, e.g. w: close window)
				sKey = String.fromCharCode(sKey.charCodeAt(0) - 96); // ctrl+a => \x01
			}
		}
		if (sKey.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
			this.putKeyInBuffer(sKey);
		}

		if (iCpcKey === 66 && this.options.fnOnEscapeHandler) {	// or: sKey === "Escape" or "Esc" (on IE)
			this.options.fnOnEscapeHandler(sKey, sPressedKey);
		}

		if (this.fnOnKeyDown) { // special handler?
			this.fnOnKeyDown();
		}
	}

	fnReleaseCpcKey(iCpcKey: number, sPressedKey: string, sKey: string, bShiftKey: boolean, bCtrlKey: boolean): void {
		const oPressedKeys = this.oPressedKeys,
			oCpcKey = oPressedKeys[iCpcKey];

		if (Utils.debug > 1) {
			Utils.console.log("fnReleaseCpcKey: sPressedKey=" + sPressedKey + ", sKey=" + sKey + ", affected cpc key=" + iCpcKey + ", oKeys:", (oCpcKey ? oCpcKey.oKeys : "undef."));
		}
		if (!oCpcKey) {
			Utils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", iCpcKey);
		} else {
			delete oCpcKey.oKeys[sPressedKey];
			if (!Object.keys(oCpcKey.oKeys).length) {
				delete oPressedKeys[iCpcKey];
			} else {
				oCpcKey.shift = bShiftKey;
				oCpcKey.ctrl = bCtrlKey;
			}
		}
	}

	private static keyIdentifier2Char(event: KeyboardEvent) {
		// SliTaz web browser has not key but keyIdentifier
		const sIdentifier = (event as any).keyIdentifier,
			bShiftKey = event.shiftKey;
		let sChar = "";

		if ((/^U\+/i).test(sIdentifier || "")) { // unicode string?
			sChar = String.fromCharCode(parseInt(sIdentifier.substr(2), 16));
			if (sChar === "\0") { // ignore
				sChar = "";
			}
			sChar = bShiftKey ? sChar.toUpperCase() : sChar.toLowerCase(); // do we get keys in sUnicode always in uppercase?
		} else {
			sChar = sIdentifier; // take it, could be "Enter"
		}
		return sChar;
	}

	private fnKeyboardKeydown(event: KeyboardEvent) { // eslint-disable-line complexity
		const iKeyCode = event.which || event.keyCode,
			sPressedKey = String(iKeyCode) + (event.code ? event.code : ""); // event.code available for e.g. Chrome, Firefox
		let sKey = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier

		if (!event.code && !this.bCodeStringsRemoved) { // event.code not available on e.g. IE, Edge
			this.removeCodeStringsFromKeymap(); // remove code information from the mapping. Not all keys can be detected any more
			this.bCodeStringsRemoved = true;
		}

		if (Utils.debug > 1) {
			Utils.console.log("fnKeyboardKeydown: keyCode=" + iKeyCode + " pressedKey=" + sPressedKey + " key='" + sKey + "' " + sKey.charCodeAt(0) + " loc=" + event.location + " ", event);
		}

		if (sPressedKey in this.oKey2CpcKey) {
			let iCpcKey = this.oKey2CpcKey[sPressedKey];

			if (iCpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
				iCpcKey = 22;
			}

			// map numpad cursor to joystick
			if (iCpcKey === 72) {
				sKey = "JoyUp";
			} else if (iCpcKey === 73) {
				sKey = "JoyDown";
			} else if (iCpcKey === 74) {
				sKey = "JoyLeft";
			} else if (iCpcKey === 75) {
				sKey = "JoyRight";
			} else if (sKey === "Dead") { // Chrome, FF
				sKey += event.code + (event.shiftKey ? "Shift" : ""); // special handling => "DeadBackquote" or "DeadEqual"; and "Shift"
			} else if (sKey === "Unidentified") { // IE, Edge
				if (iKeyCode === 220) {
					sKey = event.shiftKey ? "°" : "DeadBackquote";
				} else if (iKeyCode === 221) {
					sKey = "DeadEqual" + (event.shiftKey ? "Shift" : "");
				} else if (iKeyCode === 226) { // "|"
					sKey = "|";
				}
			} else if (sKey.length === 2) {
				if (sKey.charAt(0) === "^" || sKey.charAt(0) === "´" || sKey.charAt(0) === "`") { // IE, Edge? prefix key
					sKey = sKey.substr(1); // remove prefix
				}
			}
			this.fnPressCpcKey(iCpcKey, sPressedKey, sKey, event.shiftKey, event.ctrlKey);
		} else if (sKey.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
			this.putKeyInBuffer(sKey);
			Utils.console.log("fnKeyboardKeydown: Partly unhandled key", sPressedKey + ":", sKey);
		} else {
			Utils.console.log("fnKeyboardKeydown: Unhandled key", sPressedKey + ":", sKey);
		}
	}

	private fnKeyboardKeyup(event: KeyboardEvent) {
		const iKeyCode = event.which || event.keyCode,
			sPressedKey = String(iKeyCode) + (event.code ? event.code : ""), // event.code available for e.g. Chrome, Firefox
			sKey = event.key || Keyboard.keyIdentifier2Char(event) || ""; // SliTaz web browser has not key but keyIdentifier

		if (Utils.debug > 1) {
			Utils.console.log("fnKeyboardKeyup: keyCode=" + iKeyCode + " pressedKey=" + sPressedKey + " key='" + sKey + "' " + sKey.charCodeAt(0) + " loc=" + event.location + " ", event);
		}

		if (sPressedKey in this.oKey2CpcKey) {
			let iCpcKey = this.oKey2CpcKey[sPressedKey];

			if (iCpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
				iCpcKey = 22;
			}
			this.fnReleaseCpcKey(iCpcKey, sPressedKey, sKey, event.shiftKey, event.ctrlKey);
		} else {
			Utils.console.log("fnKeyboardKeyup: Unhandled key", sPressedKey + ":", sKey);
		}
	}

	getKeyFromBuffer(): string {
		const aKeyBuffer = this.aKeyBuffer,
			sKey = aKeyBuffer.length ? aKeyBuffer.shift() as string : "";

		return sKey;
	}

	putKeyInBuffer(sKey: string): void {
		this.aKeyBuffer.push(sKey);
	}

	putKeysInBuffer(sInput: string): void {
		for (let i = 0; i < sInput.length; i += 1) {
			const sKey = sInput.charAt(i);

			this.aKeyBuffer.push(sKey);
		}
	}

	getKeyState(iCpcKey: number): number {
		const oPressedKeys = this.oPressedKeys;
		let	iState = -1;

		if (iCpcKey in oPressedKeys) {
			const oCpcKey = oPressedKeys[iCpcKey];

			iState = 0 + (oCpcKey.shift ? 32 : 0) + (oCpcKey.ctrl ? 128 : 0);
		}
		return iState;
	}

	getJoyState(iJoy: number): number {
		const aJoy = Keyboard.aJoyKeyCodes[iJoy];
		let iValue = 0;

		/* eslint-disable no-bitwise */
		for (let i = 0; i < aJoy.length; i += 1) {
			if (this.getKeyState(aJoy[i]) !== -1) {
				iValue |= (1 << i);
			}
		}

		// check additional special codes for joy 0 (not available on CPC)
		if (iJoy === 0) {
			if (this.getKeyState(80) !== -1) { // up left
				iValue |= 1 + 4;
			}
			if (this.getKeyState(81) !== -1) { // up right
				iValue |= 1 + 8;
			}
			if (this.getKeyState(82) !== -1) { // down left
				iValue |= 2 + 4;
			}
			if (this.getKeyState(83) !== -1) { // down right
				iValue |= 2 + 8;
			}
		}
		/* eslint-enable no-bitwise */

		return iValue;
	}

	setExpansionToken(iToken: number, sString: string): void {
		this.aExpansionTokens[iToken] = sString;
	}

	setCpcKeyExpansion(oOptions: CpcKeyExpansionsOptions): void {
		const oCpcKeyExpansions = this.oCpcKeyExpansions,
			iCpcKey = oOptions.iCpcKey;

		oCpcKeyExpansions.repeat[iCpcKey] = oOptions.iRepeat;

		if (oOptions.iNormal !== undefined) {
			oCpcKeyExpansions.normal[iCpcKey] = oOptions.iNormal;
		}
		if (oOptions.iShift !== undefined) {
			oCpcKeyExpansions.shift[iCpcKey] = oOptions.iShift;
		}
		if (oOptions.iCtrl !== undefined) {
			oCpcKeyExpansions.ctrl[iCpcKey] = oOptions.iCtrl;
		}
	}

	private onCpcAreaKeydown(event: KeyboardEvent) {
		if (this.bActive) {
			this.fnKeyboardKeydown(event);
			event.preventDefault();
			return false;
		}
		return undefined;
	}

	private oncpcAreaKeyup(event: KeyboardEvent) {
		if (this.bActive) {
			this.fnKeyboardKeyup(event);
			event.preventDefault();
			return false;
		}
		return undefined;
	}
}
