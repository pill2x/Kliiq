import * as https from 'https';
import * as http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import * as os from 'os';
import { URL } from 'url';

interface DownloadOptions {
  onProgress?: (progress: number) => void;
  timeout?: number;
}

export class DownloadService {
  private downloadDir = path.join(os.tmpdir(), 'kliiq-downloads');

  async downloadFile(fileUrl: string, options: DownloadOptions = {}): Promise<string> {
    try {
      // Ensure download directory exists
      await fs.mkdir(this.downloadDir, { recursive: true });

      // Parse URL and prepare download
      const url = new URL(fileUrl);
      const fileName = path.basename(url.pathname) || `installer_${Date.now()}.exe`;
      const filePath = path.join(this.downloadDir, fileName);

      // Stream download with progress
      return new Promise((resolve, reject) => {
        const protocol = url.protocol === 'https:' ? https : http;
        const timeout = options.timeout || 300000; // 5 minutes default

        const request = protocol.get(fileUrl, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.downloadFile(redirectUrl, options)
                .then(resolve)
                .catch(reject);
              return;
            }
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Download failed with status ${response.statusCode}`));
            return;
          }

          const contentLength = parseInt(response.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;

          const writeStream = require('fs').createWriteStream(filePath);

          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;

            if (contentLength > 0 && options.onProgress) {
              const progress = Math.round((downloadedBytes / contentLength) * 100);
              options.onProgress(Math.min(progress, 99)); // Cap at 99 until complete
            }
          });

          response.pipe(writeStream);

          writeStream.on('finish', () => {
            if (options.onProgress) {
              options.onProgress(100);
            }
            writeStream.close();
            resolve(filePath);
          });

          writeStream.on('error', (err: Error) => {
            writeStream.close();
            reject(err);
          });
        });

        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Download timeout'));
        });

        request.on('error', (err: Error) => {
          reject(err);
        });

        request.setTimeout(timeout);
      });
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileSize(fileUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = new URL(fileUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      const request = protocol.head(fileUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.getFileSize(redirectUrl).then(resolve).catch(reject);
            return;
          }
        }

        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        resolve(contentLength);
      });

      request.on('error', reject);
    });
  }

  async verifyDownload(filePath: string, expectedSize?: number): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      
      if (expectedSize && stat.size !== expectedSize) {
        return false;
      }

      return stat.isFile() && stat.size > 0;
    } catch {
      return false;
    }
  }

  async clearDownloadCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.downloadDir);

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        const stat = await fs.stat(filePath);

        // Delete files older than 24 hours
        const ageInMs = Date.now() - stat.mtime.getTime();
        if (ageInMs > 24 * 60 * 60 * 1000) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to clear download cache:', error);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}
