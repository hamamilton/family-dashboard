import { useState, useEffect } from 'react';
import { useChores } from './hooks/useChores';
import { Header } from './components/layout/Header';
import { ChoreGrid } from './components/views/ChoreGrid';
import { CalendarView } from './components/views/CalendarView';
import { RefreshCw } from 'lucide-react';

function App() {
  const [groupBy, setGroupBy] = useState('assigned_to');
  const [activeTab, setActiveTab] = useState('chores'); // For when you add the sidebar later
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark given original aesthetic
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const { sortedGroupEntries, loading, toggleChore, chores, profiles } = useChores(groupBy);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white p-6 md:p-12 font-mono tracking-tight bg-[linear-gradient(to_right,#0891b220_1px,transparent_1px),linear-gradient(to_bottom,#0891b220_1px,transparent_1px)] bg-[size:40px_40px]">
      <Header 
        groupBy={groupBy} 
        setGroupBy={setGroupBy} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={64} />
          <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Syncing Database...</p>
        </div>
      ) : (
        <div className="w-full">
          {activeTab === 'chores' && (
            <ChoreGrid
              sortedGroupEntries={sortedGroupEntries}
              profiles={profiles}
              groupBy={groupBy}
              toggleChore={toggleChore}
            />
          )}

          {activeTab === 'calendar' && <CalendarView profiles={profiles} />}
        </div>
      )}

      {!loading && (
        <footer className="mt-20 pt-8 border-t border-slate-800/50 flex justify-between items-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">
          <div>System: FamilyHub v1.5 // Active</div>
          <div className="flex gap-8">
            <span>Completed: {chores.filter(c => c.is_completed).length}</span>
            <span>Pending: {chores.filter(c => !c.is_completed).length}</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;