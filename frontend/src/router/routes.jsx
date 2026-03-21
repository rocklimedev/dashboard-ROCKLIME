// src/routes/index.js  (or masterRoutes.js)

import { sidebarRoutes } from "./routes/sidebarRoutes";
import { authRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";
import { customerRoutes } from "./routes/customerRoutes";
import { productRoutes } from "./routes/productRoutes";
import { orderRoutes } from "./routes/orderRoutes";
import { quotationRoutes } from "./routes/quotationRoutes";
import { purchaseRoutes } from "./routes/purchaseRoutes";
import { errorRoutes } from "./routes/errorRoutes";
import { otherRoutes } from "./routes/otherRoutes";

const masterRoutes = [
  ...authRoutes,
  ...userRoutes,
  ...customerRoutes,
  ...productRoutes,
  ...orderRoutes,
  ...quotationRoutes,
  ...purchaseRoutes,
  ...errorRoutes,
  ...otherRoutes,
  ...sidebarRoutes,
];

export default masterRoutes;
