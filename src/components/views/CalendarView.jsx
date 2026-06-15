import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Loader2, X, GripHorizontal } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCalendar, getEventMetadata } from '../../hooks/useCalendar';

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
    const { events, loading, addEvent, addEvents, deleteEvent, updateEvent } = useCalendar();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEventData, setNewEventData] = useState({
        id: null,
        title: '',
        start: new Date(),
        end: new Date(),
        assigned_to: 'Everyone',
        isRecurring: false,
        seriesId: null,
        recurUntil: null,
        selectedDays: []
    });
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const handleSelectSlot = (slotInfo) => {
        setNewEventData({
            id: null,
            title: '',
            start: slotInfo.start,
            end: slotInfo.end,
            assigned_to: 'Everyone',
            isRecurring: false,
            seriesId: null,
            recurUntil: null,
            selectedDays: []
        });
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        const meta = getEventMetadata(event);
        const isRecurring = !!meta?.seriesId;

        setNewEventData({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            assigned_to: event.assigned_to,
            isRecurring,
            seriesId: meta?.seriesId || null,
            recurUntil: meta?.recurUntil ? new Date(meta.recurUntil) : null,
            selectedDays: meta?.selectedDays || []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (newEventData.id) {
            const isSeries = newEventData.isRecurring;
            if (isSeries && !window.confirm('This is a recurring event. Delete entire series?')) {
                // If they say no, just delete this one event
                await deleteEvent(newEventData.id, false);
            } else {
                await deleteEvent(newEventData.id, isSeries);
            }
            setIsModalOpen(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const isEditingSeries = newEventData.id && newEventData.isRecurring;
        const colorData = newEventData.isRecurring ? JSON.stringify({
            seriesId: newEventData.seriesId || `series-${Date.now()}`,
            recurUntil: newEventData.recurUntil,
            selectedDays: newEventData.selectedDays
        }) : '';

        if (newEventData.id && !isEditingSeries) {
            updateEvent(newEventData.id, {
                title: newEventData.title,
                start: newEventData.start,
                end: newEventData.end,
                assigned_to: newEventData.assigned_to,
                color: colorData
            });
        } else if (newEventData.isRecurring) {
            if (isEditingSeries) {
                // To update a series, delete old and generate new
                if (!window.confirm('Update entire recurring series? This will regenerate all future instances.')) {
                    // Just update single event
                    updateEvent(newEventData.id, {
                        title: newEventData.title,
                        start: newEventData.start,
                        end: newEventData.end,
                        assigned_to: newEventData.assigned_to,
                        color: '' // remove series link from this one
                    });
                    setIsModalOpen(false);
                    return;
                }
                await deleteEvent(newEventData.id, true);
            }
            
            const startD = newEventData.start;
            const endD = newEventData.end;
            const untilD = new Date(newEventData.recurUntil);
            untilD.setHours(23, 59, 59, 999);
            
            const generatedEvents = [];
            let current = new Date(startD);
            
            while (current <= untilD) {
                if (newEventData.selectedDays.includes(current.getDay())) {
                    const eStart = new Date(current);
                    eStart.setHours(startD.getHours(), startD.getMinutes(), 0, 0);
                    
                    const eEnd = new Date(current);
                    eEnd.setHours(endD.getHours(), endD.getMinutes(), 0, 0);

                    if (eStart <= untilD) {
                        generatedEvents.push({
                            title: newEventData.title,
                            start: eStart,
                            end: eEnd,
                            assigned_to: newEventData.assigned_to,
                            color: colorData
                        });
                    }
                }
                current.setDate(current.getDate() + 1);
            }
            if (generatedEvents.length > 0) {
                addEvents(generatedEvents);
            }
        } else {
            addEvent({
                title: newEventData.title,
                start: newEventData.start,
                end: newEventData.end,
                assigned_to: newEventData.assigned_to,
                color: colorData
            });
        }
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
        <div className="animate-in fade-in zoom-in-95 duration-700 font-mono relative flex flex-col h-full p-6">

            <div className="flex items-center gap-6 mb-8 flex-none">
                <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-cyan-400 transition-colors flex-none" />
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

            <div className="flex-1 min-h-0 bg-white dark:bg-black p-6 border-2 border-slate-300 dark:border-cyan-900 shadow-lg dark:shadow-[0_0_30px_rgba(34,211,238,0.1)] custom-calendar-wrapper">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    components={{
                        event: (props) => <EventComponent {...props} profiles={profiles} />
                    }}
                    selectable={true}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-950 border-2 border-cyan-400 p-8 w-full max-w-md shadow-[0_0_30px_rgba(34,211,238,0.2)]" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white">
                                {newEventData.id ? 'Update Event' : 'Add Event'}
                            </h3>
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

                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">Start</label>
                                    <DatePicker 
                                        selected={newEventData.start}
                                        onChange={(date) => setNewEventData({...newEventData, start: date})}
                                        showTimeSelect
                                        dateFormat="MMM d, yyyy h:mm aa"
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">End</label>
                                    <DatePicker 
                                        selected={newEventData.end}
                                        onChange={(date) => setNewEventData({...newEventData, end: date})}
                                        showTimeSelect
                                        dateFormat="MMM d, yyyy h:mm aa"
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

                            <div className="mt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={newEventData.isRecurring}
                                        onChange={e => setNewEventData({...newEventData, isRecurring: e.target.checked})}
                                        className="w-5 h-5 text-cyan-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-cyan-800 rounded focus:ring-cyan-500 focus:ring-2 transition-all cursor-pointer accent-cyan-500"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-cyan-500">Recurring Event</span>
                                </label>
                            </div>

                            {newEventData.isRecurring && (
                                <div className="flex flex-col gap-4 border-l-4 border-cyan-500 pl-4 py-2 bg-slate-50 dark:bg-cyan-950/10">
                                    <div className="flex flex-col">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cyan-700 mb-2">Repeat Until</label>
                                        <DatePicker 
                                            selected={newEventData.recurUntil}
                                            onChange={(date) => setNewEventData({...newEventData, recurUntil: date})}
                                            dateFormat="MMM d, yyyy"
                                            className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-800 p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                            placeholderText="Select end date"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cyan-700 mb-2">On Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const days = newEventData.selectedDays.includes(idx)
                                                            ? newEventData.selectedDays.filter(d => d !== idx)
                                                            : [...newEventData.selectedDays, idx];
                                                        setNewEventData({...newEventData, selectedDays: days});
                                                    }}
                                                    className={`px-3 py-2 text-xs font-black uppercase tracking-wider border transition-colors ${
                                                        newEventData.selectedDays.includes(idx) 
                                                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                                                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mt-4">
                                {newEventData.id && (
                                    <button 
                                        type="button" 
                                        onClick={handleDelete}
                                        className="flex-1 bg-transparent border-2 border-rose-500 text-rose-500 font-black uppercase tracking-widest py-4 hover:bg-rose-500 hover:text-white transition-colors"
                                        style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                                    >
                                        Delete
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-cyan-500 text-black font-black uppercase tracking-widest py-4 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                                >
                                    {newEventData.id ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}