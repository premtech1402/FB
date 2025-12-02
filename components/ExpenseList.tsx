import React, { useState } from 'react';
import { Expense, Category } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { Download, Search, Trash2, FileSpreadsheet, Upload, Camera } from 'lucide-react';
import { UploadModal } from './UploadModal';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDeleteExpense: (id: string) => void;
  onImportExpenses?: (expenses: Expense[], newCategories: Category[]) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, categories, onDeleteExpense, onImportExpenses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#999';

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(e.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      getCategoryName(e.categoryId),
      e.amount.toFixed(2),
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expenses.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transactions</h2>
          <p className="text-gray-500 dark:text-gray-400">View and manage all your expense records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button
             onClick={() => setIsUploadModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium"
           >
             <Camera className="w-4 h-4" />
             Scan Receipt
           </button>
           <button
             onClick={() => setIsUploadModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium"
           >
             <Upload className="w-4 h-4" />
             Upload Sheet
           </button>
           <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search description or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {expense.description}
                      {expense.notes && <p className="text-xs text-gray-400 font-normal truncate max-w-[200px]">{expense.notes}</p>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getCategoryColor(expense.categoryId)}20`, 
                          color: getCategoryColor(expense.categoryId) 
                        }}
                      >
                        {getCategoryName(expense.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                      {CURRENCY_SYMBOL}{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button 
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        categories={categories}
        onImport={(newExpenses, newCats) => {
          if (onImportExpenses) {
            onImportExpenses(newExpenses, newCats);
          }
          setIsUploadModalOpen(false);
        }}
      />
    </div>
  );
};