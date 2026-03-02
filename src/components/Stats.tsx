import { X, PieChart, BarChart3, Droplets, Scale } from 'lucide-react';
import { OliveTree, TreeVariety, TreeHealth } from '../types';

interface StatsProps {
  trees: OliveTree[];
  onClose: () => void;
}

export default function Stats({ trees, onClose }: StatsProps) {
  // Calculate statistics
  const totalTrees = trees.length;
  const totalYield = trees.reduce((sum, tree) => sum + (tree.yieldEstimate || 0), 0);
  
  // Variety stats
  const varietyCounts = trees.reduce((acc, tree) => {
    const variety = tree.variety;
    acc[variety] = (acc[variety] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Health stats
  const healthCounts = trees.reduce((acc, tree) => {
    const health = tree.health;
    acc[health] = (acc[health] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const varietyLabels: Record<string, string> = {
    koroneiki: 'Κορωνέικη',
    kalamon: 'Καλαμών',
    manaki: 'Μανάκι',
    other: 'Άλλη'
  };

  const healthLabels: Record<string, string> = {
    good: 'Καλή',
    average: 'Μέτρια',
    poor: 'Κακή'
  };

  const healthColors: Record<string, string> = {
    good: 'bg-green-500',
    average: 'bg-yellow-500',
    poor: 'bg-red-500'
  };

  const varieties: TreeVariety[] = ['koroneiki', 'kalamon', 'manaki', 'other'];
  const healthStatuses: TreeHealth[] = ['good', 'average', 'poor'];

  return (
    <div className="absolute inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-lime-600" />
            Στατιστικά Ελαιώνα
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Summary Cards */}
          <div className="bg-lime-50 p-4 rounded-xl border border-lime-200 flex flex-col items-center justify-center text-center">
            <div className="bg-lime-100 p-2 rounded-full text-lime-700 mb-2">
              <PieChart size={20} />
            </div>
            <p className="text-xs text-lime-600 font-bold uppercase tracking-wider">Δέντρα</p>
            <p className="text-2xl font-bold text-lime-800">{totalTrees}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex flex-col items-center justify-center text-center">
            <div className="bg-orange-100 p-2 rounded-full text-orange-700 mb-2">
              <Scale size={20} />
            </div>
            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Παραγωγή</p>
            <p className="text-2xl font-bold text-orange-800">{totalYield.toLocaleString()} <span className="text-sm font-normal">kg</span></p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Variety Distribution */}
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Droplets className="text-blue-500" size={16} />
              Κατανομή Ποικιλιών
            </h3>
            <div className="space-y-3">
              {varieties.map(variety => {
                const count = varietyCounts[variety] || 0;
                const percentage = totalTrees > 0 ? Math.round((count / totalTrees) * 100) : 0;
                
                return (
                  <div key={variety}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{varietyLabels[variety]}</span>
                      <span className="text-gray-500 text-xs">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <PieChart className="text-purple-500" size={16} />
              Κατάσταση Υγείας
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {healthStatuses.map(health => {
                const count = healthCounts[health] || 0;
                const percentage = totalTrees > 0 ? Math.round((count / totalTrees) * 100) : 0;
                
                return (
                  <div key={health} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`w-2 h-2 rounded-full ${healthColors[health]} mb-2`}></div>
                    <span className="text-xs font-bold text-gray-700">{healthLabels[health]}</span>
                    <span className="text-[10px] text-gray-500">{count} ({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
