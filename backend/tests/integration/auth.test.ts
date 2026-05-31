import request from 'supertest';
import app from '../../src/app';

// Mock the database pool and AuthService to avoid real DB calls during CI
jest.mock('../../src/database', () => ({
  connectDB: jest.fn(),
  default: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/services/auth.service', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({
      tokens: { accessToken: 'fake-jwt-token', refreshToken: 'fake-refresh' },
      user: { id: 'uuid', name: 'Test User', role: 'customer' }
    }),
  }
}));

describe('Auth API Integration', () => {
  it('POST /api/v1/auth/login - should return 200 and a token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer1@demo.com',
        password: 'Demo@123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.user.email).toBeUndefined(); // We only mocked id, name, role
    expect(response.body.data.user.name).toBe('Test User');
  });

  it('POST /api/v1/auth/login - should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        password: 'Demo@123'
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
  });
});
