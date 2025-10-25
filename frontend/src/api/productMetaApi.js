import { baseApi } from "./baseApi";
export const productMetaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /
    createProductMeta: builder.mutation({
      query: (newData) => ({
        url: "/product-meta/",
        method: "POST",
        body: newData,
      }),
      invalidatesTags: ["ProductMeta"],
    }),

    // GET /
    getAllProductMeta: builder.query({
      query: () => "/product-meta/",
      providesTags: ["ProductMeta"],
    }),

    // GET /search?title=...
    getProductMetaByTitle: builder.query({
      query: (title) =>
        `/product-meta/search?title=${encodeURIComponent(title)}`,
      providesTags: ["ProductMeta"],
    }),

    // GET /:id
    getProductMetaById: builder.query({
      query: (id) => `/product-meta/${id}`,
      providesTags: (result, error, id) => [{ type: "ProductMeta", id }],
    }),

    // PUT /:id
    updateProductMeta: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/product-meta/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ProductMeta", id }],
    }),

    // DELETE /:id
    deleteProductMeta: builder.mutation({
      query: (id) => ({
        url: `/product-meta/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "ProductMeta", id }],
    }),
  }),
});

export const {
  useCreateProductMetaMutation,
  useGetAllProductMetaQuery,
  useGetProductMetaByTitleQuery,
  useGetProductMetaByIdQuery,
  useUpdateProductMetaMutation,
  useDeleteProductMetaMutation,
} = productMetaApi;
