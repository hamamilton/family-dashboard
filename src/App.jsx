import { useState, useEffect } from 'react';
import { useChores } from './hooks/useChores';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChoreGrid } from './components/views/ChoreGrid';
import { CalendarView } from './components/views/CalendarView';
import { GroceryList } from './components/features/GroceryList';
import { MealPlanner } from './components/features/MealPlanner';
import { PhotoAlbum } from './components/features/PhotoAlbum';
import { AdminPanel } from './components/features/AdminPanel';
import { GospelStudy } from './components/features/GospelStudy';
import { LocalEvents } from './components/features/LocalEvents';
import { LittleVillageEvents } from './components/features/LittleVillageEvents';
import { RefreshCw } from 'lucide-react';

function App() {
  const [groupBy, setGroupBy] = useState('day_due');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'mission');
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('appTheme') || 'scifi');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [adminOpen, setAdminOpen] = useState(false);

  // Dark mode effect
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

  // App theme effect — applies a class to <body> for CSS variable overrides
  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-scifi', 'theme-ios', 'theme-android');
    body.classList.add(`theme-${appTheme}`);
    localStorage.setItem('appTheme', appTheme);
  }, [appTheme]);

  // Persist active tab and sidebar state
  useEffect(() => { localStorage.setItem('activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('sidebarCollapsed', sidebarCollapsed); }, [sidebarCollapsed]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const { sortedGroupEntries, loading, toggleChore, chores, profiles, todayHoliday, birthdayProfiles, fetchError } = useChores(groupBy);

  const children = profiles.filter(p => !p.is_parent);
  const allChildrenMetGoal = children.length > 0 && children.every(c => (c.xp_balance || 0) >= 100);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col app-root ${allChildrenMetGoal ? 'bonus-glow' : ''}`}>
      {/* Top Header Bar */}
      <Header
        isDarkMode={isDarkMode}
        childrenProfiles={children}
        profiles={profiles}
      />

      <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-red-600 text-white font-black uppercase tracking-[0.2em] p-2 text-center text-xs border-b-2 border-red-800 z-10 flex-none">
          ⚠️ DATABASE ERROR: {fetchError} ⚠️
        </div>
      )}

      {/* Holiday & Birthday Banners */}
      {todayHoliday && (
        <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 text-white font-black uppercase tracking-[0.3em] p-2 text-center text-xs border-b-2 border-cyan-400 z-10 flex-none">
          ⚠️ REST DAY: Happy {todayHoliday}! 1.5x XP ACTIVE! ⚠️
        </div>
      )}
      {birthdayProfiles && birthdayProfiles.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black uppercase tracking-[0.3em] p-2 text-center text-xs border-b-2 border-emerald-300 z-10 flex-none">
          🎉 BIRTHDAY PROTOCOL: {birthdayProfiles.join(', ')}! CHORES SUSPENDED! 🎉
        </div>
      )}

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
          onAdminClick={() => setAdminOpen(true)}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar page-bg flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <RefreshCw className="animate-spin text-blue-500" size={48} />
              <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse text-sm">Syncing Database...</p>
            </div>
          ) : (
            <>
              {/* MISSION PANEL */}
              {activeTab === 'mission' && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="page-card">
                    <ChoreGrid
                      sortedGroupEntries={sortedGroupEntries}
                      profiles={profiles}
                      groupBy={groupBy}
                      toggleChore={toggleChore}
                      birthdayProfiles={birthdayProfiles}
                    />
                  </div>
                </div>
              )}

              {/* MASTER SCHEDULE */}
              {activeTab === 'schedule' && (
                <div className="p-6 flex-1 flex flex-col">
                  <div className="page-card flex-1 min-h-[600px] flex flex-col">
                    <CalendarView profiles={profiles} />
                  </div>
                </div>
              )}

              {/* FOOD */}
              {activeTab === 'food' && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="page-card">
                    <MealPlanner />
                  </div>
                </div>
              )}

              {/* SHOPPING */}
              {activeTab === 'shopping' && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="page-card">
                    <GroceryList />
                  </div>
                </div>
              )}

              {/* COME, FOLLOW ME */}
              {activeTab === 'gospel' && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="page-card">
                    <GospelStudy />
                  </div>
                </div>
              )}

              {/* FUN STUFF */}
              {activeTab === 'fun' && (
                <div className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="page-card min-h-[600px] flex flex-col lg:col-span-1">
                    <LocalEvents />
                  </div>
                  <div className="page-card min-h-[600px] flex flex-col lg:col-span-2">
                    <LittleVillageEvents />
                  </div>
                </div>
              )}

              {/* MEMORY BANK */}
              {activeTab === 'memories' && (
                <div className="p-6 flex-1 flex flex-col">
                  <div className="page-card flex-1 min-h-[600px] flex flex-col">
                    <PhotoAlbum />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          {!loading && (
            <footer className="px-6 py-3 border-t border-slate-800/50 flex justify-between items-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">
              <div>FamilyHub v2.0 // {appTheme.toUpperCase()} MODE</div>
              <div className="flex gap-6">
                <span>Done: {chores.filter(c => c.is_completed).length}</span>
                <span>Pending: {chores.filter(c => !c.is_completed).length}</span>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;