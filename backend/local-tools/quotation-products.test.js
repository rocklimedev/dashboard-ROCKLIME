const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quotationProducts } = require('../lib/quotationProducts');
const QuotationItem = require('../modules/quotations/models/quotation-item.model');
const QuotationVersion = require('../modules/quotations/models/quotation-version.model');

const products = [
  {
    productId: 'shared',
    quantity: 2,
    price: 100,
    locations: [
      {
        shareId: 'a',
        floorId: 'floor',
        roomId: 'master',
        roomName: 'Master',
        assignedQuantity: 1,
        priority: 0,
      },
      {
        shareId: 'b',
        floorId: 'floor',
        roomId: 'parents',
        roomName: 'Parents',
        assignedQuantity: 1,
        priority: 1,
      },
    ],
  },
];

test('PDF products use complete SQL shares rather than lossy legacy Mongo items', () => {
  const legacy = [{ productId: 'shared', quantity: 2, roomId: 'master' }];
  for (const value of [
    products,
    JSON.stringify(products),
    JSON.stringify(JSON.stringify(products)),
  ]) {
    assert.deepEqual(quotationProducts(value, legacy), products);
  }
  assert.deepEqual(quotationProducts([], legacy), []);
  assert.equal(quotationProducts(null, legacy), legacy);
  assert.equal(quotationProducts('invalid', legacy), legacy);
});

test('current and historical Mongo schemas retain room shares when saved', () => {
  const current = new QuotationItem({ quotationId: 'q', items: products }).toObject();
  const version = new QuotationVersion({ quotationId: 'q', quotationItems: products }).toObject();
  assert.deepEqual(current.items[0].locations, products[0].locations);
  assert.deepEqual(version.quotationItems[0].locations, products[0].locations);
});
