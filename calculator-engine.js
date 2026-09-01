// calculator-engine.js
//
// pure calculation logic - no DOM in here at all, which is what makes it
// possible to test directly (see tests/calculator-engine.test.js) without
// needing a browser.
//
// this replaces eval(). eval() runs whatever string you hand it as actual
// javascript, which is a lot more power than a calculator needs and exactly
// the kind of thing a recruiter reviewing the code would flag immediately -
// there's no way for the caller to tell the difference between "2+2" and
// something far less innocent. this parser only understands numbers and
// +, -, *, /, so there's no possibility of it ever doing anything else.

class DivisionByZeroError extends Error {
  constructor() {
    super("Cannot divide by zero");
    this.name = "DivisionByZeroError";
  }
}

class InvalidExpressionError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidExpressionError";
  }
}

// turns a raw string like "12.5*-3" into a flat list of number/operator
// tokens. this is also where malformed numbers get caught - "4..2" fails
// right here, since a number token is never allowed to contain more than
// one decimal point.
function tokenize(expression) {
  const tokens = [];
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];

    if (ch === " ") {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let numStr = ch;
      i++;
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        numStr += expression[i];
        i++;
      }
      if ((numStr.match(/\./g) || []).length > 1) {
        throw new InvalidExpressionError("A number can't contain more than one decimal point");
      }
      tokens.push({ type: "number", value: parseFloat(numStr) });
      continue;
    }

    if ("+-*/".includes(ch)) {
      tokens.push({ type: "operator", value: ch });
      i++;
      continue;
    }

    throw new InvalidExpressionError(`Unexpected character: "${ch}"`);
  }

  return tokens;
}

// standard arithmetic precedence, left-to-right associativity:
//   expression := term (('+' | '-') term)*
//   term       := unary (('*' | '/') unary)*
//   unary      := '-' unary | number
//
// the unary rule is what lets "5*-3" and "-5+2" parse correctly - a minus
// sign is only ever "subtract" when it's sitting between two terms; anywhere
// else it negates whatever comes right after it.
function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseUnary() {
    const token = peek();
    if (!token) throw new InvalidExpressionError("Expression ends unexpectedly");

    if (token.type === "operator" && token.value === "-") {
      consume();
      return -parseUnary();
    }

    if (token.type === "number") {
      consume();
      return token.value;
    }

    throw new InvalidExpressionError("Expected a number");
  }

  function parseTerm() {
    let value = parseUnary();
    while (peek() && peek().type === "operator" && (peek().value === "*" || peek().value === "/")) {
      const op = consume().value;
      const right = parseUnary();
      if (op === "*") {
        value *= right;
      } else {
        if (right === 0) throw new DivisionByZeroError();
        value /= right;
      }
    }
    return value;
  }

  function parseExpression() {
    let value = parseTerm();
    while (peek() && peek().type === "operator" && (peek().value === "+" || peek().value === "-")) {
      const op = consume().value;
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  if (pos !== tokens.length) {
    throw new InvalidExpressionError("Unexpected trailing input");
  }
  return result;
}

// rounds away the classic floating-point artefacts (0.1 + 0.2 producing
// 0.30000000000000004) without meaningfully limiting real precision
function roundResult(n) {
  return Math.round(n * 1e10) / 1e10;
}

function evaluate(expression) {
  if (!expression || expression.trim() === "") {
    throw new InvalidExpressionError("Nothing to calculate");
  }
  const tokens = tokenize(expression);
  if (tokens.length === 0) {
    throw new InvalidExpressionError("Nothing to calculate");
  }
  return roundResult(parse(tokens));
}

// works both as a plain global in the browser (loaded via <script>, no
// build step) and as a normal module in node (for the test suite).
//
// this needs to be an explicit namespace object (`CalculatorEngine`) in the
// browser, not just bare global functions - script.js calls
// CalculatorEngine.evaluate(...), and without this exact assignment that
// would throw "CalculatorEngine is not defined" the moment a key is
// pressed, despite the node test suite passing perfectly fine (require()
// doesn't care what the exported object is named, only the browser does).
const CalculatorEngineExports = { evaluate, tokenize, parse, DivisionByZeroError, InvalidExpressionError };

if (typeof module !== "undefined" && module.exports) {
  module.exports = CalculatorEngineExports;
} else {
  window.CalculatorEngine = CalculatorEngineExports;
}
