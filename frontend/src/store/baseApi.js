import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "./config";

// Shared baseApi
export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    prepareHeaders: (headers) => {
      // Check both localStorage and sessionStorage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }), // adjust to your backend URL
  tagTypes: [
    "Addresses",
    "Auth",
    "Users",
    "BPC",
    "BPC_BRANDS",
    "BPC_TREE",
    "Brands",
    "Category",
    "Carts",
    "Jobs",
    "Customers",
    "Invoices",
    "Keyword",
    "Notifications",
    "FGS",
    "FGSList",
    "Orders",
    "Comment",
    "ParentCategory",
    "Permissions",
    "PurchaseOrders",
    "Product",
    "ProductMeta",
    "Quotations",
    "RolePermission",
    "Roles",
    "ImportJobs",
    "Search",
    "Teams",
    "Members",
    "Vendors",
    "SiteMap",
    "SiteMapsByCustomer",
  ],
  endpoints: (builder) => ({}), // endpoints will be injected per module
});
