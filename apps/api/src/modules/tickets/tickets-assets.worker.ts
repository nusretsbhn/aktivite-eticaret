import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'node:stream';

import { MinioService } from '../../common/storage/minio.service';
import { TicketsService } from './tickets.service';

async function streamToBuffer(stream: PassThrough): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

type GenerateAssetsJob = {
  token: string;
};

@Injectable()
@Processor('tickets-generate-assets')
export class TicketsAssetsWorker extends WorkerHost {
  constructor(
    private readonly minioService: MinioService,
    private readonly ticketsService: TicketsService,
  ) {
    super();
  }

  async process(job: Job<GenerateAssetsJob>): Promise<{ token: string }> {
    const token = job.data?.token;
    if (!token) return { token: 'unknown' };

    const ticket = await this.ticketsService.findByToken(token).catch(() => null);
    if (!ticket) return { token };

    // QR: inline data URL yerine (ileride) MinIO URL üretilecek.
    const qrCodeUrl = await QRCode.toDataURL(ticket.qrCodeData, { width: 256, margin: 1 });

    // PDF: Basit PDF üretimi (logo vs. yok; faz 2.2’de zenginleştirilecek).
    const pdf = new PDFDocument({ size: 'A4', margin: 40 });
    const out = new PassThrough();
    const pdfBufferPromise = streamToBuffer(out);
    pdf.pipe(out);

    pdf.fontSize(16).text('Bodrum Aktivite - Elektronik Bilet', { align: 'center' });
    pdf.moveDown();
    pdf.fontSize(12).text(`Bilet No: ${ticket.ticketNumber}`);
    pdf.text(`Geçerlilik: ${ticket.validDate}`);
    pdf.end();

    const pdfBuffer = await pdfBufferPromise;

    // MinIO upload (opsiyonel).
    let uploadedPdfUrl: string | null = null;
    try {
      const endpoint = process.env.MINIO_ENDPOINT;
      const hasMinio = Boolean(endpoint && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY);
      if (hasMinio) {
        const pdfObjectName = `tickets/${ticket.id}/ticket.pdf`;
        const result = await this.minioService.uploadBuffer({
          objectName: pdfObjectName,
          buffer: pdfBuffer,
          contentType: 'application/pdf',
        });
        uploadedPdfUrl = result.url;
      }
    } catch {
      // MinIO devre dışıysa veya yanlış config varsa fail etmeyelim.
      uploadedPdfUrl = null;
    }

    await this.ticketsService.updateAssetsByToken(token, {
      qrCodeUrl,
      pdfUrl: uploadedPdfUrl,
    });

    return { token };
  }
}

