
import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Trash2, Tag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      id: uuidv4(),
      name: newCatName.trim(),
      color: newCatColor,
      isCustom: true
    });

    setNewCatName('');
    setNewCatColor('#6366f1');
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Categories</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage your spending categories.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              New Category
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Subscriptions"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Tag</label>
                <div className="flex gap-2 flex-wrap">
                  {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newCatColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-primary hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 group hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{cat.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{cat.isCustom ? 'Custom' : 'Default'}</span>
                      </div>
                    </div>
                    {cat.isCustom && (
                      <button 
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Category"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
