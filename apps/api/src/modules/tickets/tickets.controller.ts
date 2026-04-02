import { Controller, Get, Param } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':token')
  async getTicket(@Param('token') token: string) {
    return this.ticketsService.findByToken(token);
  }
}

