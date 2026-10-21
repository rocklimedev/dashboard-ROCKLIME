// Security regression check against a running local backend.
//   node local-tools/security-check.js
// Exits 1 if any check fails. Creates and removes its own throwaway records.
const BASE = process.env.API || 'http://localhost:5050/api';
const ADMIN = {
  email: process.env.LOCAL_ADMIN_EMAIL || 'admin@cmtrading.local',
  password: process.env.LOCAL_ADMIN_PASSWORD || 'Admin@12345',
};
const SALES = {
  email: process.env.LOCAL_SALES_EMAIL || 'sales@cmtrading.local',
  password: process.env.LOCAL_SALES_PASSWORD || 'Sales@12345',
};

let failed = 0;
const check = (ok, label, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  → ' + extra : ''}`);
  if (!ok) failed++;
};
const call = async (method, path, token, body) => {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await r.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
};
const login = async (u) => (await call('POST', '/auth/login', null, u)).data?.accessToken;

(async () => {
  const admin = await login(ADMIN);
  const sales = await login(SALES);
  check(!!admin && !!sales, 'admin and sales can log in');

  // 1. Nothing outside /auth works without a login
  const anonPaths = [
    '/order/all',
    '/order/recent',
    '/order/count',
    '/order/dispatch-history',
    '/carts/all',
    '/products',
    '/customers',
    '/quotation',
    '/user',
    '/roles',
    '/purchase-orders',
    '/fgs',
    '/vendors',
    '/activity',
  ];
  for (const p of anonPaths) {
    const r = await call('GET', p);
    check(r.status === 401, `logged out GET ${p} is refused`, String(r.status));
  }
  const anonCreate = await call('POST', '/order/create', null, { createdFor: 'x' });
  check(
    anonCreate.status === 401,
    'logged out POST /order/create is refused',
    String(anonCreate.status),
  );
  const bad = await call('GET', '/customers', 'not.a.token');
  check(bad.status === 401, 'invalid token gets 401 (not 403)', String(bad.status));

  // 2. Sales cannot manage roles, users or permissions
  const role = await call('POST', '/roles', sales, { roleName: 'SECURITY_CHECK_ROLE' });
  check(role.status === 403, 'sales cannot create a role', String(role.status));
  if (role.status < 300 && role.data?.roleId)
    await call('DELETE', `/roles/${role.data.roleId}`, admin);
  const users = await call('GET', '/user', sales);
  check(users.status === 403, 'sales cannot list users', String(users.status));
  const perms = await call('GET', '/permission', sales);
  check(perms.status === 403, 'sales cannot read permissions', String(perms.status));

  // 3. Sales can still do sales work
  for (const p of ['/quotation', '/customers', '/order/all', '/products?limit=5', '/brands']) {
    const r = await call('GET', p, sales);
    check(r.status === 200, `sales can GET ${p}`, String(r.status));
  }
  const me = await call('GET', '/user/me', sales);
  check(me.status === 200, 'sales can read own profile', String(me.status));

  // 4. Carts are private
  const adminId = (await call('GET', '/user/me', admin)).data?.user?.userId;
  const otherCart = await call('GET', `/carts/${adminId}`, sales);
  check(otherCart.status === 403, "sales cannot read the admin's cart", String(otherCart.status));

  // 5. The order-summary PDF no longer crashes the server
  const orders = (await call('GET', '/order/all?page=1&limit=1', admin)).data;
  const orderId = (orders?.data || orders?.orders || [])[0]?.id;
  if (orderId) {
    const pdf = await fetch(`${BASE}/order/${orderId}/download-order`, {
      headers: { Authorization: `Bearer ${admin}` },
    });
    check(
      pdf.status === 200 && (pdf.headers.get('content-type') || '').includes('pdf'),
      'order summary PDF downloads',
      String(pdf.status),
    );
  }
  const health = await fetch(BASE + '/health')
    .then((r) => r.status)
    .catch(() => 0);
  check(health === 200, 'server still up after the PDF request', String(health));

  // 6. Login attempts are limited per account
  let limited = false;
  for (let i = 0; i < 12; i++) {
    const r = await call('POST', '/auth/login', null, {
      email: 'nobody-check@cmtrading.local',
      password: 'wrong',
    });
    if (r.status === 429) {
      limited = true;
      break;
    }
  }
  check(limited, 'repeated failed logins are slowed down (429)');

  console.log(`\n${failed ? failed + ' check(s) FAILED' : 'All security checks passed'}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
