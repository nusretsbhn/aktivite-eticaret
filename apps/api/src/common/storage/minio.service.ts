import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

type UploadOptions = {
  objectName: string;
  buffer: Buffer;
  contentType?: string;
};

@Injectable()
export class MinioService {
  private client?: MinioClient;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): MinioClient | undefined {
    if (this.client) return this.client;

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = Number(this.configService.get<string>('MINIO_PORT') ?? 9000);
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');

    if (!endpoint || !accessKey || !secretKey) return undefined;

    this.client = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL: false,
      accessKey,
      secretKey,
    });

    return this.client;
  }

  private getBucket(): string | undefined {
    return this.configService.get<string>('MINIO_BUCKET');
  }

  private async ensureBucket(client: MinioClient, bucket: string) {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket);
    }
  }

  async uploadBuffer({ objectName, buffer, contentType }: UploadOptions) {
    const client = this.getClient();
    const bucket = this.getBucket();
    if (!client || !bucket) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    await this.ensureBucket(client, bucket);

    await client.putObject(
      bucket,
      objectName,
      buffer,
      buffer.length,
      contentType ? { 'Content-Type': contentType } : undefined,
    );

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<string>('MINIO_PORT');
    const url = `http://${endpoint}:${port}/${bucket}/${objectName}`;

    return { objectName, url };
  }
}

