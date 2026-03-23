import { configureStore } from "@reduxjs/toolkit";
import emailReducer from "../api/emailSlice";
import { baseApi } from "./baseApi";
export const store = configureStore({
  reducer: {
    email: emailReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
