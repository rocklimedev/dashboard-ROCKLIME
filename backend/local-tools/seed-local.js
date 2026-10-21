// Local seed: roles, permissions (granted to admin roles), product meta fields,
// the local admin login, and demo catalogue/customer data. Safe to re-run.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sequelize = require('./_db');
const uuid = () => crypto.randomUUID();
let TX = null; // demo data is inserted in one transaction so a failure leaves nothing half-done
const q = (sql, replacements = []) => sequelize.query(sql, { replacements, transaction: TX });
const one = async (sql, r) => (await q(sql, r))[0][0];

// Local admin login. The fixed userId matches ADMIN_USER_ID hard-coded in the order
// controllers, so order/dispatch notifications reach this admin locally.
const ADMIN = {
  userId: '2ef0f07a-a275-4fe1-832d-fe9a5d145f60',
  username: 'admin',
  name: 'Local Admin',
  email: process.env.LOCAL_ADMIN_EMAIL || 'admin@cmtrading.local',
  password: process.env.LOCAL_ADMIN_PASSWORD || 'Admin@12345',
};
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'ACCOUNTS', 'SALES', 'USERS'];
const FULL_ACCESS = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];

// Product meta fields — IDs are the ones hard-coded in frontend/backend.
const METAS = [
  ['9ba862ef-f993-4873-95ef-1fef10036aa5', 'Selling Price', 'sellingPrice', 'number', 'INR'],
  ['d11da9f9-3f2e-4536-8236-9671200cca4a', 'Company Code', 'companyCode', 'string', null],
  ['4ded1cb3-5d31-42e8-90ec-a381a6ab1e35', 'Barcode', 'barcode', 'string', null],
  ['81cd6d76-d7d2-4226-b48e-6704e6224c2b', 'Product Group', 'productGroup', 'string', null],
  ['7e2b4efb-4ff2-4e4d-9b08-82559a7e3cd0', 'Size (inches/feet)', 'sizeFeet', 'string', 'feet'],
  ['0f429633-220c-478b-972e-817193a527f2', 'Size (mm)', 'sizeMm', 'string', 'mm'],
  ['16ffa365-3b25-4230-a8f5-73ba5b8ac5a1', 'Product Segment', 'productSegment', 'string', null],
  ['32cef946-b417-4acf-a342-58e6c60f5aa4', 'Area Covered per Box', 'areaPerBox', 'number', 'sqft'],
  ['73c6caff-3b7d-4eae-bb7a-dfd176d130c7', 'MRP per Pcs', 'mrpPerPcs', 'number', 'INR'],
  ['7687da21-9173-4172-9371-51aa426de108', 'Purchasing Price', 'purchasingPrice', 'number', 'INR'],
  ['963ad7fb-734b-41d7-a95a-27a84e068ae0', 'MRP per Box', 'mrpPerBox', 'number', 'INR'],
  ['af3b4db4-6365-4dbc-b46b-4c9a744b1b4e', 'Length', 'length', 'number', 'inch'],
  ['d3d3bd17-86fd-4390-83ea-8822755b8de9', 'Width', 'width', 'number', 'inch'],
  ['e926224f-7ca6-4e28-b28c-69f0162d57c4', 'Area Covered per Pcs', 'areaPerPcs', 'number', 'sqft'],
  ['ff53919e-40ac-4cb9-9b8e-d159547901f7', 'Pcs per Box', 'pcsPerBox', 'number', 'pcs'],
];

// Permissions: every checkPermission(...) used in the route files (including ones
// currently commented out) + the module/action pairs the screens check for buttons.
function collectPermissions() {
  const out = new Map();
  const walk = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.route.js')) {
        const src = fs.readFileSync(p, 'utf8');
        const re = /checkPermission\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g;
        let m;
        while ((m = re.exec(src))) {
          const [, api, name, module, route] = m;
          const key = `${api}|${module}|${route}|${name}`;
          out.set(key, { api, name, module, route });
        }
      }
    });
  walk(path.join(__dirname, '..', 'modules'));
  const uiModules = [
    'products',
    'cart',
    'quotations',
    'customers',
    'orders',
    'purchase_orders',
    'field_guided_sheets',
    'vendors',
    'brands',
    'categories',
    'users',
    'teams',
    'roles',
    'permissions',
    'inventory',
    'jobs',
    'keywords',
    'address',
  ];
  for (const module of uiModules)
    for (const api of ['view', 'write', 'edit', 'delete', 'export'])
      out.set(`${api}|${module}|/${module}|ui`, {
        api,
        name: `${api}_${module}`,
        module,
        route: `/${module}`,
      });
  return [...out.values()];
}

async function seedRbac() {
  for (const r of ROLES)
    await q(
      'INSERT IGNORE INTO roles (roleId, roleName, createdAt, updatedAt) VALUES (?,?,NOW(),NOW())',
      [uuid(), r],
    );
  let added = 0;
  for (const p of collectPermissions()) {
    const exists = await one(
      'SELECT permissionId FROM permissions WHERE api=? AND module=? AND route=? AND (name=? OR name LIKE ?)',
      [p.api, p.module, p.route, p.name, `${p.name}__%`],
    );
    if (exists) continue;
    let name = p.name;
    if (await one('SELECT 1 x FROM permissions WHERE name=?', [name]))
      name = `${p.name}__${p.module}_${p.api}`.slice(0, 250);
    const [, affected] = await q(
      'INSERT IGNORE INTO permissions (permissionId, createdAt, updatedAt, name, module, api, route) VALUES (?,NOW(),NOW(),?,?,?,?)',
      [uuid(), name, p.module, p.api, p.route],
    );
    if (affected) added++;
  }
  for (const r of FULL_ACCESS) {
    await q(
      `INSERT IGNORE INTO rolepermissions (id, createdAt, updatedAt, roleId, permissionId)
             SELECT UUID(), NOW(), NOW(), r.roleId, p.permissionId FROM roles r CROSS JOIN permissions p
             WHERE r.roleName=? AND NOT EXISTS (SELECT 1 FROM rolepermissions x WHERE x.roleId=r.roleId AND x.permissionId=p.permissionId)`,
      [r],
    );
  }
  const n = await one('SELECT COUNT(*) c FROM permissions');
  console.log(
    `RBAC: ${ROLES.length} roles, ${n.c} permissions (${added} new), all granted to ${FULL_ACCESS.join(', ')}`,
  );
}

async function seedAdmin() {
  const role = await one("SELECT roleId FROM roles WHERE roleName='SUPER_ADMIN'");
  const existing = await one('SELECT userId FROM users WHERE email=? OR username=? OR userId=?', [
    ADMIN.email,
    ADMIN.username,
    ADMIN.userId,
  ]);
  if (existing) {
    console.log(`Admin user already exists (${ADMIN.email})`);
    return;
  }
  const hash = await bcrypt.hash(ADMIN.password, 10);
  await q(
    `INSERT INTO users (userId, username, name, email, mobileNumber, roles, status, password, createdAt, updatedAt, roleId, isEmailVerified)
           VALUES (?,?,?,?,?,'SUPER_ADMIN','active',?,NOW(),NOW(),?,1)`,
    [ADMIN.userId, ADMIN.username, ADMIN.name, ADMIN.email, '9999900000', hash, role.roleId],
  );
  console.log(`Admin user created: ${ADMIN.email} / ${ADMIN.password}`);
}

async function seedMetas() {
  for (const [id, title, slug, fieldType, unit] of METAS)
    await q(
      'INSERT IGNORE INTO product_metas (id, title, slug, fieldType, unit, createdAt) VALUES (?,?,?,?,?,NOW())',
      [id, title, slug, fieldType, unit],
    );
  console.log(`Product meta fields: ${METAS.length}`);
}

async function seedDemo() {
  const c = await one('SELECT COUNT(*) c FROM products');
  if (c.c > 0) {
    console.log(`Demo catalogue skipped (${c.c} products already exist)`);
    return;
  }
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  // Brand parent categories (the 6 tiles on the Products page)
  const BPC = {};
  for (const name of [
    'CP Fittings & Sanitary',
    'Tiles',
    'Stone & Granites',
    'Chemicals & Adhesive',
    'Accessories & Add Ons',
    'Plumbing',
  ]) {
    BPC[name] = uuid();
    await q(
      'INSERT INTO brand_parentcategories (id,name,slug,createdAt,updatedAt) VALUES (?,?,?,NOW(),NOW())',
      [BPC[name], name, slug(name)],
    );
  }
  // Brands (SGT / Shiv Ceramic / JTC / UW / Subway use the IDs the screens expect)
  const brands = [
    ['Grohe Bau', 'GB_004', 'CP Fittings & Sanitary', null],
    ['American Standard', 'AS_001', 'CP Fittings & Sanitary', null],
    ['Colston', 'colston', 'CP Fittings & Sanitary', null],
    ['SGT', 'sgt', 'Tiles', '50105657-7686-11f0-9e84-52540021303b'],
    ['Shiv Ceramic', 'shiv-ceramic', 'Tiles', '500b10a7-7686-11f0-9e84-52540021303b'],
    ['JTC', 'jtc', 'Tiles', '50106480-7686-11f0-9e84-52540021303b'],
    ['UW', 'uw', 'Tiles', '50107b22-7686-11f0-9e84-52540021303b'],
    ['Subway', 'subway', 'Tiles', '987bb747-773d-11f0-9e84-52540021303b'],
    ['Surface', 'surface', 'Stone & Granites', null],
    ['JK Adhesive', 'jk_adhesive', 'Chemicals & Adhesive', null],
    ['Walplast', 'walplast', 'Chemicals & Adhesive', null],
    ['Extras', 'extras', 'Accessories & Add Ons', null],
    ['Supreme Plumbing', 'plumbing', 'Plumbing', null],
  ];
  const B = {};
  for (const [name, bslug, bpc, fixed] of brands) {
    const id = fixed || uuid();
    B[name] = { id, bpc, bslug };
    await q(
      'INSERT INTO brands (id,brandSlug,brandName,createdAt,updatedAt) VALUES (?,?,?,NOW(),NOW())',
      [id, bslug, name],
    );
    await q(
      'INSERT INTO brand_parentcategory_brands (brandParentCategoryId, brandId) VALUES (?,?)',
      [BPC[bpc], id],
    );
  }
  // Parent categories + categories per BPC
  const tree = {
    'CP Fittings & Sanitary': {
      Faucets: ['Basin Mixers', 'Sink Mixers'],
      Showers: ['Overhead Showers', 'Hand Showers'],
      Sanitaryware: ['Wall Hung WC', 'Wash Basins'],
    },
    Tiles: {
      'Floor Tiles': ['Vitrified 60x60', 'Vitrified 80x160'],
      'Wall Tiles': ['Ceramic 30x60'],
    },
    'Stone & Granites': { Marble: ['Italian Marble', 'Indian Marble'], Granite: ['Black Granite'] },
    'Chemicals & Adhesive': { 'Tile Adhesive': ['Cement Based'], 'Wall Putty': ['White Putty'] },
    'Accessories & Add Ons': { 'Bath Accessories': ['Towel Rails', 'Soap Dishes'] },
    Plumbing: { Pipes: ['CPVC Pipes', 'PVC Pipes'] },
  };
  const CAT = {};
  for (const [bpc, pcs] of Object.entries(tree))
    for (const [pc, cats] of Object.entries(pcs)) {
      const pcId = uuid();
      await q(
        'INSERT INTO parentcategories (id,name,slug,createdAt,updatedAt,brandParentCategoryId) VALUES (?,?,?,NOW(),NOW(),?)',
        [pcId, pc, slug(pc), BPC[bpc]],
      );
      for (const cat of cats) {
        const cid = uuid();
        CAT[cat] = cid;
        const brandId = Object.values(B).find((b) => b.bpc === bpc).id;
        await q(
          'INSERT INTO categories (categoryId,name,parentCategoryId,createdAt,updatedAt,slug,brandId) VALUES (?,?,?,NOW(),NOW(),?,?)',
          [cid, cat, pcId, slug(cat), brandId],
        );
        await q(
          'INSERT INTO keywords (id,keyword,createdAt,updatedAt,categoryId) VALUES (?,?,NOW(),NOW(),?)',
          [uuid(), cat.toLowerCase(), cid],
        );
      }
    }
  // Vendors (one per main brand)
  const V = {};
  let vn = 1;
  for (const [name, b] of Object.entries(B)) {
    const id = uuid();
    V[name] = id;
    await q(
      'INSERT INTO vendors (id,vendorId,vendorName,brandId,brandSlug,createdAt,updatedAt) VALUES (?,?,?,?,?,NOW(),NOW())',
      [id, `VEN${String(vn++).padStart(3, '0')}`, `${name} Distributors Pvt Ltd`, b.id, b.bslug],
    );
  }
  // Products
  const P = [
    ['Grohe Bau', 'Basin Mixers', 'Grohe BauEdge Basin Mixer', 'GB-23328', 4850, 40],
    ['Grohe Bau', 'Sink Mixers', 'Grohe BauLoop Sink Mixer', 'GB-31368', 6200, 25],
    [
      'American Standard',
      'Wall Hung WC',
      'American Standard Signature Wall Hung WC',
      'AS-CCAS1531',
      18900,
      12,
    ],
    [
      'American Standard',
      'Wash Basins',
      'American Standard Acacia Counter Basin',
      'AS-0552',
      7400,
      18,
    ],
    ['Colston', 'Overhead Showers', 'Colston Rain Shower 250mm', 'CL-RS250', 5600, 30],
    ['Colston', 'Hand Showers', 'Colston Hand Shower Chrome', 'CL-HS110', 1450, 4],
    ['SGT', 'Vitrified 60x60', 'SGT Statuario Glossy 60x60', 'SGT-6060-ST', 62, 900],
    ['Shiv Ceramic', 'Vitrified 80x160', 'Shiv Calacatta Gold 80x160', 'SC-80160-CG', 145, 320],
    ['JTC', 'Ceramic 30x60', 'JTC Wall Ivory 30x60', 'JTC-3060-IV', 38, 1500],
    ['Surface', 'Italian Marble', 'Statuario Italian Marble Slab', 'SF-STAT-18', 950, 60],
    ['Surface', 'Indian Marble', 'Makrana White Marble', 'SF-MAKR-16', 420, 140],
    ['Surface', 'Black Granite', 'Absolute Black Granite', 'SF-ABG-18', 210, 8],
    ['JK Adhesive', 'Cement Based', 'JK Tile Adhesive TA-1 20kg', 'JK-TA1-20', 480, 200],
    ['Walplast', 'White Putty', 'Walplast Wall Putty 40kg', 'WP-PUT-40', 760, 75],
    ['Extras', 'Towel Rails', 'Chrome Towel Rail 600mm', 'EX-TR600', 1250, 22],
    ['Supreme Plumbing', 'CPVC Pipes', 'CPVC Pipe 1 inch (3m)', 'SP-CPVC-1', 390, 450],
  ];
  let bc = 8901000000001;
  for (const [brand, cat, name, code, price, qty] of P) {
    const meta = {
      '9ba862ef-f993-4873-95ef-1fef10036aa5': String(price),
      'd11da9f9-3f2e-4536-8236-9671200cca4a': code.split('-').slice(1).join('-'),
      '4ded1cb3-5d31-42e8-90ec-a381a6ab1e35': String(bc++),
      '7687da21-9173-4172-9371-51aa426de108': String(Math.round(price * 0.72)),
      '73c6caff-3b7d-4eae-bb7a-dfd176d130c7': String(Math.round(price * 1.25)),
    };
    await q(
      `INSERT INTO products (productId,name,product_code,quantity,discountType,alert_quantity,tax,description,images,brandId,categoryId,createdAt,updatedAt,isFeatured,status,vendorId,brand_parentcategoriesId,meta,isMaster)
             VALUES (?,?,?,?,'percent',10,18.00,?,?,?,?,NOW(),NOW(),0,'active',?,?,?,0)`,
      [
        uuid(),
        name,
        code,
        qty,
        `${name} — demo product for local testing.`,
        JSON.stringify([]),
        B[brand].id,
        CAT[cat],
        V[brand],
        BPC[B[brand].bpc],
        JSON.stringify(meta),
      ],
    );
  }
  // Customers + addresses
  const customers = [
    ['Rohit Malhotra', 'Retail', 'Malhotra Residence', 'Greater Kailash II', 'New Delhi', '110048'],
    [
      'Ar. Neha Kapoor',
      'Architect',
      'Studio NK Architects',
      'Hauz Khas Village',
      'New Delhi',
      '110016',
    ],
    ['Vikram Sethi', 'Builder', 'Sethi Builders LLP', 'Sector 54', 'Gurugram', '122011'],
    ['Priya Bansal', 'Interior', 'Bansal Interiors', 'Sector 18', 'Noida', '201301'],
    ['Amit Chawla', 'Contractor', 'Chawla Constructions', 'Rajouri Garden', 'New Delhi', '110027'],
  ];
  let ph = 9810000001;
  for (const [name, type, company, street, city, pin] of customers) {
    const cid = uuid();
    const addr = {
      street,
      city,
      state: city === 'New Delhi' ? 'Delhi' : city === 'Gurugram' ? 'Haryana' : 'Uttar Pradesh',
      postalCode: pin,
      zip: pin,
      country: 'India',
    };
    await q(
      `INSERT INTO customers (customerId,name,email,mobileNumber,companyName,customerType,address,isVendor,createdAt,updatedAt)
             VALUES (?,?,?,?,?,?,?,0,NOW(),NOW())`,
      [
        cid,
        name,
        `${name
          .toLowerCase()
          .replace(/[^a-z]+/g, '.')
          .replace(/^\.|\.$/g, '')}@example.com`,
        String(ph++),
        company,
        type,
        JSON.stringify(addr),
      ],
    );
    await q(
      `INSERT INTO addresses (addressId,street,city,state,postalCode,country,createdAt,updatedAt,customerId,status) VALUES (?,?,?,?,?,?,NOW(),NOW(),?,'BILLING')`,
      [uuid(), street, city, addr.state, pin, 'India', cid],
    );
  }
  // A sales user + team
  const salesRole = await one("SELECT roleId FROM roles WHERE roleName='SALES'");
  const salesId = uuid();
  await q(
    `INSERT IGNORE INTO users (userId,username,name,email,mobileNumber,roles,status,password,createdAt,updatedAt,roleId,isEmailVerified)
           VALUES (?,?,?,?,?,'SALES','active',?,NOW(),NOW(),?,1)`,
    [
      salesId,
      'sales.demo',
      'Sales Demo',
      'sales@cmtrading.local',
      '9999900001',
      await bcrypt.hash('Sales@12345', 10),
      salesRole.roleId,
    ],
  );
  const teamId = uuid();
  await q(
    'INSERT INTO teams (id,adminId,adminName,createdAt,updatedAt,teamName) VALUES (?,?,?,NOW(),NOW(),?)',
    [teamId, ADMIN.userId, ADMIN.name, 'Showroom Sales'],
  );
  await q(
    'INSERT INTO teammembers (id,teamId,userId,userName,roleId,roleName,createdAt,updatedAt) VALUES (?,?,?,?,?,?,NOW(),NOW())',
    [uuid(), teamId, salesId, 'Sales Demo', salesRole.roleId, 'SALES'],
  );
  console.log(
    `Demo data: ${brands.length} brands, ${Object.keys(CAT).length} categories, ${P.length} products, ${customers.length} customers, 1 team`,
  );
}

(async () => {
  await seedRbac();
  await seedMetas();
  await seedAdmin();
  await sequelize.transaction(async (t) => {
    TX = t;
    try {
      await seedDemo();
    } finally {
      TX = null;
    }
  });
  await sequelize.close();
})().catch((e) => {
  console.error(
    'SEED FAILED:',
    e.message,
    e.errors?.map((x) => x.message).join('; ') || '',
    e.sql || '',
  );
  process.exit(1);
});
