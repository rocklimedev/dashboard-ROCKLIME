// The ERP as apps. After login the first screen is the apps home; inside an
// app the sidebar shows only that app's menu. The launcher, the sidebar and the
// app switcher are all built from this list.
//
//   key       stable id
//   name      shown in the launcher and the sidebar
//   module    permission module that opens the app (the server checks the same)
//   action    permission action needed (default "view")
//   adminOnly only SUPER_ADMIN / ADMIN / DEVELOPER
//   match     URL prefixes that belong to the app
//   shared    pages the app opens that belong to another app too (an order from
//             Operations stays in Operations); the app you came from keeps them
//   items     the app's menu; `section` starts a group, and an item may narrow
//             access with its own module/action
import crmIcon from '../assets/icons/crm@1024.png';
import quotationsIcon from '../assets/icons/quotations@1024.png';
import ordersIcon from '../assets/icons/orders@1024.png';
import operationsIcon from '../assets/icons/operations@1024.png';
import purchaseIcon from '../assets/icons/purchase@1024.png';
import catalogueIcon from '../assets/icons/catalogue@1024.png';
import accountsIcon from '../assets/icons/accounts@1024.png';
import reportsIcon from '../assets/icons/reports@1024.png';
import adminIcon from '../assets/icons/admin@1024.png';
import './AppIcon.css';
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  BellOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  InboxOutlined,
  IdcardOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  EditOutlined,
  HourglassOutlined,
  SwapOutlined,
  HomeOutlined,
  ShoppingOutlined,
  FileSearchOutlined,
  TeamOutlined,
  UserAddOutlined,
  TagsOutlined,
  ImportOutlined,
  ApartmentOutlined,
  ToolOutlined,
  WalletOutlined,
  FileDoneOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FilePdfOutlined,
  FieldTimeOutlined,
  BankOutlined,
  SafetyOutlined,
  BookOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];

export const APPS = [
  {
    key: 'crm',
    name: 'CRM',
    description: 'Enquiries, follow-ups and the sales pipeline, synced with Zoho Bigin',
    color: '#722ed1',
    icon: <img className="cm-app-icon-image" src={crmIcon} alt="" aria-hidden="true" />,
    module: 'crm',
    home: '/crm',
    match: ['/crm'],
    shared: ['/cart/quotation', '/quotation/', '/customer/', '/order/'],
    items: [
      { label: 'Pipeline', to: '/crm', icon: <ProjectOutlined /> },
      { label: 'All deals', to: '/crm?view=list', icon: <UnorderedListOutlined /> },
      { label: 'Follow-ups', to: '/crm/follow-ups', icon: <CheckSquareOutlined /> },
      { label: 'New deal', to: '/crm?new=1', action: 'write', icon: <PlusCircleOutlined /> },
    ],
  },
  {
    key: 'quotations',
    name: 'Quotations',
    description: 'Price, share and follow up quotations',
    color: '#d4380d',
    icon: <img className="cm-app-icon-image" src={quotationsIcon} alt="" aria-hidden="true" />,
    module: 'quotations',
    home: '/quotations/list',
    match: ['/quotations', '/quotation/', '/cart/quotation'],
    shared: ['/customer/'],
    items: [
      { label: 'All quotations', to: '/quotations/list', icon: <UnorderedListOutlined /> },
      { label: 'Follow-ups due', to: '/quotations/list?tab=FOLLOWUP', icon: <BellOutlined /> },
      {
        label: 'New quotation',
        to: '/cart/quotation',
        action: 'write',
        icon: <PlusCircleOutlined />,
      },
    ],
  },
  {
    key: 'orders',
    name: 'Orders',
    description: 'Confirm orders, reserve stock, track every order',
    color: '#c41d7f',
    icon: <img className="cm-app-icon-image" src={ordersIcon} alt="" aria-hidden="true" />,
    module: 'orders',
    home: '/orders/list',
    match: ['/orders/list', '/orders/from-quotation', '/order/', '/cart/order'],
    shared: ['/customer/', '/quotation/'],
    items: [
      { label: 'All orders', to: '/orders/list', icon: <UnorderedListOutlined /> },
      { label: 'Late orders', to: '/orders/list?tab=LATE', icon: <ClockCircleOutlined /> },
      { label: 'To dispatch', to: '/orders/list?tab=TODISPATCH', icon: <CarOutlined /> },
      { label: 'Out for delivery', to: '/orders/list?tab=TRANSIT', icon: <FieldTimeOutlined /> },
      {
        label: 'Order from quotation',
        to: '/orders/from-quotation',
        action: 'write',
        icon: <FileDoneOutlined />,
      },
      {
        label: 'New order (blank)',
        to: '/cart/order',
        action: 'write',
        icon: <PlusCircleOutlined />,
      },
    ],
  },
  {
    key: 'operations',
    name: 'Operations',
    description: 'Dispatch, receiving, live stock, product tools and imports',
    color: '#08979c',
    icon: <img className="cm-app-icon-image" src={operationsIcon} alt="" aria-hidden="true" />,
    module: 'inventory',
    home: '/operations',
    match: [
      '/operations',
      '/inventory/',
      '/bulk-import',
      '/jobs/',
      '/job/',
      '/orders/dispatch',
      '/dispatch/',
      '/disptach',
    ],
    shared: ['/order/', '/orders/list', '/product/', '/po/', '/disptach'],
    items: [
      { label: 'Today', to: '/operations', icon: <HomeOutlined /> },
      {
        section: 'Dispatch',
        label: 'Gate passes',
        to: '/operations/gate-passes',
        module: 'orders',
        icon: <IdcardOutlined />,
      },
      {
        label: 'Dispatch history',
        to: '/orders/dispatch/all',
        module: 'orders',
        icon: <HistoryOutlined />,
      },
      { section: 'Stock', label: 'Live stock', to: '/inventory/list', icon: <DatabaseOutlined /> },
      {
        label: 'Receive goods',
        to: '/operations/receive',
        module: 'purchase_orders',
        icon: <InboxOutlined />,
      },
      { label: 'Stock entry & counts', to: '/inventory/stock-workspace', icon: <EditOutlined /> },
      {
        label: 'Waiting for stock',
        to: '/inventory/list?tab=backorders',
        icon: <HourglassOutlined />,
      },
      { label: 'Movements', to: '/inventory/list?tab=movements', icon: <SwapOutlined /> },
      { label: 'Godowns', to: '/inventory/list?tab=godowns', icon: <BankOutlined /> },
      {
        section: 'Product tools & imports',
        label: 'Product tools',
        to: '/inventory/products',
        module: 'products',
        action: 'edit',
        icon: <ToolOutlined />,
      },
      {
        label: 'Bulk import',
        to: '/inventory/import',
        module: 'products',
        action: 'write',
        icon: <ImportOutlined />,
      },
      { label: 'Import jobs', to: '/jobs/list', module: 'jobs', icon: <HistoryOutlined /> },
    ],
  },
  {
    key: 'purchase',
    name: 'Purchase',
    description: 'Vendor quotes and purchase orders',
    color: '#d48806',
    icon: <img className="cm-app-icon-image" src={purchaseIcon} alt="" aria-hidden="true" />,
    module: 'purchase_orders',
    home: '/purchase-manager',
    match: ['/purchase-manager', '/po/', '/fgs/', '/cart/purchase-order'],
    items: [
      { label: 'Purchase orders', to: '/purchase-manager', icon: <ShoppingOutlined /> },
      {
        label: 'New purchase order',
        to: '/cart/purchase-order',
        action: 'write',
        icon: <PlusCircleOutlined />,
      },
      {
        label: 'Vendor quote (FGS)',
        to: '/fgs/add',
        module: 'field_guided_sheets',
        action: 'write',
        icon: <FileSearchOutlined />,
      },
    ],
  },
  {
    key: 'catalogue',
    name: 'Catalogue',
    description: 'Products, brands and categories',
    color: '#531dab',
    icon: <img className="cm-app-icon-image" src={catalogueIcon} alt="" aria-hidden="true" />,
    module: 'products',
    home: '/category-selector',
    match: [
      '/catalogues',
      '/category-selector',
      '/store/',
      '/meta/',
      '/categories-keywords',
      '/product/',
    ],
    items: [
      { label: 'Products', to: '/category-selector', icon: <AppstoreOutlined /> },
      { label: 'Brand catalogues', to: '/catalogues', icon: <BookOutlined /> },
      { label: 'Add product', to: '/product/add', action: 'write', icon: <PlusCircleOutlined /> },
      {
        label: 'Brands, groups & vendors',
        to: '/meta/list',
        module: 'brands',
        icon: <TagsOutlined />,
      },
      {
        label: 'Categories & keywords',
        to: '/categories-keywords/list',
        module: 'categories',
        icon: <ApartmentOutlined />,
      },
    ],
  },
  {
    key: 'accounts',
    name: 'Accounts',
    description: 'GST invoices, payments and money due',
    color: '#0958d9',
    icon: <img className="cm-app-icon-image" src={accountsIcon} alt="" aria-hidden="true" />,
    module: 'orders',
    action: 'edit',
    home: '/accounts',
    match: ['/accounts'],
    shared: ['/order/', '/customer/'],
    items: [
      { label: 'Money due', to: '/accounts', icon: <WalletOutlined /> },
      { label: 'Payments received', to: '/accounts?tab=payments', icon: <BankOutlined /> },
      { label: 'Tax invoices', to: '/accounts?tab=invoices', icon: <FileDoneOutlined /> },
    ],
  },
  {
    key: 'reports',
    name: 'Reports',
    description: 'Sales dashboard and reports',
    color: '#7cb305',
    icon: <img className="cm-app-icon-image" src={reportsIcon} alt="" aria-hidden="true" />,
    home: '/reports/list',
    match: ['/reports', '/dashboard', '/my-day'],
    items: [
      { label: 'My day', to: '/my-day', icon: <FieldTimeOutlined /> },
      { label: 'Sales dashboard', to: '/dashboard', module: 'orders', icon: <DashboardOutlined /> },
      { label: 'Reports', to: '/reports/list', icon: <BarChartOutlined /> },
      { label: 'Printable reports', to: '/reports/pdf', icon: <FilePdfOutlined /> },
    ],
  },
  {
    key: 'settings',
    name: 'Admin Console',
    description: 'Customers, users, roles, activity logs, company and document formats',
    color: '#434343',
    icon: <img className="cm-app-icon-image" src={adminIcon} alt="" aria-hidden="true" />,
    home: '/settings/company',
    match: [
      '/settings',
      '/users/',
      '/user/',
      '/roles-permission',
      '/customers',
      '/customer/',
      '/activity-logs',
    ],
    items: [
      {
        label: 'Company & documents',
        to: '/settings/company',
        adminOnly: true,
        icon: <BankOutlined />,
      },
      { label: 'Document formats', to: '/settings/document-formats', adminOnly: true, icon: <FilePdfOutlined /> },
      { label: 'Organise apps', to: '/settings/apps', adminOnly: true, icon: <AppstoreOutlined /> },
      {
        section: 'Customers',
        label: 'All customers',
        to: '/customers/list',
        module: 'customers',
        icon: <TeamOutlined />,
      },
      {
        label: 'Add customer',
        to: '/customer/add',
        module: 'customers',
        action: 'write',
        icon: <UserAddOutlined />,
      },
      {
        section: 'Administration',
        label: 'Users',
        to: '/users/list',
        module: 'users',
        icon: <TeamOutlined />,
      },
      {
        label: 'Roles & permissions',
        to: '/roles-permission/list',
        module: 'roles',
        icon: <SafetyOutlined />,
      },
      {
        label: 'Activity logs',
        to: '/activity-logs',
        module: 'activity',
        icon: <HistoryOutlined />,
      },
      {
        label: 'Maintenance tools',
        to: '/settings/maintenance',
        adminOnly: true,
        icon: <ToolOutlined />,
      },
    ],
  },
];

/** Screens without an app sidebar: the apps home and search. */
export const HOME_PATHS = ['/', '/apps', '/search'];

/** Apps and menu items this user may open. */
export function configuredApps(configuration, roles = []) {
  const admin = roles.some(r => ADMIN_ROLES.includes(r));
  const entries = configuration?.entries || [];
  const registry = [...APPS, ...entries.filter(e => e.custom && !APPS.some(a => a.key === e.key)).map(e => ({
    ...e, icon: <AppstoreOutlined />, match: [e.home.split('?')[0]],
    items: [{ label: e.name, to: e.home, module: e.module, icon: <AppstoreOutlined /> }],
  }))];
  return registry.map(app => {
    const saved = entries.find(e => e.key === app.key);
    return { ...app, name: saved?.name || app.name, locked: !admin && (saved?.enabled === false || saved?.lockedRoles?.some(r => roles.includes(r))) };
  }).sort((a, b) => {
    const rank = key => { const i = entries.findIndex(e => e.key === key); return i < 0 ? entries.length + APPS.findIndex(a => a.key === key) : i; };
    return rank(a.key) - rank(b.key);
  });
}
export function visibleApps(can, roles = [], configuration) {
  const admin = roles.some((r) => ADMIN_ROLES.includes(r));
  const allowed = (x) =>
    (!x.adminOnly || admin) && (!x.module || can(x.module, x.action || 'view'));
  return configuredApps(configuration, roles).map((app) => {
    const items = app.items.filter((i) =>
      allowed({ ...i, module: i.module || app.module, action: i.action }),
    );
    return {
      ...app,
      // Customer-only users enter the console at an accessible customer page.
      home:
        app.key === 'settings' && !items.some((item) => item.to === app.home)
          ? items[0]?.to
          : app.home,
      items,
    };
  }).filter(
    (app) =>
      app.items.length && (!app.adminOnly || admin) && (!app.module || can(app.module, 'view')),
  );
}

const longest = (apps, pathname, key) => {
  let best = null;
  let bestLen = -1;
  for (const app of apps) {
    for (const m of app[key] || []) {
      if (pathname.startsWith(m) && m.length > bestLen) {
        best = app;
        bestLen = m.length;
      }
    }
  }
  return best;
};

/**
 * Which app a URL belongs to: an exact menu link first, then the app you are
 * already in if it opens this page, then the longest matching prefix.
 */
export function appForPath(pathname, apps = APPS, search = '', currentKey = null) {
  const here = pathname + (search || '');
  const exact = apps.find((app) => (app.items || []).some((i) => i.to === here));
  if (exact) return exact;
  const current = currentKey && apps.find((a) => a.key === currentKey);
  if (
    current &&
    [...(current.match || []), ...(current.shared || [])].some((m) => pathname.startsWith(m))
  )
    return current;
  return longest(apps, pathname, 'match') || longest(apps, pathname, 'shared');
}
