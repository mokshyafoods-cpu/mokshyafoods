const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { getEffectiveProductPrice } = require('../src/utils/pricing');

test('uses the sale discount only while the sale window is active', () => {
  const now = new Date();
  const activeSale = {
    price: 100,
    discountPrice: 80,
    onSale: true,
    saleStart: new Date(now.getTime() - 60_000),
    saleEnd: new Date(now.getTime() + 60_000),
  };

  const expiredSale = {
    price: 100,
    discountPrice: 80,
    onSale: true,
    saleStart: new Date(now.getTime() - 10 * 60_000),
    saleEnd: new Date(now.getTime() - 60_000),
  };

  const noSaleFlag = {
    price: 100,
    discountPrice: 80,
    onSale: false,
  };

  assert.equal(getEffectiveProductPrice(activeSale), 80);
  assert.equal(getEffectiveProductPrice(expiredSale), 100);
  assert.equal(getEffectiveProductPrice(noSaleFlag), 100);
});
