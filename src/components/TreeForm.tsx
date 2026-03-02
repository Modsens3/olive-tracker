import { useState, useEffect, useRef } from 'react';
import { Trees, Save, X, Trash2, Camera, Check, Plus, Droplets } from 'lucide-react';
import { OliveTree, TreeVariety, TreeHealth, TreeTask, TaskType, HarvestRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface TreeFormProps {
  initialData?: OliveTree;
  onSave: (data: Omit<OliveTree, 'id' | 'dateAdded' | 'lat' | 'lng'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew: boolean;
}

// Helper για αλλαγή μεγέθους εικόνας
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compression 0.7
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function TreeForm({ initialData, onSave, onCancel, onDelete, isNew }: TreeFormProps) {
  const [variety, setVariety] = useState<TreeVariety>('koroneiki');
  const [health, setHealth] = useState<TreeHealth>('good');
  const [yieldEstimate, setYieldEstimate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [tasks, setTasks] = useState<TreeTask[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showHarvestInput, setShowHarvestInput] = useState(false);
  const [newTaskType, setNewTaskType] = useState<TaskType>('other');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newHarvestKg, setNewHarvestKg] = useState('');
  const [newHarvestDate, setNewHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setVariety(initialData.variety);
      setHealth(initialData.health);
      setYieldEstimate(initialData.yieldEstimate.toString());
      setNotes(initialData.notes || '');
      setPhotoUrl(initialData.photoUrl);
      setTasks(initialData.tasks || []);
      setHarvests(initialData.harvests || []);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({
      variety,
      health,
      yieldEstimate: Number(yieldEstimate) || 0,
      notes,
      photoUrl,
      tasks,
      harvests
    });
  };

  const handleAddTask = () => {
    const newTask: TreeTask = {
        id: uuidv4(),
        type: newTaskType,
        status: 'pending',
        date: new Date().toISOString(),
        description: newTaskDesc
    };
    setTasks([...tasks, newTask]);
    setShowTaskInput(false);
    setNewTaskDesc('');
    setNewTaskType('other');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(t => 
        t.id === taskId 
        ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } 
        : t
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleAddHarvest = () => {
    if (!newHarvestKg) return;
    const newHarvest: HarvestRecord = {
        id: uuidv4(),
        date: newHarvestDate,
        amountKg: Number(newHarvestKg),
    };
    setHarvests([...harvests, newHarvest]);
    setShowHarvestInput(false);
    setNewHarvestKg('');
  };

  const deleteHarvest = (id: string) => {
    setHarvests(harvests.filter(h => h.id !== id));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const resizedImage = await resizeImage(e.target.files[0]);
        setPhotoUrl(resizedImage);
      } catch (error) {
        console.error("Error resizing image:", error);
        toast.error("Σφάλμα κατά την επεξεργασία της εικόνας.");
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Trees className="text-lime-600 dark:text-lime-500" />
            {isNew ? 'Νέο Δέντρο' : 'Επεξεργασία Δέντρου'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo Section */}
          <div className="flex justify-center">
            <div 
                className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                {photoUrl ? (
                    <>
                        <img src={photoUrl} alt="Tree" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold">Αλλαγή</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <Camera className="mx-auto mb-2" size={32} />
                        <span className="text-sm">Προσθήκη Φωτογραφίας</span>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
            {photoUrl && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setPhotoUrl(undefined);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 flex items-center justify-center z-10"
                    title="Διαγραφή Φωτογραφίας"
                >
                    <X size={16} />
                </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ποικιλία</label>
            <select 
              value={variety} 
              onChange={(e) => setVariety(e.target.value as TreeVariety)}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
            >
              <option value="koroneiki">Κορωνέικη</option>
              <option value="kalamon">Καλαμών</option>
              <option value="manaki">Μανάκι</option>
              <option value="other">Άλλη</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Κατάσταση</label>
              <select 
                value={health} 
                onChange={(e) => setHealth(e.target.value as TreeHealth)}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
              >
                <option value="good">Καλή 🟢</option>
                <option value="average">Μέτρια 🟡</option>
                <option value="poor">Κακή 🔴</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Εκτίμηση (kg)</label>
              <input 
                type="number" 
                value={yieldEstimate}
                onChange={(e) => setYieldEstimate(e.target.value)}
                placeholder="0"
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Tasks Section */}
          <div className="border-t border-b py-3 border-gray-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Εργασίες</label>
                 <button 
                    onClick={() => setShowTaskInput(!showTaskInput)}
                    className="text-xs bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                 >
                     <Plus size={12} />
                     Νέα
                 </button>
             </div>

             {showTaskInput && (
                 <div className="bg-lime-50 dark:bg-lime-900/20 p-3 rounded-lg mb-3 animate-in fade-in slide-in-from-top-2">
                     <select 
                        value={newTaskType}
                        onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                        className="w-full p-2 mb-2 text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                     >
                         <option value="pruning">✂️ Κλάδεμα</option>
                         <option value="spraying">💧 Ράντισμα</option>
                         <option value="fertilizing">🌱 Λίπανση</option>
                         <option value="harvest">🫒 Συγκομιδή</option>
                         <option value="other">📝 Άλλο</option>
                     </select>
                     <input 
                        type="text" 
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        placeholder="Περιγραφή (προαιρετικό)"
                        className="w-full p-2 mb-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                     />
                     <div className="flex justify-end gap-2">
                         <button onClick={() => setShowTaskInput(false)} className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">Άκυρο</button>
                         <button onClick={handleAddTask} className="text-xs bg-lime-600 text-white px-3 py-1 rounded font-bold hover:bg-lime-700 transition-colors">Προσθήκη</button>
                     </div>
                 </div>
             )}

             <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tasks.length === 0 && !showTaskInput && (
                      <p className="text-xs text-gray-400 italic text-center py-2">Καμία εργασία.</p>
                  )}
                  {[...tasks].sort((a, b) => {
                    if (a.status === b.status) return 0;
                    return a.status === 'pending' ? -1 : 1;
                  }).map(task => (
                      <div key={task.id} className={`flex items-center justify-between p-2 rounded-lg ${task.status === 'completed' ? 'bg-gray-100 dark:bg-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50 shadow-sm'}`}>
                          <div className="flex items-center gap-2">
                              <button 
                                 onClick={() => toggleTaskStatus(task.id)}
                                 className={`w-5 h-5 rounded-full border flex items-center justify-center ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
                              >
                                  {task.status === 'completed' && <Check size={12} className="text-white" />}
                              </button>
                              <div>
                                  <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                      {task.type === 'pruning' && '✂️ Κλάδεμα'}
                                      {task.type === 'spraying' && '💧 Ράντισμα'}
                                      {task.type === 'fertilizing' && '🌱 Λίπανση'}
                                      {task.type === 'harvest' && '🫒 Συγκομιδή'}
                                      {task.type === 'other' && '📝 Άλλο'}
                                  </p>
                                  {task.description && <p className="text-xs text-gray-500 dark:text-gray-400">{task.description}</p>}
                              </div>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">
                              <X size={14} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          {/* Harvest Section */}
          <div className="border-t border-b py-3 border-gray-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Droplets size={16} className="text-lime-600 dark:text-lime-500"/>
                    Ιστορικό Συγκομιδής
                 </label>
                 <button 
                    onClick={() => setShowHarvestInput(!showHarvestInput)}
                    className="text-xs bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                 >
                     <Plus size={12} />
                     Νέα
                 </button>
             </div>

             {showHarvestInput && (
                 <div className="bg-lime-50 dark:bg-lime-900/20 p-3 rounded-lg mb-3 animate-in fade-in slide-in-from-top-2">
                     <div className="flex gap-2 mb-2">
                        <input 
                            type="date" 
                            value={newHarvestDate}
                            onChange={(e) => setNewHarvestDate(e.target.value)}
                            className="w-1/2 p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                        <input 
                            type="number" 
                            value={newHarvestKg}
                            onChange={(e) => setNewHarvestKg(e.target.value)}
                            placeholder="Κιλά (kg)"
                            className="w-1/2 p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                     </div>
                     <div className="flex justify-end gap-2">
                         <button onClick={() => setShowHarvestInput(false)} className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">Άκυρο</button>
                         <button onClick={handleAddHarvest} className="text-xs bg-lime-600 text-white px-3 py-1 rounded font-bold hover:bg-lime-700 transition-colors">Προσθήκη</button>
                     </div>
                 </div>
             )}

             <div className="space-y-2 max-h-40 overflow-y-auto">
                  {harvests.length === 0 && !showHarvestInput && (
                      <p className="text-xs text-gray-400 italic text-center py-2">Καμία καταγραφή.</p>
                  )}
                  {harvests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(h => (
                      <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-lime-100 dark:border-lime-900 shadow-sm">
                          <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{h.amountKg} kg</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(h.date).toLocaleDateString('el-GR')}</p>
                          </div>
                          <button onClick={() => deleteHarvest(h.id)} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">
                              <X size={14} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Σημειώσεις</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none h-20 resize-none"
              placeholder="π.χ. θέλει κλάδεμα..."
            />
          </div>

          <div className="flex gap-2 mt-2">
            {!isNew && onDelete && (
                <button 
                    onClick={() => {
                        if(window.confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό το δέντρο;')) {
                            onDelete();
                        }
                    }}
                    className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 bg-lime-600 dark:bg-lime-700 text-white py-3 rounded-xl font-bold text-lg hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Αποθήκευση
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
