import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DevSecOps Auth API',
            version: '1.0.0',
            description: 'Authentication and user management API with JWT-based security',
            contact: {
                name: 'DevSecOps Team'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token obtained from the /login endpoint'
                }
            },
            schemas: {
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com',
                            description: 'User email address'
                        },
                        password: {
                            type: 'string',
                            minLength: 6,
                            example: 'password123',
                            description: 'User password (minimum 6 characters)'
                        }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            description: 'JWT access token valid for 8 hours'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user'],
                            example: 'user',
                            description: 'User role'
                        }
                    }
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000',
                            description: 'User unique identifier'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com',
                            description: 'User email address'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user'],
                            example: 'user',
                            description: 'User role'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-01T00:00:00Z',
                            description: 'Account creation timestamp'
                        },
                        last_sign_in_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T12:00:00Z',
                            description: 'Last login timestamp'
                        },
                        email_confirmed_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-01T00:00:00Z',
                            description: 'Email confirmation timestamp'
                        }
                    }
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'newuser@example.com',
                            description: 'New user email address'
                        },
                        password: {
                            type: 'string',
                            minLength: 6,
                            example: 'securepass123',
                            description: 'Password (minimum 6 characters)'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user'],
                            default: 'user',
                            example: 'user',
                            description: 'User role (defaults to user)'
                        }
                    }
                },
                UpdateRoleRequest: {
                    type: 'object',
                    required: ['role'],
                    properties: {
                        role: {
                            type: 'string',
                            enum: ['admin', 'user'],
                            example: 'admin',
                            description: 'New role to assign'
                        }
                    }
                },
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'healthy',
                            description: 'Service health status'
                        },
                        service: {
                            type: 'string',
                            example: 'auth',
                            description: 'Service name'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            example: 'Invalid credentials',
                            description: 'Error message'
                        }
                    }
                },
                UsersListResponse: {
                    type: 'object',
                    properties: {
                        users: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/UserResponse'
                            },
                            description: 'List of users'
                        },
                        count: {
                            type: 'integer',
                            example: 10,
                            description: 'Total number of users'
                        }
                    }
                },
                CreateUserResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'User created successfully',
                            description: 'Success message'
                        },
                        user: {
                            $ref: '#/components/schemas/UserResponse'
                        }
                    }
                },
                DeleteUserResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'User deleted successfully',
                            description: 'Success message'
                        },
                        deleted_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000',
                            description: 'ID of deleted user'
                        }
                    }
                },
                UpdateRoleResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'User role updated successfully',
                            description: 'Success message'
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000',
                            description: 'ID of updated user'
                        },
                        new_role: {
                            type: 'string',
                            enum: ['admin', 'user'],
                            example: 'admin',
                            description: 'New role assigned'
                        }
                    }
                },
                DashboardResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'this is your personal document list',
                            description: 'Dashboard message'
                        }
                    }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Bad request - invalid input',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                error: 'Email and password are required'
                            }
                        }
                    }
                },
                Unauthorized: {
                    description: 'Unauthorized - invalid or missing credentials',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                error: 'authenticated failed'
                            }
                        }
                    }
                },
                Forbidden: {
                    description: 'Forbidden - insufficient permissions',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                error: 'Lack of Permission：require admin authorization'
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                error: 'User not found'
                            }
                        }
                    }
                },
                InternalServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                error: 'Internal server error'
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
        ]
    },
    apis: ['./src/index.ts', './dist/index.js']
};
