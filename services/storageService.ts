
import { Expense, Category, Income } from '../types';

const STORAGE_KEYS = {
  EXPENSES: 'spendwise_expenses',
  CATEGORIES: 'spendwise_categories',
  INCOME: 'spendwise_income',
};

export const StorageService = {
  getExpenses: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load expenses', error);
      return [];
    }
  },

  saveExpenses: (expenses: Expense[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses', error);
    }
  },

  getCategories: (): Category[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load categories', error);
      return [];
    }
  },

  saveCategories: (categories: Category[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories', error);
    }
  },

  getIncome: (): Income[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCOME);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load income', error);
      return [];
    }
  },

  saveIncome: (income: Income[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(income));
    } catch (error) {
      console.error('Failed to save income', error);
    }
  },
};
