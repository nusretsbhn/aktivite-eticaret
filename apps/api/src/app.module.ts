import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './database/typeorm.config';
import { BullmqRootModule } from './queues/bullmq.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TicketsAssetsQueueModule } from './modules/tickets/tickets-assets.queue.module';
import { MeModule } from './modules/me/me.module';

const typeormEnabled = process.env.TYPEORM_ENABLED !== 'false';
const bullmqEnabled = process.env.BULLMQ_ENABLED !== 'false';

@Module({
  imports: [
    // ENV yönetimini her modülde global erişilebilir yapar.
    ConfigModule.forRoot({ isGlobal: true }),
    ...(typeormEnabled
      ? [
          // PostgreSQL + TypeORM bağlantısı.
          TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: typeOrmConfig,
          }),
        ]
      : []),
    ...(bullmqEnabled ? [BullmqRootModule] : []),
    ...(bullmqEnabled ? [TicketsAssetsQueueModule] : []),
    // Auth endpoints.
    AuthModule,
    // MinIO dosya yükleme servisi.
    StorageModule,
    // Public activities endpoints.
    ActivitiesModule,
    // Public schedules endpoints.
    SchedulesModule,
    // Public bookings endpoints.
    BookingsModule,
    // Payments endpoints.
    PaymentsModule,
    // Notifications endpoints (debug).
    NotificationsModule,
    // Authenticated "my account" endpoints.
    MeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
