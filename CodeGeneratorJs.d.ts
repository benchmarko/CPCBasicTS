import { IOutput, ICpcVmRsx } from "./Interfaces";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";
import { Variables } from "./Variables";
interface CodeGeneratorJsOptions {
    lexer: BasicLexer;
    parser: BasicParser;
    rsx: ICpcVmRsx;
    tron: boolean;
    quiet?: boolean;
    noCodeFrame?: boolean;
}
interface CodeNode extends ParserNode {
    left?: CodeNode;
    right?: CodeNode;
    args: CodeNode[];
    pt: string;
    pv: string;
}
export declare class CodeGeneratorJs {
    private lexer;
    private parser;
    private tron;
    private rsx;
    private quiet;
    private noCodeFrame;
    private line;
    private reJsKeywords;
    private stack;
    private dataList;
    private labels;
    private mergeFound;
    private gosubCount;
    private ifCount;
    private stopCount;
    private forCount;
    private whileCount;
    private variables;
    private defScopeArgs?;
    constructor(options: CodeGeneratorJsOptions);
    private static jsKeywords;
    private reset;
    private resetCountsPerLine;
    private composeError;
    private static createJsKeywordRegex;
    private fnDeclareVariable;
    private fnAdaptVariableName;
    private fnParseOneArg;
    private fnParseArgRange;
    private fnParseArgs;
    private fnDetermineStaticVarType;
    private static fnIsIntConst;
    private static fnGetRoundString;
    private static fnIsInString;
    private fnPropagateStaticTypes;
    private plus;
    private minus;
    private mult;
    private div;
    private intDiv;
    private exponent;
    private and;
    private or;
    private xor;
    private static not;
    private mod;
    private greater;
    private less;
    private greaterEqual;
    private lessEqual;
    private equal;
    private notEqual;
    private addressOf;
    private static stream;
    private allOperators;
    private unaryOperators;
    private fnParseDefIntRealStr;
    private fnParseErase;
    private fnAddReferenceLabel;
    private fnCommandWithGoto;
    private static semicolon;
    private static comma;
    private vertical;
    private static number;
    private static binnumber;
    private static hexnumber;
    private static linenumber;
    private identifier;
    private static letter;
    private range;
    private linerange;
    private static string;
    private static unquoted;
    private static fnNull;
    private assign;
    private label;
    private afterEveryGosub;
    private chainMergeOrMerge;
    private static cont;
    private data;
    private def;
    private defint;
    private defreal;
    private defstr;
    private dim;
    private "delete";
    private edit;
    private "else";
    private end;
    private erase;
    private error;
    private fn;
    private "for";
    private gosub;
    private "goto";
    private fnThenOrElsePart;
    private static fnIsSimplePart;
    private "if";
    private inputOrlineInput;
    private let;
    private list;
    private mid$Assign;
    private static "new";
    private next;
    private onBreakGosub;
    private onErrorGoto;
    private onGosub;
    private onGoto;
    private onSqGosub;
    private print;
    private randomize;
    private read;
    private rem;
    private restore;
    private resume;
    private static "return";
    private run;
    private save;
    private spc;
    private stop;
    private tab;
    private wend;
    private "while";
    parseFunctions: {
        [k in string]: (node: CodeNode) => string;
    };
    private fnParseOther;
    private parseNode;
    private static fnCommentUnusedCases;
    private fnCreateLabelsMap;
    private evaluate;
    private static combineData;
    debugGetLabelsCount(): number;
    generate(input: string, variables: Variables, allowDirect?: boolean): IOutput;
}
export {};
