// input-state.js
//
// the calculator's display-state logic (what happens to the expression
// string as each key is pressed) extracted out of script.js, so it can be
// tested directly without a browser or a DOM. this was flagged during
// review as worth doing "eventually" rather than relying only on manual
// testing forever - this is that.
//
// no document/window/render() calls in here at all - a caller provides an
// onChange callback if it wants to know when something changed (script.js
// uses this to actually update the screen), but this module itself has no
// opinion about how or whether the result gets displayed anywhere.
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

    // the number segment currently being typed - everything after the
    // last operator (or the whole expression, if there isn't one yet).
    // used to stop a second decimal point being added to the SAME number.
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

          // the trailing "-" might itself be a unary minus sitting right
          // after ANOTHER operator (e.g. "5*-" from 5, *, -). replacing
          // just that trailing "-" with a new operator would leave the
          // earlier operator behind unchanged, producing something like
          // "5**" - both the unary minus and the operator before it need
          // to go together in that case, not just the last character.
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
