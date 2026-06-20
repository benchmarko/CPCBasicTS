// Utils.ts - Utililities for CPCBasic
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

import type { CustomError } from "./Interfaces";
export class Utils {
	static debug = 0;
	static console = console; //typeof globalThis !== "undefined" ? globalThis.console : undefined;

	public static setDebug(debug: number) {
		Utils.debug = debug;
	}

	static hexEscape(str: string): string { // as hex
		return str.replace(/[\x00-\x1f]/g, function (char: string) { // eslint-disable-line no-control-regex
			return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
		});
	}

	static dateFormat(d: Date): string {
		return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " "
			+ ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
	}

	static stringCapitalize(str: string): string { // capitalize first letter
		return str.charAt(0).toUpperCase() + str.substring(1);
	}

	static numberWithCommas(x: number | string): string {
		// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
		const parts = String(x).split(".");

		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	static toRadians(deg: number): number {
		return deg * Math.PI / 180;
	}

	static toDegrees(rad: number): number {
		return rad * 180 / Math.PI;
	}

	static toPrecision9(num: number): string {
		const numStr = num.toPrecision(9), // some rounding, formatting
			[decimal, exponent] = numStr.split("e"), // eslint-disable-line array-element-newline
			result = String(Number(decimal)) + (exponent !== undefined ? ("E" + exponent.replace(/(\D)(\d)$/, "$10$2")) : "");

		// Number(): strip trailing decimal point and/or zeros (replace(/\.?0*$/, ""))
		// exponent 1 digit to 2 digits
		return result;
	}

	private static testIsSupported(testExpression: string) { // does the browser support something?
		try {
			Function(testExpression); // eslint-disable-line no-new-func
		} catch (_e) {
			return false;
		}
		return true;
	}

	static supportsBinaryLiterals = Utils.testIsSupported("0b01"); // does the browser support binary literals?

	static supportReservedNames = Utils.testIsSupported("({}).return()"); // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)

	static stringTrimEnd(str: string): string {
		return str.replace(/[\s\uFEFF\xA0]+$/, "");
	}

	static isCustomError(e: unknown): e is CustomError {
		return (e as CustomError).pos !== undefined;
	}

	static split2(str: string, char: string): string[] {
		const index = str.indexOf(char);

		return index >= 0 ? [str.slice(0, index), str.slice(index + 1)] : [str]; // eslint-disable-line array-element-newline
	}

	static string2Uint8Array(data: string): Uint8Array {
		const buf = new ArrayBuffer(data.length),
			view = new Uint8Array(buf);

		for (let i = 0; i < data.length; i += 1) {
			view[i] = data.charCodeAt(i);
		}
		return view;
	}

	static uint8Array2string(data: Uint8Array): string { //
		const callSize = 25000; // use call window to avoid "maximum call stack error" for e.g. size 336461
		let len = data.length,
			offset = 0,
			out = "";

		while (len) {
			const chunkLen = Math.min(len, callSize),
				chunk = data.slice ? data.slice(offset, offset + chunkLen) : data.subarray(offset, offset + chunkLen); // array.slice on Uint8Array not for IE11

			out += String.fromCharCode.apply(null, chunk); // on Chrome this is faster than single character processing
			offset += chunkLen;
			len -= chunkLen;
		}
		return out;
	}

	static composeError(name: string, errorObject: Error, message: string, value: string, pos?: number, len?: number, line?: string | number, hidden?: boolean): CustomError {
		const customError = errorObject as CustomError;

		customError.name = name;
		customError.message = message;
		customError.value = value;

		if (pos !== undefined) {
			customError.pos = pos;
		}
		if (len !== undefined) {
			customError.len = len;
		}
		// Safari: Some additional properties are already defined: line, column. Shall we use "cause" property now?
		if (line !== customError.line) {
			customError.line = line;
		}
		if (hidden !== undefined) {
			customError.hidden = hidden;
		}

		let errorLen = customError.len;

		if (errorLen === undefined && customError.value !== undefined) {
			errorLen = String(customError.value).length;
		}

		const endPos = (customError.pos || 0) + (errorLen || 0),
			lineMsg = (customError.line !== undefined ? " in " + customError.line : ""),
			posMsg = pos !== undefined ? (" at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos)) : "";

		customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
		customError.message += lineMsg + posMsg + ": " + customError.value;

		return customError;
	}

	static composeVmError(name: string, errorObject: Error, errCode: number, value: string): CustomError {
		const customError = Utils.composeError(name, errorObject, String(errCode), value);

		customError.errCode = errCode;
		return customError;
	}
}
