import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Loader2, X } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useCalendar } from '../../hooks/useCalendar';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom Event Component
const EventComponent = ({ event, profiles }) => {
    const PROFILE_COLORS = ['bg-cyan-500', 'bg-fuchsia-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-blue-500'];
    let colorClass = 'bg-slate-500';
    
    if (event.assigned_to === 'Everyone') {
        colorClass = 'bg-amber-500';
    } else if (profiles && profiles.length > 0) {
        const profileIndex = profiles.findIndex(p => p.name === event.assigned_to);
        if (profileIndex !== -1) {
            colorClass = PROFILE_COLORS[profileIndex % PROFILE_COLORS.length];
        }
    }

    return (
        <div className={`p-1 text-xs font-black truncate rounded-sm ${colorClass} text-white shadow-sm h-full`}>
            {event.title}
        </div>
    );
};

export function CalendarView({ profiles = [] }) {
    const { events, loading, addEvent } = useCalendar();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEventData, setNewEventData] = useState({
        title: '',
        start: '',
        end: '',
        assigned_to: 'Everyone'
    });

    const handleSelectSlot = (slotInfo) => {
        setNewEventData({
            title: '',
            start: format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"),
            end: format(slotInfo.end, "yyyy-MM-dd'T'HH:mm"),
            assigned_to: 'Everyone'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addEvent({
            title: newEventData.title,
            start: new Date(newEventData.start),
            end: new Date(newEventData.end),
            assigned_to: newEventData.assigned_to
        });
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-40 gap-4">
                <Loader2 className="animate-spin text-cyan-500" size={64} />
                <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Initializing Calendar...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-700 font-mono relative">

            <div className="flex items-center gap-6 mb-8">
                <h2 className="text-3xl font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                    &gt; Master Schedule
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-transparent shadow-sm dark:shadow-[0_0_10px_rgba(192,38,211,0.5)]"></div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black border border-slate-300 dark:border-cyan-800 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                    <Clock size={14} className="text-cyan-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-cyan-400">
                        Live Sync
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-black p-6 border-2 border-slate-300 dark:border-cyan-900 shadow-lg dark:shadow-[0_0_30px_rgba(34,211,238,0.1)] custom-calendar-wrapper">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 650 }}
                    components={{
                        event: (props) => <EventComponent {...props} profiles={profiles} />
                    }}
                    selectable={true}
                    onSelectSlot={handleSelectSlot}
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-950 border-2 border-cyan-400 p-8 w-full max-w-md shadow-[0_0_30px_rgba(34,211,238,0.2)]" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white">Add Event</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-fuchsia-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">Event Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newEventData.title}
                                    onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-3 text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                    placeholder="E.g., Dentist Appointment"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">Start</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        value={newEventData.start}
                                        onChange={e => setNewEventData({...newEventData, start: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">End</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        value={newEventData.end}
                                        onChange={e => setNewEventData({...newEventData, end: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">Participant</label>
                                <select 
                                    value={newEventData.assigned_to}
                                    onChange={e => setNewEventData({...newEventData, assigned_to: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-3 text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors appearance-none"
                                >
                                    <option value="Everyone">Everyone (Family)</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                type="submit" 
                                className="mt-4 w-full bg-cyan-500 text-black font-black uppercase tracking-widest py-4 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                Create Event
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}