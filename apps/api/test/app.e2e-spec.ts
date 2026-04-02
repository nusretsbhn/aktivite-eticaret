import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { UserRole } from '../src/entities/enums';
import { User } from '../src/entities/user.entity';

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

type ActivityListItem = {
  id: string;
  slug: string;
};

type ScheduleListItem = {
  id: string;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const webhookSecret = 'e2e-webhook-secret';

  beforeAll(async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = webhookSecret;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('enforces RBAC on notifications logs', async () => {
    const now = Date.now();
    const customerEmail = `e2e_customer_${now}@example.com`;
    const adminEmail = `e2e_admin_${now}@example.com`;

    const customerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: customerEmail,
        phone: '555',
        fullName: 'E2E Customer',
        password: 'secret123',
      })
      .expect(201);
    const customerAuth = customerRegister.body as AuthResponse;

    await request(app.getHttpServer())
      .get('/api/notifications/logs')
      .set('Authorization', `Bearer ${customerAuth.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        phone: '555',
        fullName: 'E2E Admin',
        password: 'secret123',
      })
      .expect(201);

    await dataSource
      .createQueryBuilder()
      .update(User)
      .set({ role: UserRole.admin })
      .where('email = :email', { email: adminEmail })
      .execute();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'secret123',
      })
      .expect(201);
    const adminAuth = adminLogin.body as AuthResponse;

    await request(app.getHttpServer())
      .get('/api/notifications/logs')
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .expect(200);
  });

  it('enforces admin payment transitions and updates booking status', async () => {
    const now = Date.now();
    const customerEmail = `e2e_pay_customer_${now}@example.com`;
    const adminEmail = `e2e_pay_admin_${now}@example.com`;

    const customerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: customerEmail,
        phone: '555',
        fullName: 'E2E Pay Customer',
        password: 'secret123',
      })
      .expect(201);
    const customerAuth = customerRegister.body as AuthResponse;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        phone: '555',
        fullName: 'E2E Pay Admin',
        password: 'secret123',
      })
      .expect(201);

    await dataSource
      .createQueryBuilder()
      .update(User)
      .set({ role: UserRole.admin })
      .where('email = :email', { email: adminEmail })
      .execute();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'secret123',
      })
      .expect(201);
    const adminAuth = adminLogin.body as AuthResponse;

    const activitiesRes = await request(app.getHttpServer())
      .get('/api/activities')
      .expect(200);
    const activities = activitiesRes.body as ActivityListItem[];
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThan(0);

    const activity = activities[0];
    const schedulesRes = await request(app.getHttpServer())
      .get(`/api/activities/${activity.slug}/schedules`)
      .expect(200);
    const schedules = schedulesRes.body as ScheduleListItem[];
    expect(Array.isArray(schedules)).toBe(true);
    expect(schedules.length).toBeGreaterThan(0);

    const schedule = schedules[0];
    const bookingCreate = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerAuth.accessToken}`)
      .send({
        scheduleId: schedule.id,
        activityId: activity.id,
        customerName: 'E2E Pay Customer',
        customerEmail,
        customerPhone: '555',
        adultCount: 1,
        childCount: 0,
        totalAmount: '123.00',
        paymentMethod: 'credit_card',
      })
      .expect(201);
    const bookingBody = bookingCreate.body as { bookingReference: string };
    const bookingReference = bookingBody.bookingReference;

    await request(app.getHttpServer())
      .post('/api/payments/initiate')
      .send({
        bookingReference,
        paymentMethod: 'credit_card',
        amount: '123.00',
        currency: 'TRY',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/payments/admin/${bookingReference}/status`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ status: 'refunded' })
      .expect(400);

    const paymentCompleted = await request(app.getHttpServer())
      .patch(`/api/payments/admin/${bookingReference}/status`)
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({ status: 'completed' })
      .expect(200);
    const paymentBody = paymentCompleted.body as { status: string };
    expect(paymentBody.status).toBe('completed');

    const bookingAfter = await request(app.getHttpServer())
      .get(`/api/bookings/${bookingReference}`)
      .expect(200);
    const bookingAfterBody = bookingAfter.body as { status: string };
    expect(bookingAfterBody.status).toBe('confirmed');
  });

  it('validates webhook signature and supports idempotent retries', async () => {
    const now = Date.now();
    const customerEmail = `e2e_hook_customer_${now}@example.com`;

    const customerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: customerEmail,
        phone: '555',
        fullName: 'E2E Hook Customer',
        password: 'secret123',
      })
      .expect(201);
    const customerAuth = customerRegister.body as AuthResponse;

    const activitiesRes = await request(app.getHttpServer())
      .get('/api/activities')
      .expect(200);
    const activity = (activitiesRes.body as ActivityListItem[])[0];
    const schedulesRes = await request(app.getHttpServer())
      .get(`/api/activities/${activity.slug}/schedules`)
      .expect(200);
    const schedule = (schedulesRes.body as ScheduleListItem[])[0];

    const bookingCreate = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerAuth.accessToken}`)
      .send({
        scheduleId: schedule.id,
        activityId: activity.id,
        customerName: 'E2E Hook Customer',
        customerEmail,
        customerPhone: '555',
        adultCount: 1,
        childCount: 0,
        totalAmount: '150.00',
        paymentMethod: 'credit_card',
      })
      .expect(201);
    const bookingReference = (bookingCreate.body as { bookingReference: string }).bookingReference;

    await request(app.getHttpServer())
      .post('/api/payments/initiate')
      .send({
        bookingReference,
        paymentMethod: 'credit_card',
        amount: '150.00',
        currency: 'TRY',
      })
      .expect(201);

    const webhookPayload = {
      bookingReference,
      provider: 'iyzico',
      status: 'completed',
      providerTransactionId: `e2e-hook-tx-${now}`,
      providerResponse: { ok: true },
    };

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .send(webhookPayload)
      .expect(400);

    const signPayload = [
      webhookPayload.bookingReference,
      webhookPayload.provider,
      webhookPayload.status,
      webhookPayload.providerTransactionId,
    ].join('|');
    const signature = createHmac('sha256', webhookSecret).update(signPayload).digest('hex');

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('x-webhook-signature', signature)
      .send(webhookPayload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('x-webhook-signature', signature)
      .send(webhookPayload)
      .expect(201);
  });
});
