import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";
import { IOutput } from "./Interfaces";
interface CodeGeneratorBasicOptions {
    lexer: BasicLexer;
    parser: BasicParser;
}
export declare class CodeGeneratorBasic {
    private lexer;
    private parser;
    constructor(options: CodeGeneratorBasicOptions);
    private static mCombinedKeywords;
    private static mOperators;
    private static mOperatorPrecedence;
    private composeError;
    private fnParseOneArg;
    private fnParseArgs;
    private static fnDecodeEscapeSequence;
    private static string;
    private static fnNull;
    private assign;
    private static number;
    private static binnumber;
    private static hexnumber;
    private identifier;
    private static linenumber;
    private label;
    private vertical;
    private afterGosub;
    private chainMerge;
    private data;
    private def;
    private static "else";
    private ent;
    private env;
    private everyGosub;
    private fn;
    private "for";
    private "if";
    private input;
    private lineInput;
    private list;
    private mid$Assign;
    private onGosub;
    private onGoto;
    private onSqGosub;
    private print;
    private rem;
    private using;
    mParseFunctions: {
        [k: string]: (node: ParserNode) => string;
    };
    private fnParseOther;
    private parseNode;
    private evaluate;
    generate(sInput: string, bAllowDirect?: boolean): IOutput;
}
export {};
