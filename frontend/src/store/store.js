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
import { invoiceApi } from "../api/invoiceApi";
import { teamApi } from "../api/teamApi";
import { rolePermissionsApi } from "../api/rolePermissionApi";
import { searchApi } from "../api/searchApi";
import { attendanceApi } from "../api/attendanceApi";
import { brandParentCategoryApi } from "../api/brandParentCategoryApi";
import { productMetaApi } from "../api/productMetaApi";
import { contactApi } from "../api/contactApi";
import emailReducer from "../api/emailSlice";
import { poApi } from "../api/poApi";
export const store = configureStore({
  reducer: {
    email: emailReducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [productMetaApi.reducerPath]: productMetaApi.reducer,
    [brandParentCategoryApi.reducerPath]: brandParentCategoryApi.reducer,
    [vendorApi.reducerPath]: vendorApi.reducer,
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
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [rolePermissionsApi.reducerPath]: rolePermissionsApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [poApi.reducerPath]: poApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      contactApi.middleware,
      poApi.middleware,
      productMetaApi.middleware,
      vendorApi.middleware,
      brandParentCategoryApi.middleware,
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
      permissionsApi.middleware,
      invoiceApi.middleware,
      teamApi.middleware,
      rolePermissionsApi.middleware,
      searchApi.middleware,
      attendanceApi.middleware
    ),
});

export default store;
