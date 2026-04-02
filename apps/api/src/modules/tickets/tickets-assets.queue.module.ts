import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { StorageModule } from '../storage/storage.module';
import { TicketsModule } from './tickets.module';
import { TicketsAssetsWorker } from './tickets-assets.worker';
import { TicketsAssetsQueueService } from './tickets-assets.queue.service';

@Global()
@Module({
  imports: [
    StorageModule,
    TicketsModule,
    // Queue Redis ayağa kalktığında çalışır; şimdilik iskelet.
    BullModule.registerQueue({
      name: 'tickets-generate-assets',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [TicketsAssetsWorker, TicketsAssetsQueueService],
  exports: [TicketsAssetsQueueService],
})
export class TicketsAssetsQueueModule {}

