import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TaskService } from '../services/taskService';
import { CreateTaskRequest, UpdateTaskRequest } from '../domain/task';

interface TaskRouteParams {
  id: string;
}

interface TaskQueryParams {
  page?: number;
  limit?: number;
}

export async function taskRoutes(fastify: FastifyInstance, taskService: TaskService) {
  // Create task
  fastify.post<{ Body: CreateTaskRequest }>('/tasks', {
    schema: {
      description: 'Create a new task',
      tags: ['tasks'],
      body: {
        type: 'object',
        required: ['title', 'priority'],
        properties: {
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          assignedTo: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
            assignedTo: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            dueDate: { type: 'string' }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Body: CreateTaskRequest }>, 
      reply: FastifyReply
    ) => {
      try {
        const task = await taskService.createTask(request.body);
        return reply.code(201).send(task);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({ error: 'Invalid task data' });
      }
    }
  });

  // Get all tasks
  fastify.get<{ Querystring: TaskQueryParams }>('/tasks', {
    schema: {
      description: 'Get all tasks with pagination',
      tags: ['tasks'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Querystring: TaskQueryParams }>, 
      reply: FastifyReply
    ) => {
      try {
        const { page = 1, limit = 50 } = request.query;
        const result = await taskService.getAllTasks(page, limit);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Get task by ID
  fastify.get<{ Params: TaskRouteParams }>('/tasks/:id', {
    schema: {
      description: 'Get a task by ID',
      tags: ['tasks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Params: TaskRouteParams }>, 
      reply: FastifyReply
    ) => {
      try {
        const task = await taskService.getTaskById(request.params.id);
        
        if (!task) {
          return reply.code(404).send({ error: 'Task not found' });
        }
        
        return reply.send(task);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({ error: 'Invalid task ID' });
      }
    }
  });

  // Update task
  fastify.put<{ Params: TaskRouteParams; Body: UpdateTaskRequest }>('/tasks/:id', {
    schema: {
      description: 'Update a task',
      tags: ['tasks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          assignedTo: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Params: TaskRouteParams; Body: UpdateTaskRequest }>, 
      reply: FastifyReply
    ) => {
      try {
        const task = await taskService.updateTask(request.params.id, request.body);
        
        if (!task) {
          return reply.code(404).send({ error: 'Task not found' });
        }
        
        return reply.send(task);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({ error: 'Invalid task data' });
      }
    }
  });

  // Delete task
  fastify.delete<{ Params: TaskRouteParams }>('/tasks/:id', {
    schema: {
      description: 'Delete a task',
      tags: ['tasks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{ Params: TaskRouteParams }>, 
      reply: FastifyReply
    ) => {
      try {
        const deleted = await taskService.deleteTask(request.params.id);
        
        if (!deleted) {
          return reply.code(404).send({ error: 'Task not found' });
        }
        
        return reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({ error: 'Invalid task ID' });
      }
    }
  });
}