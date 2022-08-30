// BasicTokenizer.qunit.ts - QUnit tests for CPCBasic BasicTokenizer
//

import { BasicTokenizer } from "../BasicTokenizer";
import { TestHelper, TestsType, AllTestsType } from "./TestHelper";

QUnit.dump.maxDepth = 10;

// tests marked with "L" are full programs with line numbers

QUnit.module("BasicTokenizer:decode: Tests", function () {
	const allTests: AllTestsType = { // eslint-disable-line vars-on-top
		numbers: {
			"0D,00,00,E1,EF,0F": "a=1",
			"0D,00,00,E1,EF,1F,99,99,99,19,81": "a=1.2",
			"0D,00,00,E1,EF,1F,00,00,00,00,90": "a=32768",
			"0D,00,00,E1,EF,F5,1F,00,00,00,00,90": "a=-32768",
			"0D,00,00,E1,EF,1F,00,00,00,00,91": "a=65536"
		},
		def: {
			"8D,20,E4,0D,00,00,63,6C,EB,28,0D,00,00,E1,29,EF,0D,00,00,E1,F6,19,0A": "DEF FNclk(a)=a*10",
			"8D,20,E4,20,0D,00,00,63,6C,EB,28,0D,00,00,E1,29,EF,0D,00,00,E1,F6,19,0A": "DEF FN clk(a)=a*10"
		},
		"if": {
			"A1,0D,00,00,E1,EF,0D,00,00,E2,F4,13,F6,0D,00,00,E3,EB,0D,00,00,E1,EF,0D,00,00,E1,F4,0F,01,A0,20,1E,0A,00,01,97,0D,00,00,E1,EF,0D,00,00,E1,F5,0F,01,A0,20,1E,14,00": "IF a=b+5*c THEN a=a+1:GOTO 10 ELSE a=a-1:GOTO 20"
		},
		mid$: {
			"AC,28,03,00,00,E1,2C,10,29,EF,03,00,00,E2": "MID$(a$,2)=b$"
		},
		PRG: {
			"L,1F,00,01,00,A1,0D,00,00,6D,F5,EF,0E,EB,B5,28,0F,29,9F,1E,01,00,97,B5,28,12,29,9F,1E,01,00,00,00,00": "1 IF mu=0 THEN ON SQ(1)GOSUB 1 ELSE ON SQ(4)GOSUB 1\n",
			"L,12,00,64,00,01,C0,44,61,73,20,52,61,65,74,73,65,6C,00,1D,00,6E,00,01,C0,32,31,2E,35,2E,31,39,38,38,20,4B,6F,70,66,20,75,6D,20,4B,6F,70,66,00,46,00,78,00,01,C0,61,62,2A,63,3D,64,65,20,20,64,65,2B,66,67,3D,68,69,20,20,20,5B,64,61,62,65,69,20,73,69,6E,64,20,61,2D,69,20,76,65,72,73,63,68,69,65,64,65,6E,65,20,5A,69,66,66,65,72,6E,20,31,2D,39,21,21,5D,00,31,00,82,00,AD,20,0F,01,BF,22,50,6C,65,61,73,65,20,77,61,69,74,20,2E,2E,2E,20,20,28,20,63,61,2E,20,31,20,6D,69,6E,20,33,34,20,73,65,63,20,29,22,00,0C,00,8C,00,86,01,8E,20,61,2D,79,00,07,00,96,00,01,C0,00,0C,00,9B,00,0D,00,00,FA,EF,FF,46,00,45,00,A0,00,9E,20,0B,00,00,E1,EF,0F,20,EC,20,17,01,9E,20,0B,00,00,E2,EF,0F,20,EC,20,17,01,9E,20,0B,00,00,E3,EF,0F,20,EC,20,17,01,9E,20,0B,00,00,E6,EF,0F,20,EC,20,17,01,9E,20,0B,00,00,E7,EF,0F,20,EC,20,17,00,2F,00,AA,00,0B,00,00,64,E5,EF,28,0B,00,00,E1,F6,19,0A,F4,0B,00,00,E2,29,F6,0B,00,00,E3,01,A1,20,0B,00,00,64,E5,EE,19,63,20,EB,20,1E,40,01,00,30,00,B4,00,0B,00,00,68,E9,EF,0B,00,00,64,E5,F4,28,0B,00,00,E6,F6,19,0A,F4,0B,00,00,E7,29,01,A1,20,0B,00,00,68,E9,EE,19,63,20,EB,20,1E,40,01,00,48,00,BE,00,0B,00,00,E4,EF,FF,0C,28,0B,00,00,64,E5,F7,19,0A,29,01,0B,00,00,E5,EF,0B,00,00,64,E5,20,FB,20,19,0A,01,0B,00,00,E8,EF,FF,0C,28,0B,00,00,68,E9,F7,19,0A,29,01,0B,00,00,E9,EF,0B,00,00,68,E9,20,FB,20,19,0A,00,6A,00,C8,00,A1,20,0B,00,00,E1,EF,0B,00,00,E2,20,FC,20,0B,00,00,E1,EF,0B,00,00,E3,20,FC,20,0B,00,00,E1,EF,0B,00,00,E4,20,FC,20,0B,00,00,E1,EF,0B,00,00,E5,20,FC,20,0B,00,00,E1,EF,0B,00,00,E6,20,FC,20,0B,00,00,E1,EF,0B,00,00,E7,20,FC,20,0B,00,00,E1,EF,0B,00,00,E8,20,FC,20,0B,00,00,E1,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,5E,00,D2,00,A1,20,0B,00,00,E2,EF,0B,00,00,E3,20,FC,20,0B,00,00,E2,EF,0B,00,00,E4,20,FC,20,0B,00,00,E2,EF,0B,00,00,E5,20,FC,20,0B,00,00,E2,EF,0B,00,00,E6,20,FC,20,0B,00,00,E2,EF,0B,00,00,E7,20,FC,20,0B,00,00,E2,EF,0B,00,00,E8,20,FC,20,0B,00,00,E2,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,52,00,DC,00,A1,20,0B,00,00,E3,EF,0B,00,00,E4,20,FC,20,0B,00,00,E3,EF,0B,00,00,E5,20,FC,20,0B,00,00,E3,EF,0B,00,00,E6,20,FC,20,0B,00,00,E3,EF,0B,00,00,E7,20,FC,20,0B,00,00,E3,EF,0B,00,00,E8,20,FC,20,0B,00,00,E3,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,46,00,E6,00,A1,20,0B,00,00,E4,EF,0B,00,00,E5,20,FC,20,0B,00,00,E4,EF,0B,00,00,E6,20,FC,20,0B,00,00,E4,EF,0B,00,00,E7,20,FC,20,0B,00,00,E4,EF,0B,00,00,E8,20,FC,20,0B,00,00,E4,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,3A,00,F0,00,A1,20,0B,00,00,E5,EF,0B,00,00,E6,20,FC,20,0B,00,00,E5,EF,0B,00,00,E7,20,FC,20,0B,00,00,E5,EF,0B,00,00,E8,20,FC,20,0B,00,00,E5,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,2E,00,FA,00,A1,20,0B,00,00,E6,EF,0B,00,00,E7,20,FC,20,0B,00,00,E6,EF,0B,00,00,E8,20,FC,20,0B,00,00,E6,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,22,00,04,01,A1,20,0B,00,00,E7,EF,0B,00,00,E8,20,FC,20,0B,00,00,E7,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,16,00,0E,01,A1,20,0B,00,00,E8,EF,0B,00,00,E9,20,EB,20,1E,40,01,00,13,00,18,01,A1,20,0B,00,00,E9,EF,0E,20,EB,20,1E,40,01,00,11,00,1D,01,0D,00,00,FA,EF,FF,46,F5,0D,00,00,FA,00,18,00,22,01,8A,01,BF,22,44,69,65,20,4C,6F,65,73,75,6E,67,3A,22,01,BF,00,43,00,2C,01,BF,20,0B,00,00,E1,F6,19,0A,F4,0B,00,00,E2,22,2A,22,0B,00,00,E3,22,3D,22,0B,00,00,64,E5,22,20,2F,20,22,0B,00,00,64,E5,22,2B,22,0B,00,00,E6,F6,19,0A,F4,0B,00,00,E7,22,3D,22,0B,00,00,68,E9,00,15,00,36,01,BF,0D,00,00,FA,2C,0D,00,00,FA,F7,1A,2C,01,01,CE,00,1F,00,40,01,B0,20,0B,00,00,E7,2C,0B,00,00,E6,2C,0B,00,00,E3,2C,0B,00,00,E2,2C,0B,00,00,E1,00,00,00": '100 \'Das Raetsel\n110 \'21.5.1988 Kopf um Kopf\n120 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n130 MODE 1:PRINT"Please wait ...  ( ca. 1 min 34 sec )"\n140 CLEAR:DEFINT a-y\n150 \'\n155 z=TIME\n160 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n170 de=(a*10+b)*c:IF de>99 THEN 320\n180 hi=de+(f*10+g):IF hi>99 THEN 320\n190 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n200 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 320\n210 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 320\n220 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 320\n230 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 320\n240 IF e=f OR e=g OR e=h OR e=i THEN 320\n250 IF f=g OR f=h OR f=i THEN 320\n260 IF g=h OR g=i THEN 320\n270 IF h=i THEN 320\n280 IF i=0 THEN 320\n285 z=TIME-z\n290 CLS:PRINT"Die Loesung:":PRINT\n300 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n310 PRINT z,z/300:STOP\n320 NEXT g,f,c,b,a\n'
		}
	};

	function fnHex2Bin(hex: string) {
		return hex.split(",").map(function (s) {
			return String.fromCharCode(Number("0x" + s));
		}).join("");
	}

	function runTestsFor(assert: Assert | undefined, _sCategory: string, tests: TestsType, results?: string[]) {
		const basicTokenizer = new BasicTokenizer();

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const expected = tests[key],
					withLines = (key.charAt(0) === "L"),
					input = fnHex2Bin(withLines ? key.substr(2) : key), // old: Utils.atob(key)
					result = withLines ? basicTokenizer.decode(input) : basicTokenizer.decodeLineFragment(input, 0, input.length),
					firstLine = expected.substr(0, expected.indexOf("\n")) || expected;

				if (results) {
					results.push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, firstLine);
				}
			}
		}
	}

	TestHelper.generateAndRunAllTests(allTests, runTestsFor);
});

// end
