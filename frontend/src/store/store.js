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
import { brandApi } from "../api/brandsApi";
import { quotationApi } from "../api/quotationApi";
import { orderApi } from "../api/orderApi";
import { cartApi } from "../api/cartApi";
import { companyApi } from "../api/companyApi";
import { rolesApi } from "../api/rolesApi";
import { permissionsApi } from "../api/permissionApi";
export const store = configureStore({
  reducer: {
    [vendorApi.reducerPath]: vendorApi.reducer,
    // [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [signatureApi.reducerPath]: signatureApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [addressApi.reducerPath]: addressApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [keywordApi.reducerPath]: keywordApi.reducer,
    [parentCategoryApi.reducerPath]: parentCategoryApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [quotationApi.reducerPath]: quotationApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [permissionsApi.reducerPath]: permissionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // apiSlice.middleware,
      vendorApi.middleware,
      authApi.middleware,
      categoryApi.middleware,
      signatureApi.middleware,
      customerApi.middleware,
      addressApi.middleware,
      userApi.middleware,
      keywordApi.middleware,
      parentCategoryApi.middleware,
      productApi.middleware,
      brandApi.middleware,
      quotationApi.middleware,
      orderApi.middleware,
      cartApi.middleware,
      companyApi.middleware,
      rolesApi.middleware,
      permissionsApi.middleware
    ),
});

export default store;
