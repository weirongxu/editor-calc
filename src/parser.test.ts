import {
  binaryAtomicP,
  calculate,
  constantAtomicP,
  decimalAtomicP,
  funcCallP,
  hexAtomicP,
  Node,
  unaryExprP,
} from './parser'

const fixtures: {
  description: string
  parse: (s: string) => Node
  cases: [string, string][]
  only?: boolean
}[] = [
  {
    description: 'parse decimal',
    parse: (s) => decimalAtomicP.tryParse(s),
    cases: [
      ['1', '1'],
      ['3.141592653589793', '3.141592653589793'],

      ['1.2e5', '120000'],
      ['1.2e+5', '120000'],
      ['1.2e-5', '0.000012'],

      ['1_1.2_2e5_1', decimalAtomicP.tryParse('11.22e51').result.valueOf()],
    ],
  },
  {
    description: 'parse binary',
    parse: (s) => binaryAtomicP.tryParse(s),
    cases: [
      ['0b1', '1'],
      ['0b11001101', '205'],
      ['0B11P-0', '3'],
      ['0b110101011.1111', '427.9375'],
      ['0b1_10101011.1111', '427.9375'],
      [
        '0b1.1111111111111111111111111111111111111111111111111111p+1023',
        '1.7976931348623157081e+308',
      ],
    ],
  },
  {
    description: 'parse hex',
    parse: (s) => hexAtomicP.tryParse(s),
    cases: [
      ['0x1', '1'],
      ['0xff', '255'],
      ['0XfF', '255'],
      ['0XfF_a1B', '1047067'],
      ['0X.a_1B', '0.631591796875'],
      ['0xff.f', '255.9375'],
      ['0x1.8P1', '3'],
      ['0x1.8p+1', '3'],
      ['0X1.8p-1', '0.75'],
    ],
  },
  {
    description: 'parse constant atomic',
    parse: (s) => constantAtomicP.tryParse(s),
    cases: [['PI', '3.141592653589793']],
  },
  {
    description: 'parse function call',
    parse: (s) => funcCallP.tryParse(s),
    cases: [['sin(PI/2)', '1']],
  },
  {
    description: 'parse unaryExpression',
    parse: (s) => unaryExprP.tryParse(s),
    cases: [
      ['1', '1'],
      ['+1', '1'],
      ['++1', '1'],
      ['+++1', '1'],
      ['-1', '-1'],
      ['--1', '1'],
      ['---1', '-1'],
      ['+3.141592653589793', '3.141592653589793'],
      ['-1.2e5', '-120000'],
      ['-1.2e+5', '-120000'],
      ['1.2e-5', '0.000012'],
    ],
  },
  {
    description: 'calc base',
    parse: (s) => calculate(s).ast,
    cases: [
      ['0b1 + 0b11', '4'],
      ['0x1 + 0x3', '4'],
      ['0xff + 0b1', '256'],
      
      ['1', '1'],
      ['1.321', '1.321'],
      ['( (( - 1.321e2) ))', '-132.1'],
      ['0.2+ (0.1)', '0.3'],
      ['( 0.2) + (0.1)', '0.3'],
      ['( 0.2) + ( 0.1)', '0.3'],
      ['0.1 ++0.1++ 0.1', '0.3'],
      ['0.1 +++0.1+++ 0.1', '0.3'],

      [' .3%', '0.003'],
      ['0.3%', '0.003'],
      ['1.3%', '0.013'],
      ['30%', '0.3'],
      [' .30%', '0.003'],
      ['0.30%', '0.003'],
      ['1.30%', '0.013'],

      ['0.1 * 0.2', '0.02'],
      ['0.1 *+ 0.2', '0.02'],
      ['0.2 / - 0.1', '-2'],
      ['2 ** 2', '4'],
      ['2 **- 2', '0.25'],
      ['-2 ** 2', '-4'],
      ['(-2) ** 2', '4'],
      ['4 % 3', '1'],

      ['0.1 - 0.1 - 0.1', '-0.1'],
      ['0.1 - 0.1 - + ( 0.1 )', '-0.1'],
      ['0.1 - 0.1 - - 0.1', '0.1'],
      ['(0.1 - 0.1) - 0.1', '-0.1'],
      ['0.1 - (0.1 - 0.1)', '0.1'],
      ['(0.1 - 0.1 - 0.1)', '-0.1'],
      ['- 0.1 - 0.1 - 0.1', '-0.3'],
      ['-(0.1 - 0.1 - 0.1)', '0.1'],
      ['0.1 - ((0.1 - (0.2 + 0.1)))', '0.3'],
      ['0.1 - -((0.1 - (0.2 + 0.1)))', '-0.1'],
      ['0.1 - --((0.1 - (0.2 + 0.1)))', '0.3'],
      ['0.1 - ---((0.1 - (0.2 + 0.1)))', '-0.1'],

      ['0.1 / 0.1 / 0.1', '10'],
      ['0.1 / 0.1 / + ( 0.1 )', '10'],
      ['0.1 / 0.1 / - 0.1', '-10'],
      ['(0.1 / 0.1) / 0.1', '10'],
      ['0.1 / (0.1 / 0.1)', '0.1'],
      ['(0.1 / 0.1 / 0.1)', '10'],
      ['0.1 / ((0.1 / (0.2 * 0.1)))', '0.02'],

      ['0.1 - 0.2 * 0.2', '0.06'],
      ['0.1 - 0.2 / 0.2', '-0.9'],
      ['0.1 - 0.2 % 0.2', '0.1'],
      ['(0.1 - 0.2) * 0.2', '-0.02'],
      ['(0.1 - 0.2) / 0.2', '-0.5'],
      ['(0.1 - 0.2) % 0.2', '-0.1'],

      ['1 - 0.1 * 0.1 * 0.1 * 0.1', '0.9999'],
      ['1 - 0.1 * 0.1 - 0.1 * 0.1', '0.98'],
      ['1 - 0.2 * (0.2 - 0.1) * 0.1', '0.998'],
      ['1 - 0.2 * ((0.2 - 0.1) * 0.1)', '0.998'],
      ['(1 - 0.1 * 0.1) * 0.1 * 0.1', '0.0099'],
      ['(1 - 0.1 * 0.1) - 0.1 * 0.1', '0.98'],
      ['(1 - 0.1 * 0.1 - 0.1) * 0.1', '0.089'],
      ['(1 - 0.2) * (0.2 - 0.1) * 0.1', '0.008'],
      ['(1 - 0.2 * (0.2 - 0.1)) * 0.1', '0.098'],
      ['(1 - 0.2 * ((0.2 - 0.1)) * 0.1)', '0.998'],
      ['(1 + 0.1) - (0.01 + 0.001)', '1.089'],

      ['2 * 2 ** 2', '8'],
      ['4 ** 3 ** 2', '262144'],
      ['( 4 ** 3 ) ** 2', '4096'],
    ],
  },
  {
    description: 'calc with constant',
    parse: (s) => calculate(s).ast,
    cases: [
      ['PI', '3.141592653589793'],
      ['-PI', '-3.141592653589793'],
      ['E', '2.718281828459045'],
      ['+E', '2.718281828459045'],
    ],
  },
  {
    description: 'calc with function',
    parse: (s) => calculate(s).ast,
    cases: [
      ['sin(PI/2)', '1'],
      ['-sin(PI/2)', '-1'],
      ['add(1, 2)', '3'],
      ['add(1, add(2, 1))', '4'],
      ['add(add(1, 2), add(2, 1))', '6'],
      ['add(add(1, 2), add(2, add(2, 1)))', '8'],
    ],
  },
]

fixtures.forEach((fixture) => {
  describe(fixture.description, () => {
    fixture.cases.forEach(([formula, result]) => {
      const fn = fixture.only ? test.only : test
      fn(formula, () => {
        const node = fixture.parse(formula)
        const formulaResult = node.result.valueOf()
        if (node.result.valueOf() !== result) {
          // eslint-disable-next-line no-console
          console.warn(formula)
          // eslint-disable-next-line no-console
          console.warn(node.getPrintTree().join('\n'))
        }
        expect(formulaResult).toEqual(result)
      })
    })
  })
})

describe('calc with error', () => {
  ;['***', 'unvalid'].forEach((s) => {
    test(s, () => {
      expect(() => calculate(s)).toThrow()
    })
  })
})

describe('calc with invalid text', () => {
  const fixtures: [
    formula: string,
    matchObj: {
      skip: number
      result: string
      only?: boolean
    },
  ][] = [
    [
      '   -1.9541',
      {
        skip: 3,
        result: '-1.9541',
      },
    ],
    [
      'some text  1.321',
      {
        skip: 11,
        result: '1.321',
      },
    ],
    [
      'invalid text  1.321 = ',
      {
        skip: 14,
        result: '1.321',
      },
    ],
    [
      'invalid text\t1.321=',
      {
        skip: 13,
        result: '1.321',
      },
    ],
    [
      '1+2 invalid text 1.321=',
      {
        skip: 17,
        result: '1.321',
      },
    ],
    [
      'Math.floor(4.5 * 2 =',
      {
        skip: 11,
        result: '9',
      },
    ],
    [
      'Math.floor(seconds / 2 / 1 =',
      {
        skip: 21,
        result: '2',
      },
    ],
    [
      'E 1 + 1 =',
      {
        skip: 2,
        result: '2',
      },
    ],
    [
      '1 + 1 5 + 5 =',
      {
        skip: 6,
        result: '10',
      },
    ],
    [
      '1 + 1 = 2 + 3 = 5 + 5 =',
      {
        skip: 16,
        result: '10',
      },
    ],
  ]

  fixtures.forEach(([formula, matchObj]) => {
    const fn = matchObj.only ? test.only : test
    fn(formula, () => {
      expect(calculate(formula)).toMatchObject({
        skip: matchObj.skip,
        result: matchObj.result,
      })
    })
  })
})
