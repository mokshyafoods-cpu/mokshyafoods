const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');

const { normalizeOrderIdCandidates } = require('../src/controllers/paymentLedger');

test('normalizes order identifiers to the same canonical value', () => {
  assert.deepEqual(normalizeOrderIdCandidates('507f1f77bcf86cd799439011'), ['507f1f77bcf86cd799439011']);
  assert.deepEqual(normalizeOrderIdCandidates('ObjectId("507f1f77bcf86cd799439011")'), ['507f1f77bcf86cd799439011']);
  assert.deepEqual(normalizeOrderIdCandidates(' 507f1f77bcf86cd799439011 '), ['507f1f77bcf86cd799439011']);
  assert.deepEqual(normalizeOrderIdCandidates('ObjectId("507f1f77bcf86cd799439011")').includes('507f1f77bcf86cd799439011'), true);
});
