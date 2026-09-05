// script.js - wires the calculator UI up to input-state.js and
// calculator-engine.js (both must be loaded first - see index.html)
//
// this file is now JUST wiring: dom lookups, event listeners, and reading
// InputState's current value to paint it onto the screen. the actual
// display-state logic (what happens to the expression as each key is
// pressed) lives in input-state.js, which has no DOM dependency at all -
// that's what makes it possible to test that logic directly (see
// tests/input-state.test.js), including the exact "5*-*" bug this
// extraction was originally done to make testable in the first place.

const displayEl = document.getElementById("display");
const toggleBtn = document.getElementById("theme-toggle");

function render(state) {
  displayEl.textContent = state.expression;
  // purely presentational: input-state.js already tracks justCalculated
  // as part of its state - reading it here to render a completed result
  // slightly bolder than live-typed input adds no new state and changes
  // no calculator behaviour at all
  displayEl.classList.toggle("result", state.justCalculated);
}

const inputState = InputState.createInputState({
  onChange: render,
  evaluate: CalculatorEngine.evaluate,
});

// ===== button wiring =====
// using data-action/data-value attributes instead of inline onclick="" in
// the html - keeps behaviour in one place and means no global functions
// need to exist just for the html to be able to call them
document.querySelectorAll(".btn").forEach((btn) => {
  const action = btn.dataset.action;
  const value = btn.dataset.value;

  btn.addEventListener("click", () => {
    if (action === "append") inputState.appendChar(value);
    else if (action === "clear") inputState.clear();
    else if (action === "backspace") inputState.backspace();
    else if (action === "calculate") inputState.calculate();
  });
});

// ===== keyboard support =====
document.addEventListener("keydown", (e) => {
  if (/^[0-9]$/.test(e.key)) {
    inputState.appendChar(e.key);
  } else if (e.key === ".") {
    inputState.appendChar(".");
  } else if (e.key === "+" || e.key === "-" || e.key === "*") {
    inputState.appendChar(e.key);
  } else if (e.key === "/") {
    e.preventDefault(); // some browsers bind bare "/" to a quick-find shortcut
    inputState.appendChar("/");
  } else if (e.key === "Enter" || e.key === "=") {
    e.preventDefault();
    inputState.calculate();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    inputState.backspace();
  } else if (e.key === "Escape") {
    inputState.clear();
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

render(inputState.getState());
