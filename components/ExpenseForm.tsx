import React, { useState, useEffect, useCallback } from 'react';
import { Expense, Category } from '../types';
import { GeminiService } from '../services/geminiService';
import { PlusCircle, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseFormProps {
  categories: Category[];
  onAddExpense: (expense: Expense) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Debounce logic for AI categorization
  useEffect(() => {
    if (!description || description.length < 3) return;

    // Clear category if user starts typing a new concept (optional, but good for UX)
    // setCategoryId(''); 

    const timeoutId = setTimeout(async () => {
      setIsAiThinking(true);
      try {
        const suggestedId = await GeminiService.suggestCategory(description, categories);
        if (suggestedId) {
          // Verify ID exists in current categories
          const exists = categories.find(c => c.id === suggestedId);
          if (exists) {
            setCategoryId(suggestedId);
          }
        }
      } catch (error) {
        console.error("Auto-categorize failed", error);
      } finally {
        setIsAiThinking(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timeoutId);
  }, [description, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) return;

    const newExpense: Expense = {
      id: uuidv4(),
      amount: parseFloat(amount),
      description,
      categoryId,
      date,
      notes
    };

    onAddExpense(newExpense);

    // Reset Form
    setAmount('');
    setDescription('');
    setNotes('');
    setCategoryId('');
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
          Description
          {isAiThinking && (
            <span className="text-xs text-primary flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> AI Detecting...
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. kirana store, swiggy, med"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
        <input
          type="number"
          required
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
        <div className="relative">
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none ${categoryId && !isAiThinking ? 'border-primary/50' : ''}`}
          >
            <option value="" disabled>Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {/* Visual indicator that AI selected this */}
          {categoryId && !isAiThinking && description.length > 2 && (
             <Sparkles className="absolute right-8 top-3 w-4 h-4 text-primary pointer-events-none" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
        />
      </div>

      <div className="md:col-span-2 pt-2">
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
        >
          <PlusCircle className="w-5 h-5" />
          Add Expense
        </button>
      </div>
    </form>
  );
};
