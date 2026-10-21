// End-to-end check of the stock engine against a running local backend.
//   node local-tools/stock-check.js
// Creates its own test orders / PO / count (labelled "STOCK CHECK"), walks
// through every stock event and verifies On hand / Reserved / Incoming after
// each one, then checks the books balance for every product.
const BASE = process.env.API || 'http://localhost:5050/api';
const ADMIN = {
  email: process.env.LOCAL_ADMIN_EMAIL || 'admin@cmtrading.local',
  password: process.env.LOCAL_ADMIN_PASSWORD || 'Admin@12345',
};

let token;
let failed = 0;
const check = (ok, label, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  → ' + extra : ''}`);
  if (!ok) failed++;
};
const call = async (method, path, body) => {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
};
const totals = async (productId) => (await call('GET', `/stock/products/${productId}`)).data.totals;
const orderLine = async (orderId, productId) =>
  (await call('GET', `/stock/orders/${orderId}`)).data.lines.find(
    (l) => l.productId === productId,
  ) || {};

(async () => {
  token = (await call('POST', '/auth/login', ADMIN)).data?.accessToken;
  if (!token) {
    token = (
      await (
        await fetch(BASE + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ADMIN),
        })
      ).json()
    ).accessToken;
  }
  check(!!token, 'admin logs in');
  const me = (await call('GET', '/user/me')).data.user;

  const products = (await call('GET', '/stock/overview?limit=200')).data.data;
  const p = products.filter((x) => x.onHand > 0).sort((a, b) => b.available - a.available)[0];
  check(!!p, 'a product with stock exists', p?.name);
  const P = p.productId;
  const customer = ((await call('GET', '/customers?limit=1')).data.data || [])[0];
  const vendor = ((await call('GET', '/vendors')).data.vendors ||
    (await call('GET', '/vendors')).data.data ||
    (await call('GET', '/vendors')).data ||
    [])[0];

  const t0 = await totals(P);
  console.log(
    `      start: on hand ${t0.onHand}, reserved ${t0.reserved}, available ${t0.available}, incoming ${t0.incoming}`,
  );

  const newOrder = async (qty, status) => {
    const r = await call('POST', '/order/create', {
      createdFor: customer.customerId,
      createdBy: me.userId,
      status,
      dueDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
      description: 'STOCK CHECK',
      products: [{ productId: P, name: p.name, quantity: qty, price: 100 }],
      assignedUserId: me.userId,
    });
    if (r.status !== 201)
      console.log('      create order failed:', r.status, JSON.stringify(r.data).slice(0, 200));
    return r.data;
  };
  const setStatus = (id, status) => call('PUT', '/order/update-status', { id, status });

  // 1-3. Draft reserves nothing; confirming reserves
  const o1 = await newOrder(2, 'DRAFT');
  let t = await totals(P);
  check(
    o1.id && t.reserved === t0.reserved && t.onHand === t0.onHand,
    'draft order reserves nothing',
    `reserved ${t.reserved}`,
  );
  await setStatus(o1.id, 'PREPARING');
  t = await totals(P);
  check(
    t.reserved === t0.reserved + 2 && t.onHand === t0.onHand,
    'confirming reserves 2, on hand unchanged',
    `reserved ${t.reserved}, on hand ${t.onHand}`,
  );

  // 4. Order larger than available -> backorder
  const avail = t.available;
  const o2 = await newOrder(avail + 5, 'PREPARING');
  let l2 = await orderLine(o2.id, P);
  t = await totals(P);
  check(
    l2.reserved === avail && l2.backordered === 5 && t.available === 0,
    'order beyond stock reserves all available, rest backordered',
    `reserved ${l2.reserved}, backordered ${l2.backordered}`,
  );

  // 5. Stock added -> backorder fills
  const adj = await call('POST', '/stock/adjust', {
    productId: P,
    change: 5,
    reason: 'STOCK CHECK found pieces',
  });
  l2 = await orderLine(o2.id, P);
  check(
    adj.status === 201 && l2.backordered === 0 && l2.reserved === avail + 5,
    'added stock fills the backorder automatically',
    `reserved ${l2.reserved}`,
  );
  const adjNoReason = await call('POST', '/stock/adjust', { productId: P, change: 1 });
  check(
    adjNoReason.status === 400,
    'adjustment without a reason is refused',
    String(adjNoReason.status),
  );
  const removeReserved = await call('POST', '/stock/adjust', {
    productId: P,
    change: -1,
    reason: 'STOCK CHECK try to remove reserved',
  });
  check(
    removeReserved.status === 409,
    'cannot remove stock that is reserved for orders',
    String(removeReserved.status),
  );

  // 6. Cancel releases, on hand unchanged
  t = await totals(P);
  await setStatus(o2.id, 'CANCELED');
  const t2 = await totals(P);
  check(
    t2.reserved === t.reserved - (avail + 5) && t2.onHand === t.onHand,
    'cancel releases the reservation, on hand unchanged',
    `reserved ${t2.reserved}`,
  );

  // 7. Manual 'dispatched' status without a dispatch is refused
  const manual = await setStatus(o1.id, 'DISPATCHED');
  check(manual.status === 400, 'cannot mark dispatched without dispatching', String(manual.status));

  // 8. Part dispatch takes stock out of on hand and the reservation
  t = await totals(P);
  const d1 = await call('POST', `/order/${o1.id}/dispatch`, {
    items: [{ productId: P, quantity: 1 }],
    invoiceLink: 'https://example.test/inv.pdf',
    gatePassLink: 'https://example.test/gp.pdf',
  });
  let t3 = await totals(P);
  let l1 = await orderLine(o1.id, P);
  check(
    d1.status < 300 &&
      t3.onHand === t.onHand - 1 &&
      t3.reserved === t.reserved - 1 &&
      l1.dispatched === 1 &&
      l1.reserved === 1,
    'part dispatch: on hand -1, reserved -1',
    `status ${d1.status} ${typeof d1.data === 'object' ? d1.data.message || '' : ''}`,
  );

  // 9. Dispatch the rest -> order DISPATCHED, nothing reserved
  const d2 = await call('POST', `/order/${o1.id}/dispatch`, {
    items: [{ productId: P, quantity: 1 }],
    invoiceLink: 'https://example.test/inv2.pdf',
    gatePassLink: 'https://example.test/gp2.pdf',
  });
  l1 = await orderLine(o1.id, P);
  check(
    d2.status < 300 && l1.dispatched === 2 && l1.reserved === 0,
    'full dispatch leaves nothing reserved',
  );
  const st = (await call('GET', `/order/${o1.id}`)).data.order?.status;
  check(st === 'DISPATCHED', 'order status becomes DISPATCHED', st);

  // 10. Delivered then return 1 via credit note
  await setStatus(o1.id, 'DELIVERED');
  t = await totals(P);
  // the credit-note form always uploads the signed note, so send a tiny PDF with it
  const form = new FormData();
  form.append('items', JSON.stringify([{ productId: P, quantity: 1 }]));
  form.append('reason', 'STOCK CHECK return');
  form.append('creditNoteNumber', `CN-CHECK-${Date.now()}`);
  form.append(
    'file',
    new Blob(['%PDF-1.4\n%%EOF\n'], { type: 'application/pdf' }),
    'credit-note.pdf',
  );
  const cnRes = await fetch(`${BASE}/order/${o1.id}/credit-note`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const cn = { status: cnRes.status, data: await cnRes.json().catch(() => ({})) };
  t3 = await totals(P);
  check(
    cn.status < 300 && t3.onHand === t.onHand + 1,
    'customer return puts 1 back on hand',
    `status ${cn.status} ${typeof cn.data === 'object' ? cn.data.message || '' : ''}`,
  );

  // 11. Closing never adds stock back
  t = await totals(P);
  await setStatus(o1.id, 'CLOSED'); // may be refused for missing documents; either way stock must not change
  t3 = await totals(P);
  check(
    t3.onHand === t.onHand && t3.reserved === t.reserved,
    'closing an order does not change stock',
  );

  // 12. Purchase order: confirmed -> incoming; part receipt; cancel rest
  if (vendor) {
    const vendorId = vendor.id || vendor.vendorId;
    const po = await call('POST', '/purchase-orders', {
      vendorId,
      items: [{ productId: P, quantity: 10, unitPrice: 50 }],
    });
    const poId = po.data?.purchaseOrder?.id || po.data?.data?.id || po.data?.id;
    check(po.status === 201 && !!poId, 'PO created', String(po.status));
    t = await totals(P);
    await call('PATCH', `/purchase-orders/${poId}/status`, { status: 'confirmed' });
    t3 = await totals(P);
    check(
      t3.incoming === t.incoming + 10,
      'confirmed PO adds 10 incoming',
      `incoming ${t3.incoming}`,
    );
    const rc = await call('POST', `/purchase-orders/${poId}/receive`, {
      items: [{ productId: P, quantity: 4 }],
    });
    const t4 = await totals(P);
    check(
      rc.status === 201 && t4.onHand === t3.onHand + 4 && t4.incoming === t3.incoming - 4,
      'receiving 4: on hand +4, incoming -4',
      `${rc.status} ${rc.data?.message || ''}`,
    );
    const over = await call('POST', `/purchase-orders/${poId}/receive`, {
      items: [{ productId: P, quantity: 7 }],
    });
    check(over.status === 400, 'cannot receive more than is still due', String(over.status));
    await call('PATCH', `/purchase-orders/${poId}/status`, { status: 'cancelled' });
    const t5 = await totals(P);
    check(
      t5.incoming === t4.incoming - 6 && t5.onHand === t4.onHand,
      'cancelling the PO removes the 6 still due from incoming',
      `incoming ${t5.incoming}`,
    );
  } else {
    check(false, 'a vendor exists for the PO checks');
  }

  // 13. Stock count sets on hand
  t = await totals(P);
  const cnt = await call('POST', '/stock/counts', { productIds: [P], notes: 'STOCK CHECK' });
  const cid = cnt.data?.data?.id;
  await call('PUT', `/stock/counts/${cid}/lines`, {
    lines: [{ productId: P, countedQty: t.onHand + 3 }],
  });
  const ap = await call('POST', `/stock/counts/${cid}/approve`);
  t3 = await totals(P);
  check(
    ap.status === 201 && t3.onHand === t.onHand + 3,
    'approved count sets on hand (+3)',
    `on hand ${t3.onHand}`,
  );

  // 14. Transfer between godowns
  const code = `CHK${Date.now() % 100000}`;
  const wh2 = (await call('POST', '/stock/warehouses', { code, name: `Check godown ${code}` })).data
    ?.data;
  const tr = await call('POST', '/stock/transfer', {
    productId: P,
    fromWarehouseId: null,
    toWarehouseId: wh2?.id,
    quantity: 1,
  });
  const detail = (await call('GET', `/stock/products/${P}`)).data;
  const inWh2 = detail.balances.find((b) => b.warehouseId === wh2?.id)?.onHand;
  check(
    tr.status === 201 && inWh2 === 1 && detail.totals.onHand === t3.onHand,
    'transfer moves 1 to the second godown, total unchanged',
    `${tr.status} ${tr.data?.message || ''}`,
  );
  await call('PUT', `/stock/warehouses/${wh2.id}`, {
    code,
    name: `Check godown ${code}`,
    active: true,
  });
  const defaultWh = (await call('GET', '/stock/warehouses')).data.data.find((w) => w.isDefault);
  await call('POST', '/stock/transfer', {
    productId: P,
    fromWarehouseId: wh2.id,
    toWarehouseId: defaultWh.id,
    quantity: 1,
  });

  // 15. Books balance for every product
  const all = (await call('GET', '/stock/overview?limit=500')).data.data;
  const prods = (await call('GET', '/products?limit=1000&page=1')).data;
  const list = prods.products || prods.data || [];
  const qty = Object.fromEntries(list.map((x) => [x.productId, Number(x.quantity)]));
  const bad = all.filter((x) => qty[x.productId] !== undefined && qty[x.productId] !== x.available);
  check(
    bad.length === 0,
    'products.quantity equals available stock for every product',
    bad.map((b) => `${b.name}: ${qty[b.productId]} vs ${b.available}`).join('; '),
  );
  const negative = all.filter(
    (x) => x.onHand < 0 || x.reserved < 0 || x.available < 0 || x.incoming < 0,
  );
  check(negative.length === 0, 'no negative stock anywhere');

  console.log(`\n${failed ? failed + ' check(s) FAILED' : 'All stock checks passed'}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
