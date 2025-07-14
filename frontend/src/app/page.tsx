'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '@/types/task';
import { TaskColumn } from '@/components/TaskColumn';
import TaskForm from '@/components/TaskForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragOverlay, 
  DragStartEvent, 
  closestCorners 
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Fetch tasks
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getTasks(),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => taskApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
      toast.success('Task created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) => 
      taskApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      toast.success('Task updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update task');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete task');
    },
  });

  // Handle task creation
  const handleCreateTask = (data: CreateTaskRequest | UpdateTaskRequest) => {
    // Ensure we have the required fields for creation
    const createData = data as CreateTaskRequest;
    createTaskMutation.mutate(createData);
  };

  // Handle task editing
  const handleEditTask = (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (editingTask) {
      const updateData = data as UpdateTaskRequest;
      updateTaskMutation.mutate({ id: editingTask.id, data: updateData });
    }
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Handle drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = filteredTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeTask = filteredTasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const activeContainer = activeTask.status;
    const overContainer = Object.values(TaskStatus).includes(overId as TaskStatus) 
      ? overId as TaskStatus 
      : filteredTasks.find(t => t.id === overId)?.status;

    if (!overContainer) return;

    // If dropping in a different container, update the task status
    if (activeContainer !== overContainer) {
      updateTaskMutation.mutate({ 
        id: activeTask.id, 
        data: { status: overContainer } 
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = filteredTasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Handle dropping on a column
    if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        updateTaskMutation.mutate({ 
          id: activeTask.id, 
          data: { status: newStatus } 
        });
      }
    }
  };

  // Filter tasks
  const filteredTasks = (tasksData?.tasks || []).filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status for better organization
  const groupedTasks = {
    [TaskStatus.TODO]: filteredTasks.filter(task => task.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.REVIEW]: filteredTasks.filter(task => task.status === TaskStatus.REVIEW),
    [TaskStatus.DONE]: filteredTasks.filter(task => task.status === TaskStatus.DONE),
  };

  const columnConfig = [
    { status: TaskStatus.TODO, title: 'To Do' },
    { status: TaskStatus.IN_PROGRESS, title: 'In Progress' },
    { status: TaskStatus.REVIEW, title: 'Review' },
    { status: TaskStatus.DONE, title: 'Done' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-600">Failed to load tasks</h2>
          <p className="text-gray-600">Please check if the backend server is running</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
            <p className="text-gray-600 mt-1">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} 
              {(statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && ' (filtered)'}
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              >
                <option value="all">All Status</option>
                <option value={TaskStatus.TODO}>To Do</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.REVIEW}>Review</option>
                <option value={TaskStatus.DONE}>Done</option>
              </Select>
              
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              >
                <option value="all">All Priority</option>
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.URGENT}>Urgent</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Task Board */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'No tasks match your filters' 
                : 'No tasks found'}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first task to get started!'}
            </p>
            
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {columnConfig.map((column) => (
              <TaskColumn
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={groupedTasks[column.status]}
                onEdit={setEditingTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="transform rotate-3 scale-105">
              {/* Simplified card for drag overlay */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {activeTask.title}
                </h3>
                <div className="mt-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activeTask.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Create Task Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Task"
          size="lg"
        >
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createTaskMutation.isPending}
          />
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          title="Edit Task"
          size="lg"
        >
          {editingTask && (
            <TaskForm
              task={editingTask}
              onSubmit={handleEditTask}
              onCancel={() => setEditingTask(null)}
              isLoading={updateTaskMutation.isPending}
            />
          )}
        </Modal>
      </div>
    </DndContext>
  );
}