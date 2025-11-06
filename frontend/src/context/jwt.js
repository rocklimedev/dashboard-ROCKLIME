// src/utils/jwt.js
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp < Date.now() / 1000;
  } catch {
    return true; // malformed → treat as expired
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};
