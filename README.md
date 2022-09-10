# CPCBasicTS Unchained - Run CPC BASIC in a Browser

CPCBasicTS lets you run CPC BASIC programs in a browser. The supported BASIC style is known as Amstrad CPC 6128 Locomotive BASIC 1.1.
BASIC programs are compiled to JavaScript so that it can be run in the browser. A library provides the functionality of the commands that are not directly available in JavaScript.

CPCBasicTS Links:
[CPCBasicTS Demo](https://benchmarko.github.io/CPCBasicTS/?example=cpcbasic),
[Colors CPC Demo](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/colors),
[Source code](https://github.com/benchmarko/CPCBasicTS/),
[HTML Readme](https://github.com/benchmarko/CPCBasicTS/#readme),

CPCBasicTS is based on the JavaScript version [CPCBasic](https://github.com/benchmarko/CPCBasic/) 0.9.20, converted to TypeScript and further enhanced. New features are developed for CPCBasicTS.

## Features

- Run CPC BASIC programs in a browser
- Warp speed: Calculations are as fast as possible. Only frame fly and other events are in real-time
- CPC Basic Unchained: Breaking out of the CPC box, out of the CPC BASIC ROM. Less restrictions, extended by new features
- A BASIC compiler and not just an interpreter
- Import programs via drag&drop, tokenized BASIC and ASCII, also from DSK/ZIP files
- Lots of memory
- Runs locally without installation and without a server, even on mobile devices
- HTML5 / TypeScript / JavaScript without external libraries

[![A sample with cpcbasic](https://benchmarko.github.io/CPCBasicTS/img/cpcbasic.gif)](https://benchmarko.github.io/CPCBasicTS/?example=cpcbasic)

[![Art](https://benchmarko.github.io/CPCBasicTS/img/art.png)](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/art)
[![Graphics](https://benchmarko.github.io/CPCBasicTS/img/graphics.png)](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/graphics)
[![Labyrinth](https://benchmarko.github.io/CPCBasicTS/img/labyrinth.png)](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/labyrinth)
[![Landscape](https://benchmarko.github.io/CPCBasicTS/img/landscape.png)](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/landscape)

More examples are in the sample library [CPCBasicApps](https://benchmarko.github.io/CPCBasicApps/), [CPCBasicApps source](https://github.com/benchmarko/CPCBasicApps/#readme). They are included in CPCBasicTS as *apps*. Example: [10print](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=demo/10print).

## Why CPCBasic

There are several great CPC emulators which emulate a complete CPC with exact timing and allow demos to run, pushing CPC hardware to its limits.

With CPC Basic we do not get that accuracy. But if we compile it to JavaScript, can we achieve a similar or faster speed than the assembler programmed functionality that runs on a CPC or emulator?

## Usage

- Just open index.html in a browser.
  The user interface shows several windows, which can be reduced and expanded by pressing the **green** buttons.
- The *Input* window is used to input and modify the BASIC program.
  - Use the *first selection field* to select the example library: CPCBasic *examples*,
  CPCBasicApps *apps*, *examplesTS* or *storage*.
  - Use the *second selection field* to select a sample program. It will reset the CPC and run the program.
  - The **Reload** button reloads the page with the current settings put in URL parameters. (Please note that modifications of the BASIC program are not saved!)
  - The **Help** button opens the readme in the browser.
  - The **Check** button checks the syntax of the program. It compiles the program to JavaScript.
  - The **Convert** button opens a popover with functuons to renumber lines or pretty print the  program.
    - The **Renum** button renumbers the lines (see also *RENUM*)
    - The **Pretty** button performs a pretty print on the input.
    - The **Undo** button reverts the last renum or pretty print.
    - The **Redo** button activates the last renum or pretty print.
  - The **Download** button downloads the program in tokenized BASIC format with AMSDOS header. It can be imported via Drag&Drop later. It can also be used directly with the *CPCEMU* emulator in *|TAPE* mode, or put in a DSK image to load with any other CPC emulator.
- The *CPC* window shows the output on a CPC screen.
  - The **Run** button compiles the BASIC program to JavaScript and runs it (simular to *RUN*).
    - If the focus is on the CPC screen, keystrokes will be detected by a running program or also in direct mode. An alternative way of input is the *virtual keyboard* below.
  - The **Break** button halts the program. This is an unconditional break. Pressing the ESC key once also halts the program, if not masked with *ON BREAK CONT*.
  - The **Continue** button continues the program (simular to *CONT*).
  - The **Reset** button resets the CPC.
  - The **Screenshot** button creates a screenshot of the current CPC screen.
  - The **Sound** button activates or deactivates sound.
    - If you start the app or use the *Reload* button with the sound enabled, the sound needs to be activated by a user action, e.g. a click anywhere. This is a browser limitation.
- The *Text View* window shows the text which is written in text mode.
- The *Keyboard* window shows a virtual keyboard which can be also used with touch devices. You can test the functionality with the test program [keyboard](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/keyboard&showKbd=true).
- The *Keyboard Layout* window allows you to change the layout of the keyboard.
- The *Input* window is an alternative way to send input to the CPC.
- The *Console* window shows the textual output. This is useful for copying and pasting the output. It is cleared when the CPC screen is cleared (*MODE* or *CLS*).
- The *Variables* window allows you to see the variables used by the program. Simple variables can also be modified.
- In the *JavaScript* window you will see the compiled JavaScript code. It can be changed and then executed with the **Run** button in this window. So it is possible to program the simulated CPC directly with JavaScript.

## Extensions and Features

- File operations work on Browser local storage memory (check in Browser: e.g. Developement tools, Application).
  - Use "storage" in the "CPC BASIC" selection field to load files.
  - Specific for *RUN*, *LOAD*, *MERGE*, *OPENIN*: If a file is not found in storage memory and an example with the name exists in the current directory, this example is loaded.
  - Use Drag & Drop on the CPC canvas or on the input drop zone to import files. An AMSDOS header is detected.
  File types can be normal ASCII, tokenized BASIC, protected (tokenized) BASIC, or Binary. ZIP files and DSK files can also be imported.
- Mouse clicks on CPC canvas: If the canvas is not active, click on it to activate it.
  The border color changes. A click on a character written in text mode puts this character in the keyboard input queue.
  The next *INKEY$* will return it. This could be useful to select options presented on the screen.
  Another feature: After a MOVE 1000,1000, a mouse click does a *MOVE* at the click position.
  This can be detected by a BASIC program.
  Example: [Mouse Painting](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/mousepa)
- *MODE 3*: High resolution mode with real 640x400 pixels, 16 colors and 8x8 pixels per character.
  This is different to the unofficial and not very useful Gate Array mode 3 on a real CPC: [CPC live: Graphics](http://cpctech.cpc-live.com/docs/graphics.html).
Several examples use CPCBasicTS mode 3 when available, e.g. [Art](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/art), [Landscape](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/landscape), [Rectangles](https://benchmarko.github.io/CPCBasicTS/?database=apps&example=test/rectangles).
- *|MODE,n*: Change mode without *CLS*, including mode 3.
- *|RENUM,...*: similar to *RENUM* but with a 4th parameter to keep line numbers starting with this line
- Integer computations are not limited to 16 bit but use 32 bit.
- *PEEK & POKE* features:
  - Access screen memory in screen base address range, e.g. &C000-&FFFF or &4000-&7FFF
  - Access character map data starting at *HIMEM*+1 after *SYMBOL AFTER* n with n<256
- Runs also on the command line with nodeJS:
  - Remote URL: `node ./cpcbasicts.js sound=false showCpc=false debug=0 databaseDirs=https://benchmarko.github.io/CPCBasicApps/apps database=apps example=math/euler`
  - Or with local examples: `node ./cpcbasicts.js sound=false showCpc=false debug=0 databaseDirs=./examples example=test/testpage` (The test page does not fully work.)

## Restrictions

- Simulation is not always complete:
  - It is BASIC only and can not execute Z80 machine code
  - Sound: *ENV*: Not all hardware volume envelopes are implemented
  - Unimplemented commands are ignored: *AUTO*, *PRINT #8*, *SPEED KEY/WRITE*, *WIDTH*, *WRITE #8*, some AMDSOS commands.
- Simulation is not always accurate:
  - Programs run much faster than the original CPC. But The goal is that most BASIC programs run without change. Otherwise it is possible to insert delays.
  - Error messages are sometimes different and usually more precise
  - Array access: There is no range checking for array indices.
  - Floating point results may be different because they are calculated with higher precision.
  - Random numbers are different because they are generate by another random number generator.
  - For multi-line strings containing LF (\n), there is the heuristic that they are only detected if the following line starts with a number.
  - Interpreted CPC BASIC may contain lines of arbitrary content if they are not executed, e.g. comments without marking them as comments. The CPCBasicTS compiler does not allow this.
  - *FOR* loop: A untyped loop variable is changed even if you switch to anoter type in the loop with *DEFINT*, *DEFREAL* or *DEFSTR*.
    `FOR i=1 TO 3: ?i: DEFINT i: i=4: NEXT` returns 1.
  - *RESUME* without a line number and *RESUME NEXT* activate trace mode without trace output. They do not fully work when the command with the error is not the only command in the line.
- The resulting JavaScript may look strange because there is no *GOTO* in JavaScript.
  Furthermore, control structures like *FOR*, *WHILE* and *IF* need to be converted into a *GOTO* like structure because for some commands and events it is necessary to jump out of a block.
  - Maybe something more...

## Programming hints

- CPCBasicTS is BASIC with Warp speed. However, do not use busy waiting. Put in commands like *FRAME* or *CALL &BD19*.
  - An example of inserting a one second delay: `t!=TIME+300:WHILE TIME<t!:CALL &BD19:WEND` .
  - There is a special feature when using the *INKEY$* function: if it does not return keys more than once during a frame, an implicit *FRAME* (or *CALL &BD19*) is called.
    - An example to wait for 5 seconds or a keypress (you may check that the CPU load stays low):
    `t!=TIME+300*5:WHILE TIME<t! AND INKEY$="":WEND`
    - This is not true for the *INKEY* function. Use *CALL &BD19* to avoid busy waiting. An example to wait 5 seconds or the SPACE key: `t!=TIME+300*5:WHILE TIME<t! AND INKEY(47)<0:CALL &BD19:WEND`
- If there is *TRON* in the source code, the resulting JavaScript is compiled with trace information. This will provide source code positioning also for runtime errors, even if you deactivate trace output in basic with *TROFF*. Trace information can also be enabled with the URL parameter "trace=true".
- Use *OPENIN* and *INPUT#9* to load data from a file in the current "directory" or from Browser local storage
- If the program is complete (that means, no *MERGE* or *CHAIN MERGE* inside), line number destinations are checked for existence. For example, if the line number in *GOTO line* does not exist, the compilation fails.
- The commands and functions are checked for correct number of arguments and mostly also for correct argument types.
- There are some static type checks which prevent a program from being compiled, e.g. when using a string when a number is espected: `ASC(0)`. Or when using a number when a string is expected: `chr$("A")`. If you want to run such a program, make sure you put an *ON ERROR GOTO line* with line>0 just before the erroneous statement.

## BASIC Features

Did you know?

- Comparison operators can be used in assignment, e.g. equal and not equal: `a=0: t=(a=0): f=(a<>0): ?t;f` returns -1 and 0 for true and false.
- Instead of the comparison operators <= or >= you could also write =< or =>.  When tokenized, it is converted to the "standard" format (currently not for CPCBasic).
- *ENV*: Special syntax with "=" to define hardware volume envelopes, e.g. `ENV num,=reg,period`. Same for *ENT*, e.g. `ENT num,=period,ti`
- Arrays can be indexed by parentheses or by brackets, but also with mixed style, e.g. `a(3]=6: ?a[3)` returns 6.
- When you use float parameters where integer parameters are expected they are automatically rounded, e.g. `MODE 1.5` sets MODE 2. This works also for array indices, e.g.
`a(3.2)=3:a(3.5)=4:?a(2.5);a(4.4)` returns 3 and 4.
- Variables typed with DEFINT, DEFREAL or DEFSTR are aliases for those with a type extension, e.g. `DEFINT a: a=1: a%=2: ?a;a%` returns 2 and 2.
- *MIN* and *MAX* do not only accept numbers as arguments but also a single string argument which they will return, e.g. `MIN("ab");MAX("cd")` return "ab" and "cd".
- Tokenized BASIC contains a lot of spaces which can be squeezed out and visualized by colons and the end of the line. Put this code fragment at the end of the program and run it: `a=&170:WHILE PEEK(a)<>0:e=a+PEEK(a):FOR i=a TO e-2:POKE a,PEEK(i):a=a+ABS(PEEK(i)<>&20):NEXT:FOR i=a TO e-2:POKE i,&01:NEXT:a=e:?:WEND` . This simple version expects lines not longer than 255 characters or tokens and will also modify strings and comments (currently not for CPCBasic).
- *ELSE* as command without preceding *IF* is similar to a comment

## Supported CALLs and OUTs

### CALLs

A list of *CALL*s which are supported. Other *CALL*s are ignored.

- *CALL &BB00*: KM Initialize (KM Reset and reset also CPC key extensions)
- *CALL &BB03*: KM Reset (clear input and reset expansion tokens)
- *CALL &BB06*: KM Wait Char (CPCBasic: same as *Call &BB18*)
- *CALL &BB0C*: KM Char Return (depending on number of arguments)
- *CALL &BB18*: KM Wait Key
- *CALL &BB4E*: TXT Initialize (initialize window parameter, delete custom chars)
- *CALL &BB51*: TXT Reset (reset control character buffer)
- *CALL &BB5A*: TXT Output (*PRINT* text char including control codes, depending on number of arguments)
- *CALL &BB5D*: TXT WR Char (*PRINT* text char depending on number of arguments)
- *CALL &BB6C*: TXT Clear Window
- *CALL &BB7B*: TXT Cursor Enable
- *CALL &BB7E*: TXT Cursor Disable
- *CALL &BB81*: TXT Cursor On
- *CALL &BB84*: TXT Cursor Off
- *CALL &BB8A*: TXT Place Cursor
- *CALL &BB8D*: TXT Remove Cursor
- *CALL &BB90*: TXT Set Pen (set *PEN* depending on number of arguments)
- *CALL &BB96*: TXT Set Paper (set *PAPER* depending on number of arguments)
- *CALL &BB9C*: TXT Inverse (same as *PRINT CHR$(24)*)
- *CALL &BB9F*: TXT Set Back (set *PEN* transparent mode, depending on number of arguments)
- *CALL &BBDB*: GRA Clear Window
- *CALL &BBDE*: GRA Set Pen (set *GRAPHICS PEN* depending on number of arguments)
- *CALL &BBE4*: GRA Set Paper (set *GRAPHICS PAPER* depending on number of arguments)
- *CALL &BBFC*: GRA WR Char (*PRINT* graphics char depending on number of arguments)
- *CALL &BBFF*: SCR Initialize (set *MODE* 1, reset inks, clear screen)
- *CALL &BC02*: SCR Reset
- *CALL &BC06,nn*: SCR SET BASE (really &BC08; set screen start high byte: &00, &40, &80 or &C0; not for CPC 664)
- *CALL &BC07,nn*: SCR SET BASE (really &BC08; compatible with all CPC 464/664/6128)
- *CALL &BC0E*: SCR Set Mode (set *MODE* depending on number of arguments)
- *CALL &BCA7*: SOUND Reset
- *CALL &BCB6*: SOUND Hold (TODO)
- *CALL &BCB9*: SOUND Continue (TODO)
- *CALL &BD19*: MC Wait Flyback (wait for screen beam flyback; same as *FRAME*)
- *CALL &BD1C*: MC Set Mode (set view *MODE* depending on number of arguments)
- *CALL &BD3D*: KM Flush (*CLEAR INPUT*; CPC 664/6128 only)
- *CALL &BD49*: GRA Set First (set *MASK* first pixel, depending on number of arguments; CPC 664/6128 only)
- *CALL &BD4C*: GRA Set Mask (set *MASK*, depending on number of arguments; CPC 664/6128 only)
- *CALL &BD52*: GRA Fill (*FILL*, depending on number of arguments; CPC 664/6128 only)
- *CALL &BD5B*: KL RAM SELECT (depending on number of arguments; CPC 6128 only)

### OUTs

- *OUT &7Fxx,nn*: Select RAM bank in range &4000-&7FFF; &C0=default; &C4-&FF=additional banks
- *WAIT &F5xx,1*: Wait for Frame Fly (similar to *CALL &BD19* or *FRAME*)

## Debugging

- Use the URL parameter *tron=true* to compile with trace functionality and print out the executed BASIC line numbers. The trace can be switched on and off in BASIC with *TRON* and *TROFF*. When the trace functionality is activated, correct line numbers are reported in case of runtime errors.
- For debugging in a desktop browser, you typically use the Browser Development Tools (F12).
- You can also use a *Console log* window, which is usually hidden. Enable it with the URL parameters *showConsole=true&debug=2*. Example:
 [CPCBasicTS Debug](https://benchmarko.github.io/CPCBasicTS/?showConsole=true&debug=2).
 This is especially useful on mobile devices. If necessary, delete the content manually.
- There is also an experimental parameter *bench=n* to time the "parsing step" n times.
  An example with a large BASIC program:
[sultans2 parsing](https://benchmarko.github.io/CPCBasicTS/?bench=5&database=apps&example=games/sultan2) (check the console output in the browser developer tools).

## URL parameters

These URL parameters are also put in the URL when you press the *Reload* button and the setting is not the default.

- bench=0 (only for debugging: number of parse bench loops)
- debug=0 (debug level)
- databaseDirs=examples (example base directories, comma separated)
- database=examples (selected database)
- example=cpcbasic (selected sample program)
- exampleIndex=0index.js (example index file in every entry of exampleDirs)
- input= (keyboard input when starting the app, use %0D as return charcter)
- kbdLayout=alphanum (virtual keyboard layout: alphanum, alpha, num)
- showInput=true
- showInp2=false
- showCpc=true (show the CPC window)
- showKbd=false
- showKbdLayout=false
- showOutput=false
- showResult=false
- showText=false
- showVariable=false
- showConsole=false
- sound=true (sound enabled or disabled)
- tron=false (see *TRON*, *TROFF*)

(Some URL parameters are experimental and may change.)

## Development, Testing

QUnit tests:

- [index.html](https://benchmarko.github.io/CPCBasicTS/test/index.html) (test overview page)
  - [BasicFormatter.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/BasicFormatter.qunit.html)
  - [BasicLexer.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/BasicLexer.qunit.html)
  - [BasicParser.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/BasicParser.qunit.html)
  - [BasicTokenizer.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/BasicTokenizer.qunit.html)
  - [CodeGeneratorBasic.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/CodeGeneratorBasic.qunit.html)
  - [CodeGeneratorJs.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/CodeGeneratorJs.qunit.html)
  - [CodeGeneratorToken.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/CodeGeneratorToken.qunit.html)
  - [CpcVm.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/CpcVm.qunit.html)
  - [Diff.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/Diff.qunit.html)
  - [DiskImage.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/DiskImage.qunit.html)
  - [Model.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/Model.qunit.html)
  - [Variables.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/Variables.qunit.html)
  - [ZipFile.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/ZipFile.qunit.html)
  - [testParseExamples.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/testParseExamples.qunit.html) (parse all examples)
  - [testsuite.qunit.html](https://benchmarko.github.io/CPCBasicTS/test/testsuite.qunit.html) (run all tests)

It is possible to use URL parameter *generateAll=true* to gererate an output of the expected results in the console.

IFrames test:

- [testIFrames.html](https://benchmarko.github.io/CPCBasicTS/test/testIFrames.html) (CPCBasicTS in IFrames)

## Possible Future Enhancements

- Fullscreen mode of the CPC window
- Array index check
- Save and restore snapshot of variables, including system state variables
- Can we detect busy loops and insert *FRAME* automatically? Or invent some "real time" mode? Or use a speed control to change the speed?
- RSX extension libraries / plugins programmed in TypeScript/JavaScript
- Further optimizations of the resulting JavaScript code
- Further checks during compile time
- Support some simple Z80 assembler programs
- Shall we support hardware scrolling with *OUT* or is it already a hardware emulation feature?
- Create buttons for the keys that the BASIC program checks (useful for e.g. mobile devices)
- Extension: More colors, e.g. 256
- Smooth character map from 8x8 to 8x16

## Links

- [Amstrad CPC 6128 User Instructions](http://www.cpcwiki.eu/manuals/AmstradCPC6128-hypertext-en-Sinewalker.pdf), or:
  [Schneider CPC 6128 Benutzerhandbuch](https://acpc.me/ACME/MANUELS/[DEU]DEUTSCH(GERMAN)/CPC6128_SCHNEIDER[DEU]_Erste_Ausgabe_1985[OCR].pdf)

- [ROM-Listing CPC 464/664/6128](http://www.cpcwiki.eu/index.php/ROM-Listing_CPC_464/664/6128) - German, excellent information

- [Das Scheider CPC Systembuch](https://k1.spdns.de/Vintage/Schneider%20CPC/Das%20Scheider%20CPC%20Systembuch.pdf) - German, excellent information

- [Locomotive BASIC](https://www.cpcwiki.eu/index.php/Locomotive_BASIC) - Description of the CPC Basic Dialect

- [Disassembly of Locomotive BASIC v1.1](http://cpctech.cpc-live.com/docs/basic.asm) - If you do not have the ROM listing at hand

- [The story of Amstrad’s amazing CPC 464](https://www.theregister.co.uk/2014/02/12/archaeologic_amstrad_cpc_464/)

- [CPCemu](http://www.cpc-emu.org/) - CPC Emulator, since version 2.0 with very accurate emulation

- [Arnold TNG - The Warp factor](http://www.yasara.org/cpc/index.html) - Modified Arnold CPC emulator at various speed levels.

- [Simple Web Basic](https://yohan.es/swbasic/) - A link collection of basic interpreters for the Web (2010)

- [qb.js: An implementation of QBASIC in Javascript](http://stevehanov.ca/blog/?id=92)

- [JSBasic - A BASIC to JavaScript Compiler](https://www.codeproject.com/Articles/25069/JSBasic-A-BASIC-to-JavaScript-Compiler), with
  [Demo: SpaceWar](http://jsbasic.apphb.com/default.aspx?sourceCode=SpaceWar)

- [Top Down Operator Precedence](http://crockford.com/javascript/tdop/tdop.html) - Douglas Crockford, 2007-02-21. CPCBasicTS uses this approach.

- [BM Benchmark Suite](https://github.com/benchmarko/BMbench) - A collection of simple benchmarks in various programming languages

- [Locomotive Software](https://www.cpcwiki.eu/index.php/Locomotive_Software) - The developer of CPCs BASIC and operating system

### **mv, 08/2022**
