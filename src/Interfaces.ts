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

// Same as VariableValue in Variables.ts
export type VariableValue = string | number | Function | [] | VariableValue[]; // eslint-disable-line @typescript-eslint/ban-types

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
    fnAddLines: () => void
    fnRemoveLines: () => void

    fnDownload: () => void
    setInputText: (input: string, keepStack?: boolean) => void
    setExampleSelectOptions: () => void
    invalidateScript: () => void
    setSoundActive: () => void

    changeVariable: () => void
    onExampleSelectChange: () => void
    onDirectorySelectChange: () => void
    onDatabaseSelectChange: () => void

    onCpcCanvasClick: (event: MouseEvent) => void
    onWindowClick: (event: Event) => void
    onTextTextClick: (event: MouseEvent) => void

    startUpdateCanvas: () => void
    stopUpdateCanvas: () => void
    startUpdateTextCanvas: () => void
    stopUpdateTextCanvas: () => void
    virtualKeyboardCreate: () => void
    getVariable: (par: string) => VariableValue
    // see VariableValue in Variables.ts

    undoStackElement: () => string
    redoStackElement: () => string

    fnImplicitLines: () => void
    fnArrayBounds: () => void
    fnTrace: () => void
    fnSpeed: () => void
 }

export interface ICpcVmRsx {
    rsxIsAvailable: (name: string) => boolean
}

//
