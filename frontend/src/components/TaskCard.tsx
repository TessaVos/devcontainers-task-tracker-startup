import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { Calendar, User, Edit, Trash2, Clock, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium border';
    switch (priority) {
      case TaskPriority.LOW:
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case TaskPriority.MEDIUM:
        return `${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`;
      case TaskPriority.HIGH:
        return `${baseClasses} bg-orange-50 text-orange-700 border-orange-200`;
      case TaskPriority.URGENT:
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
  const isDueSoon = task.dueDate && !isOverdue && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000; // 3 days

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 group cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg rotate-3 scale-105' : ''
      }`}
    >
      <div className="space-y-4">
        {/* Header with drag handle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1">
            <div 
              {...attributes} 
              {...listeners}
              className="mt-1 p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
              {task.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {task.description}
          </p>
        )}

        {/* Priority and Due Date */}
        <div className="flex items-center justify-between">
          <span className={getPriorityBadge(task.priority)}>
            {task.priority.toUpperCase()}
          </span>
          
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-sm ${
              isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <Clock className="h-4 w-4" />
              <span>
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {task.assignedTo && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span>{task.assignedTo}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Created {format(new Date(task.createdAt), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {/* Actions - removed status change button */}
        <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(task)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(task.id)}
            className="flex items-center gap-1 ml-auto"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};