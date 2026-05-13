import { useState, useEffect } from 'react';
import { useChores } from './hooks/useChores';
import { useLayout } from './hooks/useLayout';
import { Header } from './components/layout/Header';
import { ChoreGrid } from './components/views/ChoreGrid';
import { CalendarView } from './components/views/CalendarView';
import { GroceryList } from './components/features/GroceryList';
import { MealPlanner } from './components/features/MealPlanner';
import { PhotoAlbum } from './components/features/PhotoAlbum';
import { RefreshCw } from 'lucide-react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

function App() {
  const [groupBy, setGroupBy] = useState('assigned_to');
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

  const { sortedGroupEntries, loading, toggleChore, chores, profiles, todayHoliday, birthdayProfiles } = useChores(groupBy);
  const { layouts, onLayoutChange } = useLayout();
  const { width, containerRef, mounted } = useContainerWidth();

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-white p-4 font-mono tracking-tight bg-[linear-gradient(to_right,#0891b220_1px,transparent_1px),linear-gradient(to_bottom,#0891b220_1px,transparent_1px)] bg-[size:40px_40px]">
      <Header 
        groupBy={groupBy} 
        setGroupBy={setGroupBy} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />

      {todayHoliday && (
        <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 text-white font-black uppercase tracking-[0.3em] p-3 text-center text-sm md:text-base border-b-4 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10 flex-none">
          ⚠️ REST DAY OVERRIDE: Happy {todayHoliday}! ALL AGENTS GRANTED TEMPORARY OP STATUS. 1.5x XP MULTIPLIER ACTIVE! ⚠️
        </div>
      )}

      {birthdayProfiles && birthdayProfiles.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black uppercase tracking-[0.3em] p-3 text-center text-sm md:text-base border-b-4 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 flex-none">
          🎉 INITIATING BIRTHDAY PROTOCOL FOR: {birthdayProfiles.join(', ')}! CHORES SUSPENDED FOR THE DAY. 🎉
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={64} />
          <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Syncing Database...</p>
        </div>
      ) : (
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden min-h-0 relative custom-scrollbar" ref={containerRef}>
          {mounted && (
            <Responsive
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={350}
              width={width}
              onLayoutChange={onLayoutChange}
              draggableHandle=".drag-handle"
              margin={[24, 24]}
            >
            <div key="chores" className="flex flex-col h-full bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-900 shadow-lg">
              <ChoreGrid
                sortedGroupEntries={sortedGroupEntries}
                profiles={profiles}
                groupBy={groupBy}
                toggleChore={toggleChore}
                birthdayProfiles={birthdayProfiles}
              />
            </div>
            
            <div key="calendar" className="flex flex-col h-full bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-900 shadow-lg">
              <CalendarView profiles={profiles} />
            </div>

            <div key="meals" className="flex flex-col h-full bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-900 shadow-lg">
              <MealPlanner />
            </div>

            <div key="groceries" className="flex flex-col h-full bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-900 shadow-lg">
              <GroceryList />
            </div>

            <div key="photos" className="flex flex-col h-full bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-900 shadow-lg">
              <PhotoAlbum />
            </div>
            </Responsive>
          )}
        </div>
      )}

      {!loading && (
        <footer className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em] flex-none">
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