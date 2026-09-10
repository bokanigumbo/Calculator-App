// calculation engine unit tests

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
  // reject a decimal point without digits
  assert.throws(() => evaluate("."), InvalidExpressionError);
});

test("a result that overflows past Number.MAX_VALUE is rejected, not silently returned as Infinity", () => {
  // reject overflow after calculation
  const bigButFiniteNumber = "9".repeat(160);
  assert.throws(() => evaluate(`${bigButFiniteNumber}*${bigButFiniteNumber}`), InvalidExpressionError);
});

test("a single number literal too large to represent at all is rejected: a 400-digit number", () => {
  // reject overflow while tokenising
  const impossiblyLongNumber = "9".repeat(400);
  assert.throws(() => evaluate(impossiblyLongNumber), InvalidExpressionError);
});

test("repeated unary minus signs are supported and evaluate as double negation: --5 equals 5", () => {
  // support nested unary negation in the engine
  assert.strictEqual(evaluate("--5"), 5);
});

test("three repeated unary minus signs correctly evaluate as an odd number of negations: ---5 equals -5", () => {
  assert.strictEqual(evaluate("---5"), -5);
});

// test runner
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
