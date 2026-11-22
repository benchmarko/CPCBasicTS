# Headless BASIC Tests

## Controller Execution State

The controller-based runner is separate from the deterministic test harness below.
Both controllers implement the DOM-free `IRuntimeController` contract, exported
as a type from the core entry point. It covers source access, key input,
execution commands, formatting, and runtime settings. The browser's `IController`
extends it with presentation-only operations such as screenshots and galleries.

`getVariableNames()` returns a fresh list of internal runtime identifiers, such
as `countR`, `name$`, or `boardAR`. `getVariable(name)` reads those identifiers,
matching the existing browser variable panel; it does not resolve BASIC names.
Array values retain the existing live-reference behavior. Browser labels and
sorting are handled by the UI adapter, not the runtime controller.

`getOutputText()` returns the controller-owned compiled output.
`setOutputText(text)` replaces it and invalidates the cached JavaScript function.
Browser output-editor changes synchronize through this setter. Compiled output
is trusted JavaScript, not a sandboxed input format.

Both controller option types extend the core `RuntimeCallbacks` interface:
source changes, compiled output, result text, execution state, diagnostics, and
program completion use the same callback names and payloads. All listeners are
optional; hosts can observe only what they need. The browser also reports
programmatic source changes through `onInputText(value, keepStack)`.

`RuntimeHost`, also exported as a core type, defines storage, script loading,
base64 codecs, and scheduling. `Controller0` requires these services. The browser
controller accepts overrides through its options and otherwise uses lazy browser
defaults. Imports, exports, directory commands, and file loading all use the same
injected storage and codecs.

Both `Controller0` and the browser `Controller` expose `getExecutionState()` and
accept an optional `onExecutionState(state)` callback. Snapshots contain `reason`,
`line`, and `isRunning`; repeated identical snapshots do not trigger callbacks.

`isRunning` means the controller loop is active, including input, key, and sound
waits. It is false when suspended or idle in direct mode. Reasons are the VM's
existing stop reasons, not UI labels: explicit BASIC END reports `stop`. Terminal
states are reported before the controller enters direct mode. Snapshots are copies
and do not expose mutable VM state.

`startEscape()` applies the same two-stage break policy in both controllers.
The first Escape suspends execution; `startContinue()` or a nonempty `putKeys()`
resumes it. When resuming with keys, the first queued character is consumed as
the resume key. A second Escape stops or enters the BASIC ON BREAK handler.
In direct mode, Escape clears the partially typed command without starting the
execution loop. ON BREAK CONT retains its normal ignore behavior.

Both controllers also accept an optional `onDiagnostic(diagnostic)` callback for
visible compiler and runtime errors. Copied payloads preserve the full and short
messages, error name, source position and length, BASIC line, value, and BASIC
error code when available. `selectSource` indicates whether the browser should
highlight the source range; suppressing selection does not discard metadata.
Errors handled by BASIC's ON ERROR do not emit visible diagnostics. The existing
CPC error text is still printed independently of this callback.

`Controller0` also supports the runtime-setting commands used by the browser:
`setBasicVersion(version)`, `fnArrayBounds()`, `fnImplicitLines()`,
`fnIntegerOverflow()`, `fnTrace()`, `fnPrettyLowercaseVars()`, and `fnSpeed()`.
For the `fn...` commands, update the corresponding model property first; these
commands explicitly apply that property to existing compiler/runtime instances.
Array-bound changes reset the current execution position and clear variables.

`startRenum({ newLine, oldLine, step, keep })` schedules renumbering without UI
fields. All options are optional; omitted values use the existing defaults of
10, 1, 10, and 65535. Calling the browser controller without arguments still
uses the renumber fields. Source changes and failures use the normal source and
diagnostic callbacks.

`loadDatabase(name)` selects and loads a configured database, then loads its
selected example; omitting the name uses the model's current database.
`loadExample(key, { autorun })` loads a full database-relative key without reading
selection controls. The optional autorun override applies only to that load and
does not change the model's default. Binary, data-only, and assembler examples
retain the existing load-only behavior. Loading uses the injected script loader
and storage. The legacy selection-handler methods remain compatibility wrappers.

## Deterministic Test Harness

The Node entry point exports a small testing harness around the existing BASIC
compiler and VM. It executes compiled BASIC, not a separate model of the program.
No compiler or production VM changes are required.

Build with `npm run build:separate && npm run build:rollup`. Then:

```javascript
const assert = require("node:assert/strict");
const { compile } = require("cpcbasicts/node");

const program = compile(`
DEFINT a-z
DIM board(9,19)
WHILE k$<>"q"
 k$=INKEY$
 IF k$="a" THEN moves=moves+1
WEND
END
`, { implicitLines: true });

const machine = program.createHeadlessMachine({ seed: 123 });
assert.equal(machine.runUntilInput().reason, "input");
machine.setArrayElement("board", [4, 19], 1);
machine.setVariable("moves", 7);
machine.pressKey("a");
machine.runUntilInput(); // The queued key is read.
machine.runUntilInput(); // Finish its action and reach the following read.
assert.equal(machine.getVariable("moves"), 8);
assert.equal(machine.getArrayElement("board", [4, 19]), 1);
```

## Execution Boundaries

`runUntilInput()` pauses **after** a keyboard read, at the next compiler-generated
checkpoint. It does not mean the BASIC program is waiting for input, and it does
not interrupt an expression. More than one read or statement can finish before
that checkpoint. Statements after the read may still be pending when it returns.
There is no exception-based unwinding, replay, or loss of the return stack.

`pressKey(text)` queues CPC byte characters, in order, for subsequent reads.
It does not simulate key-down state or auto-repeat. Cursor key bytes can be queued
using `String.fromCharCode(240)` through `String.fromCharCode(243)`.

`run()` continues without stopping on reads. Both methods accept `{ maxSteps }`,
defaulting to 100,000 compiler checkpoints, **not** BASIC statements or CPU cycles.
A budget stop is resumable with another call. This is for trusted BASIC test
programs; executing generated JavaScript is not a security sandbox.

Run results include `reason`, `steps`, `line`, and `vmReason`:

| Reason | Meaning |
| --- | --- |
| `input` | At least one keyboard read completed; paused at a safe checkpoint. |
| `budget` | Execution budget reached; call again to continue. |
| `frame` | FRAME/flyback reached; virtual time advanced six ticks. Call again to continue. |
| `stopped` | STOP, END, or program completion. Create a new machine to restart. |
| `blocked` | Other VM stop, such as INPUT or file I/O. Inspect `vmReason`; no host I/O is supplied. |
| `error` | Runtime or unsupported-facility error, available as `error`. The machine remains faulted. |

Compile failures throw `HeadlessCompileError`; its `diagnostic` property preserves
the compiler's structured error, including source position information.

## State and Devices

- `createHeadlessMachine({ seed, ticks })` creates an independent machine. The
  CPC RNG is selected explicitly; BASIC's own RANDOMIZE can override the seed.
- `advanceTime(ticks)` advances virtual CPC TIME (300 ticks per second). There
  is no automatic time passage during execution, except FRAME. A time-polling
  loop otherwise reaches its execution budget until the test advances the clock.
- `getVariable(name)` / `setVariable(name, value)` use BASIC names and optional
  `!`, `%`, or `$` suffixes. Unsuffixed names follow current DEFINT/DEFREAL/DEFSTR.
- `getArrayElement(name, indices)` / `setArrayElement(name, indices, value)` use
  BASIC subscript order and enforce integer bounds. Unknown names are rejected.
  Arrays receive the VM's normal default dimensions before DIM executes.
- `getOutput()` returns the VM output buffer, including CPC control characters.
- `screen.getCell(x, y)` returns a copied `{ char, pen, paper }` text cell with
  **zero-based** screen coordinates, or `undefined` for an unwritten cell.
  Text windows, clearing, and scrolling are captured; this is not a pixel renderer.

The screen reuses NoCanvas for non-rendering configuration operations. Pixel
graphics, transparent text composition, and screen-memory access are explicitly
unsupported. Custom glyph bitmap appearance and ink flashing are not validated.
Sound is muted and never queues or blocks; sound-queue queries/timers, AFTER/EVERY,
key expansion, key-state queries, and joysticks are unsupported. INPUT and file I/O
are reported as blocked stops rather than performed. Firmware and cycle-correct
behavior still require an emulator or real hardware.

Tests are in `src/test/Headless.qunit.ts`:

```sh
./node_modules/.bin/qunit dist/test-bundle.js --filter Headless
```