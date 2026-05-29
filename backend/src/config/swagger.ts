import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'QuickBite API',
      version: '1.0.0',
      description: `
**QuickBite** – Production-Grade Food Delivery Platform API

## Authentication
Most endpoints require a **Bearer token** in the Authorization header:
\`Authorization: Bearer <accessToken>\`

Access tokens expire in **15 minutes**. Use \`POST /api/v1/auth/refresh\` to get a new one.

## Response Format
All responses follow a consistent shape:
- **Success**: \`{ success: true, data: {}, message: "" }\`
- **Error**:   \`{ success: false, error: "", statusCode: 0 }\`
      `,
      contact: {
        name: 'QuickBite Support',
        email: 'support@quickbite.in',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api/v1`,
        description: 'Development',
      },
      {
        url: 'https://api.quickbite.in/api/v1',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token obtained from /auth/login or /auth/refresh',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Success' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Not found' },
            statusCode: { type: 'integer', example: 404 },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            message: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Registration, login, token refresh, logout' },
      { name: 'Users', description: 'User profile and address management' },
      { name: 'Restaurants', description: 'Restaurant browsing and search' },
      { name: 'Food', description: 'Food item and category management' },
      { name: 'Cart', description: 'Shopping cart operations' },
      { name: 'Orders', description: 'Order placement and tracking' },
      { name: 'Payments', description: 'Razorpay payment integration' },
      { name: 'Admin', description: 'Admin management endpoints' },
      { name: 'Notifications', description: 'In-app notifications' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
