// End-to-end check of the orders list figures, dispatch details, delivery and the pick list.
//   node local-tools/orders-check.js
// Creates its own order ("ORDERS CHECK"), dispatches part of it with transport
// details, marks it delivered with a proof photo, and cancels it at the end.
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
  const isForm = body instanceof FormData;
  const r = await fetch(BASE + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const type = r.headers.get('content-type') || '';
  if (type.includes('application/pdf'))
    return { status: r.status, pdf: Buffer.from(await r.arrayBuffer()) };
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
};
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const pdfBlob = () => new Blob(['%PDF-1.4\n%%EOF\n'], { type: 'application/pdf' });

(async () => {
  token = (await call('POST', '/auth/login', ADMIN)).data?.accessToken;
  check(!!token, 'admin logs in');
  const me = (await call('GET', '/user/me')).data.user;
  const customer = ((await call('GET', '/customers?limit=1')).data.data || [])[0];
  const product = ((await call('GET', '/stock/overview?limit=200')).data.data || []).sort(
    (a, b) => b.available - a.available,
  )[0];
  check(
    !!customer && product?.available >= 3,
    'a customer and a product with at least 3 available exist',
    product?.name,
  );

  const countsBefore = (await call('GET', '/order/status-counts')).data;
  check(
    typeof countsBefore.total === 'number' && typeof countsBefore.late === 'number',
    'status counts load',
    `total ${countsBefore.total}, late ${countsBefore.late}`,
  );

  // Order: 3 pieces, due yesterday (late), ₹1,000 each, ₹500 advance
  const created = await call('POST', '/order/create', {
    createdFor: customer.customerId,
    createdBy: me.userId,
    assignedUserId: me.userId,
    status: 'PREPARING',
    dueDate: day(-1),
    description: 'ORDERS CHECK',
    gst: 0,
    amountPaid: 500,
    products: [{ productId: product.productId, name: product.name, quantity: 3, price: 1000 }],
  });
  check(created.status === 201, 'order created', created.status);
  const id = created.data.id;

  const countsAfter = (await call('GET', '/order/status-counts')).data;
  check(
    countsAfter.late === countsBefore.late + 1 &&
      countsAfter.toDispatch === countsBefore.toDispatch + 1,
    'counts: one more late and one more to dispatch',
  );

  const late = (await call('GET', '/order/all?late=1&limit=200')).data.data || [];
  const row = late.find((o) => o.id === id);
  check(!!row && row.isLate, 'it is listed under Late');
  check(
    row && row.orderedQty === 3 && row.dispatchedQty === 0,
    'list shows 0 of 3 dispatched',
    row && `${row.dispatchedQty}/${row.orderedQty}`,
  );
  check(
    row && row.paid === 500 && Math.abs(row.due - (row.billed - 500)) < 0.01,
    'list shows paid ₹500 and the rest due',
    row && `billed ${row.billed}, paid ${row.paid}, due ${row.due}`,
  );
  const multi =
    (await call('GET', '/order/all?status=PREPARING,CHECKING&limit=200')).data.data || [];
  check(
    multi.some((o) => o.id === id),
    'status filter takes a list',
  );

  // Pick list
  const pick = await call('GET', `/order/${id}/pick-list`);
  check(
    pick.status === 200 && pick.pdf?.slice(0, 4).toString() === '%PDF',
    'pick list PDF downloads',
    pick.pdf && `${pick.pdf.length} bytes`,
  );

  // Dispatch 2 of 3 with transport details
  const bad = new FormData();
  bad.append('items', JSON.stringify([{ productId: product.productId, quantity: 2 }]));
  bad.append('ewayBillNo', '1234');
  bad.append('invoice', pdfBlob(), 'inv.pdf');
  bad.append('gatePass', pdfBlob(), 'gp.pdf');
  let r = await call('POST', `/order/${id}/dispatch`, bad);
  check(r.status === 400, "an e-way bill number that isn't 12 digits is refused", r.data?.message);

  const fd = new FormData();
  fd.append('items', JSON.stringify([{ productId: product.productId, quantity: 2 }]));
  fd.append('vehicleNo', 'dl 1l ab 1234');
  fd.append('driverName', 'Suresh');
  fd.append('driverPhone', '98100 00009');
  fd.append('transporter', 'Shree Logistics');
  fd.append('lrNumber', 'LR-5521');
  fd.append('ewayBillNo', '1234 5678 9012');
  fd.append('invoice', pdfBlob(), 'inv.pdf');
  fd.append('gatePass', pdfBlob(), 'gp.pdf');
  r = await call('POST', `/order/${id}/dispatch`, fd);
  check(
    r.status === 201 || r.status === 200,
    'part dispatch with transport details recorded',
    r.status + ' ' + (r.data?.message || ''),
  );
  const disp = (await call('GET', `/order/${id}/dispatches`)).data.dispatches || [];
  const d1 = disp[0] || {};
  check(
    d1.vehicleNo === 'DL1LAB1234' &&
      d1.ewayBillNo === '123456789012' &&
      d1.driverPhone === '9810000009',
    'vehicle, e-way bill and phone are cleaned and saved',
    `${d1.vehicleNo} / ${d1.ewayBillNo} / ${d1.driverPhone}`,
  );

  const row2 = ((await call('GET', '/order/all?limit=200')).data.data || []).find(
    (o) => o.id === id,
  );
  check(
    row2?.dispatchedQty === 2 && row2.status === 'PARTIALLY_DISPATCHED',
    'list shows 2 of 3 dispatched, partially dispatched',
    row2 && `${row2.dispatchedQty}/${row2.orderedQty} ${row2.status}`,
  );

  // Delivery
  r = await call('POST', `/order/${id}/dispatches/${d1.id}/delivered`, new FormData());
  check(r.status === 400, 'delivery needs a receiver name or a proof file');
  const proof = new FormData();
  proof.append('receivedBy', 'Site supervisor');
  proof.append(
    'file',
    new Blob([Buffer.from('/9j/4AAQSkZJRgABAQ==', 'base64')], { type: 'image/jpeg' }),
    'pod.jpg',
  );
  r = await call('POST', `/order/${id}/dispatches/${d1.id}/delivered`, proof);
  check(
    r.status === 200 && r.data.orderStatus === 'PARTIALLY_DELIVERED',
    'first dispatch delivered → order partially delivered',
    r.data?.orderStatus || r.data?.message,
  );
  const d1b = ((await call('GET', `/order/${id}/dispatches`)).data.dispatches || [])[0] || {};
  check(
    d1b.status === 'DELIVERED' && d1b.receivedBy === 'Site supervisor' && !!d1b.deliveryProofLink,
    'delivery saved with receiver and proof',
  );

  // Second dispatch of the last piece, then deliver → order delivered
  const fd2 = new FormData();
  fd2.append('items', JSON.stringify([{ productId: product.productId, quantity: 1 }]));
  fd2.append('invoice', pdfBlob(), 'inv.pdf');
  fd2.append('gatePass', pdfBlob(), 'gp.pdf');
  r = await call('POST', `/order/${id}/dispatch`, fd2);
  const disp2 = ((await call('GET', `/order/${id}/dispatches`)).data.dispatches || []).find(
    (d) => d.id !== d1.id,
  );
  const deliver2 = new FormData();
  deliver2.append('receivedBy', 'Customer');
  r = await call('POST', `/order/${id}/dispatches/${disp2?.id}/delivered`, deliver2);
  check(
    r.status === 200 && r.data.orderStatus === 'DELIVERED',
    'all dispatched and delivered → order delivered',
    r.data?.orderStatus || r.data?.message,
  );

  const countsEnd = (await call('GET', '/order/status-counts')).data;
  check(countsEnd.late === countsBefore.late, 'a delivered order is no longer late');

  console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll orders checks passed');
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
