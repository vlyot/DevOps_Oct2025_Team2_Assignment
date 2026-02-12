import request from 'supertest';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from '../config/swagger';

describe('Swagger Documentation', () => {
    let app: express.Application;
    let swaggerSpec: any;

    beforeAll(() => {
        app = express();
        swaggerSpec = swaggerJsdoc(swaggerOptions);

        // Setup Swagger UI
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        app.get('/api-docs.json', (_req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });
    });

    describe('Swagger Specification', () => {
        it('should generate valid OpenAPI 3.0 specification', () => {
            expect(swaggerSpec).toBeDefined();
            expect(swaggerSpec.openapi).toBe('3.0.0');
            expect(swaggerSpec.info).toBeDefined();
            expect(swaggerSpec.info.title).toBe('DevSecOps Auth API');
        });

        it('should define bearerAuth security scheme', () => {
            expect(swaggerSpec.components.securitySchemes).toBeDefined();
            expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
            expect(swaggerSpec.components.securitySchemes.bearerAuth.type).toBe('http');
            expect(swaggerSpec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
        });

        it('should define all required schemas', () => {
            const schemas = swaggerSpec.components.schemas;
            expect(schemas.LoginRequest).toBeDefined();
            expect(schemas.LoginResponse).toBeDefined();
            expect(schemas.UserResponse).toBeDefined();
            expect(schemas.CreateUserRequest).toBeDefined();
            expect(schemas.UpdateRoleRequest).toBeDefined();
            expect(schemas.ErrorResponse).toBeDefined();
            expect(schemas.HealthResponse).toBeDefined();
        });

        it('should define standard error responses', () => {
            const responses = swaggerSpec.components.responses;
            expect(responses.BadRequest).toBeDefined();
            expect(responses.Unauthorized).toBeDefined();
            expect(responses.Forbidden).toBeDefined();
            expect(responses.NotFound).toBeDefined();
            expect(responses.InternalServerError).toBeDefined();
        });

        it('should document all 7 endpoints', () => {
            const paths = swaggerSpec.paths;
            expect(paths['/login']).toBeDefined();
            expect(paths['/health']).toBeDefined();
            expect(paths['/admin/users']).toBeDefined();
            expect(paths['/admin/users/{id}']).toBeDefined();
            expect(paths['/admin/users/{id}/role']).toBeDefined();
            expect(paths['/dashboard/files']).toBeDefined();
        });

        it('should mark public endpoints without security', () => {
            const loginEndpoint = swaggerSpec.paths['/login'].post;
            const healthEndpoint = swaggerSpec.paths['/health'].get;

            expect(loginEndpoint.security).toEqual([]);
            expect(healthEndpoint.security).toEqual([]);
        });

        it('should mark protected endpoints with bearerAuth', () => {
            const adminUsersEndpoint = swaggerSpec.paths['/admin/users'].get;
            expect(adminUsersEndpoint.security).toBeDefined();
            expect(adminUsersEndpoint.security[0]).toHaveProperty('bearerAuth');
        });
    });

    describe('Swagger Endpoints', () => {
        it('should serve swagger.json at /api-docs.json', async () => {
            const response = await request(app).get('/api-docs.json');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('application/json');
            expect(response.body.openapi).toBe('3.0.0');
        });

        it('should serve Swagger UI at /api-docs/', async () => {
            const response = await request(app).get('/api-docs/');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });
    });

    describe('Endpoint Tags', () => {
        it('should tag endpoints correctly', () => {
            const paths = swaggerSpec.paths;

            expect(paths['/login'].post.tags).toContain('Authentication');
            expect(paths['/health'].get.tags).toContain('System');
            expect(paths['/admin/users'].get.tags).toContain('Admin');
            expect(paths['/admin/users'].post.tags).toContain('Admin');
            expect(paths['/dashboard/files'].get.tags).toContain('User Dashboard');
        });
    });
});
