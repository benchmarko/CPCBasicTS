declare global {
    interface Window {
        QUnit: unknown;
    }
    interface NodeJsProcess {
        argv: string[];
    }
    let process: NodeJsProcess;
}
export {};
