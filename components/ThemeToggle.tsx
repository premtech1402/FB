
import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-16 h-8 rounded-full p-1 transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner ${
        isDarkMode ? 'bg-slate-700 shadow-slate-800/50' : 'bg-sky-300 shadow-sky-400/50'
      }`}
      aria-label="Toggle Dark Mode"
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transform transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) flex items-center justify-center overflow-hidden z-10 ${
          isDarkMode ? 'translate-x-8 bg-slate-900' : 'translate-x-0 bg-white'
        }`}
      >
        <div className="relative w-full h-full">
           <Sun 
             className={`absolute inset-0 m-auto w-4 h-4 text-amber-500 transition-all duration-500 ease-out ${
               isDarkMode ? 'opacity-0 rotate-[180deg] scale-50' : 'opacity-100 rotate-0 scale-100'
             }`} 
           />
           <Moon 
             className={`absolute inset-0 m-auto w-4 h-4 text-sky-200 transition-all duration-500 ease-out ${
               isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-[180deg] scale-50'
             }`} 
           />
        </div>
      </div>
      
      {/* Background decorations */}
      <div className={`absolute top-0 left-0 w-full h-full overflow-hidden rounded-full pointer-events-none`}>
        <div className={`absolute top-1.5 left-2 w-1 h-1 bg-white rounded-full transition-all duration-500 ${isDarkMode ? 'opacity-0 translate-x-4' : 'opacity-80'}`} />
        <div className={`absolute bottom-2 left-3.5 w-0.5 h-0.5 bg-white rounded-full transition-all duration-500 delay-75 ${isDarkMode ? 'opacity-0 translate-x-4' : 'opacity-60'}`} />
        <div className={`absolute top-2 right-3 w-0.5 h-0.5 bg-slate-400 rounded-full transition-all duration-500 ${isDarkMode ? 'opacity-80' : 'opacity-0 -translate-x-4'}`} />
      </div>
    </button>
  );
};
