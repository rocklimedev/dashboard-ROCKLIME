// Creates demo quotations, orders and purchase orders through the app's own API
// (so numbering, stock and Mongo line-items follow the real business rules).
// Needs the backend running. Skips anything that already has data.
const BASE = process.env.API || 'http://localhost:5050/api';
const EMAIL = process.env.LOCAL_ADMIN_EMAIL || 'admin@cmtrading.local';
const PASS = process.env.LOCAL_ADMIN_PASSWORD || 'Admin@12345';
const PRICE = '9ba862ef-f993-4873-95ef-1fef10036aa5';
const day = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

(async () => {
  const login = await (
    await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASS }),
    })
  ).json();
  if (!login.accessToken) throw new Error('login failed');
  const H = { Authorization: `Bearer ${login.accessToken}`, 'Content-Type': 'application/json' };
  const api = async (method, p, body) => {
    const r = await fetch(`${BASE}/${p}`, {
      method,
      headers: H,
      body: body ? JSON.stringify(body) : undefined,
    });
    const t = await r.text();
    let j;
    try {
      j = JSON.parse(t);
    } catch {
      j = t;
    }
    return { s: r.status, j };
  };
  const list = (j) =>
    Array.isArray(j)
      ? j
      : j?.data ||
        j?.products ||
        j?.customers ||
        j?.quotations ||
        j?.orders ||
        j?.vendors ||
        j?.purchaseOrders ||
        [];
  const products = list((await api('GET', 'products/?limit=100')).j);
  const customers = list((await api('GET', 'customers/?limit=100')).j);
  const vendors = list((await api('GET', 'vendors/')).j);
  if (!products.length || !customers.length)
    throw new Error('run seed-local.js first (no products/customers)');
  const price = (p) =>
    Number((typeof p.meta === 'string' ? JSON.parse(p.meta) : p.meta || {})[PRICE] || 100);
  const pick = (...codes) =>
    codes.map((c) => products.find((p) => p.product_code === c)).filter(Boolean);
  const line = (p, quantity, discount = 0) => ({
    productId: p.productId,
    name: p.name,
    quantity,
    price: price(p),
    discount,
    discountType: 'percent',
    tax: 18,
  });

  // Quotations
  const quotes = list((await api('GET', 'quotation/?page=1&limit=5')).j);
  const createdQ = [];
  if (!quotes.length) {
    const plans = [
      [
        0,
        'Bathroom fit-out — GK II residence',
        [
          ['GB-23328', 3, 5],
          ['AS-CCAS1531', 2, 8],
          ['CL-RS250', 2, 0],
        ],
      ],
      [
        1,
        'Studio NK — showroom flooring',
        [
          ['SGT-6060-ST', 400, 10],
          ['JK-TA1-20', 60, 0],
        ],
      ],
      [
        2,
        'Sethi Builders — Tower B lobby marble',
        [
          ['SF-STAT-18', 30, 12],
          ['SF-ABG-18', 6, 5],
        ],
      ],
    ];
    for (const [ci, title, items] of plans) {
      const r = await api('POST', 'quotation/add', {
        customerId: customers[ci % customers.length].customerId,
        document_title: title,
        quotation_date: day(-ci * 3),
        due_date: day(15),
        gst: 18,
        shippingAmount: 500,
        products: items
          .map(([code, q, d]) => {
            const p = pick(code)[0];
            return p && line(p, q, d);
          })
          .filter(Boolean),
      });
      console.log(
        `quotation "${title}": ${r.s}${r.s >= 300 ? ' ' + JSON.stringify(r.j).slice(0, 200) : ''}`,
      );
      if (r.s < 300) createdQ.push(r.j?.quotation || r.j?.data || r.j);
    }
  } else console.log(`quotations skipped (${quotes.length} exist)`);

  // Orders
  const orders = list((await api('GET', 'order/all?page=1&limit=5')).j);
  if (!orders.length) {
    const plans = [
      [
        3,
        'high',
        'PREPARING',
        [
          ['WP-PUT-40', 10],
          ['EX-TR600', 4],
        ],
      ],
      [
        4,
        'medium',
        'DRAFT',
        [
          ['SP-CPVC-1', 50],
          ['JTC-3060-IV', 120],
        ],
      ],
      [
        0,
        'low',
        'PREPARING',
        [
          ['GB-31368', 1],
          ['AS-0552', 2],
        ],
      ],
    ];
    for (const [ci, priority, status, items] of plans) {
      const r = await api('POST', 'order/create', {
        createdFor: customers[ci % customers.length].customerId,
        createdBy: login.user.userId,
        assignedUserId: login.user.userId,
        priority,
        status,
        source: 'Showroom',
        dueDate: day(7),
        gst: 18,
        shipping: 0,
        description: 'Demo order created by local setup',
        products: items
          .map(([code, q]) => {
            const p = pick(code)[0];
            return p && line(p, q);
          })
          .filter(Boolean),
      });
      console.log(
        `order (${status}, ${priority}): ${r.s}${r.s >= 300 ? ' ' + JSON.stringify(r.j).slice(0, 200) : ''}`,
      );
    }
  } else console.log(`orders skipped (${orders.length} exist)`);

  // Purchase orders
  const pos = list((await api('GET', 'purchase-orders/')).j);
  if (!pos.length && vendors.length) {
    for (const [brandSlug, items] of [
      ['sgt', [['SGT-6060-ST', 1000]]],
      [
        'GB_004',
        [
          ['GB-23328', 20],
          ['GB-31368', 10],
        ],
      ],
    ]) {
      const v = vendors.find((x) => x.brandSlug === brandSlug) || vendors[0];
      const r = await api('POST', 'purchase-orders/', {
        vendorId: v.id,
        expectDeliveryDate: day(10),
        items: items
          .map(([code, q]) => {
            const p = pick(code)[0];
            return (
              p && {
                productId: p.productId,
                quantity: q,
                unitPrice: Math.round(price(p) * 0.72),
                mrp: price(p),
              }
            );
          })
          .filter(Boolean),
      });
      console.log(
        `purchase order (${v.vendorName}): ${r.s}${r.s >= 300 ? ' ' + JSON.stringify(r.j).slice(0, 200) : ''}`,
      );
    }
  } else console.log(`purchase orders skipped (${pos.length} exist)`);
})().catch((e) => {
  console.error('DEMO API SEED FAILED:', e.message);
  process.exit(1);
});
