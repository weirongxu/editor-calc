import P from 'parsimmon';
import { Decimal as DecimalLib } from 'decimal.js';

export const binaryExponentOptSyms = ['**'] as const;
export type BinaryExponentOptSym = typeof binaryExponentOptSyms[number];

export const binaryMulOptSyms = ['%', '*', '/'] as const;
export type BinaryMulOptSym = typeof binaryMulOptSyms[number];

export const binaryAddOptSyms = ['+', '-'] as const;
export type BinaryAddOptSym = typeof binaryAddOptSyms[number];

export type BinaryOptSym =
  | BinaryExponentOptSym
  | BinaryMulOptSym
  | BinaryAddOptSym;
export const binaryOptSyms = [
  ...binaryExponentOptSyms,
  ...binaryMulOptSyms,
  ...binaryAddOptSyms,
];

export const unaryOptSyms = ['+', '-'] as const;
export type UnaryOptSym = typeof unaryOptSyms[number];

export const constSyms = [
  'E',
  'LN2',
  'LN10',
  'LOG2E',
  'LOG10E',
  'PI',
  'SQRT1_2',
  'SQRT2',
] as const;
export type ConstSym = typeof constSyms[number];

export const funcNameSyms = [
  'abs',
  'acos',
  'acosh',
  'add',
  'asin',
  'asinh',
  'atan',
  'atanh',
  'atan2',
  'cbrt',
  'ceil',
  'cos',
  'cosh',
  'div',
  'exp',
  'floor',
  'hypot',
  'ln',
  'log',
  'log2',
  'log10',
  'max',
  'min',
  'mod',
  'mul',
  'pow',
  'random',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'sub',
  'tan',
  'tanh',
  'trunc',
] as const;
export type FuncNameSym = typeof funcNameSyms[number];

export abstract class Node {
  type: string;
  children?: (Node | string)[];
  abstract raw: string;
  abstract result: DecimalLib;

  constructor() {
    this.type = this.constructor.name;
  }

  private getPrintLine(
    indent: string,
    type: string,
    raw?: string,
    result?: DecimalLib,
  ) {
    let line = `${indent}${type}`;
    if (raw !== undefined) {
      line += ` -> ${raw}`;
    }
    if (result !== undefined) {
      line += ` => ${result.toFixed(5)}`;
    }
    return line;
  }

  getPrintTree({ indent = '', printRaw = true, printResult = true } = {}) {
    const lines: string[] = [
      this.getPrintLine(
        indent,
        this.type,
        printRaw ? this.raw : undefined,
        printResult ? this.result : undefined,
      ),
    ];
    if (this.children) {
      for (let i = 0, len = this.children.length; i < len; i++) {
        const child = this.children[i];
        if (typeof child === 'string') {
          lines.push(
            this.getPrintLine(
              indent + '  ',
              'Operator',
              printRaw ? child : undefined,
            ),
          );
        } else {
          lines.push(
            ...child.getPrintTree({
              indent: indent + '  ',
              printRaw,
              printResult,
            }),
          );
        }
      }
    }
    return lines;
  }
}

export class DecimalAtomic extends Node {
  get result() {
    if (this.source instanceof DecimalLib) {
      return this.source;
    } else {
      if (this.source.endsWith('%')) {
        const source = this.source.slice(0, -1);
        const decimal = new DecimalLib(source.replace(/_/g, ''));
        return decimal.div(100);
      }

      return new DecimalLib(this.source.replace(/_/g, ''));
    }
  }

  get raw() {
    if (this.source instanceof DecimalLib) {
      return this.source.valueOf();
    } else {
      return this.source;
    }
  }

  constructor(source: string);
  constructor(source: DecimalLib);
  constructor(public source: string | DecimalLib) {
    super();
  }
}

export class ConstantAtomic extends Node {
  constSym: ConstSym;

  constructor(public raw: string) {
    super();
    if (!constSyms.includes(this.raw as ConstSym)) {
      throw new Error(`Constant ${this.raw} not exists`);
    }
    this.constSym = this.raw as ConstSym;
  }

  get result() {
    return new DecimalLib(Math[this.constSym]);
  }
}

export class FuncCall extends Node {
  funcNameSym: FuncNameSym;

  constructor(public rawFuncName: string, public args: Node[]) {
    super();
    if (!funcNameSyms.includes(this.rawFuncName as FuncNameSym)) {
      throw new Error(`Function ${this.rawFuncName} not exists`);
    }
    this.funcNameSym = this.rawFuncName as FuncNameSym;
    this.children = args;
  }

  get raw() {
    return `${this.funcNameSym}(${this.args.map((a) => a.raw).join(',')})`;
  }

  get result() {
    const args = this.args.map((a) => a.result);
    // @ts-ignore
    return DecimalLib[this.funcNameSym](...args);
  }
}

export class Unary<T extends Node = Node> extends Node {
  constructor(public operators: UnaryOptSym[], public node: T) {
    super();
    this.children = [this.operators.join(''), node];
  }

  get raw() {
    return `${this.operators.join('')}${this.node.raw}`;
  }

  private get operator(): UnaryOptSym {
    return this.operators.filter((o) => o === '-').length % 2 === 1 ? '-' : '+';
  }

  get result() {
    return this.operator === '+'
      ? this.node.result
      : new DecimalLib(0).sub(this.node.result);
  }
}

export class Parentheses<T extends Node = Node> extends Node {
  constructor(public node: T) {
    super();
    this.children = [node];
  }

  get raw() {
    return `(${this.node.raw})`;
  }

  get result() {
    return this.node.result;
  }
}

export class BinaryExpr extends Node {
  constructor(public first: Node, public rest: [BinaryOptSym, Node][]) {
    super();
    this.children = [
      first,
      ...rest.reduce((ret, [opt, expr]) => {
        ret.push(opt, expr);
        return ret;
      }, [] as (Node | string)[]),
    ];
  }

  get raw() {
    let s: string = this.first.raw;
    this.rest.forEach(([op, node]) => {
      s += op + node.raw;
    });
    return s;
  }

  private calculate(left: Node, operator: BinaryOptSym, right: Node): Node {
    const decimal = {
      '+': () => left.result.add(right.result),
      '-': () => left.result.minus(right.result),
      '*': () => left.result.mul(right.result),
      '/': () => left.result.div(right.result),
      '%': () => left.result.modulo(right.result),
      '**': () => {
        if (left instanceof Unary) {
          return new Unary(
            left.operators,
            new DecimalAtomic(left.node.result.pow(right.result)),
          ).result;
        } else {
          return left.result.pow(right.result);
        }
      },
    }[operator]();
    return new DecimalAtomic(decimal);
  }

  get result() {
    const rest = [...this.rest];
    const nodeStack: Node[] = [];
    const optStack: BinaryOptSym[] = [];
    nodeStack.push(this.first);
    const getOptStackTop = () => optStack[optStack.length - 1];
    const popArithmeticCalc = (opts: readonly BinaryOptSym[]) => {
      const _nodeStack: Node[] = [];
      const _optStack: BinaryOptSym[] = [];
      while (optStack.length && opts.includes(getOptStackTop())) {
        if (_nodeStack.length === 0) {
          _nodeStack.push(nodeStack.pop()!);
        }
        _optStack.push(optStack.pop()!);
        _nodeStack.push(nodeStack.pop()!);
      }
      if (_nodeStack.length > 0) {
        let left = _nodeStack.pop()!;
        while (_optStack.length > 0) {
          const op = _optStack.pop()!;
          const right = _nodeStack.pop()!;
          left = this.calculate(left, op, right);
        }
        nodeStack.push(left);
      }
    };
    const popExponentCalc = () => {
      while (
        optStack.length &&
        binaryExponentOptSyms.includes(getOptStackTop() as BinaryExponentOptSym)
      ) {
        const op = optStack.pop()!;
        const right = nodeStack.pop()!;
        const left = nodeStack.pop()!;
        nodeStack.push(this.calculate(left, op, right));
      }
    };
    while (rest.length > 0) {
      const [op, expr] = rest.shift()!;
      if (binaryExponentOptSyms.includes(op as BinaryExponentOptSym)) {
        optStack.push(op);
        nodeStack.push(expr);
      } else if (binaryMulOptSyms.includes(op as BinaryMulOptSym)) {
        popExponentCalc();
        optStack.push(op);
        nodeStack.push(expr);
      } else if (binaryAddOptSyms.includes(op as BinaryAddOptSym)) {
        popExponentCalc();
        popArithmeticCalc(binaryMulOptSyms);
        optStack.push(op);
        nodeStack.push(expr);
      }
    }
    popExponentCalc();
    popArithmeticCalc(binaryMulOptSyms);
    popArithmeticCalc(binaryAddOptSyms);
    return nodeStack.pop()!.result;
  }
}

export type Parser<T> = P.Parser<T>;

export type NodeParser = Parser<Node>;

export const whitespaceP = P.optWhitespace;

const _ = whitespaceP;

export const leftParenthesisP = P.string('(').trim(_);
export const rightParenthesisP = P.string(')').trim(_);

export const ofStringArrayP = <T extends string = string>(
  ...strs: string[]
): Parser<T> => P.alt(...strs.map((s) => P.string(s))) as Parser<T>;

/**
 * unaryOpt -> +
 * unaryOpt -> -
 */
export const unaryOptP = ofStringArrayP<UnaryOptSym>(...unaryOptSyms)
  .trim(_)
  .desc('unaryOperator');

/**
 * parentheses -> (expr)
 */
export const parenthesesP = <T extends Node = Node>(
  parser: Parser<T>,
): Parser<Unary<Parentheses<T>> | Parentheses<T>> =>
  parser
    .wrap(leftParenthesisP, rightParenthesisP)
    .map((node) => new Parentheses(node));

/**
 * decimal -> 11_111.11e11
 */
export const decimalAtomicP = P.regexp(
  /(\d[\d_]*(\.\d[\d_]*)?|(\.\d[\d_]*))%?(e[-+]?\d[\d_]*)?/,
)
  .map((str) => new DecimalAtomic(str))
  .desc('decimal');

export const includesP = (ss: readonly string[]) =>
  P.alt(...ss.map((s) => P.string(s)));

/**
 * constant -> PI
 */
export const constantAtomicP = includesP(constSyms)
  .map((str) => new ConstantAtomic(str))
  .desc('constant');

/**
 * funcName -> sin
 */
export const funcNameP = includesP(funcNameSyms).desc('functionName');

/**
 * funcCall -> funcName({expr,}*)
 */
export const funcCallP = P.lazy(() =>
  P.seq(
    funcNameP,
    P.sepBy(exprP, P.string(',').trim(_)).wrap(
      leftParenthesisP,
      rightParenthesisP,
    ),
  ).map(([name, args]) => new FuncCall(name, args)),
).desc('functionCall');

type UnaryNode = FuncCall | ConstantAtomic | DecimalAtomic;

type UnaryExpr = Unary<Parentheses<Expr>> | Unary<UnaryNode> | UnaryNode;

/**
 * unaryExpr -> unaryOpt* unaryExpr
 * unaryExpr -> (expr)
 * unaryExpr -> functionCall
 * unaryExpr -> constant
 * unaryExpr -> decimal
 */
export const unaryExprP = P.lazy(() =>
  P.seq(
    unaryOptP.many(),
    P.alt(parenthesesP(exprP), funcCallP, constantAtomicP, decimalAtomicP),
  ).map(([unaryOperators, node]) =>
    unaryOperators.length ? new Unary(unaryOperators, node) : node,
  ),
).desc('unaryExpression');

/**
 * binaryOpt -> +
 * binaryOpt -> -
 * binaryOpt -> *
 * binaryOpt -> /
 * binaryOpt -> %
 * binaryOpt -> **
 */
export const binaryOptP = ofStringArrayP<BinaryOptSym>(...binaryOptSyms)
  .trim(_)
  .desc('binaryOperator');

/**
 * binaryExpr -> unaryExpr binaryOpt binaryExpr
 * binaryExpr -> unaryExpr binaryOpt unaryExpr
 */
export const binaryExprP: Parser<BinaryExpr> = P.lazy(() =>
  P.alt(
    P.seq(unaryExprP, binaryOptP, binaryExprP).map(
      ([firstExpr, opt, restBinaryExpr]) =>
        new BinaryExpr(firstExpr, [
          [opt, restBinaryExpr.first],
          ...restBinaryExpr.rest,
        ]),
    ),
    P.seq(unaryExprP, binaryOptP, unaryExprP).map(
      ([first, opt, restBinaryExpr]) =>
        new BinaryExpr(first, [[opt, restBinaryExpr]]),
    ),
  ),
).desc('binaryExpression');

export type Expr = BinaryExpr | UnaryExpr;

/**
 * expr -> binaryExpr
 * expr -> unaryExpr
 */
export const exprP: Parser<Expr> = P.alt(binaryExprP, unaryExprP)
  .trim(_)
  .desc('expression');

export const skipEqualSignP = P.string('=').trim(_).times(0, 1);

export const mainP = exprP.skip(skipEqualSignP).desc('main');

export const parse = (text: string) => mainP.tryParse(text);

const skipEqual = (text: string) => {
  const lastIndex = text.lastIndexOf('=');
  return lastIndex === -1 ? 0 : lastIndex + 1;
};

const skipWord = (text: string) => {
  const index = text.search(/\W/);
  return index === -1 ? text.length : index + 1;
};

export interface CalculateResult {
  skip: number;
  ast: Node;
  decimal: DecimalLib;
  result: string;
}

const calculateRecursion = (
  text: string,
  skipped: number,
  skippedRecords: number[] = [],
  originText: string,
): CalculateResult => {
  try {
    const ast = parse(text);
    return {
      skip: skipped,
      ast,
      decimal: ast.result,
      result: ast.result.valueOf(),
    };
  } catch (err) {
    if (err.type === 'ParsimmonError') {
      if (text.length > 0) {
        const skip = skipWord(text);
        const newSkip = skipped + skip;
        return calculateRecursion(
          text.slice(skip),
          newSkip,
          [...skippedRecords, newSkip],
          originText,
        );
      }
    }

    const highlightSkipRecords = Array.from(Array(originText.length))
      .map((_, index) => (skippedRecords.includes(index) ? '^' : ' '))
      .join('');
    throw new Error(
      ['CalculateError:', originText, highlightSkipRecords, err.stack].join(
        '\r\n',
      ),
    );
  }
};

export const calculate = (text: string): CalculateResult => {
  const textTrim = text.replace(/[=\s]*$/g, '');
  const skip = skipEqual(textTrim);
  return calculateRecursion(textTrim.slice(skip), skip, [], text);
};
