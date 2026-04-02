import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';

import { Booking } from '../../entities/booking.entity';
import { Ticket } from '../../entities/ticket.entity';

export type TicketView = {
  id: string;
  token: string;
  bookingReference: string;
  ticketNumber: string;
  qrCodeData: string;
  qrCodeUrl?: string | null;
  validDate: string;
  pdfUrl?: string | null;
  createdAt: Date;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
  ) {}

  private toView(ticket: Ticket): TicketView {
    return {
      id: ticket.id,
      token: ticket.qrCodeData,
      bookingReference: ticket.booking?.bookingReference ?? '',
      ticketNumber: ticket.ticketNumber,
      qrCodeData: ticket.qrCodeData,
      qrCodeUrl: ticket.qrCodeUrl ?? null,
      validDate: ticket.validDate,
      pdfUrl: ticket.pdfUrl ?? null,
      createdAt: ticket.createdAt,
    };
  }

  async createForBooking(bookingReference: string): Promise<TicketView> {
    const existing = await this.ticketRepo.findOne({
      where: { booking: { bookingReference } },
      relations: ['booking'],
    });
    if (existing) return this.toView(existing);

    const booking = await this.bookingRepo.findOne({
      where: { bookingReference },
      relations: ['activity', 'schedule'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const activity = booking.activity;
    if (!activity) throw new NotFoundException('Activity not found');
    if (!booking.schedule) throw new NotFoundException('Schedule not found');

    const token = randomUUID();
    const ticket = this.ticketRepo.create({
      booking,
      ticketNumber: `TKT-${token.slice(0, 8).toUpperCase()}`,
      qrCodeData: token,
      qrCodeUrl: null,
      pdfUrl: null,
      validDate: booking.schedule.date,
      isUsed: false,
      usedAt: null,
    });

    const saved = await this.ticketRepo.save(ticket);
    return this.toView({ ...saved, booking });
  }

  async findByToken(token: string): Promise<TicketView> {
    const ticket = await this.ticketRepo.findOne({
      where: { qrCodeData: token },
      relations: ['booking'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.toView(ticket);
  }

  async updateAssetsByToken(token: string, patch: { qrCodeUrl?: string | null; pdfUrl?: string | null }): Promise<void> {
    const ticket = await this.ticketRepo.findOne({ where: { qrCodeData: token } });
    if (!ticket) return;
    ticket.qrCodeUrl = patch.qrCodeUrl ?? ticket.qrCodeUrl;
    ticket.pdfUrl = patch.pdfUrl ?? ticket.pdfUrl;
    await this.ticketRepo.save(ticket);
  }
}

