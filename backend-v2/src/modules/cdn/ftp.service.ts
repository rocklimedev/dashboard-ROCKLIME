import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ftp from 'basic-ftp';
import { Readable, Writable } from 'stream';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);

  constructor(private readonly configService: ConfigService) {}

  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  private createBufferWritable() {
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    return {
      writable,
      getBuffer: () => Buffer.concat(chunks),
    };
  }

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    options?: {
      remoteDir?: string;
    },
  ): Promise<string> {
    const client = new ftp.Client();

    client.ftp.verbose =
      this.configService.get('NODE_ENV') === 'development';

    try {
      let baseUrl =
        this.configService.get<string>('MEDIA_BASE_URL') ??
        'https://media.cmtradingco.com';

      baseUrl = baseUrl.trim();

      if (!baseUrl.includes('://')) {
        baseUrl = `https://${baseUrl}`;
      }

      baseUrl = baseUrl
        .replace(/:\/+/, '://')
        .replace(/\/+$/, '');

      const extension =
        path.extname(originalFilename) || '.jpg';

      const filename = `${randomUUID()}${extension}`;

      let remoteDir =
        options?.remoteDir ?? '/product_images';

      if (!remoteDir.startsWith('/')) {
        remoteDir = '/' + remoteDir;
      }

      await client.access({
        host: this.configService.get('FTP_HOST'),
        port: Number(
          this.configService.get('FTP_PORT') ?? 21,
        ),
        user: this.configService.get('FTP_USER'),
        password: this.configService.get('FTP_PASSWORD'),
        secure:
          this.configService.get('FTP_SECURE') === 'true',
        timeout: 0,
      });

      await client.ensureDir(remoteDir);
      await client.cd(remoteDir);

      await client.uploadFrom(
        this.bufferToStream(buffer),
        filename,
      );

      try {
        await client.send(`SITE CHMOD 775 ${filename}`);
      } catch {}

      let finalUrl = `${baseUrl}${remoteDir}/${filename}`;

      finalUrl = finalUrl
        .replace(/\/+/g, '/')
        .replace('https:/', 'https://');

      this.logger.log(`Uploaded: ${finalUrl}`);

      return finalUrl;
    } catch (err) {
      this.logger.error(err);

      throw new Error(`FTP upload failed: ${err.message}`);
    } finally {
      client.close();
    }
  }

  async downloadFile(pathOrUrl: string): Promise<Buffer> {
    const client = new ftp.Client();

    client.ftp.verbose =
      this.configService.get('NODE_ENV') === 'development';

    try {
      let remotePath = pathOrUrl;

      if (pathOrUrl.startsWith('http')) {
        remotePath = new URL(pathOrUrl).pathname;
      }

      await client.access({
        host: this.configService.get('FTP_HOST'),
        port: Number(
          this.configService.get('FTP_PORT') ?? 21,
        ),
        user: this.configService.get('FTP_USER'),
        password: this.configService.get('FTP_PASSWORD'),
        secure:
          this.configService.get('FTP_SECURE') === 'true',
        timeout: 0,
      });

      const { writable, getBuffer } =
        this.createBufferWritable();

      await client.downloadTo(writable, remotePath);

      return getBuffer();
    } catch (err) {
      this.logger.error(err);

      throw new Error(
        `FTP download failed: ${err.message}`,
      );
    } finally {
      client.close();
    }
  }
}