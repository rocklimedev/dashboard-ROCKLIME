import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadOptions {
  remoteDir?: string;
}

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Port of middleware/upload.js `uploadToFtp`. Shared across
 * products/orders/users wherever the legacy app uploaded images via FTP.
 */
@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}

  async uploadToFtp(
    buffer: Buffer,
    filename: string,
    options: UploadOptions = {},
  ): Promise<string> {
    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === 'development';

    try {
      let baseUrl = (
        process.env.MEDIA_BASE_URL || 'https://media.example.com'
      ).trim();
      if (!baseUrl.includes('://')) {
        baseUrl = 'https://' + baseUrl.replace(/^https?:\/\//, '');
      }
      baseUrl = baseUrl.replace(/\/+$/, '');

      const ext = path.extname(filename) || '.jpg';
      const uniqueName = `${uuidv4()}${ext}`;

      let remoteDir = options.remoteDir || '/product_images';
      if (!remoteDir.startsWith('/')) remoteDir = '/' + remoteDir;

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
      } catch {
        /* not all servers support SITE CHMOD - ignore */
      }

      let finalUrl = `${baseUrl}${remoteDir}/${uniqueName}`;
      finalUrl = finalUrl.replace(/([^:]\/)\/+/g, '$1');
      return finalUrl;
    } catch (error: any) {
      throw new Error(`FTP upload failed: ${error.message}`);
    } finally {
      client.close();
    }
  }
}
