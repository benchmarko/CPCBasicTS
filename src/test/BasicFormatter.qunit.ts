// BasicFormatter.qunit.ts - QUnit tests for CPCBasic BasicFormatter
//
// qunit dist/test/BasicFormatter.qunit.js debug=1 generateAll=true

import { BasicLexer } from "../BasicLexer"; // we use BasicLexer here just for convenient input
import { BasicParser } from "../BasicParser";
import { BasicFormatter } from "../BasicFormatter";
import { TestHelper, TestsType, AllTestsType } from "./TestHelper";

QUnit.dump.maxDepth = 10;

QUnit.module("BasicFormatter:renumber: Tests", function () {
	const allTests: AllTestsType = { // eslint-disable-line vars-on-top
		"after gosub, auto": {
			"1 after 2 gosub 1": "10 after 2 gosub 10",
			"1 auto 100": "10 auto 100"
		},
		"chain, chain merge": {
			'1 chain"f2",1': '10 chain"f2",1',
			'1 chain"f3",1+3': '10 chain"f3",1+3',
			'1 chain merge "f2",1': '10 chain merge "f2",1',
			'1 chain merge "f3",1+3': '10 chain merge "f3",1+3',
			'1 chain merge "f4",1+3,delete 100-200\n100 rem\n200 rem': '10 chain merge "f4",1+3,delete 20-30\n20 rem\n30 rem'
		},
		"delete": {
			"1 delete": "10 delete",
			"1 delete -": "10 delete -",
			"1 delete 1": "10 delete 10",
			"1 delete 1-": "10 delete 10-",
			"1 delete -1": "10 delete -10",
			"1 delete 1-2\n2 rem": "10 delete 10-20\n20 rem"
		},
		"edit, else, every gosub": {
			"1 edit 1": "10 edit 10",
			"1 else 1": "10 else 10",
			"1 every 2 gosub 1": "10 every 2 gosub 10"
		},
		"gosub, goto": {
			"1 gosub 1": "10 gosub 10",
			"1 goto 1": "10 goto 10"
		},
		"if": {
			"1 if a=1 then goto 1": "10 if a=1 then goto 10",
			"1 if a=1 then 1": "10 if a=1 then 10",
			"1 if a=1 goto 1": "10 if a=1 goto 10",
			"1 if a=1 then gosub 1": "10 if a=1 then gosub 10",
			"1 if a=1 then 1:a=never1": "10 if a=1 then 10:a=never1",
			"1 if a=1 then 1 else 2\n2 rem": "10 if a=1 then 10 else 20\n20 rem",
			"1 if a=1 then 1 else goto 2\n2 rem": "10 if a=1 then 10 else goto 20\n20 rem"
		},
		list: {
			"1 list": "10 list",
			"1 list -": "10 list -",
			"1 list 1": "10 list 10",
			"1 list 1-": "10 list 10-",
			"1 list -1": "10 list -10",
			"1 list 1-2\n2 rem": "10 list 10-20\n20 rem"
		},
		"on break ..., on error goto, on gosub, on goto, on sq gosub": {
			"1 on break gosub 1": "10 on break gosub 10",
			"1 on error goto 0": "10 on error goto 0",
			"1 on error goto 2\n2 rem": "10 on error goto 20\n20 rem",
			"1 on 1 gosub 1": "10 on 1 gosub 10",
			"1 on x gosub 1,2\n2 rem": "10 on x gosub 10,20\n20 rem",
			"1 on 1 goto 1": "10 on 1 goto 10",
			"1 on x goto 1,2\n2 rem": "10 on x goto 10,20\n20 rem",
			"1 on sq(1) gosub 1": "10 on sq(1) gosub 10",
			"1 on sq(channel) gosub 1": "10 on sq(channel) gosub 10"
		},
		"renum, restore, resume, run": {
			"1 renum 100": "10 renum 100",
			"1 renum 100,50": "10 renum 100,50",
			"1 renum 100,50,2": "10 renum 100,50,2",
			"1 restore 1": "10 restore 10",
			"1 resume 1": "10 resume 10",
			"1 run 1": "10 run 10"
		},
		prg: {
			'100 \'Das Raetsel\n110 \'21.5.1988 Kopf um Kopf\n120 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n130 MODE 1:PRINT"Please wait ...  ( ca. 1 min 34 sec )"\n140 CLEAR:DEFINT a-y\n150 \'\n155 z=TIME\n160 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n170 de=(a*10+b)*c:IF de>99 THEN 320\n180 hi=de+(f*10+g):IF hi>99 THEN 320\n190 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n200 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 320\n210 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 320\n220 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 320\n230 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 320\n240 IF e=f OR e=g OR e=h OR e=i THEN 320\n250 IF f=g OR f=h OR f=i THEN 320\n260 IF g=h OR g=i THEN 320\n270 IF h=i THEN 320\n280 IF i=0 THEN 320\n285 z=TIME-z\n290 CLS:PRINT"Die Loesung:":PRINT\n300 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n310 PRINT z,z/300:STOP\n320 NEXT g,f,c,b,a\n': '10 \'Das Raetsel\n20 \'21.5.1988 Kopf um Kopf\n30 \'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n40 MODE 1:PRINT"Please wait ...  ( ca. 1 min 34 sec )"\n50 CLEAR:DEFINT a-y\n60 \'\n70 z=TIME\n80 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n90 de=(a*10+b)*c:IF de>99 THEN 250\n100 hi=de+(f*10+g):IF hi>99 THEN 250\n110 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n120 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 250\n130 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 250\n140 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 250\n150 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 250\n160 IF e=f OR e=g OR e=h OR e=i THEN 250\n170 IF f=g OR f=h OR f=i THEN 250\n180 IF g=h OR g=i THEN 250\n190 IF h=i THEN 250\n200 IF i=0 THEN 250\n210 z=TIME-z\n220 CLS:PRINT"Die Loesung:":PRINT\n230 PRINT a*10+b"*"c"="de" / "de"+"f*10+g"="hi\n240 PRINT z,z/300:STOP\n250 NEXT g,f,c,b,a\n',
			"1 goto 2\n2 gosub 21\n3 on i goto 4,21,23\n4 on i gosub 21,1,2,3\n6 on break gosub 21\n7 on error goto 23\n8 on sq(1) gosub 21\n12 data 5\n16 stop\n18 '\n19 '\n21 restore 6:return\n23 if err=5 then 24 else 25\n24 resume 8\n25 resume next\n29 '\n35 on error goto 0\n39 renum 100,5,3\n": "10 goto 20\n20 gosub 120\n30 on i goto 40,120,130\n40 on i gosub 120,10,20,30\n50 on break gosub 120\n60 on error goto 130\n70 on sq(1) gosub 120\n80 data 5\n90 stop\n100 '\n110 '\n120 restore 50:return\n130 if err=5 then 140 else 150\n140 resume 70\n150 resume next\n160 '\n170 on error goto 0\n180 renum 100,5,3\n"
		},
		errors: {
			"1 rem\n1 rem": "BasicFormatter: Duplicate line number in 1 at pos 6-7: 1",
			"2 rem\n1 rem": "BasicFormatter: Line number not increasing in 1 at pos 6-7: 1",
			"0 rem": "BasicFormatter: Line number overflow in 0 at pos 0-1: 0",
			"65536 rem": "BasicFormatter: Line number overflow in 65536 at pos 0-5: 65536",
			"1 goto 2": "BasicFormatter: Line does not exist in 1 at pos 7-8: 2"
		}
	};

	function runSingleTest(basicFormatter: BasicFormatter, key: string) {
		const newLine = 10,
			oldLine = 1,
			step = 10,
			keep = 65535,
			output = basicFormatter.renumber(key, newLine, oldLine, step, keep),
			result = output.error ? String(output.error) : output.text;

		return result;
	}

	function runTestsFor(_category: string, tests: TestsType, assert?: Assert, results?: string[]) {
		const basicFormatter = new BasicFormatter({
			lexer: new BasicLexer(),
			parser: new BasicParser({
				quiet: true
			})
		});

		for (const key in tests) {
			if (tests.hasOwnProperty(key)) {
				const expected = TestHelper.handleBinaryLiterals(tests[key]),
					result = runSingleTest(basicFormatter, key);

				if (results) {
					results.push(TestHelper.stringInQuotes(key) + ": " + TestHelper.stringInQuotes(result));
				}

				if (assert) {
					assert.strictEqual(result, expected, key);
				}
			}
		}
	}

	TestHelper.generateAndRunAllTests(allTests, runTestsFor);
});
