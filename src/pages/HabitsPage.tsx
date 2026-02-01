import React, { memo } from 'react';
import { useData } from '@/features/data';
import HabitTable from '@/components/HabitTable';
import HabitForm from '@/components/HabitForm';

const HabitsPage: React.FC = () => {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useData();

  return (
    <div className="p-6 space-y-6" data-testid="habits-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mes Habitudes</h1>
      </div>
      
      <HabitForm onAdd={addHabit} />
      
      <HabitTable 
        habits={habits}
        onUpdate={updateHabit}
        onDelete={deleteHabit}
        onToggle={toggleHabitCompletion}
      />
    </div>
  );
};

export default memo(HabitsPage);
