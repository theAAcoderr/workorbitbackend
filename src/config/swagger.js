const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkOrbit API',
      version: '1.0.0',
      description: 'Enterprise-grade employee management and recruitment system',
      contact: {
        name: 'WorkOrbit API Support',
        email: 'api@workorbit.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://workorbit.com/license'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.workorbit.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token stored in httpOnly cookie'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['admin', 'hr', 'manager', 'employee']
            },
            status: {
              type: 'string',
              enum: ['pending', 'active', 'inactive', 'suspended']
            }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            companyName: {
              type: 'string'
            },
            location: {
              type: 'string'
            },
            jobType: {
              type: 'string'
            },
            salary: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['active', 'closed', 'draft']
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management'
      },
      {
        name: 'Attendance',
        description: 'Attendance tracking'
      },
      {
        name: 'Leave',
        description: 'Leave management'
      },
      {
        name: 'Projects',
        description: 'Project management'
      },
      {
        name: 'Tasks',
        description: 'Task management'
      },
      {
        name: 'Milestones',
        description: 'Milestone tracking'
      },
      {
        name: 'Recruitment',
        description: 'Job posting and applications'
      },
      {
        name: 'Payroll',
        description: 'Payroll management'
      },
      {
        name: 'Reports',
        description: 'Analytics and reports'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
