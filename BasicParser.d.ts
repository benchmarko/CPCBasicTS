import { BasicLexerToken } from "./BasicLexer";
interface BasicParserOptions {
    bQuiet?: boolean;
}
export declare class BasicParser {
    iLine: number;
    bQuiet: boolean;
    static mParameterTypes: {
        c: string;
        f: string;
        o: string;
        n: string;
        s: string;
        l: string;
        q: string;
        v: string;
        r: string;
        a: string;
        "n0?": string;
        "#": string;
    };
    static mKeywords: {
        abs: string;
        after: string;
        afterGosub: string;
        and: string;
        asc: string;
        atn: string;
        auto: string;
        bin$: string;
        border: string;
        break: string;
        call: string;
        cat: string;
        chain: string;
        chainMerge: string;
        chr$: string;
        cint: string;
        clear: string;
        clearInput: string;
        clg: string;
        closein: string;
        closeout: string;
        cls: string;
        cont: string;
        copychr$: string;
        cos: string;
        creal: string;
        cursor: string;
        data: string;
        dec$: string;
        def: string;
        defint: string;
        defreal: string;
        defstr: string;
        deg: string;
        delete: string;
        derr: string;
        di: string;
        dim: string;
        draw: string;
        drawr: string;
        edit: string;
        ei: string;
        else: string;
        end: string;
        ent: string;
        env: string;
        eof: string;
        erase: string;
        erl: string;
        err: string;
        error: string;
        every: string;
        everyGosub: string;
        exp: string;
        fill: string;
        fix: string;
        fn: string;
        for: string;
        frame: string;
        fre: string;
        gosub: string;
        goto: string;
        graphics: string;
        graphicsPaper: string;
        graphicsPen: string;
        hex$: string;
        himem: string;
        if: string;
        ink: string;
        inkey: string;
        inkey$: string;
        inp: string;
        input: string;
        instr: string;
        int: string;
        joy: string;
        key: string;
        keyDef: string;
        left$: string;
        len: string;
        let: string;
        line: string;
        lineInput: string;
        list: string;
        load: string;
        locate: string;
        log: string;
        log10: string;
        lower$: string;
        mask: string;
        max: string;
        memory: string;
        merge: string;
        mid$: string;
        mid$Assign: string;
        min: string;
        mod: string;
        mode: string;
        move: string;
        mover: string;
        new: string;
        next: string;
        not: string;
        on: string;
        onBreakCont: string;
        onBreakGosub: string;
        onBreakStop: string;
        onErrorGoto: string;
        onGosub: string;
        onGoto: string;
        onSqGosub: string;
        openin: string;
        openout: string;
        or: string;
        origin: string;
        out: string;
        paper: string;
        peek: string;
        pen: string;
        pi: string;
        plot: string;
        plotr: string;
        poke: string;
        pos: string;
        print: string;
        rad: string;
        randomize: string;
        read: string;
        release: string;
        rem: string;
        remain: string;
        renum: string;
        restore: string;
        resume: string;
        resumeNext: string;
        return: string;
        right$: string;
        rnd: string;
        round: string;
        run: string;
        save: string;
        sgn: string;
        sin: string;
        sound: string;
        space$: string;
        spc: string;
        speed: string;
        speedInk: string;
        speedKey: string;
        speedWrite: string;
        sq: string;
        sqr: string;
        step: string;
        stop: string;
        str$: string;
        string$: string;
        swap: string;
        symbol: string;
        symbolAfter: string;
        tab: string;
        tag: string;
        tagoff: string;
        tan: string;
        test: string;
        testr: string;
        then: string;
        time: string;
        to: string;
        troff: string;
        tron: string;
        unt: string;
        upper$: string;
        using: string;
        val: string;
        vpos: string;
        wait: string;
        wend: string;
        while: string;
        width: string;
        window: string;
        windowSwap: string;
        write: string;
        xor: string;
        xpos: string;
        ypos: string;
        zone: string;
    };
    static mCloseTokens: {
        ":": number;
        "(eol)": number;
        "(end)": number;
        else: number;
        rem: number;
        "'": number;
    };
    constructor(options?: BasicParserOptions);
    init(options: BasicParserOptions): void;
    reset(): void;
    composeError(...aArgs: any[]): any;
    parse(aTokens: BasicLexerToken[], bAllowDirect?: boolean): any[];
}
export {};
