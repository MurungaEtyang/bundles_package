import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'M-Pesa Bundles API',
      version: '1.0.0',
      description: 'API documentation for M-Pesa Bundles Service',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Offer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Weekly Data Bundle'
            },
            description: {
              type: 'string',
              example: '1GB data valid for 7 days'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 100.0
            },
            type: {
              type: 'string',
              enum: ['data', 'sms', 'voice'],
              example: 'data'
            },
            category: {
              type: 'string',
              example: 'internet'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        OfferInput: {
          type: 'object',
          required: ['name', 'price', 'type', 'category'],
          properties: {
            name: {
              type: 'string',
              example: 'Weekly Data Bundle'
            },
            description: {
              type: 'string',
              example: '1GB data valid for 7 days'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 100.0
            },
            type: {
              type: 'string',
              enum: ['data', 'sms', 'voice'],
              example: 'data'
            },
            category: {
              type: 'string',
              example: 'internet'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message describing what went wrong'
            },
            error: {
              type: 'string',
              description: 'Detailed error message (only in development)',
              example: 'Detailed error stack trace'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

export default specs;
