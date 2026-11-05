export class SuspendedState {
    constructor(initial) {
        this.initial = SuspendedState.copy(initial);
        this.saved = SuspendedState.copy(initial);
    }
    static copy(stop) {
        return Object.assign(Object.assign({}, stop), { paras: Object.assign({}, stop.paras) });
    }
    save(stop) {
        if (stop.reason !== "break" && stop.reason !== "escape") {
            this.saved = SuspendedState.copy(stop);
        }
    }
    get() {
        return SuspendedState.copy(this.saved);
    }
    reset() {
        this.saved = SuspendedState.copy(this.initial);
    }
    restore(stop) {
        Object.assign(stop, this.get());
        this.reset();
    }
    restoreForContinue(vm, stop, beforeRestore) {
        if (stop.reason !== "break" && stop.reason !== "escape" && stop.reason !== "stop" && stop.reason !== "direct") {
            return false;
        }
        if (stop.reason === "direct" || stop.reason === "escape") {
            vm.cursor(stop.paras.stream, 0);
        }
        beforeRestore === null || beforeRestore === void 0 ? void 0 : beforeRestore();
        this.restore(stop);
        return true;
    }
    escape(vm, keyboard) {
        const stop = vm.vmGetStopObject(), stream = 0;
        if (vm.vmOnBreakContSet()) {
            return "ignored";
        }
        if (stop.reason === "direct" || vm.vmOnBreakHandlerActive()) {
            stop.paras.input = "";
            vm.print(stream, "*Break*\r\n");
            return "input";
        }
        if (stop.reason !== "escape") {
            vm.cursor(stream, 1);
            keyboard.clearInput();
            this.save(stop);
            vm.vmStop("escape", 85, false, { command: "escape", stream, first: 0, last: 0, line: vm.line });
            return "suspended";
        }
        vm.cursor(stream, 0);
        const saved = this.get();
        if (saved.reason === "waitInput") {
            vm.vmGoto(saved.paras.line);
        }
        if (!vm.vmEscape()) {
            vm.vmStop("", 0, true);
            this.reset();
            return "continued";
        }
        vm.vmStop("stop", 0, true);
        vm.print(stream, "Break in " + vm.line + "\r\n");
        return "stopped";
    }
}
//# sourceMappingURL=SuspendedState.js.map