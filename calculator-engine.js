// parses supported arithmetic without using eval

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

// split an expression into number and operator tokens
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
      const value = parseFloat(numStr);
      // reject invalid or unsupported numbers
      if (!Number.isFinite(value)) {
        throw new InvalidExpressionError("Number is outside the supported range");
      }
      tokens.push({ type: "number", value });
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

// arithmetic grammar:
//   expression := term (('+' | '-') term)*
//   term       := unary (('*' | '/') unary)*
//   unary      := '-' unary | number
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

// remove common floating-point artefacts
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
  const result = roundResult(parse(tokens));
  // reject overflow in the calculated result
  if (!Number.isFinite(result)) {
    throw new InvalidExpressionError("Number is outside the supported range");
  }
  return result;
}

// expose the engine to the browser and node tests
const CalculatorEngineExports = { evaluate, tokenize, parse, DivisionByZeroError, InvalidExpressionError };

if (typeof module !== "undefined" && module.exports) {
  module.exports = CalculatorEngineExports;
} else {
  window.CalculatorEngine = CalculatorEngineExports;
}
