import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Trees, Sprout, Save, X } from 'lucide-react';
import Map from './components/Map';
import { OliveTree, TreeVariety, TreeHealth } from './types';

function App() {
  const [trees, setTrees] = useState<OliveTree[]>(() => {
    const saved = localStorage.getItem('olive_trees');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showForm, setShowForm] = useState(false);
  const [newTreeLoc, setNewTreeLoc] = useState<{lat: number, lng: number} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Form State
  const [variety, setVariety] = useState<TreeVariety>('koroneiki');
  const [health, setHealth] = useState<TreeHealth>('good');
  const [yieldEstimate, setYieldEstimate] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('olive_trees', JSON.stringify(trees));
  }, [trees]);

  const handleAddTreeStart = (lat: number, lng: number) => {
    setNewTreeLoc({ lat, lng });
    setShowForm(true);
  };

  const handleSaveTree = () => {
    if (!newTreeLoc) return;
    
    const newTree: OliveTree = {
      id: uuidv4(),
      lat: newTreeLoc.lat,
      lng: newTreeLoc.lng,
      variety,
      health,
      yieldEstimate: Number(yieldEstimate) || 0,
      notes,
      dateAdded: new Date().toISOString()
    };

    setTrees([...trees, newTree]);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setVariety('koroneiki');
    setHealth('good');
    setYieldEstimate('');
    setNotes('');
  };

  const exportData = () => {
    const dataStr = JSON.stringify(trees, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `olive_data_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const totalYield = trees.reduce((acc, curr) => acc + curr.yieldEstimate, 0);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-lime-800 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <Sprout size={24} />
            <h1 className="text-xl font-bold">Olive Tracker</h1>
        </div>
        <button onClick={exportData} className="bg-lime-700 hover:bg-lime-600 p-2 rounded-md flex items-center gap-2 text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Εξαγωγή</span>
        </button>
      </header>

      {/* Stats Bar */}
      <div className="bg-white p-2 flex justify-around items-center border-b text-sm text-gray-700 z-10">
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{trees.length}</span>
            <span className="text-xs text-gray-500">Δέντρα</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-lime-700">{totalYield} kg</span>
            <span className="text-xs text-gray-500">Εκτίμηση</span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <Map 
            trees={trees} 
            onAddTree={handleAddTreeStart} 
            userLocation={userLocation}
            setUserLocation={setUserLocation}
        />
      </div>

      {/* Add Tree Modal/Drawer */}
      {showForm && (
        <div className="absolute inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Trees className="text-lime-600" />
                        Νέο Δέντρο
                    </h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
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

                    <button 
                        onClick={handleSaveTree}
                        className="w-full bg-lime-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-lime-700 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        <Save size={20} />
                        Αποθήκευση
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
