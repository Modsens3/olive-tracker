import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Sprout, Filter } from 'lucide-react';
import Map from './components/Map';
import TreeForm from './components/TreeForm';
import { OliveTree, TreeVariety, TreeHealth } from './types';

export default function App() {
  const [trees, setTrees] = useState<OliveTree[]>(() => {
    const saved = localStorage.getItem('olive_trees');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showForm, setShowForm] = useState(false);
  const [newTreeLoc, setNewTreeLoc] = useState<{lat: number, lng: number} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [editingTreeId, setEditingTreeId] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterVariety, setFilterVariety] = useState<TreeVariety | 'all'>('all');
  const [filterHealth, setFilterHealth] = useState<TreeHealth | 'all'>('all');

  useEffect(() => {
    localStorage.setItem('olive_trees', JSON.stringify(trees));
  }, [trees]);

  const handleAddTreeStart = (lat: number, lng: number) => {
    setNewTreeLoc({ lat, lng });
    setEditingTreeId(null);
    setShowForm(true);
  };

  const handleEditTreeStart = (tree: OliveTree) => {
    setEditingTreeId(tree.id);
    setShowForm(true);
  };

  const handleSaveTree = (data: Omit<OliveTree, 'id' | 'dateAdded' | 'lat' | 'lng'>) => {
    if (editingTreeId) {
      // Update existing tree
      setTrees(trees.map(t => 
        t.id === editingTreeId 
          ? { ...t, ...data }
          : t
      ));
    } else if (newTreeLoc) {
      // Add new tree
      const newTree: OliveTree = {
        id: uuidv4(),
        lat: newTreeLoc.lat,
        lng: newTreeLoc.lng,
        ...data,
        dateAdded: new Date().toISOString()
      };
      setTrees([...trees, newTree]);
    }
    
    setShowForm(false);
    setNewTreeLoc(null);
    setEditingTreeId(null);
  };

  const handleDeleteTree = () => {
    if (editingTreeId) {
        setTrees(trees.filter(t => t.id !== editingTreeId));
        setShowForm(false);
        setEditingTreeId(null);
    }
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

  const filteredTrees = trees.filter(tree => {
    if (filterVariety !== 'all' && tree.variety !== filterVariety) return false;
    if (filterHealth !== 'all' && tree.health !== filterHealth) return false;
    return true;
  });

  const totalYield = filteredTrees.reduce((acc, curr) => acc + curr.yieldEstimate, 0);

  const editingTree = editingTreeId ? trees.find(t => t.id === editingTreeId) : undefined;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-lime-800 text-white p-4 shadow-md flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
            <Sprout size={24} />
            <h1 className="text-xl font-bold">Olive Tracker</h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`p-2 rounded-md flex items-center gap-2 text-sm transition-colors ${showFilters ? 'bg-white text-lime-800' : 'bg-lime-700 hover:bg-lime-600'}`}
            >
                <Filter size={16} />
                <span className="hidden sm:inline">Φίλτρα</span>
            </button>
            <button onClick={exportData} className="bg-lime-700 hover:bg-lime-600 p-2 rounded-md flex items-center gap-2 text-sm">
                <Download size={16} />
                <span className="hidden sm:inline">Εξαγωγή</span>
            </button>
        </div>
      </header>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-lime-100 p-4 shadow-inner z-10 animate-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto items-center">
                <div className="w-full sm:w-auto flex-1">
                    <label className="block text-xs font-bold text-lime-800 mb-1">Ποικιλία</label>
                    <select 
                        value={filterVariety} 
                        onChange={(e) => setFilterVariety(e.target.value as TreeVariety | 'all')}
                        className="w-full p-2 rounded border border-lime-300 text-sm"
                    >
                        <option value="all">Όλες</option>
                        <option value="koroneiki">Κορωνέικη</option>
                        <option value="kalamon">Καλαμών</option>
                        <option value="manaki">Μανάκι</option>
                        <option value="other">Άλλη</option>
                    </select>
                </div>
                <div className="w-full sm:w-auto flex-1">
                    <label className="block text-xs font-bold text-lime-800 mb-1">Υγεία</label>
                    <select 
                        value={filterHealth} 
                        onChange={(e) => setFilterHealth(e.target.value as TreeHealth | 'all')}
                        className="w-full p-2 rounded border border-lime-300 text-sm"
                    >
                        <option value="all">Όλες</option>
                        <option value="good">Καλή 🟢</option>
                        <option value="average">Μέτρια 🟡</option>
                        <option value="poor">Κακή 🔴</option>
                    </select>
                </div>
                {(filterVariety !== 'all' || filterHealth !== 'all') && (
                    <button 
                        onClick={() => {
                            setFilterVariety('all');
                            setFilterHealth('all');
                        }}
                        className="mt-4 sm:mt-0 text-lime-800 underline text-sm"
                    >
                        Καθαρισμός
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white p-2 flex justify-around items-center border-b text-sm text-gray-700 z-10">
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{filteredTrees.length}</span>
            <span className="text-xs text-gray-500">Δέντρα {showFilters && filteredTrees.length !== trees.length ? `(από ${trees.length})` : ''}</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-lime-700">{totalYield} kg</span>
            <span className="text-xs text-gray-500">Εκτίμηση</span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <Map 
            trees={filteredTrees} 
            onAddTree={handleAddTreeStart} 
            onEditTree={handleEditTreeStart}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
        />
      </div>

      {/* Add/Edit Tree Modal */}
      {showForm && (
        <TreeForm 
            initialData={editingTree}
            onSave={handleSaveTree}
            onCancel={() => {
                setShowForm(false);
                setEditingTreeId(null);
                setNewTreeLoc(null);
            }}
            onDelete={editingTreeId ? handleDeleteTree : undefined}
            isNew={!editingTreeId}
        />
      )}
    </div>
  );
}
