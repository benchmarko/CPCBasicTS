export class RunLoop {
    constructor(options) {
        this.options = options;
        this.active = false;
        this.runHandler = () => this.run();
        this.nextDelay = 0;
    }
    get isRunning() {
        return this.active;
    }
    start() {
        if (!this.active) {
            this.active = true;
            this.options.setTimeout(this.runHandler, 0);
        }
        this.options.onStateChange();
    }
    run() {
        const options = this.options, stop = options.vm.vmGetStopObject();
        this.nextDelay = options.getInitialDelay();
        if (!stop.reason) {
            options.execute();
        }
        if (Object.prototype.hasOwnProperty.call(options.handlers, stop.reason)) {
            options.handlers[stop.reason](stop.paras);
        }
        else {
            options.onUnknownReason(stop.reason);
            options.vm.vmStop("error", 50);
        }
        if (stop.reason && stop.reason !== "waitSound" && stop.reason !== "waitKey" && stop.reason !== "waitInput") {
            this.active = false;
            options.onStateChange();
            options.onExit();
        }
        else {
            options.setTimeout(this.runHandler, this.nextDelay);
        }
        options.onStateChange();
    }
}
//# sourceMappingURL=RunLoop.js.map