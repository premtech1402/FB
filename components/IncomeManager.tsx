
import React, { useState } from 'react';
import { Income } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { PlusCircle, TrendingUp, Trash2, Calendar, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface IncomeManagerProps {
  income: Income[];
  onAddIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
}

export const IncomeManager: React.FC<IncomeManagerProps> = ({ income, onAddIncome, onDeleteIncome }) => {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source) return;

    const newIncome: Income = {
      id: uuidv4(),
      amount: parseFloat(amount),
      source,
      date,
      notes
    };

    onAddIncome(newIncome);
    setAmount('');
    setSource('');
    setNotes('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Income Tracking</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your earnings and revenue sources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Stats */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-emerald-100">Total Income</span>
            </div>
            <h3 className="text-3xl font-bold">{CURRENCY_SYMBOL}{totalIncome.toLocaleString()}</h3>
          </div>

          {/* Add Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Add Income</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Salary, Freelance"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 mt-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Income
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Income</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {income.length > 0 ? (
                    income.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">
                          {item.source}
                          {item.notes && <p className="text-xs text-gray-400 font-normal truncate max-w-[200px]">{item.notes}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                          + {CURRENCY_SYMBOL}{item.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button 
                            onClick={() => onDeleteIncome(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                        No income records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
