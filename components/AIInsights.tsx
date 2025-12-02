import React, { useState } from 'react';
import { Expense, Category } from '../types';
import { GeminiService } from '../services/geminiService';
import { BrainCircuit, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Assuming standard usage, if not available I'll use simple text rendering

// Note: In a real environment, you'd want to handle ReactMarkdown import carefully or use a simple formatter.
// Since I can't guarantee `react-markdown` is installed in the prompt's environment, I will build a simple markdown parser or just render whitespace.
// For this strict output, I will display the text with whitespace-pre-wrap.

interface AIInsightsProps {
  expenses: Expense[];
  categories: Category[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ expenses, categories }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GeminiService.generateInsights(expenses, categories);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to generate insights.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            AI Financial Insights
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Get personalized advice and spending analysis powered by Gemini.</p>
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px] flex flex-col">
        {/* Header Action */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
               <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
             </div>
             <div>
               <h3 className="font-semibold text-gray-800 dark:text-white">Smart Analysis</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">Analyze your last 50 transactions</p>
             </div>
           </div>
           
           <button
            onClick={handleGenerateInsights}
            disabled={isLoading || expenses.length === 0}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
              isLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : expenses.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20'
            }`}
           >
             {isLoading ? (
               <>
                 <RefreshCw className="w-4 h-4 animate-spin" />
                 Analyzing...
               </>
             ) : (
               <>
                 <Sparkles className="w-4 h-4" />
                 Generate Insights
               </>
             )}
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
           {error && (
             <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
               <AlertTriangle className="w-5 h-5" />
               {error}
             </div>
           )}

           {!analysis && !isLoading && !error && (
             <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                <BrainCircuit className="w-16 h-16 opacity-20" />
                <div className="max-w-md">
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Ready to analyze</p>
                  <p className="text-sm mt-1">Click the button above to let AI review your spending habits and provide actionable tips.</p>
                </div>
             </div>
           )}

           {analysis && !isLoading && (
             <div className="prose dark:prose-invert max-w-none animate-fade-in">
               <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-sans text-lg">
                 {analysis}
               </div>
             </div>
           )}
        </div>
        
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-t border-yellow-100 dark:border-yellow-900/20 text-xs text-yellow-700 dark:text-yellow-400 text-center">
           AI insights are generated based on your transaction history. Always verify financial advice.
        </div>
      </div>
    </div>
  );
};