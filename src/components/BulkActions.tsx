import { useState } from 'react';
import { X, Trash2, ListChecks } from 'lucide-react';
import { TaskType } from '../types';

interface BulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  onAddTasks: (type: TaskType, desc: string) => void;
  onDelete: () => void;
}

export default function BulkActions({ selectedCount, onClear, onAddTasks, onDelete }: BulkActionsProps) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>('spraying');
  const [taskDesc, setTaskDesc] = useState('');

  const handleAddTask = () => {
    onAddTasks(taskType, taskDesc);
    setShowTaskForm(false);
    setTaskDesc('');
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[2000] w-full max-w-md px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-10">
        
        {/* Header / Main Bar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="bg-lime-600 dark:bg-lime-700 text-white text-xs font-bold px-2 py-1 rounded-full">
              {selectedCount}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Επιλεγμένα</span>
          </div>
          <button onClick={onClear} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        {!showTaskForm ? (
          <div className="p-3 flex gap-2 justify-center">
            <button 
              onClick={() => setShowTaskForm(true)}
              className="flex-1 bg-lime-600 dark:bg-lime-700 text-white py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors"
            >
              <ListChecks size={18} />
              Προσθήκη Εργασίας
            </button>
            <button 
              onClick={onDelete}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-lime-50 dark:bg-lime-900/20">
            <p className="text-xs font-bold text-lime-800 dark:text-lime-200 mb-2 uppercase">Μαζική Ανάθεση Εργασίας</p>
            
            <select 
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              className="w-full p-2 mb-2 text-sm border rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none"
            >
                <option value="pruning">✂️ Κλάδεμα</option>
                <option value="spraying">💧 Ράντισμα</option>
                <option value="fertilizing">🌱 Λίπανση</option>
                <option value="harvest">🫒 Συγκομιδή</option>
                <option value="other">📝 Άλλο</option>
            </select>
            
            <input 
              type="text" 
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Σχόλιο (προαιρετικό)"
              className="w-full p-2 mb-3 text-sm border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none"
            />
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowTaskForm(false)}
                className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Ακύρωση
              </button>
              <button 
                onClick={handleAddTask}
                className="flex-1 bg-lime-600 dark:bg-lime-700 text-white py-2 rounded-lg text-xs font-bold hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors"
              >
                Εφαρμογή σε {selectedCount}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
