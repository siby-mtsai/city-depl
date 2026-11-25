import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('same code, different cities (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });
  afterAll(() => app.close());

  const order = (city: string, body: object) =>
    request(app.getHttpServer()).post('/orders').set('X-City', city).send(body);
  const item = { sku: 'tea', qty: 2, unitPrice: 100 };

  it('rejects requests with no city', async () => {
    await request(app.getHttpServer()).get('/city').expect(400);
  });

  it('rejects unknown cities', async () => {
    await request(app.getHttpServer()).get('/city').set('X-City', 'atlantis').expect(404);
  });

  it('resolves the city from the subdomain', async () => {
    const res = await request(app.getHttpServer()).get('/city').set('Host', 'dubai.example.com').expect(200);
    expect(res.body.currency).toBe('AED');
  });

  it('/health works without a city', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('tells the frontend which features each city has', async () => {
    const res = await request(app.getHttpServer()).get('/city').set('X-City', 'mumbai').expect(200);
    expect(res.body.features).toEqual(['cash_on_delivery', 'scheduled_orders']);
  });

  it('Mumbai allows cash on delivery', async () => {
    const res = await order('mumbai', { items: [item], paymentMethod: 'cash' }).expect(201);
    expect(res.body.payment.status).toBe('pending');
  });

  it('Delhi does not allow cash on delivery', async () => {
    await order('delhi', { items: [item], paymentMethod: 'cash' }).expect(400);
  });

  it('picks Razorpay in Mumbai and Stripe in Dubai', async () => {
    const mum = await order('mumbai', { items: [item], paymentMethod: 'online' }).expect(201);
    const dxb = await order('dubai', { items: [item], paymentMethod: 'online' }).expect(201);
    expect(mum.body.payment.provider).toBe('razorpay');
    expect(mum.body.currency).toBe('INR');
    expect(dxb.body.payment.provider).toBe('stripe');
    expect(dxb.body.currency).toBe('AED');
  });

  it('enforces per-city order limits', async () => {
    const big = { sku: 'tv', qty: 1, unitPrice: 6000 };
    await order('dubai', { items: [big], paymentMethod: 'online' }).expect(400); // limit 5000
    await order('mumbai', { items: [big], paymentMethod: 'online' }).expect(201); // limit 50000
  });

  it('blocks scheduled orders in Dubai only', async () => {
    const body = { items: [item], paymentMethod: 'online', scheduledFor: '2026-12-01T10:00:00Z' };
    await order('dubai', body).expect(400);
    await order('delhi', body).expect(201);
  });

  it('live tracking route is on in Delhi, off in Mumbai', async () => {
    const get = (city: string) =>
      request(app.getHttpServer()).get('/orders/ord_1/tracking').set('X-City', city);
    await get('delhi').expect(200);
    await get('mumbai').expect(403);
  });

  it('global kill switch turns a feature off everywhere', async () => {
    process.env.FEATURE_LIVE_TRACKING = 'off';
    try {
      await request(app.getHttpServer()).get('/orders/ord_1/tracking').set('X-City', 'delhi').expect(403);
    } finally {
      delete process.env.FEATURE_LIVE_TRACKING;
    }
  });

  it('validates the request body', async () => {
    await order('mumbai', { items: [], paymentMethod: 'bitcoin' }).expect(400);
  });
});
