import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Injectable()
export class TicketsAssetsQueueService {
  private readonly logger = new Logger(TicketsAssetsQueueService.name);

  constructor(
    @Optional()
    @InjectQueue('tickets-generate-assets')
    private readonly queue?: Queue,
  ) {}

  async enqueueGenerateAssets(token: string) {
    if (!this.queue) return;
    // Redis ayağa kalkmadıysa veya queue provider yoksa fail etmeyelim.
    try {
      await this.queue.add('generate', { token });
    } catch (err) {
      this.logger.warn(`Could not enqueue assets job for token=${token}: ${String(err)}`);
    }
  }
}

