// Z80Disass.ts - Z80 Disassembler
// (c) Marco Vieth, 1995-2023
// based on Cpcemu: DISASS.CPP, CPCDIS.C
//
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Z80Disass = void 0;
    /* eslint-disable no-bitwise */
    var Z80Disass = /** @class */ (function () {
        function Z80Disass(options) {
            this.dissOp = 0; // actual op-code
            this.prefix = 0; // actual prefix: 0=none, 1=0xDD, 2=0xFD, 4=0xED
            this.disassPC = 0; // PC during disassemble
            this.options = {
                data: options.data,
                addr: options.addr,
                format: 7
            };
            this.setOptions(options);
        }
        Z80Disass.prototype.setOptions = function (options) {
            if (options.data !== undefined) {
                this.options.data = options.data;
            }
            if (options.addr !== undefined) {
                this.options.addr = options.addr;
                this.disassPC = options.addr;
            }
            if (options.format !== undefined) {
                this.options.format = options.format;
            }
        };
        Z80Disass.prototype.getOptions = function () {
            this.options.addr = this.disassPC;
            return this.options;
        };
        Z80Disass.prototype.readByte = function (i) {
            var data = this.options.data;
            return data[i] | 0;
        };
        Z80Disass.prototype.readWord = function (i) {
            var data = this.options.data;
            return data[i] | ((data[i + 1]) << 8);
        };
        Z80Disass.prototype.bget = function () {
            var by = this.readByte(this.disassPC);
            this.disassPC += 1;
            return by;
        };
        // byte-out: returns byte xx at PC; PC++
        Z80Disass.prototype.bout = function () {
            var by = this.bget();
            return Z80Disass.hexMark + by.toString(16).toUpperCase().padStart(2, "0");
        };
        // word-out: returns word xxyy from PC, PC+=2
        Z80Disass.prototype.wout = function () {
            var wo = this.readWord(this.disassPC);
            this.disassPC += 2;
            return Z80Disass.hexMark + wo.toString(16).toUpperCase().padStart(4, "0");
        };
        // relative-address-out : gets it from PC and returns PC+(signed)tt ; PC++
        Z80Disass.prototype.radrout = function () {
            var dis = this.bget(); // displacement, signed! (0= next instruction)
            dis = dis << 24 >> 24; // convert to signed
            // https://stackoverflow.com/questions/56577958/how-to-convert-one-byte-8-bit-to-signed-integer-in-javascript
            var addr = this.disassPC + dis;
            if (addr < 0) {
                addr += 65536;
            }
            return Z80Disass.hexMark + addr.toString(16).toUpperCase().padStart(4, "0");
        };
        /* eslint-enable array-element-newline */
        // byte-register-out : returns string to an 8-bit register
        // handles prefix, special op-codes with IX,IY and h,l
        Z80Disass.prototype.bregout = function (nr) {
            var dissOp = this.dissOp;
            nr &= 0x07; // only 3 bit
            var prefix = this.prefix;
            // special cases of op-codes with h,l and (ix) or (iy)
            if (prefix === 4 || (this.prefix === 1 || this.prefix === 2) && (dissOp === 0x66 || dissOp === 0x6e || dissOp === 0x74 || dissOp === 0x75) && (nr !== 6)) {
                prefix = 0;
            }
            return Z80Disass.bregtab[prefix][nr] + (prefix && (nr === 6) ? this.bout() + ")" : ""); // only 3 bit
        };
        /* eslint-enable array-element-newline */
        // word-register-out : returns string to a 16-bit-register
        // handles prefix
        Z80Disass.prototype.wregout = function (nr) {
            var prefix = (this.prefix === 1 || this.prefix === 2) ? this.prefix : 0;
            return Z80Disass.wregtab[prefix][nr & 0x03]; // only 2 bit
        };
        // push-pop-register-out: like wregout, only SP substituted by AF
        Z80Disass.prototype.pupoRegout = function (nr) {
            nr &= 0x03; // only 2 bit
            if (nr === 3) {
                return "AF"; // replace SP by AF
            }
            return this.wregout(nr);
        };
        Z80Disass.prototype.onlyPrefix = function () {
            var out = "";
            if (this.prefix === 1) {
                out = "[DD]-prefix";
            }
            else if (this.prefix === 2) { // prefix == 2
                out = "[FD]-prefix";
            }
            else { // prefix === 4
                out = "[ED]-prefix";
            }
            this.disassPC -= 1;
            return out;
        };
        Z80Disass.prototype.operdisCB = function () {
            // rlc,rrc,rl,rr,sla,sra,sls*,srl rrr [rrr=b,c,d,e,h,l,(hl),a]
            // bit bbb,rrr; res bbb,rrr; set bbb,rrr [rrr=b,c,d,e,h,l,(hl),a]
            var out = "", newop; // new op
            if (this.prefix === 1 || this.prefix === 2) { // ix/iy-flag (ix or iy !)
                newop = ((this.readByte(this.disassPC + 1) & 0xfe) | 0x06); // transform code x0..x7=>x6 , x8..xf=>xe  (always ix.., iy.. )
            }
            else {
                newop = this.readByte(this.disassPC);
            }
            var b6b7 = newop >> 6, // test b6,7
            b3b4b5 = (newop >> 3) & 0x07;
            if (b6b7 === 0) { // 00-3f (rlc,rrc,rl,rr,sla,sra,sls*,srl rrr)
                out = Z80Disass.rlcTable[b3b4b5] + " " + this.bregout(newop); // b3b4b5
            }
            else { // 40-7f: bit bbb,rrr; 80-bf: res bbb,rrr; c0-ff: set bbb,rrr
                out = Z80Disass.bitResSetTable[b6b7 - 1] + " " + b3b4b5 + "," + this.bregout(newop);
            }
            if (this.prefix === 1 || this.prefix === 2) { // ix/iy-flag (ix or iy !)
                if ((newop !== this.readByte(this.disassPC)) && ((newop >> 6) !== 0x01)) { // there was a transform; not bit-instruction
                    var premem = this.prefix; // memorize prefix
                    this.prefix = 0; // only h or l
                    out += " & LD " + this.bregout(this.readByte(this.disassPC));
                    this.prefix = premem; // old prefix
                }
            }
            this.disassPC += 1;
            return out;
        };
        Z80Disass.prototype.operdisEDpart40To7F = function (dissOp) {
            var out = "";
            switch (dissOp & 0x07) { // test b0,b1,b2
                case 0: // in rrr,(c),
                    if (dissOp === 0x70) {
                        out = "*IN X,(C)"; // 70
                    }
                    else {
                        out = "IN " + this.bregout(dissOp >> 3) + ",(C)";
                    }
                    break;
                case 1: // out (c),rrr, *out (c),0
                    if (dissOp === 0x71) {
                        out = "*OUT (C),0"; // 71
                    }
                    else {
                        out = "OUT (C)," + this.bregout(dissOp >> 3);
                    }
                    break;
                case 2: // sbc hl,dd; add hl,dd [dd=bc,de,hl,sp]; not ix,iy!
                    out = (dissOp & 0x08 ? "ADC" : "SBC") + " HL," + this.wregout(dissOp >> 4); // b3=1: adc, otherwise sbc
                    break;
                case 3: // ld (xxyy),dd! [dd=bc,de,hl,sp]
                    if (dissOp & 0x08) { // b3=1  ld dd,(xxyy)
                        out = "LD " + this.wregout(dissOp >> 4) + ",(" + this.wout() + ")"; // not ix,iy
                    }
                    else { // b3=0  ld (xxyy),dd
                        out = "LD (" + this.wout() + ")," + this.wregout(dissOp >> 4);
                    }
                    break;
                case 4: // neg
                    out = dissOp === 0x44 ? "NEG" : "*NEG"; // 44: NEG; 4c,54,5c,64,6c,74,7c: *NEG
                    break;
                case 5: // retn, reti
                    if (dissOp === 0x45) {
                        out = "RETN";
                    }
                    else if (dissOp === 0x4d) {
                        out = "RETI";
                    }
                    else if ((dissOp & 0x0f) === 0x05) {
                        out = "*RETN"; // 55,65,75
                    }
                    else {
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
        };
        /* eslint-enable array-element-newline */
        Z80Disass.prototype.operdisED = function (dissOp) {
            var out = "";
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
                    }
                    else {
                        out = Z80Disass.unknownOp;
                    }
                    break;
                case 3: // c0-f8 // missing
                    out = Z80Disass.unknownOp;
                    break;
            }
            return out;
        };
        //
        // Disassemble 00-3F
        //
        Z80Disass.prototype.operdis00To3Fpart00 = function (b3b4b5) {
            // nop; ex af,af'; djnz; jr; jr nz,z,nc,c
            var out = "";
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
        };
        Z80Disass.prototype.operdis00To3Fpart01 = function (dissOp) {
            // ld dd,xxyy; add hl,dd [dd=bc,de,hl,sp]
            var out = "";
            if (dissOp & 0x08) { // b3=1  add hl,dd
                out = "ADD " + this.wregout(2) + "," + this.wregout(dissOp >> 4); // hl maybe ix,iy
            }
            else {
                out = "LD " + this.wregout(dissOp >> 4) + "," + this.wout();
            }
            return out;
        };
        Z80Disass.prototype.operdis00To3Fpart02 = function (b3b4b5) {
            // ld (xxyy),a!; ld (bc de),a!; ld (xxyy),hl!
            var out = "";
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
            }
            else { // b5=0  ld (bc de),a ld a,(bc de)
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
        };
        Z80Disass.prototype.operdis00To3F = function (dissOp) {
            var out = "";
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
        };
        //
        // Disassemble C0-FF
        //
        Z80Disass.prototype.operdisC0ToFFpart01 = function (dissOp) {
            // pop ee [ee=bc,de,hl,af]; ld sp,hl; jp (hl); ret; exx
            var out = "";
            var b4b5 = (dissOp >> 4) & 0x03; // test b4,b5
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
            }
            else { // b3=0  pop ee [ee=bc,de,hl,af]
                out = "POP " + this.pupoRegout(b4b5); // b4,b5
            }
            return out;
        };
        Z80Disass.prototype.operdisC0ToFFpart03 = function (b3b4b5) {
            // ex (sp),hl; out (xx),a; di,ei; jp xxyy; ex de,hl; CB
            var out = "";
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
        };
        Z80Disass.prototype.operdisC0ToFFpart05 = function (dissOp) {
            // push ee; call xxyy; ED; [IX IY]
            var out = "";
            var b4b5 = (dissOp >> 4) & 0x03; // test b4,b5
            if (dissOp & 0x08) { // b3=1  call xxyy; ED; [IX IY]
                if (b4b5 === 0) { // test b4,b5
                    out = "CALL " + this.wout();
                }
                else {
                    out = this.onlyPrefix(); // [IX,IY] and another IX,ED or IY prefix
                }
            }
            else { // b3=0  push ee [ee=bc,de,hl,af]
                out = "PUSH " + this.pupoRegout(b4b5); // b4, b5
            }
            return out;
        };
        Z80Disass.prototype.operdisC0ToFF = function (dissOp) {
            var out = "";
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
        };
        // disassembles next instruction
        Z80Disass.prototype.getNextLine = function () {
            var dissOp = this.bget();
            var prefix = Z80Disass.prefixMap[dissOp] || 0;
            if (prefix) { // DD, FD, ED?
                dissOp = this.bget();
            }
            this.prefix = prefix;
            this.dissOp = dissOp;
            var out = "";
            if (prefix === 4) {
                out = this.operdisED(dissOp);
            }
            else {
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
        };
        Z80Disass.prototype.disassLine = function () {
            var _a;
            var format = (_a = this.options.format) !== null && _a !== void 0 ? _a : 7, startAddr = this.disassPC, line = this.getNextLine();
            var out = "";
            if (format & 1) {
                out += startAddr.toString(16).toUpperCase().padStart(4, "0");
            }
            if (format & 2) {
                var byteHex = [];
                if (out.length) {
                    out += "  ";
                }
                for (var i = startAddr; i < this.disassPC; i += 1) {
                    var byte = this.readByte(i) || 0;
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
        };
        Z80Disass.hexMark = "&"; // hex-marker, "&" or "#" or ""
        /* eslint-disable array-element-newline */
        Z80Disass.bregtab = [
            ["B", "C", "D", "E", "H", "L", "(HL)", "A"],
            ["B", "C", "D", "E", "HX", "LX", "(IX+", "A"],
            ["B", "C", "D", "E", "HY", "LY", "(IY+", "A"] // FD-Prefix
        ];
        /* eslint-disable array-element-newline */
        Z80Disass.wregtab = [
            ["BC", "DE", "HL", "SP"],
            ["BC", "DE", "IX", "SP"],
            ["BC", "DE", "IY", "SP"] // FD-Prefix
        ];
        Z80Disass.unknownOp = "unknown";
        //
        // Disassemble CB
        //
        Z80Disass.rlcTable = ["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLS*", "SRL"]; // eslint-disable-line array-element-newline
        Z80Disass.bitResSetTable = ["BIT", "RES", "SET"]; // eslint-disable-line array-element-newline
        //
        // Disassemble ED
        //
        Z80Disass.ldIaTable = ["LD I,A", "LD R,A", "LD A,I", "LD A,R", "RRD", "RLD", Z80Disass.unknownOp, Z80Disass.unknownOp]; // eslint-disable-line array-element-newline
        /* eslint-disable array-element-newline */
        Z80Disass.repeatTable = [
            ["LDI", "LDD", "LDIR", "LDDR"],
            ["CPI", "CPD", "CPIR", "CPDR"],
            ["INI", "IND", "INIR", "INDR"],
            ["OUTI", "OUTD", "OTIR", "OTDR"]
        ];
        Z80Disass.conditionTable = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"]; // eslint-disable-line array-element-newline
        Z80Disass.rlcaTable = ["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"]; // eslint-disable-line array-element-newline
        Z80Disass.arithMTab = ["ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "]; // eslint-disable-line array-element-newline
        //
        // Disassemble main
        //
        Z80Disass.prefixMap = {
            0xDD: 1,
            0xFD: 2,
            0xED: 4
        };
        return Z80Disass;
    }());
    exports.Z80Disass = Z80Disass;
});
/* eslint-disable no-bitwise */
// end
//# sourceMappingURL=Z80Disass.js.map