///////////////////////////////////////////////////////////////////////
// DO NOT CHANGE THE ORDER OF THE IMPORTS;
// DOT ENV AND MODULE ALIAS WILL NOT WORK PROPERLY UNLESS THEY ARE IMPORTED FIRST
import * as dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'production') {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('module-alias/register');
}

///////////////////////////////////////////////////////////////////////
import { ENVIRONMENT, connectDb, disconnectDb } from '@/common/config';
import '@/common/interfaces/request';
import { AppError, logger, stream } from '@/common/utils';
import { errorHandler } from '@/middlewares';
import { timeoutMiddleware, validateModuleSchema } from '@/middlewares';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet, { HelmetOptions } from 'helmet';
import helmetCsp from 'helmet-csp';
import hpp from 'hpp';
import http from 'http';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { startAllQueuesAndWorkers, stopAllQueuesAndWorkers } from './queues';
import { startAllWalletCrons } from './jobs/withdrawals';
import { startDeviceTokenCleanupCron, notifyInactiveUsersCron } from './jobs/deviceTokens';
import { userRouter } from './modules/user/routes';
import { wishlistRouter } from './modules/wishlist/routes';
import { walletRouter } from './modules/wallet/routes';
import { paystackWebhookController } from './modules/wallet/controller';
import { notificationRouter } from './modules/notification/routes';

dotenv.config();
/**
 *  uncaughtException handler
 */
process.on('uncaughtException', async (error: Error) => {
	console.error('UNCAUGHT EXCEPTION!! 💥 Server Shutting down... ' + new Date(Date.now()) + error.name, error.message);
	process.exit(1);
});

/**
 * Default app configurations
 */
const app: Express = express();
const port = ENVIRONMENT.APP.PORT;
const appName = ENVIRONMENT.APP.NAME;

//webhook
//app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }), paystackWebhookController.handleWebhook);
app.use('/api/v1/webhooks', express.json(), paystackWebhookController.handleWebhook);

/**
 * Express configuration
 */
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']); // Enable trust proxy
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * Compression Middleware
 */
app.use(compression());

// Rate limiter middleware
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

//Middleware to allow CORS from frontend
app.use(
	cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3000',
			'http://localhost:3001',
			'http://localhost:8081',
			'joygiver://localhost:8081',
			'https://joygiver.co',
			'https://www.joygiver.co',
			'https://joygiver-admin.vercel.app',
		],
		credentials: true,
	})
);

//Configure Content Security Policy (CSP)
//prevent Cross-Site Scripting (XSS) attacks by not allowing the loading of content from other domains.
const contentSecurityPolicy = {
	directives: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'"],
		styleSrc: ["'self'"],
		imgSrc: ["'self'"],
		frameAncestors: ["'none'"],
		objectSrc: ["'none'"],
		upgradeInsecureRequests: [],
	},
};

// Use Helmet middleware for security headers
app.use(
	helmet({
		contentSecurityPolicy: false, // Disable the default CSP middleware
	})
);
// Use helmet-csp middleware for Content Security Policy
app.use(helmetCsp(contentSecurityPolicy));

const helmetConfig: HelmetOptions = {
	// X-Frame-Options header to prevent clickjacking
	frameguard: { action: 'deny' },
	// X-XSS-Protection header to enable browser's built-in XSS protection
	xssFilter: true,
	// Referrer-Policy header
	referrerPolicy: { policy: 'strict-origin' },
	// Strict-Transport-Security (HSTS) header for HTTPS enforcement
	hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
};

app.use(helmet(helmetConfig));

//Secure cookies and other helmet-related configurations
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.permittedCrossDomainPolicies());

// Prevent browser from caching sensitive information
app.use((req, res, next) => {
	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
	res.set('Pragma', 'no-cache');
	res.set('Expires', '0');
	next();
});

// Prevent parameter pollution
app.use(
	hpp({
		whitelist: ['date', 'createdAt'], // whitelist some parameters
	})
);

/**
 * Logger Middleware
 */
app.use(morgan(ENVIRONMENT.APP.ENV !== 'development' ? 'combined' : 'dev', { stream }));
// Add request time to req object
app.use((req: Request, res: Response, next: NextFunction) => {
	req['requestTime'] = new Date().toISOString();
	next();
});

/**
 * Initialize routes
 */
app.use(validateModuleSchema);
app.use('/api/v1/alive', (req: Request, res: Response) => {
	res.status(200).json({ status: 'success', message: 'Server is up and running' });
});

app.use('/api/v1/user', userRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/wallet', walletRouter);
app.use('/api/v1/notification', notificationRouter);

// Swagger documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/swagger.json', (req: Request, res: Response) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});

app.all('/{*splat}', async (req, res) => {
	logger.error('route not found ' + new Date(Date.now()) + ' ' + req.originalUrl);
	res.status(404).json({
		status: 'error',
		message: `OOPs!! No handler defined for ${req.method.toUpperCase()}: ${
			req.url
		} route. Check the API documentation for more details.`,
	});
});

/**
 * Bootstrap server
 */

// to ensure all the express middlewares are set up before starting the socket server
// including security headers and other middlewares
const server = http.createServer(app);

const appServer = server.listen(port, async () => {
	await connectDb();
	//await connectRedis();
	(async () => {
		await startAllQueuesAndWorkers();
	})();
	console.log(`==> App ${appName ? `: ${appName}` : ''} is running on port ${port}`);
});

/**
 * Error handler middlewares
 */
app.use(timeoutMiddleware);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	errorHandler(err as AppError, req, res, next);
});

/**
 * unhandledRejection  handler
 */
process.on('unhandledRejection', async (error: Error) => {
	logger.error('UNHANDLED REJECTION! 💥 Server Shutting down... ' + new Date(Date.now()) + error.name, error.message);
	appServer.close(() => {
		process.exit(1);
	});
});

if (process.env.NODE_ENV === 'production') {
	startAllWalletCrons();
	startDeviceTokenCleanupCron();
	// notifyInactiveUsersCron();
	console.log('✅ cron jobs started');
}
notifyInactiveUsersCron();

async function shutdown() {
	console.log('Shutting down...');
	await disconnectDb();
	//await disconnectRedis();
	await stopAllQueuesAndWorkers();
	process.exit(0);
}

// graceful shutdown on SIGINT and SIGTERM
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
