'use strict';

// LOCKED. Lint rules, including guardrails for the translated domain code.
const js = require('@eslint/js');
const globals = require('globals');

const BOB_DOMAIN_FILES = [
  'src/domain/general.js', 'src/domain/tax.js', 'src/domain/currency.js', 'src/domain/cart.js', 'src/domain/order.js',
  'src/domain/shipping/**/*.js', 'src/domain/orderTotals/**/*.js',
];

const FORBIDDEN_REQUIRE = '^(node:)?(fs|path|http|https|net|child_process|vm|worker_threads|os)$|^express$|\\.json$|fixtures|golden|verify|catalogRepo|\\Whttp\\W|\\Wdata\\W';

const PURE = [
  { selector: `CallExpression[callee.name='require'][arguments.0.value=/${FORBIDDEN_REQUIRE}/]`, message: 'Domain code must stay pure: no I/O, HTTP, JSON or fixture imports.' },
  { selector: "MemberExpression[object.name='process']", message: 'Domain code must not read process state (env, argv, ...).' },
  { selector: "CallExpression[callee.name='eval'], NewExpression[callee.name='Function']", message: 'No dynamic code.' },
];

const NO_ANSWER_TABLES = [
  { selector: 'ArrayExpression[elements.length>8]', message: 'Large literal arrays look like hard-coded answers. Compute results from the inputs.' },
  { selector: 'ObjectExpression[properties.length>10]', message: 'Large literal objects look like hard-coded answers. Compute results from the inputs.' },
  { selector: 'Literal[raw=/^[\'"]?-?\\d+\\.\\d{5,}/]', message: 'Suspicious high-precision numeric literal. Compute it instead.' },
];

module.exports = [
  { ignores: ['coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
    },
  },
  { files: ['test/**/*.js'], languageOptions: { globals: { ...globals.jest } } },
  { files: ['scripts/**/*.js', 'src/server.js'], rules: { 'no-console': 'off' } },
  { files: ['public/**/*.js'], languageOptions: { sourceType: 'script', globals: { ...globals.browser } } },
  // The domain layer is pure: no I/O, no environment sniffing.
  { files: ['src/domain/**/*.js'], rules: { 'no-restricted-syntax': ['error', ...PURE] } },
  // ...and the translated files may not smuggle in answer tables.
  { files: BOB_DOMAIN_FILES, rules: { 'no-restricted-syntax': ['error', ...PURE, ...NO_ANSWER_TABLES], complexity: ['warn', 20] } },
];
