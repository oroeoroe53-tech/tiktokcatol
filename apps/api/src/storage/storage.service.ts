import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { EnvConfig } from '../config/env.validation';

/**
 * Abstracción sobre almacenamiento de objetos compatible con S3.
 * En desarrollo apunta a MinIO (docker-compose). En producción, el mismo
 * código sirve apuntando a AWS S3 / Cloudflare R2 / Backblaze B2 cambiando
 * solo variables de entorno.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.bucket = this.config.get('S3_BUCKET', { infer: true });
    this.publicUrl = this.config.get('S3_PUBLIC_URL', { infer: true }).replace(/\/$/, '');
    this.client = new S3Client({
      endpoint: this.config.get('S3_ENDPOINT', { infer: true }),
      region: this.config.get('S3_REGION', { infer: true }),
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        // Lectura pública anónima para servir vídeos/miniaturas directamente (equivalente a un CDN en local).
        await this.client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: '*',
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${this.bucket}/*`],
                },
              ],
            }),
          }),
        );
        this.logger.log(`Bucket "${this.bucket}" creado en el almacenamiento de objetos`);
      } catch (createError) {
        this.logger.warn(
          `No se pudo verificar/crear el bucket "${this.bucket}": ${(createError as Error).message}`,
        );
      }
    }
  }

  async createUploadUrl(key: string, contentType: string, expiresInSeconds = 900): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async createDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  buildVideoKey(userId: string, videoId: string, extension: string): string {
    return `videos/${userId}/${videoId}/original.${extension}`;
  }

  buildProcessedKey(userId: string, videoId: string): string {
    return `videos/${userId}/${videoId}/720p.mp4`;
  }

  buildThumbnailKey(userId: string, videoId: string): string {
    return `videos/${userId}/${videoId}/thumbnail.jpg`;
  }
}
