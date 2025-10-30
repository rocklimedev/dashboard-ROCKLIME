import { createContext, useContext, useState, useEffect } from "react";
import { authApi, useGetMyPermissionsQuery } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Step 1: Load token from storage
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setAuth({ token, user: null, permissions: null });
    }
    setAuthChecked(true);
  }, []);

  // Step 2: Sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token && (!auth || auth.token !== token)) {
        setAuth({ token, user: null, permissions: null });
      } else if (!token && auth?.token) {
        setAuth(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange(); // Immediate check

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [auth]);

  // Step 3: Fetch permissions when token exists
  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useGetMyPermissionsQuery(undefined, {
      skip: !auth?.token, // Only run if logged in
      refetchOnMountOrArgChange: true,
    });

  // Step 4: Update auth state with permissions
  useEffect(() => {
    if (permissionsData && auth?.token) {
      setAuth((prev) => ({
        ...prev,
        permissions: permissionsData.permissions,
        role: permissionsData.role,
      }));
    }
  }, [permissionsData, auth?.token]);

  // Optional: Auto-refresh permissions on reconnect
  useEffect(() => {
    if (auth?.token && !isLoadingPermissions && !permissionsData) {
      // Trigger refetch if permissions missing
    }
  }, [auth?.token, isLoadingPermissions, permissionsData]);

  // Login helper
  const login = (token, user) => {
    return new Promise((resolve) => {
      setAuth({ token, user, permissions: null });
      localStorage.setItem("token", token); // or sessionStorage
      resolve();
    });
  };

  // Logout helper
  const logout = () => {
    return new Promise((resolve) => {
      setAuth(null);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
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
        isLoadingPermissions, // Optional: expose loading state
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
