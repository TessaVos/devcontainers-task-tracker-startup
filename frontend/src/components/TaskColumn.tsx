import React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  title: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  tasks,
  title,
  onEdit,
  onDelete,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const getColumnStyle = () => {
    const baseStyle = 'min-h-[500px] p-4 rounded-lg border-2 border-dashed transition-all duration-200';
    
    if (isOver) {
      return `${baseStyle} border-blue-400 bg-blue-50`;
    }
    
    return `${baseStyle} border-gray-200 bg-gray-50`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 uppercase text-sm">
          {title} ({tasks.length})
        </h3>
      </div>
      
      <div ref={setNodeRef} className={getColumnStyle()}>
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">
                  {isOver ? 'Drop task here' : 'No tasks'}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};