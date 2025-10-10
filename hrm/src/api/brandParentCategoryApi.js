// src/services/brandParentCategoryApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";
export const brandParentCategoryApi = createApi({
  reducerPath: "brandParentCategoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      // const token = getState()?.auth?.token;
      // if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["BPC", "BPC_BRANDS", "BPC_TREE"],
  endpoints: (builder) => ({
    // POST /brand-parent
    createBrandParentCategory: builder.mutation({
      query: ({ name, slug }) => ({
        url: `/brand-parent`,
        method: "POST",
        body: { name, slug },
      }),
      invalidatesTags: [{ type: "BPC", id: "LIST" }],
    }),

    // GET /brand-parent
    getBrandParentCategories: builder.query({
      query: () => `/brand-parent`,
      providesTags: (result) =>
        result
          ? [
              { type: "BPC", id: "LIST" },
              ...result.map((bpc) => ({ type: "BPC", id: bpc.id })),
            ]
          : [{ type: "BPC", id: "LIST" }],
    }),

    // GET /brand-parent/:id
    getBrandParentCategoryById: builder.query({
      query: (id) => `/brand-parent/${id}`,
      providesTags: (result, error, id) => [{ type: "BPC", id }],
    }),

    // DELETE /brand-parent/:id
    deleteBrandParentCategory: builder.mutation({
      query: (id) => ({
        url: `/brand-parent/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "BPC", id },
        { type: "BPC", id: "LIST" },
      ],
    }),

    // POST /brand-parent/:id/brands  (body: { brandIds: [] })
    attachBrandsToBpc: builder.mutation({
      query: ({ id, brandIds }) => ({
        url: `/brand-parent/${id}/brands`,
        method: "POST",
        body: { brandIds },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "BPC", id },
        { type: "BPC_BRANDS", id },
      ],
    }),

    // DELETE /brand-parent/:id/brands/:brandId
    detachBrandFromBpc: builder.mutation({
      query: ({ id, brandId }) => ({
        url: `/brand-parent/${id}/brands/${brandId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "BPC", id },
        { type: "BPC_BRANDS", id },
      ],
    }),

    // OPTIONAL: GET /brand-parent/:id/tree  (add this route in your server if needed)
    getBpcTree: builder.query({
      query: (id) => `/brand-parent/${id}/tree`,
      providesTags: (result, error, id) => [
        { type: "BPC_TREE", id },
        { type: "BPC", id },
      ],
    }),
  }),
});

export const {
  useCreateBrandParentCategoryMutation,
  useGetBrandParentCategoriesQuery,
  useGetBrandParentCategoryByIdQuery,
  useDeleteBrandParentCategoryMutation,
  useAttachBrandsToBpcMutation,
  useDetachBrandFromBpcMutation,
  useGetBpcTreeQuery, // only use if you implemented the /tree route
} = brandParentCategoryApi;
