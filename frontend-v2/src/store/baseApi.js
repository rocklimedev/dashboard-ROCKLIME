import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from './config';

// Shared baseApi
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}`,
  prepareHeaders: (headers) => {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// A 401 means the login is no longer valid (expired, or the user was
// deactivated): clear it and send the user to the login page once.
let redirecting = false;
const baseQueryWithAuthCheck = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args?.url || '';
  if (
    result.error?.status === 401 &&
    !url.startsWith('/auth/login') &&
    !redirecting &&
    window.location.pathname !== '/login'
  ) {
    redirecting = true;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.assign('/login?expired=1');
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: [
    'Zoho',
    'Cliq',
    'Crm',
    'Addresses',
    'Auth',
    'Users',
    'BPC',
    'BPC_BRANDS',
    'BPC_TREE',
    'Brands',
    'Category',
    'Carts',
    'Jobs',
    'Customers',
    'Invoices',
    'Keyword',
    'Notifications',
    'FGS',
    'FGSList',
    'Orders',
    'OrderDispatches',
    'OrderActivity',
    'OrderCreditNotes',
    'Comment',
    'ParentCategory',
    'Permissions',
    'PurchaseOrders',
    'Product',
    'ProductMeta',
    'Quotations',
    'RolePermission',
    'ProductInventory',
    'Roles',
    'ImportJobs',
    'Search',
    'Teams',
    'Members',
    'Vendors',
    'SiteMap',
    'SiteMapsByCustomer',
    'Stock',
    'Catalogues',
    'Warehouses',
    'StockCounts',
    'Settings',
    'Payments',
  ],
  endpoints: (builder) => ({}), // endpoints will be injected per module
});
