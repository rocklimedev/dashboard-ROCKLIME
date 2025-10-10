import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi"; // Import authApi

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setAuth({ token, user: null });
    }
  }, []);

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
