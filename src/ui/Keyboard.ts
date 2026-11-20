// Keyboard.ts - Keyboard handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import type { CpcKeyExpansionsOptions, IKeyboard } from "../Interfaces";
import { ViewID } from "./UiConstants";
import { UiUtils } from "./UiUtils";
import { View } from "./View";

interface KeyboardOptions {
	view: View,
	fnOnEscapeHandler?: (key: string, pressedKey: string) => void
	fnOnKeyDown?: () => void
}

export type PressReleaseCpcKey = (event: KeyboardEvent | PointerEvent, cpcKey: number, pressedKey: string, key: string) => void;

type KeyExpansionsType = Record<string, number>; // numbers as keys are stored as string anyway, so use string

type KeyExpansionsRepeatType = Record<string, number>; // numbers as keys are stored as string anyway, so use string

type Key2CpcKeyType = Record<string, number>;

type PressedBrowseKeysType = Record<string, {shift: boolean, ctrl: boolean}>;

type PressedKeysType = Record<string, {keys: PressedBrowseKeysType, shift: boolean, ctrl: boolean}>;
interface CpcKeyExpansions {
	normal: KeyExpansionsType
	shift: KeyExpansionsType
	ctrl: KeyExpansionsType
	repeat: KeyExpansionsRepeatType
}

export class Keyboard implements IKeyboard {
	private readonly fnKeydownOrKeyupHandler: EventListener;

	private readonly options: KeyboardOptions;

	private readonly keyBuffer: string[] = []; // buffered pressed keys
	private readonly expansionTokens: string[] = []; // strings for expansion tokens 0..31 (in reality: 128..159)
	private readonly cpcKeyExpansions: CpcKeyExpansions; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat

	private active = false; // flag if keyboard is active/focused, set from outside

	private readonly key2CpcKey: Key2CpcKeyType;

	private pressedKeys: PressedKeysType = {}; // currently pressed browser keys

	private simulatedNumLock?: boolean; // simulated num lock for Mac OS

	constructor(options: KeyboardOptions) {
		this.fnKeydownOrKeyupHandler = (event) => this.onKeydownOrKeyup(event as KeyboardEvent);

		this.options = {} as KeyboardOptions;
		this.setOptions(options);

		this.key2CpcKey = Keyboard.key2CpcKey;

		this.cpcKeyExpansions = {
			normal: {},
			shift: {},
			ctrl: {},
			repeat: {}
		}; // cpc keys to expansion tokens for normal, shift, ctrl; also repeat

		const view = this.options.view;

		view.addEventListenerById("keydown", this.fnKeydownOrKeyupHandler, ViewID.cpcArea);
		view.addEventListenerById("keyup", this.fnKeydownOrKeyupHandler, ViewID.cpcArea);
	}

	getOptions(): KeyboardOptions {
		return this.options;
	}

	setOptions(options: Partial<KeyboardOptions>): void {
		Object.assign(this.options, options);
	}

	private static readonly key2CpcKey = {
		"ArrowUp": 0,
		"ArrowRight": 1,
		"ArrowDown": 2,
		"Numpad9": 3,
		"F9": 3,
		"Numpad6": 4,
		"F6": 4,
		"Numpad3": 5,
		"F3": 5,
		"NumpadEnter": 6,
		"NumpadDecimal": 7,
		"ArrowLeft": 8,
		"AltLeft": 9,
		"Numpad7": 10,
		"F7": 10,
		"Numpad8": 11,
		"F8": 11,
		"Numpad5": 12,
		"F5": 12,
		"Numpad1": 13,
		"F1": 13,
		"Numpad2": 14,
		"F2": 14,
		"Numpad0": 15,
		"F10": 15,
		"Delete": 16,
		"BracketRight": 17,
		"Enter": 18,
		"Backslash": 19,
		"Numpad4": 20,
		"F4": 20,
		"ShiftLeft": 21,
		"ShiftRight": 21,
		"Backquote": 22,
		"ControlLeft": 23,
		"ControlRight": 23,
		"Equal": 24,
		"Minus": 25,
		"BracketLeft": 26,
		"KeyP": 27,
		"Quote": 28,
		"Semicolon": 29,
		"Slash": 30,
		"Period": 31,
		"Digit0": 32,
		"Digit9": 33,
		"KeyO": 34,
		"KeyI": 35,
		"KeyL": 36,
		"KeyK": 37,
		"KeyM": 38,
		"Comma": 39,
		"Digit8": 40,
		"Digit7": 41,
		"KeyU": 42,
		"KeyY": 43,
		"KeyH": 44,
		"KeyJ": 45,
		"KeyN": 46,
		"Space": 47,
		"Digit6": 48,
		"Digit5": 49,
		"KeyR": 50,
		"KeyT": 51,
		"KeyG": 52,
		"KeyF": 53,
		"KeyB": 54,
		"KeyV": 55,
		"Digit4": 56,
		"Digit3": 57,
		"KeyE": 58,
		"KeyW": 59,
		"KeyS": 60,
		"KeyD": 61,
		"KeyC": 62,
		"KeyX": 63,
		"Digit1": 64,
		"Digit2": 65,
		"Escape": 66,
		"KeyQ": 67,
		"Tab": 68,
		"KeyA": 69,
		"CapsLock": 70,
		"KeyZ": 71,
		"Backspace": 79,
		"IntlBackslash": 85,
		"NumpadDivide": 86,
		"NumpadMultiply": 87,
		"NumpadSubtract": 88,
		"NumpadAdd": 89
	};

	private static readonly specialKeys: Record<string, string> = {
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
		"´": String.fromCharCode(161),
		DeadEqualShift: "`" // backtick
	};

	/* eslint-disable array-element-newline */
	private static readonly joyKeyCodes = [
		[72, 73, 74, 75, 76, 77],
		[48, 49, 50, 51, 52, 53]
	];
	/* eslint-enable array-element-newline */

	public reset(): void {
		this.options.fnOnKeyDown = undefined;
		this.clearInput();
		this.pressedKeys = {}; // currently pressed browser keys
		this.resetExpansionTokens();
		this.resetCpcKeysExpansions();
	}

	public clearInput(): void {
		this.keyBuffer.length = 0;
	}

	public resetExpansionTokens(): void {
		const expansionTokens = this.expansionTokens;

		for (let i = 0; i <= 9; i += 1) {
			expansionTokens[i] = String(i);
		}
		expansionTokens[10] = ".";
		expansionTokens[11] = "\r";
		expansionTokens[12] = 'RUN"\r';
		for (let i = 13; i <= 31; i += 1) {
			expansionTokens[i] = "0";
		}
	}

	public resetCpcKeysExpansions(): void {
		const cpcKeyExpansions = this.cpcKeyExpansions;

		cpcKeyExpansions.normal = { // cpcKey => ExpansionToken (128-159)
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

		cpcKeyExpansions.shift = {};

		cpcKeyExpansions.ctrl = {
			6: 12 + 128 // ctrl+Enter
		};

		cpcKeyExpansions.repeat = {};
	}

	setActive(active: boolean): void {
		this.active = active;
	}

	fnPressCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void { // eslint-disable-line complexity
		const shiftKey = event.shiftKey,
			ctrlKey = event.ctrlKey,
			cpcKeyExpansions = this.cpcKeyExpansions,
			specialKeys = Keyboard.specialKeys,
			cpcKey = String(cpcKeyCode);

		const keyAlreadyPressed = this.setCpcKeyState(cpcKeyCode, pressedKey, true, shiftKey, ctrlKey);

		if (UiUtils.debug > 1) {
			UiUtils.console.log("fnPressCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKey);
		}

		const repeat = cpcKeyExpansions.repeat;

		if (keyAlreadyPressed && ((cpcKey in repeat) && !repeat[cpcKey])) {
			key = ""; // repeat off => ignore key
		} else {
			let expansions: KeyExpansionsType;

			if (ctrlKey) {
				expansions = cpcKeyExpansions.ctrl;
			} else if (shiftKey) {
				expansions = cpcKeyExpansions.shift;
			} else {
				expansions = cpcKeyExpansions.normal;
			}

			if (cpcKey in expansions) {
				const expKey = expansions[cpcKey];

				if (expKey >= 128 && expKey <= 159) {
					key = this.expansionTokens[expKey - 128];
					for (let i = 0; i < key.length; i += 1) {
						this.putKeyInBuffer(key.charAt(i));
					}
				} else { // ascii code
					key = String.fromCharCode(expKey);
					this.putKeyInBuffer(key.charAt(0));
				}
				key = ""; // already done, ignore key form keyboard
			}
		}

		const shiftCtrlKey = key + (shiftKey ? "Shift" : "") + (ctrlKey ? "Ctrl" : "");

		if (shiftCtrlKey in specialKeys) {
			key = specialKeys[shiftCtrlKey];
		} else if (key in specialKeys) {
			key = specialKeys[key];
		} else if (ctrlKey) {
			if (key >= "a" && key <= "z") { // map keys with ctrl to control codes (problem: some control codes are browser functions, e.g. w: close window)
				key = String.fromCharCode(key.charCodeAt(0) - 96); // ctrl+a => \x01
			}
		}
		if (key.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
			this.putKeyInBuffer(key);
		}

		if (cpcKeyCode === 66 && this.options.fnOnEscapeHandler) {
			this.options.fnOnEscapeHandler(key, pressedKey);
		}

		if (this.options.fnOnKeyDown) { // special handler?
			this.options.fnOnKeyDown();
		}
	}

	setCpcKeyState(cpcKeyCode: number, pressedKey: string, isPressed: boolean, shiftKey = false, ctrlKey = false): boolean {
		const pressedKeys = this.pressedKeys,
			cpcKey = String(cpcKeyCode);
		let cpcKeyEntry = pressedKeys[cpcKey];
		const keyAlreadyPressed = Boolean(cpcKeyEntry && cpcKeyEntry.keys[pressedKey]);

		if (isPressed) {
			if (!cpcKeyEntry) {
				cpcKeyEntry = {
					keys: {},
					shift: false,
					ctrl: false
				};
				pressedKeys[cpcKey] = cpcKeyEntry;
			}
			cpcKeyEntry.keys[pressedKey] = {
				shift: shiftKey,
				ctrl: ctrlKey
			};
		} else if (cpcKeyEntry) {
			delete cpcKeyEntry.keys[pressedKey];
			if (!Object.keys(cpcKeyEntry.keys).length) {
				delete pressedKeys[cpcKey];
				return keyAlreadyPressed;
			}
		} else {
			return keyAlreadyPressed;
		}

		const keyStates = Object.values(cpcKeyEntry.keys);

		cpcKeyEntry.shift = keyStates.some((keyState) => keyState.shift);
		cpcKeyEntry.ctrl = keyStates.some((keyState) => keyState.ctrl);
		return keyAlreadyPressed;
	}

	fnReleaseCpcKey(event: KeyboardEvent | PointerEvent, cpcKeyCode: number, pressedKey: string, key: string): void {
		const cpcKey = this.pressedKeys[cpcKeyCode];

		if (UiUtils.debug > 1) {
			UiUtils.console.log("fnReleaseCpcKey: pressedKey=" + pressedKey + ", key=" + key + ", affected cpc key=" + cpcKeyCode + ", keys:", (cpcKey ? cpcKey.keys : "undef."));
		}
		if (!cpcKey) {
			UiUtils.console.warn("fnReleaseCpcKey: cpcKey was not pressed:", cpcKeyCode);
		} else {
			this.setCpcKeyState(cpcKeyCode, pressedKey, false, event.shiftKey, event.ctrlKey);
		}
	}

	private static readonly numPadOffKeyMap: Record<string, number> = {
		Numpad0: 76,
		Numpad1: 82,
		Numpad2: 73,
		Numpad3: 83,
		Numpad4: 74,
		Numpad5: 76,
		Numpad6: 75,
		Numpad7: 80,
		Numpad8: 72,
		Numpad9: 81,
		NumpadDecimal: 77
	};

	private fnKeyboardKeydown(event: KeyboardEvent) { // eslint-disable-line complexity
		const pressedKey = event.code;
		let key = event.key;

		if (UiUtils.debug > 1) {
			UiUtils.console.log("fnKeyboardKeydown: code=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
		}

		if (pressedKey in this.key2CpcKey) {
			const numPadOffKey = (this.simulatedNumLock === false || key.length > 1) ? Keyboard.numPadOffKeyMap[pressedKey] : undefined;
			let cpcKey = numPadOffKey ?? this.key2CpcKey[pressedKey];

			if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
				cpcKey = 22;
			}

			// map numpad cursor to joystick
			if (cpcKey === 72) {
				key = "JoyUp";
			} else if (cpcKey === 73) {
				key = "JoyDown";
			} else if (cpcKey === 74) {
				key = "JoyLeft";
			} else if (cpcKey === 75) {
				key = "JoyRight";
			} else if (key === "Dead") { // Chrome, FF
				key += event.code + (event.shiftKey ? "Shift" : ""); // special handling => "DeadBackquote" or "DeadEqual"; and "Shift"
			}
			this.fnPressCpcKey(event, cpcKey, pressedKey, key);
		} else if (key.length === 1) { // put normal keys in buffer, ignore special keys with more than 1 character
			this.putKeyInBuffer(key);
			UiUtils.console.log("fnKeyboardKeydown: Partly unhandled key", pressedKey + ":", key);
		} else if (pressedKey === "NumLock") { // key = "Clear"; MacOS
			this.simulatedNumLock = this.simulatedNumLock !== undefined ? !this.simulatedNumLock : false;
			if (UiUtils.debug > 1) {
				UiUtils.console.log("fnKeyboardKeydown: simulatedNumLock=" + this.simulatedNumLock);
			}
		} else {
			UiUtils.console.log("fnKeyboardKeydown: Unhandled key", pressedKey + ":", key);
		}
	}

	private fnKeyboardKeyup(event: KeyboardEvent) {
		const pressedKey = event.code,
			key = event.key;

		if (UiUtils.debug > 1) {
			UiUtils.console.log("fnKeyboardKeyup: code=" + pressedKey + " key='" + key + "' " + key.charCodeAt(0) + " loc=" + event.location + " ", event);
		}

		if (pressedKey in this.key2CpcKey) {
			const numPadOffKey = (this.simulatedNumLock === false || key.length > 1) ? Keyboard.numPadOffKeyMap[pressedKey] : undefined;
			let cpcKey = numPadOffKey ?? this.key2CpcKey[pressedKey];

			if (cpcKey === 85) { // map virtual cpc key 85 to 22 (english keyboard)
				cpcKey = 22;
			}
			this.fnReleaseCpcKey(event, cpcKey, pressedKey, key);
		} else if (pressedKey === "NumLock") { // key = "Clear"; MacOS
			if (UiUtils.debug > 1) {
				UiUtils.console.log("fnKeyboardKeyup: simulatedNumLock=" + this.simulatedNumLock);
			}
		} else {
			UiUtils.console.log("fnKeyboardKeyup: Unhandled key", pressedKey + ":", key);
		}
	}

	public getKeyFromBuffer(): string {
		const keyBuffer = this.keyBuffer,
			key = keyBuffer.length ? keyBuffer.shift() as string : "";

		return key;
	}

	public putKeyInBuffer(key: string, triggerOnKeyDown?: boolean): void {
		this.keyBuffer.push(key);

		if (triggerOnKeyDown) {
			const keyDownHandler = this.options.fnOnKeyDown;

			if (keyDownHandler) {
				keyDownHandler();
			}
		}
	}

	putKeysInBuffer(input: string): void {
		for (let i = 0; i < input.length; i += 1) {
			const key = input.charAt(i);

			this.keyBuffer.push(key);
		}
	}

	public getKeyState(cpcKeyCode: number): number {
		const pressedKeys = this.pressedKeys;
		let	state = -1;

		if (cpcKeyCode in pressedKeys) {
			const cpcKeyEntry = pressedKeys[cpcKeyCode];

			state = 0 + (cpcKeyEntry.shift ? 32 : 0) + (cpcKeyEntry.ctrl ? 128 : 0);
		}
		return state;
	}

	public getJoyState(joy: number): number {
		const joyKeyList = Keyboard.joyKeyCodes[joy];
		let value = 0;

		/* eslint-disable no-bitwise */
		for (let i = 0; i < joyKeyList.length; i += 1) {
			if (this.getKeyState(joyKeyList[i]) !== -1) {
				value |= (1 << i);
			}
		}

		// check additional special codes for joy 0 (not available on CPC)
		if (joy === 0) {
			if (this.getKeyState(80) !== -1) { // up left
				value |= 1 + 4;
			}
			if (this.getKeyState(81) !== -1) { // up right
				value |= 1 + 8;
			}
			if (this.getKeyState(82) !== -1) { // down left
				value |= 2 + 4;
			}
			if (this.getKeyState(83) !== -1) { // down right
				value |= 2 + 8;
			}
		}
		/* eslint-enable no-bitwise */

		return value;
	}

	public setExpansionToken(token: number, string: string): void {
		this.expansionTokens[token] = string;
	}

	public setCpcKeyExpansion(options: CpcKeyExpansionsOptions): void {
		const cpcKeyExpansions = this.cpcKeyExpansions,
			cpcKey = options.cpcKey;

		cpcKeyExpansions.repeat[cpcKey] = options.repeat;

		if (options.normal !== undefined) {
			cpcKeyExpansions.normal[cpcKey] = options.normal;
		}
		if (options.shift !== undefined) {
			cpcKeyExpansions.shift[cpcKey] = options.shift;
		}
		if (options.ctrl !== undefined) {
			cpcKeyExpansions.ctrl[cpcKey] = options.ctrl;
		}
	}

	private onKeydownOrKeyup(event: KeyboardEvent) {
		if (this.active) {
			if (event.type === "keydown") {
				this.fnKeyboardKeydown(event);
			} else if (event.type === "keyup") {
				this.fnKeyboardKeyup(event);
			} else {
				UiUtils.console.error("onKeydownOrKeyup: Unknown type:", event.type);
			}
			event.preventDefault();
			return false;
		}
		return undefined;
	}
}
