'use client';

import { useState, useEffect } from 'react';
import { Task, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../types/task';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskForm({ 
  task, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || TaskPriority.MEDIUM,
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // For create operations, ensure title is provided
    if (!task && !formData.title.trim()) {
      return;
    }

    const submitData: CreateTaskRequest | UpdateTaskRequest = task
      ? {
          // Update request - only include changed fields
          ...(formData.title !== task.title && { title: formData.title }),
          ...(formData.description !== (task.description || '') && { 
            description: formData.description 
          }),
          ...(formData.priority !== task.priority && { priority: formData.priority }),
          ...(formData.assignedTo !== (task.assignedTo || '') && { 
            assignedTo: formData.assignedTo 
          }),
          ...(formData.dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '') && {
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          }),
        }
      : {
          // Create request - include all required fields
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          assignedTo: formData.assignedTo || undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        };

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const priorityOptions = [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
    { value: TaskPriority.URGENT, label: 'Urgent' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter task title"
          required={!task}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter task description"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <Select
          id="priority"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          disabled={isLoading}
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
          Assigned To
        </label>
        <Input
          id="assignedTo"
          value={formData.assignedTo}
          onChange={(e) => handleChange('assignedTo', e.target.value)}
          placeholder="Enter assignee name"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
          Due Date
        </label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => handleChange('dueDate', e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || (!task && !formData.title.trim())}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}