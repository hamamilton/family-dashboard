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
import { AmbientDisplay } from './components/features/AmbientDisplay';
import { DotsAndBoxes } from './components/features/DotsAndBoxes';
import { CombinedBoard } from './components/views/CombinedBoard';
import { RefreshCw, ClipboardList, CalendarDays } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Refresh app at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow - now;

    const timeout = setTimeout(() => {
      window.location.reload();
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const { sortedGroupEntries, loading, toggleChore, skipChore, rotateAssignee, chores, profiles, todayHoliday, birthdayProfiles, fetchError } = useChores(groupBy);

  const children = profiles.filter(p => !p.is_parent);
  const allChildrenMetGoal = children.length > 0 && children.every(c => (c.xp_balance || 0) >= 100);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col app-root ${allChildrenMetGoal ? 'bonus-glow' : ''}`}>
      {/* Top Header Bar */}
      <Header
        isDarkMode={isDarkMode}
        childrenProfiles={children}
        profiles={profiles}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
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

      {/* Main Layout: Sidebar + Split Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          activeTab={activeTab === 'combined' ? 'mission' : activeTab}
          setActiveTab={setActiveTab}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
          onAdminClick={() => setAdminOpen(true)}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Split View (or Full-Screen View when Games tab is active) */}
        <div className="flex-1 min-w-0 flex flex-col lg:flex-row h-full overflow-hidden">
          
          {/* Left Side: Chores / Scheduled / Functional Views (Full width on Games tab) */}
          <main className={`w-full ${activeTab === 'games' ? 'lg:w-full overflow-hidden' : 'lg:w-1/2 overflow-y-auto lg:border-r'} min-w-0 h-full custom-scrollbar page-bg flex flex-col border-slate-700/50`}>
            {/* Quick Chores / Schedule Switcher Bar (Visible for daily activity views) */}
            {(activeTab === 'mission' || activeTab === 'schedule' || activeTab === 'combined') && (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-700/40 bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10 flex-none font-mono">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  View:
                </div>
                <div className="flex bg-slate-800/80 p-0.5 rounded border border-slate-700/60 text-xs">
                  <button
                    onClick={() => setActiveTab('mission')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-bold ${
                      activeTab === 'mission'
                        ? 'bg-cyan-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ClipboardList size={13} />
                    <span>Chores</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-bold ${
                      activeTab === 'schedule'
                        ? 'bg-cyan-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CalendarDays size={13} />
                    <span>Schedule</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('combined')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-bold ${
                      activeTab === 'combined'
                        ? 'bg-cyan-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Combined</span>
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                <RefreshCw className="animate-spin text-blue-500" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse text-sm">Syncing Database...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* MISSION PANEL */}
                {activeTab === 'mission' && (
                  <div className="p-4 md:p-6 flex flex-col gap-6 flex-1">
                    <div className="page-card flex-1">
                      <ChoreGrid
                        sortedGroupEntries={sortedGroupEntries}
                        profiles={profiles}
                        groupBy={groupBy}
                        toggleChore={toggleChore}
                        skipChore={skipChore}
                        rotateAssignee={rotateAssignee}
                        birthdayProfiles={birthdayProfiles}
                      />
                    </div>
                  </div>
                )}

                {/* MASTER SCHEDULE */}
                {activeTab === 'schedule' && (
                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="page-card flex-1 min-h-[600px] flex flex-col">
                      <CalendarView profiles={profiles} />
                    </div>
                  </div>
                )}

                {/* COMBINED CHORES & SCHEDULE */}
                {activeTab === 'combined' && (
                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="page-card flex-1 min-h-[600px] flex flex-col">
                      <CombinedBoard
                        sortedGroupEntries={sortedGroupEntries}
                        profiles={profiles}
                        toggleChore={toggleChore}
                        skipChore={skipChore}
                        rotateAssignee={rotateAssignee}
                        birthdayProfiles={birthdayProfiles}
                      />
                    </div>
                  </div>
                )}

                {/* FOOD */}
                {activeTab === 'food' && (
                  <div className="p-4 md:p-6 flex flex-col gap-6 flex-1">
                    <div className="page-card">
                      <MealPlanner profiles={profiles} />
                    </div>
                  </div>
                )}

                {/* SHOPPING */}
                {activeTab === 'shopping' && (
                  <div className="p-4 md:p-6 flex flex-col gap-6 flex-1">
                    <div className="page-card">
                      <GroceryList />
                    </div>
                  </div>
                )}

                {/* COME, FOLLOW ME */}
                {activeTab === 'gospel' && (
                  <div className="p-4 md:p-6 flex flex-col gap-6 flex-1">
                    <div className="page-card">
                      <GospelStudy />
                    </div>
                  </div>
                )}

                {/* FUN STUFF */}
                {activeTab === 'fun' && (
                  <div className="p-4 md:p-6 flex-1 flex flex-col gap-6">
                    <div className="page-card min-h-[400px] flex flex-col">
                      <LocalEvents />
                    </div>
                    <div className="page-card min-h-[400px] flex flex-col">
                      <LittleVillageEvents />
                    </div>
                  </div>
                )}

                {/* GAMES (Full Screen) */}
                {activeTab === 'games' && (
                  <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
                    <DotsAndBoxes profiles={profiles} isDarkMode={isDarkMode} />
                  </div>
                )}

                {/* MEMORY BANK */}
                {activeTab === 'memories' && (
                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="page-card flex-1 min-h-[600px] flex flex-col">
                      <PhotoAlbum />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {!loading && activeTab !== 'games' && (
              <footer className="px-4 md:px-6 py-3 border-t border-slate-800/50 flex justify-between items-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em] flex-none">
                <div>FamilyHub // {appTheme.toUpperCase()} MODE</div>
                <div className="flex gap-4 sm:gap-6">
                  <span>Done: {chores.filter(c => c.is_completed).length}</span>
                  <span>Pending: {chores.filter(c => !c.is_completed).length}</span>
                </div>
              </footer>
            )}
          </main>

          {/* Right Side: Ambient Photos & Dad Jokes Stream (Hidden on Games tab so Games is full screen) */}
          {activeTab !== 'games' && (
            <aside className="hidden lg:flex lg:w-1/2 min-w-0 h-full overflow-hidden flex-col bg-slate-950">
              <AmbientDisplay profiles={profiles} />
            </aside>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;