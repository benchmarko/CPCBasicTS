import { CustomError } from "./Utils";
export interface IOutput {
    text: string;
    error?: CustomError;
}
export declare type VariableValue = string | number | Function | [] | VariableValue[];
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
    fnDownload: () => void;
    setInputText: (input: string, keepStack?: boolean) => void;
    setExampleSelectOptions: () => void;
    invalidateScript: () => void;
    setSoundActive: () => void;
    changeVariable: () => void;
    onExampleSelectChange: () => void;
    onDatabaseSelectChange: () => void;
    onCpcCanvasClick: (event: MouseEvent) => void;
    onWindowClick: (event: Event) => void;
    startUpdateCanvas: () => void;
    stopUpdateCanvas: () => void;
    virtualKeyboardCreate: () => void;
    getVariable: (par: string) => VariableValue;
    undoStackElement: () => string;
    redoStackElement: () => string;
}
export interface ICpcVmRsx {
    rsxIsAvailable: (name: string) => boolean;
}
