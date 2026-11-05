import type { CpcVm } from "./CpcVm";
import type { VmBaseParas } from "./Interfaces";

interface RunLoopOptions {
	vm: Pick<CpcVm, "vmGetStopObject" | "vmStop">
	execute: () => void
	handlers: Record<string, (paras: VmBaseParas) => void>
	getInitialDelay: () => number
	setTimeout: (callback: () => void, delay: number) => unknown
	onExit: () => void
	onStateChange: () => void
	onUnknownReason: (reason: string) => void
}

export class RunLoop {
	private active = false;
	private readonly runHandler = () => this.run();
	nextDelay = 0;

	constructor(private readonly options: RunLoopOptions) {}

	get isRunning(): boolean {
		return this.active;
	}

	start(): void {
		if (!this.active) {
			this.active = true;
			this.options.setTimeout(this.runHandler, 0);
		}
		this.options.onStateChange();
	}

	private run(): void {
		const options = this.options,
			stop = options.vm.vmGetStopObject();
		this.nextDelay = options.getInitialDelay();
		if (!stop.reason) {
			options.execute();
		}

		if (Object.prototype.hasOwnProperty.call(options.handlers, stop.reason)) {
			options.handlers[stop.reason](stop.paras);
		} else {
			options.onUnknownReason(stop.reason);
			options.vm.vmStop("error", 50);
		}

		if (stop.reason && stop.reason !== "waitSound" && stop.reason !== "waitKey" && stop.reason !== "waitInput") {
			this.active = false;
			options.onStateChange();
			options.onExit();
		} else {
			options.setTimeout(this.runHandler, this.nextDelay);
		}
		options.onStateChange();
	}
}