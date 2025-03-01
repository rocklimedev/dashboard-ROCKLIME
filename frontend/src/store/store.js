import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import { vendorApi } from "../api/vendorApi";
import { authApi } from "../api/authApi";
import { categoryApi } from "../api/categoryApi";
import { signatureApi } from "../api/signatureApi";
import { customerApi } from "../api/customerApi";
import { addressApi } from "../api/addressApi";
import { userApi } from "../api/userApi";
import { keywordApi } from "../api/keywordApi";
import { parentCategoryApi } from "../api/parentCategoryApi";
import { productApi } from "../api/productApi";
export const store = configureStore({
  reducer: {
    [vendorApi.reducerPath]: vendorApi.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [signatureApi.reducerPath]: signatureApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [addressApi.reducerPath]: addressApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [keywordApi.reducerPath]: keywordApi.reducer,
    [parentCategoryApi.reducerPath]: parentCategoryApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      vendorApi.middleware,
      authApi.middleware,
      categoryApi.middleware,
      signatureApi.middleware,
      customerApi.middleware,
      addressApi.middleware,
      userApi.middleware,
      keywordApi.middleware,
      parentCategoryApi.middleware,
      productApi.middleware
    ),
});

export default store;
