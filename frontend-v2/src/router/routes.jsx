// src/routes/index.routes.js

import { authRoutes } from "./concepts/auth.routes";
import { productRoutes } from "./concepts/products.routes";
import { quotationRoutes } from "./concepts/quotations.routes";
import { orderRoutes } from "./concepts/orders.routes";
import { customerRoutes } from "./concepts/customers.routes";
import { inventoryRoutes } from "./concepts/inventory.routes";
import { sitemapRoutes } from "./concepts/sitemap.routes";
import { rbacRoutes } from "./concepts/rbac.routes";
import { purchaseRoutes } from "./concepts/purchase.routes";
import { jobsRoutes } from "./concepts/jobs.routes";
import { miscRoutes } from "./concepts/misc.routes";

export const masterRoutes = [
  ...authRoutes,
  ...productRoutes,
  ...quotationRoutes,
  ...orderRoutes,
  ...customerRoutes,
  ...inventoryRoutes,
  ...sitemapRoutes,
  ...rbacRoutes,
  ...purchaseRoutes,
  ...jobsRoutes,
  ...miscRoutes,
];