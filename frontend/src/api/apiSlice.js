import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:4000/api",
  credentials: "include", // Include cookies (for authentication)
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("accessToken");
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
