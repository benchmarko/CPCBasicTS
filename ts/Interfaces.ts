// Interfaces.ts - Interfaces
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

// Interfaces.ts - Interfaces
// (c) Marco Vieth, 2020
//

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
    setInputText: (arg0: string, arg1?: boolean) => void
    setExampleSelectOptions: () => void
    invalidateScript: () => void
    setSoundActive: () => void

    changeVariable: () => void
    onExampleSelectChange: () => void
    onDatabaseSelectChange: () => void
    updateStorageDatabase(sAction: string, sKey: string): void

    onCpcCanvasClick: (event: Event) => void
    onWindowClick: (event: Event) => void

    startUpdateCanvas: () => void
    stopUpdateCanvas: () => void
    virtualKeyboardCreate: () => void
    getVariable: (sPar: string) => any

    undoStackElement: () => string
    redoStackElement: () => string
 }

//
