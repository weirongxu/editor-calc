# coc-calc

Extend decimal.js to an editor extension, used in [coc-calc](https://github.com/weirongxu/coc-calc) and [vscode-calc](https://github.com/weirongxu/vscode-calc)

[![Build Status](https://travis-ci.com/weirongxu/editor-calc.svg?branch=master)](https://travis-ci.com/weirongxu/editor-calc)

## Usage

calculate

## Operators

Precedence is from highest to lowest.

| Operator                              | Example                                     |
|---------------------------------------|---------------------------------------------|
| exponentiation `**`                   | `4 ** 3 ** 2` equivalent to `4 ** (3 ** 2)` |
| unary `+ -`                           | `-2` `+2`                                   |
| multiply / divide / remainder `* / %` | `4 % 3` `4 * 3`                             |
| addition / subtraction                | `.2 - .1` `.1 + .2`                         |

## Mathematics Constant

* `E`
* `PI`

## Mathematics Functions

```
abs, acos, acosh, add, asin,
asinh, atan, atanh, atan2, cbrt
ceil, cos, cosh, div, exp,
floor, hypot, ln, log, log2,
log10, max, min, mod, mul,
pow, random, round, sign, sin,
sinh, sqrt, sub, tan, tanh, trunc
```

Details: http://mikemcl.github.io/decimal.js/#methods
