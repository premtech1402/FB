
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { CategoryManager } from './components/CategoryManager';
import { AIInsights } from './components/AIInsights';
import { IncomeManager } from './components/IncomeManager';
import { Expense, Category, ViewState, Income } from './types';
import { StorageService } from './services/storageService';
import { DEFAULT_CATEGORIES } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    const loadedExpenses = StorageService.getExpenses();
    const loadedCategories = StorageService.getCategories();
    const loadedIncome = StorageService.getIncome();
    
    setExpenses(loadedExpenses);
    setIncome(loadedIncome);

    if (loadedCategories.length === 0) {
      StorageService.saveCategories(DEFAULT_CATEGORIES);
      setCategories(DEFAULT_CATEGORIES);
    } else {
      setCategories(loadedCategories);
    }

    // Check Theme
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const addExpense = (newExpense: Expense) => {
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  const addExpenses = (newExpenses: Expense[], newCategories: Category[]) => {
    // Add categories first
    const updatedCategories = [...categories, ...newCategories];
    setCategories(updatedCategories);
    StorageService.saveCategories(updatedCategories);

    // Add expenses
    const updatedExpenses = [...newExpenses, ...expenses];
    setExpenses(updatedExpenses);
    StorageService.saveExpenses(updatedExpenses);
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  const addCategory = (category: Category) => {
    const updated = [...categories, category];
    setCategories(updated);
    StorageService.saveCategories(updated);
  };

  const deleteCategory = (id: string) => {
    // Revert expenses with this category to "Others"
    const otherCatId = categories.find(c => c.name === 'Others')?.id || 'others';
    const updatedExpenses = expenses.map(e => 
      e.categoryId === id ? { ...e, categoryId: otherCatId } : e
    );
    setExpenses(updatedExpenses);
    StorageService.saveExpenses(updatedExpenses);

    const updatedCats = categories.filter(c => c.id !== id);
    setCategories(updatedCats);
    StorageService.saveCategories(updatedCats);
  };

  const addIncome = (newIncome: Income) => {
    const updated = [newIncome, ...income];
    setIncome(updated);
    StorageService.saveIncome(updated);
  };

  const deleteIncome = (id: string) => {
    const updated = income.filter(i => i.id !== id);
    setIncome(updated);
    StorageService.saveIncome(updated);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard expenses={expenses} categories={categories} onAddExpense={addExpense} />;
      case 'transactions':
        return (
          <ExpenseList 
            expenses={expenses} 
            categories={categories} 
            onDeleteExpense={deleteExpense} 
            onImportExpenses={addExpenses}
          />
        );
      case 'income':
        return <IncomeManager income={income} onAddIncome={addIncome} onDeleteIncome={deleteIncome} />;
      case 'categories':
        return <CategoryManager categories={categories} onAddCategory={addCategory} onDeleteCategory={deleteCategory} />;
      case 'insights':
        return <AIInsights expenses={expenses} categories={categories} />;
      default:
        return <Dashboard expenses={expenses} categories={categories} onAddExpense={addExpense} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setCurrentView={setCurrentView} 
      isDarkMode={isDarkMode} 
      toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
