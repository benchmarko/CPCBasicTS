import type { CpcVm, VmStopEntry } from "./CpcVm";
import type { IKeyboard, VmInputParas } from "./Interfaces";

export class SuspendedState {
	private readonly initial: VmStopEntry;
	private saved: VmStopEntry;

	constructor(initial: VmStopEntry) {
		this.initial = SuspendedState.copy(initial);
		this.saved = SuspendedState.copy(initial);
	}

	private static copy(stop: VmStopEntry): VmStopEntry {
		return { ...stop, paras: { ...stop.paras } };
	}

	save(stop: VmStopEntry): void {
		if (stop.reason !== "break" && stop.reason !== "escape") {
			this.saved = SuspendedState.copy(stop);
		}
	}

	get(): VmStopEntry {
		return SuspendedState.copy(this.saved);
	}

	reset(): void {
		this.saved = SuspendedState.copy(this.initial);
	}

	restore(stop: VmStopEntry): void {
		Object.assign(stop, this.get());
		this.reset();
	}

	restoreForContinue(vm: Pick<CpcVm, "cursor">, stop: VmStopEntry, beforeRestore?: () => void): boolean {
		if (stop.reason !== "break" && stop.reason !== "escape" && stop.reason !== "stop" && stop.reason !== "direct") {
			return false;
		}
		if (stop.reason === "direct" || stop.reason === "escape") {
			vm.cursor(stop.paras.stream, 0);
		}
		beforeRestore?.();
		this.restore(stop);
		return true;
	}

	escape(
		vm: Pick<CpcVm, "line" | "vmGetStopObject" | "vmOnBreakContSet" | "vmOnBreakHandlerActive" | "vmEscape" | "vmStop" | "vmGoto" | "cursor" | "print">,
		keyboard: Pick<IKeyboard, "clearInput">
	): "ignored" | "input" | "suspended" | "continued" | "stopped" {
		const stop = vm.vmGetStopObject(),
			stream = 0;
		if (vm.vmOnBreakContSet()) {
			return "ignored";
		}
		if (stop.reason === "direct" || vm.vmOnBreakHandlerActive()) {
			(stop.paras as VmInputParas).input = "";
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
			vm.vmGoto((saved.paras as VmInputParas).line);
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