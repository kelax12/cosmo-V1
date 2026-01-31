import React from 'react';
import { useTasks } from '@/context/TaskContext';

type TaskCategoryProps = {
  category: string;
};

const TaskCategoryIndicator: React.FC<TaskCategoryProps> = ({ category }) => {
  const { categories } = useTasks();
  const categoryData = categories.find(cat => cat.id === category);
  
  return (
    <div 
      className="w-6 h-6 rounded" 
      style={{ 
        backgroundColor: categoryData?.color || '#CBD5E1' 
      }}
    ></div>
  );
};

export default TaskCategoryIndicator;
