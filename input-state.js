// manages calculator input without depending on the dom
(function () {

  function createInputState({ onChange, evaluate } = {}) {
    let expression = "0";
    let justCalculated = false;
    let hasError = false;

    function notify() {
      if (onChange) onChange({ expression, justCalculated, hasError });
    }

    function isOperator(ch) {
      return ch === "+" || ch === "-" || ch === "*" || ch === "/";
    }

    // get the number currently being typed
    function currentSegment() {
      let lastOpIndex = -1;
      for (let i = 0; i < expression.length; i++) {
        if (isOperator(expression[i]) && i !== 0) lastOpIndex = i;
      }
      return expression.slice(lastOpIndex + 1);
    }

    function appendChar(char) {
      if (hasError) {
        expression = "0";
        hasError = false;
        notify();
      } else if (justCalculated) {
        if (isOperator(char)) {
          justCalculated = false;
        } else {
          expression = "";
          justCalculated = false;
        }
      }

      if (/[0-9]/.test(char)) {
        expression = expression === "0" ? char : expression + char;
        notify();
        return;
      }

      if (char === ".") {
        if (currentSegment().includes(".")) return;
        expression = expression === "" || expression === "0" ? "0." : expression + ".";
        notify();
        return;
      }

      if (isOperator(char)) {
        if (expression === "" || expression === "0") {
          if (char === "-") {
            expression = "-";
            notify();
          }
          return;
        }

        const last = expression[expression.length - 1];
        if (isOperator(last)) {
          const previous = expression[expression.length - 2];

          // replace both operators after a trailing unary minus
          if (last === "-" && isOperator(previous)) {
            expression = expression.slice(0, -2) + char;
          } else if (char === "-" && last !== "-") {
            expression += char;
          } else {
            expression = expression.slice(0, -1) + char;
          }

          notify();
          return;
        }

        expression += char;
        notify();
        return;
      }
    }

    function clear() {
      expression = "0";
      justCalculated = false;
      hasError = false;
      notify();
    }

    function backspace() {
      if (hasError) {
        clear();
        return;
      }
      expression = expression.slice(0, -1) || "0";
      notify();
    }

    function calculate() {
      try {
        const result = evaluate(expression);
        expression = String(result);
        justCalculated = true;
        hasError = false;
      } catch (err) {
        expression = err && err.name === "DivisionByZeroError" ? "Cannot divide by zero" : "Error";
        hasError = true;
        justCalculated = false;
      }
      notify();
    }

    function getState() {
      return { expression, justCalculated, hasError };
    }

    return { appendChar, clear, backspace, calculate, getState };
  }

  const InputStateExports = { createInputState };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = InputStateExports;
  } else {
    window.InputState = InputStateExports;
  }

})();
