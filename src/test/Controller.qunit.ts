import { Controller } from "../ui/Controller";
import { ViewID } from "../ui/UiConstants";

function createBrowserController(restore = true) {
	const events: unknown[][] = [];
	let stop = { reason: "break", paras: { stream: 2 } };
	const controller = Object.create(Controller.prototype) as Controller,
		runtime = {
			beginControl: (reason: string, beforeStop?: () => void) => {
				events.push(["control", reason]);
				beforeStop?.();
			},
			continueProgram: (startMainLoop: () => void, beforeRestore?: () => void, onContinueState?: (restored: boolean) => void) => {
				events.push(["continue"]);
				if (restore) {
					beforeRestore?.();
				}
				stop = { reason: "waitInput", paras: { stream: 2 } };
				onContinueState?.(restore);
				startMainLoop();
			},
			startMainLoop: () => { events.push(["loop"]); }
		},
		keyboard = {
			setOptions: (options: { fnOnKeyDown?: () => void }) => {
				events.push(["keyboard", options.fnOnKeyDown ? "handler" : "clear"]);
			}
		},
		view = {
			setDisabled: (id: ViewID, disabled: boolean) => { events.push(["disabled", id, disabled]); }
		},
		vm = {
			vmGetStopObject: () => stop,
			cursor: (stream: number, cursorOn: number) => { events.push(["cursor", stream, cursorOn]); }
		};

	Object.assign(controller as unknown as Record<string, unknown>, {
		runtime,
		keyboard,
		view,
		vm,
		fnWaitInputHandler: () => { events.push(["input-handler"]); },
		fnWaitKeyHandler: () => { events.push(["key-handler"]); }
	});
	return { controller, events };
}

QUnit.module("Browser Controller adapter", function () {
	QUnit.test("control commands delegate while keyboard cleanup remains host-owned", function (assert) {
		const { controller, events } = createBrowserController();
		controller.startParseRun();
		assert.deepEqual(events, [["control", "parseRun"], ["keyboard", "clear"], ["loop"]]);
	});

	QUnit.test("continuing restores suspended input after cleanup and before loop start", function (assert) {
		const { controller, events } = createBrowserController();
		controller.startContinue();
		assert.deepEqual(events, [
			["disabled", ViewID.runButton, true],
			["disabled", ViewID.stopButton, false],
			["disabled", ViewID.continueButton, true],
			["continue"],
			["keyboard", "clear"],
			["cursor", 2, 1],
			["keyboard", "handler"],
			["loop"]
		]);
	});

	QUnit.test("continuing an active INPUT wait reinstalls its handler without suspension cleanup", function (assert) {
		const { controller, events } = createBrowserController(false);
		controller.startContinue();
		assert.deepEqual(events, [
			["disabled", ViewID.runButton, true],
			["disabled", ViewID.stopButton, false],
			["disabled", ViewID.continueButton, true],
			["continue"],
			["cursor", 2, 1],
			["keyboard", "handler"],
			["loop"]
		]);
	});
});
