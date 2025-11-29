import swaggerJsdoc from 'swagger-jsdoc';
import { ENVIRONMENT } from './common/config';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'JOY GIVER V2 Documentation',
			version: '2.0.0',
			description: 'API documentation for JOY GIVER backend application',
			note1: 'For mobile applications, the header (joygiver) must be set as true',
			note2: 'Each module should have its own schema for better organization',
			note3: 'Each module schema must be registered in src/schemas/modulesIndex.ts. The key must have the route prefix where the module is mounted.',
		},
		servers: [
			{
				url:
					ENVIRONMENT.APP.ENV === 'production'
						? 'https://joygiver.onrender.com/api/v1'
						: `http://localhost:${ENVIRONMENT.APP.PORT || 3000}/api/v1`,
				description: ENVIRONMENT.APP.ENV === 'production' ? 'Production server' : 'Development server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
				anotherBearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
				cookieAuth: {
					type: 'apiKey',
					in: 'cookie',
					name: 'accessToken',
				},
			},
		},
	},
	apis: ['./src/modules/**/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
