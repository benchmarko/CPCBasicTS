// Interfaces.ts - Interfaces
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { CustomError } from "./Utils";

export interface IOutput {
    text: string
    error?: CustomError
}

export interface IController {
    startParse: () => void
    startRenum: () => void

    startRun: () => void
    startParseRun: () => void
    startBreak: () => void
    startContinue: () => void
    startReset: () => void
    startScreenshot: () => string
    startEnter: () => void

    fnPretty: () => void
    fnDownload: () => void
    setInputText: (sInput: string, bKeepStack?: boolean) => void
    setExampleSelectOptions: () => void
    invalidateScript: () => void
    setSoundActive: () => void

    changeVariable: () => void
    onExampleSelectChange: () => void
    onDatabaseSelectChange: () => void

    onCpcCanvasClick: (event: MouseEvent) => void
    onWindowClick: (event: Event) => void

    startUpdateCanvas: () => void
    stopUpdateCanvas: () => void
    virtualKeyboardCreate: () => void
    getVariable: (sPar: string) => string | number | object // see VariableValue in Variables.ts

    undoStackElement: () => string
    redoStackElement: () => string
 }

export interface ICpcVmRsx {
    rsxIsAvailable: (sName: string) => boolean
}

//
