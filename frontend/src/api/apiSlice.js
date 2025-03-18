import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
const baseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}`,
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
