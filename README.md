# cute calculator

a pastel-themed calculator with light/dark modes, built in vanilla HTML/CSS/JS - no frameworks, no build step.

**live demo:** [try it here](https://bokanigumbo.github.io/Calculator-App/)

## features

- the four basic operations, with correct operator precedence (multiplication and division happen before addition and subtraction, same as real arithmetic)
- negative numbers and chained operations work correctly (`5*-3`, `-5+2`, `5--3`)
- a result becomes the start of a new calculation if you type a number next, or continues the calculation if you type an operator next (e.g. `5`, `=`, `+3`, `=` gives `8`)
- clear error messages instead of silent bad output - a genuinely broken expression says `Error`, and dividing by zero says `Cannot divide by zero` specifically, rather than showing `Infinity`
- input validation prevents malformed expressions being typed at all (`5++3`, `4..2`, `/5` never make it onto the screen in the first place)
- full keyboard support - numbers, `+ - * /`, `Enter`/`=` to calculate, `Backspace`, `Escape` to clear
- light/dark theme, remembered between visits via `localStorage`
- responsive down to narrow phone screens

## technical decisions

**no `eval()`.** the original version used `eval(display.textContent)` to actually do the maths, which runs whatever string you hand it as real javascript - far more power than a calculator needs, and the kind of thing that gets flagged immediately in any code review. `calculator-engine.js` is a small hand-written tokenizer and recursive-descent parser that only understands numbers and `+ - * /`, so there's no possibility of it ever doing anything else.

**the engine is a separate file with no DOM code in it at all.** `calculator-engine.js` just takes a string and returns a number (or throws a specific error). that's what makes it possible to test directly in node (see `tests/`) without needing a browser, and it's also just cleaner - `script.js` handles all the button/keyboard/display wiring, and never has to know how the arithmetic itself works.

**input validation happens at the point of typing, not just at `=`.** rather than letting someone type `5++3` and only catching it when they hit equals, invalid keypresses are rejected (or sensibly reinterpreted - e.g. pressing `+` right after `+` replaces it rather than stacking) as they happen. this felt like better UX than showing an error after the fact for something that was preventable from the start.

## running it locally

no build step - just open `index.html` in a browser.

## running the tests

```bash
npm test
```

23 tests covering the calculation engine: basic arithmetic, operator precedence, negative numbers, floating-point rounding, and every invalid-input case from the original bug list, plus edge cases around numbers themselves: a bare decimal point (`.`, which `parseFloat` silently turns into `NaN` if left unchecked), numbers too large to represent at all, and results that overflow past `Number.MAX_VALUE` during a calculation even when both inputs were fine on their own. these test `calculator-engine.js` directly, not the browser UI - a full test of the keyboard/click wiring would need a real browser environment (jsdom or similar), which felt like a larger addition than this project needs right now.

## known limitations

- no memory functions (M+, M-, MR)
- no support for parentheses - `2*(3+4)` isn't understood, only left-to-right expressions with standard precedence
- the DOM/keyboard wiring in `script.js` is manually verified, not covered by the automated tests (see above)

## license

MIT - see [LICENSE](LICENSE).
