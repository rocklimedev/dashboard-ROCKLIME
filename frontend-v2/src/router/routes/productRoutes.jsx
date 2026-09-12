// src/routes/productRoutes.js
import { FaThLarge } from "react-icons/fa";
import ProductsList from "../../concepts/Products/ProductList";
import CreateProduct from "../../concepts/Products/CreateProduct";
import ProductDetails from "../../concepts/Products/ProductDetails";
import BulkProductImport from "../../concepts/Products/BulkProductImport";
import BrandSelection from "../../concepts/Products/BrandSelection";

import BulkProductImportJob from "../../concepts/Products/ImportJob";
import ProductInventoryPage from "../../concepts/Products/ProductInventoryPage";

export const productRoutes = [
  {
    path: "/product/add",
    name: "Create Product",
    icon: <FaThLarge />,
    isSidebarActive: false,
    element: <CreateProduct />,
  },
  {
    path: "/product/:id",
    name: "Product Details",
    icon: <FaThLarge />,
    isSidebarActive: false,
    element: <ProductDetails />,
  },
  {
    path: "/product/:productId/edit",
    name: "Edit Product",
    icon: <FaThLarge />,
    isSidebarActive: false,
    element: <CreateProduct />,
  },
  {
    path: "/store/:id",
    name: "Products",
    icon: <FaThLarge />,
    element: <ProductsList />,
    isSidebarActive: false,
  },
  {
    path: "/category-selector/:bpcId",
    name: "Products",
    icon: <FaThLarge />,
    element: <BrandSelection />,
    isSidebarActive: false,
  },

  {
    path: "/bulk-import",
    name: "Bulk Product Import",
    element: <BulkProductImport />,
    isSidebarActive: false,
  },
  {
    path: "/product/:id/inventory",
    name: "Product Inventory",
    element: <ProductInventoryPage />,
    isSidebarActiveL: false,
  },
  {
    path: "/inventory/import",
    name: "Bulk Product Import",
    element: <BulkProductImportJob />,
    isSidebarActive: false,
  },
];
