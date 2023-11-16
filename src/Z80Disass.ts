// Z80Disass.ts - Z80 Disassembler
// (c) Marco Vieth, 1995-2023
// based on Cpcemu: DISASS.CPP, CPCDIS.C
//
// https://benchmarko.github.io/CPCBasicTS/
//

// check also:
// http://www.z80.info/z80undoc.htm
//

interface Z80DisassOptions {
	data: Uint8Array,
	addr: number,
	format?: number
}

/* eslint-disable no-bitwise */
export class Z80Disass {
	private readonly options: Z80DisassOptions;

	private static readonly hexMark = "&"; // hex-marker, "&" or "#" or ""

	private dissOp = 0;	// actual op-code

	private prefix = 0;	// actual prefix: 0=none, 1=0xDD, 2=0xFD, 4=0xED

	constructor(options: Z80DisassOptions) {
		this.options = {
			format: 7
		} as Z80DisassOptions;
		this.setOptions(options);
	}

	getOptions(): Z80DisassOptions {
		return this.options;
	}

	setOptions(options: Partial<Z80DisassOptions>): void {
		Object.assign(this.options, options);
	}

	private readByte(i: number) {
		const data = this.options.data;

		return data[i] | 0;
	}

	private readWord(i: number) {
		const data = this.options.data;

		return data[i] | ((data[i + 1]) << 8);
	}


	private bget() {
		const by = this.readByte(this.options.addr);

		this.options.addr += 1;
		return by;
	}


	// byte-out: returns byte xx at PC; PC++
	private bout() {
		const by = this.bget();

		return Z80Disass.hexMark + by.toString(16).toUpperCase().padStart(2, "0");
	}

	// word-out: returns word xxyy from PC, PC+=2
	private wout() {
		const wo = this.readWord(this.options.addr);

		this.options.addr += 2;
		return Z80Disass.hexMark + wo.toString(16).toUpperCase().padStart(4, "0");
	}

	// relative-address-out : gets it from PC and returns PC+(signed)tt ; PC++
	private radrout() {	// relative-address-out tt
		let dis = this.bget();	// displacement, signed! (0= next instruction)

		dis = dis << 24 >> 24; // convert to signed
		// https://stackoverflow.com/questions/56577958/how-to-convert-one-byte-8-bit-to-signed-integer-in-javascript

		let addr = this.options.addr + dis;

		if (addr < 0) {
			addr += 65536;
		}
		return Z80Disass.hexMark + addr.toString(16).toUpperCase().padStart(4, "0");
	}

	/* eslint-disable array-element-newline */
	public static readonly bregtab = [ // byte-register-table
		["B", "C", "D", "E", "H", "L", "(HL)", "A"],
		["B", "C", "D", "E", "HX", "LX", "(IX+", "A"], // DD-Prefix
		["B", "C", "D", "E", "HY", "LY", "(IY+", "A"] // FD-Prefix
	];
	/* eslint-enable array-element-newline */

	// byte-register-out : returns string to an 8-bit register
	// handles prefix, special op-codes with IX,IY and h,l
	private bregout(nr: number) {
		const dissOp = this.dissOp;

		nr &= 0x07; // only 3 bit

		let prefix = this.prefix;

		// special cases of op-codes with h,l and (ix) or (iy)
		if (prefix === 4 || (this.prefix === 1 || this.prefix === 2) && (dissOp === 0x66 || dissOp === 0x6e || dissOp === 0x74 || dissOp === 0x75) && (nr !== 6)) {
			prefix = 0;
		}

		return Z80Disass.bregtab[prefix][nr] + (prefix && (nr === 6) ? this.bout() + ")" : ""); // only 3 bit
	}

	/* eslint-disable array-element-newline */
	public static readonly wregtab = [ // byte-register-table
		["BC", "DE", "HL", "SP"],
		["BC", "DE", "IX", "SP"], // DD-Prefix
		["BC", "DE", "IY", "SP"] // FD-Prefix
	];
	/* eslint-enable array-element-newline */

	// word-register-out : returns string to a 16-bit-register
	// handles prefix
	private wregout(nr: number) {
		const prefix = (this.prefix === 1 || this.prefix === 2) ? this.prefix : 0;

		return Z80Disass.wregtab[prefix][nr & 0x03]; // only 2 bit
	}

	// push-pop-register-out: like wregout, only SP substituted by AF
	private pupoRegout(nr: number) { // eslint-disable-line class-methods-use-this
		nr &= 0x03; // only 2 bit
		if (nr === 3) {
			return "AF"; // replace SP by AF
		}
		return this.wregout(nr);
	}

	private onlyPrefix() {
		let out = "";

		if (this.prefix === 1) {
			out = "[DD]-prefix";
		} else if (this.prefix === 2) {	// prefix == 2
			out = "[FD]-prefix";
		} else { // prefix === 4
			out = "[ED]-prefix";
		}
		this.options.addr -= 1;
		return out;
	}

	private static readonly unknownOp = "unknown";


	//
	// Disassemble CB
	//

	private static readonly rlcTable = ["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLS*", "SRL"]; // eslint-disable-line array-element-newline

	private static readonly bitResSetTable = ["BIT", "RES", "SET"]; // eslint-disable-line array-element-newline

	private operdisCB() {
		// rlc,rrc,rl,rr,sla,sra,sls*,srl rrr [rrr=b,c,d,e,h,l,(hl),a]
		// bit bbb,rrr; res bbb,rrr; set bbb,rrr [rrr=b,c,d,e,h,l,(hl),a]

		let out = "",
			newop; // new op

		if (this.prefix === 1 || this.prefix === 2) { // ix/iy-flag (ix or iy !)
			newop = ((this.readByte(this.options.addr + 1) & 0xfe) | 0x06); // transform code x0..x7=>x6 , x8..xf=>xe  (always ix.., iy.. )
		} else {
			newop = this.readByte(this.options.addr);
		}

		const b6b7 = newop >> 6, // test b6,7
			b3b4b5 = (newop >> 3) & 0x07;

		if (b6b7 === 0) { // 00-3f (rlc,rrc,rl,rr,sla,sra,sls*,srl rrr)
			out = Z80Disass.rlcTable[b3b4b5] + " " + this.bregout(newop); // b3b4b5
		} else { // 40-7f: bit bbb,rrr; 80-bf: res bbb,rrr; c0-ff: set bbb,rrr
			out = Z80Disass.bitResSetTable[b6b7 - 1] + " " + b3b4b5 + "," + this.bregout(newop);
		}

		if (this.prefix === 1 || this.prefix === 2) { // ix/iy-flag (ix or iy !)
			if ((newop !== this.readByte(this.options.addr)) && ((newop >> 6) !== 0x01)) {	// there was a transform; not bit-instruction
				const premem = this.prefix;	// memorize prefix

				this.prefix = 0; // only h or l
				out += " & LD " + this.bregout(this.readByte(this.options.addr));
				this.prefix = premem; // old prefix
			}
		}
		this.options.addr += 1;
		return out;
	}


	//
	// Disassemble ED
	//

	private static readonly ldIaTable = ["LD I,A", "LD R,A", "LD A,I", "LD A,R", "RRD", "RLD", Z80Disass.unknownOp, Z80Disass.unknownOp]; // eslint-disable-line array-element-newline

	private operdisEDpart40To7F(dissOp: number) { // eslint-disable-line complexity
		let out = "";

		switch (dissOp & 0x07) { // test b0,b1,b2
		case 0: // in rrr,(c),
			if (dissOp === 0x70) {
				out = "*IN X,(C)"; // 70
			} else {
				out = "IN " + this.bregout(dissOp >> 3) + ",(C)";
			}
			break;
		case 1: // out (c),rrr, *out (c),0
			if (dissOp === 0x71) {
				out = "*OUT (C),0"; // 71
			} else {
				out = "OUT (C)," + this.bregout(dissOp >> 3);
			}
			break;
		case 2: // sbc hl,dd; add hl,dd [dd=bc,de,hl,sp]; not ix,iy!
			out = (dissOp & 0x08 ? "ADC" : "SBC") + " HL," + this.wregout(dissOp >> 4); // b3=1: adc, otherwise sbc
			break;
		case 3: // ld (xxyy),dd! [dd=bc,de,hl,sp]
			if (dissOp & 0x08) { // b3=1  ld dd,(xxyy)
				out = "LD " + this.wregout(dissOp >> 4) + ",(" + this.wout() + ")"; // not ix,iy
			} else { // b3=0  ld (xxyy),dd
				out = "LD (" + this.wout() + ")," + this.wregout(dissOp >> 4);
			}
			break;
		case 4: // neg
			out = dissOp === 0x44 ? "NEG" : "*NEG";	// 44: NEG; 4c,54,5c,64,6c,74,7c: *NEG
			break;
		case 5: // retn, reti
			if (dissOp === 0x45) {
				out = "RETN";
			} else if (dissOp === 0x4d) {
				out = "RETI";
			} else if ((dissOp & 0x0f) === 0x05) {
				out = "*RETN"; // 55,65,75
			} else {
				out = "*RETI"; // 5d,6d,7d
			}
			break;
		case 6: // im 0; im 1; im 2
			switch (dissOp) {
			case 0x46: // im 0
				out = "IM 0";
				break;
			case 0x56: // im 1
				out = "IM 1";
				break;
			case 0x5e: // im 2
				out = "IM 2";
				break;
			case 0x4e: // *im 0
			case 0x66:
			case 0x6e:
				out = "*IM 0";
				break;
			case 0x76:
				out = "*IM 1";
				break;
			case 0x7e:
				out = "*IM 2";
				break;
			default:
				// impossible
				break;
			}
			break;
		case 7: // ld i,a; ld r,a;  ld a,i; ld a,r; rrd; rld
			out = Z80Disass.ldIaTable[(dissOp >> 3) & 0x07]; // b3,b4,b5
			break;
		default:
			break;
		}

		return out;
	}

	/* eslint-disable array-element-newline */
	private static readonly repeatTable = [
		["LDI", "LDD", "LDIR", "LDDR"],
		["CPI", "CPD", "CPIR", "CPDR"],
		["INI", "IND", "INIR", "INDR"],
		["OUTI", "OUTD", "OTIR", "OTDR"]
	];
	/* eslint-enable array-element-newline */

	private operdisED(dissOp: number) {
		let out = "";

		switch (dissOp >> 6) { // test b6,7
		case 0: // 00-3f // missing
			out = Z80Disass.unknownOp;
			break;
		case 1: // 40-7f // ...
			out = this.operdisEDpart40To7F(dissOp);
			break;
		default:
			break;
		case 2: // 80-bf
			if ((dissOp & 0x24) === 0x20) { // b5=1 and b2=0
				// ldi,ldd,ldir,lddr; cp,cpd,cpir,cpdr; ini,ind,inir,indr; outi,outd,otir,otdr
				out = Z80Disass.repeatTable[dissOp & 0x03][(dissOp >> 3) & 0x03]; // b0b1 and b3b4
			} else {
				out = Z80Disass.unknownOp;
			}
			break;
		case 3: // c0-f8 // missing
			out = Z80Disass.unknownOp;
			break;
		}
		return out;
	}

	private static readonly conditionTable = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"]; // eslint-disable-line array-element-newline


	//
	// Disassemble 00-3F
	//

	private operdis00To3Fpart00(b3b4b5: number) {
		// nop; ex af,af'; djnz; jr; jr nz,z,nc,c
		let out = "";

		switch (b3b4b5) { // test b3,b4,b5
		case 0: // nop
			out = "NOP";
			break;
		case 1: // ex af,af'
			out = "EX AF,AF'";
			break;
		case 2: // djnz tt
			out = "DJNZ " + this.radrout();
			break;
		case 3: // jr tt
			out = "JR " + this.radrout();
			break;
		default: // 4-7 (b3=1, b4b5)
			out = "JR " + Z80Disass.conditionTable[b3b4b5 & 0x03] + "," + this.radrout();
			break;
		}
		return out;
	}

	private operdis00To3Fpart01(dissOp: number) {
		// ld dd,xxyy; add hl,dd [dd=bc,de,hl,sp]
		let out = "";

		if (dissOp & 0x08) { // b3=1  add hl,dd
			out = "ADD " + this.wregout(2) + "," + this.wregout(dissOp >> 4); // hl maybe ix,iy
		} else {
			out = "LD " + this.wregout(dissOp >> 4) + "," + this.wout();
		}
		return out;
	}

	private operdis00To3Fpart02(b3b4b5: number) {
		// ld (xxyy),a!; ld (bc de),a!; ld (xxyy),hl!
		let out = "";

		if (b3b4b5 & 0x04) { // b5=1  ld (xxyy),hl!; ld (xxyy),a!
			switch (b3b4b5 & 0x03) { // test b3,b4
			case 0: // ld (xxyy),hl
				out = "LD (" + this.wout() + ")," + this.wregout(2);
				break;
			case 1: // ld hl,(xxyy)
				out = "LD " + this.wregout(2) + ",(" + this.wout() + ")";
				break;
			case 2: // ld (xxyy),a
				out = "LD (" + this.wout() + "),A";
				break;
			case 3: // ld a,(xxyy)
				out = "LD A,(" + this.wout() + ")";
				break;
			default:
				break;
			}
		} else { // b5=0  ld (bc de),a ld a,(bc de)
			switch (b3b4b5 & 0x03) { // test b3,b4
			case 0:
				out = "LD (BC),A";
				break;
			case 1:
				out = "LD A,(BC)";
				break;
			case 2:
				out = "LD (DE),A";
				break;
			case 3:
				out = "LD A,(DE)";
				break;
			default:
				break;
			}
		}
		return out;
	}

	private static readonly rlcaTable = ["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"]; // eslint-disable-line array-element-newline

	private operdis00To3F(dissOp: number) {
		let out = "";

		switch (dissOp & 0x07) { // test b0,b1,b2
		case 0: // nop; ex af,af'; djnz; jr; jr nz,z,nc,c
			out = this.operdis00To3Fpart00((dissOp >> 3) & 0x07); // test b3,b4,b5
			break;
		case 1: // ld dd,xxyy; add hl,dd
			out = this.operdis00To3Fpart01(dissOp);
			break;
		case 2: // ld (xxyy),a; ld (bc de),a ld a,(bc de); ld (xxyy),hl
			out = this.operdis00To3Fpart02((dissOp >> 3) & 0x07); // test b3,b4,b5
			break;
		case 3: // inc dd; dec dd; [dd=bc,de,hl,sp]; b3=1: dec
			out = (dissOp & 0x08 ? "DEC " : "INC ") + this.wregout(dissOp >> 4);
			break;
		case 4: // inc rrr
			out = "INC " + this.bregout(dissOp >> 3);
			break;
		case 5: // dec rrr
			out = "DEC " + this.bregout(dissOp >> 3);
			break;
		case 6: // ld rrr,xx  [rrr=b,c,d,e,h,l,(hl)|(ix+d),a]
			out = "LD " + this.bregout(dissOp >> 3) + "," + this.bout();
			break;
		case 7: // rlca,rrca,rla,rra; scf,ccf; daa,cpl
			out = Z80Disass.rlcaTable[(dissOp >> 3) & 0x07];
			break;
		default:
			break;
		}
		return out;
	}

	private static readonly arithMTab = ["ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "]; // eslint-disable-line array-element-newline


	//
	// Disassemble C0-FF
	//

	private operdisC0ToFFpart01(dissOp: number) {
		// pop ee [ee=bc,de,hl,af]; ld sp,hl; jp (hl); ret; exx
		let out = "";
		const b4b5 = (dissOp >> 4) & 0x03; // test b4,b5

		if (dissOp & 0x08) { // b3=1  ld sp,hl; jp (hl); ret; exx
			switch (b4b5) { // test b4,b5
			case 0:
				out = "RET";
				break;
			case 1:
				out = "EXX";
				break;
			case 2:
				out = "JP (" + this.wregout(2) + ")"; // no displacement with ix,iy !!
				break;
			case 3:
				out = "LD SP," + this.wregout(2);
				break;
			default:
				break;
			}
		} else { // b3=0  pop ee [ee=bc,de,hl,af]
			out = "POP " + this.pupoRegout(b4b5); // b4,b5
		}
		return out;
	}

	private operdisC0ToFFpart03(b3b4b5: number) {
		// ex (sp),hl; out (xx),a; di,ei; jp xxyy; ex de,hl; CB
		let out = "";

		switch (b3b4b5) { // test b3,b4,b5
		case 0: // jp xxyy
			out = "JP " + this.wout();
			break;
		case 1: // CB
			out = this.operdisCB();
			break;
		case 2: // out (xx),a
			out = "OUT (" + this.bout() + "),A";
			break;
		case 3: // in a,(xx)
			out = "IN A,(" + this.bout() + ")";
			break;
		case 4: // ex (sp),hl
			out = "EX (SP)," + this.wregout(2);
			break;
		case 5: // ex de,hl
			out = "EX DE,HL"; // not IX,IY !!
			break;
		case 6: // di
			out = "DI";
			break;
		case 7: // ei
			out = "EI";
			break;
		default:
			break;
		}
		return out;
	}

	private operdisC0ToFFpart05(dissOp: number) {
		// push ee; call xxyy; ED; [IX IY]
		let out = "";
		const b4b5 = (dissOp >> 4) & 0x03; // test b4,b5

		if (dissOp & 0x08) { // b3=1  call xxyy; ED; [IX IY]
			if (b4b5 === 0) { // test b4,b5
				out = "CALL " + this.wout();
			} else {
				out = this.onlyPrefix(); // [IX,IY] and another IX,ED or IY prefix
			}
		} else { // b3=0  push ee [ee=bc,de,hl,af]
			out = "PUSH " + this.pupoRegout(b4b5); // b4, b5
		}
		return out;
	}

	private operdisC0ToFF(dissOp: number) {
		let out = "";

		switch (dissOp & 0x07) { // test b0,b1,b2
		case 0: // ret ccc [ccc=nz,z,nc,c,po,pe,p,m]
			out = "RET " + Z80Disass.conditionTable[(dissOp >> 3) & 0x07];
			break;
		case 1: // pop ee; ld sp,hl; jp (hl); ret; exx
			out = this.operdisC0ToFFpart01(dissOp);
			break;
		case 2: // jp ccc,xxyy [ccc=nz,z,nc,c,po,pe,p,m]
			out = "JP " + Z80Disass.conditionTable[(dissOp >> 3) & 0x07] + "," + this.wout();
			break;
		case 3: // ex (sp),hl; out (xx),a; di,ei; jp xxyy; ex de,hl; CB
			out = this.operdisC0ToFFpart03((dissOp >> 3) & 0x07); // test b3,b4,b5
			break;
		case 4: // call ccc,xxyy [ccc=nz,z,nc,c,po,pe,p,m]
			out = "CALL " + Z80Disass.conditionTable[(dissOp >> 3) & 0x07] + "," + this.wout();
			break;
		case 5: // push ee; call xxyy; [ED; IX IY]
			out = this.operdisC0ToFFpart05(dissOp);
			break;
		case 6: // add,adc,sub,sbc,and,xor,or,cp a, xx
			out = Z80Disass.arithMTab[(dissOp >> 3) & 0x07] + this.bout(); // arith depends on b3,b4,b5
			break;
		case 7: // rst ppp*3
			out = "RST " + Z80Disass.hexMark + (dissOp & 0x38).toString(16).toUpperCase().padStart(2, "0"); // ppp at b5..b3
			break;
		default:
			break;
		}
		return out;
	}


	//
	// Disassemble main
	//

	private static readonly prefixMap: Record<number, number> = {
		0xDD: 1,
		0xFD: 2,
		0xED: 4
	};

	// disassembles next instruction
	private getNextLine(): string {
		let dissOp = this.bget();

		const prefix = Z80Disass.prefixMap[dissOp] || 0;

		if (prefix) { // DD, FD, ED?
			dissOp = this.bget();
		}

		this.prefix = prefix;
		this.dissOp = dissOp;
		let out = "";

		if (prefix === 4) {
			out = this.operdisED(dissOp);
		} else {
			switch (dissOp >> 6) { // test b6,7
			case 0: // 00-3f
				out = this.operdis00To3F(dissOp);
				break;
			case 1: // 40-7f // halt; ld rrr,rrr2 [rrr,rr2=b,c,d,e,h,l,(hl),a]
				out = dissOp === 0x76 ? "HALT" : "LD " + this.bregout(dissOp >> 3) + "," + this.bregout(dissOp);
				break;
			case 2: // 80-bf // add,adc,sub,sbc,and,xor,or,cp a,rrr [rrr=b,c,d,e,h,l,(hl),a]
				out = Z80Disass.arithMTab[(dissOp >> 3) & 0x07] + this.bregout(dissOp);
				break;
			case 3: // c0-ff
				out = this.operdisC0ToFF(dissOp);
				break;
			default:
				break;
			}
		}
		return out;
	}

	disassLine(): string {
		const format = this.options.format ?? 7,
			startAddr = this.options.addr,
			line = this.getNextLine();
		let out = "";

		if (format & 1) {
			out += startAddr.toString(16).toUpperCase().padStart(4, "0");
		}

		if (format & 2) {
			const byteHex = [];

			if (out.length) {
				out += "  ";
			}

			for (let i = startAddr; i < this.options.addr; i += 1) {
				const byte = this.readByte(i) || 0;

				byteHex.push(byte.toString(16).toUpperCase().padStart(2, "0"));
			}
			while (byteHex.length < 4) {
				byteHex.push("  ");
			}

			out += byteHex.join(" ");
		}

		if (format & 4) {
			if (out.length) {
				out += "  ";
			}

			out += line;
		}

		return out;
	}
}
/* eslint-enable no-bitwise */

// end
