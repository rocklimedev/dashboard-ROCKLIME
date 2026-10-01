"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    app: {
        name: 'ROCKLIME DASHBOARD Backend',
        apiUrl: process.env.BASE_API_URL,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    },
    database: {
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    mongo: {
        uri: process.env.MONGO_URI,
    },
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '7d',
        refreshSecret: process.env.REFRESH_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    },
    mail: {
        resendApiKey: process.env.RESEND_API_KEY,
        from: process.env.MAIL_FROM,
    },
    corsOrigins: [
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
    ],
});
//# sourceMappingURL=configuration.js.map