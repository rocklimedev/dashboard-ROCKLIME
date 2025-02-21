import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://dashboard-crud.onrender.com/api",
  credentials: "include", // Include cookies (for authentication)
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  reducerPath: "api",
  tagTypes: ["Users", "Roles", "Dashboard", "Tasks", "Admins"],
  endpoints: () => ({}), // Empty, extended by other API slices
});
