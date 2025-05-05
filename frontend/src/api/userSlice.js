// userSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { rolesApi } from "./rolesApi"; // Assuming rolesApi is a RTK slice
import { permissionsApi } from "./permissionApi"; // Assuming permissionsApi is a RTK slice

const initialState = {
  isAuthenticated: false,
  role: "",
  permissions: [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.permissions = action.payload.permissions;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = "";
      state.permissions = [];
    },
  },
  extraReducers: (builder) => {
    // Update role and permission state based on API responses
    builder.addMatcher(
      rolesApi.endpoints.getRoles.matchFulfilled,
      (state, { payload }) => {
        state.role = payload.role;
      }
    );
    builder.addMatcher(
      permissionsApi.endpoints.getPermissions.matchFulfilled,
      (state, { payload }) => {
        state.permissions = payload.permissions;
      }
    );
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
