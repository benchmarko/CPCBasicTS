// CodeGeneratorBasic.qunit.ts - QUnit tests for CPCBasic CodeGeneratorBasic
//

import { Utils } from "../Utils";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { CodeGeneratorBasic } from "../CodeGeneratorBasic";
import { TestHelper, TestsType, AllTestsType, ResultType } from "./TestHelper";
import { TestInput } from "./TestInput";

/* eslint-disable quote-props */
const allTests: AllTestsType = {
	numbers: {
		"a=1": "a=1",
		"a=1.2": "a=1.2",
		"a=-1.2": "a=-1.2",
		"a=+7.2": "a=+7.2",
		"a=&0": "a=&0",
		"a=&A7": "a=&A7",
		"a=-&A7": "a=-&A7",
		"a=&7FFF": "a=&7FFF",
		"a=&h0": "a=&H0",
		"a=&H7FFF": "a=&H7FFF",
		"a=&8000": "a=&8000",
		"a=&FFff": "a=&FFFF",
		"a=&E123": "a=&E123",
		"a=&HE123": "a=&HE123",
		"a=&X0": "a=&X0",
		"a=&X10100111": "a=&X10100111",
		"a=-&x111111111111111": "a=-&X111111111111111",
		"a=255": "a=255",
		"a=-255": "a=-255",
		"a=256": "a=256",
		"a=-256": "a=-256",
		"a=32767": "a=32767",
		"a=-32767": "a=-32767",
		"a=32768": "a=32768",
		"a=-32768": "a=-32768",
		"a=65536": "a=65536",
		"a=1.2e+9": "a=1.2E+09",
		"a=&": "BasicLexer: Expected hex number at pos 2-3: &",
		"a=&h": "BasicLexer: Expected hex number at pos 2-4: &h",
		"a=&x": "BasicLexer: Expected binary number at pos 2-4: &x",
		"a=&x2": "BasicLexer: Expected binary number at pos 2-4: &x",
		"a": "BasicParser: Expected = at pos 1: (end)",
		"1 a=": "BasicParser: Unexpected end of file in 1 at pos 4: ",
		"1 5=7": "BasicParser: Bad expression statement in 1 at pos 2-3: 5",
		"1 let 5=7": "BasicParser: Expected variable in 1 at pos 6-7: 5"
	},
	strings: {
		'a$="a12"': 'a$="a12"',
		'a$=+"7.1"': 'a$=+"7.1"',
		'a$="\\"': 'a$="\\"',
		'a$="unterminated string': 'a$="unterminated string',
		'a$="string with\nnewline"': 'a$="string with\nnewline"',
		'a$="unterminated string with\nnewline=7': 'a$="unterminated string with\nnewline=7',
		'1 a$="unterminated string\n2 newline=7': '1 a$="unterminated string\n2 newline=7'
	},
	variables: {
		"a!=1.4": "a!=1.4",
		"a%=1.4": "a%=1.4",
		'a$="1.4"': 'a$="1.4"',
		"case=1": "case=1",
		"CASE=1": "CASE=1",
		"CaSe=cAsE": "CaSe=cAsE",
		"insert.line=2": "insert.line=2",
		"in.ser.t.lin.e=2": "in.ser.t.lin.e=2",
		"a!(2)=1.4": "a!(2)=1.4",
		"a%(2)=1.4": "a%(2)=1.4",
		'a$(2)="1.4"': 'a$(2)="1.4"',
		'a$[2]="1.4"': 'a$[2]="1.4"',
		"a(9)=b(1,2)": "a(9)=b(1,2)",
		"a[9]=b[1,2]": "a[9]=b[1,2]",
		"a(10,10,10)=b(10,9)": "a(10,10,10)=b(10,9)",
		"a!(1.4)=b!(1.5,2.4,1)": "a!(1.4)=b!(1.5,2.4,1)",
		"a!(b+1)=b!(a,a%*2,a%+1.5)": "a!(b+1)=b!(a,a%*2,a%+1.5)",
		"a!(b+1)=b!(int(a),a%*2,a%-1+&d)": "a!(b+1)=b!(INT(a),a%*2,a%-1+&D)",
		"1 a$=a%": "1 a$=a%",
		"1 a$=a!": "1 a$=a!",
		"1 abc=def": "BasicParser: Unexpected token in 1 at pos 6-9: def"
	},
	expressions: {
		"a=1+2+3": "a=1+2+3",
		"a=3-2-1:": "a=3-2-1:",
		"a=&A7+&X10100111-(123-27)": "a=&A7+&X10100111-(123-27)",
		"a=(3+2)*(3-7)": "a=(3+2)*(3-7)",
		"a=-(10-7)-(-6-2)": "a=-(10-7)-(-6-2)",
		"a=20/2.5": "a=20/2.5",
		"a=20\\3": "a=20\\3",
		"a=3^2:": "a=3^2:",
		"a=&X1001 AND &X1110": "a=&X1001 AND &X1110",
		"a=&X1001 OR &X110": "a=&X1001 OR &X110",
		"a=&X1001 XOR &X1010": "a=&X1001 XOR &X1010",
		"a=NOT &X1001": "a=NOT &X1001",
		"a=+++++++++---9": "a=+++++++++---9",
		"a=(1=0)": "a=(1=0)",
		"a=(1>0)*(0<1)": "a=(1>0)*(0<1)",
		"a=(b%>=c%)*(d<=e)": "a=(b%>=c%)*(d<=e)",
		"a=1=1=-1": "a=1=1=-1",
		"a=1>=1>1": "a=1>=1>1"
	},
	"Line numbers": {
		"1": "1",
		"0 cls": "0 CLS",
		"65535 cls": "65535 CLS",
		"65536 cls": "65536 CLS",
		"1.2 cls": "1.2 CLS",
		"2 cls\n1 cls": "2 CLS\n1 CLS"
	},
	special: {
		"!": "BasicLexer: Unrecognized token at pos 0-1: !"
	},
	"abs, after gosub, and, asc, atn, auto": {
		"a=abs(2.3)": "a=ABS(2.3)",
		"10 after 2 gosub 10": "10 AFTER 2 GOSUB 10",
		"10 after 3,1 gosub 10": "10 AFTER 3,1 GOSUB 10",
		"1 after gosub 1": "BasicParser: Unexpected token in 1 at pos 8-13: gosub",
		"1 after 1,2,3 gosub 1": "BasicParser: Expected end of arguments in 1 at pos 11-12: ,",
		"a=b and c": "a=b AND c",
		'a=asc("A")': 'a=ASC("A")',
		"a!=asc(b$) and c%": "a!=ASC(b$) AND c%",
		"a=atn(2.3)": "a=ATN(2.3)",
		"auto": "AUTO",
		"auto 100": "AUTO 100"
	},
	"bin$, border": {
		"a$=bin$(3)": "a$=BIN$(3)",
		"a$=bin$(3,8)": "a$=BIN$(3,8)",
		"a$=bin$(&x1001)": "a$=BIN$(&X1001)",
		"border 5": "BORDER 5",
		"border 5,a": "BORDER 5,a"
	},
	"call, cat, chain, chain merge, chr$, cint, clg, closein, closeout, cls, cont, copychr$, cos, creal, cursor": {
		"call&a7bc": "CALL &A7BC",
		"call 4711,1,2,3,4": "CALL 4711,1,2,3,4",
		"cat": "CAT",
		'chain"f1"': 'CHAIN "f1"',
		'chain"f2" , 10': 'CHAIN "f2",10',
		'chain"f3" , 10+3': 'CHAIN "f3",10+3',
		'chain "f4" , 10+3, delete 100-200': 'CHAIN "f4",10+3,DELETE 100-200',
		'chain "f5" , , delete 100-200': 'CHAIN "f5",,DELETE 100-200',
		'chain merge "f1"': 'CHAIN MERGE "f1"',
		'chain merge "f2" , 10': 'CHAIN MERGE "f2",10',
		'chain merge "f3" , 10+3': 'CHAIN MERGE "f3",10+3',
		'chain merge "f4" , 10+3, delete 100-200': 'CHAIN MERGE "f4",10+3,DELETE 100-200',
		'chain merge "f5" , , delete 100-200': 'CHAIN MERGE "f5",,DELETE 100-200',
		"a=chr$(65)": "a=CHR$(65)",
		"a=cint(2.3)": "a=CINT(2.3)",
		"clear": "CLEAR",
		"clear input": "CLEAR INPUT",
		"clg": "CLG",
		"clg 15-1": "CLG 15-1",
		"closein": "CLOSEIN",
		"closeout": "CLOSEOUT",
		"cls": "CLS",
		"cls #5": "CLS #5",
		"cls #a+7-2*b": "CLS #a+7-2*b",
		"cont": "CONT",
		"a$=copychr$(#0)": "a$=COPYCHR$(#0)",
		"a$=copychr$(#a+1)": "a$=COPYCHR$(#a+1)",
		"a=cos(2.3)": "a=COS(2.3)",
		"a=creal(2.3+a)": "a=CREAL(2.3+a)",
		"cursor": "CURSOR",
		"cursor 0": "CURSOR 0",
		"cursor 1": "CURSOR 1",
		"cursor 1,1": "CURSOR 1,1",
		"cursor ,1": "CURSOR ,1",
		"cursor #2": "CURSOR #2",
		"cursor #2,1": "CURSOR #2,1",
		"cursor #2,1,1": "CURSOR #2,1,1",
		"cursor #2,,1": "CURSOR #2,,1"
	},
	"data, dec$, def fn, defint, defreal, defstr, deg, delete, derr, di, dim, draw, drawr": {
		"data": "DATA",
		"data ,": "DATA ,",
		"data \\": "DATA \\",
		"data 1,2,3": "DATA 1,2,3",
		'data "item1"," item2","item3 "': 'DATA "item1"," item2","item3 "',
		"data item1,item2,item3": "DATA item1,item2,item3",
		"data &a3,4,abc,": "DATA &a3,4,abc,",
		'data " ",!"#$%&\'()*+,","': 'DATA " ",!"#$%&\'()*+,","',
		'data "string in data with\nnewline"': 'DATA "string in data with\nnewline"',
		'a$=dec$(3,"##.##")': 'a$=DEC$(3,"##.##")',
		"def fnclk=10": "DEF FNclk=10",
		"def fnclk(a)=a*10": "DEF FNclk(a)=a*10",
		"def fnclk(a,b)=a*10+b": "DEF FNclk(a,b)=a*10+b",
		"def fnclk$(a$,b$)=a$+b$": "DEF FNclk$(a$,b$)=a$+b$",
		"def fn clk=10": "DEF FN clk=10",
		"def fn clk(a)=a*10": "DEF FN clk(a)=a*10",
		"def fn clk(a,b)=a*10+b": "DEF FN clk(a,b)=a*10+b",
		"def fn clk$(a$,b$)=a$+b$": "DEF FN clk$(a$,b$)=a$+b$",
		"def fncls=1": "BasicParser: Expected identifier at pos 6-9: cls",
		"def fncls1(x+1)=1": "BasicParser: Expected variable at pos 12-13: +",
		"def fx=1": "BasicParser: Expected fn at pos 4-6: fx",
		"def fx y=1": "BasicParser: Expected fn at pos 4-6: fx",
		"defint a": "DEFINT a",
		"defint a-t": "DEFINT a-t",
		"defint a-T": "DEFINT a-T",
		"defint a,b,c": "DEFINT a,b,c",
		"defint a,b-c,v,x-y": "DEFINT a,b-c,v,x-y",
		"defint a:b=a+c": "DEFINT a:b=a+c",
		"defint a:a=a+1": "DEFINT a:a=a+1",
		'defint a:a!=a!+a%:a$="7"': 'DEFINT a:a!=a!+a%:a$="7"',
		"defint a:ab=ab+de[7]": "DEFINT a:ab=ab+de[7]",
		"1 defint z-a": "1 DEFINT z-a",
		"defreal a": "DEFREAL a",
		"defreal a-t": "DEFREAL a-t",
		"defreal a-T": "DEFREAL a-T",
		"defreal a,b,c": "DEFREAL a,b,c",
		"defreal a,b-c,v,x-y": "DEFREAL a,b-c,v,x-y",
		"defreal a:b=a+c": "DEFREAL a:b=a+c",
		"defreal a:a=a+1": "DEFREAL a:a=a+1",
		'defreal a:a!=a!+a%:a$="7"': 'DEFREAL a:a!=a!+a%:a$="7"',
		"defreal a:ab=ab+de[7]": "DEFREAL a:ab=ab+de[7]",
		"1 defreal z-a": "1 DEFREAL z-a",
		"defstr a": "DEFSTR a",
		"defstr a-t": "DEFSTR a-t",
		"defstr a-T": "DEFSTR a-T",
		"defstr a,b,c": "DEFSTR a,b,c",
		"defstr a,b-c,v,x-y": "DEFSTR a,b-c,v,x-y",
		"defstr a:b=a+c": "DEFSTR a:b=a+c",
		"defstr a:a=a+1": "DEFSTR a:a=a+1",
		'defstr a:a!=a!+a%:a$="7"': 'DEFSTR a:a!=a!+a%:a$="7"',
		"defstr a:ab=ab+de[7]": "DEFSTR a:ab=ab+de[7]",
		"1 defstr z-a": "1 DEFSTR z-a",
		'defstr f:f(x)="w"': 'DEFSTR f:f(x)="w"',
		"deg": "DEG",
		"delete": "DELETE",
		"delete -": "DELETE -",
		"delete ,": "DELETE ,",
		"delete -,": "DELETE -,",
		"delete 10": "DELETE 10",
		"delete 1-": "DELETE 1-",
		"delete -1": "DELETE -1",
		"delete 1-2": "DELETE 1-2",
		"1 delete 2-1": "1 DELETE 2-1",
		"1 delete 1+2": "BasicParser: Expected : in 1 at pos 10-11: +",
		"1 delete a": "BasicParser: Expected : in 1 at pos 9-10: a",
		"a=derr": "a=DERR",
		"di": "DI",
		"dim a(1)": "DIM a(1)",
		"dim a!(1)": "DIM a!(1)",
		"dim a%(1)": "DIM a%(1)",
		"dim a$(1)": "DIM a$(1)",
		"dim a(2,13)": "DIM a(2,13)",
		"dim a(2,13+7),b$[3],c![2*a,7]": "DIM a(2,13+7),b$[3],c![2*a,7]",
		"dim a[2,13)": "DIM a[2,13)",
		"draw 10,20": "DRAW 10,20",
		"draw -10,-20,7": "DRAW -10,-20,7",
		"draw 10,20,7,3": "DRAW 10,20,7,3",
		"draw 10,20,,3": "DRAW 10,20,,3",
		"draw x,y,m,g1": "DRAW x,y,m,g1",
		"drawr 10,20": "DRAWR 10,20",
		"drawr -10,-20,7": "DRAWR -10,-20,7",
		"drawr 10,20,7,3": "DRAWR 10,20,7,3",
		"drawr 10,20,,3": "DRAWR 10,20,,3",
		"drawr x,y,m,g1": "DRAWR x,y,m,g1"
	},
	"edit, ei, else, end, ent, env, eof, erase, erl, err, error, every gosub, exp": {
		"edit 20": "EDIT 20",
		"ei": "EI",
		"else": "ELSE",
		"else 10": "ELSE 10",
		"else a=7": "ELSE a = 7",
		"end": "END",
		"ent 1": "ENT 1",
		"ent 1,2,a,4": "ENT 1,2,a,4",
		"ent num,steps,dist,ti,steps2,dist2,ti2": "ENT num,steps,dist,ti,steps2,dist2,ti2",
		"ent num,=period,ti,=period2,ti2": "ENT num,=period,ti,=period2,ti2",
		"env 1": "ENV 1",
		"env 1,2,a,4": "ENV 1,2,a,4",
		"env num,steps,dist,ti,steps2,dist2,ti2": "ENV num,steps,dist,ti,steps2,dist2,ti2",
		"env num,=reg,period,=reg2,period2": "ENV num,=reg,period,=reg2,period2",
		"a=eof": "a=EOF",
		"erase a": "ERASE a",
		"erase b$": "ERASE b$",
		"erase a,b$,c!,d%": "ERASE a,b$,c!,d%",
		"1 erase 5": "BasicParser: Expected variable in 1 at pos 8-9: 5",
		"a=erl": "a=ERL",
		"a=err": "a=ERR",
		"error 7": "ERROR 7",
		"error 5+a": "ERROR 5+a",
		"10 every 50 gosub 10": "10 EVERY 50 GOSUB 10",
		"10 every 25.2,1 gosub 10": "10 EVERY 25.2,1 GOSUB 10",
		"10 every 10+a,b gosub 10": "10 EVERY 10+a,b GOSUB 10",
		"a=exp(2.3)": "a=EXP(2.3)"
	},
	"fill, fix, fn, for, frame, fre": {
		"fill 7": "FILL 7",
		"a=fix(2.3)": "a=FIX(2.3)",
		"x=fnclk": "x=FNclk",
		"x=fnclk(a)": "x=FNclk(a)",
		"x=fnclk(a,b)": "x=FNclk(a,b)",
		"x$=fnclk$(a$,b$)": "x$=FNclk$(a$,b$)",
		"x=fn clk": "x=FN clk",
		"x=fn clk(a)": "x=FN clk(a)",
		"x=fn clk(a,b)": "x=FN clk(a,b)",
		"x$=fn clk$(a$,b$)": "x$=FN clk$(a$,b$)",
		"for a=1 to 10": "FOR a=1 TO 10",
		"for a%=1.5 to 9.5": "FOR a%=1.5 TO 9.5",
		"for a!=1.5 to 9.5": "FOR a!=1.5 TO 9.5",
		"for a=1 to 10 step 3": "FOR a=1 TO 10 STEP 3",
		"for a=5+b to -4 step -2.3": "FOR a=5+b TO -4 STEP -2.3",
		"for a=b to c step d": "FOR a=b TO c STEP d",
		"for a=b% to c%": "FOR a=b% TO c%",
		"for a=1 to 1 step 0": "FOR a=1 TO 1 STEP 0",
		"for a=b to c step s": "FOR a=b TO c STEP s",
		"for a=1 to 2 step 0": "FOR a=1 TO 2 STEP 0",
		"for a=-1 to -2 step 0": "FOR a=-1 TO -2 STEP 0",
		"1 for a$=1 to 2": "1 FOR a$=1 TO 2",
		"defint a:for abc=1 to 10 step 3:next abc": "DEFINT a:FOR abc=1 TO 10 STEP 3:NEXT abc",
		"defstr a:for abc=1 to 10 step 3:next abc": "DEFSTR a:FOR abc=1 TO 10 STEP 3:NEXT abc",
		"for a=b to c step s:defint a-b:a=0:defreal a:next": "FOR a=b TO c STEP s:DEFINT a-b:a=0:DEFREAL a:NEXT",
		"frame": "FRAME",
		"a=fre(0)": "a=FRE(0)",
		'a=fre("")': 'a=FRE("")',
		"a=fre(b-2)": "a=FRE(b-2)",
		"a=fre(a$)": "a=FRE(a$)"
	},
	"gosub, goto, graphics paper, graphics pen": {
		"10 gosub 10": "10 GOSUB 10",
		"1 gosub a": "BasicParser: Expected line number in 1 at pos 8-9: a",
		"10 goto 10": "10 GOTO 10",
		"1 goto a": "BasicParser: Expected line number in 1 at pos 7-8: a",
		"graphics paper 5": "GRAPHICS PAPER 5",
		"graphics paper 2.3*a": "GRAPHICS PAPER 2.3*a",
		"graphics pen 5": "GRAPHICS PEN 5",
		"graphics pen 5,1": "GRAPHICS PEN 5,1",
		"graphics pen ,0": "GRAPHICS PEN ,0",
		"graphics pen 2.3*a,1+b": "GRAPHICS PEN 2.3*a,1+b"
	},
	"hex$, himem": {
		"a$=hex$(16)": "a$=HEX$(16)",
		"a$=hex$(16,4)": "a$=HEX$(16,4)",
		"a$=hex$(a,b)": "a$=HEX$(a,b)",
		"a=himem": "a=HIMEM"
	},
	"if, ink, inkey, inkey$, inp, input, instr, int": {
		"if a=1 then a=2": "IF a=1 THEN a=2",
		"if a=1 then a=2 else a=1": "IF a=1 THEN a=2 ELSE a=1",
		"if a=1 then": "IF a=1 THEN",
		"if a=1 then else": "IF a=1 THEN ELSE",
		"if a=1 then a=2 else": "IF a=1 THEN a=2 ELSE",
		"if a=1 then else a=1": "IF a=1 THEN ELSE a=1",
		"if a=1 then if b=1 then else else a=1": "IF a=1 THEN IF b=1 THEN ELSE ELSE a=1",
		"10 if a=1 then goto 10": "10 IF a=1 THEN GOTO 10",
		"10 if a=1 then 10": "10 IF a=1 THEN 10",
		"10 if a=1 goto 10": "10 IF a=1 GOTO 10",
		"10 if a=1 then a=a+1:goto 10": "10 IF a=1 THEN a=a+1:GOTO 10",
		"10 if a=1 then gosub 10": "10 IF a=1 THEN GOSUB 10",
		"10 if a=1 then 10:a=never1": "10 IF a=1 THEN 10:a=never1",
		"10 if a=1 then 10 else 20\n20 rem": "10 IF a=1 THEN 10 ELSE 20\n20 REM",
		"10 if a=1 then 10 else goto 20\n20 rem": "10 IF a=1 THEN 10 ELSE GOTO 20\n20 REM",
		"10 if a=b+5*c then a=a+1: goto 10 else a=a-1:goto 20\n20 rem": "10 IF a=b+5*c THEN a=a+1:GOTO 10 ELSE a=a-1:GOTO 20\n20 REM",
		"10 if a%<>3 then 10": "10 IF a%<>3 THEN 10",
		'10 if a$<>"3" then 10': '10 IF a$<>"3" THEN 10',
		"ink 2,19": "INK 2,19",
		"ink 2,19,22": "INK 2,19,22",
		"ink a*2,b-1,c": "INK a*2,b-1,c",
		"a=inkey(0)": "a=INKEY(0)",
		"a$=inkey$": "a$=INKEY$",
		"a=inp(&ff77)": "a=INP(&FF77)",
		"input a$": "INPUT a$",
		"input a$,b": "INPUT a$,b",
		"input ;a$,b": "INPUT ;a$,b",
		'input "para",a$,b': 'INPUT "para",a$,b',
		'input "para";a$,b': 'INPUT "para";a$,b',
		'input ;"para noCRLF";a$,b': 'INPUT ;"para noCRLF";a$,b',
		'input#2,;"para noCRLF";a$,b': 'INPUT #2,;"para noCRLF";a$,b',
		'input#stream,;"string";a$,b': 'INPUT #stream,;"string";a$,b',
		'a=instr("key","ey")': 'a=INSTR("key","ey")',
		"a=instr(s$,find$)": "a=INSTR(s$,find$)",
		"a=instr(start,s$,find$)": "a=INSTR(start,s$,find$)",
		"a=int(-2.3)": "a=INT(-2.3)",
		"a=int(b+2.3)": "a=INT(b+2.3)"
	},
	joy: {
		"a=joy(0)": "a=JOY(0)",
		"a=joy(b+1)": "a=JOY(b+1)"
	},
	"key, key def": {
		'key 11,"border 13:paper 0"': 'KEY 11,"border 13:paper 0"',
		"key a,b$": "KEY a,b$",
		"key def 68,1": "KEY DEF 68,1",
		"key def 68,1,159": "KEY DEF 68,1,159",
		"key def 68,1,159,160": "KEY DEF 68,1,159,160",
		"key def 68,1,159,160,161": "KEY DEF 68,1,159,160,161",
		"key def num,fire,normal,shift,ctrl": "KEY DEF num,fire,normal,shift,ctrl"
	},
	"left$, len, let, line input, list, load, locate, log, log10, lower$": {
		"a$=left$(b$,n)": "a$=LEFT$(b$,n)",
		"a=len(a$)": "a=LEN(a$)",
		"let a=a+1": "LET a=a+1",
		"line input a$": "LINE INPUT a$",
		"line input ;a$": "LINE INPUT ;a$",
		'line input "para",a$': 'LINE INPUT "para",a$',
		'line input "para";a$': 'LINE INPUT "para";a$',
		'line input ;"para noCRLF";a$': 'LINE INPUT ;"para noCRLF";a$',
		'line input#2,;"para noCRLF";a$': 'LINE INPUT #2,;"para noCRLF";a$',
		'line input#stream,;"string";a$': 'LINE INPUT #stream,;"string";a$',
		"list": "LIST",
		"list -": "LIST -",
		"list ,": "LIST ,",
		"list -,": "LIST -,",
		"list 10": "LIST 10",
		"list 1-": "LIST 1-",
		"list -1": "LIST -1",
		"list 1-2": "LIST 1-2",
		"list #3": "LIST #3",
		"list ,#3": "LIST ,#3",
		"list 10,#3": "LIST 10,#3",
		"list 1-,#3": "LIST 1-,#3",
		"list -1,#3": "LIST -1,#3",
		"list 1-2,#3": "LIST 1-2,#3",
		"list a": "BasicParser: Expected end of arguments at pos 0-4: list",
		'load "file"': 'LOAD "file"',
		'load "file.scr",&c000': 'LOAD "file.scr",&C000',
		"load f$,adr": "LOAD f$,adr",
		"locate 10,20": "LOCATE 10,20",
		"locate#2,10,20": "LOCATE #2,10,20",
		"locate#stream,x,y": "LOCATE #stream,x,y",
		"a=log(10)": "a=LOG(10)",
		"a=log10(10)": "a=LOG10(10)",
		"a$=lower$(b$)": "a$=LOWER$(b$)",
		'a$=lower$("String")': 'a$=LOWER$("String")'
	},
	"mask, max, memory, merge, mid$, min, mod, mode, move, mover": {
		"mask &x10101011": "MASK &X10101011",
		"mask 2^(8-x),1": "MASK 2^(8-x),1",
		"mask a,b": "MASK a,b",
		"mask ,b": "MASK ,b",
		"a=max(1)": "a=MAX(1)",
		"a=max(1,5)": "a=MAX(1,5)",
		"a=max(b,c,d)": "a=MAX(b,c,d)",
		'a$=max("abc")': 'a$=MAX("abc")',
		'1 a$=max("abc","d")': '1 a$=MAX("abc","d")',
		"memory &3fff": "MEMORY &3FFF",
		"memory adr": "MEMORY adr",
		'merge "file"': 'MERGE "file"',
		"merge f$": "MERGE f$",
		'a$=mid$("string",3)': 'a$=MID$("string",3)',
		'a$=mid$("string",3,2)': 'a$=MID$("string",3,2)',
		"a$=mid$(b$,p)": "a$=MID$(b$,p)",
		"a$=mid$(b$,p,lg)": "a$=MID$(b$,p,lg)",
		"mid$(a$,2)=b$": "MID$(a$,2)=b$",
		"mid$(a$,2,2)=b$": "MID$(a$,2,2)=b$",
		'mid$(a$,b%,c!)="string"': 'MID$(a$,b%,c!)="string"',
		"a=min(1)": "a=MIN(1)",
		"a=min(1,5)": "a=MIN(1,5)",
		"a=min(b,c,d)": "a=MIN(b,c,d)",
		'a$=min("abc")': 'a$=MIN("abc")',
		'1 a$=min("abc","d")': '1 a$=MIN("abc","d")',
		"a=10 mod 3": "a=10 MOD 3",
		"a=b mod -c": "a=b MOD -c",
		"mode 0": "MODE 0",
		"mode n+1": "MODE n+1",
		"move 10,20": "MOVE 10,20",
		"move -10,-20,7": "MOVE -10,-20,7",
		"move 10,20,7,3": "MOVE 10,20,7,3",
		"move 10,20,,3": "MOVE 10,20,,3",
		"move x,y,m,g1": "MOVE x,y,m,g1",
		"mover 10,20": "MOVER 10,20",
		"mover -10,-20,7": "MOVER -10,-20,7",
		"mover 10,20,7,3": "MOVER 10,20,7,3",
		"mover 10,20,,3": "MOVER 10,20,,3",
		"mover x,y,m,g1": "MOVER x,y,m,g1"
	},
	"new, next, not": {
		"new": "NEW",
		"for a=1 to 2: next": "FOR a=1 TO 2:NEXT",
		"for i=1 to 2: next i": "FOR i=1 TO 2:NEXT i",
		"for j=1 to 2:for i=3 to 4: next i,j": "FOR j=1 TO 2:FOR i=3 TO 4:NEXT i,j",
		"a=not 2": "a=NOT 2",
		"a=not -b": "a=NOT -b"
	},
	"on break ..., on error goto, on gosub, on goto, on sq gosub, openin, openout, or, origin, out": {
		"on break cont": "ON BREAK CONT",
		"10 on break gosub 10": "10 ON BREAK GOSUB 10",
		"on break stop": "ON BREAK STOP",
		"10 on error goto 0": "10 ON ERROR GOTO 0",
		"10 on error goto 10": "10 ON ERROR GOTO 10",
		"1 on error goto 0:a=asc(0)": "BasicParser: Expected string in 1 at pos 24-25: 0",
		"1 on error goto 2:a=asc(0)\n2 rem": "1 ON ERROR GOTO 2:a=ASC(0)\n2 REM",
		'1 on error goto 0:?chr$("A")': "BasicParser: Expected number in 1 at pos 25-26: A",
		'1 on error goto 2:?chr$("A")\n2 rem': '1 ON ERROR GOTO 2:?CHR$("A")\n2 REM',
		'1 on error goto 0:a$=dec$(b$,"\\    \\")': "BasicParser: Expected number in 1 at pos 26-28: b$",
		'1 on error goto 2:a$=dec$(b$,"\\    \\")\n2 rem': '1 ON ERROR GOTO 2:a$=DEC$(b$,"\\    \\")\n2 REM',
		"1 on error goto 0:mask ,": "BasicParser: Operand missing in 1 at pos 23-24: ,",
		"1 on error goto 2:mask ,\n2 rem": "1 ON ERROR GOTO 2:MASK ,\n2 REM",
		"10 on 1 gosub 10": "10 ON 1 GOSUB 10",
		"10 on x gosub 10,20\n20 rem": "10 ON x GOSUB 10,20\n20 REM",
		"10 on x+1 gosub 10,20,20\n20 rem": "10 ON x+1 GOSUB 10,20,20\n20 REM",
		"10 on 1 goto 10": "10 ON 1 GOTO 10",
		"10 on x goto 10,20\n20 rem": "10 ON x GOTO 10,20\n20 REM",
		"10 on x+1 goto 10,20,20\n20 rem": "10 ON x+1 GOTO 10,20,20\n20 REM",
		"10 on sq(1) gosub 10": "10 ON SQ(1) GOSUB 10",
		"10 on sq(channel) gosub 10": "10 ON SQ(channel) GOSUB 10",
		'openin "file"': 'OPENIN "file"',
		"openin f$": "OPENIN f$",
		'openout "file"': 'OPENOUT "file"',
		"openout f$": "OPENOUT f$",
		"a=1 or &1a0": "a=1 OR &1A0",
		"a=b or c": "a=b OR c",
		"origin 10,20": "ORIGIN 10,20",
		"origin 10,20,5,200,50,15": "ORIGIN 10,20,5,200,50,15",
		"origin x,y,left,right,top,bottom": "ORIGIN x,y,left,right,top,bottom",
		"out &bc12,&12": "OUT &BC12,&12",
		"out adr,by": "OUT adr,by"
	},
	"paper, peek, pen, pi, plot, plotr, poke, pos, print": {
		"paper 2": "PAPER 2",
		"paper#stream,p": "PAPER #stream,p",
		"a=peek(&c000)": "a=PEEK(&C000)",
		"a=peek(adr+5)": "a=PEEK(adr+5)",
		"pen 2": "PEN 2",
		"pen 2,1": "PEN 2,1",
		"pen#3,2,1": "PEN #3,2,1",
		"pen#stream,p,trans": "PEN #stream,p,trans",
		"a=pi": "a=PI",
		"plot 10,20": "PLOT 10,20",
		"plot -10,-20,7": "PLOT -10,-20,7",
		"plot 10,20,7,3": "PLOT 10,20,7,3",
		"plot 10,20,,3": "PLOT 10,20,,3",
		"plot x,y,m,g1": "PLOT x,y,m,g1",
		"plotr 10,20": "PLOTR 10,20",
		"plotr -10,-20,7": "PLOTR -10,-20,7",
		"plotr 10,20,7,3": "PLOTR 10,20,7,3",
		"plotr 10,20,,3": "PLOTR 10,20,,3",
		"plotr x,y,m,g1": "PLOTR x,y,m,g1",
		"poke &c000,23": "POKE &C000,23",
		"poke adr,by": "POKE adr,by",
		"a=pos(#0)": "a=POS(#0)",
		"a=pos(#stream)": "a=POS(#stream)",
		"print": "PRINT",
		"print ,": "PRINT ,",
		"print ;": "PRINT ;",
		"print #2": "PRINT #2",
		"print #2,": "PRINT #2,",
		'print "string"': 'PRINT "string"',
		"print 999999999;": "PRINT 999999999;",
		"print 1e9;": "PRINT 1E+09;",
		"print 2.5e10;": "PRINT 2.5E+10;",
		"print 1.234567846;": "PRINT 1.234567846;",
		"print a$": "PRINT a$",
		"print a$,b": "PRINT a$,b",
		"print#2,a$,b": "PRINT #2,a$,b",
		'print using"####";ri;': 'PRINT USING "####";ri;',
		'print using "##.##";-1.2': 'PRINT USING "##.##";-1.2',
		'print using"### ########";a,b': 'PRINT USING "### ########";a,b',
		'print using "\\   \\";"n1";"n2";" xx3";': 'PRINT USING "\\   \\";"n1";"n2";" xx3";',
		'print using "!";"a1";"a2";': 'PRINT USING "!";"a1";"a2";',
		'print using "&";"a1";"a2";': 'PRINT USING "&";"a1";"a2";',
		'print#9,tab(t);t$;i;"h1"': 'PRINT #9,TAB(t);t$;i;"h1"',
		"?": "?",
		"?#2,ti-t0!;spc(5);": "?#2,ti-t0!;SPC(5);"
	},
	"rad, randomize, read, release, rem, remain, renum, restore, resume, return, right$, rnd, round, run": {
		"rad": "RAD",
		"randomize": "RANDOMIZE",
		"randomize 123.456": "RANDOMIZE 123.456",
		"read a$": "READ a$",
		"read b": "READ b",
		"read a$,b,c$": "READ a$,b,c$",
		"release 1": "RELEASE 1",
		"release n+1": "RELEASE n+1",
		"rem": "REM",
		"rem comment until EOL": "REM comment until EOL",
		"rem \\": "REM \\",
		"'": "'",
		"'comment until EOL": "'comment until EOL",
		"'\\": "'\\",
		"a=1 'comment": "a=1 'comment",
		"a=remain(0)": "a=REMAIN(0)",
		"a=remain(ti)": "a=REMAIN(ti)",
		"renum": "RENUM",
		"renum 100": "RENUM 100",
		"renum 100,50": "RENUM 100,50",
		"renum 100,50,2": "RENUM 100,50,2",
		"restore": "RESTORE",
		"10 restore 10": "10 RESTORE 10",
		"resume": "RESUME",
		"10 resume 10": "10 RESUME 10",
		"resume next": "RESUME NEXT",
		"return": "RETURN",
		"a$=right$(b$,n)": "a$=RIGHT$(b$,n)",
		"a=rnd": "a=RND",
		"a=rnd(0)": "a=RND(0)",
		"a=rnd(-1*b)": "a=RND(-1*b)",
		"a=round(2.335)": "a=ROUND(2.335)",
		"a=round(2.335,2)": "a=ROUND(2.335,2)",
		"run": "RUN",
		"10 run 10": "10 RUN 10",
		'run "file"': 'RUN "file"',
		"run f$": "RUN f$"
	},
	save: {
		'save "file"': 'SAVE "file"',
		'save "file",p': 'SAVE "file",p',
		'save "file",a': 'SAVE "file",a',
		'save "file.scr",b,&c000,&4000': 'SAVE "file.scr",b,&C000,&4000',
		'save "file.bin",b,&8000,&100,&8010': 'SAVE "file.bin",b,&8000,&100,&8010',
		"save f$,b,adr,lg,entry": "SAVE f$,b,adr,lg,entry",
		"a=sgn(5)": "a=SGN(5)",
		"a=sgn(0)": "a=SGN(0)",
		"a=sgn(-5)": "a=SGN(-5)",
		"a=sin(2.3)": "a=SIN(2.3)",
		"sound 1,100": "SOUND 1,100",
		"sound 1,100,400": "SOUND 1,100,400",
		"sound 1,100,400,15": "SOUND 1,100,400,15",
		"sound 1,100,400,15,1": "SOUND 1,100,400,15,1",
		"sound 1,100,400,15,1,1": "SOUND 1,100,400,15,1,1",
		"sound 1,100,400,15,1,1,4": "SOUND 1,100,400,15,1,1,4",
		"sound ch,period,duration,,,,noise": "SOUND ch,period,duration,,,,noise",
		"sound ch,period,duration,vol,env1,ent1,noise": "SOUND ch,period,duration,vol,env1,ent1,noise",
		"a$=space$(9)": "a$=SPACE$(9)",
		"a$=space$(9+b)": "a$=SPACE$(9+b)",
		"speed ink 10,5": "SPEED INK 10,5",
		"speed ink a,b": "SPEED INK a,b",
		"speed key 10,5": "SPEED KEY 10,5",
		"speed key a,b": "SPEED KEY a,b",
		"speed write 1": "SPEED WRITE 1",
		"speed write a-1": "SPEED WRITE a-1",
		"1 speed mode 2": "BasicParser: Expected INK, KEY or WRITE in 1 at pos 8-12: mode",
		"a=sq(1)": "a=SQ(1)",
		"a=sq(channel)": "a=SQ(channel)",
		"a=sqr(9)": "a=SQR(9)",
		"stop": "STOP",
		"a$=str$(123)": "a$=STR$(123)",
		"a$=str$(a+b)": "a$=STR$(a+b)",
		'a$=string$(40,"*")': 'a$=STRING$(40,"*")',
		"a$=string$(40,42)": "a$=STRING$(40,42)",
		"a$=string$(lg,char)": "a$=STRING$(lg,char)",
		"symbol 255,1,2,3,4,5,6,7,&x10110011": "SYMBOL 255,1,2,3,4,5,6,7,&X10110011",
		"symbol 255,1": "SYMBOL 255,1",
		"symbol after 255": "SYMBOL AFTER 255"
	},
	"tag, tagoff, tan, test, testr, time, troff, tron": {
		"tag": "TAG",
		"tag#2": "TAG #2",
		"tag#stream": "TAG #stream",
		"tagoff": "TAGOFF",
		"tagoff#2": "TAGOFF #2",
		"tagoff#stream": "TAGOFF #stream",
		"a=tan(45)": "a=TAN(45)",
		"a=test(10,20)": "a=TEST(10,20)",
		"a=test(x,y)": "a=TEST(x,y)",
		"a=testr(10,-20)": "a=TESTR(10,-20)",
		"a=testr(xm,ym)": "a=TESTR(xm,ym)",
		"t!=time": "t!=TIME",
		"troff": "TROFF",
		"tron": "TRON"
	},
	"unt, upper$": {
		"a=unt(&ff66)": "a=UNT(&FF66)",
		'a$=upper$("String")': 'a$=UPPER$("String")',
		"a$=upper$(b$)": "a$=UPPER$(b$)"
	},
	"val, vpos": {
		'a=val("-2.3")': 'a=VAL("-2.3")',
		"a=val(b$)": "a=VAL(b$)",
		"a=vpos(#0)": "a=VPOS(#0)",
		"a=vpos(#stream)": "a=VPOS(#stream)"
	},
	"wait, wend, while, width, window, window swap, write": {
		"wait &ff34,20": "WAIT &FF34,20",
		"wait &ff34,20,25": "WAIT &FF34,20,25",
		"while a=10: wend": "WHILE a=10:WEND",
		"while a>0": "WHILE a>0",
		"width 40": "WIDTH 40",
		"window 10,30,5,20": "WINDOW 10,30,5,20",
		"window#1,10,30,5,20": "WINDOW #1,10,30,5,20",
		"window#stream,left,right,top,bottom": "WINDOW #stream,left,right,top,bottom",
		"window swap 1": "WINDOW SWAP 1",
		"window swap 1,0": "WINDOW SWAP 1,0",
		"1 window swap #1": "BasicParser: Expected number in 1 at pos 14-15: #",
		"write": "WRITE",
		"write #2": "WRITE #2",
		"write #2,": "WRITE #2,",
		'write "string"': 'WRITE "string"',
		"write 999999999": "WRITE 999999999",
		"write 1e9": "WRITE 1E+09",
		"write 2.5e10": "WRITE 2.5E+10",
		"write 1.234567846": "WRITE 1.234567846",
		"write a$": "WRITE a$",
		"write a$,b": "WRITE a$,b",
		"write#2,a$,b": "WRITE #2,a$,b",
		"write#2,a$;b": "WRITE #2,a$;b",
		"write ,": "BasicParser: Unexpected token at pos 6-7: ,",
		"write ;": "BasicParser: Unexpected token at pos 6-7: ;"
	},
	"xor, xpos": {
		"a=&x1001 xor &x0110": "a=&X1001 XOR &X0110",
		"a=b xor c": "a=b XOR c",
		"a=xpos": "a=XPOS"
	},
	ypos: {
		"a=ypos": "a=YPOS"
	},
	zone: {
		"zone 13+n": "ZONE 13+n"
	},
	rsx: {
		"|a": "|A",
		"|b": "|B",
		"|basic": "|BASIC",
		"|cpm": "|CPM",
		'a$="*.drw":|dir,@a$': 'a$="*.drw":|DIR,@a$',
		"|disc": "|DISC",
		"|disc.in": "|DISC.IN",
		"|disc.out": "|DISC.OUT",
		"|drive,0": "|DRIVE,0",
		"1 |drive,": "BasicParser: Expected any parameter for , in 1 at pos 9: ",
		"1 |drive,#1": "BasicParser: Unexpected stream in 1 at pos 9-10: #",
		'|era,"file.bas"': '|ERA,"file.bas"',
		'|ren,"file1.bas","file2.bas"': '|REN,"file1.bas","file2.bas"',
		"|tape": "|TAPE",
		"|tape.in": "|TAPE.IN",
		"|tape.out": "|TAPE.OUT",
		"|user,1": "|USER,1",
		"|mode,3": "|MODE,3",
		"|renum,1,2,3,4": "|RENUM,1,2,3,4",
		"|": "|"
	},
	keepSpaces: {
		' 1  chain   merge  "f5"': ' 1  CHAIN   MERGE  "f5"',
		' 1  def   fn  a$ = "abc"': ' 1  DEF   FN  a$ = "abc"',
		" 1  for   i   =   1   to  10   step  2": " 1  FOR   i   =   1   TO  10   STEP  2",
		" 1  if    a  =  1     then  1     else    goto  1": " 1  IF    a  =  1     THEN  1     ELSE    GOTO  1",
		" 1  line   input  a$": " 1  LINE   INPUT  a$",
		" 1  on  break   cont": " 1  ON  BREAK   CONT",
		" 1  on  break   gosub   1": " 1  ON  BREAK   GOSUB   1",
		" 1  on  break   stop": " 1  ON  BREAK   STOP",
		" 1  on  error   goto   1": " 1  ON  ERROR   GOTO   1",
		" 1  on  x  gosub   1  ,  2\n2  rem": " 1  ON  x  GOSUB   1  ,  2\n2  REM",
		" 1  on  x  goto   1  ,  2\n2  rem": " 1  ON  x  GOTO   1  ,  2\n2  REM",
		' 1   print   using    "####" ;  ri  ;': ' 1   PRINT   USING    "####" ;  ri  ;',
		" 1  window   swap  1,0": " 1  WINDOW   SWAP  1,0",
		"a=1 else a=2": "a=1 ELSE a=2",
		"a=1 'comment": "a=1 'comment",
		"a=1 :'comment": "a=1 :'comment",
		"::a=3-2-1: :": "::a=3-2-1: :",
		" a =  ( b% >= c%  ) *     ( d <=e )  ": " a =  ( b% >= c%  ) *     ( d <=e )  ",
		"a = (((3+2))*((3-7)))": "a = (((3+2))*((3-7)))"
	},
	PRG: {
		'100 \'Das Raetsel\n110 \'21.5.1988 Kopf um Kopf\n120 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n130 MODE 1:PRINT"Please wait ...  ( ca. 1 min 34 sec )"\n140 CLEAR:DEFINT a-y\n150 \'\n155 z=TIME\n160 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n170 de=(a*10+b)*c:IF de>99 THEN 320\n180 hi=de+(f*10+g):IF hi>99 THEN 320\n190 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n200 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 320\n210 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 320\n220 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 320\n230 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 320\n240 IF e=f OR e=g OR e=h OR e=i THEN 320\n250 IF f=g OR f=h OR f=i THEN 320\n260 IF g=h OR g=i THEN 320\n270 IF h=i THEN 320\n280 IF i=0 THEN 320\n285 z=TIME-z\n290 CLS:PRINT"Die Loesung:":PRINT\n300 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n310 PRINT z,z/300:STOP\n320 NEXT g,f,c,b,a\n': '100 \'Das Raetsel\n110 \'21.5.1988 Kopf um Kopf\n120 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n130 MODE 1:PRINT "Please wait ...  ( ca. 1 min 34 sec )"\n140 CLEAR:DEFINT a-y\n150 \'\n155 z=TIME\n160 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n170 de=(a*10+b)*c:IF de>99 THEN 320\n180 hi=de+(f*10+g):IF hi>99 THEN 320\n190 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n200 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 320\n210 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 320\n220 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 320\n230 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 320\n240 IF e=f OR e=g OR e=h OR e=i THEN 320\n250 IF f=g OR f=h OR f=i THEN 320\n260 IF g=h OR g=i THEN 320\n270 IF h=i THEN 320\n280 IF i=0 THEN 320\n285 z=TIME-z\n290 CLS:PRINT "Die Loesung:":PRINT\n300 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n310 PRINT z,z/300:STOP\n320 NEXT g,f,c,b,a\n'
	}
};
/* eslint-enable quote-props */

// notes:
// "call &a7bc": "CALL &A7BC",
//
// "a=(1=0)": "a=(1=0)", // optimal: a=1=0
// "data &a3,4,abc,": "DATA &a3,4,abc,", // &a3 is not converted
// "else a=7": "ELSE a = 7", // TODO: whitespace
// "a=1 else a=2": "a=1:ELSE a = 2", //TTT

type hooksWithCodeGeneratorBasic = NestedHooks & {
	codeGeneratorBasic: CodeGeneratorBasic
};

function createCodeGeneratorBasic(keepWhiteSpace: boolean) {
	const basicParser = new BasicParser({
			quiet: true,
			keepTokens: true,
			keepBrackets: true,
			keepColons: true,
			keepDataComma: true
		}),
		basicLexer = new BasicLexer({
			keywords: basicParser.getKeywords(),
			keepWhiteSpace: keepWhiteSpace
		});

	return new CodeGeneratorBasic({
		quiet: true,
		lexer: basicLexer,
		parser: basicParser
	});
}

QUnit.module("CodeGeneratorBasic: Tests", function (hooks) {
	hooks.before(function () {
		(hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic = createCodeGeneratorBasic(false);
	});

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		const codeGeneratorBasic = (hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic;

		codeGeneratorBasic.getOptions().lexer.setOptions({
			keepWhiteSpace: category === "keepSpaces" // keepWhiteSpace active for category "keepSpaces"
		});

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const expected = tests[key],
					output = codeGeneratorBasic.generate(key),
					result = output.error ? String(output.error) : output.text;

				if (results) {
					results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.compareAllTests(TestInput.getAllTests(), allTests);
	TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});


QUnit.module("CodeGeneratorBasic: keepWhiteSpace", function (hooks) {
	hooks.before(function () {
		(hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic = createCodeGeneratorBasic(true);
	});

	function runSingleTestForWhitespace(codeGeneratorBasic: CodeGeneratorBasic, key: string, expected: string) {
		let result: string;

		const output = codeGeneratorBasic.generate(key);

		result = output.error ? String(output.error) : output.text;
		if (output.error) {
			if (String(output.error).replace(/pos \d+-?\d*/g, "pos ") !== expected.replace(/pos \d+-?\d*/g, "pos ")) { // compare without positions
				Utils.console.error(output.error); // only if unexpected
				result = String(output.error);
			} else {
				result = expected; // set desired result
			}
		}
		return result;
	}

	function runTestsForWhitespace(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		const codeGeneratorBasic = (hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic;
		let spaceCount = 1;
		const fnSpaceReplacer = function (value: string) {
			spaceCount += 2;
			return " ".repeat(spaceCount) + value + " ".repeat(spaceCount + 1);
		};

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				spaceCount = 1;
				const expected = TestHelper.handleBinaryLiterals(tests[key]);
				let keyWithSpaces = key;

				keyWithSpaces = keyWithSpaces.replace(/(\w)#/g, "$1 #").replace(/:\s+(\w)/g, ":$1");

				if (keyWithSpaces.startsWith("chain")) {
					keyWithSpaces = keyWithSpaces.replace(/\s+,/g, ",").replace(/,\s+/g, ","); // fast hack: prepare
				} else if (keyWithSpaces.startsWith("else")) {
					keyWithSpaces = keyWithSpaces.replace(/(=)/g, " $1 ");// hack ELSE a=7 => ELSE a = 7
				}

				keyWithSpaces = keyWithSpaces.replace(/(\d+)e(\d+)/, "$1e+$2"); // 1e9, 2.5e10 => 1e+9

				keyWithSpaces = keyWithSpaces.replace(/([=?+\-*^/\\,;()#])/g, fnSpaceReplacer);
				keyWithSpaces = keyWithSpaces.replace(/> +=/, ">=").replace(/< +=/, "<=").replace(/e[ ]+\+[ ]+(\d+)/g, "e+$1"); // with fast hacks

				const result = runSingleTestForWhitespace(codeGeneratorBasic, keyWithSpaces, expected);

				let expectedWithSpaces = expected;

				if (expected !== result) { // fast hack: not for error messages
					spaceCount = 1;
					expectedWithSpaces = expectedWithSpaces.replace(/:\s+(\w)/g, ":$1");
					expectedWithSpaces = expectedWithSpaces.replace(/(chain)"/g, '$1"');

					expectedWithSpaces = expectedWithSpaces.replace(/([=?+\-*^/\\,;()#])/g, fnSpaceReplacer);
					expectedWithSpaces = expectedWithSpaces.replace(/> +=/, ">=").replace(/< +=/, "<=").replace(/E[ ]+\+[ ]+(\d+)/g, "E+$1"); // with fast hacks
				}

				if (results) {
					results[category].push(TestHelper.stringInQuotes(keyWithSpaces) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expectedWithSpaces, keyWithSpaces);
				}
			}
		}
	}

	TestHelper.generateAllTests(allTests, runTestsForWhitespace, hooks);
});


QUnit.module("CodeGeneratorBasic: Not keepColons", function (hooks) {
	hooks.before(function () {
		const codeGeneratorBasic = createCodeGeneratorBasic(false);

		codeGeneratorBasic.getOptions().parser.setOptions({
			keepColons: false
		});
		(hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic = codeGeneratorBasic;
	});

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		const codeGeneratorBasic = (hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic;

		codeGeneratorBasic.getOptions().lexer.setOptions({
			keepWhiteSpace: category === "keepSpaces" // keepWhiteSpace active for category "keepSpaces"
		});

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const output = codeGeneratorBasic.generate(key),
					result = output.error ? String(output.error) : output.text;
				let expected = tests[key];

				if (!output.error) {
					expected = expected.replace(":'", "'");
					expected = expected.replace(/^:+/, "");
					expected = expected.replace(/:+$/, "");
					expected = expected.replace(/:+( *)$/, "$1");
				}

				if (results) {
					results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});


QUnit.module("CodeGeneratorBasic: Not keepBrackets", function (hooks) {
	hooks.before(function () {
		const codeGeneratorBasic = createCodeGeneratorBasic(false);

		codeGeneratorBasic.getOptions().parser.setOptions({
			keepBrackets: false
		});
		(hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic = codeGeneratorBasic;
	});

	function runTestsFor(category: string, tests: TestsType, assert?: Assert, results?: ResultType) {
		const codeGeneratorBasic = (hooks as hooksWithCodeGeneratorBasic).codeGeneratorBasic;

		codeGeneratorBasic.getOptions().lexer.setOptions({
			keepWhiteSpace: category === "keepSpaces" // keepWhiteSpace active for category "keepSpaces"
		});

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const output = codeGeneratorBasic.generate(key),
					result = output.error ? String(output.error) : output.text;
				let	expected = tests[key];

				if (!output.error) {
					if (key === "a=(1=0)") { // test where brackets are not needed
						expected = "a=1=0";
					} else if (key === "a = (((3+2))*((3-7)))") {
						expected = "a =( 3+2)*(3-7)";
					} else if (key.indexOf("hi=de+(f*10+g)") >= 0) {
						expected =	expected.replace("hi=de+(f*10+g)", "hi=de+f*10+g");
					}

					if (category !== "PRG") { // not in string of PRG example
						expected = expected.replace(/( +)\(/g, "($1");
						expected = expected.replace(/( +)\)/g, ")$1");
					}
				}

				if (results) {
					results[category].push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.generateAllTests(allTests, runTestsFor, hooks);
});

// end
