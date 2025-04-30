import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      // Optional: parse user from token if needed
      setAuth({ token, user: null }); // or decode token if it has user info
    }
  }, []);

  const login = (token, user) => {
    setAuth({ token, user });
    localStorage.setItem("token", token); // You might want to control whether to use localStorage/sessionStorage here
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
