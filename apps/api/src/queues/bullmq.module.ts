import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // Redis hazır değilken uygulamanın düşmemesi için modülü env üzerinden opsiyonel açıyoruz.
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
    }),
  ],
})
export class BullmqRootModule {}

