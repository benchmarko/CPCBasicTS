/* globals cpcBasic */

"use strict";

cpcBasic.addItem("", function () { /*
10 REM Test Page TS
20 REM Marco Vieth, 2019-2020
30 '
40 '
50 '|renum,100,100,10,9000:stop
60 '
100 '
110 'pixel test
120 MODE 0
130 POKE &FF80,0:PLOT -1,0:IF PEEK(&FF80)<>128 or test(-1,0)<>1 THEN ERROR 33
140 POKE &FF80,0:PLOT -2,0:IF PEEK(&FF80)<>128 or test(-2,0)<>1 THEN ERROR 33
150 POKE &FF80,0:PLOT -3,0:IF PEEK(&FF80)<>128 or test(-3,0)<>1 THEN ERROR 33
160 POKE &FF80,0:PLOT 0,-1:IF PEEK(&FF80)<>128 or test(0,-1)<>1 THEN ERROR 33
170 MODE 1
180 POKE &FF80,0:PLOT -1,0:IF PEEK(&FF80)<>128 or test(-1,0)<>1 THEN ERROR 33
190 POKE &FF80,0:PLOT 0,-1:IF PEEK(&FF80)<>128 or test(0,-1)<>1 THEN ERROR 33
200 '
210 MODE 2:'comment
220 '
230 PRINT"Numbers"
240 a=1:IF a<>1 THEN ERROR 33
250 a%=1:IF a%<>1 THEN ERROR 33
260 a=1.2:IF a<>1.2 THEN ERROR 33
270 a!=1.2:IF a!<>1.2 THEN ERROR 33
280 a!=-1.2:IF a!<>-1.2 THEN ERROR 33
290 a=1200:IF a<>1200 THEN ERROR 33
300 a%=1200:IF a%<>1200 THEN ERROR 33
310 a=-7.2:IF a<>-7.2 THEN ERROR 33
320 a%=-7.2:IF a%<>-7 THEN ERROR 33
330 a=+7.2:IF a<>7.2 THEN ERROR 33
340 a=0.2:IF a<>0.2 THEN ERROR 33
350 a=2:IF a<>2 THEN ERROR 33
360 a=10000:IF a<>10000 THEN ERROR 33
370 a=0.0001:IF a<>0.0001 THEN ERROR 33
380 a=1e9-1:IF a<>1e9-1 OR a<>999999999 THEN ERROR 33
390 PRINT"hex number: &, &h"
400 a=&A7:IF a<>167 THEN ERROR 33
410 a%=&A7:IF a%<>167 THEN ERROR 33
420 a%=-&A7:IF a%<>-167 THEN ERROR 33
430 a%=&7FFF:IF a%<>32767 THEN ERROR 33
440 a=&A000:IF a<>-24576 THEN ERROR 33
450 PRINT"bin number: &x"
460 a=&X10100111:IF a<>167 THEN ERROR 33
470 a%=&X10100111:IF a%<>167 THEN ERROR 33
480 a%=&X111111111111111:IF a%<>32767 THEN ERROR 33
490 a%=-&X111111111111111:IF a%<>-32767 THEN ERROR 33
500 PRINT"Strings"
510 a$="a12":IF a$<>"a12" THEN ERROR 33
520 a$=+"7.1":IF a$<>"7.1" THEN ERROR 33
530 '
540 PRINT"Variable types"
550 a!=1.4:IF a!<>1.4 THEN ERROR 33
560 a!=1.5:IF a!<>1.5 THEN ERROR 33
570 a%=1.4:IF a%<>1 THEN ERROR 33
580 a%=1.5:IF a%<>2 THEN ERROR 33
590 a%=-1.5:IF a%<>-2 THEN ERROR 33
600 a$="1.4":IF a$<>"1.4" THEN ERROR 33
610 insert.line=2:IF insert.line<>2 THEN ERROR 33
620 '
630 PRINT"Array Variables"
640 a!(2)=1.4:IF a!(2)<>1.4 THEN ERROR 33
650 a!(2)=1.5:IF a!(2)<>1.5 THEN ERROR 33
660 a%(2)=1.4:IF a%(2)<>1 THEN ERROR 33
670 a%(2)=1.5:IF a%(2)<>2 THEN ERROR 33
680 a$(2)="1.4":IF a$(2)<>"1.4" THEN ERROR 33
690 '
700 PRINT"expressions, operators +-*..."
710 a%=1+2+3:IF a%<>6 THEN ERROR 33
720 a%=3-2-1:IF a%<>0 THEN ERROR 33
730 a%=&A7+&X10100111-(123-27):IF a%<>238 THEN ERROR 33
740 a%=3+2*3-7:IF a%<>2 THEN ERROR 33
750 a%=(3+2)*(3-7):IF a%<>-20 THEN ERROR 33
760 a=-(10-7)-(-6-2):IF a<>5 THEN ERROR 33
770 a=20/2.5:IF a<>8 THEN ERROR 33
780 a=20\3:IF a<>6 THEN ERROR 33
790 a=3^2:IF a<>9 THEN ERROR 33
800 a=&X1001 AND &X1110:IF a<>&X1000 THEN ERROR 33
810 a=&X1001 OR &X110:IF a<>&X1111 THEN ERROR 33
820 a=&X1001 XOR &X1010:IF a<>&X11 THEN ERROR 33
830 a=NOT &X1001:IF a<>-10 THEN ERROR 33
840 a=+++++++++---9:IF a<>-9 THEN ERROR 33
850 a=(1=0):IF a<>0 THEN ERROR 33
860 a=(1>0)*(0<1):IF a<>1 THEN ERROR 33
870 a=1=1=-1:IF a<>-1 THEN ERROR 33
880 GOSUB 9040
890 '
900 PRINT"ABS(positive number)"
910 a=ABS(+67.98):IF a<>67.98 THEN ERROR 33
920 a!=ABS(+67.98):IF a!<>67.98 THEN ERROR 33
930 PRINT"ABS(negative number)"
940 a=ABS(-67.98):IF a<>67.98 THEN ERROR 33
950 PRINT"ABS(0)"
960 a=ABS(0):IF a<>0 THEN ERROR 33
970 '
980 PRINT"@ (address of)": 'CPCBasic: just return internal variable index
990 CLEAR
1000 a=7:PRINT@a;@a^2;@a+1*2
1010 b=8:PRINT@b;@a(0)
1020 '
1030 PRINT"AND (and OR)"
1040 a=4 OR 7 AND 2:IF a<>6 THEN ERROR 33
1050 a%=4 OR 7 AND 2:IF a%<>6 THEN ERROR 33
1060 '
1070 PRINT"ASC"
1080 a=ASC("a"):IF a<>97 THEN ERROR 33
1090 a=ASC("ab"):IF a<>97 THEN ERROR 33
1100 ON ERROR GOTO 1110:a=ASC(""):PRINT"Error expected!":ERROR 33: 'expect error 5
1110 IF ERR<>5 THEN PRINT"err=";ERR;"erl=";ERL:ERROR 33 ELSE RESUME 1120
1120 ON ERROR GOTO 0
1130 ON ERROR GOTO 1140:a=ASC(0):PRINT"Error expected!":ERROR 33: 'expect error 13
1140 IF ERR<>13 THEN PRINT"err=";ERR;"erl=";ERL:ERROR 33 ELSE RESUME 1150
1150 ON ERROR GOTO 0
1160 '
1170 PRINT "ATN"
1180 RAD:a=INT(ATN(1)*100000000)/100000000:IF a<>0.78539816 THEN ERROR 33
1190 DEG:a=INT(ATN(1)*100000000)/100000000:RAD:IF STR$(a)<>" 45" THEN ERROR 33
1200 DEG:a=INT(ATN(TAN(45))*100000000)/100000000:RAD:IF STR$(a)<>" 45" THEN ERROR 33
1210 '
1220 PRINT "BIN$"
1230 b$=BIN$(0):IF b$<>"0" THEN ERROR 33
1240 b$=BIN$(255):IF b$<>"11111111" THEN ERROR 33
1250 b$=BIN$(255,10):IF b$<>"0011111111" THEN ERROR 33
1260 b$=BIN$(170,6):IF b$<>"10101010" THEN ERROR 33
1270 b$=BIN$(32767,16):IF b$<>"0111111111111111" THEN ERROR 33
1280 b$=BIN$(65535):IF b$<>"1111111111111111" THEN ERROR 33
1290 '
1300 'cls#0: a=2: cls #(a*3)
1310 PRINT"COPYCHR$"
1320 PRINT"Detect char 143 with matching pen"
1330 PRINT CHR$(143);"#";:PAPER 1
1340 GOSUB 9010:PAPER 0:IF a$<>CHR$(143)+"#" THEN PRINT"Check: Different on real CPC!":IF a$<>" #" THEN ERROR 33
1350 PRINT"Detect char 130 with matching paper as char 141"
1360 PEN 0:PAPER 1:PRINT CHR$(130);"#";:PEN 1
1370 GOSUB 9010:PAPER 0:IF a$<>CHR$(141)+"#" THEN PRINT"Check: Different on real CPC!":IF a$<>CHR$(130)+"#" THEN ERROR 33
1380 PRINT"Detect char 143 with matching paper as char 32"
1390 PEN 0:PAPER 1:PRINT CHR$(143);"#";:PEN 1
1400 GOSUB 9010:PAPER 0:IF a$<>" #" THEN ERROR 33
1410 '
1420 PRINT"DATA with spaces between arguments"
1430 b$="":RESTORE 1450
1440 READ a$:b$=b$+a$:IF a$<>"-1" THEN GOTO 1440
1450 DATA ",", "abc"  , xy, -1
1460 IF b$<>",abcxy-1" THEN ERROR 33
1470 PRINT"DATA with special characters"
1480 b$="":RESTORE 1490
1490 DATA " ",!"#$%&'()*+,","
1500 FOR i=1 TO 3:READ a$:b$=b$+a$:NEXT
1510 IF b$<>" !"+CHR$(34)+"#$%&'()*+," THEN ERROR 33
1520 PRINT"DATA is interpeted depending on variable type"
1530 DATA 001.6,001.6, 001.6
1540 READ a%,a!,a$
1550 IF a%<>2 THEN ERROR 33
1560 IF a!<>1.6 THEN ERROR 33
1570 IF a$<>"001.6" THEN ERROR 33
1580 DATA &a7, &ha7, &x10100111
1590 READ a%:IF a%<>&A7 THEN ERROR 33
1600 READ a%:IF a%<>&A7 THEN ERROR 33
1610 READ a%:IF a%<>&A7 THEN ERROR 33
1620 DATA &A000, &A000
1630 READ a%:IF a%<>-24576 OR a%<>&A000 THEN ERROR 33
1640 READ a$:IF a$<>"&A000" THEN ERROR 33
1650 PRINT"DATA with empty parameters"
1660 b$="":RESTORE 1760
1670 FOR i=1 TO 16:READ a$:b$=b$+a$:NEXT
1680 IF b$<>"1a11b1#" THEN ERROR 33
1690 PRINT"DATA reading empty as numbers"
1700 b$="":RESTORE 1760
1710 FOR i=1 TO 16
1720 IF i=8 OR i=13 OR i=16 THEN READ a$ ELSE READ a:a$=STR$(a)
1730 b$=b$+a$
1740 NEXT
1750 IF b$<>" 0 0 0 0 0 0 1a 0 1 1 0b 1 0#" THEN ERROR 33
1760 DATA
1770 DATA ,
1780 DATA ,,
1790 DATA 1
1800 DATA a
1810 DATA ,1
1820 DATA 1,
1830 DATA   b   ,   1   ,
1840 DATA #
1850 '
1860 PRINT"DEC$(number,format)"
1870 a$=DEC$(8.575,"##.##"):IF a$<>" 8.58" THEN ERROR 33
1880 a$=DEC$(15.35,"#.##"):IF a$<>"%15.35" THEN ERROR 33
1890 '
1900 PRINT"DEF FN"
1910 DEF FNf1(x)=x*x
1920 a=FNf1(2.5):IF a<>6.25 THEN ERROR 33
1930 a=FN f1(2.5):IF a<>6.25 THEN ERROR 33
1940 DEF FN f1%(x)=x*x
1950 a%=FNf1%(2.5):IF a%<>6 THEN ERROR 33
1960 a%=FN f1%(2.5):IF a%<>6 THEN ERROR 33
1970 a=FNf1%(2.5):IF a<>6 THEN ERROR 33
1980 DEF FN f1!(x)=x*x
1990 a!=FNf1!(2.5):IF a!<>6.25 THEN ERROR 33
2000 a!=FN f1!(2.5):IF a!<>6.25 THEN ERROR 33
2010 a=FNf1!(2.5):IF a<>6.25 THEN ERROR 33
2020 DEF FN f1$(x$)=x$+x$
2030 a$=FNf1$("a"):IF a$<>"aa" THEN ERROR 33
2040 a$=FN f1$("a"):IF a$<>"aa" THEN ERROR 33
2050 DEF FNf2=2.5*2.5
2060 a=FNf2:IF a<>6.25 THEN ERROR 33
2070 DEF FN f2%=2.5*2.5
2080 a%=FN f2%:IF a%<>6 THEN ERROR 33
2090 DEF FNf1(o,v,t)=o+v+t
2100 a=FNf1(1,2,3):IF a<>6 THEN ERROR 33
2110 '
2120 PRINT"DEFINT, DEFREAL, DEFSTR"
2130 i=0:i!=2:i%=3.5:i$="i"
2140 if i<>2 THEN ERROR 33
2150 if i%<>4 THEN ERROR 33
2160 defint i
2170 if i<>4 THEN ERROR 33
2180 if i!<>2 THEN ERROR 33
2190 if i%<>4 THEN ERROR 33
2200 if i$<>"i" THEN ERROR 33
2210 i=1.25:IF i<>1 THEN ERROR 33
2220 IF i%<>1 THEN ERROR 33
2230 DEFREAL i
2240 if i<>2 THEN ERROR 33
2250 IF i%<>1 THEN ERROR 33
2260 if i!<>2 THEN ERROR 33
2270 if i$<>"i" THEN ERROR 33
2280 i=1.2
2290 if i<>1.2 THEN ERROR 33
2300 if i!<>1.2 THEN ERROR 33
2310 if i%<>1 THEN ERROR 33
2320 DEFSTR i
2330 if i<>"i" THEN ERROR 33
2340 IF i%<>1 THEN ERROR 33
2350 if i!<>1.2 THEN ERROR 33
2360 if i$<>"i" THEN ERROR 33
2370 i="j"
2380 if i$<>"j" THEN ERROR 33
2390 DEFINT i
2400 PRINT"DIM"
2410 dim m(0)
2420 m(0)=2
2430 erase m
2440 a=1:dim m(a)
2450 m(0)=2:m(1)=3
2460 erase m
2470 dim m(12,13)
2480 m(12,13)=3
2490 erase m
2500 dim m(1,2)
2510 m(1,2)=4
2520 dim n(m(1,2),15)
2530 FOR i=0 TO m(1,2):n(i,15)=i:NEXT
2540 a=0:FOR i=0 TO m(1,2):a=a+n(i,15):NEXT:IF a<>10 THEN ERROR 33
2550 erase m,n
2560 '
2570 PRINT"ELSE"
2580 a=1 ELSE a=2
2590 ELSE a=3
2600 IF a<>1 THEN ERROR 33
2610 '
2620 PRINT"ERASE"
2630 ERASE a: 'a was used in previous tests
2640 DIM a(4):FOR i=0 TO 4:a(i)=i:NEXT
2650 a=0:FOR i=0 TO 4:a=a+a(i):NEXT:IF a<>10 THEN ERROR 33
2660 ERASE a
2670 IF a<>10 THEN ERROR 33
2680 a=0:FOR i=0 TO 4:a=a+a(i):NEXT:IF a<>0 THEN ERROR 33
2690 GOSUB 9040
2700 '
2710 PRINT"FIX"
2720 a=FIX(1.5)
2730 IF a<>1 THEN ERROR 33
2740 a=FIX(-1.5)
2750 IF a<>-1 THEN ERROR 33
2760 '
2770 PRINT"FOR with integer constants"
2780 a$="":FOR i=+4 TO 0 STEP -2:a$=a$+STR$(i):NEXT:IF a$<>" 4 2 0" THEN ERROR 33
2790 a=0:FOR i=++4 TO 1 STEP ---2:a=a+i:NEXT:IF a<>6 THEN ERROR 33: 'avoid ++ and -- in js!
2800 PRINT"FOR with integer variable and floating point ranges"
2810 a=0:FOR i%=1.2 TO 9.7 STEP 3.2:a=a+i%:NEXT:IF a<>22 THEN ERROR 33: '1+4+7+10
2820 PRINT"FOR with condition expressions"
2830 a=3:FOR i=a<>3 TO a>=3 STEP a=3:PRINT i;:NEXT:PRINT "#";
2840 GOSUB 9010:IF a$<>" 0 -1 #" THEN ERROR 33
2850 PRINT"FOR up to 2*PI"
2860 a=13/8*PI:FOR i=1 TO 3:a=a+1/8*PI:NEXT:IF a>2*PI THEN PRINT"limit exceeded by";a-2*PI;"(TODO)" ELSE PRINT"ok"
2870 'gosub 9040
2880 '
2890 PRINT"GOTO with leading zeros"
2900 GOTO 2910
2910 PRINT"ok"
2920 PRINT"IF"
2930 a=1:IF a=1 THEN GOTO 2950
2940 ERROR 33
2950 IF a=1 THEN 2970
2960 ERROR 33
2970 IF a=1 GOTO 2990
2980 ERROR 33
2990 IF a=1 THEN a=a+1:GOTO 3010
3000 ERROR 33
3010 a=1:IF a=1 THEN 3030:?"dead code":ERROR 33
3020 ERROR 33
3030 a=0:IF a=1 THEN 3040 ELSE 3050
3040 ERROR 33
3050 IF a=1 THEN 3060 ELSE GOTO 3070
3060 ERROR 33
3070 a=1:IF a=1 THEN GOSUB 3090:GOTO 3100
3080 ERROR 33
3090 a=0:RETURN
3100 if a<>0 THEN ERROR 33
3110 PRINT"INSTR"
3120 a=INSTR("Amstrad", "m"):IF a<>2 THEN ERROR 33
3130 a=INSTR("Amstrad", "sr"):IF a<>0 THEN ERROR 33
3140 a=INSTR(6,"amstrad", "a"):IF a<>6 THEN ERROR 33
3141 a=INSTR("", ""):IF a<>0 THEN ERROR 33
3142 a=INSTR(1, "", ""):IF a<>0 THEN ERROR 33
3143 a=INSTR(1, "ab", ""):IF a<>1 THEN ERROR 33
3150 PRINT"LOG"
3160 a=LOG(1000)/LOG(10): IF INT(a+1E-9)<>3 THEN ERROR 33
3170 PRINT"LOG10"
3180 a=LOG10(1000):IF a<>3 THEN ERROR 33
3190 PRINT "MAX"
3200 a=MAX(7):IF a<>7 THEN ERROR 33
3210 a=MAX(1.5,2.1,2.0):IF a<>2.1 THEN ERROR 33
3220 a$=MAX("abc"):IF a$<>"abc" THEN ERROR 33
3230 PRINT "MEMORY"
3240 h=HIMEM
3250 MEMORY &A000:IF HIMEM<>40960 THEN ERROR 33
3260 MEMORY -24576:IF HIMEM<>40960 THEN ERROR 33
3270 MEMORY 40960:IF HIMEM<>40960 THEN ERROR 33
3280 MEMORY h
3290 PRINT"MID$"
3300 a$="abcd":b$=mid$(a$,2):IF b$<>"bcd" THEN ERROR 33
3310 a$="abcd":b$=mid$(a$,2,2):IF b$<>"bc" THEN ERROR 33
3320 PRINT"MID$ as assign"
3330 a$="abcd":b$="xyz":MID$(a$,2)=b$:IF a$<>"axyz" OR b$<>"xyz" THEN ERROR 33
3340 a$="abcd":b$="xyz":MID$(a$,2,2)=b$:IF a$<>"axyd" THEN ERROR 33
3350 PRINT "MIN"
3360 a=MIN(7):IF a<>7 THEN ERROR 33
3370 a=MIN(1.5,2.1,2.0):IF a<>1.5 THEN ERROR 33
3380 a$=MIN("abc"):IF a$<>"abc" THEN ERROR 33
3390 PRINT"ON n GOSUB"
3400 a=0:ON 1 GOSUB 3470,3480:IF a<>1 THEN ERROR 33
3410 a=0:ON 2 GOSUB 3470,3480:IF a<>2 THEN ERROR 33
3420 a=0:ON 1.5 GOSUB 3470,3480:IF a<>2 THEN ERROR 33
3430 a=1.5:ON a GOSUB 3470,3480:IF a<>2 THEN ERROR 33
3440 a=0:ON 3 GOSUB 3470,3480:IF a<>0 THEN ERROR 33
3450 a=0:ON 0 GOSUB 3470,3480:IF a<>0 THEN ERROR 33
3460 GOTO 3490
3470 a=1:RETURN
3480 a=2:RETURN
3490 PRINT"ON n GOTO"
3500 a=1.7:ON a-0.2 GOTO 3520,3530
3510 GOTO 3540
3520 a=1:GOTO 3540
3530 a=2:GOTO 3540
3540 IF a<>2 THEN ERROR 33
3550 GOSUB 9040
3560 '
3570 PRINT"PRINT in FOR loop"
3580 FOR i=1 TO 5:PRINT i;:NEXT i:PRINT"#";
3590 GOSUB 9010:IF a$<>" 1  2  3  4  5 #" THEN ERROR 33
3600 FOR i=&FFFC to &3:PRINT i;:NEXT:PRINT"#";
3610 GOSUB 9010:IF a$<>"-4 -3 -2 -1  0  1  2  3 #" THEN ERROR 33
3620 PRINT"PRINT in GOTO loop"
3630 a=1
3640 PRINT a;: a=a+1: IF a <= 5 THEN GOTO 3640 ELSE PRINT "#";
3650 GOSUB 9010:IF a$<>" 1  2  3  4  5 #" THEN ERROR 33
3660 PRINT"PRINT in WHILE loop"
3670 a=1: WHILE a<=5: PRINT a;: a=a+1: WEND: PRINT "#";
3680 GOSUB 9010:IF a$<>" 1  2  3  4  5 #" THEN ERROR 33
3690 PRINT"PRINT concatenated string"
3700 a=1: s$="": WHILE a<=5: s$=s$+STR$(a)+":": a=a+1: b=0: WHILE b<3: b=b+1: s$=s$+STR$(b): WEND: s$=s$+" ": WEND: s$=s$+"#":PRINT s$;
3710 GOSUB 9010:IF a$<>" 1: 1 2 3  2: 1 2 3  3: 1 2 3  4: 1 2 3  5: 1 2 3 #" THEN ERROR 33
3720 '
3730 PRINT"IF THEN ELSE: WEND in ELSE"
3740 a=0: WHILE a<5: a=a+1: IF a=3 OR 3=a THEN PRINT "a=";a;"(three) "; ELSE PRINT "a<>3:";a;"(not three) ";: WEND : PRINT"after WEND": 'WEND in ELSE
3750 PRINT"#";
3760 GOSUB 9010:IF a$<>"a<>3: 1 (not three) a<>3: 2 (not three) a= 3 (three) #" THEN ERROR 33
3770 '
3780 GOSUB 9040
3790 PRINT"PRINT numbers separated by space"
3800 PRINT 123;:PRINT"#";
3810 GOSUB 9010: 'if a$<>" 1  2  3 #" then error 33: 'not ok! On real CPC one number: " 123 #"
3820 PRINT"PRINT numbers separated by ;"
3830 PRINT 1;2;3;:PRINT"#";
3840 GOSUB 9010:IF a$<>" 1  2  3 #" THEN ERROR 33
3850 PRINT"PRINT numbers separated by , (default ZONE 13)"
3860 PRINT 1,2,3;:PRINT"#";
3870 GOSUB 9010:IF a$<>" 1            2            3 #" THEN ERROR 33
3880 PRINT"PRINT numbers, computed"
3890 PRINT -1 -2 -3;"#";
3900 GOSUB 9010:IF a$<>"-6 #" THEN ERROR 33
3910 PRINT -1;-2;-3;"#";
3920 GOSUB 9010:IF a$<>"-1 -2 -3 #" THEN ERROR 33
3930 PRINT"PRINT strings separated by space"
3940 PRINT "a" "b" "c" "#";
3950 GOSUB 9010:IF a$<>"abc#" THEN ERROR 33
3960 PRINT"PRINT strings separated by ;"
3970 PRINT "a";"b";"c";"#";
3980 GOSUB 9010:IF a$<>"abc#" THEN ERROR 33
3990 PRINT"PRINT strings separated by ,"
4000 PRINT "a","b","c";"#";: '[zone 13]
4010 GOSUB 9010:IF a$<>"a            b            c#" THEN ERROR 33
4020 ZONE 5
4030 PRINT "a","b","c";"#";: '[zone 5]
4040 GOSUB 9010:IF a$<>"a    b    c#" THEN ERROR 33
4050 ZONE 13
4060 PRINT"PRINT strings separated by tab()"
4070 PRINT "a"TAB(2)"b"TAB(3)"c"TAB(4)"#";
4080 GOSUB 9010:IF a$<>"abc#" THEN ERROR 33
4090 PRINT "a"TAB(13)"b"TAB(20)"c"TAB(22)"#";
4100 GOSUB 9010:IF a$<>"a           b      c #" THEN ERROR 33
4110 PRINT "a"TAB(78)"bc#";
4120 IF POS(#0)<>1 THEN ERROR 33
4130 PRINT CHR$(8);: 'back
4140 IF POS(#0)<>80 THEN ERROR 33
4150 GOSUB 9010:IF a$<>"a                                                                            bc#" THEN ERROR 33
4160 PRINT "a"TAB(79)"bc#";
4170 GOSUB 9010:IF a$<>"bc#" THEN ERROR 33
4180 PRINT"PRINT number without separator"
4190 PRINT &X10 2;"#";
4200 GOSUB 9010:IF a$<>" 2  2 #" THEN ERROR 33
4210 GOSUB 9040
4220 '
4230 PRINT"PRINT special exponential number expressions"
4240 PRINT 1e9-1;1e9;:PRINT"#";
4250 GOSUB 9010:IF a$<>" 999999999  1E+09 #" THEN ERROR 33
4260 PRINT 1 e++4;:PRINT"#";
4270 GOSUB 9010:IF a$<>" 1  4 #" THEN ERROR 33
4280 PRINT 1 e+-4;:PRINT"#";
4290 GOSUB 9010:IF a$<>" 1 -4 #" THEN ERROR 33
4300 PRINT 50000 0.5;:PRINT"#";
4310 GOSUB 9010: 'IF a$<>" 50000  0.5 #" THEN ERROR 33: 'TODO this one will be put together on a real CPC
4320 PRINT 1 EXP(0);:PRINT"#";
4330 GOSUB 9010:IF a$<>" 1  1 #" THEN ERROR 33
4340 '
4350 PRINT"PRINT USING number format"
4360 PRINT USING "##.##";0;:PRINT"#";
4370 GOSUB 9010:IF a$<>" 0.00#" THEN ERROR 33
4380 PRINT USING "##.##";-1.2;:PRINT"#";
4390 GOSUB 9010:IF a$<>"-1.20#" THEN ERROR 33
4400 PRINT USING "##.##";1.005;:PRINT"#";
4410 GOSUB 9010:IF a$<>" 1.01#" THEN ERROR 33
4420 PRINT USING "##.##";8.575;:PRINT"#";
4430 GOSUB 9010:IF a$<>" 8.58#" THEN ERROR 33
4440 PRINT"PRINT USING number too long"
4450 PRINT USING "#.##";15.355;:PRINT"#";
4460 GOSUB 9010:IF a$<>"%15.36#" THEN ERROR 33
4470 PRINT USING "[#,###,###]";1234567;123;12345678;:PRINT"#";
4480 GOSUB 9010:IF a$<>"[1,234,567][      123][%12,345,678]#" THEN ERROR 33
4490 PRINT"PRINT USING string format"
4500 PRINT USING "\   \";"n1";"n2";" xx3";:PRINT"#";
4510 GOSUB 9010:IF a$<>"n1   n2    xx3 #" THEN ERROR 33
4520 PRINT USING "!";"a1";"b2";:PRINT"#";
4530 GOSUB 9010:IF a$<>"ab#" THEN ERROR 33
4540 PRINT USING "&";"a1";"b2";:PRINT"#";
4550 GOSUB 9010:IF a$<>"a1b2#" THEN ERROR 33
4560 'gosub 9040
4570 '
4580 PRINT"ROUND"
4590 a=ROUND(PI):IF a<>3 THEN ERROR 33
4600 a=ROUND(PI,0):IF a<>3 THEN ERROR 33
4610 a=ROUND(PI,0.4):IF a<>3 THEN ERROR 33
4620 a=ROUND(PI,2):IF a<>3.14 THEN ERROR 33
4630 a=ROUND(PI,2.4):IF a<>3.14 THEN ERROR 33
4640 a=ROUND(1234.5678,-2):IF a<>1200 THEN ERROR 33
4650 a=ROUND(8.575,2):IF a<>8.58 THEN ERROR 33
4660 a=ROUND(-8.575,2):IF a<>-8.58 THEN ERROR 33
4670 a=ROUND(1.005,2):IF a<>1.01 THEN ERROR 33
4680 a=ROUND(-1.005,2):IF a<>-1.01 THEN ERROR 33
4690 '
4700 GOSUB 9040
4710 PRINT"DATA and RESTORE"
4720 RESTORE 4730: READ s$,t$: IF s$+t$<>"1" THEN ERROR 33
4730 DATA 1,
4740 '
4750 PRINT "TAN"
4760 RAD:a=INT(TAN(0.7853981635)*100000000)/100000000:IF a<>1 THEN ERROR 33
4770 DEG:a=INT(TAN(45)*100000000+0.00000001)/100000000:RAD:IF a<>1 THEN ERROR 33
4780 '
4790 PRINT"OPENIN and LINE INPUT #9"
4800 t$="testpage.dat":PRINT"OPENIN ";t$;" with characters 33..255"
4810 OPENIN "!"+t$
4820 FOR i=33 TO 255:LINE INPUT #9,t$
4830 t=ASC(t$):PRINT t$;: IF t<>i THEN PRINT"error:";i;"<>";t:ERROR 33
4840 PRINT t$;
4850 NEXT
4860 PRINT
4870 CLOSEIN
4880 PRINT
4890 '
4900 PRINT"OPENOUT, OPENIN and LINE INPUT #9"
4910 OPENOUT "!testpg2.dat"
4920 FOR i=33 TO 255:t$=CHR$(i):PRINT #9,t$
4930 NEXT
4940 CLOSEOUT
4950 OPENIN "!testpg2.dat"
4960 FOR i=33 TO 255:LINE INPUT #9,t$:PRINT t$;
4970 t=ASC(t$):IF t<>i THEN PRINT"error:";i;"<>";t:ERROR 33
4980 NEXT
4990 CLOSEIN
5000 PRINT:PRINT
5010 '
5020 PRINT"Numbers in files"
5030 OPENOUT "!testpg2.dat"
5040 FOR i=0 TO 10:PRINT#9,i:NEXT :'separate lines
5050 CLOSEOUT
5060 OPENIN "!testpg2.dat"
5070 FOR i=0 TO 10:INPUT #9,t
5080 IF i<>t THEN PRINT"error:";i;"<>";t:ERROR 33
5090 NEXT
5100 CLOSEIN
5110 OPENIN "!testpg2.dat"
5120 FOR i=0 TO 10:INPUT #9,t$
5130 a$=STR$(i)+" ":a$=RIGHT$(a$,LEN(a$)-1):IF a$<>t$ THEN PRINT"error:";a$;"<>";t$:ERROR 33
5140 NEXT
5150 CLOSEIN
5160 '
5170 OPENOUT "!testpg2.dat"
5180 FOR i=0 TO 10:PRINT#9,i;:NEXT :'one line
5190 CLOSEOUT
5200 OPENIN "!testpg2.dat"
5210 FOR i=0 TO 10:INPUT #9,t
5220 IF i<>t THEN PRINT"error:";i;"<>";t:ERROR 33
5230 NEXT
5240 CLOSEIN
5250 OPENIN "!testpg2.dat"
5260 INPUT #9,t$
5270 IF t$<>"0  1  2  3  4  5  6  7  8  9  10 " THEN PRINT"error:";:ERROR 33
5280 CLOSEIN
5290 PRINT
5300 '
5310 PRINT"Mixed style"
5320 OPENOUT "!testpg2.dat"
5330 FOR i=0 TO 10:PRINT#9,i;"&a1";&A2:NEXT
5340 CLOSEOUT
5350 OPENIN "!testpg2.dat"
5360 FOR i=0 TO 10:INPUT #9,t,t2
5370 IF i<>t THEN PRINT"error:";i;"<>";t:ERROR 33
5380 IF t2<>&A1 THEN PRINT"error:";t2;"<>";&A1:ERROR 33
5390 INPUT #9,t2
5400 IF t2<>&A2 THEN PRINT"error:";t2;"<>";&A2:ERROR 33
5410 NEXT
5420 CLOSEIN
5430 '
5440 PRINT"Separated with comma"
5450 OPENOUT "!testpg2.dat"
5460 FOR i=0 TO 25:PRINT#9,i+65,CHR$(i+65):NEXT
5470 CLOSEOUT
5480 OPENIN "!testpg2.dat"
5490 FOR i=0 TO 25:INPUT #9,t,t$
5500 IF i+65<>t THEN PRINT"error:";i+65;"<>";t:ERROR 33
5510 IF t$<>CHR$(i+65) THEN PRINT"error:";t$;"<>";CHR$(i+65):ERROR 33
5520 NEXT
5530 CLOSEIN
5540 '
5550 PRINT"WRITE and INPUT"
5560 OPENOUT "!testpg2.dat"
5570 FOR i=0 TO 25:WRITE #9,i+65,CHR$(i+65):NEXT
5580 CLOSEOUT
5590 OPENIN "!testpg2.dat"
5600 FOR i=0 TO 25:INPUT #9,t,t$
5610 IF i+65<>t THEN PRINT"error:";i+65;"<>";t:ERROR 33
5620 IF t$<>CHR$(i+65) THEN PRINT"error:";t$;"<>";CHR$(i+65):ERROR 33
5630 NEXT
5640 CLOSEIN
5650 '
5660 ?"POS(#9)"
5670 OPENOUT"!testpg2.dat":a$=""
5680 FOR i=65 TO 70
5690 a$=a$+CHR$(i)
5700 ?#9,CHR$(13);a$;
5710 ?POS(#9);
5720 NEXT:CLOSEOUT
5730 PRINT"#";
5740 GOSUB 9010:?:IF a$<>" 2  3  4  5  6  7 #" THEN ERROR 33
5750 '
5760 '
5770 PRINT"|ERA to delete testpg2.dat (CPC: DISC only)"
5780 |ERA,"testpg2.dat"
5790 '
5800 GOSUB 9040
5810 '
5820 PRINT"SYMBOL AFTER"
5830 a=240:h=HIMEM+(256-a)*8
5840 a=256:SYMBOL AFTER a:IF HIMEM<>h-(256-a)*8 THEN PRINT"error:";HIMEM;"<>";h:ERROR 33
5850 a=0:SYMBOL AFTER a:IF HIMEM<>h-(256-a)*8 THEN PRINT"error:";HIMEM;"<>";h:ERROR 33
5860 a=240:SYMBOL AFTER a:IF HIMEM<>h-(256-a)*8 THEN PRINT"error:";HIMEM;"<>";h:ERROR 33
5870 MEMORY HIMEM-1
5880 ON ERROR GOTO 5890:SYMBOL AFTER 241:PRINT"Error expected!":ERROR 33: 'expect error 5
5890 IF ERR<>5 THEN PRINT"err=";ERR;"erl=";ERL:ERROR 33 ELSE RESUME 5900
5900 ON ERROR GOTO 0
5910 MEMORY HIMEM+1
5920 PRINT"UNT"
5930 a=UNT(32767):IF a<>32767 THEN ERROR 33
5940 a=UNT(32768):IF a<>-32768 THEN ERROR 33
5950 a=UNT(65535):IF a<>-1 THEN ERROR 33
5960 PRINT"VAL"
5970 a=VAL(""):IF a<>0 THEN ERROR 33
5980 a=VAL("4r"):IF a<>4 THEN ERROR 33
5990 a=VAL("&ff"):IF a<>&FF THEN ERROR 33
6000 a=VAL("&A000"):IF a<>-24576 or a<>&A000 or a<>&hA000 THEN ERROR 33
6010 a=VAL("&ha000"):IF a<>-24576 or a<>&a000 or a<>&ha000 THEN ERROR 33
6020 '
6030 PRINT "WRITE"
6040 WRITE 1e9-1,1e9,"1e9","#"
6050 GOSUB 9010:IF a$<>"999999999,1E+09,"+chr$(34)+"1e9"+chr$(34)+","+chr$(34)+"#" THEN ERROR 33
6060 WRITE 1e9-1;1e9;"1e9","#"
6070 GOSUB 9010:IF a$<>"999999999,1E+09,"+chr$(34)+"1e9"+chr$(34)+","+chr$(34)+"#" THEN ERROR 33
6080 '
6090 GOSUB 9040
6100 '
6110 PRINT "stairs"
6120 FOR i=1 TO 24:PRINT STRING$(i*2, "O"):NEXT
6130 MOVE 0,350
6140 FOR n=1 TO 8
6150 DRAWR 50,0
6160 DRAWR 0,-50
6170 NEXT
6180 MOVE 348,0
6190 FILL 1
6200 '
6210 PRINT "test finished: ok"
6220 END
6230 '
9000 'get characters from screen; print crlf
9010 a$="":i=1:WHILE i<=80 AND RIGHT$(a$,1)<>"#":LOCATE i,VPOS(#0):a$=a$+COPYCHR$(#0):i=i+1:WEND:PRINT:RETURN
9020 '
9030 'wait some time or for key press
9040 t!=TIME+6*50:a$="":WHILE TIME<t! AND a$="":a$=INKEY$:WEND
9050 PRINT:PRINT STRING$(10, "-"):PRINT
9060 RETURN
9070 '
*/ });
