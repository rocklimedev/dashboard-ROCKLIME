const { apiLimiter, burstLimiter } = require('../middleware/rateLimit');

const routes = {
  tasks: require('../modules/tasks/task.route'),
  calendar: require('../modules/calendar/calendar.route'),
  operations: require('../modules/operations/operations.route'),
  auth: require('../modules/auth/auth.route'),
  user: require('../modules/users/user.route'),
  vendor: require('../modules/vendors/vendor.route'),
  fgs: require('../modules/purchase-order/fgs.route'),
  order: require('../modules/orders/order.route'),
  roles: require('../modules/rbac/roles.route'),
  permission: require('../modules/rbac/permission.route'),
  address: require('../modules/address/address.route'),
  category: require('../modules/brands/category.route'),
  parentCategory: require('../modules/brands/parent-category.route'),
  customer: require('../modules/customers/customer.route'),
  brand: require('../modules/brands/brands.route'),
  keyword: require('../modules/brands/keyword.route'),
  product: require('../modules/products/products.route'),
  brandParent: require('../modules/brands/brand-parentcategory.route'),
  rolePermission: require('../modules/rbac/role-permission.route'),
  search: require('../modules/search/search.route'),
  jobs: require('../modules/jobs/jobs.route'),
  cart: require('../modules/cart/cart.route'),
  quotation: require('../modules/quotations/quotation.route'),
  team: require('../modules/users/teams.route'),
  productMeta: require('../modules/products/product-meta.route'),
  purchaseOrder: require('../modules/purchase-order/purchase-order.route'),
  notification: require('../modules/engagement/notification.route'),
  cachedPermission: require('../modules/rbac/cached-permission.route'),
  activity: require('../modules/engagement/activity.route'),
  dashboard: require('../modules/dashboard/dashboard.route'),
  stock: require('../modules/stock/stock.route'),
  settings: require('../modules/settings/settings.route'),
  public: require('../modules/public/public.route'),
  payments: require('../modules/payments/payment.route'),
  invoices: require('../modules/invoices/invoice.route'),
  reports: require('../modules/reports/reports.route'),
  catalogues: require('../modules/catalogues/catalogue.route'),
  crm: require('../modules/crm/crm.route'),
  cliq: require('../modules/zoho/cliq/cliq.route'),
  zoho: require('../modules/zoho/zoho.route'),
};

function registerRoutes(app) {
  app.use('/api', apiLimiter);
  app.use('/api/tasks', routes.tasks);
  app.use('/api/calendar/events', routes.calendar);
  app.use('/api/carts', burstLimiter);
  app.use('/api/order', burstLimiter);
  app.use('/api/quotation', burstLimiter);
  app.use('/api/auth', routes.auth);
  app.use('/api/user', routes.user);
  app.use('/api/order', routes.order);
  app.use('/api/roles', routes.roles);
  app.use('/api/permission', routes.permission);
  app.use('/api/address', routes.address);
  app.use('/api/carts', routes.cart);
  app.use('/api/category', routes.category);
  app.use('/api/vendors', routes.vendor);
  app.use('/api/parent-categories', routes.parentCategory);
  app.use('/api/brand-parent', routes.brandParent);
  app.use('/api/customers', routes.customer);
  app.use('/api/brands', routes.brand);
  app.use('/api/keyword', routes.keyword);
  app.use('/api/products', routes.product);
  app.use('/api/quotation', routes.quotation);
  app.use('/api/role-permissions', routes.rolePermission);
  app.use('/api/teams', routes.team);
  app.use('/api/search', routes.search);
  app.use('/api/purchase-orders', routes.purchaseOrder);
  app.use('/api/product-meta', routes.productMeta);
  app.use('/api/notifications', routes.notification);
  app.use('/api/cached-permissions', routes.cachedPermission);
  app.use('/api/fgs', routes.fgs);
  app.use('/api/jobs', routes.jobs);
  app.use('/api/activity', routes.activity);
  app.use('/api/operations', routes.operations);
  app.use('/api/dashboard', routes.dashboard);
  app.use('/api/stock', routes.stock);
  app.use('/api/settings', routes.settings);
  app.use('/api/payments', routes.payments);
  app.use('/api/invoices', routes.invoices);
  app.use('/api/reports', routes.reports);
  app.use('/api/catalogues', routes.catalogues);
  app.use('/api/crm', routes.crm);
  app.use('/api/zoho', routes.zoho);
  app.use('/api/cliq', routes.cliq);
  app.use('/api/public', burstLimiter, routes.public);
}
module.exports = { registerRoutes };
