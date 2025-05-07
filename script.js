let display = document.getElementById("display");

function append(char) {
  if (display.textContent === "0") {
    display.textContent = char;
  } else {
    display.textContent += char;
  }
}

function clearDisplay() {
  display.textContent = "0";
}

function backspace() {
  display.textContent = display.textContent.slice(0, -1) || "0";
}

function calculate() {
  try {
    display.textContent = eval(display.textContent);
  } catch (e) {
    display.textContent = "Error";
  }
}
const toggleBtn = document.getElementById("theme-toggle");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    toggleBtn.textContent = "☀️";
  } else {
    toggleBtn.textContent = "🌙";
  }
});