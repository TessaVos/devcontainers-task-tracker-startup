import { Task, CreateTaskRequest, UpdateTaskRequest, TaskPriority, TaskStatus } from '../domain/task';
import { TaskRepository } from '../data/taskRepository';
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.nativeEnum(TaskPriority),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

export class TaskService {
  private taskRepository: TaskRepository;

  constructor(taskRepository: TaskRepository) {
    this.taskRepository = taskRepository;
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const validatedData = CreateTaskSchema.parse(taskData);
    return await this.taskRepository.create(validatedData);
  }

  async getTaskById(id: string): Promise<Task | null> {
    if (!this.isValidUUID(id)) {
      throw new Error('Invalid task ID format');
    }

    return await this.taskRepository.findById(id);
  }

  async getAllTasks(
    page: number = 1,
    limit: number = 50
  ): Promise<{
    tasks: Task[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 50;

    const offset = (page - 1) * limit;
    const tasks = await this.taskRepository.findAll(limit, offset);

    // In a real app, you'd want to get the total count for proper pagination
    return {
      tasks,
      pagination: {
        page,
        limit,
        total: tasks.length // This is simplified - in production you'd query the total count
      }
    };
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task | null> {
    if (!this.isValidUUID(id)) {
      throw new Error('Invalid task ID format');
    }

    const validatedUpdates = UpdateTaskSchema.parse(updates);
    return await this.taskRepository.update(id, validatedUpdates);
  }

  async deleteTask(id: string): Promise<boolean> {
    if (!this.isValidUUID(id)) {
      throw new Error('Invalid task ID format');
    }

    return await this.taskRepository.delete(id);
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}