/* globals cpcBasic */

"use strict";

cpcBasic.addItem("", function () { /*
100 REM testspec - Test Special TS
110 REM Marco Vieth, 2023
120 '
130 ' Special tests which do not work with nodeJS
140 '
150 '|renum,100,100,10,9000:stop
160 '
170 t0!=TIME
180 IF chain1<>0 THEN ERROR 33:' chain (merge) running from begin
190 '
200 MODE 0
210 PRINT "Pixel Test Mode 0"
220 POKE &FF80,0:PLOT -1,0,1:IF PEEK(&FF80)<>128 OR TEST(-1,0)<>1 THEN ERROR 33
230 POKE &FF80,0:PLOT -2,0:IF PEEK(&FF80)<>128 OR TEST(-2,0)<>1 THEN ERROR 33
240 POKE &FF80,0:PLOT -3,0:IF PEEK(&FF80)<>128 OR TEST(-3,0)<>1 THEN ERROR 33
250 POKE &FF80,0:PLOT 0,-1:IF PEEK(&FF80)<>128 OR TEST(0,-1)<>1 THEN ERROR 33
260 '
270 GOSUB 9040
280 '
290 MODE 1
300 PRINT "Pixel Test Mode 1"
310 POKE &FF80,0:PLOT -1,0:IF PEEK(&FF80)<>128 OR TEST(-1,0)<>1 THEN ERROR 33
320 POKE &FF80,0:PLOT 0,-1:IF PEEK(&FF80)<>128 OR TEST(0,-1)<>1 THEN ERROR 33
330 '
400 '
420 LOCATE 2,12:PRINT "Test Special Area #"
430 i=0:ORIGIN 16,304+i:PLOT 0,-81-i,1:DRAWR 288-16,0
440 locate 1,12:gosub 9010:IF a$<>" Test Special Area #" THEN ERROR 33
450 i=1:ORIGIN 16,304+i:PLOT 0,-81-i:DRAWR 288-16,0
460 locate 1,12:gosub 9010:'IF a$<>"" THEN ERROR 33
480 ORIGIN 0,0
600 GOSUB 9040
610 '
620 MODE 2:'comment
630 '
640 PRINT "COPYCHR$"
650 PRINT "Detect char 143 with matching paper as char 32"
660 PEN 0:PAPER 1:PRINT CHR$(143);"#";:PEN 1
670 GOSUB 9010:PAPER 0:IF a$<>" #" THEN ERROR 33
680 PRINT "Detect custom character"
685 symbol after 254
690 SYMBOL 254,6,249,166
700 PRINT CHR$(254);"#";
710 GOSUB 9010:IF a$<>chr$(254)+"#" THEN ERROR 33
720 PRINT CHR$(254);"#";
725 SYMBOL AFTER 256
730 GOSUB 9010:IF a$<>" #" THEN ERROR 33
740 SYMBOL AFTER 240
1000 '
1010 PRINT "CHAIN, CHAIN MERGE"
1020 chain1=1:a=1
1030 CHAIN "testspec",1040
1040 IF a<>1 THEN ERROR 33
1050 a=a+1
1060 CHAIN MERGE "testspec",1070
1070 IF a<>2 THEN ERROR 33
1080 chain1=0
1090 '
1100 GOSUB 9040
1110 '
1120 PRINT "testspec finished: ok"
1130 END
1140 '
9000 'get characters from screen; print crlf
9010 a$="":i=1:WHILE i<=80 AND RIGHT$(a$,1)<>"#":LOCATE i,VPOS(#0):a$=a$+COPYCHR$(#0):i=i+1:WEND:PRINT:RETURN
9020 '
9030 'print separator and time
9040 PRINT:PRINT STRING$(10,"-");" Time until now (sec):";(TIME-t0!)/300:PRINT
9050 t!=TIME+3*50:a$="":WHILE TIME<t! AND a$="":a$=INKEY$:WEND:' wait some time or for key press
9060 RETURN
9070 '
*/ });
