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
            this.out = "";
            this.dissOp = 0; // actual op-code
            this.prefix = 0; // actual prefix: 0=none, 1=0xED, 2=0xDD, 3=0xFD
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
            return data[i] | ((data[i + 1]) << 8); // eslint-disable-line no-bitwise
        };
        Z80Disass.prototype.bget = function () {
            var by = this.readByte(this.disassPC);
            this.disassPC += 1;
            return by;
        };
        // byte-out: returns byte xx at PC; PC++
        Z80Disass.prototype.bout = function () {
            var by = this.readByte(this.disassPC);
            this.disassPC += 1;
            return by.toString(16).toUpperCase().padStart(2, "0");
        };
        // word-out: returns word xxyy from PC, PC+=2
        Z80Disass.prototype.wout = function () {
            var wo = this.readWord(this.disassPC);
            this.disassPC += 2;
            return wo.toString(16).toUpperCase().padStart(4, "0");
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
            return addr.toString(16).toUpperCase().padStart(4, "0");
        };
        // byte-register-out : returns string to an 8-bit register
        // handles prefix, special op-codes with IX,IY and h,l
        Z80Disass.prototype.bregout = function (nr) {
            // byte-register-table
            /* eslint-disable array-element-newline */
            var bregtab = [
                "B", "C", "D", "E", "H", "L", "(HL)", "A",
                "B", "C", "D", "E", "HX", "LX", "(IX+", "A",
                "B", "C", "D", "E", "HY", "LY", "(IY+", "A" // FD-Prefix
            ];
            /* eslint-enable array-element-newline */
            var str = "";
            nr &= 0x07; // only 3 bit
            if (this.prefix === 2) {
                if ((this.dissOp === 0x66 || this.dissOp === 0x6e || this.dissOp === 0x74 || this.dissOp === 0x75) && (nr !== 6)) {
                    // special cases of op-codes with h,l & (ix)
                }
                else {
                    nr += 8;
                } // ix
                if (nr === 14) { // (ix+...
                    str += bregtab[nr] + Z80Disass.hexMark + this.bout() + ")";
                    return str;
                }
            }
            else if (this.prefix === 3) {
                if (((this.dissOp === 0x66) || (this.dissOp === 0x6e) || (this.dissOp === 0x74) || (this.dissOp === 0x75)) && (nr !== 6)) {
                    // special cases of op-codes with h,l & (iy)
                }
                else {
                    nr += 16;
                } // iy
                if (nr === 22) { // (iy+...
                    str += bregtab[nr] + Z80Disass.hexMark + this.bout() + ")";
                    return str;
                }
            }
            return bregtab[nr];
        };
        // word-register-out : returns string to a 16-bit-register
        // handles prefix
        Z80Disass.prototype.wregout = function (nr) {
            /* eslint-disable array-element-newline */
            var wregtab = [
                "BC", "DE", "HL", "SP",
                "BC", "DE", "IX", "SP",
                "BC", "DE", "IY", "SP" // FD-Prefix
            ];
            /* eslint-enable array-element-newline */
            nr &= 0x03; // only 2 bit
            if (this.prefix === 2) {
                nr += 4; // ix
            }
            else if (this.prefix === 3) {
                nr += 8; // iy
            }
            return wregtab[nr];
        };
        // push-pop-register-out: like wregout, only SP substituted by AF
        Z80Disass.prototype.pupoRegout = function (nr) {
            nr &= 0x03; // only 2 bit
            if (nr === 3) {
                return "AF"; // replace SP
            }
            return this.wregout(nr);
        };
        // bitout:  returns bits b0..b3 of input by
        Z80Disass.prototype.bitout = function (nr) {
            return nr & 0x07;
        };
        // condition-out: returns string to condition nr
        Z80Disass.prototype.condout = function (nr) {
            /* eslint-disable array-element-newline */
            var condtab = [
                "NZ", "Z", "NC", "C", "PO", "PE", "P", "M"
            ];
            /* eslint-enable array-element-newline */
            return condtab[nr & 0x07]; // only 3 bit
        };
        // arithmetic-mnemonic-out : returns string to arith. mnemonic nr
        Z80Disass.prototype.arithMOut = function (nr) {
            /* eslint-disable array-element-newline */
            var arithMTab = [
                "ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "
            ];
            /* eslint-enable array-element-newline */
            nr &= 0x07; // only 0..7
            return arithMTab[nr];
        };
        Z80Disass.prototype.onlyPrefix = function () {
            if (this.prefix === 1) {
                this.out += "[ED]-prefix";
            }
            else if (this.prefix === 2) {
                this.out += "[DD]-prefix";
            }
            else { // prefix == 3
                this.out += "[FD]-prefix";
            }
            this.disassPC -= 1;
        };
        // unknown op-code
        Z80Disass.prototype.operUnknown = function () {
            this.out += "unknown";
        };
        Z80Disass.prototype.operdis00 = function () {
            // nop; ex af,af'; djnz; jr; jr nz,z,nc,c
            var out = "";
            switch ((this.dissOp >> 3) & 0x07) { // test b3,b4,b5
                case 0: // nop
                    out = "NOP";
                    break;
                case 1: // ex af,af'
                    out = "EX AF,AF'";
                    break;
                case 2: // djnz tt
                    out = "DJNZ " + Z80Disass.hexMark + this.radrout();
                    break;
                case 3: // jr tt
                    out = "JR " + Z80Disass.hexMark + this.radrout();
                    break;
                case 4: // jr nz,tt
                    out = "JR NZ," + Z80Disass.hexMark + this.radrout();
                    break;
                case 5: // jr z,tt
                    out = "JR Z," + Z80Disass.hexMark + this.radrout();
                    break;
                case 6: // jr nc,tt
                    out = "JR NC," + Z80Disass.hexMark + this.radrout();
                    break;
                case 7: // jr c,tt
                    out = "JR C," + Z80Disass.hexMark + this.radrout();
                    break;
                default:
                    break;
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis01 = function () {
            // ld dd,xxyy; add hl,dd [dd=bc,de,hl,sp]
            var out = "";
            if (this.dissOp & 0x08) { // b3=1  add hl,dd
                out = "ADD " + this.wregout(2) + "," + this.wregout(this.dissOp >> 4); // hl maybe ix,iy
            }
            else {
                out = "LD " + this.wregout(this.dissOp >> 4) + "," + Z80Disass.hexMark + this.wout();
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis02 = function () {
            // ld (xxyy),a!; ld (bc de),a!; ld (xxyy),hl!
            var out = "";
            if (this.dissOp & 0x20) { // b5=1  ld (xxyy),hl!; ld (xxyy),a!
                switch ((this.dissOp >> 3) & 0x03) { // test b3,b4
                    case 0: // ld (xxyy),hl
                        out = "LD (" + Z80Disass.hexMark + this.wout() + ")," + this.wregout(2);
                        break;
                    case 1: // ld hl,(xxyy)
                        out = "LD " + this.wregout(2) + ",(" + Z80Disass.hexMark + this.wout() + ")";
                        break;
                    case 2: // ld (xxyy),a
                        out = "LD (" + Z80Disass.hexMark + this.wout() + "),A";
                        break;
                    case 3: // ld a,(xxyy)
                        out = "LD A,(" + Z80Disass.hexMark + this.wout() + ")";
                        break;
                    default:
                        break;
                }
            }
            else { // b5=0  ld (bc de),a ld a,(bc de)
                switch ((this.dissOp >> 3) & 0x03) { // test b3,b4
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
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis03 = function () {
            // inc dd; dec dd [dd=bc,de,hl,sp]
            var out = "";
            if (this.dissOp & 0x08) { // b3=1  dec dd
                out = "DEC " + this.wregout(this.dissOp >> 4);
            }
            else { // b3=0  inc dd
                out = "INC " + this.wregout(this.dissOp >> 4);
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis04 = function () {
            // inc rrr [rrr=b,c,d,e,h,l,(hl),a]
            var out = "INC " + this.bregout(this.dissOp >> 3);
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis05 = function () {
            // dec rrr [rrr=b,c,d,e,h,l,(hl),a]
            var out = "DEC " + this.bregout(this.dissOp >> 3);
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis06 = function () {
            // ld rrr,xx [rrr=b,c,d,e,h,l,(hl),a]
            // maybe (ix+d) !! , bout after this
            var out = "LD " + this.bregout(this.dissOp >> 3) + "," + Z80Disass.hexMark + this.bout();
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis07 = function () {
            // rlca,rrca,rla,rra; scf,ccf; daa,cpl
            var out = "";
            switch ((this.dissOp >> 3) & 0x07) { // test b3,b4,b5
                case 0: // rlca
                    out = "RLCA";
                    break;
                case 1: // rrca
                    out = "RRCA";
                    break;
                case 2: // rla
                    out = "RLA";
                    break;
                case 3: // rra
                    out = "RRA";
                    break;
                case 4: // daa
                    out = "DAA";
                    break;
                case 5: // cpl
                    out = "CPL";
                    break;
                case 6: // scf
                    out = "SCF";
                    break;
                case 7: // ccf
                    out = "CCF";
                    break;
                default:
                    break;
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis10 = function () {
            // halt; ld rrr,rrr2 [rrr,rr2=b,c,d,e,h,l,(hl),a]
            var out = "";
            if (this.dissOp === 0x76) { // halt
                out = "HALT";
            }
            else { // ld rrr,rrr2
                out = "LD " + this.bregout(this.dissOp >> 3) + "," + this.bregout(this.dissOp);
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis20 = function () {
            // add,adc,sub,sbc,and,xor,or,cp a,rrr [rrr=b,c,d,e,h,l,(hl),a]
            var out = this.arithMOut((this.dissOp >> 3) & 0x07) + this.bregout(this.dissOp); // arith depends on b3,b4,b5
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis30 = function () {
            // ret ccc [ccc=nz,z,nc,c,po,pe,p,m]
            var out = "RET " + this.condout(this.dissOp >> 3);
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis31 = function () {
            // pop ee [ee=bc,de,hl,af]; ld sp,hl; jp (hl); ret; exx
            var out = "";
            if (this.dissOp & 0x08) { // b3=1  ld sp,hl; jp (hl); ret; exx
                switch ((this.dissOp >> 4) & 0x03) { // test b4,b5
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
                out = "POP " + this.pupoRegout((this.dissOp >> 4) & 0x03); // b4,b5
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis32 = function () {
            // jp ccc,xxyy [ccc=nz,z,nc,c,po,pe,p,m]
            var out = "JP " + this.condout(this.dissOp >> 3) + "," + Z80Disass.hexMark + this.wout();
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdisCB00 = function (op2) {
            // rlc,rrc,r{
            var out = "";
            switch ((op2 >> 3) & 0x07) { // test b3,b4,b5
                case 0: // rlc rrr
                    out = "RLC " + this.bregout(op2);
                    break;
                case 1: // rrc rrr
                    out = "RRC " + this.bregout(op2);
                    break;
                case 2: // rl rrr
                    out = "RL " + this.bregout(op2);
                    break;
                case 3: // rr rrr
                    out = "RR " + this.bregout(op2);
                    break;
                case 4: // sla rrr
                    out = "SLA " + this.bregout(op2);
                    break;
                case 5: // sra rrr
                    out = "SRA " + this.bregout(op2);
                    break;
                case 6: // srs* rrr
                    out = "SLS* " + this.bregout(op2);
                    break;
                case 7: // srl rrr
                    out = "SRL " + this.bregout(op2);
                    break;
                default:
                    break;
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdisCB = function () {
            // rlc,rrc,rl,rr,sla,sra,sls*,srl rrr [rrr=b,c,d,e,h,l,(hl),a]
            // bit bbb,rrr; res bbb,rrr; set bbb,rrr [rrr=b,c,d,e,h,l,(hl),a]
            var out = "", newop, premem; // new op
            if (this.prefix >= 2) { // ix/iy-flag (ix or iy !)
                newop = ((this.readByte(this.disassPC + 1) & 0xfe) | 0x06); // transform code x0..x7=>x6 , x8..xf=>xe  (always ix.., iy.. )
            }
            else {
                newop = this.readByte(this.disassPC);
            }
            switch (newop >> 6) { // test b6,7
                case 0: // 00-3f // rlc,rrc,rl,rr,sla,sra,sls*,srl rrr
                    this.operdisCB00(newop);
                    break;
                case 1: // 40-7f // bit bbb,rrr
                    out = "BIT " + this.bitout(newop >> 3) + "," + this.bregout(newop);
                    break;
                case 2: // 80-bf // res bbb,rrr
                    out = "RES " + this.bitout(newop >> 3) + "," + this.bregout(newop);
                    break;
                case 3: // c0-ff // set bbb,rrr
                    out = "SET " + this.bitout(newop >> 3) + "," + this.bregout(newop);
                    break;
                default:
                    break;
            }
            if (this.prefix >= 2) { // ix/iy-flag (ix or iy !)
                if ((newop !== this.readByte(this.disassPC)) && ((newop >> 6) !== 0x01)) { // there was a transform; not bit-instruction
                    //TTT TODO!
                    //p = 0;
                    //while ((line[p]!='\0') && (p<20)) { p++; } // find end of string
                    premem = this.prefix; // memorize prefix
                    this.prefix = 0; // only h,l
                    out += " & LD " + this.bregout(this.readByte(this.disassPC)); //TTT
                    this.prefix = premem; // old prefix
                }
            }
            this.disassPC += 1;
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis33 = function () {
            // ex (sp),hl; out (xx),a; di,ei; jp xxyy; ex de,hl; CB
            var out = "";
            switch ((this.dissOp >> 3) & 0x07) { // test b3,b4,b5
                case 0: // jp xxyy
                    out = "JP " + Z80Disass.hexMark + this.wout();
                    break;
                case 1: // CB
                    this.operdisCB();
                    break;
                case 2: // out (xx),a
                    out = "OUT (" + Z80Disass.hexMark + this.bout() + "),A";
                    break;
                case 3: // in a,(xx)
                    out = "IN A,(" + Z80Disass.hexMark + this.bout() + ")";
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
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis34 = function () {
            // call ccc,xxyy [ccc=nz,z,nc,c,po,pe,p,m]
            var out = "CALL " + this.condout(this.dissOp >> 3) + "," + Z80Disass.hexMark + this.wout();
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis35 = function () {
            // push ee; call xxyy; ED; [IX IY]
            var out = "";
            if (this.dissOp & 0x08) { // b3=1  call xxyy; ED; [IX IY]
                switch ((this.dissOp >> 4) & 0x03) { // test b4,b5
                    case 0:
                        out = "CALL " + Z80Disass.hexMark + this.wout();
                        break;
                    case 1: // [IX,IY] and another IX-prefix
                        this.onlyPrefix();
                        break;
                    case 2: // [IX,IY] and an ED-prefix
                        this.onlyPrefix();
                        break;
                    case 3: // [IX,IY] and another IY-prefix
                        this.onlyPrefix();
                        break;
                    default:
                        break;
                }
            }
            else { // b3=0  push ee [ee=bc,de,hl,af]
                out = "PUSH " + this.pupoRegout((this.dissOp >> 4) & 0x03); // b4, b5
            }
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis36 = function () {
            // add,adc,sub,sbc,and,xor,or,cp a,xx
            var out = this.arithMOut((this.dissOp >> 3) & 0x07) + Z80Disass.hexMark + this.bout(); // arith depends on b3,b4,b5
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdis37 = function () {
            // rst ppp*8
            //const out = "RST " + Z80Disass.hexMark + (this.dissOp & 0x38).toString(2).toUpperCase().padStart(2, "0"); // ppp at b5..b3
            var out = "RST " + Z80Disass.hexMark + (this.dissOp & 0x38).toString(16).toUpperCase().padStart(2, "0"); // ppp at b5..b3
            this.out += out;
            //return out;
        };
        Z80Disass.prototype.operdisED = function () {
            // ...
            var out = "";
            switch (this.dissOp >> 6) { // test b6,7
                case 0: // 00-3f // missing
                    this.operUnknown();
                    break;
                case 1: // 40-7f // ...
                    switch (this.dissOp & 0x07) { // test b0,b1,b2
                        case 0: // in rrr,(c),
                            if (this.dissOp === 0x70) {
                                out = "*IN X,(C)"; // 70
                            }
                            else {
                                out = "IN " + this.bregout(this.dissOp >> 3) + ",(C)";
                            }
                            break;
                        case 1: // out (c),rrr, *out (c),0
                            if (this.dissOp === 0x71) {
                                out = "*OUT (C),0"; // 71
                            }
                            else {
                                out = "OUT (C)," + this.bregout(this.dissOp >> 3);
                            }
                            break;
                        case 2: // sbc hl,dd; add hl,dd [dd=bc,de,hl,sp]
                            if (this.dissOp & 0x08) { // b3=1  adc
                                out = "ADC HL," + this.wregout(this.dissOp >> 4); // HL not IX,IY !!
                            }
                            else { // b3=0  sbc
                                out = "SBC HL," + this.wregout(this.dissOp >> 4); // not ix,iy
                            }
                            break;
                        case 3: // ld (xxyy),dd! [dd=bc,de,hl,sp]
                            if (this.dissOp & 0x08) { // b3=1  ld dd,(xxyy)
                                out = "LD " + this.wregout(this.dissOp >> 4) + ",(" + Z80Disass.hexMark + this.wout() + ")"; // not ix,iy
                            }
                            else { // b3=0  ld (xxyy),dd
                                out = "LD (" + Z80Disass.hexMark + this.wout() + ")," + this.wregout(this.dissOp >> 4);
                            }
                            break;
                        case 4: // neg
                            if (this.dissOp === 0x44) {
                                out = "NEG";
                            }
                            else {
                                out = "*NEG"; // 4c,54,5c,64,6c,74,7c
                            }
                            break;
                        case 5: // retn, reti
                            if (this.dissOp === 0x45) {
                                out = "RETN";
                            }
                            else if (this.dissOp === 0x4d) {
                                out = "RETI";
                            }
                            else if ((this.dissOp & 0x0f) === 0x05) {
                                out = "*RETN"; // 55,65,75
                            }
                            else {
                                out = "*RETI"; // 5d,6d,7d
                            }
                            break;
                        case 6: // im 0; im 1; im 2
                            switch (this.dissOp) {
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
                            switch ((this.dissOp >> 3) & 0x07) { // b3,b4,b5
                                case 0:
                                    out = "LD I,A";
                                    break;
                                case 1:
                                    out = "LD R,A";
                                    break;
                                case 2:
                                    out = "LD A,I"; // 0x57
                                    break;
                                case 3:
                                    out = "LD A,R"; // 0x5f
                                    break;
                                case 4:
                                    out = "RRD"; // 0x67
                                    break;
                                case 5:
                                    out = "RLD"; // 0x6f
                                    break;
                                case 6:
                                    this.operUnknown(); // 0x77
                                    break;
                                case 7:
                                    this.operUnknown(); // 0x7f
                                    break;
                                default:
                                    break;
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
                case 2: // 80-bf // ...
                    if ((this.dissOp & 0x24) === 0x20) { // b5=1 and b2=0
                        switch (this.dissOp & 0x03) { // b0,b1
                            case 0:
                                switch ((this.dissOp >> 3) & 0x03) { // b3,b4
                                    case 0:
                                        out = "LDI";
                                        break;
                                    case 1:
                                        out = "LDD";
                                        break;
                                    case 2:
                                        out = "LDIR";
                                        break;
                                    case 3:
                                        out = "LDDR";
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            case 1:
                                switch ((this.dissOp >> 3) & 0x03) { // b3,b4
                                    case 0:
                                        out = "CPI";
                                        break;
                                    case 1:
                                        out = "CPD";
                                        break;
                                    case 2:
                                        out = "CPIR";
                                        break;
                                    case 3:
                                        out = "CPDR";
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            case 2:
                                switch ((this.dissOp >> 3) & 0x03) { // b3,b4
                                    case 0:
                                        out = "INI";
                                        break;
                                    case 1:
                                        out = "IND";
                                        break;
                                    case 2:
                                        out = "INIR";
                                        break;
                                    case 3:
                                        out = "INDR";
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            case 3:
                                switch ((this.dissOp >> 3) & 0x03) { // b3,b4
                                    case 0:
                                        out = "OUTI";
                                        break;
                                    case 1:
                                        out = "OUTD";
                                        break;
                                    case 2:
                                        out = "OTIR";
                                        break;
                                    case 3:
                                        out = "OTDR";
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    else {
                        this.operUnknown();
                    }
                    break;
                case 3: // c0-f8 // missing
                    this.operUnknown();
                    break;
            }
            this.out += out;
            //return out;
        };
        // disassembles next instruction; returns command-length in bytes
        Z80Disass.prototype.getNextLine = function () {
            this.out = "";
            this.prefix = 0;
            this.dissOp = this.readByte(this.disassPC);
            this.disassPC += 1;
            if (this.dissOp === 0xED) {
                this.prefix = 1;
            }
            else if (this.dissOp === 0xDD) {
                this.prefix = 2;
            }
            else if (this.dissOp === 0xFD) {
                this.prefix = 3;
            }
            if (this.prefix) {
                this.dissOp = this.readByte(this.disassPC);
                this.disassPC += 1;
            }
            if (this.prefix === 1) {
                this.operdisED();
            }
            else {
                switch (this.dissOp >> 6) { // test b6,7
                    case 0: // 00-3f
                        switch (this.dissOp & 0x07) { // test b0,b1,b2
                            case 0: // nop; ex af,af'; djnz; jr; jr nz,z,nc,c
                                this.operdis00();
                                break;
                            case 1: // ld dd,xxyy; add hl,dd
                                this.operdis01();
                                break;
                            case 2: // ld (xxyy),a; ld (bc de),a ld a,(bc de); ld (xxyy),hl
                                this.operdis02();
                                break;
                            case 3: // inc dd; dec dd
                                this.operdis03();
                                break;
                            case 4: // inc rrr
                                this.operdis04();
                                break;
                            case 5: // dec rrr
                                this.operdis05();
                                break;
                            case 6: // ld rrr,xx
                                this.operdis06();
                                break;
                            case 7: // rlca,rrca,rla,rra; scf,ccf; daa,cpl
                                this.operdis07();
                                break;
                            default:
                                break;
                        }
                        break;
                    case 1: // 40-7f // halt; ld rrr,rrr2
                        this.operdis10();
                        break;
                    case 2: // 80-bf // add,adc,sub,sbc,and,xor,or,cp a,rrr
                        this.operdis20();
                        break;
                    case 3: // c0-ff
                        switch (this.dissOp & 0x07) { // test b0,b1,b2
                            case 0: // ret ccc
                                this.operdis30();
                                break;
                            case 1: // pop ee; ld sp,hl; jp (hl); ret; exx
                                this.operdis31();
                                break;
                            case 2: // jp ccc,xxyy
                                this.operdis32();
                                break;
                            case 3: // ex (sp),hl; out (xx),a; di,ei; jp xxyy; ex de,hl; CB
                                this.operdis33();
                                break;
                            case 4: // call ccc,xxyy
                                this.operdis34();
                                break;
                            case 5: // push ee; call xxyy; [ED; IX IY]
                                this.operdis35();
                                break;
                            case 6: // add,adc,sub,sbc,and,xor,or,cp a,xx
                                this.operdis36();
                                break;
                            case 7: // rst ppp
                                this.operdis37();
                                break;
                            default:
                                break;
                        }
                        break;
                    default:
                        break;
                }
            }
            return this.out;
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
        return Z80Disass;
    }());
    exports.Z80Disass = Z80Disass;
});
/* eslint-disable no-bitwise */
// end
//# sourceMappingURL=Z80Disass.js.map