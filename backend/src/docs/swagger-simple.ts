/**
 * 简化的Swagger API文档配置
 */

import swaggerJSDoc from 'swagger-jsdoc';

// Swagger配置选项
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '大学生就业问卷调查系统 API',
      version: '1.0.0',
      description: '大学生就业问卷调查系统的RESTful API文档',
      contact: {
        name: 'API Support',
        email: 'support@employment-survey.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8787',
        description: '开发环境'
      },
      {
        url: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'integer' }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'integer' },
            services: {
              type: 'object',
              properties: {
                database: { $ref: '#/components/schemas/ServiceHealth' },
                cache: { $ref: '#/components/schemas/ServiceHealth' },
                storage: { $ref: '#/components/schemas/ServiceHealth' }
              }
            }
          }
        },
        ServiceHealth: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            response_time: { type: 'number' },
            last_check: { type: 'string', format: 'date-time' },
            error: { type: 'string' }
          }
        }
      },
      responses: {
        BadRequest: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Unauthorized: {
          description: '未授权访问',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: '健康检查',
          description: '检查系统各组件的健康状态',
          responses: {
            '200': {
              description: '系统健康',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthCheck' }
                }
              }
            },
            '503': {
              description: '系统异常',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthCheck' }
                }
              }
            }
          }
        }
      },
      '/health/quick': {
        get: {
          tags: ['System'],
          summary: '快速健康检查',
          description: '快速检查系统基本状态',
          responses: {
            '200': {
              description: '系统正常',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          status: { type: 'string' },
                          timestamp: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: '用户登录',
          description: '使用用户名和密码进行登录认证',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '登录成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: '系统相关接口'
      },
      {
        name: 'Authentication',
        description: '认证相关接口'
      },
      {
        name: 'Questionnaire',
        description: '问卷相关接口'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/index.ts'
  ]
};

// 生成Swagger规范
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI选项
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
};

export default swaggerOptions;
