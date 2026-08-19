const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const jwt = require('jsonwebtoken');
const { authMiddleware, posMiddleware } = require('../src/middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

test('auth middleware normalizes userRole to lowercase for case-variant JWT roles', () => {
  const token = jwt.sign({ id: 'user-123', role: 'Cashier' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = {
    headers: { authorization: `Bearer ${token}` },
  };
  const res = {
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userRole, 'cashier');
  assert.equal(req.userId, 'user-123');
});

test('pos middleware allows cashier JWT roles regardless of casing', () => {
  const token = jwt.sign({ id: 'cashier-1', role: 'Cashier' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = {
    headers: { authorization: `Bearer ${token}` },
  };
  const res = {
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  let nextCalled = false;

  posMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userRole, 'cashier');
  assert.equal(res.code, undefined);
});
