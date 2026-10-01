import { ConfigService } from '@nestjs/config';
export interface UploadOptions {
    remoteDir?: string;
}
export declare class UploadService {
    private readonly config;
    constructor(config: ConfigService);
    uploadToFtp(buffer: Buffer, filename: string, options?: UploadOptions): Promise<string>;
}
