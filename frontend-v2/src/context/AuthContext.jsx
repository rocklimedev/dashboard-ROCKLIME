// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useGetMyPermissionsQuery,
  useValidateTokenQuery,
} from "../api/authApi";
import { isTokenExpired, clearAuthStorage } from "./jwt";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [storedToken, setStoredToken] = useState(null);

  // ────── STEP 1: Load token from storage ──────
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      setAuthChecked(true);
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthStorage();
      setAuthChecked(true);
      return;
    }

    setStoredToken(token);
  }, []);

  // ────── STEP 2: Validate token (only if we have one) ──────
  const {
    isLoading: isValidating,
    isSuccess: isTokenValid,
    isError: isTokenInvalid,
    error: validationError,
  } = useValidateTokenQuery(undefined, {
    skip: !storedToken,
  });

  // ────── STEP 3: Finalize auth AFTER validation completes ──────
  useEffect(() => {
    if (!storedToken) return;

    // Wait until validation is done
    if (isValidating) return;

    if (isTokenValid) {
      setAuth({ token: storedToken, user: null, permissions: null });
    } else if (isTokenInvalid) {
      clearAuthStorage();
      setAuth(null);
    }

    // ← Always set authChecked = true once validation is done
    setAuthChecked(true);
  }, [
    storedToken,
    isValidating,
    isTokenValid,
    isTokenInvalid,
    validationError,
  ]);

  // ────── STEP 4: Sync across tabs ──────
  useEffect(() => {
    const handleStorage = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token && (!auth || auth.token !== token)) {
        setAuth({ token, user: null, permissions: null });
      } else if (!token && auth?.token) {
        setAuth(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [auth]);

  // ────── STEP 5: Fetch permissions ──────
  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useGetMyPermissionsQuery(undefined, {
      skip: !auth?.token,
      refetchOnMountOrArgChange: true,
    });

  useEffect(() => {
    if (permissionsData && auth?.token) {
      setAuth((prev) => ({
        ...prev,
        permissions: permissionsData.permissions,
        role: permissionsData.role,
      }));
    }
  }, [permissionsData, auth?.token]);

  // ────── Helpers ──────
  const login = (token, user = null) => {
    return new Promise((resolve) => {
      setAuth({ token, user, permissions: null });
      sessionStorage.setItem("token", token);
      resolve();
    });
  };

  const logout = () => {
    return new Promise((resolve) => {
      setAuth(null);
      clearAuthStorage();
      resolve();
    });
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        login,
        logout,
        authChecked,
        isLoadingPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
