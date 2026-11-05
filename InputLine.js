export class InputLine {
    constructor(keyboard, vm) {
        this.keyboard = keyboard;
        this.vm = vm;
    }
    submit(paras) {
        if (!paras.noCRLF && paras.command !== "input" && paras.command !== "lineinput") {
            this.vm.print(paras.stream, "\r\n");
        }
        return paras.fnInputCallback ? paras.fnInputCallback() : true;
    }
    readAndSubmit(paras, onReturn) {
        const edited = this.read(paras.input, paras.stream);
        paras.input = edited.input;
        if (edited.submitted) {
            onReturn === null || onReturn === void 0 ? void 0 : onReturn(edited.input);
            return this.submit(paras);
        }
        return false;
    }
    read(input, stream) {
        let key;
        do {
            key = this.keyboard.getKeyFromBuffer();
            switch (key) {
                case "":
                case "\r":
                    break;
                case "\x10":
                    key = "\x07";
                    break;
                case "\x7f":
                    if (input.length) {
                        input = input.slice(0, -1);
                        key = "\x08\x10";
                    }
                    else {
                        key = "\x07";
                    }
                    break;
                case "\xe0": {
                    const copied = this.vm.copychr$(stream);
                    input += copied;
                    key = copied.length ? "\x09" : "\x07";
                    break;
                }
                case "\xf0":
                    key = input.length ? "\x07" : "\x0b";
                    break;
                case "\xf1":
                    key = input.length ? "\x07" : "\x0a";
                    break;
                case "\xf2":
                    key = input.length ? "\x07" : "\x08";
                    break;
                case "\xf3":
                    key = input.length ? "\x07" : "\x09";
                    break;
                case "\xf4":
                case "\xf5":
                case "\xf6":
                case "\xf7":
                case "\xf8":
                case "\xf9":
                case "\xfa":
                case "\xfb":
                    key = "";
                    break;
                default:
                    input += key;
                    if (key < "\x20") {
                        key = "\x01" + key;
                    }
                    break;
            }
            if (key && key !== "\r") {
                this.vm.print(stream, key);
            }
        } while (key !== "" && key !== "\r");
        return { input, submitted: key === "\r" };
    }
}
//# sourceMappingURL=InputLine.js.map