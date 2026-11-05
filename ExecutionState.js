export class ExecutionStateReporter {
    constructor(onChange) {
        this.onChange = onChange;
    }
    report(state) {
        var _a;
        const previous = this.previous;
        if (previous && previous.reason === state.reason && previous.line === state.line && previous.isRunning === state.isRunning) {
            return;
        }
        this.previous = Object.assign({}, state);
        (_a = this.onChange) === null || _a === void 0 ? void 0 : _a.call(this, Object.assign({}, state));
    }
}
//# sourceMappingURL=ExecutionState.js.map