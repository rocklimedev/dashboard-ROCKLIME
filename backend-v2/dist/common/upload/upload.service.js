"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ftp = require("basic-ftp");
const stream_1 = require("stream");
const uuid_1 = require("uuid");
const path = require("path");
function bufferToStream(buffer) {
    const stream = new stream_1.Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
let UploadService = class UploadService {
    constructor(config) {
        this.config = config;
    }
    async uploadToFtp(buffer, filename, options = {}) {
        const client = new ftp.Client();
        client.ftp.verbose = process.env.NODE_ENV === 'development';
        try {
            let baseUrl = (process.env.MEDIA_BASE_URL || 'https://media.example.com').trim();
            if (!baseUrl.includes('://')) {
                baseUrl = 'https://' + baseUrl.replace(/^https?:\/\//, '');
            }
            baseUrl = baseUrl.replace(/\/+$/, '');
            const ext = path.extname(filename) || '.jpg';
            const uniqueName = `${(0, uuid_1.v4)()}${ext}`;
            let remoteDir = options.remoteDir || '/product_images';
            if (!remoteDir.startsWith('/'))
                remoteDir = '/' + remoteDir;
            await client.access({
                host: process.env.FTP_HOST,
                port: parseInt(process.env.FTP_PORT || '21', 10),
                user: process.env.FTP_USER,
                password: process.env.FTP_PASSWORD,
                secure: process.env.FTP_SECURE === 'true',
            });
            await client.ensureDir(remoteDir);
            await client.cd(remoteDir);
            await client.uploadFrom(bufferToStream(buffer), uniqueName);
            try {
                await client.send(`SITE CHMOD 775 ${uniqueName}`);
            }
            catch {
            }
            let finalUrl = `${baseUrl}${remoteDir}/${uniqueName}`;
            finalUrl = finalUrl.replace(/([^:]\/)\/+/g, '$1');
            return finalUrl;
        }
        catch (error) {
            throw new Error(`FTP upload failed: ${error.message}`);
        }
        finally {
            client.close();
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map