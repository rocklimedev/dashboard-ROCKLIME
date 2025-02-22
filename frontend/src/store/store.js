import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import { vendorApi } from "../api/vendorApi";
import { authApi } from "../api/authApi";
import { categoryApi } from "../api/categoryApi";
import { signatureApi } from "../api/signatureApi";

export const store = configureStore({
  reducer: {
    [vendorApi.reducerPath]: vendorApi.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [signatureApi.reducerPath]: signatureApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, vendorApi.middleware, authApi.middleware, categoryApi.middleware, signatureApi.middleware),
});

export default store;
