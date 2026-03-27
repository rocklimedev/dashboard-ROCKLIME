// src/routes/productRoutes.js
import { FaThLarge } from "react-icons/fa";
import ProductsList from "../../concepts/Products/ProductList";
import CreateProduct from "../../concepts/Products/CreateProduct";
import ProductDetails from "../../concepts/Products/ProductDetails";
import BulkProductImport from "../../concepts/Products/BulkProductImport";
import BrandSelection from "../../concepts/Products/BrandSelection";
import CategoryManagement from "../../concepts/Products/CategoryManagement";

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
    path: "/inventory/categories-keywords",
    name: "Categories",
    icon: <FaThLarge />,
    element: <CategoryManagement />,
    isSidebarActive: true,
  },
  {
    path: "/job/add",
    name: "Bulk Product Import",
    element: <BulkProductImport />,
    isSidebarActive: false,
  },
];
