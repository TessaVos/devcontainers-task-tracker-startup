import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../domain/task';

export class TaskRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(taskData: CreateTaskRequest): Promise<Task> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const id = randomUUID();
      const now = new Date();
      
      const query = `
        INSERT INTO tasks (id, title, description, status, priority, assigned_to, created_at, updated_at, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        id,
        taskData.title,
        taskData.description || null,
        TaskStatus.TODO,
        taskData.priority,
        taskData.assignedTo || null,
        now,
        now,
        taskData.dueDate ? new Date(taskData.dueDate) : null
      ];

      const result = await client.query(query, values);
      return this.mapRowToTask(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Task | null> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM tasks WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToTask(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Task[]> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM tasks 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await client.query(query, [limit, offset]);
      
      return result.rows.map(row => this.mapRowToTask(row));
    } finally {
      client.release();
    }
  }

  async update(id: string, updates: UpdateTaskRequest): Promise<Task | null> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.title !== undefined) {
        setClauses.push(`title = $${paramCount++}`);
        values.push(updates.title);
      }
      
      if (updates.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      
      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      
      if (updates.priority !== undefined) {
        setClauses.push(`priority = $${paramCount++}`);
        values.push(updates.priority);
      }
      
      if (updates.assignedTo !== undefined) {
        setClauses.push(`assigned_to = $${paramCount++}`);
        values.push(updates.assignedTo);
      }
      
      if (updates.dueDate !== undefined) {
        setClauses.push(`due_date = $${paramCount++}`);
        values.push(updates.dueDate ? new Date(updates.dueDate) : null);
      }

      if (setClauses.length === 0) {
        return this.findById(id);
      }

      setClauses.push(`updated_at = $${paramCount++}`);
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE tasks 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToTask(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM tasks WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dueDate: row.due_date
    };
  }
}