"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const expressInstance = app.getHttpAdapter().getInstance();
    expressInstance.set('trust proxy', 1);
    const corsOrigins = config.get('corsOrigins') || [];
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        frameguard: true,
        hsts: { maxAge: 31536000, includeSubDomains: true },
    }));
    app.use(cookieParser());
    expressInstance.disable('x-powered-by');
    app.use((req, res, next) => {
        const blockedPaths = ['/wp-admin', '/wp-login.php', '/phpmyadmin', '/.env'];
        if (blockedPaths.some((p) => req.url.includes(p))) {
            return res.status(444).end();
        }
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    });
    const port = config.get('port') || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Environment: ${config.get('env')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map