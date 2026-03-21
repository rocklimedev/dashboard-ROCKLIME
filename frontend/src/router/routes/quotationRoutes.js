// src/routes/quotationRoutes.js
import { FaTags } from "react-icons/fa";
import QuotationList from "../../concepts/Quotation/QuotationList";
import AddQuotation from "../../concepts/Quotation/AddQuntation";
import NewQuotationsDetails from "../../concepts/Quotation/NewQuotationDetails";

export const quotationRoutes = [
  {
    path: "/quotation/add",
    name: "Add Quotations",
    icon: <FaTags />,
    element: <AddQuotation />,
    isSidebarActive: false,
    requiredPermission: { api: "write", module: "quotations" },
  },
  {
    path: "/quotation/:id",
    name: "Quotations Details",
    icon: <FaTags />,
    isSidebarActive: false,
    element: <NewQuotationsDetails />,
    requiredPermission: { api: "view", module: "quotations" },
  },
  {
    path: "/quotation/:id/edit",
    name: "Edit Quotations",
    icon: <FaTags />,
    element: <AddQuotation />,
    isSidebarActive: false,
    requiredPermission: { api: "edit", module: "quotations" },
  },
];