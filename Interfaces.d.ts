import { CustomError } from "./Utils";
export interface IOutput {
    text: string;
    error?: CustomError;
}
export interface IController {
    startParse: () => void;
    startRenum: () => void;
    startRun: () => void;
    startParseRun: () => void;
    startBreak: () => void;
    startContinue: () => void;
    startReset: () => void;
    startScreenshot: () => string;
    startEnter: () => void;
    fnPretty: () => void;
    setInputText: (sInput: string, bKeepStack?: boolean) => void;
    setExampleSelectOptions: () => void;
    invalidateScript: () => void;
    setSoundActive: () => void;
    changeVariable: () => void;
    onExampleSelectChange: () => void;
    onDatabaseSelectChange: () => void;
    onCpcCanvasClick: (event: Event) => void;
    onWindowClick: (event: Event) => void;
    startUpdateCanvas: () => void;
    stopUpdateCanvas: () => void;
    virtualKeyboardCreate: () => void;
    getVariable: (sPar: string) => string | number | object;
    undoStackElement: () => string;
    redoStackElement: () => string;
}
export interface ICpcVmRsx {
    rsxIsAvailable: (sName: string) => boolean;
}
