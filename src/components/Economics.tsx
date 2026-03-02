import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { Transaction, TransactionType, TransactionCategory } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface EconomicsProps {
  transactions: Transaction[];
  onSave: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const COLORS = {
  income: '#22c55e',
  expense: '#ef4444',
  sale: '#84cc16',
  fertilizer: '#10b981',
  labor: '#f97316',
  equipment: '#3b82f6',
  fuel: '#a855f7',
  other: '#64748b'
};

const CATEGORY_LABELS: Record<string, string> = {
  sale: 'Πώληση',
  fertilizer: 'Λιπάσματα',
  labor: 'Εργατικά',
  equipment: 'Εξοπλισμός',
  fuel: 'Καύσιμα',
  other: 'Άλλα'
};

export default function Economics({ transactions, onSave, onDelete, onClose }: EconomicsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltipStyle = isDark ? 
    { backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' } 
    : 
    { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
  const itemStyle = isDark ? { color: '#e2e8f0' } : { color: '#374151' };

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseData = Object.entries(expensesByCategory).map(([cat, amount]) => ({
    name: CATEGORY_LABELS[cat] || cat,
    value: amount,
    color: COLORS[cat as keyof typeof COLORS] || COLORS.other
  }));

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error('Παρακαλώ εισάγετε έγκυρο ποσό.');
      return;
    }

    const newTransaction: Transaction = {
      id: uuidv4(),
      date,
      type,
      category,
      amount: Number(amount),
      description
    };

    onSave(newTransaction);
    setShowForm(false);
    setAmount('');
    setDescription('');
    toast.success('Η συναλλαγή προστέθηκε επιτυχώς!');
  };

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
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wallet className="text-lime-600 dark:text-lime-500" />
            Οικονομική Διαχείριση
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 flex flex-col items-center">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-700 dark:text-green-300 mb-2">
              <TrendingUp size={24} />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">Έσοδα</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">€{totalIncome.toLocaleString()}</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full text-red-700 dark:text-red-300 mb-2">
              <TrendingDown size={24} />
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Έξοδα</p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-200">€{totalExpenses.toLocaleString()}</p>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col items-center ${netProfit >= 0 ? 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
            <div className={`p-2 rounded-full mb-2 ${netProfit >= 0 ? 'bg-lime-100 dark:bg-lime-800 text-lime-700 dark:text-lime-300' : 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-300'}`}>
              <Wallet size={24} />
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider ${netProfit >= 0 ? 'text-lime-600 dark:text-lime-400' : 'text-orange-600 dark:text-orange-400'}`}>Καθαρό Κέρδος</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-lime-800 dark:text-lime-200' : 'text-orange-800 dark:text-orange-200'}`}>€{netProfit.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction List & Form */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">Συναλλαγές</h3>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-lime-600 dark:bg-lime-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors"
              >
                <Plus size={16} />
                Νέα
              </button>
            </div>

            {showForm && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4"
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Τύπος</label>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => { setType('income'); setCategory('sale'); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${type === 'income' ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border dark:border-slate-700'}`}
                      >
                        Έσοδο
                      </button>
                      <button 
                        onClick={() => { setType('expense'); setCategory('other'); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border dark:border-slate-700'}`}
                      >
                        Έξοδο
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ποσό (€)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2 mt-1 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Κατηγορία</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full p-2 mt-1 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none"
                  >
                    {type === 'income' ? (
                      <option value="sale">Πώληση (Λάδι/Ελιές)</option>
                    ) : (
                      <>
                        <option value="fertilizer">Λιπάσματα</option>
                        <option value="labor">Εργατικά</option>
                        <option value="equipment">Εξοπλισμός</option>
                        <option value="fuel">Καύσιμα</option>
                        <option value="other">Άλλα</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Περιγραφή</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 mt-1 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none"
                    placeholder="π.χ. Αγορά 10 σακιά λίπασμα"
                  />
                </div>

                <div className="mb-3">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ημερομηνία</label>
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none"
                    />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowForm(false)} className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">Ακύρωση</button>
                  <button onClick={handleSave} className="bg-lime-600 dark:bg-lime-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors">Αποθήκευση</button>
                </div>
              </motion.div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden max-h-[400px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">Δεν υπάρχουν συναλλαγές.</p>
              ) : (
                transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{CATEGORY_LABELS[t.category] || t.category}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.description || '-'}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                            <Calendar size={10} />
                            {new Date(t.date).toLocaleDateString('el-GR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString()}
                      </span>
                      <button onClick={() => onDelete(t.id)} className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            {expenseData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-700 shadow-sm h-64">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide text-center">Κατανομή Εξόδων</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: any) => [`€${value}`, 'Ποσό']} 
                        contentStyle={tooltipStyle}
                        itemStyle={itemStyle}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="bg-lime-50 dark:bg-lime-900/20 p-4 rounded-xl border border-lime-100 dark:border-lime-800">
                <h4 className="font-bold text-lime-800 dark:text-lime-200 mb-2">Συμβουλή</h4>
                <p className="text-sm text-lime-700 dark:text-lime-300">
                    Καταχωρήστε όλα τα έξοδα (καύσιμα, μεροκάματα) για να έχετε ακριβή εικόνα του κόστους ανά κιλό λαδιού στο τέλος της χρονιάς!
                </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}