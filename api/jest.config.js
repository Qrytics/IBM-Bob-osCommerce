'use strict';

// LOCKED. Coverage gates: every file Bob translates must be fully covered (T11).
const BOB_FILES = [
  'general.js', 'tax.js', 'currency.js', 'cart.js', 'order.js',
  'shipping/index.js', 'shipping/flat.js', 'shipping/item.js', 'shipping/table.js',
  'orderTotals/index.js', 'orderTotals/subtotal.js', 'orderTotals/shipping.js', 'orderTotals/tax.js', 'orderTotals/total.js',
];
const FULL = { lines: 100, branches: 100, functions: 100, statements: 100 };

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageReporters: ['text-summary', 'text', 'lcov'],
  coverageThreshold: {
    global: { lines: 90, branches: 85, functions: 90, statements: 90 },
    ...Object.fromEntries(BOB_FILES.map((f) => [`./src/domain/${f}`, FULL])),
  },
};
