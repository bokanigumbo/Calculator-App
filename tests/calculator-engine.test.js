// tests/calculator-engine.test.js
//
// tests the pure calculation engine directly - no browser or dom needed,
// since calculator-engine.js has no dependency on either. run with `npm test`.
//
// deliberately doesn't try to test script.js's dom/keyboard wiring here -
// that would need a real browser environment (jsdom or similar) to do
// properly, which felt like a heavier addition than this project needs.
// the engine is where the actual logic (and the actual bugs from the
// original report) lived, so that's what's covered.

const assert = require("assert");
const { evaluate, DivisionByZeroError, InvalidExpressionError } = require("../calculator-engine.js");

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("basic addition", () => {
  assert.strictEqual(evaluate("2+2"), 4);
});

test("basic subtraction", () => {
  assert.strictEqual(evaluate("10-4"), 6);
});

test("basic multiplication", () => {
  assert.strictEqual(evaluate("6*7"), 42);
});

test("basic division", () => {
  assert.strictEqual(evaluate("20/4"), 5);
});

test("operator precedence: multiplication before addition", () => {
  assert.strictEqual(evaluate("2+3*4"), 14);
});

test("operator precedence: division before subtraction", () => {
  assert.strictEqual(evaluate("20-10/2"), 15);
});

test("decimals", () => {
  assert.strictEqual(evaluate("2.5*4"), 10);
});

test("floating point rounding: 0.1 + 0.2 doesn't produce 0.30000000000000004", () => {
  assert.strictEqual(evaluate("0.1+0.2"), 0.3);
});

test("unary minus after an operator: 5*-3", () => {
  assert.strictEqual(evaluate("5*-3"), -15);
});

test("leading unary minus: -5+2", () => {
  assert.strictEqual(evaluate("-5+2"), -3);
});

test("double minus reads as subtracting a negative: 5--3", () => {
  assert.strictEqual(evaluate("5--3"), 8);
});

test("division by zero throws DivisionByZeroError specifically", () => {
  assert.throws(() => evaluate("8/0"), DivisionByZeroError);
});

test("a leading operator (other than -) is rejected: /5", () => {
  assert.throws(() => evaluate("/5"), InvalidExpressionError);
});

test("a doubled operator is rejected: 5++3", () => {
  assert.throws(() => evaluate("5++3"), InvalidExpressionError);
});

test("a number with two decimal points is rejected: 4..2", () => {
  assert.throws(() => evaluate("4..2"), InvalidExpressionError);
});

test("an empty expression is rejected", () => {
  assert.throws(() => evaluate(""), InvalidExpressionError);
});

test("letters in the expression are rejected: Error7", () => {
  assert.throws(() => evaluate("Error7"), InvalidExpressionError);
});

test("trailing operator is rejected: 5+", () => {
  assert.throws(() => evaluate("5+"), InvalidExpressionError);
});

// ===== runner =====
let passed = 0, failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
