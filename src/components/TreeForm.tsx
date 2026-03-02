import { useState, useEffect, useRef } from 'react';
import { Trees, Save, X, Trash2, Camera } from 'lucide-react';
import { OliveTree, TreeVariety, TreeHealth } from '../types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setVariety(initialData.variety);
      setHealth(initialData.health);
      setYieldEstimate(initialData.yieldEstimate.toString());
      setNotes(initialData.notes || '');
      setPhotoUrl(initialData.photoUrl);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({
      variety,
      health,
      yieldEstimate: Number(yieldEstimate) || 0,
      notes,
      photoUrl
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const resizedImage = await resizeImage(e.target.files[0]);
        setPhotoUrl(resizedImage);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("Σφάλμα κατά την επεξεργασία της εικόνας.");
      }
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trees className="text-lime-600" />
            {isNew ? 'Νέο Δέντρο' : 'Επεξεργασία Δέντρου'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo Section */}
          <div className="flex justify-center">
            <div 
                className="relative w-full h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors"
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
                    <div className="text-center text-gray-500">
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
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 hidden"
                >
                    <X size={16} />
                </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ποικιλία</label>
            <select 
              value={variety} 
              onChange={(e) => setVariety(e.target.value as TreeVariety)}
              className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-lime-500 outline-none"
            >
              <option value="koroneiki">Κορωνέικη</option>
              <option value="kalamon">Καλαμών</option>
              <option value="manaki">Μανάκι</option>
              <option value="other">Άλλη</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Κατάσταση</label>
              <select 
                value={health} 
                onChange={(e) => setHealth(e.target.value as TreeHealth)}
                className="w-full p-2 border rounded-lg bg-slate-50 outline-none"
              >
                <option value="good">Καλή 🟢</option>
                <option value="average">Μέτρια 🟡</option>
                <option value="poor">Κακή 🔴</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Εκτίμηση (kg)</label>
              <input 
                type="number" 
                value={yieldEstimate}
                onChange={(e) => setYieldEstimate(e.target.value)}
                placeholder="0"
                className="w-full p-2 border rounded-lg bg-slate-50 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-lg bg-slate-50 outline-none h-20 resize-none"
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
                    className="bg-red-100 text-red-600 p-3 rounded-xl hover:bg-red-200 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 bg-lime-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-lime-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Αποθήκευση
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
