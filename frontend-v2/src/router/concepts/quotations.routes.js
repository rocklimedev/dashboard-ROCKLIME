// src/routes/concepts/quotations.routes.js
import { Icons } from "../icons.config";

import QuotationList from "../../pages/Quotation/QuotationList";
import AddQuotation from "../../pages/Quotation/AddQuntation";
import QuotationsDetails from "../../pages/Quotation/QuotaionDetails";
import NewQuotationDetails from "../../pages/Quotation/NewQuotationDetails";

export const quotationRoutes = [
  {
    path: "/quotations/list",
    name: "Quotations",
    icon: Icons.file,
    element: <QuotationList />,
  },
  {
    path: "/quotation/add",
    name: "Add Quotations",
    icon: Icons.tags,
    element: <AddQuotation />,
    requiredPermission: { api: "write", module: "quotations" }
  },
  {
    path: "/quotation/:id/view",
    name: "View Quotations",
    icon: Icons.tags,
    element: <QuotationsDetails />,
  },
  {
    path: "/quotation/:id",
    name: "Quotation Details",
    icon: Icons.tags,
    element: <NewQuotationDetails />,
    requiredPermission: { api: "view", module: "quotations" }
  },
];