export const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://dashboard-rocklime.onrender.com/api"
    : "http://localhost:4000/api";
// export const API_URL = "https://dashboard-rocklime.onrender.com/api"
