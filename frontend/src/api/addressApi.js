import { baseApi } from "./baseApi";
export const addressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAddress: builder.mutation({
      query: (addressData) => ({
        url: "/address",
        method: "POST",
        body: addressData,
      }),
      invalidatesTags: ["Addresses"],
    }),
    getAllAddresses: builder.query({
      query: () => ({
        url: "/address",
        method: "GET",
      }),
      providesTags: ["Addresses"],
    }),
    getAddressById: builder.query({
      query: (addressId) => ({
        url: `/address/${addressId}`,
        method: "GET",
      }),
      providesTags: ["Addresses"],
    }),
    updateAddress: builder.mutation({
      query: ({ addressId, updatedData }) => ({
        url: `/address/${addressId}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `/address/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Addresses"],
    }),
  }),
});

export const {
  useCreateAddressMutation,
  useGetAllAddressesQuery,
  useGetAddressByIdQuery,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressApi;
