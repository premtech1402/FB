
import React, { useState, useMemo } from 'react';
import { Expense, Category } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { ExpenseForm } from './ExpenseForm';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Wallet, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  categories: Category[];
  onAddExpense: (expense: Expense) => void;
}

type DateFilter = 'week' | 'month' | 'year' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({ expenses, categories, onAddExpense }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      switch (dateFilter) {
        case 'week':
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);
          return expenseDate >= oneWeekAgo;
        case 'month':
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        case 'year':
          return expenseDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [expenses, dateFilter]);

  // Stats Calculation based on FILTERED data
  const totalSpend = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // All time total for comparison or static display
  const allTimeTotal = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Prepare Chart Data
  const categoryData = useMemo(() => {
    let data = categories.map(cat => {
      const total = filteredExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { id: cat.id, name: cat.name, value: total, color: cat.color };
    }).filter(d => d.value > 0);

    // If categories are selected, filter the pie chart data
    if (selectedCategoryIds.length > 0) {
      data = data.filter(d => selectedCategoryIds.includes(d.id));
    }
    
    return data;
  }, [categories, filteredExpenses, selectedCategoryIds]);

  // Daily Spending Data (Dynamic based on filter)
  const chartData = useMemo(() => {
    if (dateFilter === 'week' || dateFilter === 'month') {
      // Group by Day
      const daysMap = new Map<string, number>();
      
      filteredExpenses.forEach(e => {
        const dateKey = e.date; // YYYY-MM-DD
        daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + e.amount);
      });

      return Array.from(daysMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => ({
           name: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
           amount,
           fullDate: date
        }));
    } else {
      // Group by Month for Year/All view
      const monthsMap = new Map<string, number>();
      filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthsMap.set(label, (monthsMap.get(label) || 0) + e.amount);
      });
       return Array.from(monthsMap.entries()).map(([name, amount]) => ({ name, amount }));
    }
  }, [filteredExpenses, dateFilter]);

  const toggleCategorySelection = (id: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(catId => catId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getFullCategoryData = () => {
    // Return standard calculations without the visual filter for the list
    return categories.map(cat => {
      const total = filteredExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { id: cat.id, name: cat.name, value: total, color: cat.color };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  };

  const fullCatList = getFullCategoryData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Your financial overview.</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
           {(['week', 'month', 'year', 'all'] as DateFilter[]).map((filter) => (
             <button
               key={filter}
               onClick={() => setDateFilter(filter)}
               className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                 dateFilter === filter 
                   ? 'bg-primary text-white shadow-sm' 
                   : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
               }`}
             >
               {filter === 'all' ? 'All Time' : `This ${filter}`}
             </button>
           ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Spend ({dateFilter === 'all' ? 'All Time' : 'Selected Period'})</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{CURRENCY_SYMBOL}{totalSpend.toLocaleString()}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total (All Time)</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{CURRENCY_SYMBOL}{allTimeTotal.toLocaleString()}</h3>
        </div>

        <div className="bg-gradient-to-br from-primary to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Insights</span>
          </div>
          <p className="text-sm text-indigo-100 font-medium">Top Category ({dateFilter === 'all' ? 'All Time' : 'Period'})</p>
          <p className="mt-1 font-bold text-xl">
             {fullCatList.length > 0 ? fullCatList[0].name : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Add Expense Form - Explicitly Placed at Top */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Add New Expense</h3>
             <ExpenseForm categories={categories} onAddExpense={onAddExpense} />
           </div>

           {/* Activity Chart */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Spending Trend</h3>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                        tickFormatter={(value) => `${CURRENCY_SYMBOL}${value}`}
                      />
                      <RechartsTooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toFixed(2)}`, 'Amount']}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data for this period
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Sidebar Charts */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Category Breakdown</h3>
              {selectedCategoryIds.length > 0 && (
                <button 
                  onClick={() => setSelectedCategoryIds([])}
                  className="text-xs text-primary hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
            
            <div className="h-64 w-full relative shrink-0">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  {fullCatList.length > 0 ? 'Select a category below' : 'No data to display'}
                </div>
              )}
            </div>
            
            {/* Legend List - Interactive for comparison */}
            <div className="mt-6 space-y-2 overflow-y-auto flex-1 pr-2">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 uppercase font-semibold tracking-wider">
                Select to compare
              </p>
              {fullCatList.slice(0, 10).map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => toggleCategorySelection(cat.id)}
                    className={`w-full flex items-center justify-between text-sm p-2 rounded-lg transition-all border ${
                      isSelected 
                        ? 'bg-primary/5 border-primary dark:bg-primary/10 dark:border-primary/50' 
                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`relative flex items-center justify-center w-4 h-4 rounded transition-colors ${isSelected ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}>
                         {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className={`transition-colors ${isSelected ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {cat.name}
                      </span>
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-primary dark:text-primary' : 'text-gray-800 dark:text-white'}`}>
                      {CURRENCY_SYMBOL}{cat.value.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
