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

test("a decimal point with no digits either side of it is rejected: .", () => {
  // parseFloat(".") silently returns NaN in plain javascript - this is
  // exactly the kind of "technically a number, not actually a number"
  // result that needed an explicit finite-value check to catch
  assert.throws(() => evaluate("."), InvalidExpressionError);
});

test("a result that overflows past Number.MAX_VALUE is rejected, not silently returned as Infinity", () => {
  // two individually finite numbers whose PRODUCT exceeds javascript's
  // maximum representable number (~1.8e308) - this is the second,
  // separate check (on the calculated result), not the same code path as
  // the "individual number too large" test below
  const bigButFiniteNumber = "9".repeat(160); // ~1e160, well within finite range on its own
  assert.throws(() => evaluate(`${bigButFiniteNumber}*${bigButFiniteNumber}`), InvalidExpressionError);
});

test("a single number literal too large to represent at all is rejected: a 400-digit number", () => {
  // this one overflows to Infinity from parseFloat() on the number ITSELF,
  // before any arithmetic even happens - catches it at tokenize time, not
  // calculation time
  const impossiblyLongNumber = "9".repeat(400);
  assert.throws(() => evaluate(impossiblyLongNumber), InvalidExpressionError);
});

test("repeated unary minus signs are supported and evaluate as double negation: --5 equals 5", () => {
  // this calculator DOES intentionally support this: the grammar already
  // handles any number of leading unary minus signs correctly as nested
  // negation, and "negative of a negative" is genuinely correct arithmetic
  // (not an input a user could actually type via the on-screen/keyboard
  // UI, since script.js's own input handling replaces a second consecutive
  // "-" rather than stacking it - but the engine itself is intentionally
  // correct for direct/programmatic use beyond just this one UI)
  assert.strictEqual(evaluate("--5"), 5);
});

test("three repeated unary minus signs correctly evaluate as an odd number of negations: ---5 equals -5", () => {
  assert.strictEqual(evaluate("---5"), -5);
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
