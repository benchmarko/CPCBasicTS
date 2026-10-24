# Headless BASIC Tests

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