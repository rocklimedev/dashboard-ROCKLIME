import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

// Shared baseApi
export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }), // adjust to your backend URL
  tagTypes: [
    "Vendor",
    "Auth",
    "Users",
    "Category",
    "Signature",
    "Customers",
    "Addresses",
    "Product",
    "Brands",
    "BPC",
    "BPC_BRANDS",
    "BPC_TREE",
    "Quotation",
    "Order",
    "Carts",
    "Companies",
    "Contact",
    "Role",
    "Permission",
    "Invoices",
    "Team",
    "RolePermission",
    "Search",
    "Attendance",
    "PO",
    "Log",
    "ProductMeta",
    "Email",
  ],
  endpoints: (builder) => ({}), // endpoints will be injected per module
});
