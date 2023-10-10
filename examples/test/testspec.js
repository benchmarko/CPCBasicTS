/* globals cpcBasic */

"use strict";

cpcBasic.addItem("", function () { /*
10 REM Test Special TS
20 REM Marco Vieth, 2023
30 '
35 ' Special tests which do not work with nodeJS
40 '
50 '|renum,100,100,10,9000:stop
60 '
70 t0! = TIME
80 IF chain1<>0 THEN ERROR 33:' chain (merge) running from begin
100 '
110 MODE 0
120 PRINT "Pixel Test Mode 0"
130 POKE &FF80,0:PLOT -1,0:IF PEEK(&FF80)<>128 or test(-1,0)<>1 THEN ERROR 33
140 POKE &FF80,0:PLOT -2,0:IF PEEK(&FF80)<>128 or test(-2,0)<>1 THEN ERROR 33
150 POKE &FF80,0:PLOT -3,0:IF PEEK(&FF80)<>128 or test(-3,0)<>1 THEN ERROR 33
160 POKE &FF80,0:PLOT 0,-1:IF PEEK(&FF80)<>128 or test(0,-1)<>1 THEN ERROR 33
162 '
165 GOSUB 9040
168 '
170 MODE 1
172 PRINT "Pixel Test Mode 1"
180 POKE &FF80,0:PLOT -1,0:IF PEEK(&FF80)<>128 or test(-1,0)<>1 THEN ERROR 33
190 POKE &FF80,0:PLOT 0,-1:IF PEEK(&FF80)<>128 or test(0,-1)<>1 THEN ERROR 33
193 '
195 GOSUB 9040
200 '
210 MODE 2:'comment
220 '
1310 PRINT"COPYCHR$"
1380 PRINT"Detect char 143 with matching paper as char 32"
1390 PEN 0:PAPER 1:PRINT CHR$(143);"#";:PEN 1
1400 GOSUB 9010:PAPER 0:IF a$<>" #" THEN ERROR 33
1410 '
6092 '
6093 PRINT "CHAIN, CHAIN MERGE"
6094 chain1=1:a=1
6095 chain "testspec", 6096
6096 IF a<>1 THEN ERROR 33
6097 a=a+1
6098 chain merge "testspec", 6099
6099 IF a<>2 THEN ERROR 33
6100 chain1=0
6104 '
6105 GOSUB 9040
6200 '
6210 PRINT "testspec finished: ok"
6220 END
6230 '
9000 'get characters from screen; print crlf
9010 a$="":i=1:WHILE i<=80 AND RIGHT$(a$,1)<>"#":LOCATE i,VPOS(#0):a$=a$+COPYCHR$(#0):i=i+1:WEND:PRINT:RETURN
9020 '
9030 'print separator and time
9040 PRINT:PRINT STRING$(10, "-");" Time until now (sec):";(TIME-t0!)/300:PRINT
9050 't!=TIME+6*50:a$="":WHILE TIME<t! AND a$="":a$=INKEY$:WEND:' wait some time or for key press
9060 RETURN
9070 '
*/ });
