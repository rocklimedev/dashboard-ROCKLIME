import { baseApi } from "../store/baseApi";

export const brandParentCategoryApi = baseApi.injectEndpoints({
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

    // ✅ NEW: UPDATE Brand Parent Category
    updateBrandParentCategory: builder.mutation({
      query: ({ id, name, slug }) => ({
        url: `/brand-parent/${id}`,
        method: "PUT",
        body: { name, slug },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "BPC", id }, // Invalidate specific category
        { type: "BPC", id: "LIST" }, // Invalidate the list
      ],
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

    // OPTIONAL: GET /brand-parent/:id/tree
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
  useUpdateBrandParentCategoryMutation, // ← Added
  useDeleteBrandParentCategoryMutation,
  useAttachBrandsToBpcMutation,
  useDetachBrandFromBpcMutation,
  useGetBpcTreeQuery,
} = brandParentCategoryApi;
