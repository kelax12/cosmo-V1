import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bookmark, Calendar, MoreHorizontal, Trash2, BookmarkCheck, UserPlus, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Task, useTasks } from '@/context/TaskContext';
import TaskCategoryIndicator from './TaskCategoryIndicator';
import TaskModal from './TaskModal';
import EventModal from './EventModal';
import CollaboratorModal from './CollaboratorModal';
import AddToListModal from './AddToListModal';

type TaskTableProps = {
  tasks?: Task[];
  sortField?: string;
  showCompleted?: boolean;
  selectedTaskId?: string | null;
  onTaskModalClose?: () => void;
};

const TaskTable: React.FC<TaskTableProps> = ({ 
  tasks: propTasks, 
  sortField: propSortField, 
  showCompleted = false,
  selectedTaskId: externalSelectedTaskId,
  onTaskModalClose
}) => {
  const { tasks: contextTasks, deleteTask, toggleBookmark, toggleComplete, addEvent, priorityRange, categories } = useTasks();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [localSortField, setLocalSortField] = useState<string | undefined>(propSortField);

  useEffect(() => {
    if (propSortField) {
      setLocalSortField(propSortField);
    }
  }, [propSortField]);

  useEffect(() => {
    setSortDirection('asc');
  }, [localSortField]);

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedTaskForCollaborators, setSelectedTaskForCollaborators] = useState<string | null>(null);
  const [addToListTask, setAddToListTask] = useState<string | null>(null);
  const [collaboratorModalTask, setCollaboratorModalTask] = useState<string | null>(null);
  const [taskToEventModal, setTaskToEventModal] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'none' | 'favoris' | 'terminées' | 'retard' | 'collaboration'>('none');

  const tasks = propTasks || contextTasks;

  const toggleQuickFilter = (filter: 'favoris' | 'terminées' | 'retard' | 'collaboration') => {
    setActiveQuickFilter(prev => prev === filter ? 'none' : filter);
  };

  useEffect(() => {
    if (externalSelectedTaskId) {
      setSelectedTask(externalSelectedTaskId);
    }
  }, [externalSelectedTaskId]);

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    if (onTaskModalClose) {
      onTaskModalClose();
    }
  };

  const handleSort = (field: string) => {
    if (localSortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortField(field);
      setSortDirection('asc');
    }
  };

  let filteredTasksForView;
  const now = new Date();

    switch (activeQuickFilter) {
      case 'favoris':
        filteredTasksForView = tasks.filter(task => task.bookmarked && !task.completed);
        break;
      case 'terminées':
        filteredTasksForView = tasks.filter(task => task.completed);
        break;
      case 'retard':
        filteredTasksForView = tasks.filter(task => !task.completed && new Date(task.deadline) < now);
        break;
      case 'collaboration':
        filteredTasksForView = tasks.filter(task => task.isCollaborative && !task.completed);
        break;
      default:
      filteredTasksForView = showCompleted 
        ? tasks.filter(task => task.completed)
        : tasks.filter(task => !task.completed);
  }

  const filteredTasks = filteredTasksForView.filter(task => 
    task.priority >= priorityRange[0] && task.priority <= priorityRange[1]
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (localSortField) {
      let comparison = 0;
      if (localSortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (localSortField === 'priority') {
        comparison = a.priority - b.priority;
      } else if (localSortField === 'deadline') {
        comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (localSortField === 'estimatedTime') {
        comparison = a.estimatedTime - b.estimatedTime;
      } else if (localSortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (localSortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (localSortField === 'completedAt' && showCompleted) {
        const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        comparison = aDate - bDate;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (a.bookmarked && !b.bookmarked) return -1;
    if (!a.bookmarked && b.bookmarked) return 1;

    return 0;
  });

  const selectedTaskData = tasks.find(task => task.id === selectedTask);
  const selectedTaskForCollaboratorsData = tasks.find(task => task.id === selectedTaskForCollaborators);

  const handleCreateEventFromTask = (eventData: any) => {
    if (taskToEventModal) {
      addEvent({
        ...eventData,
        taskId: taskToEventModal.id
      });
    }
    setTaskToEventModal(null);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return 'N/A';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const [isHovered, setIsHovered] = useState(false);
    const category = categories.find(c => c.id === task.category);
    const categoryColor = category?.color || '#3B82F6';
    
    return (
      <div 
        className={`p-4 rounded-xl border mb-3 transition-all cursor-pointer ${task.completed ? 'opacity-75' : ''}`}
        onClick={() => setSelectedTask(task.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          backgroundColor: activeQuickFilter === 'retard' 
            ? (isHovered ? 'rgb(var(--color-error) / 0.25)' : 'rgb(var(--color-error) / 0.15)') 
            : (task.bookmarked 
                ? (isHovered ? 'rgba(234, 179, 8, 0.25)' : 'rgba(234, 179, 8, 0.15)') 
                : (isHovered ? `${categoryColor}25` : `${categoryColor}10`)),
          borderColor: activeQuickFilter === 'retard'
            ? (isHovered ? 'rgb(var(--color-error))' : 'rgb(var(--color-error) / 0.7)')
            : (task.bookmarked 
                ? (isHovered ? '#EAB308' : 'rgba(234, 179, 8, 0.6)') 
                : (isHovered ? categoryColor : 'rgb(var(--color-border))')),
          borderLeftWidth: '4px',
          borderLeftColor: activeQuickFilter === 'retard' ? 'rgb(var(--color-error))' : (task.bookmarked ? '#EAB308' : categoryColor)
        }}
      >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(task.id);
            }}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              task.completed 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-400 hover:border-blue-500'
            }`}
          >
            {task.completed && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <TaskCategoryIndicator category={task.category} />
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-flex justify-center items-center w-7 h-7 rounded-full task-priority-${task.priority} text-xs font-bold`}>
            {task.priority}
          </span>
        </div>
      </div>
      
      <h4 className={`font-semibold text-lg mb-2 ${task.completed ? 'line-through' : ''}`} style={{ color: 'rgb(var(--color-text-primary))' }}>
        {task.name}
      </h4>
      
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[rgb(var(--color-text-secondary))] mb-3">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{formatDate(task.deadline)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{task.estimatedTime}h</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-[rgb(var(--color-border))]">
        <div className="flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleBookmark(task.id); }} 
            className={`p-2 rounded ${task.bookmarked ? 'text-amber-500' : 'text-slate-400'}`}
          >
            <Bookmark size={18} fill={task.bookmarked ? 'currentColor' : 'none'} />
          </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCollaboratorModalTask(task.id); }}
              className="p-2 text-slate-400"
            >
              <UserPlus size={18} />
            </button>
            {!task.completed && (
              <button 
                onClick={(e) => { e.stopPropagation(); setTaskToEventModal(task); }}
                className="p-2 text-slate-400"
              >
                <Calendar size={18} />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedTask(task.id); }}
              className="p-2 text-slate-400"
            >
              <MoreHorizontal size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }} 
              className="p-2 text-red-400"
            >
              <Trash2 size={18} />
            </button>
          </div>
      </div>
    </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleQuickFilter('favoris')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm border ${
              activeQuickFilter === 'favoris' 
                ? 'bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:border-blue-600 monochrome:bg-white monochrome:text-black monochrome:border-white shadow-md' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 monochrome:bg-neutral-900 monochrome:text-neutral-300 monochrome:border-neutral-700 monochrome:hover:bg-neutral-800'
            }`}
          >
            {activeQuickFilter === 'favoris' ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            <span className="hidden sm:inline">{activeQuickFilter === 'favoris' ? 'Tous' : 'Favoris'}</span>
            <span className="sm:hidden">Favoris</span>
          </button>

          <button
            onClick={() => toggleQuickFilter('terminées')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm border ${
              activeQuickFilter === 'terminées'
                ? 'bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:border-blue-600 monochrome:bg-white monochrome:text-black monochrome:border-white shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 monochrome:bg-neutral-900 monochrome:text-neutral-300 monochrome:border-neutral-700 monochrome:hover:bg-neutral-800'
            }`}
          >
            <CheckCircle2 size={20} />
            <span className="hidden sm:inline">Terminées</span>
            <span className="sm:hidden">Fait</span>
          </button>

            <button
              onClick={() => toggleQuickFilter('retard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm border ${
                activeQuickFilter === 'retard'
                  ? 'bg-red-100 dark:bg-red-900/30 monochrome:bg-neutral-800 text-red-600 dark:text-red-400 monochrome:text-neutral-300 border border-red-300 dark:border-red-700 monochrome:border-neutral-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 monochrome:bg-neutral-900 monochrome:text-neutral-300 monochrome:border-neutral-700 monochrome:hover:bg-neutral-800'
              }`}
            >
              <AlertTriangle size={20} />
              <span className="hidden sm:inline">Retard</span>
              <span className="sm:hidden">Retard</span>
            </button>

            <button
              onClick={() => toggleQuickFilter('collaboration')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm border ${
                activeQuickFilter === 'collaboration'
                  ? 'bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:border-blue-600 monochrome:bg-white monochrome:text-black monochrome:border-white shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 monochrome:bg-neutral-900 monochrome:text-neutral-300 monochrome:border-neutral-700 monochrome:hover:bg-neutral-800'
              }`}
            >
              <Users size={20} />
              <span className="hidden sm:inline">Collaboration</span>
              <span className="sm:hidden">Collab</span>
            </button>
        </div>
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block table-container shadow-sm overflow-x-auto">
        <table className="data-table w-full" style={{ minWidth: '1000px' }}>
          <thead>
            <tr className="monochrome:bg-neutral-900 monochrome:text-neutral-200">
              <th className="px-2 py-3 monochrome:border-neutral-700" style={{ width: '40px' }}></th>
              <th className="px-1 py-3 monochrome:border-neutral-700" style={{ width: '30px' }}></th>
              <th 
                className="cursor-pointer px-2 py-3 monochrome:border-neutral-700 monochrome:hover:bg-neutral-800"
                onClick={() => handleSort('name')}
              >
                Nom de la tache
                {localSortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="cursor-pointer text-center px-1 py-3"
                onClick={() => handleSort('priority')}
                style={{ width: '70px' }}
              >
                Priorité
                {localSortField === 'priority' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="cursor-pointer px-2 py-3"
                onClick={() => handleSort('deadline')}
                style={{ width: '100px' }}
              >
                Dead line
                {localSortField === 'deadline' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
                <th 
                  className="cursor-pointer text-center px-1 py-3"
                  onClick={() => handleSort('estimatedTime')}
                  style={{ width: '70px' }}
                >
                  TEMPS (min)
                  {localSortField === 'estimatedTime' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-center px-1 py-3" style={{ width: '220px' }}>Actions</th>
              <th 
                className="cursor-pointer px-2 py-3"
                onClick={() => handleSort(showCompleted ? 'completedAt' : 'createdAt')}
                style={{ width: '90px' }}
              >
                {showCompleted ? 'Réalisé' : 'Créé'}
                {localSortField === (showCompleted ? 'completedAt' : 'createdAt') && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTasks.map((task) => (
              <tr 
                key={task.id} 
                className={`animate-fade-in cursor-pointer transition-colors ${task.completed ? 'opacity-75' : ''}`}
                onClick={() => setSelectedTask(task.id)}
                style={{ 
                  backgroundColor: activeQuickFilter === 'retard' 
                    ? 'rgb(var(--color-error) / 0.3)' 
                    : (task.bookmarked ? 'rgba(234, 179, 8, 0.2)' : 'transparent'),
                  borderLeft: activeQuickFilter === 'retard'
                    ? '4px solid rgb(var(--color-error))'
                    : (task.bookmarked ? '4px solid #EAB308' : '3px solid transparent')
                }}
              >
                <td className="px-2 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      task.completed 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-400 hover:border-blue-500'
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </td>
                <td className="px-1 py-4 whitespace-nowrap">
                  <TaskCategoryIndicator category={task.category} />
                </td>
                <td className={`font-medium px-2 py-4 text-base ${task.completed ? 'line-through' : ''}`} 
                    style={{ color: task.completed ? 'rgb(var(--color-text-muted))' : 'rgb(var(--color-text-primary))' }}>
                  <div className="truncate" title={task.name}>
                    {task.name}
                  </div>
                </td>
                <td className="text-center px-1 py-4 whitespace-nowrap">
                  <span className={`inline-flex justify-center items-center w-8 h-8 rounded-full task-priority-${task.priority} text-base font-bold`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-2 py-4 whitespace-nowrap text-base font-medium">
                  {formatDate(task.deadline)}
                </td>
                <td className="text-center px-1 py-4 whitespace-nowrap text-base font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{task.estimatedTime}</td>
                <td onClick={e => e.stopPropagation()} className="px-2 py-4 whitespace-nowrap">
                  <div className="flex justify-center items-center gap-1">
                      <button 
                        onClick={() => toggleBookmark(task.id)} 
                        className={`p-2 rounded transition-colors ${task.bookmarked ? 'favorite-icon filled' : ''}`}
                        style={{ 
                          color: task.bookmarked ? '#EAB308' : 'rgb(var(--color-text-muted))'
                        }}
                      >
                        {task.bookmarked ? <BookmarkCheck size={16} fill="#EAB308" /> : <Bookmark size={16} />}
                      </button>
                    {!task.completed && (
                      <button 
                        onClick={() => setTaskToEventModal(task)}
                        className="p-2 rounded transition-colors"
                        style={{ color: 'rgb(var(--color-text-muted))' }}
                      >
                        <Calendar size={16} />
                      </button>
                    )}
                      <button 
                          onClick={() => setAddToListTask(task.id)}
                          className="p-2 rounded transition-colors"
                          style={{ color: 'rgb(var(--color-text-muted))' }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      <button 
                        onClick={() => setCollaboratorModalTask(task.id)}
                        className="p-2 rounded transition-colors"
                        style={{ color: 'rgb(var(--color-text-muted))' }}
                      >
                        <UserPlus size={16} />
                      </button>
                        <button 
                          onClick={() => setTaskToDelete(task.id)} 
                          className="p-2 rounded transition-colors"
                          style={{ color: 'rgb(var(--color-text-muted))' }}
                        >
                          <Trash2 size={16} />
                        </button>
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap text-base" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  {showCompleted && task.completedAt 
                    ? formatDate(task.completedAt) 
                    : formatDate(task.createdAt)
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden">
        {sortedTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {sortedTasks.length === 0 && (
        <div className="text-center py-12" style={{ color: 'rgb(var(--color-text-muted))' }}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
            {showCompleted ? 'Aucune tâche complétée' : 'Aucune tâche'}
          </h3>
          <p className="text-sm">
            {showCompleted ? 'Complétez des tâches pour les voir ici' : 'Créez votre première tâche pour commencer'}
          </p>
        </div>
      )}

      {selectedTaskData && (
        <TaskModal
          task={selectedTaskData}
          isOpen={!!selectedTask}
          onClose={handleCloseTaskModal}
        />
      )}

      {selectedTaskForCollaboratorsData && (
        <TaskModal
          task={selectedTaskForCollaboratorsData}
          isOpen={!!selectedTaskForCollaborators}
          onClose={() => setSelectedTaskForCollaborators(null)}
          showCollaborators={true}
        />
      )}

      {collaboratorModalTask && (
        <CollaboratorModal
          isOpen={!!collaboratorModalTask}
          onClose={() => setCollaboratorModalTask(null)}
          taskId={collaboratorModalTask}
        />
      )}

      {taskToEventModal && (
        <EventModal
          mode="convert"
          isOpen={true}
          onClose={() => setTaskToEventModal(null)}
          task={taskToEventModal}
          onConvert={handleCreateEventFromTask}
        />
      )}

        {taskToDelete && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 monochrome:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 monochrome:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 monochrome:border-neutral-700"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 monochrome:bg-neutral-800 flex items-center justify-center mb-4">
                  <Trash2 className="text-red-600 dark:text-red-400 monochrome:text-neutral-300" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Supprimer la tâche</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTaskToDelete(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 monochrome:border-neutral-600 hover:bg-slate-50 dark:hover:bg-slate-700 monochrome:hover:bg-neutral-800 transition-all duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 monochrome:bg-white monochrome:text-black monochrome:hover:bg-neutral-200 transition-all duration-200 shadow-md shadow-red-500/20 monochrome:shadow-white/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          )}

        {addToListTask && (
          <AddToListModal
            isOpen={true}
            onClose={() => setAddToListTask(null)}
            taskId={addToListTask}
          />
        )}
    </>
  );
};

export default TaskTable;
