import { X, PieChart as PieIcon, BarChart3, Droplets, Scale, AlertCircle } from 'lucide-react';
import { OliveTree } from '../types';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface StatsProps {
  trees: OliveTree[];
  onClose: () => void;
}

const COLORS = {
  koroneiki: '#84cc16',
  kalamon: '#7c3aed',
  manaki: '#fbbf24',
  other: '#94a3b8',
  good: '#22c55e',
  average: '#eab308',
  poor: '#ef4444',
  pruning: '#f97316',
  spraying: '#0ea5e9',
  fertilizing: '#10b981',
  harvest: '#a855f7'
};

export default function Stats({ trees, onClose }: StatsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltipStyle = isDark ? { backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' } : undefined;

  // Calculate statistics
  const totalTrees = trees.length;
  const totalYieldEstimate = trees.reduce((sum, tree) => sum + (tree.yieldEstimate || 0), 0);
  
  const totalHarvested = trees.reduce((sum, tree) => {
    const treeHarvest = tree.harvests?.reduce((hSum, h) => hSum + (h.amountKg || 0), 0) || 0;
    return sum + treeHarvest;
  }, 0);
  
  // Variety stats
  const varietyCounts = trees.reduce((acc, tree) => {
    const variety = tree.variety;
    acc[variety] = (acc[variety] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const varietyData = [
    { name: 'Κορωνέικη', value: varietyCounts['koroneiki'] || 0, color: COLORS.koroneiki },
    { name: 'Καλαμών', value: varietyCounts['kalamon'] || 0, color: COLORS.kalamon },
    { name: 'Μανάκι', value: varietyCounts['manaki'] || 0, color: COLORS.manaki },
    { name: 'Άλλη', value: varietyCounts['other'] || 0, color: COLORS.other },
  ].filter(d => d.value > 0);

  // Health stats
  const healthCounts = trees.reduce((acc, tree) => {
    const health = tree.health;
    acc[health] = (acc[health] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const healthData = [
    { name: 'Καλή', value: healthCounts['good'] || 0, color: COLORS.good },
    { name: 'Μέτρια', value: healthCounts['average'] || 0, color: COLORS.average },
    { name: 'Κακή', value: healthCounts['poor'] || 0, color: COLORS.poor },
  ].filter(d => d.value > 0);

  // Task stats logic
  const pendingTasksCount = trees.reduce((acc, tree) => {
    return acc + (tree.tasks?.filter(t => t.status === 'pending').length || 0);
  }, 0);

  const taskTypeCounts = trees.reduce((acc, tree) => {
    tree.tasks?.forEach(task => {
        if (task.status === 'pending') {
            acc[task.type] = (acc[task.type] || 0) + 1;
        }
    });
    return acc;
  }, {} as Record<string, number>);

  const taskData = Object.entries(taskTypeCounts).map(([type, count]) => ({
    name: type === 'pruning' ? 'Κλάδεμα' : 
          type === 'spraying' ? 'Ράντισμα' : 
          type === 'fertilizing' ? 'Λίπανση' : 
          type === 'harvest' ? 'Συγκομιδή' : 'Άλλο',
    value: count,
    color: COLORS[type as keyof typeof COLORS] || '#64748b'
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-lime-600 dark:text-lime-400" />
            Στατιστικά Ελαιώνα
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Summary Cards */}
          <div className="bg-lime-50 dark:bg-lime-900/20 p-4 rounded-xl border border-lime-200 dark:border-lime-800 flex flex-col items-center justify-center text-center">
            <div className="bg-lime-100 dark:bg-lime-800 p-2 rounded-full text-lime-700 dark:text-lime-300 mb-2">
              <PieIcon size={20} />
            </div>
            <p className="text-xs text-lime-600 dark:text-lime-400 font-bold uppercase tracking-wider">Δέντρα</p>
            <p className="text-2xl font-bold text-lime-800 dark:text-lime-200">{totalTrees}</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 flex flex-col items-center justify-center text-center">
            <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-full text-orange-700 dark:text-orange-300 mb-2">
              <Scale size={20} />
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Εκτίμηση</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{totalYieldEstimate.toLocaleString()} <span className="text-sm font-normal">kg</span></p>
          </div>

          <div className="bg-lime-50 dark:bg-lime-900/20 p-4 rounded-xl border border-lime-200 dark:border-lime-800 flex flex-col items-center justify-center text-center col-span-2">
            <div className="bg-lime-100 dark:bg-lime-800 p-2 rounded-full text-lime-700 dark:text-lime-300 mb-2">
              <Droplets size={20} />
            </div>
            <p className="text-xs text-lime-600 dark:text-lime-400 font-bold uppercase tracking-wider">Συνολική Συγκομιδή</p>
            <p className="text-3xl font-bold text-lime-800 dark:text-lime-200">{totalHarvested.toLocaleString()} <span className="text-lg font-normal">kg</span></p>
            {totalYieldEstimate > 0 && (
                <div className="w-full mt-2 bg-lime-200 dark:bg-lime-800 rounded-full h-2 overflow-hidden max-w-xs">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((totalHarvested / totalYieldEstimate) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-lime-600 dark:bg-lime-500 h-2 rounded-full" 
                    />
                </div>
            )}
            {totalYieldEstimate > 0 && (
                <p className="text-xs text-lime-700 dark:text-lime-300 mt-1 font-medium">
                    {Math.round((totalHarvested / totalYieldEstimate) * 100)}% της εκτίμησης
                </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Variety Distribution */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Droplets className="text-blue-500" size={16} />
              Κατανομή Ποικιλιών
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={varietyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {varietyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Δέντρα']} contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <PieIcon className="text-purple-500" size={16} />
              Κατάσταση Υγείας
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Δέντρα']} contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Stats */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <AlertCircle className="text-orange-500" size={16} />
              Εκκρεμείς Εργασίες ({pendingTasksCount})
            </h3>
            {pendingTasksCount === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-2">Καμία εκκρεμότητα.</p>
            ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskData}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: isDark ? '#e2e8f0' : '#334155' }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.1)' : 'transparent' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {taskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
