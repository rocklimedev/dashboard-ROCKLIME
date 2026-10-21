const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:5173',
    'https://dashboard-rocklime.vercel.app',
    'https://cmtradingco.vercel.app',
    'https://dashboard-cmtradingco.vercel.app',
    'http://erp.cmtradingco.com',
    'https://erp.cmtradingco.com',
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
  ],
  credentials: true,
  exposedHeaders: [
    'X-Quotation-Pages',
    'Content-Disposition',
    'Accept-Ranges',
    'Content-Range',
    'Content-Length',
  ],
};

module.exports = { corsOptions };
