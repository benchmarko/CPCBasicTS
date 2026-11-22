# CPCBasicTS (TypeScript)

## Role and target

CPCBasicTS is the active TypeScript successor to CPCBasic. It compiles
Locomotive BASIC 1.1-style source to JavaScript and provides browser UI and
Node.js entry points. The browser build targets ES2020; the project removed
its old browser polyfill module and legacy browser fallbacks during prior
modernization work.

Do not reintroduce legacy browser shims by default. One intentional exception
is the browser host's in-memory storage fallback: access to `localStorage` can
fail in contexts such as `file://`, so the UI host falls back to Map-backed
storage. This is a storage fallback, not a general browser polyfill. Keep
Node/headless behavior distinct from browser behavior.

## Layout and architecture

- `src/BasicLexer.ts`, `BasicParser.ts`, `BasicFormatter.ts`, and
  `BasicTokenizer.ts`: BASIC source processing.
- `src/CodeGeneratorJs.ts` and `src/ProgramCompiler.ts`: compilation.
- `src/CpcVm.ts`, `src/RunLoop.ts`, and related runtime files: CPC execution
  semantics.
- `src/Core.ts`, `src/Model.ts`, `src/Engine.ts`, and `src/Runtime.ts`: core
  application/runtime coordination.
- `src/ui/`: browser UI and host integration. `ui/Controller.ts` contains
  browser-facing behavior.
- `src/node/`: Node entry points and host services.
- `src/MemoryStorage.ts`: shared Map-backed in-memory storage helper.
- `src/test/`: QUnit tests, including browser-host and headless tests.
- `docs/HEADLESS.md`: detailed headless controller and deterministic test harness
  contract and limitations.

The headless harness executes generated JavaScript; it is not a security
sandbox or a full CPC emulator. It intentionally does not implement pixel
rendering, hardware timing, or host file I/O. See `docs/HEADLESS.md` before
extending it.

## Example implementations

`cpcBasic.addItem` accepts the multiple-implementation form documented in the
repository README and `src/Interfaces.ts`. `src/Core.ts` normalizes entries
and selects the declared default or requested implementation. The BASIC UI
has a selector; the `implementation` URL/config value selects an implementation
for direct loading. Keep a single catalog example and store its variants on the
example entry; do not make each variant a separate catalog choice. Switching
the picker saves edits to the current implementation and changes the source
without treating undo/redo as history across variants. Picker switching does
not automatically run the new source; autorun applies on direct example
loading. Existing examples without an implementation list must continue to
behave as before. Use `examples/test/testpimp.js` and tests in `src/test/` as
examples.

The CPCBasicTS app can load external catalogs including CPCBasicApps and
LocoBasic; remote catalogs may require a network connection. This catalog
integration does not make LocoBasic syntax/runtime equivalent to CPCBasicTS.

## Program keys and keyboard state

The browser UI parses standalone `REM CPCBasic-keys:` or apostrophe-comment
declarations in `src/ui/Controller.ts` and renders on-screen buttons. The
declaration is a flat array of key/text pairs. The parser uses `JSON.parse`,
accepts string or integer codes, and supports codes through 65535.

User-key behavior is split across:

- `src/ui/Controller.ts`: declaration parsing, button creation, pointer
  press/release tracking, and input-buffer insertion. Buttons retain only
  their declared code in `data-key`; CPC mapping is resolved by
  `VirtualKeyboard.getUserKeyInfo`. Held buttons are tracked by element
  identity, so duplicate key codes remain separate presses.
- `src/ui/VirtualKeyboard.ts`: maps ordinary CPC character codes to CPC key
  numbers using the virtual keyboard table; also maps selected special CPC
  character codes. Punctuation and shifted symbols derive from `key` and
  `keyShift` entries in that table.
- `src/ui/Keyboard.ts`: owns held CPC-key state read by `INKEY(n)`.

`INKEY(n)` takes CPC keyboard numbers 0–79, not ASCII values. A mapped program
button updates this state only while held; character input is queued on press.
For mapped uppercase symbols/letters, the shift bit is set.

The extended user-key code range **256–335** means `256 + CPC key number`.
It explicitly selects `INKEY` key 0–79 and queues that CPC key's usual input
character when one exists. For example, 324 targets CPC key 68 (Tab), 331
targets key 75 (joystick right), and 332 targets key 76 (joystick fire 1).
Modifier keys with no input character enqueue nothing. This encoding lets
different buttons enqueue the same character while reporting different CPC
key states.

Treat 256–335 as a CPCBasicTS extension, not generic ASCII or portable
`CPCBasic-keys` syntax. LocoBasic currently shares the comment convention but
has neither the same parser nor `INKEY()` semantics; check its current
implementation before sharing a program. CPCBasic is a separate legacy app
and should not be assumed to implement this TypeScript UI feature.

## Validation

Run commands from this repository:

```sh
npm run lint
npm run build
npm test
```

`npm run build` performs separate TypeScript checks, Rollup bundling, copies
static/test assets into `dist/`, and updates version metadata. `npm test` runs
the built QUnit bundle, so build first when tests need to reflect source
changes. `npm run testAll` enables the broader parse-example tests.

When modifying headless behavior, run the focused headless QUnit filter after
building; see the command in `docs/HEADLESS.md`.
