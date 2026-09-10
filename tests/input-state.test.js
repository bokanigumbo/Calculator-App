// input-state unit tests

const assert = require("assert");
const { createInputState } = require("../input-state.js");
const { evaluate } = require("../calculator-engine.js");

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function press(state, chars) {
  for (const ch of chars) state.appendChar(ch);
}

test("typing digits builds up the expression normally", () => {
  const state = createInputState({ evaluate });
  press(state, "123");
  assert.strictEqual(state.getState().expression, "123");
});

test("a leading zero is replaced, not prepended to", () => {
  const state = createInputState({ evaluate });
  state.appendChar("7");
  assert.strictEqual(state.getState().expression, "7");
});

test("pressing an operator after another operator replaces it, rather than stacking: 5++ becomes 5+", () => {
  const state = createInputState({ evaluate });
  press(state, "5++");
  assert.strictEqual(state.getState().expression, "5+");
});

test("a unary minus after an operator is allowed to stack once: 5*- is kept as-is", () => {
  const state = createInputState({ evaluate });
  press(state, "5*-");
  assert.strictEqual(state.getState().expression, "5*-");
});

test("THE ACTUAL REPORTED BUG: 5 * - * must produce 5*, not the malformed 5**", () => {
  const state = createInputState({ evaluate });
  press(state, "5*-*");
  assert.strictEqual(state.getState().expression, "5*");
});

test("the same fix applies however the second operator arrives: 5*-+ produces 5+", () => {
  const state = createInputState({ evaluate });
  press(state, "5*-+");
  assert.strictEqual(state.getState().expression, "5+");
});

test("a second minus right after the first also goes through the same collapse-and-replace path: 5*-- becomes 5-", () => {
  // collapse the previous operator and unary minus
  const state = createInputState({ evaluate });
  press(state, "5*--");
  assert.strictEqual(state.getState().expression, "5-");
});

test("a leading operator other than minus is blocked entirely: pressing / on an empty display does nothing", () => {
  const state = createInputState({ evaluate });
  state.appendChar("/");
  assert.strictEqual(state.getState().expression, "0");
});

test("a leading minus is allowed, to start a negative number", () => {
  const state = createInputState({ evaluate });
  state.appendChar("-");
  assert.strictEqual(state.getState().expression, "-");
});

test("a second decimal point in the same number is rejected: 4..2 becomes 4.2, not 4..2", () => {
  const state = createInputState({ evaluate });
  press(state, "4");
  state.appendChar(".");
  state.appendChar(".");
  press(state, "2");
  assert.strictEqual(state.getState().expression, "4.2");
});

test("each number in a multi-number expression gets its own independent decimal point: 4.2+3.5", () => {
  const state = createInputState({ evaluate });
  press(state, "4.2+3.5");
  assert.strictEqual(state.getState().expression, "4.2+3.5");
});

test("calculate() on a valid expression shows the result and marks justCalculated", () => {
  const state = createInputState({ evaluate });
  press(state, "2+2");
  state.calculate();
  const s = state.getState();
  assert.strictEqual(s.expression, "4");
  assert.strictEqual(s.justCalculated, true);
});

test("typing a digit right after a result starts a brand new calculation", () => {
  const state = createInputState({ evaluate });
  press(state, "2+2");
  state.calculate();
  state.appendChar("7");
  assert.strictEqual(state.getState().expression, "7");
});

test("typing an operator right after a result continues chaining from it: 5, =, +3, = gives 8", () => {
  const state = createInputState({ evaluate });
  state.appendChar("5");
  state.calculate();
  press(state, "+3");
  state.calculate();
  assert.strictEqual(state.getState().expression, "8");
});

test("dividing by zero shows the specific message and sets hasError", () => {
  const state = createInputState({ evaluate });
  press(state, "8/0");
  state.calculate();
  const s = state.getState();
  assert.strictEqual(s.expression, "Cannot divide by zero");
  assert.strictEqual(s.hasError, true);
});

test("any keypress after an error clears it and starts fresh, rather than appending onto the error text", () => {
  const state = createInputState({ evaluate });
  press(state, "8/0");
  state.calculate();
  state.appendChar("7");
  const s = state.getState();
  assert.strictEqual(s.expression, "7");
  assert.strictEqual(s.hasError, false);
});

test("clear() resets everything back to the initial state", () => {
  const state = createInputState({ evaluate });
  press(state, "123+456");
  state.clear();
  const s = state.getState();
  assert.strictEqual(s.expression, "0");
  assert.strictEqual(s.justCalculated, false);
  assert.strictEqual(s.hasError, false);
});

test("backspace removes exactly one character", () => {
  const state = createInputState({ evaluate });
  press(state, "123");
  state.backspace();
  assert.strictEqual(state.getState().expression, "12");
});

test("backspacing the last character leaves the display at 0, not empty", () => {
  const state = createInputState({ evaluate });
  state.appendChar("5");
  state.backspace();
  assert.strictEqual(state.getState().expression, "0");
});

test("onChange fires with the current state every time something changes", () => {
  const seen = [];
  const state = createInputState({ evaluate, onChange: (s) => seen.push(s.expression) });
  press(state, "12");
  assert.deepStrictEqual(seen, ["1", "12"]);
});

let passed = 0, failed = 0;
for (const { name, fn } of tests) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (err) { console.log(`  ✗ ${name}\n    ${err.message}`); failed++; }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
