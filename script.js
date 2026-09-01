// script.js - wires the calculator UI up to calculator-engine.js
// (calculator-engine.js must be loaded first - see index.html)

const displayEl = document.getElementById("display");
const toggleBtn = document.getElementById("theme-toggle");

// the actual expression being built, kept as a plain string separately
// from the dom - render() is the only place that writes it to the screen
let expression = "0";

// after pressing "=" successfully, the next key should usually start a
// fresh calculation - UNLESS it's an operator, in which case the result
// becomes the first number of a new chained calculation (e.g. press
// 5, =, then + 3, = -> 8). previously there was no distinction at all:
// any key after "=" just appended onto whatever was already showing.
let justCalculated = false;

// after an error message is shown, any key press should just clear it and
// start over, rather than appending onto the word "Error" itself (which is
// exactly how "Error7" was possible before)
let hasError = false;

function render() {
  displayEl.textContent = expression;
}

function isOperator(ch) {
  return ch === "+" || ch === "-" || ch === "*" || ch === "/";
}

// returns the number segment currently being typed - everything after the
// last operator (or the whole expression, if there isn't one yet). used to
// stop a second decimal point being added to the SAME number, while still
// allowing "4.2+3.5" (two different numbers, each with their own point).
function currentSegment() {
  let lastOpIndex = -1;
  for (let i = 0; i < expression.length; i++) {
    if (isOperator(expression[i]) && i !== 0) lastOpIndex = i; // i!==0 so a leading "-" isn't mistaken for a split point
  }
  return expression.slice(lastOpIndex + 1);
}

function appendChar(char) {
  if (hasError) {
    // any key clears an error state and starts fresh, rather than
    // appending onto the error message itself. rendering immediately here
    // matters: without it, pressing an operator right after an error would
    // silently reset the internal state but leave the old error message
    // visible on screen until some other keypress happened to trigger a
    // render - caught this by tracing through the state transitions by
    // hand rather than just eyeballing the code.
    expression = "0";
    hasError = false;
    render();
  } else if (justCalculated) {
    if (isOperator(char)) {
      // continue chaining from the previous result
      justCalculated = false;
    } else {
      // any other key after "=" starts a brand new calculation
      expression = "";
      justCalculated = false;
    }
  }

  if (/[0-9]/.test(char)) {
    expression = expression === "0" ? char : expression + char;
    render();
    return;
  }

  if (char === ".") {
    if (currentSegment().includes(".")) return; // one decimal point per number, no more
    expression = expression === "" || expression === "0" ? "0." : expression + ".";
    render();
    return;
  }

  if (isOperator(char)) {
    if (expression === "" || expression === "0") {
      // block a leading operator entirely, except "-" for a negative
      // number - this is what stops "/5" ever being typeable at all
      if (char === "-") {
        expression = "-";
        render();
      }
      return;
    }

    const last = expression[expression.length - 1];
    if (isOperator(last)) {
      // "5*-3" (a negative number after an operator) is allowed; stacking
      // a second operator on top of one already there ("5++3") isn't -
      // instead the new key replaces the pending one, which is the
      // friendlier, more standard calculator behaviour than just
      // rejecting the keypress outright
      if (char === "-" && last !== "-") {
        expression += char;
      } else {
        expression = expression.slice(0, -1) + char;
      }
      render();
      return;
    }

    expression += char;
    render();
    return;
  }
}

function clearDisplay() {
  expression = "0";
  justCalculated = false;
  hasError = false;
  render();
}

function backspace() {
  if (hasError) {
    clearDisplay();
    return;
  }
  expression = expression.slice(0, -1) || "0";
  render();
}

function calculate() {
  try {
    const result = CalculatorEngine.evaluate(expression);
    expression = String(result);
    justCalculated = true;
    hasError = false;
  } catch (err) {
    expression = err instanceof CalculatorEngine.DivisionByZeroError
      ? "Cannot divide by zero"
      : "Error";
    hasError = true;
    justCalculated = false;
  }
  render();
}

// ===== button wiring =====
// using data-action/data-value attributes instead of inline onclick="" in
// the html - keeps behaviour in one place and means no global functions
// need to exist just for the html to be able to call them
document.querySelectorAll(".btn").forEach((btn) => {
  const action = btn.dataset.action;
  const value = btn.dataset.value;

  btn.addEventListener("click", () => {
    if (action === "append") appendChar(value);
    else if (action === "clear") clearDisplay();
    else if (action === "backspace") backspace();
    else if (action === "calculate") calculate();
  });
});

// ===== keyboard support =====
document.addEventListener("keydown", (e) => {
  if (/^[0-9]$/.test(e.key)) {
    appendChar(e.key);
  } else if (e.key === ".") {
    appendChar(".");
  } else if (e.key === "+" || e.key === "-" || e.key === "*") {
    appendChar(e.key);
  } else if (e.key === "/") {
    e.preventDefault(); // some browsers bind bare "/" to a quick-find shortcut
    appendChar("/");
  } else if (e.key === "Enter" || e.key === "=") {
    e.preventDefault();
    calculate();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    backspace();
  } else if (e.key === "Escape") {
    clearDisplay();
  }
});

// ===== theme (persisted via localStorage) =====
const THEME_KEY = "calculator-theme";

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  toggleBtn.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
  );
}

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);

toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
});

render();
