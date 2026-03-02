export type TreeHealth = 'good' | 'average' | 'poor';
export type TreeVariety = 'koroneiki' | 'kalamon' | 'manaki' | 'other';

export type TaskType = 'pruning' | 'spraying' | 'fertilizing' | 'harvest' | 'other';
export type TaskStatus = 'pending' | 'completed';

export interface TreeTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  date: string;
  description?: string;
}

export interface HarvestRecord {
  id: string;
  date: string;
  amountKg: number; // Kilos of olives
  oilYield?: number; // Liters of oil (optional)
  acidity?: number; // Acidity level (optional)
  notes?: string;
}

export interface OliveTree {
  id: string;
  lat: number;
  lng: number;
  variety: TreeVariety;
  health: TreeHealth;
  dateAdded: string;
  notes?: string;
  yieldEstimate: number; // kg
  photoUrl?: string; // base64 string
  tasks?: TreeTask[];
  harvests?: HarvestRecord[];
}

export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'sale' | 'fertilizer' | 'labor' | 'equipment' | 'fuel' | 'other';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
}

export interface Field {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }[]; // Polygon points
  color: string;
  notes?: string;
}

export interface AppState {
  trees: OliveTree[];
  transactions: Transaction[];
  fields: Field[];
}
