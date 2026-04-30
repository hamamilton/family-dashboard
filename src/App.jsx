import { useEffect, useState, useCallback } from 'react';
import { pb } from './lib/pocketbase';
import { CheckCircle, Circle, RefreshCw, LayoutGrid, User, Calendar, Repeat } from 'lucide-react';

function App() {
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('assigned_to'); // Default grouping

  /**
   * 1. DATA FETCHING & SYNC
   * Using useCallback to satisfy dependency rules and prevent unnecessary re-renders.
   */
const fetchChores = useCallback(async () => {
  try {
    console.log("Syncing with Mac Mini...");
    // Removing 'day_due' from the sort since it might not be in the DB yet
    const records = await pb.collection('chores').getFullList({
      sort: '-created', // 'created' is a guaranteed system field
    });
    console.log("Records received:", records);
    setChores(records);
  } catch (err) {
    // If this hits, look at the console—it will tell you if a field name is wrong
    console.error("Connection failed. Check your field names in PocketBase:", err);
  } finally {
    setLoading(false);
  }
}, []);

  const toggleChore = async (id, currentStatus) => {
    try {
      await pb.collection('chores').update(id, {
        is_completed: !currentStatus
      });
      // Real-time subscription handles the UI update automatically
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  /**
   * 2. REAL-TIME SUBSCRIPTION
   * Listens for any changes in the database and refreshes the UI instantly.
   */
  useEffect(() => {
    fetchChores();

    pb.collection('chores').subscribe('*', () => {
      fetchChores();
    });

    return () => pb.collection('chores').unsubscribe();
  }, [fetchChores]);

  /**
   * 3. GROUPING LOGIC (Derived State)
   * Transforms the flat array into a categorized object based on 'groupBy' state.
   */
  const groupedChores = chores.reduce((acc, chore) => {
    const key = chore[groupBy] || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(chore);
    return acc;
  }, {});

  /**
   * 4. UI RENDER
   */
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12 font-sans tracking-tight">
      
      {/* HEADER SECTION */}
      <header className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            FAMILY HUB
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-sm mt-2">
            Iowa City Node // {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* VIEW TOGGLE CONTROLS */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-3xl border border-slate-800 shadow-2xl">
          {[
            { id: 'assigned_to', label: 'By Son', icon: <User size={18} /> },
            { id: 'day_due', label: 'By Day', icon: <Calendar size={18} /> },
            { id: 'frequency', label: 'Frequency', icon: <Repeat size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setGroupBy(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
                groupBy === tab.id 
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={64} />
          <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Loading Hub...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedChores).length === 0 ? (
            <div className="p-20 text-center border-4 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/30">
              <p className="text-slate-500 text-2xl font-bold italic">The chore list is currently empty.</p>
            </div>
          ) : (
            Object.entries(groupedChores).map(([groupName, items]) => (
              <section key={groupName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* SECTION CATEGORY HEADER */}
                <div className="flex items-center gap-6 mb-8">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-400">
                    {groupName}
                  </h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                  <span className="text-sm font-black bg-slate-800 text-slate-400 px-4 py-1 rounded-full border border-slate-700">
                    {items.length} {items.length === 1 ? 'TASK' : 'TASKS'}
                  </span>
                </div>

                {/* TASK GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {items.map((chore) => (
                    <button
                      key={chore.id}
                      onClick={() => toggleChore(chore.id, chore.is_completed)}
                      className={`group relative p-8 rounded-[2.5rem] border-2 text-left transition-all duration-500 shadow-xl ${
                        chore.is_completed
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-50 grayscale-[0.5]'
                          : 'border-slate-800 bg-slate-900/40 hover:border-blue-500/50 hover:bg-slate-800/60 hover:-translate-y-1'
                      }`}
                    >
                      {/* STATUS INDICATOR */}
                      <div className="absolute top-8 right-8">
                        {chore.is_completed ? (
                          <CheckCircle size={36} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        ) : (
                          <Circle size={36} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                        )}
                      </div>

                      {/* CHORE INFO */}
                      <div className="pr-12">
                        <h3 className={`text-4xl font-black mb-2 leading-none tracking-tighter ${
                          chore.is_completed ? 'line-through text-slate-600' : 'text-white'
                        }`}>
                          {chore.chore_name}
                        </h3>
                        
                        <div className="flex flex-col gap-1 mt-4">
                          <p className={`text-xl font-bold ${chore.is_completed ? 'text-slate-700' : 'text-blue-400'}`}>
                            {chore.assigned_to}
                          </p>
                          
                          {/* DYNAMIC METADATA (Shows the non-grouped info) */}
                          <div className="flex gap-2 mt-2">
                             {groupBy !== 'frequency' && (
                               <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 px-2 py-1 rounded text-slate-500">
                                 {chore.frequency}
                               </span>
                             )}
                             {groupBy !== 'day_due' && (
                               <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 px-2 py-1 rounded text-slate-500">
                                 {chore.day_due}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* FOOTER STATS */}
      {!loading && (
        <footer className="mt-20 pt-8 border-t border-slate-800/50 flex justify-between items-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">
          <div>System: Pi-3B Core // MacMini Chassis</div>
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