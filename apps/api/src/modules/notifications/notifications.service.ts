import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  NotificationStatus,
  NotificationType,
} from '../../entities/enums';
import { NotificationLog } from '../../entities/notification-log.entity';
import { Booking } from '../../entities/booking.entity';

export type SendConfirmedNotificationParams = {
  bookingReference: string;
  activityName: string;
  date: string;
  time: string;
  ticketToken: string;
  customerPhone: string;
  customerEmail: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NotificationLog) private readonly notificationRepo: Repository<NotificationLog>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
  ) {}

  private getBiletUrl(ticketToken: string) {
    const appUrl = this.configService.get<string>('APP_URL') ?? '';
    // Frontend route: /biletim/[token]
    return `${appUrl}/biletim/${ticketToken}`;
  }

  async sendBookingConfirmed(params: SendConfirmedNotificationParams) {
    const booking = await this.bookingRepo.findOne({
      where: { bookingReference: params.bookingReference },
    });
    if (!booking) return { smsLog: null, emailLog: null };

    const ticketUrl = this.getBiletUrl(params.ticketToken);
    const smsTemplate = `[ONAY] Rezervasyonunuz onaylandı! Ref: ${params.bookingReference}
${params.activityName} - ${params.date} ${params.time}
Biletiniz: ${ticketUrl}`;

    const emailTemplate = `<h3>Rezervasyon Onayı</h3>
<p>Ref: ${params.bookingReference}</p>
<p>${params.activityName} - ${params.date} ${params.time}</p>
<p>Biletiniz: <a href="${ticketUrl}">${ticketUrl}</a></p>`;

    const smsLog = this.notificationRepo.create({
      booking,
      type: NotificationType.sms,
      recipient: params.customerPhone,
      template: smsTemplate,
      status: NotificationStatus.sent,
      sentAt: new Date(),
    });

    const emailLog = this.notificationRepo.create({
      booking,
      type: NotificationType.email,
      recipient: params.customerEmail,
      template: emailTemplate,
      status: NotificationStatus.sent,
      sentAt: new Date(),
    });

    const [savedSmsLog, savedEmailLog] = await this.notificationRepo.save([smsLog, emailLog]);

    return { smsLog: savedSmsLog, emailLog: savedEmailLog };
  }

  async getRecentLogs(limit = 20) {
    return this.notificationRepo.find({
      relations: ['booking'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

