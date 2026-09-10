// connects the interface to the calculator state and engine

const displayEl = document.getElementById("display");
const toggleBtn = document.getElementById("theme-toggle");

function render(state) {
  displayEl.textContent = state.expression;
  // make completed results slightly bolder
  displayEl.classList.toggle("result", state.justCalculated);
}

const inputState = InputState.createInputState({
  onChange: render,
  evaluate: CalculatorEngine.evaluate,
});

// button controls
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

// keyboard controls
document.addEventListener("keydown", (e) => {
  if (/^[0-9]$/.test(e.key)) {
    inputState.appendChar(e.key);
  } else if (e.key === ".") {
    inputState.appendChar(".");
  } else if (e.key === "+" || e.key === "-" || e.key === "*") {
    inputState.appendChar(e.key);
  } else if (e.key === "/") {
    e.preventDefault(); // prevent the browser quick-find shortcut
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

// saved theme preference
const THEME_KEY = "calculator-theme";

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
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
