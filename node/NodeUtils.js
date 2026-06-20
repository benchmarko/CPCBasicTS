//import "./NodePolyfills";
import { Utils } from "../Utils";
import { Controller0 } from "../Controller0";
const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // eslint-disable-line no-new-func
function createLocalStorage() {
    const data = {};
    const storage = {
        clear() {
            Object.keys(data).forEach((key) => {
                delete data[key];
                delete storage[key];
            });
        },
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        key(index) {
            const keys = Object.keys(data);
            return (index >= 0 && index < keys.length) ? keys[index] : null;
        },
        removeItem(key) {
            delete data[key];
            delete storage[key];
        },
        setItem(key, value) {
            const value2 = String(value);
            data[key] = value2;
            storage[key] = value2;
        },
        get length() {
            return Object.keys(data).length;
        }
    };
    return storage;
}
export class NodeUtils {
    static nodeReadUrl(url, fnDataLoaded) {
        const nodeHttps = eval("require")("https"); // eslint-disable-line no-eval
        nodeHttps.get(url, (resp) => {
            let data = "";
            resp.on("data", (chunk) => {
                data += chunk;
            });
            resp.on("end", () => {
                fnDataLoaded(undefined, data);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            fnDataLoaded(err);
        });
    }
    static nodeReadFile(name, fnDataLoaded) {
        const nodeFs = eval("require")("fs"), // eslint-disable-line no-eval
        cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "", name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;
        nodeFs.readFile(name2, "utf8", fnDataLoaded);
    }
    static isUrl(s) {
        return s.startsWith("http"); // http or https
    }
    static writeResultDelta(text, state) {
        const previous = state.text;
        const delta = text.startsWith(previous) ? text.substring(previous.length) : text;
        if (delta && myGlobalThis.process && myGlobalThis.process.stdout) {
            myGlobalThis.process.stdout.write(delta);
        }
        state.text = text;
    }
    nodeMain(core) {
        const model = core.getModel(), config = model.getAllProperties();
        core.parseArgs(myGlobalThis.process.argv.slice(2), config);
        if (config.canvasType === "graphics") {
            config.canvasType = "text";
        }
        if (!myGlobalThis.AudioContext && config.sound === true) {
            config.sound = false;
        }
        config.showCpc = false; // disable canvas updates in headless mode
        const debug = model.getProperty("debug");
        if (debug) {
            core.setDebug(debug);
            Utils.setDebug(debug);
        }
        core.init(); // init databases
        //const nodeDocument = new NodeDocumentAdapter();
        //(myGlobalThis as any).document = nodeDocument;
        myGlobalThis.cpcBasic = {
            addIndex: core.addIndex,
            addItem: (key, input) => {
                core.addItem(key || NodeUtils.currentScriptKey, input);
            },
            addRsx: (key, RsxConstructor) => core.addRsx(key || NodeUtils.currentScriptKey, RsxConstructor)
        };
        //View.setDocument(nodeDocument);
        const outputState = {
            text: ""
        };
        const textBuffer = []; // textbuffer characters at row,column
        const putCharInTextBuffer = (char, x, y) => {
            if (!textBuffer[y]) {
                textBuffer[y] = [];
            }
            textBuffer[y][x] = char;
        };
        const getCharFromTextBuffer = (x, y) => {
            let char;
            if (textBuffer[y]) {
                char = textBuffer[y][x]; // can be undefined, if not set
            }
            return char;
        };
        const clearTextBufferBox = (left, top, width, height) => {
            for (let y = top; y < top + height; y += 1) {
                const textBufferRow = textBuffer[y];
                if (textBufferRow) {
                    for (let x = left; x < left + width; x += 1) {
                        delete textBufferRow[x];
                    }
                }
            }
        };
        const copyTextBufferBoxUp = (left, top, width, height, left2, top2) => {
            for (let y = 0; y < height; y += 1) {
                const sourceRow = textBuffer[top + y];
                let destinationRow = textBuffer[top2 + y];
                if (sourceRow) {
                    // could be optimized, if complete rows
                    if (!destinationRow) {
                        destinationRow = [];
                        textBuffer[top2 + y] = destinationRow;
                    }
                    for (let x = 0; x < width; x += 1) {
                        destinationRow[left2 + x] = sourceRow[left + x];
                    }
                }
                else if (destinationRow) {
                    delete textBuffer[top2 + y]; // no sourceRow => clear destinationRow
                }
            }
        };
        const canvas = {
            reset: () => {
                textBuffer.length = 0;
            },
            resetCustomChars: () => undefined,
            setScreenOffset: (_offset) => undefined,
            updateColorsAndCanvasImmediately: (_inkList) => undefined,
            updateSpeedInk: () => undefined,
            setCustomChar: (_char, _charData) => undefined,
            getCharData: (_char) => [],
            setDefaultInks: () => undefined,
            //onCanvasClick: (_event: MouseEvent) => undefined,
            getXpos: () => 0,
            getYpos: () => 0,
            getByte: (_addr) => 0,
            setByte: (_addr, _byte) => undefined,
            draw: (_x, _y) => undefined,
            move: (_x, _y) => undefined,
            plot: (_x, _y) => undefined,
            test: (_x, _y) => 0,
            setInk: (_pen, _ink1, _ink2) => false,
            setBorder: (_ink1, _ink2) => undefined,
            setGPen: (_gPen) => undefined,
            setGPaper: (_gPaper) => undefined,
            setGTransparentMode: (_transparent) => undefined,
            printGChar: (_char) => undefined,
            drawCursor: (_x, _y, _pen, _paper) => undefined,
            fill: (_fillPen) => undefined,
            setOrigin: (_xOrig, _yOrig) => undefined,
            getXOrigin: () => 0,
            getYOrigin: () => 0,
            setGWindow: (_xLeft, _xRight, _yTop, _yBottom) => undefined,
            setGColMode: (_gColMode) => undefined,
            clearGraphicsWindow: () => undefined,
            setSpeedInk: (_time1, _time2) => undefined,
            setMask: (_mask) => undefined,
            setMaskFirst: (_maskFirst) => undefined,
            getMode: () => 0,
            changeMode: (_mode) => undefined,
            //takeScreenShot: () => "",
            //startUpdateCanvas: () => undefined,
            //stopUpdateCanvas: () => undefined,
            //onWindowClick: (_event: Event) => undefined,
            fillTextBox: (left, top, width, height, _paper) => {
                clearTextBufferBox(left, top, width, height);
            },
            printChar: (char, x, y, _pen, _paper, _transparent) => {
                putCharInTextBuffer(char, x, y);
            },
            readChar: (x, y, _pen, _paper) => {
                let char = getCharFromTextBuffer(x, y);
                if (char === undefined) {
                    char = -1; // not detected
                }
                return char;
            },
            clearTextWindow: (_left, _right, _top, _bottom, _paper) => undefined,
            setMode: (_mode) => undefined,
            clearFullWindow: () => {
                textBuffer.length = 0;
            },
            windowScrollUp: (left, right, top, bottom, _paper) => {
                const width = right + 1 - left, height = bottom + 1 - top;
                if (height > 1) { // scroll part
                    // adapt also text buffer
                    copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
                }
                canvas.fillTextBox(left, bottom, width, 1, 0);
            },
            windowScrollDown: (_left, _right, _top, _bottom, _paper) => undefined
        };
        // const canvas: ICanvasVm = new NoCanvas({
        // 		canvasID: "id" as any,
        // 		charset: [],
        // 		palette: "color"
        // });
        const keyboard = {
            reset: () => undefined,
            resetExpansionTokens: () => undefined,
            resetCpcKeysExpansions: () => undefined,
            clearInput: () => undefined,
            getKeyFromBuffer: () => "",
            putKeyInBuffer: (_key, _triggerOnKeyDown) => undefined,
            getKeyState: (_cpcKeyCode) => 0,
            getJoyState: (_joy) => 0,
            setExpansionToken: (_token, _string) => undefined,
            setCpcKeyExpansion: (_options) => undefined
        };
        const sound = {
            reset: () => undefined,
            resetQueue: () => undefined,
            testCanQueue: (_state) => true,
            sound: (_soundData) => undefined,
            setVolEnv: (_volEnv, _volEnvData) => undefined,
            setToneEnv: (_toneEnv, _toneEnvData) => undefined,
            scheduler: () => undefined,
            release: (_releaseMask) => undefined,
            sq: (_n) => 0
        };
        // https://dirask.com/posts/Node-js-atob-btoa-functions-equivalents-1Aqb51
        const atobFn = (input) => {
            return Buffer.from(input, "base64").toString("binary");
        };
        const btoaFn = (input) => {
            return Buffer.from(input, "binary").toString("base64");
        };
        const controllerOptions = {
            canvas,
            keyboard,
            sound,
            isHeadlessDirectInput: true,
            loadScript: NodeUtils.loadScript,
            onOutputText: (_value) => {
                // TODO
            },
            onResultText: (value) => {
                NodeUtils.writeResultDelta(value, outputState);
            },
            onProgramEnd: () => {
                myGlobalThis.process.exit(0);
            },
            storage: createLocalStorage(),
            atobFn: atobFn,
            btoaFn: btoaFn,
            console: console,
            setTimeout: setTimeout
        };
        const controller = new Controller0(core, controllerOptions);
        controller.onDatabaseSelectChange(); // trigger loading configured example
    }
}
NodeUtils.currentScriptKey = "";
NodeUtils.loadScript = (fileOrUrl, fnSuccess, fnError, key) => {
    const fnLoaded = (error, data) => {
        if (error) {
            console.error("file error: ", error);
            fnError(fileOrUrl, key);
            return;
        }
        if (data) {
            NodeUtils.currentScriptKey = key;
            (0, eval)(data); // eslint-disable-line no-eval
            NodeUtils.currentScriptKey = "";
        }
        fnSuccess(fileOrUrl, key);
    };
    if (NodeUtils.isUrl(fileOrUrl)) {
        NodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
    }
    else {
        NodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
    }
};
//# sourceMappingURL=NodeUtils.js.map