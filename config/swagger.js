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
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.mpesa.ziz.co.ke/api' 
          : 'http://localhost:8000/api',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
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
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                },
                example: {
                  error: 'Invalid input data'
                }
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                },
                example: {
                  error: 'Unauthorized - Missing or invalid token'
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                },
                example: {
                  error: 'Resource not found'
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  message: { type: 'string' },
                  stack: { type: 'string' }
                },
                example: {
                  error: 'Internal Server Error',
                  message: 'An unexpected error occurred',
                  stack: 'Error stack trace (in development)'
                }
              }
            }
          }
        }
      },
      schemas: {
        ThemeSetting: {
            type: 'object',
            properties: {
                id: {
                    type: 'integer',
                    example: 1
                },
                section: {
                    type: 'string',
                    example: 'header'
                },
                styles: {
                    type: 'object',
                    example: {
                        background_color: '#1a237e',
                        font_color: '#ffffff',
                        font_family: 'Arial, sans-serif',
                        font_size: '16px'
                    }
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
        ThemeSettingInput: {
            type: 'object',
            required: ['section', 'styles'],
            properties: {
                section: {
                    type: 'string',
                    example: 'header',
                    description: 'The section of the theme (e.g., header, footer, body)'
                },
                styles: {
                    type: 'object',
                    example: {
                        background_color: '#1a237e',
                        font_color: '#ffffff'
                    },
                    description: 'Key-value pairs of CSS properties'
                }
            }
        },
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
    paths: {
      '/theme/theme-settings': {
        get: {
          tags: ['Theme'],
          summary: 'Get all theme settings',
          responses: {
            200: {
              description: 'List of all theme settings',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ThemeSetting'
                    }
                  }
                }
              }
            },
            500: {
              $ref: '#/components/responses/ServerError'
            }
          }
        },
        post: {
          security: [{
            bearerAuth: []
          }],
          tags: ['Theme'],
          summary: 'Create or update a theme setting',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ThemeSettingInput'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Theme setting created/updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ThemeSetting'
                  }
                }
              }
            },
            400: {
              $ref: '#/components/responses/BadRequest'
            },
            401: {
              $ref: '#/components/responses/Unauthorized'
            },
            500: {
              $ref: '#/components/responses/ServerError'
            }
          }
        }
      },
      '/theme/theme-settings/{section}': {
        get: {
          tags: ['Theme'],
          summary: 'Get theme setting by section',
          parameters: [
            {
              name: 'section',
              in: 'path',
              required: true,
              description: 'Section name (e.g., header, footer, body)',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: 'Theme setting found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ThemeSetting'
                  }
                }
              }
            },
            404: {
              $ref: '#/components/responses/NotFound'
            },
            500: {
              $ref: '#/components/responses/ServerError'
            }
          }
        },
        delete: {
          security: [{
            bearerAuth: []
          }],
          tags: ['Theme'],
          summary: 'Delete a theme setting',
          parameters: [
            {
              name: 'section',
              in: 'path',
              required: true,
              description: 'Section name to delete',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: 'Theme setting deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    },
                    example: {
                      message: 'Theme setting deleted successfully'
                    }
                  }
                }
              }
            },
            401: {
              $ref: '#/components/responses/Unauthorized'
            },
            404: {
              $ref: '#/components/responses/NotFound'
            },
            500: {
              $ref: '#/components/responses/ServerError'
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
