import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Sprout, Filter, Upload, BarChart3, Wallet, Calendar, X, Menu, FileSpreadsheet } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import QRCode from "react-qr-code";
import { AnimatePresence, motion } from 'framer-motion';
import Map from './components/Map';
import TreeForm from './components/TreeForm';
import Stats from './components/Stats';
import Economics from './components/Economics';
import BulkActions from './components/BulkActions';
import WeatherWidget from './components/WeatherWidget';
import ThemeToggle from './components/ThemeToggle';
import { exportToExcel } from './utils/excelExport';
import { OliveTree, TreeVariety, TreeHealth, TaskType, Transaction, Field } from './types';

export default function App() {
  const [trees, setTrees] = useState<OliveTree[]>(() => {
    const saved = localStorage.getItem('olive_trees');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('olive_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [fields, setFields] = useState<Field[]>(() => {
    const saved = localStorage.getItem('olive_fields');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEconomics, setShowEconomics] = useState(false);
  const [newTreeLoc, setNewTreeLoc] = useState<{lat: number, lng: number} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [editingTreeId, setEditingTreeId] = useState<string | null>(null);
  const [selectedQRTree, setSelectedQRTree] = useState<OliveTree | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTreeIds, setSelectedTreeIds] = useState<string[]>([]);

  // Map Drawing/Measure State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isMeasureMode, setIsMeasureMode] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterVariety, setFilterVariety] = useState<TreeVariety | 'all'>('all');
  const [filterHealth, setFilterHealth] = useState<TreeHealth | 'all'>('all');

  useEffect(() => {
    localStorage.setItem('olive_trees', JSON.stringify(trees));
  }, [trees]);

  useEffect(() => {
    localStorage.setItem('olive_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('olive_fields', JSON.stringify(fields));
  }, [fields]);

  const handleSaveField = (field: Field) => {
    setFields(prev => [...prev, field]);
    toast.success('Το χωράφι αποθηκεύτηκε επιτυχώς!');
    setIsDrawingMode(false);
  };

  const handleDeleteField = (id: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το χωράφι;')) {
        setFields(prev => prev.filter(f => f.id !== id));
        toast.success('Το χωράφι διαγράφηκε.');
    }
  };


  // ... (handlers)

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συναλλαγή;')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Η συναλλαγή διαγράφηκε.');
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedTreeIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkAddTasks = (type: TaskType, desc: string) => {
    const newTrees = trees.map(tree => {
      if (selectedTreeIds.includes(tree.id)) {
        return {
          ...tree,
          tasks: [
            ...(tree.tasks || []),
            {
              id: uuidv4(),
              type,
              status: 'pending',
              date: new Date().toISOString(),
              description: desc
            }
          ] as any // Fix TS issue with mapped type
        };
      }
      return tree;
    });
    setTrees(newTrees);
    setIsSelectionMode(false);
    setSelectedTreeIds([]);
    toast.success(`Προστέθηκε εργασία σε ${selectedTreeIds.length} δέντρα.`);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε ${selectedTreeIds.length} δέντρα;`)) {
      setTrees(trees.filter(t => !selectedTreeIds.includes(t.id)));
      setSelectedTreeIds([]);
      setIsSelectionMode(false);
      toast.success('Τα δέντρα διαγράφηκαν επιτυχώς.');
    }
  };

  const filteredTrees = trees.filter(t => {
    if (filterVariety !== 'all' && t.variety !== filterVariety) return false;
    if (filterHealth !== 'all' && t.health !== filterHealth) return false;
    return true;
  });

  // ... (render)

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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedData = JSON.parse(json);
        
        // Handle both old format (array of trees) and new format (object with trees/transactions/fields)
        let newTrees: OliveTree[] = [];
        let newTransactions: Transaction[] = [];
        let newFields: Field[] = [];

        if (Array.isArray(importedData)) {
            newTrees = importedData;
        } else {
            newTrees = importedData.trees || [];
            newTransactions = importedData.transactions || [];
            newFields = importedData.fields || [];
        }

        if (window.confirm(`Βρέθηκαν ${newTrees.length} δέντρα, ${newTransactions.length} συναλλαγές και ${newFields.length} χωράφια. Θέλετε να αντικαταστήσετε τα υπάρχοντα δεδομένα;`)) {
            setTrees(newTrees);
            setTransactions(newTransactions);
            setFields(newFields);
            toast.success('Η εισαγωγή ολοκληρώθηκε επιτυχώς!');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error('Σφάλμα κατά την ανάγνωση του αρχείου.');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportData = () => {
    const data = {
        trees,
        transactions,
        fields
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `olive_data_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExcelExport = async () => {
    try {
        await exportToExcel(trees, transactions, fields);
        toast.success('Το αρχείο Excel δημιουργήθηκε επιτυχώς!');
    } catch (error) {
        console.error('Export error:', error);
        toast.error('Σφάλμα κατά την εξαγωγή σε Excel.');
    }
  };

  const totalYield = filteredTrees.reduce((acc, curr) => acc + curr.yieldEstimate, 0);

  const editingTree = editingTreeId ? trees.find(t => t.id === editingTreeId) : undefined;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="bg-lime-800 dark:bg-lime-950 text-white p-4 shadow-md flex justify-between items-center z-20 relative transition-colors duration-300">
        <div className="flex items-center gap-2">
            <Sprout size={24} />
            <h1 className="text-xl font-bold hidden md:block">Olive Tracker</h1>
            {userLocation && <WeatherWidget lat={userLocation.lat} lng={userLocation.lng} />}
            {!userLocation && trees.length > 0 && <WeatherWidget lat={trees[0].lat} lng={trees[0].lng} />}
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-2 items-center">
            <ThemeToggle />
            <div className="h-8 w-px bg-lime-600 mx-1"></div>
            <button  
                onClick={() => setShowStats(true)} 
                className="bg-lime-700 hover:bg-lime-600 p-2 rounded-md flex items-center gap-2 text-sm"
                title="Στατιστικά"
            >
                <BarChart3 size={20} />
            </button>
            <button 
                onClick={() => setShowEconomics(true)} 
                className="bg-lime-700 hover:bg-lime-600 p-2 rounded-md flex items-center gap-2 text-sm"
                title="Οικονομικά"
            >
                <Wallet size={20} />
            </button>
            <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`p-2 rounded-md flex items-center gap-2 text-sm transition-colors ${showFilters ? 'bg-white text-lime-800 dark:bg-lime-100 dark:text-lime-900' : 'bg-lime-700 hover:bg-lime-600'}`}
                title="Φίλτρα"
            >
                <Filter size={20} />
            </button>
            
            <div className="h-8 w-px bg-lime-600 mx-1"></div>

            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-lime-700 hover:bg-lime-600 p-2 rounded-md flex items-center gap-2 text-sm"
                title="Εισαγωγή Backup"
            >
                <Upload size={20} />
            </button>
            
            <button 
                onClick={exportData} 
                className="bg-lime-700 hover:bg-lime-600 p-2 rounded-md flex items-center gap-2 text-sm"
                title="Εξαγωγή Backup (JSON)"
            >
                <Download size={20} />
            </button>

            <button 
                onClick={handleExcelExport} 
                className="bg-green-700 hover:bg-green-600 p-2 rounded-md flex items-center gap-2 text-sm"
                title="Εξαγωγή Excel"
            >
                <FileSpreadsheet size={20} />
            </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden gap-2 items-center">
             <ThemeToggle />
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 hover:bg-lime-700 rounded-md transition-colors"
             >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
        </div>

        {/* Hidden Input for Import */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
        />

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/20 z-[-1] md:hidden backdrop-blur-sm"
                    />
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute top-full left-0 right-0 bg-lime-800 dark:bg-lime-950 shadow-lg md:hidden border-t border-lime-700 dark:border-lime-900 overflow-hidden z-10"
                    >
                        <div className="flex flex-col p-2 gap-1">
                        <button 
                            onClick={() => { setShowStats(true); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 hover:bg-lime-700 rounded-lg transition-colors text-left"
                        >
                            <BarChart3 size={20} /> 
                            <span className="font-medium">Στατιστικά</span>
                        </button>
                        <button 
                            onClick={() => { setShowEconomics(true); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 hover:bg-lime-700 rounded-lg transition-colors text-left"
                        >
                            <Wallet size={20} /> 
                            <span className="font-medium">Οικονομικά</span>
                        </button>
                        <button 
                            onClick={() => { setShowFilters(!showFilters); setIsMobileMenuOpen(false); }} 
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${showFilters ? 'bg-lime-100 text-lime-900' : 'hover:bg-lime-700'}`}
                        >
                            <Filter size={20} /> 
                            <span className="font-medium">{showFilters ? 'Απόκρυψη Φίλτρων' : 'Εμφάνιση Φίλτρων'}</span>
                        </button>
                        
                        <div className="h-px w-full bg-lime-700/50 my-1"></div>
                        
                        <button 
                            onClick={() => { fileInputRef.current?.click(); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 hover:bg-lime-700 rounded-lg transition-colors text-left"
                        >
                            <Upload size={20} /> 
                            <span className="font-medium">Εισαγωγή Backup</span>
                        </button>
                        <button 
                            onClick={() => { exportData(); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 hover:bg-lime-700 rounded-lg transition-colors text-left"
                        >
                            <Download size={20} /> 
                            <span className="font-medium">Εξαγωγή Backup (JSON)</span>
                        </button>
                        <button 
                            onClick={() => { handleExcelExport(); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 hover:bg-lime-700 rounded-lg transition-colors text-left"
                        >
                            <FileSpreadsheet size={20} /> 
                            <span className="font-medium">Εξαγωγή Excel</span>
                        </button>
                    </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
      </header>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-lime-100 dark:bg-lime-900/30 p-4 shadow-inner z-10 animate-in slide-in-from-top-2 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto items-center">
                <div className="w-full sm:w-auto flex-1">
                    <label className="block text-xs font-bold text-lime-800 dark:text-lime-200 mb-1">Ποικιλία</label>
                    <select 
                        value={filterVariety} 
                        onChange={(e) => setFilterVariety(e.target.value as TreeVariety | 'all')}
                        className="w-full p-2 rounded border border-lime-300 dark:border-lime-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    >
                        <option value="all">Όλες</option>
                        <option value="koroneiki">Κορωνέικη</option>
                        <option value="kalamon">Καλαμών</option>
                        <option value="manaki">Μανάκι</option>
                        <option value="other">Άλλη</option>
                    </select>
                </div>
                <div className="w-full sm:w-auto flex-1">
                    <label className="block text-xs font-bold text-lime-800 dark:text-lime-200 mb-1">Υγεία</label>
                    <select 
                        value={filterHealth} 
                        onChange={(e) => setFilterHealth(e.target.value as TreeHealth | 'all')}
                        className="w-full p-2 rounded border border-lime-300 dark:border-lime-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
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
                        className="mt-4 sm:mt-0 text-lime-800 dark:text-lime-300 underline text-sm"
                    >
                        Καθαρισμός
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white dark:bg-slate-800 p-2 flex justify-around items-center border-b dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 z-10 transition-colors duration-300">
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg dark:text-white">{filteredTrees.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Δέντρα {showFilters && filteredTrees.length !== trees.length ? `(από ${trees.length})` : ''}</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-lime-700 dark:text-lime-400">{totalYield} kg</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Εκτίμηση</span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <Map 
            trees={filteredTrees} 
            onAddTree={handleAddTreeStart} 
            onEditTree={handleEditTreeStart}
            onShowQR={(tree) => setSelectedQRTree(tree)}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            isSelectionMode={isSelectionMode}
            selectedTreeIds={selectedTreeIds}
            onToggleSelection={handleToggleSelection}
            onToggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
            
            fields={fields}
            isDrawingMode={isDrawingMode}
            isMeasureMode={isMeasureMode}
            onSaveField={handleSaveField}
            onDeleteField={handleDeleteField}
            onToggleDrawingMode={() => {
                setIsDrawingMode(!isDrawingMode);
                setIsMeasureMode(false);
                setIsSelectionMode(false);
            }}
            onToggleMeasureMode={() => {
                setIsMeasureMode(!isMeasureMode);
                setIsDrawingMode(false);
                setIsSelectionMode(false);
            }}
        />
        
        {selectedTreeIds.length > 0 && (
            <BulkActions 
                selectedCount={selectedTreeIds.length}
                onClear={() => setSelectedTreeIds([])}
                onAddTasks={handleBulkAddTasks}
                onDelete={handleBulkDelete}
            />
        )}
      </div>

      {/* Stats Modal */}
      <AnimatePresence>
      {showStats && (
        <Stats 
            trees={trees} 
            onClose={() => setShowStats(false)} 
        />
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showEconomics && (
        <Economics 
            transactions={transactions}
            onSave={handleSaveTransaction}
            onDelete={handleDeleteTransaction}
            onClose={() => setShowEconomics(false)}
        />
      )}
      </AnimatePresence>

      {/* Add/Edit Tree Modal */}
      <AnimatePresence>
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
      </AnimatePresence>
      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedQRTree && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative"
            >
              <button 
                onClick={() => setSelectedQRTree(null)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">QR Code Δέντρου</h2>
              <p className="text-sm text-gray-500 mb-6">Σκανάρετε για να δείτε τα στοιχεία του δέντρου</p>
              
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white border-2 border-gray-100 rounded-lg">
                  <QRCode 
                    value={JSON.stringify({
                      id: selectedQRTree.id,
                      variety: selectedQRTree.variety,
                      lat: selectedQRTree.lat,
                      lng: selectedQRTree.lng
                    })}
                    size={200}
                    level="H"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono text-gray-700 truncate ml-2">{selectedQRTree.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ποικιλία:</span>
                  <span className="font-medium text-gray-700">
                    {selectedQRTree.variety === 'koroneiki' ? 'Κορωνέικη' :
                     selectedQRTree.variety === 'kalamon' ? 'Καλαμών' :
                     selectedQRTree.variety === 'manaki' ? 'Μανάκι' : 'Άλλη'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Υγεία:</span>
                  <span>
                    {selectedQRTree.health === 'good' ? '🟢 Καλή' :
                     selectedQRTree.health === 'average' ? '🟡 Μέτρια' : '🔴 Κακή'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    // Logic to download QR code
                    const svg = document.querySelector("svg");
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.download = `tree-qr-${selectedQRTree.id.slice(0, 8)}.png`;
                        downloadLink.href = `${pngFile}`;
                        downloadLink.click();
                      };
                      img.src = "data:image/svg+xml;base64," + btoa(svgData);
                    }
                  }}
                  className="flex-1 bg-lime-700 text-white py-2 rounded-lg hover:bg-lime-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Λήψη
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
                  Εκτύπωση
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster position="top-center" richColors />
    </div>
  );
}
