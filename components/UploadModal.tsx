import React, { useState, useRef } from 'react';
import { Upload, X, Check, FileSpreadsheet, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ExcelService } from '../services/excelService';
import { GeminiService } from '../services/geminiService';
import { Category, Expense } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (expenses: Expense[], newCategories: Category[]) => void;
  categories: Category[];
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onImport, categories }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedExpenses, setParsedExpenses] = useState<Expense[]>([]);
  const [newCategories, setNewCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<'excel' | 'image' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFile = async (uploadedFile: File) => {
    setLoading(true);
    setError(null);
    setParsedExpenses([]);
    setNewCategories([]);
    
    try {
      if (uploadedFile.type.startsWith('image/')) {
        setProcessingType('image');
        const base64 = await convertFileToBase64(uploadedFile);
        const aiResults = await GeminiService.parseExpenseImage(base64, categories);
        
        if (aiResults.length === 0) {
          throw new Error("Could not detect any expenses in the image.");
        }

        const mappedExpenses: Expense[] = aiResults.map(item => ({
          id: uuidv4(),
          amount: item.amount,
          description: item.description,
          categoryId: item.categoryId || categories[0]?.id || 'others',
          date: item.date,
          notes: 'Scanned from image'
        }));
        
        setParsedExpenses(mappedExpenses);
        setStep('preview');

      } else {
        setProcessingType('excel');
        const { expenses, newCategories: newCats } = await ExcelService.parseFile(uploadedFile, categories);
        if (expenses.length === 0) {
          setError("No valid transactions found in the file.");
          setStep('upload');
        } else {
          setParsedExpenses(expenses);
          setNewCategories(newCats);
          setStep('preview');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process file. Please ensure it is a valid file.");
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(parsedExpenses, newCategories);
    resetModal();
  };

  const resetModal = () => {
    setStep('upload');
    setParsedExpenses([]);
    setNewCategories([]);
    setError(null);
    setProcessingType(null);
    onClose();
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id) || newCategories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {processingType === 'image' ? (
              <ImageIcon className="w-6 h-6 text-indigo-600" />
            ) : (
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            )}
            {processingType === 'image' ? 'Scan Receipt / Handwriting' : 'Import Transactions'}
          </h2>
          <button onClick={resetModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' ? (
            <div 
              className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls, .jpg, .jpeg, .png, .webp" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200 text-center">
                Click to upload <br/> or drag & drop
              </p>
              <div className="mt-3 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                   <FileSpreadsheet className="w-4 h-4" /> Excel / CSV
                </span>
                <span className="flex items-center gap-1">
                   <ImageIcon className="w-4 h-4" /> Receipt / Photo
                </span>
              </div>
              
              {loading && (
                <div className="mt-4 flex flex-col items-center gap-2">
                   <Sparkles className="w-5 h-5 text-primary animate-spin" />
                   <p className="text-primary animate-pulse font-medium">
                     {processingType === 'image' ? 'AI Analyzing Image...' : 'Processing File...'}
                   </p>
                </div>
              )}
              
              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Preview Data</h3>
                  <p className="text-sm text-gray-500">Found {parsedExpenses.length} transactions.</p>
                </div>
                {newCategories.length > 0 && (
                  <div className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 px-3 py-1 rounded-full">
                    {newCategories.length} new categories
                  </div>
                )}
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-750 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {parsedExpenses.slice(0, 50).map((expense, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{expense.date}</td>
                          <td className="px-4 py-2 text-sm text-gray-800 dark:text-white">{expense.description}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {getCategoryName(expense.categoryId)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-white">
                            {CURRENCY_SYMBOL}{expense.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
          <button 
            onClick={resetModal}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          {step === 'preview' && (
            <button 
              onClick={handleConfirmImport}
              className="px-6 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              <Check className="w-4 h-4" />
              Confirm Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
};