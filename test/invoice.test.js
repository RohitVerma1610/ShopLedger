const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, price, qty, hsn, gstRate) {
  return { name, sku, price, qty, hsn, gstRate };
}

function assertCurrentFigures(order, expected) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expected.invoice);
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    },
    expected.checkout
  );
}

test('CURRENT BEHAVIOUR: order #1001 invoice uses supplied 5% and 12% rates without a coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Rice', 'GRN-001', 640, 1, '1006', 5),
      item('Ghee', 'DRY-001', 450, 1, '0405', 12)
    ]
  };

  assertCurrentFigures(order, {
    invoice: {
      subtotal: 1090,
      discount: 0,
      tax: 86,
      cgst: 43,
      sgst: 43,
      total: 1176,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, discount: 0, taxable: 640, lineTax: 32 },
        { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, discount: 0, taxable: 450, lineTax: 54 }
      ]
    },
    checkout: { subtotal: 1090, discount: 0, tax: 86, total: 1176 }
  });
});

test('order #1002 SAVE10 invoice matches checkout discount and post-discount GST', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [item('Rice', 'GRN-001', 640, 1, '1006', 5)]
  };

  assertCurrentFigures(order, {
    invoice: {
      subtotal: 640,
      discount: 64,
      tax: 28.8,
      cgst: 14.4,
      sgst: 14.4,
      total: 604.8,
      rows: [
        { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, discount: 64, taxable: 576, lineTax: 28.8 }
      ]
    },
    checkout: { subtotal: 640, discount: 64, tax: 28.8, total: 604.8 }
  });
});

test('order #1004 SAVE10 invoice matches HSN GST and the ₹150 discount cap', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [item('Groundnut Oil', 'OIL-002', 1120, 2, '1508')]
  };

  assertCurrentFigures(order, {
    invoice: {
      subtotal: 2240,
      discount: 150,
      tax: 104.5,
      cgst: 52.25,
      sgst: 52.25,
      total: 2194.5,
      rows: [
        { name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, discount: 150, taxable: 2090, lineTax: 104.5 }
      ]
    },
    checkout: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  });
});

test('CURRENT BEHAVIOUR: order #1008 invoice and checkout use 18% on all items without a coupon', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [item('Packaged Tea', 'BEV-001', 500, 1, '0902', 18)]
  };

  assertCurrentFigures(order, {
    invoice: {
      subtotal: 500,
      discount: 0,
      tax: 90,
      cgst: 45,
      sgst: 45,
      total: 590,
      rows: [
        { name: 'Packaged Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 500, gstPercent: 18, line: 500, discount: 0, taxable: 500, lineTax: 90 }
      ]
    },
    checkout: { subtotal: 500, discount: 0, tax: 90, total: 590 }
  });
});

test('invoice matches checkout for HSN slabs and applies coupon discount before GST', function () {
  const order = {
    id: 1100,
    coupon: 'SAVE10',
    items: [
      item('Rice', 'GRN-001', 1000, 1, '1006'),
      item('Ghee', 'DRY-001', 1000, 1, '0405')
    ]
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(checkoutFigures, {
    subtotal: 2000,
    discount: 150,
    taxable: 1850,
    tax: 157.25,
    cgst: 78.63,
    sgst: 78.62,
    total: 2007.25,
    lines: [
      { id: undefined, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 1000, discount: 75, taxable: 925, tax: 46.25, net: 971.25 },
      { id: undefined, name: 'Ghee', hsn: '0405', gstPercent: 12, gross: 1000, discount: 75, taxable: 925, tax: 111, net: 1036 }
    ]
  });
  assert.deepEqual(invoiceFigures, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, discount: 75, taxable: 925, lineTax: 46.25 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', qty: 1, price: 1000, gstPercent: 12, line: 1000, discount: 75, taxable: 925, lineTax: 111 }
    ]
  });
});
