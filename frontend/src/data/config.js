export const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://dashboard-rocklime-production.up.railway.app/api"
    : "http://localhost:4000/api";
