import { lazy } from "react";
// src/routes/productRoutes.js
import { FaThLarge } from "react-icons/fa";
const ProductsList = lazy(() => import("../../concepts/Products/ProductList"));
const CreateProduct = lazy(() => import("../../concepts/Products/CreateProduct"));
const ProductDetails = lazy(() => import("../../concepts/Products/ProductDetails"));
const BulkProductImport = lazy(() => import("../../concepts/Products/BulkProductImport"));
const BrandSelection = lazy(() => import("../../concepts/Products/BrandSelection"));

const BulkProductImportJob = lazy(() => import("../../concepts/Products/ImportJob"));
const ProductInventoryPage = lazy(() => import("../../concepts/Products/ProductInventoryPage"));
const ProductReferencesPage = lazy(() => import("../../concepts/Products/ProductReferencesPage"));
const OnboardNewBrandWorkspace = lazy(() => import("../../concepts/Products/OnboardNewBrandWorkspace"));
const InventoryWrapper = lazy(() => import("../../concepts/Products/InventoryWrapper"));

export const productRoutes = [
  { path: "/inventory/products", name: "Product Tools", isSidebarActive: false, element: <InventoryWrapper /> },
  { path: "/inventory/onboard-new-brand", name: "Onboard New Brand Workspace", isSidebarActive: false, element: <OnboardNewBrandWorkspace /> },
  {
    path: "/inventory/:productId/references",
    name: "Product References",
    isSidebarActive: false,
    element: <ProductReferencesPage />,
  },
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
