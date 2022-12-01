# editor-calc

Extend decimal.js to an editor extension, used in [coc-calc](https://github.com/weirongxu/coc-calc) and [vscode-calc](https://github.com/weirongxu/vscode-calc)

[![Build Status](https://img.shields.io/github/workflow/status/weirongxu/editor-calc/ci)](https://github.com/weirongxu/editor-calc/actions)

## Usage

```javascript
import { calculate, parse } from 'editor-calc';

const result = calculate('sin(PI/2)');
// result === {
//   skip: 0,
//   result: '1',
// }

const result = calculate('1 + 1 = 2 + 3 = 5 + 5 =');
// result === {
//   skip: 16,
//   result: '10'
// }

parse('sin(PI/2) + --- add(1, 2)').getPrintTree().join('\n');
// BinaryExpr -> sin(PI/2)+---add(1,2) => -2.00000
//   FuncCall -> sin(PI/2) => 1.00000
//     BinaryExpr -> PI/2 => 1.57080
//       ConstantAtomic -> PI => 3.14159
//       Operator -> /
//       DecimalAtomic -> 2 => 2.00000
//   Operator -> +
//   Unary -> ---add(1,2) => -3.00000
//     Operator -> ---
//     FuncCall -> add(1,2) => 3.00000
//       DecimalAtomic -> 1 => 1.00000
//       DecimalAtomic -> 2 => 2.00000
```

## Operators

Precedence is from highest to lowest.

| Operator                              | Example                                     |
| ------------------------------------- | ------------------------------------------- |
| exponentiation `**`                   | `4 ** 3 ** 2` equivalent to `4 ** (3 ** 2)` |
| unary `+ -`                           | `-2` `+2`                                   |
| multiply / divide / remainder `* / %` | `4 % 3` `4 * 3`                             |
| addition / subtraction                | `.2 - .1` `.1 + .2`                         |

## Mathematics Constant

- `E`
- `PI`

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
