
export type ViewState = 'dashboard' | 'transactions' | 'income' | 'categories' | 'insights';

export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO Date string YYYY-MM-DD
  notes?: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string; // ISO Date string YYYY-MM-DD
  notes?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyStats {
  total: number;
  dailyAverage: number;
  highestCategory: string;
}
