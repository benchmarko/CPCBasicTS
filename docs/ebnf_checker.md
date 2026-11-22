# CPCBasicTS EBNF checker

This npm project checks the ISO/IEC 14977 EBNF grammar in
`./cpcbasic.ebnf` with `ebnf2railroad`.

```sh
npm install
npm run check
```

To generate railroad diagrams and an HTML grammar reference:

```sh
npm run render
```

The linter checks EBNF syntax, duplicate declarations, and grammar references.
It does not prove that the grammar exactly matches CPCBasicTS behavior or parse
BASIC programs. For that runtime check, run `npm run testnode` from `../CPCBasicTS`.
