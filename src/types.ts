export type TreeHealth = 'good' | 'average' | 'poor';
export type TreeVariety = 'koroneiki' | 'kalamon' | 'manaki' | 'other';

export interface OliveTree {
  id: string;
  lat: number;
  lng: number;
  variety: TreeVariety;
  health: TreeHealth;
  yieldEstimate: number; // σε κιλά
  notes: string;
  dateAdded: string;
}

export interface AppState {
  trees: OliveTree[];
}
