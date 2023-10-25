/* globals cpcBasic */

"use strict";

cpcBasic.addItem("", function () { /*
100 REM testrsx - Test RSX TS
110 REM Marco Vieth, 2023
120 '
130 ' Special tests with user defined RSX
140 '
150 mode 1
160 print "Test user defined RSX"
170 gosub 13000
180 |TESTRSX,"test",4
500 stop
12990 'load rsx
13000 on error goto 13020
13010 |testrsx,"test",3
13020 resume 13030
13030 openin "!testrsx.rsx":closein
13040 on error goto 0
13060 return

*/ });
