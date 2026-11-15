const request = require('supertest');

// Use the real Express app, with the database client mocked out
// (these routes never reach the database, so no Postgres is needed).
jest.mock('../prisma/client', () => ({}));
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const app = require('../index');

describe('Real API smoke tests', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('law-firm-backend');
  });

  test('GET /metrics exposes Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('lawfirm_');
  });

  test('Protected route rejects requests without a token', async () => {
    const res = await request(app).get('/api/cases');
    expect(res.statusCode).toBe(401);
  });

  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
  });

  test('HTTP request metrics are recorded', async () => {
    await request(app).get('/health');
    const res = await request(app).get('/metrics');
    expect(res.text).toMatch(/lawfirm_http_requests_total\{[^}]*route="\/health"[^}]*\} \d+/);
    expect(res.text).toContain('lawfirm_http_request_duration_seconds_bucket');
  });
});
