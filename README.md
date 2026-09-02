# cute calculator

a pastel calculator built with vanilla HTML, CSS and JavaScript.

[live demo](https://bokanigumbo.github.io/Calculator-App/)

## features

* basic arithmetic with correct operator precedence
* support for negative numbers, decimals and chained calculations
* keyboard controls
* light and dark themes saved between visits
* clear errors for invalid expressions and division by zero
* responsive design

## how it works

the original calculator used `eval()` to process calculations. i replaced it with a small tokenizer and recursive-descent parser that only accepts numbers and the four supported operators.

the calculation engine is kept separate from the interface, which makes the logic easier to test and maintain.

## run locally

download or clone the repository, then open `index.html` in your browser.

## tests

run the test suite with:

```bash
npm test
```

43 tests cover the calculation engine and input behaviour, including arithmetic, operator precedence, invalid expressions, division by zero and numeric overflow.

## limitations

* no parentheses
* no memory functions
* browser interactions are tested manually

## licence

MIT — see [LICENSE](LICENSE).
