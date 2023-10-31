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
175 print
180 |TESTRSX,"test",4:print "#";
200 gosub 9000:IF a$<>"test 4 " + "#" THEN ERROR 33
205 ?
210 call &a28f,"test",5:print "#";
220 gosub 9000:IF a$<>"test 5 " + "#" THEN ERROR 33
500 stop
900 '
9000 'get characters from screen; print crlf
9010 a$="":i=1:WHILE i<=80 AND RIGHT$(a$,1)<>"#":LOCATE i,VPOS(#0):a$=a$+COPYCHR$(#0):i=i+1:WEND:PRINT:RETURN
9020 '
12990 'load rsx
13000 on error goto 13020
13010 |testrsx,"test",3
13020 resume 13030
13030 on error goto 0
13040 openin "!testrsx.rsx":closein
13060 return

*/ });
