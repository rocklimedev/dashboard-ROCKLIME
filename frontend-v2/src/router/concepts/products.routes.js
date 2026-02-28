// src/routes/concepts/products.routes.js
import { Icons } from "../icons.config";

import Product from "../../pages/Products/Product";
import ProductDetails from "../../pages/Products/ProductDetails";
import CreateProduct from "../../pages/Products/CreateProduct";
import ProductsList from "../../pages/Products/ProductList";
import BrandSelection from "../../pages/Products/BrandSelection";

export const productRoutes = [
  {
    path: "/category-selector",
    name: "Products",
    icon: Icons.products,
    element: <Product />,
  },
  {
    path: "/product/add",
    name: "Create Product",
    icon: Icons.products,
    element: <CreateProduct />,
    requiredPermission: { api: "write", module: "products" }
  },
  {
    path: "/product/:id",
    name: "Product Details",
    icon: Icons.products,
    element: <ProductDetails />,
  },
  {
    path: "/product/:productId/edit",
    name: "Edit Product",
    icon: Icons.products,
    element: <CreateProduct />,
    requiredPermission: { api: "edit", module: "products" }
  },
  {
    path: "/store/:id",
    name: "Store Products",
    icon: Icons.products,
    element: <ProductsList />,
  },
  {
    path: "/category-selector/:bpcId",
    name: "Products",
    icon: Icons.products,
    element: <BrandSelection />,
  },
];