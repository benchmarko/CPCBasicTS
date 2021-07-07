// CodeGeneratorToken.qunit.ts - QUnit tests for CPCBasic CodeGeneratorToken
//

const bGenerateAllResults = false;

import { Utils } from "../Utils";
import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { CodeGeneratorToken } from "../CodeGeneratorToken";
import {} from "qunit";

type TestsType = {[k in string]: string};

type AllTestsType = {[k in string]: TestsType};

QUnit.module("CodeGeneratorToken: Tests", function (/* hooks */) {
	const mAllTests: AllTestsType = {
		numbers: {
			"a=1": "0D,00,00,E1,EF,0F",
			"a=1.2": "0D,00,00,E1,EF,1F,9A,99,99,19,81",
			"a=-1.2": "0D,00,00,E1,EF,F5,1F,9A,99,99,19,81",
			"a=+7.2": "0D,00,00,E1,EF,F4,1F,66,66,66,66,83",
			"a=&A7": "0D,00,00,E1,EF,1C,A7,00",
			"a=-&A7": "0D,00,00,E1,EF,F5,1C,A7,00",
			"a=&7FFF": "0D,00,00,E1,EF,1C,FF,7F",
			"a=&X10100111": "0D,00,00,E1,EF,1B,A7,00",
			"a=-&X111111111111111": "0D,00,00,E1,EF,F5,1B,FF,7F",
			"a=255": "0D,00,00,E1,EF,19,FF",
			"a=-255": "0D,00,00,E1,EF,F5,19,FF",
			"a=256": "0D,00,00,E1,EF,1A,00,01",
			"a=-256": "0D,00,00,E1,EF,F5,1A,00,01",
			"a=32767": "0D,00,00,E1,EF,1A,FF,7F",
			"a=-32767": "0D,00,00,E1,EF,F5,1A,FF,7F",
			"a=32768": "0D,00,00,E1,EF,1F,00,00,00,00,8F",
			"a=-32768": "0D,00,00,E1,EF,F5,1F,00,00,00,00,8F",
			"a=1.2e+9": "0D,00,00,E1,EF,1F,00,18,0D,0F,9F"
		},
		strings: {
			"a$=\"a12\"": "03,00,00,E1,EF,22,61,31,32,22",
			"a$=+\"7.1\"": "03,00,00,E1,EF,F4,22,37,2E,31,22"
		},
		variables: {
			"a!=1.4": "04,00,00,E1,EF,1F,33,33,33,33,81",
			"a%=1.4": "02,00,00,E1,EF,1F,33,33,33,33,81",
			"a$=\"1.4\"": "03,00,00,E1,EF,22,31,2E,34,22",
			"insert.line=2": "0D,00,00,69,6E,73,65,72,74,2E,6C,69,6E,E5,EF,10",
			"a!(2)=1.4": "04,00,00,E1,28,10,29,EF,1F,33,33,33,33,81",
			"a%(2)=1.4": "02,00,00,E1,28,10,29,EF,1F,33,33,33,33,81",
			"a$(2)=\"1.4\"": "03,00,00,E1,28,10,29,EF,22,31,2E,34,22",
			"a$[2]=\"1.4\"": "03,00,00,E1,5B,10,5D,EF,22,31,2E,34,22",
			"a(9)=b(1,2)": "0D,00,00,E1,28,17,29,EF,0D,00,00,E2,28,0F,2C,10,29",
			"a[9]=b[1,2]": "0D,00,00,E1,5B,17,5D,EF,0D,00,00,E2,5B,0F,2C,10,5D",
			"a(10,10,10)=b(10,9)": "0D,00,00,E1,28,19,0A,2C,19,0A,2C,19,0A,29,EF,0D,00,00,E2,28,19,0A,2C,17,29"
		},
		expressions: {
			"a=1+2+3": "0D,00,00,E1,EF,0F,F4,10,F4,11",
			"a=3-2-1": "0D,00,00,E1,EF,11,F5,10,F5,0F",
			"a=3-2-1:": "0D,00,00,E1,EF,11,F5,10,F5,0F,01",
			"a=&A7+&X10100111-(123-27)": "0D,00,00,E1,EF,1C,A7,00,F4,1B,A7,00,F5,28,19,7B,F5,19,1B,29",
			"a=(3+2)*(3-7)": "0D,00,00,E1,EF,28,11,F4,10,29,F6,28,11,F5,15,29",
			"a=-(10-7)-(-6-2)": "0D,00,00,E1,EF,F5,28,19,0A,F5,15,29,F5,28,F5,14,F5,10,29",
			"a=20/2.5": "0D,00,00,E1,EF,19,14,F7,1F,00,00,00,20,82",
			"a=20\\3": "0D,00,00,E1,EF,19,14,F9,11",
			"a=3^2": "0D,00,00,E1,EF,11,F8,10",
			"a=&X1001 AND &X1110": "0D,00,00,E1,EF,1B,09,00,FA,1B,0E,00",
			"a=&X1001 OR &X110": "0D,00,00,E1,EF,1B,09,00,FC,1B,06,00",
			"a=&X1001 XOR &X1010": "0D,00,00,E1,EF,1B,09,00,FD,1B,0A,00",
			"a=NOT &X1001": "0D,00,00,E1,EF,FE,1B,09,00",
			"a=+++++++++---9": "0D,00,00,E1,EF,F4,F4,F4,F4,F4,F4,F4,F4,F4,F5,F5,F5,17",
			"a=(1=0)": "0D,00,00,E1,EF,28,0F,EF,0E,29",
			"a=(1>0)*(0<1)": "0D,00,00,E1,EF,28,0F,EE,0E,29,F6,28,0E,F1,0F,29",
			"a=(b%>=c%)*(d<=e)": "0D,00,00,E1,EF,28,02,00,00,E2,F0,02,00,00,E3,29,F6,28,0D,00,00,E4,F3,0D,00,00,E5,29"
		},
		special: {
			"a=1:b=2": "0D,00,00,E1,EF,0F,01,0D,00,00,E2,EF,10",
			"a$=\"string with\nnewline\"": "03,00,00,E1,EF,22,73,74,72,69,6E,67,20,77,69,74,68,0A,6E,65,77,6C,69,6E,65,22",
			"::a=3-2-1: :": "01,01,0D,00,00,E1,EF,11,F5,10,F5,0F,01,01", //TTT
			" a =  ( b% >= c%  ) *     ( d <=e )  ": "0D,00,00,E1,EF,28,02,00,00,E2,F0,02,00,00,E3,20,20,29,F6,28,0D,00,00,E4,F3,0D,00,00,E5,29", // additional spaces
			"a = (((3+2))*((3-7)))": "0D,00,00,E1,EF,28,28,28,11,F4,10,29,29,F6,28,28,11,F5,15,29,29,29" // additional brackets
		},
		"abs, after gosub, and, asc, atn, auto": {
			"a=abs(2.3)": "0D,00,00,E1,EF,FF,00,28,1F,33,33,33,13,82,29",
			"after 2 gosub 10": "80,10,9F,1E,0A,00",
			"after 3,1 gosub 10": "80,11,2C,0F,9F,1E,0A,00",
			"a=b and c": "0D,00,00,E1,EF,0D,00,00,E2,FA,0D,00,00,E3",
			"a=asc(\"A\")": "0D,00,00,E1,EF,FF,01,28,22,41,22,29",
			"a=atn(2.3)": "0D,00,00,E1,EF,FF,02,28,1F,33,33,33,13,82,29",
			"auto ": "81"
		},
		"bin$, border": {
			"a$=bin$(3)": "03,00,00,E1,EF,FF,71,28,11,29",
			"a$=bin$(3,8)": "03,00,00,E1,EF,FF,71,28,11,2C,16,29",
			"a$=bin$(&x1001)": "03,00,00,E1,EF,FF,71,28,1B,09,00,29",
			"border 5": "82,20,13",
			"border 5,a": "82,20,13,2C,0D,00,00,E1"
		},
		"call, cat, chain, chain merge, chr$, cint, clg, closein, closeout, cls, cont, copychr$, cos, creal, cursor": {
			"call&a7bc": "83,20,1C,BC,A7",
			"call 4711,1,2,3,4": "83,20,1A,67,12,2C,0F,2C,10,2C,11,2C,12",
			"cat ": "84",
			"chain\"f1\"": "85,20,22,66,31,22",
			"chain\"f2\" , 10": "85,20,22,66,32,22,2C,19,0A",
			"chain\"f3\" , 10+3": "85,20,22,66,33,22,2C,19,0A,F4,11",
			"chain merge \"f1\"": "85,AB,22,66,31,22",
			"chain merge \"f2\" , 10": "85,AB,22,66,32,22,2C,19,0A",
			"chain merge \"f3\" , 10+3": "85,AB,22,66,33,22,2C,19,0A,F4,11",
			"chain merge \"f4\" , 10+3, delete 100-200": "85,AB,22,66,34,22,2C,19,0A,F4,11,2C,92,1E,64,00,F5,1E,C8,00",
			"chain merge \"f5\" , , delete 100-200": "85,AB,22,66,35,22,2C,2C,92,1E,64,00,F5,1E,C8,00",
			"a=chr$(65)": "0D,00,00,E1,EF,FF,03,28,19,41,29",
			"a=cint(2.3)": "0D,00,00,E1,EF,FF,04,28,1F,33,33,33,13,82,29",
			"clear ": "86",
			"clear input": "86,A3",
			"clg ": "87",
			"clg 15-1": "87,20,19,0F,F5,0F",
			"closein ": "88",
			"closeout ": "89",
			"cls ": "8A",
			"cls #5": "8A,23,13",
			"cls #a+7-2*b": "8A,23,0D,00,00,E1,F4,15,F5,10,F6,0D,00,00,E2",
			"cont ": "8B",
			"a$=copychr$(#0)": "03,00,00,E1,EF,FF,7E,28,23,0E,29",
			"a$=copychr$(#a+1)": "03,00,00,E1,EF,FF,7E,28,23,0D,00,00,E1,F4,0F,29",
			"a=cos(2.3)": "0D,00,00,E1,EF,FF,05,28,1F,33,33,33,13,82,29",
			"a=creal(2.3+a)": "0D,00,00,E1,EF,FF,06,28,1F,33,33,33,13,82,F4,0D,00,00,E1,29",
			"cursor ": "E1",
			"cursor 0": "E1,20,0E",
			"cursor 1": "E1,20,0F",
			"cursor 1,1": "E1,20,0F,2C,0F",
			"cursor ,1": "E1,20,2C,0F",
			"cursor #2": "E1,23,10",
			"cursor #2,1": "E1,23,10,2C,0F",
			"cursor #2,1,1": "E1,23,10,2C,0F,2C,0F",
			"cursor #2,,1": "E1,23,10,2C,2C,0F"
		},
		"data, dec$, def fn, defint, defreal, defstr, deg, delete, derr, di, dim, draw, drawr": {
			"data ": "8C",
			"data ,": "8C,2C",
			"data 1,2,3": "8C,20,31,2C,32,2C,33",
			"data \"item1\",\" item2\",\"item3 \"": "8C,20,22,69,74,65,6D,31,22,2C,22,20,69,74,65,6D,32,22,2C,22,69,74,65,6D,33,20,22",
			"data item1,item2,item3": "8C,20,69,74,65,6D,31,2C,69,74,65,6D,32,2C,69,74,65,6D,33",
			"data &a3,4,abc,": "8C,20,26,61,33,2C,34,2C,61,62,63,2C",
			"data \" \",//": "8C,20,22,20,22,2C,2F,2F",
			"data \" \",!\"#$%&'()*+,\",\"": "8C,20,22,20,22,2C,21,22,23,24,25,26,27,28,29,2A,2B,2C,22,2C,22",
			"a$=dec$(3,\"##.##\")": "03,00,00,E1,EF,FF,72,28,11,2C,22,23,23,2E,23,23,22,29",
			"a$=dec$(a$,\"\\    \\\")": "03,00,00,E1,EF,FF,72,28,03,00,00,E1,2C,22,5C,20,20,20,20,5C,22,29",
			"def fnclk=10": "8D,20,E4,0D,00,00,63,6C,EB,EF,19,0A",
			"def fnclk(a)=a*10": "8D,20,E4,0D,00,00,63,6C,EB,28,0D,00,00,E1,29,EF,0D,00,00,E1,F6,19,0A",
			"def fnclk(a,b)=a*10+b": "8D,20,E4,0D,00,00,63,6C,EB,28,0D,00,00,E1,2C,0D,00,00,E2,29,EF,0D,00,00,E1,F6,19,0A,F4,0D,00,00,E2",
			"def fnclk$(a$,b$)=a$+b$": "8D,20,E4,03,00,00,63,6C,EB,28,03,00,00,E1,2C,03,00,00,E2,29,EF,03,00,00,E1,F4,03,00,00,E2",
			"def fn clk=10": "8D,20,E4,20,0D,00,00,63,6C,EB,EF,19,0A",
			"def fn clk(a)=a*10": "8D,20,E4,20,0D,00,00,63,6C,EB,28,0D,00,00,E1,29,EF,0D,00,00,E1,F6,19,0A",
			"def fn clk(a,b)=a*10+b": "8D,20,E4,20,0D,00,00,63,6C,EB,28,0D,00,00,E1,2C,0D,00,00,E2,29,EF,0D,00,00,E1,F6,19,0A,F4,0D,00,00,E2",
			"def fn clk$(a$,b$)=a$+b$": "8D,20,E4,20,03,00,00,63,6C,EB,28,03,00,00,E1,2C,03,00,00,E2,29,EF,03,00,00,E1,F4,03,00,00,E2",
			"defint a": "8E,20,61",
			"defint a-t": "8E,20,61,2D,74",
			"defint a,b,c": "8E,20,61,2C,62,2C,63",
			"defint a,b-c,v,x-y": "8E,20,61,2C,62,2D,63,2C,76,2C,78,2D,79",
			"defreal a": "8F,20,61",
			"defreal a-t": "8F,20,61,2D,74",
			"defreal a,b,c": "8F,20,61,2C,62,2C,63",
			"defreal a,b-c,v,x-y": "8F,20,61,2C,62,2D,63,2C,76,2C,78,2D,79",
			"defstr a": "90,20,61",
			"defstr a-t": "90,20,61,2D,74",
			"defstr a,b,c": "90,20,61,2C,62,2C,63",
			"defstr a,b-c,v,x-y": "90,20,61,2C,62,2D,63,2C,76,2C,78,2D,79",
			"deg ": "91",
			"delete": "92",
			"delete 10": "92,20,1E,0A,00",
			"delete 1-": "92,20,1E,01,00,F5",
			"delete -1": "92,20,F5,1E,01,00",
			"delete 1-2": "92,20,1E,01,00,F5,1E,02,00",
			"a=derr ": "0D,00,00,E1,EF,FF,49",
			"di ": "DB",
			"dim a(1)": "93,20,0D,00,00,E1,28,0F,29",
			"dim a!(1)": "93,20,04,00,00,E1,28,0F,29",
			"dim a%(1)": "93,20,02,00,00,E1,28,0F,29",
			"dim a$(1)": "93,20,03,00,00,E1,28,0F,29",
			"dim a(2,13)": "93,20,0D,00,00,E1,28,10,2C,19,0D,29",
			"dim a(2,13+7),b$[3],c![2*a,7]": "93,20,0D,00,00,E1,28,10,2C,19,0D,F4,15,29,2C,03,00,00,E2,5B,11,5D,2C,04,00,00,E3,5B,10,F6,0D,00,00,E1,2C,15,5D",
			"dim a[2,13)": "93,20,0D,00,00,E1,5B,10,2C,19,0D,29",
			"draw 10,20": "94,20,19,0A,2C,19,14",
			"draw -10,-20,7": "94,20,F5,19,0A,2C,F5,19,14,2C,15",
			"draw 10,20,7,3": "94,20,19,0A,2C,19,14,2C,15,2C,11",
			"draw 10,20,,3": "94,20,19,0A,2C,19,14,2C,2C,11",
			"draw x,y,m,g1": "94,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,ED,2C,0D,00,00,67,B1",
			"drawr 10,20": "95,20,19,0A,2C,19,14",
			"drawr -10,-20,7": "95,20,F5,19,0A,2C,F5,19,14,2C,15",
			"drawr 10,20,7,3": "95,20,19,0A,2C,19,14,2C,15,2C,11",
			"drawr 10,20,,3": "95,20,19,0A,2C,19,14,2C,2C,11",
			"drawr x,y,m,g1": "95,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,ED,2C,0D,00,00,67,B1"
		},
		"edit, ei, else, end, ent, env, eof, erase, erl, err, error, every gosub, exp": {
			"edit 20": "96,20,1E,14,00",
			"ei ": "DC",
			"else": "01,97",
			"else 10": "01,97,1E,0A,00",
			"else a=7": "01,97,61,3D,37", //TTT
			"a=1 else a=2": "0D,00,00,E1,EF,0F,01,97,61,3D,32", //TTT
			"end ": "98",
			"ent 1": "99,20,0F",
			"ent 1,2,a,4": "99,20,0F,2C,10,2C,0D,00,00,E1,2C,12",
			"ent num,steps,dist,ti,steps2,dist2,ti2": "99,20,0D,00,00,6E,75,ED,2C,0D,00,00,73,74,65,70,F3,2C,0D,00,00,64,69,73,F4,2C,0D,00,00,74,E9,2C,0D,00,00,73,74,65,70,73,B2,2C,0D,00,00,64,69,73,74,B2,2C,0D,00,00,74,69,B2",
			"ent num,=period,ti,=period2,ti2": "99,20,0D,00,00,6E,75,ED,2C,3D,0D,00,00,70,65,72,69,6F,E4,2C,0D,00,00,74,E9,2C,3D,0D,00,00,70,65,72,69,6F,64,B2,2C,0D,00,00,74,69,B2",
			"env 1": "9A,20,0F",
			"env 1,2,a,4": "9A,20,0F,2C,10,2C,0D,00,00,E1,2C,12",
			"env num,steps,dist,ti,steps2,dist2,ti2": "9A,20,0D,00,00,6E,75,ED,2C,0D,00,00,73,74,65,70,F3,2C,0D,00,00,64,69,73,F4,2C,0D,00,00,74,E9,2C,0D,00,00,73,74,65,70,73,B2,2C,0D,00,00,64,69,73,74,B2,2C,0D,00,00,74,69,B2",
			"env num,=reg,period,=reg2,period2": "9A,20,0D,00,00,6E,75,ED,2C,3D,0D,00,00,72,65,E7,2C,0D,00,00,70,65,72,69,6F,E4,2C,3D,0D,00,00,72,65,67,B2,2C,0D,00,00,70,65,72,69,6F,64,B2",
			"a=eof": "0D,00,00,E1,EF,FF,40",
			"erase a": "9B,20,0D,00,00,E1",
			"erase b$": "9B,20,03,00,00,E2",
			"erase a,b$,c!,d%": "9B,20,0D,00,00,E1,2C,03,00,00,E2,2C,04,00,00,E3,2C,02,00,00,E4",
			"a=erl": "0D,00,00,E1,EF,E3",
			"a=err": "0D,00,00,E1,EF,FF,41",
			"error 7": "9C,20,15",
			"error 5+a": "9C,20,13,F4,0D,00,00,E1",
			"every 50 gosub 10": "9D,19,32,9F,1E,0A,00",
			"every 25.2,1 gosub 10": "9D,1F,9A,99,99,49,85,2C,0F,9F,1E,0A,00",
			"every 10+a,b gosub 10": "9D,19,0A,F4,0D,00,00,E1,2C,0D,00,00,E2,9F,1E,0A,00",
			"a=exp(2.3)": "0D,00,00,E1,EF,FF,07,28,1F,33,33,33,13,82,29"
		},
		"fill, fix, fn, for, frame, fre": {
			"fill 7": "DD,20,15",
			"a=fix(2.3)": "0D,00,00,E1,EF,FF,08,28,1F,33,33,33,13,82,29",
			"x=fnclk": "0D,00,00,F8,EF,E4,0D,00,00,63,6C,EB",
			"x=fnclk(a)": "0D,00,00,F8,EF,E4,0D,00,00,63,6C,EB,28,0D,00,00,E1,29",
			"x=fnclk(a,b)": "0D,00,00,F8,EF,E4,0D,00,00,63,6C,EB,28,0D,00,00,E1,2C,0D,00,00,E2,29",
			"x$=fnclk$(a$,b$)": "03,00,00,F8,EF,E4,03,00,00,63,6C,EB,28,03,00,00,E1,2C,03,00,00,E2,29",
			"x=fn clk": "0D,00,00,F8,EF,E4,20,0D,00,00,63,6C,EB",
			"x=fn clk(a)": "0D,00,00,F8,EF,E4,20,0D,00,00,63,6C,EB,28,0D,00,00,E1,29",
			"x=fn clk(a,b)": "0D,00,00,F8,EF,E4,20,0D,00,00,63,6C,EB,28,0D,00,00,E1,2C,0D,00,00,E2,29",
			"x$=fn clk$(a$,b$)": "03,00,00,F8,EF,E4,20,03,00,00,63,6C,EB,28,03,00,00,E1,2C,03,00,00,E2,29",
			"for a=1 to 10": "9E,0D,00,00,E1,EF,0F,EC,19,0A",
			"for a%=1.5 to 9.5": "9E,02,00,00,E1,EF,1F,00,00,00,40,81,EC,1F,00,00,00,18,84",
			"for a!=1.5 to 9.5": "9E,04,00,00,E1,EF,1F,00,00,00,40,81,EC,1F,00,00,00,18,84",
			"for a=1 to 10 step 3": "9E,0D,00,00,E1,EF,0F,EC,19,0A,E6,11",
			"for a=5+b to -4 step -2.3": "9E,0D,00,00,E1,EF,13,F4,0D,00,00,E2,EC,F5,12,E6,F5,1F,33,33,33,13,82",
			"frame ": "E0",
			"a=fre(0)": "0D,00,00,E1,EF,FF,09,28,0E,29",
			"a=fre(\"\")": "0D,00,00,E1,EF,FF,09,28,22,22,29",
			"a=fre(b-2)": "0D,00,00,E1,EF,FF,09,28,0D,00,00,E2,F5,10,29",
			"a=fre(a$)": "0D,00,00,E1,EF,FF,09,28,03,00,00,E1,29"
		},
		"gosub, goto, graphics paper, graphics pen": {
			"gosub 10": "9F,20,1E,0A,00",
			"goto 10": "A0,20,1E,0A,00",
			"graphics paper 5": "DE,BA,20,13",
			"graphics paper 2.3*a": "DE,BA,20,1F,33,33,33,13,82,F6,0D,00,00,E1",
			"graphics pen 5": "DE,BB,20,13",
			"graphics pen 5,1": "DE,BB,20,13,2C,0F",
			"graphics pen ,0": "DE,BB,20,2C,0E",
			"graphics pen 2.3*a,1+b": "DE,BB,20,1F,33,33,33,13,82,F6,0D,00,00,E1,2C,0F,F4,0D,00,00,E2"
		},
		"hex$, himem": {
			"a$=hex$(16)": "03,00,00,E1,EF,FF,73,28,19,10,29",
			"a$=hex$(16,4)": "03,00,00,E1,EF,FF,73,28,19,10,2C,12,29",
			"a$=hex$(a,b)": "03,00,00,E1,EF,FF,73,28,0D,00,00,E1,2C,0D,00,00,E2,29",
			"a=himem": "0D,00,00,E1,EF,FF,42"
		},
		"if, ink, inkey, inkey$, inp, input, instr, int": {
			"if a=1 then goto 10": "A1,0D,00,00,E1,EF,0F,EB,A0,20,1E,0A,00",
			"if a=1 then 10": "A1,0D,00,00,E1,EF,0F,EB,1E,0A,00",
			"if a=1 goto 10": "A1,0D,00,00,E1,EF,0F,EB,A0,20,1E,0A,00",
			"if a=1 then a=a+1:goto 10": "A1,0D,00,00,E1,EF,0F,EB,0D,00,00,E1,EF,0D,00,00,E1,F4,0F,01,A0,20,1E,0A,00",
			"if a=1 then gosub 10": "A1,0D,00,00,E1,EF,0F,EB,9F,20,1E,0A,00",
			"if a=1 then 10:a=never1": "A1,0D,00,00,E1,EF,0F,EB,1E,0A,00,01,0D,00,00,E1,EF,0D,00,00,6E,65,76,65,72,B1",
			"if a=1 then 10 else 20": "A1,0D,00,00,E1,EF,0F,EB,1E,0A,00,01,97,1E,14,00",
			"if a=1 then 10 else goto 20": "A1,0D,00,00,E1,EF,0F,EB,1E,0A,00,01,97,A0,20,1E,14,00",
			"if a=b+5*c then a=a+1: goto 10 else a=a-1:goto 20": "A1,0D,00,00,E1,EF,0D,00,00,E2,F4,13,F6,0D,00,00,E3,EB,0D,00,00,E1,EF,0D,00,00,E1,F4,0F,01,A0,20,1E,0A,00,01,97,0D,00,00,E1,EF,0D,00,00,E1,F5,0F,01,A0,20,1E,14,00",
			"ink 2,19": "A2,20,10,2C,19,13",
			"ink 2,19,22": "A2,20,10,2C,19,13,2C,19,16",
			"ink a*2,b-1,c": "A2,20,0D,00,00,E1,F6,10,2C,0D,00,00,E2,F5,0F,2C,0D,00,00,E3",
			"a=inkey(0)": "0D,00,00,E1,EF,FF,0A,28,0E,29",
			"a$=inkey$": "03,00,00,E1,EF,FF,43",
			"a=inp(&ff77)": "0D,00,00,E1,EF,FF,0B,28,1C,77,FF,29",
			"input a$": "A3,20,03,00,00,E1",
			"input a$,b": "A3,20,03,00,00,E1,2C,0D,00,00,E2",
			"input ;a$,b": "A3,20,3B,03,00,00,E1,2C,0D,00,00,E2",
			"input \"para\",a$,b": "A3,20,22,70,61,72,61,22,2C,03,00,00,E1,2C,0D,00,00,E2",
			"input \"para\";a$,b": "A3,20,22,70,61,72,61,22,3B,03,00,00,E1,2C,0D,00,00,E2",
			"input ;\"para noCRLF\";a$,b": "A3,20,3B,22,70,61,72,61,20,6E,6F,43,52,4C,46,22,3B,03,00,00,E1,2C,0D,00,00,E2",
			"input#2,;\"para noCRLF\";a$,b": "A3,23,10,2C,3B,22,70,61,72,61,20,6E,6F,43,52,4C,46,22,3B,03,00,00,E1,2C,0D,00,00,E2",
			"input#stream,;\"string\";a$,b": "A3,23,0D,00,00,73,74,72,65,61,ED,2C,3B,22,73,74,72,69,6E,67,22,3B,03,00,00,E1,2C,0D,00,00,E2",
			"a=instr(\"key\",\"ey\")": "0D,00,00,E1,EF,FF,74,28,22,6B,65,79,22,2C,22,65,79,22,29",
			"a=instr(s$,find$)": "0D,00,00,E1,EF,FF,74,28,03,00,00,F3,2C,03,00,00,66,69,6E,E4,29",
			"a=instr(start,s$,find$)": "0D,00,00,E1,EF,FF,74,28,0D,00,00,73,74,61,72,F4,2C,03,00,00,F3,2C,03,00,00,66,69,6E,E4,29",
			"a=int(-2.3)": "0D,00,00,E1,EF,FF,0C,28,F5,1F,33,33,33,13,82,29",
			"a=int(b+2.3)": "0D,00,00,E1,EF,FF,0C,28,0D,00,00,E2,F4,1F,33,33,33,13,82,29"
		},
		joy: {
			"a=joy(0)": "0D,00,00,E1,EF,FF,0D,28,0E,29",
			"a=joy(b+1)": "0D,00,00,E1,EF,FF,0D,28,0D,00,00,E2,F4,0F,29"
		},
		"key, key def": {
			"key 11,\"border 13:paper 0\"": "A4,20,19,0B,2C,22,62,6F,72,64,65,72,20,31,33,3A,70,61,70,65,72,20,30,22",
			"key a,b$": "A4,20,0D,00,00,E1,2C,03,00,00,E2",
			"key def 68,1": "A4,8D,20,19,44,2C,0F",
			"key def 68,1,159": "A4,8D,20,19,44,2C,0F,2C,19,9F",
			"key def 68,1,159,160": "A4,8D,20,19,44,2C,0F,2C,19,9F,2C,19,A0",
			"key def 68,1,159,160,161": "A4,8D,20,19,44,2C,0F,2C,19,9F,2C,19,A0,2C,19,A1",
			"key def num,fire,normal,shift,ctrl": "A4,8D,20,0D,00,00,6E,75,ED,2C,0D,00,00,66,69,72,E5,2C,0D,00,00,6E,6F,72,6D,61,EC,2C,0D,00,00,73,68,69,66,F4,2C,0D,00,00,63,74,72,EC"
		},
		"left$, len, , line input, list, load, locate, log, log10, lower$": {
			"a$=left$(b$,n)": "03,00,00,E1,EF,FF,75,28,03,00,00,E2,2C,0D,00,00,EE,29",
			"a=len(a$)": "0D,00,00,E1,EF,FF,0E,28,03,00,00,E1,29",
			"let a=a+1": "A5,20,0D,00,00,E1,EF,0D,00,00,E1,F4,0F",
			"line input a$": "A6,A3,20,03,00,00,E1",
			"line input ;a$": "A6,A3,20,3B,03,00,00,E1",
			"line input \"para\",a$": "A6,A3,20,22,70,61,72,61,22,2C,03,00,00,E1",
			"line input \"para\";a$": "A6,A3,20,22,70,61,72,61,22,3B,03,00,00,E1",
			"line input ;\"para noCRLF\";a$": "A6,A3,20,3B,22,70,61,72,61,20,6E,6F,43,52,4C,46,22,3B,03,00,00,E1",
			"line input#2,;\"para noCRLF\";a$": "A6,A3,23,10,2C,3B,22,70,61,72,61,20,6E,6F,43,52,4C,46,22,3B,03,00,00,E1",
			"line input#stream,;\"string\";a$": "A6,A3,23,0D,00,00,73,74,72,65,61,ED,2C,3B,22,73,74,72,69,6E,67,22,3B,03,00,00,E1",
			"list ": "A7",
			"list 10": "A7,1E,0A,00",
			"list 1-": "A7,1E,01,00,F5",
			"list -1": "A7,F5,1E,01,00",
			"list 1-2": "A7,1E,01,00,F5,1E,02,00",
			"list #3": "A7,23,11",
			"list ,#3": "A7,23,11",
			"list 10,#3": "A7,1E,0A,00,2C,23,11",
			"list 1-,#3": "A7,1E,01,00,F5,2C,23,11",
			"list -1,#3": "A7,F5,1E,01,00,2C,23,11",
			"list 1-2,#3": "A7,1E,01,00,F5,1E,02,00,2C,23,11",
			"load \"file\"": "A8,20,22,66,69,6C,65,22",
			"load \"file.scr\",&c000": "A8,20,22,66,69,6C,65,2E,73,63,72,22,2C,1C,00,C0",
			"load f$,adr": "A8,20,03,00,00,E6,2C,0D,00,00,61,64,F2",
			"locate 10,20": "A9,20,19,0A,2C,19,14",
			"locate#2,10,20": "A9,23,10,2C,19,0A,2C,19,14",
			"locate#stream,x,y": "A9,23,0D,00,00,73,74,72,65,61,ED,2C,0D,00,00,F8,2C,0D,00,00,F9",
			"a=log(10)": "0D,00,00,E1,EF,FF,0F,28,19,0A,29",
			"a=log10(10)": "0D,00,00,E1,EF,FF,10,28,19,0A,29",
			"a$=lower$(b$)": "03,00,00,E1,EF,FF,11,28,03,00,00,E2,29",
			"a$=lower$(\"String\")": "03,00,00,E1,EF,FF,11,28,22,53,74,72,69,6E,67,22,29"
		},
		"mask, max, memory, merge, mid$, min, mod, mode, move, mover": {
			"mask &x10101011": "DF,20,1B,AB,00",
			"mask 2^(8-x),1": "DF,20,10,F8,28,16,F5,0D,00,00,F8,29,2C,0F",
			"mask a,b": "DF,20,0D,00,00,E1,2C,0D,00,00,E2",
			"mask ,b": "DF,20,2C,0D,00,00,E2",
			"a=max(1)": "0D,00,00,E1,EF,FF,76,28,0F,29",
			"a=max(1,5)": "0D,00,00,E1,EF,FF,76,28,0F,2C,13,29",
			"a=max(b,c,d)": "0D,00,00,E1,EF,FF,76,28,0D,00,00,E2,2C,0D,00,00,E3,2C,0D,00,00,E4,29",
			"memory &3fff": "AA,20,1C,FF,3F",
			"memory adr": "AA,20,0D,00,00,61,64,F2",
			"merge \"file\"": "AB,20,22,66,69,6C,65,22",
			"merge f$": "AB,20,03,00,00,E6",
			"a$=mid$(\"string\",3)": "03,00,00,E1,EF,AC,28,22,73,74,72,69,6E,67,22,2C,11,29",
			"a$=mid$(\"string\",3,2)": "03,00,00,E1,EF,AC,28,22,73,74,72,69,6E,67,22,2C,11,2C,10,29",
			"a$=mid$(b$,p)": "03,00,00,E1,EF,AC,28,03,00,00,E2,2C,0D,00,00,F0,29",
			"a$=mid$(b$,p,lg)": "03,00,00,E1,EF,AC,28,03,00,00,E2,2C,0D,00,00,F0,2C,0D,00,00,6C,E7,29",
			"mid$(a$,2)=b$": "AC,28,03,00,00,E1,2C,10,29,EF,03,00,00,E2",
			"mid$(a$,2,2)=b$": "AC,28,03,00,00,E1,2C,10,2C,10,29,EF,03,00,00,E2",
			"mid$(a$,b%,c!)=\"string\"": "AC,28,03,00,00,E1,2C,02,00,00,E2,2C,04,00,00,E3,29,EF,22,73,74,72,69,6E,67,22",
			"a=min(1)": "0D,00,00,E1,EF,FF,77,28,0F,29",
			"a=min(1,5)": "0D,00,00,E1,EF,FF,77,28,0F,2C,13,29",
			"a=min(b,c,d)": "0D,00,00,E1,EF,FF,77,28,0D,00,00,E2,2C,0D,00,00,E3,2C,0D,00,00,E4,29",
			"a=10 mod 3": "0D,00,00,E1,EF,19,0A,FB,11",
			"a=b mod -c": "0D,00,00,E1,EF,0D,00,00,E2,FB,F5,0D,00,00,E3",
			"mode 0": "AD,20,0E",
			"mode n+1": "AD,20,0D,00,00,EE,F4,0F",
			"move 10,20": "AE,20,19,0A,2C,19,14",
			"move -10,-20,7": "AE,20,F5,19,0A,2C,F5,19,14,2C,15",
			"move 10,20,7,3": "AE,20,19,0A,2C,19,14,2C,15,2C,11",
			"move 10,20,,3": "AE,20,19,0A,2C,19,14,2C,2C,11",
			"move x,y,m,g1": "AE,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,ED,2C,0D,00,00,67,B1",
			"mover 10,20": "AF,20,19,0A,2C,19,14",
			"mover -10,-20,7": "AF,20,F5,19,0A,2C,F5,19,14,2C,15",
			"mover 10,20,7,3": "AF,20,19,0A,2C,19,14,2C,15,2C,11",
			"mover 10,20,,3": "AF,20,19,0A,2C,19,14,2C,2C,11",
			"mover x,y,m,g1": "AF,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,ED,2C,0D,00,00,67,B1"
		},
		"new, next, not": {
			"new ": "B1",
			"next ": "B0",
			"next i": "B0,20,0D,00,00,E9",
			"next i,j": "B0,20,0D,00,00,E9,2C,0D,00,00,EA",
			"a=not 2": "0D,00,00,E1,EF,FE,10",
			"a=not -b": "0D,00,00,E1,EF,FE,F5,0D,00,00,E2"
		},
		"on break ..., on error goto, on gosub, on goto, on sq gosub, openin, openout, or, origin, out": {
			"on break cont": "B3,8B",
			"on break gosub 10": "B3,9F,20,1E,0A,00",
			"on break stop": "B3,CE",
			"on error goto 0": "B4",
			"on error goto 10": "B2,9C,A0,1E,0A,00",
			"on 1 gosub 10": "B2,0F,9F,1E,0A,00",
			"on x gosub 10,20": "B2,0D,00,00,F8,9F,1E,0A,00,2C,1E,14,00",
			"on x+1 gosub 10,20,20": "B2,0D,00,00,F8,F4,0F,9F,1E,0A,00,2C,1E,14,00,2C,1E,14,00",
			"on 1 goto 10": "B2,0F,A0,1E,0A,00",
			"on x goto 10,20": "B2,0D,00,00,F8,A0,1E,0A,00,2C,1E,14,00",
			"on x+1 goto 10,20,20": "B2,0D,00,00,F8,F4,0F,A0,1E,0A,00,2C,1E,14,00,2C,1E,14,00",
			"on sq(1) gosub 10": "B5,28,0F,29,9F,1E,0A,00",
			"on sq(channel) gosub 10": "B5,28,0D,00,00,63,68,61,6E,6E,65,EC,29,9F,1E,0A,00",
			"openin \"file\"": "B6,20,22,66,69,6C,65,22",
			"openin f$": "B6,20,03,00,00,E6",
			"openout \"file\"": "B7,20,22,66,69,6C,65,22",
			"openout f$": "B7,20,03,00,00,E6",
			"a=1 or &1a0": "0D,00,00,E1,EF,0F,FC,1C,A0,01",
			"a=b or c": "0D,00,00,E1,EF,0D,00,00,E2,FC,0D,00,00,E3",
			"origin 10,20": "B8,20,19,0A,2C,19,14",
			"origin 10,20,5,200,50,15": "B8,20,19,0A,2C,19,14,2C,13,2C,19,C8,2C,19,32,2C,19,0F",
			"origin x,y,left,right,top,bottom": "B8,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,6C,65,66,F4,2C,0D,00,00,72,69,67,68,F4,2C,0D,00,00,74,6F,F0,2C,0D,00,00,62,6F,74,74,6F,ED",
			"out &bc12,&12": "B9,20,1C,12,BC,2C,1C,12,00",
			"out adr,by": "B9,20,0D,00,00,61,64,F2,2C,0D,00,00,62,F9"
		},
		"paper, peek, pen, pi, plot, plotr, poke, pos, print": {
			"paper 2": "BA,20,10",
			"paper#stream,p": "BA,23,0D,00,00,73,74,72,65,61,ED,2C,0D,00,00,F0",
			"a=peek(&c000)": "0D,00,00,E1,EF,FF,12,28,1C,00,C0,29",
			"a=peek(adr+5)": "0D,00,00,E1,EF,FF,12,28,0D,00,00,61,64,F2,F4,13,29",
			"pen 2": "BB,20,10",
			"pen 2,1": "BB,20,10,2C,0F",
			"pen#3,2,1": "BB,23,11,2C,10,2C,0F",
			"pen#stream,p,trans": "BB,23,0D,00,00,73,74,72,65,61,ED,2C,0D,00,00,F0,2C,0D,00,00,74,72,61,6E,F3",
			"a=pi": "0D,00,00,E1,EF,FF,44",
			"plot 10,20": "BC,20,19,0A,2C,19,14",
			"plot -10,-20,7": "BC,20,F5,19,0A,2C,F5,19,14,2C,15",
			"plot 10,20,7,3": "BC,20,19,0A,2C,19,14,2C,15,2C,11",
			"plot 10,20,,3": "BC,20,19,0A,2C,19,14,2C,2C,11",
			"plot x,y,m,g1": "BC,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,ED,2C,0D,00,00,67,B1",
			"plotr 10,20": "BD,20,19,0A,2C,19,14",
			"plotr -10,-20,7": "BD,20,F5,19,0A,2C,F5,19,14,2C,15",
			"plotr 10,20,7,3": "BD,20,19,0A,2C,19,14,2C,15,2C,11",
			"plotr 10,20,,3": "BD,20,19,0A,2C,19,14,2C,2C,11",
			"plotr x,y,m,g1": "BD,20,0D,00,00,F8,2C,0D,00,00,F9,2C,0D,00,00,ED,2C,0D,00,00,67,B1",
			"poke &c000,23": "BE,20,1C,00,C0,2C,19,17",
			"poke adr,by": "BE,20,0D,00,00,61,64,F2,2C,0D,00,00,62,F9",
			"a=pos(#0)": "0D,00,00,E1,EF,FF,78,28,23,0E,29",
			"a=pos(#stream)": "0D,00,00,E1,EF,FF,78,28,23,0D,00,00,73,74,72,65,61,ED,29",
			"print ": "BF",
			"print \"string\"": "BF,20,22,73,74,72,69,6E,67,22",
			"print a$": "BF,20,03,00,00,E1",
			"print a$,b": "BF,20,03,00,00,E1,2C,0D,00,00,E2",
			"print#2,a$,b": "BF,23,10,2C,03,00,00,E1,2C,0D,00,00,E2",
			"print using\"####\";ri;": "BF,20,ED,22,23,23,23,23,22,3B,0D,00,00,72,E9,3B",
			"print using\"### ########\";a,b": "BF,20,ED,22,23,23,23,20,23,23,23,23,23,23,23,23,22,3B,0D,00,00,E1,2C,0D,00,00,E2",
			"print#9,tab(t);t$;i;\"h1\"": "BF,23,17,2C,EA,28,0D,00,00,F4,29,3B,03,00,00,F4,3B,0D,00,00,E9,3B,22,68,31,22",
			"?": "BF",
			"?#2,ti-t0!;spc(5);": "BF,23,10,2C,0D,00,00,74,E9,F5,04,00,00,74,B0,3B,E5,28,13,29,3B"
		},
		"rad, randomize, read, release, rem, remain, renum, restore, resume, return, right$, rnd, round, run": {
			"rad ": "C1",
			"randomize ": "C2",
			"randomize 123.456": "C2,20,1F,D5,78,E9,76,87",
			"read a$": "C3,20,03,00,00,E1",
			"read b": "C3,20,0D,00,00,E2",
			"read a$,b,c$": "C3,20,03,00,00,E1,2C,0D,00,00,E2,2C,03,00,00,E3",
			"release 1": "C4,20,0F",
			"release n+1": "C4,20,0D,00,00,EE,F4,0F",
			"rem ": "C5",
			"rem comment until EOL": "C5,20,63,6F,6D,6D,65,6E,74,20,75,6E,74,69,6C,20,45,4F,4C",
			"'": "01,C0",
			"'comment until EOL": "01,C0,63,6F,6D,6D,65,6E,74,20,75,6E,74,69,6C,20,45,4F,4C",
			"a=1 'comment": "0D,00,00,E1,EF,0F,01,C0,63,6F,6D,6D,65,6E,74",
			"a=1 :'comment": "0D,00,00,E1,EF,0F,01,01,C0,63,6F,6D,6D,65,6E,74",
			"a=remain(0)": "0D,00,00,E1,EF,FF,13,28,0E,29",
			"a=remain(ti)": "0D,00,00,E1,EF,FF,13,28,0D,00,00,74,E9,29",
			"renum ": "C6",
			"renum 100": "C6,20,19,64",
			"renum 100,50": "C6,20,19,64,2C,19,32",
			"renum 100,50,2": "C6,20,19,64,2C,19,32,2C,10",
			"restore ": "C7",
			"restore 10": "C7,20,1E,0A,00",
			"resume ": "C8",
			"resume 10": "C8,20,1E,0A,00",
			"resume next": "C8,B0",
			"return ": "C9",
			"a$=right$(b$,n)": "03,00,00,E1,EF,FF,79,28,03,00,00,E2,2C,0D,00,00,EE,29",
			"a=rnd": "0D,00,00,E1,EF,FF,45",
			"a=rnd(0)": "0D,00,00,E1,EF,FF,45,28,0E,29",
			"a=rnd(-1*b)": "0D,00,00,E1,EF,FF,45,28,F5,0F,F6,0D,00,00,E2,29",
			"a=round(2.335)": "0D,00,00,E1,EF,FF,7A,28,1F,D7,A3,70,15,82,29",
			"a=round(2.335,2)": "0D,00,00,E1,EF,FF,7A,28,1F,D7,A3,70,15,82,2C,10,29",
			"run ": "CA",
			"run 10": "CA,20,19,0A",
			"run \"file\"": "CA,20,22,66,69,6C,65,22",
			"run f$": "CA,20,03,00,00,E6"
		},
		save: {
			"save \"file\"": "CB,20,22,66,69,6C,65,22",
			"save \"file\",p": "CB,20,22,66,69,6C,65,22,2C,0D,00,00,F0",
			"save \"file\",a": "CB,20,22,66,69,6C,65,22,2C,0D,00,00,E1",
			"save \"file.scr\",b,&c000,&4000": "CB,20,22,66,69,6C,65,2E,73,63,72,22,2C,0D,00,00,E2,2C,1C,00,C0,2C,1C,00,40",
			"save \"file.bin\",b,&8000,&100,&8010": "CB,20,22,66,69,6C,65,2E,62,69,6E,22,2C,0D,00,00,E2,2C,1C,00,80,2C,1C,00,01,2C,1C,10,80",
			"save f$,b,adr,lg,entry": "CB,20,03,00,00,E6,2C,0D,00,00,E2,2C,0D,00,00,61,64,F2,2C,0D,00,00,6C,E7,2C,0D,00,00,65,6E,74,72,F9",
			"a=sgn(5)": "0D,00,00,E1,EF,FF,14,28,13,29",
			"a=sgn(0)": "0D,00,00,E1,EF,FF,14,28,0E,29",
			"a=sgn(-5)": "0D,00,00,E1,EF,FF,14,28,F5,13,29",
			"a=sin(2.3)": "0D,00,00,E1,EF,FF,15,28,1F,33,33,33,13,82,29",
			"sound 1,100": "CC,20,0F,2C,19,64",
			"sound 1,100,400": "CC,20,0F,2C,19,64,2C,1A,90,01",
			"sound 1,100,400,15": "CC,20,0F,2C,19,64,2C,1A,90,01,2C,19,0F",
			"sound 1,100,400,15,1": "CC,20,0F,2C,19,64,2C,1A,90,01,2C,19,0F,2C,0F",
			"sound 1,100,400,15,1,1": "CC,20,0F,2C,19,64,2C,1A,90,01,2C,19,0F,2C,0F,2C,0F",
			"sound 1,100,400,15,1,1,4": "CC,20,0F,2C,19,64,2C,1A,90,01,2C,19,0F,2C,0F,2C,0F,2C,12",
			"sound ch,period,duration,,,,noise": "CC,20,0D,00,00,63,E8,2C,0D,00,00,70,65,72,69,6F,E4,2C,0D,00,00,64,75,72,61,74,69,6F,EE,2C,2C,2C,2C,0D,00,00,6E,6F,69,73,E5",
			"sound ch,period,duration,vol,env1,ent1,noise": "CC,20,0D,00,00,63,E8,2C,0D,00,00,70,65,72,69,6F,E4,2C,0D,00,00,64,75,72,61,74,69,6F,EE,2C,0D,00,00,76,6F,EC,2C,0D,00,00,65,6E,76,B1,2C,0D,00,00,65,6E,74,B1,2C,0D,00,00,6E,6F,69,73,E5",
			"a$=space$(9)": "03,00,00,E1,EF,FF,16,28,17,29",
			"a$=space$(9+b)": "03,00,00,E1,EF,FF,16,28,17,F4,0D,00,00,E2,29",
			"speed ink 10,5": "CD,A2,20,19,0A,2C,13",
			"speed ink a,b": "CD,A2,20,0D,00,00,E1,2C,0D,00,00,E2",
			"speed key 10,5": "CD,A4,20,19,0A,2C,13",
			"speed key a,b": "CD,A4,20,0D,00,00,E1,2C,0D,00,00,E2",
			"speed write 1": "CD,D9,20,0F",
			"speed write a-1": "CD,D9,20,0D,00,00,E1,F5,0F",
			"a=sq(1)": "0D,00,00,E1,EF,FF,17,28,0F,29",
			"a=sq(channel)": "0D,00,00,E1,EF,FF,17,28,0D,00,00,63,68,61,6E,6E,65,EC,29",
			"a=sqr(9)": "0D,00,00,E1,EF,FF,18,28,17,29",
			"stop ": "CE",
			"a$=str$(123)": "03,00,00,E1,EF,FF,19,28,19,7B,29",
			"a$=str$(a+b)": "03,00,00,E1,EF,FF,19,28,0D,00,00,E1,F4,0D,00,00,E2,29",
			"a$=string$(40,\"*\")": "03,00,00,E1,EF,FF,7B,28,19,28,2C,22,2A,22,29",
			"a$=string$(40,42)": "03,00,00,E1,EF,FF,7B,28,19,28,2C,19,2A,29",
			"a$=string$(lg,char)": "03,00,00,E1,EF,FF,7B,28,0D,00,00,6C,E7,2C,0D,00,00,63,68,61,F2,29",
			"symbol 255,1,2,3,4,5,6,7,&x10110011": "CF,20,19,FF,2C,0F,2C,10,2C,11,2C,12,2C,13,2C,14,2C,15,2C,1B,B3,00",
			"symbol 255,1": "CF,20,19,FF,2C,0F",
			"symbol after 255": "CF,80,20,19,FF"
		},
		"tag, tagoff, tan, test, testr, time, troff, tron": {
			"tag ": "D0",
			"tag#2": "D0,23,10",
			"tag#stream": "D0,23,0D,00,00,73,74,72,65,61,ED",
			"tagoff ": "D1",
			"tagoff#2": "D1,23,10",
			"tagoff#stream": "D1,23,0D,00,00,73,74,72,65,61,ED",
			"a=tan(45)": "0D,00,00,E1,EF,FF,1A,28,19,2D,29",
			"a=test(10,20)": "0D,00,00,E1,EF,FF,7C,28,19,0A,2C,19,14,29",
			"a=test(x,y)": "0D,00,00,E1,EF,FF,7C,28,0D,00,00,F8,2C,0D,00,00,F9,29",
			"a=testr(10,-20)": "0D,00,00,E1,EF,FF,7D,28,19,0A,2C,F5,19,14,29",
			"a=testr(xm,ym)": "0D,00,00,E1,EF,FF,7D,28,0D,00,00,78,ED,2C,0D,00,00,79,ED,29",
			"t!=time": "04,00,00,F4,EF,FF,46",
			"troff ": "D2",
			"tron ": "D3"
		},
		"unt, upper$": {
			"a=unt(&ff66)": "0D,00,00,E1,EF,FF,1B,28,1C,66,FF,29",
			"a$=upper$(\"String\")": "03,00,00,E1,EF,FF,1C,28,22,53,74,72,69,6E,67,22,29",
			"a$=upper$(b$)": "03,00,00,E1,EF,FF,1C,28,03,00,00,E2,29"
		},
		"val, vpos": {
			"a=val(\"-2.3\")": "0D,00,00,E1,EF,FF,1D,28,22,2D,32,2E,33,22,29",
			"a=val(b$)": "0D,00,00,E1,EF,FF,1D,28,03,00,00,E2,29",
			"a=vpos(#0)": "0D,00,00,E1,EF,FF,7F,28,23,0E,29",
			"a=vpos(#stream)": "0D,00,00,E1,EF,FF,7F,28,23,0D,00,00,73,74,72,65,61,ED,29"
		},
		"wait, wend, while, width, window, window swap, write": {
			"wait &ff34,20": "D4,20,1C,34,FF,2C,19,14",
			"wait &ff34,20,25": "D4,20,1C,34,FF,2C,19,14,2C,19,19",
			"wend ": "D5",
			"while a>0": "D6,20,0D,00,00,E1,EE,0E",
			"width 40": "D7,20,19,28",
			"window 10,30,5,20": "D8,20,19,0A,2C,19,1E,2C,13,2C,19,14",
			"window#1,10,30,5,20": "D8,23,0F,2C,19,0A,2C,19,1E,2C,13,2C,19,14",
			"window#stream,left,right,top,bottom": "D8,23,0D,00,00,73,74,72,65,61,ED,2C,0D,00,00,6C,65,66,F4,2C,0D,00,00,72,69,67,68,F4,2C,0D,00,00,74,6F,F0,2C,0D,00,00,62,6F,74,74,6F,ED",
			"window swap 1": "D8,E7,20,0F",
			"window swap 1,0": "D8,E7,20,0F,2C,0E",
			"write a$": "D9,20,03,00,00,E1",
			"write a$,b": "D9,20,03,00,00,E1,2C,0D,00,00,E2",
			"write#9,a$,b": "D9,23,17,2C,03,00,00,E1,2C,0D,00,00,E2"
		},
		"xor, xpos": {
			"a=&x1001 xor &x0110": "0D,00,00,E1,EF,1B,09,00,FD,1B,06,00",
			"a=b xor c": "0D,00,00,E1,EF,0D,00,00,E2,FD,0D,00,00,E3",
			"a=xpos": "0D,00,00,E1,EF,FF,47"
		},
		ypos: {
			"a=ypos": "0D,00,00,E1,EF,FF,48"
		},
		zone: {
			"zone 13+n": "DA,20,19,0D,F4,0D,00,00,EE"
		},
		rsx: {
			"|a": "7C,00,C1",
			"|b": "7C,00,C2",
			"|basic": "7C,00,42,41,53,49,C3",
			"|cpm": "7C,00,43,50,CD",
			"a$=\"*.drw\":|dir,@a$": "03,00,00,E1,EF,22,2A,2E,64,72,77,22,01,7C,00,44,49,D2,2C,40,03,00,00,E1",
			"|disc": "7C,00,44,49,53,C3",
			"|disc.in": "7C,00,44,49,53,43,2E,49,CE",
			"|disc.out": "7C,00,44,49,53,43,2E,4F,55,D4",
			"|drive,0": "7C,00,44,52,49,56,C5,2C,0E",
			"|era,\"file.bas\"": "7C,00,45,52,C1,2C,22,66,69,6C,65,2E,62,61,73,22",
			"|ren,\"file1.bas\",\"file2.bas\"": "7C,00,52,45,CE,2C,22,66,69,6C,65,31,2E,62,61,73,22,2C,22,66,69,6C,65,32,2E,62,61,73,22",
			"|tape": "7C,00,54,41,50,C5",
			"|tape.in": "7C,00,54,41,50,45,2E,49,CE",
			"|tape.out": "7C,00,54,41,50,45,2E,4F,55,D4",
			"|user,1": "7C,00,55,53,45,D2,2C,0F",
			"|mode,3": "7C,00,4D,4F,44,C5,2C,11",
			"|renum,1,2,3,4": "7C,00,52,45,4E,55,CD,2C,0F,2C,10,2C,11,2C,12"
		},
		PRG: {
			"100 'Das Raetsel\n110 '21.5.1988 Kopf um Kopf\n120 'ab*c=de  de+fg=hi   [dabei sind a-i verschiedene Ziffern 1-9!!]\n130 MODE 1:PRINT\"Please wait ...  ( ca. 1 min 34 sec )\"\n140 CLEAR:DEFINT a-y\n150 '\n155 z=TIME\n160 FOR a=1 TO 9:FOR b=1 TO 9:FOR c=1 TO 9:FOR f=1 TO 9:FOR g=1 TO 9\n170 de=(a*10+b)*c:IF de>99 THEN 320\n180 hi=de+(f*10+g):IF hi>99 THEN 320\n190 d=INT(de/10):e=de MOD 10:h=INT(hi/10):i=hi MOD 10\n200 IF a=b OR a=c OR a=d OR a=e OR a=f OR a=g OR a=h OR a=i THEN 320\n210 IF b=c OR b=d OR b=e OR b=f OR b=g OR b=h OR b=i THEN 320\n220 IF c=d OR c=e OR c=f OR c=g OR c=h OR c=i THEN 320\n230 IF d=e OR d=f OR d=g OR d=h OR d=i THEN 320\n240 IF e=f OR e=g OR e=h OR e=i THEN 320\n250 IF f=g OR f=h OR f=i THEN 320\n260 IF g=h OR g=i THEN 320\n270 IF h=i THEN 320\n280 IF i=0 THEN 320\n285 z=TIME-z\n290 CLS:PRINT\"Die Loesung:\":PRINT\n300 PRINT a*10+b\"*\"c\"=\"de\" / \"de\"+\"f*10+g\"=\"hi\n310 PRINT z,z/300:STOP\n320 NEXT g,f,c,b,a\n":
				"12,00,64,00,01,C0,44,61,73,20,52,61,65,74,73,65,6C,00,1D,00,6E,00,01,C0,32,31,2E,35,2E,31,39,38,38,20,4B,6F,70,66,20,75,6D,20,4B,6F,70,66,00,46,00,78,00,01,C0,61,62,2A,63,3D,64,65,20,20,64,65,2B,66,67,3D,68,69,20,20,20,5B,64,61,62,65,69,20,73,69,6E,64,20,61,2D,69,20,76,65,72,73,63,68,69,65,64,65,6E,65,20,5A,69,66,66,65,72,6E,20,31,2D,39,21,21,5D,00,32,00,82,00,AD,20,0F,01,BF,20,22,50,6C,65,61,73,65,20,77,61,69,74,20,2E,2E,2E,20,20,28,20,63,61,2E,20,31,20,6D,69,6E,20,33,34,20,73,65,63,20,29,22,00,0C,00,8C,00,86,01,8E,20,61,2D,79,00,07,00,96,00,01,C0,00,0C,00,9B,00,0D,00,00,FA,EF,FF,46,00,36,00,A0,00,9E,0D,00,00,E1,EF,0F,EC,17,01,9E,0D,00,00,E2,EF,0F,EC,17,01,9E,0D,00,00,E3,EF,0F,EC,17,01,9E,0D,00,00,E6,EF,0F,EC,17,01,9E,0D,00,00,E7,EF,0F,EC,17,00,2C,00,AA,00,0D,00,00,64,E5,EF,28,0D,00,00,E1,F6,19,0A,F4,0D,00,00,E2,29,F6,0D,00,00,E3,01,A1,0D,00,00,64,E5,EE,19,63,EB,1E,40,01,00,2D,00,B4,00,0D,00,00,68,E9,EF,0D,00,00,64,E5,F4,28,0D,00,00,E6,F6,19,0A,F4,0D,00,00,E7,29,01,A1,0D,00,00,68,E9,EE,19,63,EB,1E,40,01,00,44,00,BE,00,0D,00,00,E4,EF,FF,0C,28,0D,00,00,64,E5,F7,19,0A,29,01,0D,00,00,E5,EF,0D,00,00,64,E5,FB,19,0A,01,0D,00,00,E8,EF,FF,0C,28,0D,00,00,68,E9,F7,19,0A,29,01,0D,00,00,E9,EF,0D,00,00,68,E9,FB,19,0A,00,59,00,C8,00,A1,0D,00,00,E1,EF,0D,00,00,E2,FC,0D,00,00,E1,EF,0D,00,00,E3,FC,0D,00,00,E1,EF,0D,00,00,E4,FC,0D,00,00,E1,EF,0D,00,00,E5,FC,0D,00,00,E1,EF,0D,00,00,E6,FC,0D,00,00,E1,EF,0D,00,00,E7,FC,0D,00,00,E1,EF,0D,00,00,E8,FC,0D,00,00,E1,EF,0D,00,00,E9,EB,1E,40,01,00,4F,00,D2,00,A1,0D,00,00,E2,EF,0D,00,00,E3,FC,0D,00,00,E2,EF,0D,00,00,E4,FC,0D,00,00,E2,EF,0D,00,00,E5,FC,0D,00,00,E2,EF,0D,00,00,E6,FC,0D,00,00,E2,EF,0D,00,00,E7,FC,0D,00,00,E2,EF,0D,00,00,E8,FC,0D,00,00,E2,EF,0D,00,00,E9,EB,1E,40,01,00,45,00,DC,00,A1,0D,00,00,E3,EF,0D,00,00,E4,FC,0D,00,00,E3,EF,0D,00,00,E5,FC,0D,00,00,E3,EF,0D,00,00,E6,FC,0D,00,00,E3,EF,0D,00,00,E7,FC,0D,00,00,E3,EF,0D,00,00,E8,FC,0D,00,00,E3,EF,0D,00,00,E9,EB,1E,40,01,00,3B,00,E6,00,A1,0D,00,00,E4,EF,0D,00,00,E5,FC,0D,00,00,E4,EF,0D,00,00,E6,FC,0D,00,00,E4,EF,0D,00,00,E7,FC,0D,00,00,E4,EF,0D,00,00,E8,FC,0D,00,00,E4,EF,0D,00,00,E9,EB,1E,40,01,00,31,00,F0,00,A1,0D,00,00,E5,EF,0D,00,00,E6,FC,0D,00,00,E5,EF,0D,00,00,E7,FC,0D,00,00,E5,EF,0D,00,00,E8,FC,0D,00,00,E5,EF,0D,00,00,E9,EB,1E,40,01,00,27,00,FA,00,A1,0D,00,00,E6,EF,0D,00,00,E7,FC,0D,00,00,E6,EF,0D,00,00,E8,FC,0D,00,00,E6,EF,0D,00,00,E9,EB,1E,40,01,00,1D,00,04,01,A1,0D,00,00,E7,EF,0D,00,00,E8,FC,0D,00,00,E7,EF,0D,00,00,E9,EB,1E,40,01,00,13,00,0E,01,A1,0D,00,00,E8,EF,0D,00,00,E9,EB,1E,40,01,00,10,00,18,01,A1,0D,00,00,E9,EF,0E,EB,1E,40,01,00,11,00,1D,01,0D,00,00,FA,EF,FF,46,F5,0D,00,00,FA,00,19,00,22,01,8A,01,BF,20,22,44,69,65,20,4C,6F,65,73,75,6E,67,3A,22,01,BF,00,43,00,2C,01,BF,20,0D,00,00,E1,F6,19,0A,F4,0D,00,00,E2,22,2A,22,0D,00,00,E3,22,3D,22,0D,00,00,64,E5,22,20,2F,20,22,0D,00,00,64,E5,22,2B,22,0D,00,00,E6,F6,19,0A,F4,0D,00,00,E7,22,3D,22,0D,00,00,68,E9,00,16,00,36,01,BF,20,0D,00,00,FA,2C,0D,00,00,FA,F7,1A,2C,01,01,CE,00,1F,00,40,01,B0,20,0D,00,00,E7,2C,0D,00,00,E6,2C,0D,00,00,E3,2C,0D,00,00,E2,2C,0D,00,00,E1,00,00,00"
		}
	};

	function fnBin2Hex(sBin: string) {
		return sBin.split("").map(function (s) {
			return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
		}).join(",");
	}

	function runTestsFor(assert: Assert | undefined, oTests: TestsType, aResults?: string[]) {
		const oCodeGeneratorToken = new CodeGeneratorToken({
			lexer: new BasicLexer({
				bKeepWhiteSpace: true
			}),
			parser: new BasicParser({
				bQuiet: true,
				bKeepBrackets: true
			}
			/*
			lexer: new BasicLexer(),
			parser: new BasicParser({
				bQuiet: true
			}
			*/
			)
		});

		for (const sKey in oTests) {
			if (oTests.hasOwnProperty(sKey)) {
				const sExpected = oTests[sKey],
					oOutput = oCodeGeneratorToken.generate(sKey, true),
					sResult = oOutput.error ? String(oOutput.error) : fnBin2Hex(oOutput.text);

				if (aResults) {
					aResults.push('"' + sKey.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '": "' + sResult.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"') + '"');
				}

				if (assert) {
					assert.strictEqual(sResult, sExpected, sKey);
				}
			}
		}
	}

	function generateTests(oAllTests: AllTestsType) {
		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				(function (sCat) { // eslint-disable-line no-loop-func
					QUnit.test(sCat, function (assert: Assert) {
						runTestsFor(assert, oAllTests[sCat]);
					});
				}(sCategory));
			}
		}
	}

	generateTests(mAllTests);

	// generate result list (not used during the test, just for debugging)

	function generateAllResults(oAllTests: AllTestsType) {
		let sResult = "";

		for (const sCategory in oAllTests) {
			if (oAllTests.hasOwnProperty(sCategory)) {
				const aResults: string[] = [],
					bContainsSpace = sCategory.indexOf(" ") >= 0,
					sMarker = bContainsSpace ? '"' : "";

				sResult += sMarker + sCategory + sMarker + ": {\n";

				runTestsFor(undefined, oAllTests[sCategory], aResults);
				sResult += aResults.join(",\n");
				sResult += "\n},\n";
			}
		}
		Utils.console.log(sResult);
		return sResult;
	}

	if (bGenerateAllResults) {
		generateAllResults(mAllTests);
	}
});

// end
