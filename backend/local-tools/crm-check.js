// Checks the CRM app and its Zoho Bigin link.
//   node local-tools/crm-check.js
// Part 1 (API of the running backend): deals, stages, lost reasons, notes,
//   follow-ups, filters, deal → customer, quotation link (the deal follows the
//   quotation: Quotation sent → Won when it has an order), delete.
// Part 2 (in this process, against a fake Zoho server on localhost): connect
//   with a refresh token, push a deal (contact + Pipelines record with
//   Sub_Pipeline and the mapped stage), stage change, import from Bigin,
//   disconnect. Skipped when a real Bigin connection already exists.
// Test records are named "CRM CHECK" and deleted at the end.
const http = require('http');
const path = require('path');
const BASE = process.env.API || 'http://localhost:5050/api';
const ADMIN = {
  email: process.env.LOCAL_ADMIN_EMAIL || 'admin@cmtrading.local',
  password: process.env.LOCAL_ADMIN_PASSWORD || 'Admin@12345',
};

let token;
let failed = 0;
const check = (ok, label, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra !== '' ? '  → ' + extra : ''}`);
  if (!ok) failed++;
};
const call = async (method, p, body) => {
  const r = await fetch(BASE + p, {
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const phone = () => `9${String(Date.now()).slice(-9)}`;

async function part1() {
  token = (await call('POST', '/auth/login', ADMIN)).data?.accessToken;
  check(!!token, 'admin logs in');

  let r = await call('GET', '/crm/meta');
  check(
    r.status === 200 && r.data.stages.length === 8 && r.data.sources.includes('Walk-in'),
    'CRM stages and sources load',
    r.data.stages?.map((s) => s.id).join(' › '),
  );

  r = await call('POST', '/crm/deals', { contactName: 'CRM CHECK Mehra', city: 'Dwarka' });
  check(r.status === 400, 'a deal needs a mobile or email', r.data.message);
  r = await call('POST', '/crm/deals', { contactName: 'CRM CHECK Mehra', phone: '12345' });
  check(r.status === 400, 'a wrong mobile number is refused', r.data.message);

  const mob = phone();
  r = await call('POST', '/crm/deals', {
    contactName: 'CRM CHECK Mehra',
    phone: `+91 ${mob}`,
    city: 'Dwarka',
    source: 'Walk-in',
    customerType: 'Retail',
    amount: '4,50,000',
    tag: 'Hot',
    note: 'Wants Italian marble for 3 BHK',
    followUp: new Date().toISOString().slice(0, 10),
    followUpTitle: 'Call about showroom visit',
  });
  check(
    r.status === 201 &&
      r.data.deal.phone === mob &&
      r.data.deal.amount === 450000 &&
      r.data.deal.stage === 'capture',
    'deal created (mobile cleaned, ₹ amount read)',
    r.data.message || r.data.deal?.title,
  );
  const deal = r.data.deal;
  check(
    deal.title === 'CRM CHECK Mehra · Dwarka',
    'deal name made from customer and city',
    deal.title,
  );

  r = await call('GET', `/crm/board?q=CRM%20CHECK`);
  check(
    r.status === 200 &&
      r.data.columns.capture.some((d) => d.id === deal.id) &&
      r.data.totals.capture.count >= 1,
    'deal is on the board under New enquiry',
  );
  check(
    r.data.columns.capture.find((d) => d.id === deal.id)?.nextTask?.title ===
      'Call about showroom visit',
    'board card shows the next follow-up',
  );

  r = await call('GET', `/crm/board?q=CRM%20CHECK&tag=Cold`);
  check(!r.data.columns.capture.some((d) => d.id === deal.id), 'tag filter leaves the deal out');
  r = await call('GET', `/crm/deals?q=${mob}&source=Walk-in&followUp=due`);
  check(
    r.data.data?.some((d) => d.id === deal.id),
    'list filters: mobile search + source + follow-up due',
  );

  r = await call('PUT', `/crm/deals/${deal.id}/stage`, { stage: 'lost' });
  check(r.status === 400, 'Lost needs a reason', r.data.message);
  r = await call('PUT', `/crm/deals/${deal.id}/stage`, { stage: 'visit' });
  check(r.status === 200 && r.data.deal.stage === 'visit', 'stage moved to Showroom / site visit');

  r = await call('POST', `/crm/deals/${deal.id}/notes`, {
    text: 'Visited showroom, liked Statuario',
    kind: 'visit',
  });
  check(r.status === 200, 'visit note added');
  r = await call('GET', '/crm/tasks?scope=all&when=due');
  const task = (r.data || []).find((t) => t.dealId === deal.id);
  check(!!task, 'follow-up shows in due follow-ups');
  r = await call('PUT', `/crm/tasks/${task?.id}`, { done: true, outcome: 'Coming Saturday' });
  check(r.status === 200, 'follow-up marked done');

  r = await call('GET', `/crm/deals/${deal.id}`);
  const kinds = (r.data.activity || []).map((a) => a.kind);
  check(
    r.status === 200 &&
      kinds.includes('visit') &&
      kinds.includes('stage') &&
      kinds.includes('task'),
    'deal timeline has the visit, stage move and follow-up',
    kinds.join(','),
  );

  // deal → customer
  r = await call('POST', `/crm/deals/${deal.id}/customer`);
  check(
    r.status === 200 && r.data.customerId && r.data.created === true,
    'customer created from the deal',
  );
  const customerId = r.data.customerId;
  r = await call('POST', `/crm/deals/${deal.id}/customer`);
  check(
    r.data.customerId === customerId && r.data.created === false,
    'making the customer again links the same one',
  );
  r = await call('POST', '/crm/deals', { contactName: 'CRM CHECK Mehra again', phone: mob });
  check(
    r.data.deal?.customerId === customerId,
    'a new deal with the same mobile links the customer straight away',
  );
  const second = r.data.deal;

  // quotation → deal follows it
  const { sequelize } = require(path.join(__dirname, '../models'));
  const [[qo]] = await sequelize.query(
    `SELECT q.quotationId, q.customerId, q.finalAmount FROM quotations q
     WHERE EXISTS (SELECT 1 FROM orders o WHERE o.quotationId = q.quotationId AND o.status <> 'CANCELED') ORDER BY q.createdAt DESC LIMIT 1`,
  );
  const [[qopen]] = await sequelize.query(
    `SELECT q.quotationId, q.customerId, q.status FROM quotations q
     WHERE q.status IN ('DRAFT','SENT') AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.quotationId = q.quotationId) ORDER BY q.createdAt DESC LIMIT 1`,
  );
  r = await call('POST', `/crm/deals/${deal.id}/quotation`, { quotationId: qopen?.quotationId });
  check(
    r.status === 400 && /different customer/.test(r.data.message),
    'a quotation of another customer is refused',
    r.data.message,
  );

  if (qopen) {
    r = await call('POST', '/crm/deals', {
      customerId: qopen.customerId,
      title: 'CRM CHECK quoted',
    });
    const d3 = r.data.deal;
    r = await call('POST', `/crm/deals/${d3.id}/quotation`, { quotationId: qopen.quotationId });
    check(
      r.status === 200 && r.data.deal.stage === 'quote' && r.data.deal.quotationRef !== undefined,
      'linking a quotation moves the deal to Quotation sent',
      r.data.deal?.stage,
    );
    await call('DELETE', `/crm/deals/${d3.id}`);
  }
  if (qo) {
    r = await call('POST', '/crm/deals', { customerId: qo.customerId, title: 'CRM CHECK ordered' });
    const d4 = r.data.deal;
    r = await call('POST', `/crm/deals/${d4.id}/quotation`, { quotationId: qo.quotationId });
    check(
      r.status === 200 &&
        r.data.deal.stage === 'won' &&
        r.data.deal.orderId &&
        r.data.deal.amount === Number(qo.finalAmount),
      'a quotation that became an order makes the deal Won, value = quotation total',
      `${r.data.deal?.stage}, ₹${r.data.deal?.amount}`,
    );
    await call('DELETE', `/crm/deals/${d4.id}`);
  } else console.log('SKIP  no quotation with an order in the local data');

  r = await call('GET', `/crm/customer/${customerId}`);
  check(r.data.data?.length === 2, "customer page lists the customer's deals");

  r = await call('GET', '/crm/bigin/status');
  check(
    r.status === 200 &&
      typeof r.data.connected === 'boolean' &&
      /\/api\/crm\/bigin\/callback$/.test(r.data.redirectUri),
    'Bigin status answers',
    `connected: ${r.data.connected}, client set: ${r.data.configured}`,
  );
  const realConnection = r.data.connected;
  if (!realConnection) {
    r = await call('POST', '/crm/bigin/sync');
    check(r.status === 400, 'sync without a connection explains what to do', r.data.message);
  }

  // salesperson cannot connect Bigin
  const sales = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@cmtrading.local', password: 'Sales@12345' }),
  }).then((x) => x.json());
  if (sales.accessToken) {
    const s = await fetch(BASE + '/crm/bigin/authorize', {
      headers: { Authorization: `Bearer ${sales.accessToken}` },
    });
    const b = await fetch(BASE + '/crm/board', {
      headers: { Authorization: `Bearer ${sales.accessToken}` },
    });
    check(
      s.status === 403 && b.status === 200,
      'sales sees the CRM but cannot connect Bigin',
      `${b.status}/${s.status}`,
    );
  }

  await call('DELETE', `/crm/deals/${second.id}`);
  r = await call('DELETE', `/crm/deals/${deal.id}`);
  const gone = await call('GET', `/crm/deals/${deal.id}`);
  check(r.status === 200 && gone.status === 404, 'deal deleted');
  await sequelize.query('DELETE FROM customers WHERE customerId = ?', {
    replacements: [customerId],
  });
  return realConnection;
}

// ---------------------------------------------------------------- fake Zoho
function fakeZoho() {
  const state = { contacts: [], pipelines: [], calls: [] };
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      const send = (code, obj) => {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
      };
      const json = body ? JSON.parse(body) : {};
      state.calls.push(`${req.method} ${url.pathname}`);
      if (url.pathname === '/oauth/v2/token') {
        if (url.searchParams.get('refresh_token') !== '1000.fakerefresh.crmcheck0000000')
          return send(200, { error: 'invalid_code' });
        return send(200, {
          access_token: '1000.fakeaccess',
          expires_in: 3600,
          api_domain: `http://localhost:${server.address().port}`,
          scope: 'ZohoBigin.modules.ALL',
        });
      }
      if (req.headers.authorization !== 'Zoho-oauthtoken 1000.fakeaccess')
        return send(401, { code: 'INVALID_TOKEN' });
      const p = url.pathname.replace('/bigin/v2', '');
      if (p === '/org') return send(200, { org: [{ company_name: 'Chhabra Marble (test)' }] });
      if (p === '/Contacts/search') {
        const crit = url.searchParams.get('criteria') || '';
        const hit = state.contacts.find((c) => crit.includes(c.Mobile || '~'));
        return hit ? send(200, { data: [{ id: hit.id }] }) : res.writeHead(204).end();
      }
      if (p === '/Contacts' && req.method === 'POST') {
        const c = { id: `C${state.contacts.length + 1}`, ...json.data[0] };
        state.contacts.push(c);
        return send(201, { data: [{ status: 'success', details: { id: c.id } }] });
      }
      if (p.startsWith('/Contacts/'))
        return send(200, { data: [state.contacts.find((c) => c.id === p.split('/')[2]) || {}] });
      if (p === '/Pipelines' && req.method === 'POST') {
        const d = json.data[0];
        if (!d.Sub_Pipeline)
          return send(400, {
            data: [
              {
                status: 'error',
                code: 'MANDATORY_NOT_FOUND',
                message: 'required field not found',
                details: { api_name: 'Sub_Pipeline' },
              },
            ],
          });
        const rec = {
          id: `P${state.pipelines.length + 1}`,
          ...d,
          Modified_Time: new Date().toISOString(),
        };
        state.pipelines.push(rec);
        return send(201, { data: [{ status: 'success', details: { id: rec.id } }] });
      }
      if (p.startsWith('/Pipelines/') && req.method === 'PUT') {
        const rec = state.pipelines.find((x) => x.id === p.split('/')[2]);
        Object.assign(rec, json.data[0], { Modified_Time: new Date().toISOString() });
        return send(200, { data: [{ status: 'success', details: { id: rec.id } }] });
      }
      if (p.startsWith('/Pipelines/') && req.method === 'DELETE') {
        state.pipelines = state.pipelines.filter((x) => x.id !== p.split('/')[2]);
        return send(200, { data: [{ status: 'success' }] });
      }
      if (p === '/Pipelines')
        return send(200, { data: [...state.pipelines].reverse(), info: { more_records: false } });
      if (p === '/settings/layouts')
        return send(200, {
          layouts: [
            {
              sections: [
                {
                  fields: [
                    {
                      api_name: 'Sub_Pipeline',
                      pick_list_values: [
                        {
                          display_value: 'Sales Pipeline',
                          maps: [
                            {
                              pick_list_values: [
                                'Qualification',
                                'Needs Analysis',
                                'Proposal/Price Quote',
                                'Negotiation/Review',
                                'Closed Won',
                                'Closed Lost',
                              ].map((x) => ({ display_value: x })),
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      send(404, { code: 'NOT_FOUND', p });
    });
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, state })));
}

async function part2() {
  process.env.ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || 'fake-client';
  process.env.ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || 'fake-secret';
  process.env.CRM_AUTO_SYNC = '0';
  const bigin = require(path.join(__dirname, '../modules/crm/bigin'));
  const crm = require(path.join(__dirname, '../modules/crm/crm.service'));
  const { sequelize } = require(path.join(__dirname, '../models'));
  const { server, state } = await fakeZoho();
  const accounts = `http://localhost:${server.address().port}`;
  const ids = [];
  try {
    let err = await bigin
      .connectWithRefreshToken('1000.wrongtoken.crmcheck000000', accounts, null)
      .catch((e) => e);
    check(
      err instanceof Error && !(await bigin.connection()),
      'a wrong refresh token is refused',
      err?.message,
    );
    err = await bigin
      .connectWithRefreshToken('1000.fakerefresh.crmcheck0000000', 'https://evil.example.com', null)
      .catch((e) => e);
    check(
      /Only Zoho accounts servers/.test(err?.message || ''),
      'only Zoho accounts servers are accepted',
    );

    await bigin.connectWithRefreshToken('1000.fakerefresh.crmcheck0000000', accounts, null);
    const st = await bigin.status();
    check(
      st.connected && st.orgName === 'Chhabra Marble (test)',
      'Bigin connects with a refresh token (org name read)',
      st.orgName,
    );

    const map = await bigin.pipelineStages();
    check(
      map['Sales Pipeline']?.includes('Closed Won'),
      'Bigin pipelines and stages read from the layout',
    );

    const mob = phone();
    const deal = await crm.createDeal(
      { contactName: 'CRM CHECK Bigin Kapoor', phone: mob, amount: 120000, source: 'Referral' },
      { userId: null },
    );
    ids.push(deal.id);
    await crm.pushNow(deal.id);
    const [[row]] = await sequelize.query(
      'SELECT biginId, biginError FROM crm_deals WHERE id = ?',
      { replacements: [deal.id] },
    );
    const sent = state.pipelines.find((p) => p.id === row.biginId);
    check(
      !!sent &&
        sent.Sub_Pipeline === 'Sales Pipeline' &&
        sent.Stage === 'Qualification' &&
        sent.Amount === 120000,
      'new deal pushed to Bigin Pipelines with Sub_Pipeline and stage',
      JSON.stringify(
        sent && { Stage: sent.Stage, Sub_Pipeline: sent.Sub_Pipeline, Amount: sent.Amount },
      ),
    );
    check(
      sent?.Contact_Name?.id &&
        state.contacts[0]?.Mobile === mob &&
        state.contacts[0]?.Last_Name === 'Kapoor',
      'Bigin contact created and linked (name split, mobile)',
    );

    await crm.setStage(deal.id, 'quote', {});
    await crm.pushNow(deal.id);
    check(
      state.pipelines.find((p) => p.id === row.biginId)?.Stage === 'Proposal/Price Quote',
      'stage change sent to Bigin (Quotation sent → Proposal/Price Quote)',
    );

    // a deal made in Bigin, and a stage changed in Bigin
    state.contacts.push({
      id: 'C99',
      First_Name: 'Ritu',
      Last_Name: 'CRM CHECK Arora',
      Mobile: '9811000099',
      Email: 'ritu@example.com',
    });
    state.pipelines.push({
      id: 'P99',
      Deal_Name: 'CRM CHECK Arora farmhouse',
      Sub_Pipeline: 'Sales Pipeline',
      Stage: 'Needs Analysis',
      Amount: 980000,
      Contact_Name: { id: 'C99', name: 'Ritu Arora' },
      Modified_Time: new Date().toISOString(),
    });
    state.pipelines.find((p) => p.id === row.biginId).Stage = 'Negotiation/Review';
    const res = await crm.syncWithBigin({ full: true });
    const [[imp]] = await sequelize.query(
      "SELECT id, stage, phone, amount, source FROM crm_deals WHERE biginId = 'P99'",
    );
    if (imp) ids.push(imp.id);
    check(
      res.created === 1 &&
        imp?.stage === 'visit' &&
        imp?.phone === '9811000099' &&
        Number(imp?.amount) === 980000 &&
        imp?.source === 'Zoho Bigin',
      'Bigin deal imported (stage, contact mobile, value)',
      JSON.stringify(res),
    );
    const [[after]] = await sequelize.query('SELECT stage FROM crm_deals WHERE id = ?', {
      replacements: [deal.id],
    });
    check(after.stage === 'nego', 'a stage changed in Bigin comes back to CM ERP', after.stage);

    const st2 = await bigin.status();
    check(
      !!st2.lastSyncAt && st2.lastSyncResult?.created === 1,
      'last sync time and result are kept',
    );

    await crm.deleteDeal(deal.id, null);
    await sleep(300);
    check(
      !state.pipelines.some((p) => p.id === row.biginId),
      'deleting the deal deletes it in Bigin',
    );
  } finally {
    for (const id of ids) {
      await sequelize.query('DELETE FROM crm_activities WHERE dealId = ?', { replacements: [id] });
      await sequelize.query('DELETE FROM crm_tasks WHERE dealId = ?', { replacements: [id] });
      await sequelize.query('DELETE FROM crm_deals WHERE id = ?', { replacements: [id] });
    }
    await sequelize.query(
      "DELETE FROM crm_zoho_connection WHERE `key` = 'bigin' AND accountsUrl LIKE 'http://localhost:%'",
    );
    server.close();
  }
}

(async () => {
  const realConnection = await part1();
  if (realConnection)
    console.log('SKIP  Bigin mirror test — a real Bigin connection exists, it is left alone');
  else await part2();
  console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll CRM and Bigin checks passed');
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
