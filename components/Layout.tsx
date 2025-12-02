
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Receipt, Tag, BrainCircuit, Menu, X, Wallet, TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setCurrentView,
  isDarkMode,
  toggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
  ];

  const handleNavClick = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Family Bank</h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as ViewState)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${currentView === item.id ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
           <div className="flex items-center justify-between px-4">
             <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Appearance</span>
             <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
           </div>
           <div className="px-4 text-center">
             <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 italic tracking-widest uppercase">
               Coded by PREM
             </p>
           </div>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Family Bank</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 pt-20 px-4 md:hidden animate-fade-in flex flex-col">
             <nav className="space-y-2 flex-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as ViewState)}
                  className={`flex items-center w-full px-4 py-4 rounded-xl text-lg ${
                    currentView === item.id
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-6 h-6 mr-4" />
                  {item.label}
                </button>
              ))}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-4">
                 <span className="text-gray-600 dark:text-gray-300">Dark Mode</span>
                 <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
              </div>
            </nav>
            <div className="py-6 text-center">
               <p className="text-xs font-mono text-gray-400 dark:text-gray-600 italic tracking-widest uppercase">
                 Coded by PREM
               </p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
