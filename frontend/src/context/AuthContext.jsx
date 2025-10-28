import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi"; // Import authApi

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setAuth((prev) => {
        if (prev?.token !== token) {
          return { token, user: null };
        }
        return prev;
      });
    } else if (auth?.token) {
      setAuth(null);
    }
  }, []); // Still only on mount

  // Add this: Listen for storage events (cross-tab or programmatic changes)
  useEffect(() => {
    const handleStorageChange = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token && (!auth || auth.token !== token)) {
        setAuth({ token, user: null });
      } else if (!token && auth?.token) {
        setAuth(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check immediately in case sessionStorage was set programmatically
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [auth]);
  const login = (token, user) => {
    return new Promise((resolve) => {
      setAuth({ token, user });
      resolve();
    });
  };

  const logout = () => {
    return new Promise((resolve) => {
      setAuth(null);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      resolve();
    });
  };
  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
