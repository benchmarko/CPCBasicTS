// Snapshot.ts - Snapshot
// (c) Marco Vieth, 2023
// https://benchmarko.github.io/CPCBasicTS/

// Snapshot definition
// https://www.cpcwiki.eu/index.php/Format:SNA_snapshot_file_format
// https://cpctech.cpcwiki.de/docs/snapshot.html

import { Utils } from "./Utils";


type SnapshotInfo = {
	ident: string,
	unused1: string,
	version: number,
	z80: {
		AF: number,
		BC: number,
		DE: number,
		HL: number,
		IR: number,
		IFF: number,
		IX: number,
		IY: number,
		SP: number,
		PC: number,
		M: number,
		AF2: number,
		BC2: number,
		DE2: number,
		HL2: number
	},
	ga: {
		inknum: number,
		inkval: number[],
		multi: number
	},
	ramconf: number
	crtc: {
		index: number,
		reg: number []
	},
	romnum: number,
	ppi: {
		portA: number,
		portB: number,
		portC: number,
		portCtl: number
	}
	psg: {
		index: number,
		reg: number []
	},
	memsize: number
};


export interface SnapshotOptions {
	name: string,
	data: string,
	quiet?: boolean
}

export class Snapshot {
	private readonly options: SnapshotOptions;

	private pos = 0;

	constructor(options: SnapshotOptions) {
		this.options = {
			quiet: false
		} as SnapshotOptions;
		this.setOptions(options);
	}

	getOptions(): SnapshotOptions {
		return this.options;
	}

	setOptions(options: Partial<SnapshotOptions>): void {
		Object.assign(this.options, options);
	}

	private composeError(error: Error, message: string, value: string, pos?: number) {
		const len = 0;

		return Utils.composeError("DiskImage", error, this.options.name + ": " + message, value, pos || 0, len);
	}

	static testSnapIdent(ident: string): boolean {
		return ident === "MV - SNA";
	}

	private readUInt8() {
		const num = this.options.data.charCodeAt(this.pos);

		if (isNaN(num)) {
			throw this.composeError(new Error(), "End of File", String(num), this.pos);
		}

		this.pos += 1;
		return num;
	}

	private readUInt16() {
		return this.readUInt8() + this.readUInt8() * 256;
	}

	private readUInt8Array(len: number) {
		const arr = [];

		for (let i = 0; i < len; i += 1) {
			arr.push(this.readUInt8());
		}
		return arr;
	}

	private readUtf(len: number) {
		const out = this.options.data.substring(this.pos, this.pos + len);

		if (out.length !== len) {
			throw this.composeError(new Error(), "End of File", "", this.pos);
		}

		this.pos += len;
		return out;
	}

	getSnapshotInfo(): SnapshotInfo {
		this.pos = 0;

		const info = {
			ident: this.readUtf(8),
			unused1: this.readUtf(8),
			version: this.readUInt8(),
			z80: {
				AF: this.readUInt16(),
				BC: this.readUInt16(),
				DE: this.readUInt16(),
				HL: this.readUInt16(),
				IR: this.readUInt16(),
				IFF: this.readUInt16(),
				IX: this.readUInt16(),
				IY: this.readUInt16(),
				SP: this.readUInt16(),
				PC: this.readUInt16(),
				M: this.readUInt8(),
				AF2: this.readUInt16(),
				BC2: this.readUInt16(),
				DE2: this.readUInt16(),
				HL2: this.readUInt16()
			},
			ga: {
				inknum: this.readUInt8(),
				inkval: this.readUInt8Array(17),
				multi: this.readUInt8()
			},
			ramconf: this.readUInt8(),
			crtc: {
				index: this.readUInt8(),
				reg: this.readUInt8Array(18)
			},
			romnum: this.readUInt8(),
			ppi: {
				portA: this.readUInt8(),
				portB: this.readUInt8(),
				portC: this.readUInt8(),
				portCtl: this.readUInt8()
			},
			psg: {
				index: this.readUInt8(),
				reg: this.readUInt8Array(16)
			},
			memsize: this.readUInt8()
		};

		return info;
	}

	getMemory(): string {
		return this.options.data.substring(0x100); // memory dump without snapshot header
	}


}
