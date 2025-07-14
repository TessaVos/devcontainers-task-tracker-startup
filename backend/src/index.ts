import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config, createDatabasePool } from '../config/database';
import { TaskRepository } from './data/taskRepository';
import { TaskService } from './services/taskService';
import { taskRoutes } from './api/taskRoutes';

async function buildApp() {
  const app = fastify({
    logger: {
      level: config.server.logLevel,
      transport: config.server.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      } : undefined
    }
  });

  // Security middleware
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  });

  // CORS middleware
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  });

  // Swagger documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Task Manager API',
        description: 'A production-ready task management API built with Fastify',
        version: '1.0.0',
      },
      host: `localhost:${config.server.port}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'tasks', description: 'Task management endpoints' }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // Database setup
  const dbPool = createDatabasePool();
  
  // Test database connection
  try {
    await dbPool.query('SELECT NOW()');
    app.log.info('Database connection established successfully');
  } catch (error) {
    app.log.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Initialize repositories and services
  const taskRepository = new TaskRepository(dbPool);
  const taskService = new TaskService(taskRepository);

  // Register API routes
  await app.register(async function (fastify) {
    await taskRoutes(fastify, taskService);
  }, { prefix: '/api/v1' });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    app.log.info('Starting graceful shutdown...');
    
    try {
      await dbPool.end();
      await app.close();
      app.log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      app.log.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    await app.listen({
      port: config.server.port,
      host: config.server.host
    });

    app.log.info(`Server running on http://${config.server.host}:${config.server.port}`);
    app.log.info(`API documentation available at http://${config.server.host}:${config.server.port}/docs`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export { buildApp, start };