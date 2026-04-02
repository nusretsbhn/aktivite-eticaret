import { Module } from '@nestjs/common';
import { MinioService } from '../../common/storage/minio.service';

@Module({
  providers: [MinioService],
  exports: [MinioService],
})
export class StorageModule {}

