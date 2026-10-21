// Local setup: the backend URL comes from VITE_BACKEND_URL (see .env.development.local).
// Falls back to the original behaviour when it is not set.
const ENV_BACKEND = import.meta.env.VITE_BACKEND_URL;
export const API_URL = ENV_BACKEND
  ? `${ENV_BACKEND.replace(/\/+$/, '')}/api`
  : process.env.NODE_ENV === 'production'
    ? 'https://cm-sanitary-api.cmtradingco.com/api'
    : 'http://localhost:4000/api';
//export const API_URL = "https://api.cmtradingco.com/api";
