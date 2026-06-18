import { useState, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, Loader2, X, GripHorizontal, MapPin, Camera, CalendarDays } from 'lucide-react';
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
import { LocationAutocomplete } from '../features/LocationAutocomplete';
import { SubscriptionsModal } from '../features/SubscriptionsModal';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    
    const assignees = Array.isArray(event.assigned_to) 
        ? event.assigned_to 
        : (event.assigned_to || 'Everyone').split(',').map(s => s.trim());

    if (assignees.includes('Everyone') || assignees.length > 1) {
        colorClass = 'bg-amber-500';
    } else if (profiles && profiles.length > 0) {
        const profileIndex = profiles.findIndex(p => p.name === assignees[0]);
        if (profileIndex !== -1) {
            colorClass = PROFILE_COLORS[profileIndex % PROFILE_COLORS.length];
        }
    }

    const meta = getEventMetadata(event);
    const location = meta?.location || '';

    return (
        <div className={`p-1 text-xs font-black truncate rounded-sm ${colorClass} text-white shadow-sm h-full flex flex-col justify-between`}>
            <span className="truncate">{event.title}</span>
            {location && (
                <div className="flex items-center gap-1 mt-0.5 opacity-80">
                    <MapPin size={10} className="flex-shrink-0" />
                    <span className="text-[9px] truncate tracking-wider">{location.split(',')[0]}</span>
                </div>
            )}
        </div>
    );
};

export function CalendarView({ profiles = [] }) {
    const { events, subscriptions, loading, addEvent, addEvents, deleteEvent, updateEvent, addSubscription, removeSubscription } = useCalendar();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef(null);
    const [newEventData, setNewEventData] = useState({
        id: null,
        title: '',
        start: new Date(),
        end: new Date(),
        assigned_to: ['Everyone'],
        isRecurring: false,
        seriesId: null,
        recurUntil: null,
        selectedDays: [],
        location: ''
    });
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const handleSelectSlot = (slotInfo) => {
        setNewEventData({
            id: null,
            title: '',
            start: slotInfo.start,
            end: slotInfo.end,
            assigned_to: ['Everyone'],
            isRecurring: false,
            seriesId: null,
            recurUntil: null,
            selectedDays: [],
            location: ''
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
            assigned_to: Array.isArray(event.assigned_to) 
                ? event.assigned_to 
                : (event.assigned_to || 'Everyone').split(',').map(s => s.trim()),
            isRecurring,
            seriesId: meta?.seriesId || null,
            recurUntil: meta?.recurUntil ? new Date(meta.recurUntil) : null,
            selectedDays: meta?.selectedDays || [],
            location: meta?.location || ''
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsScanning(true);
            e.target.value = null; // Reset file input

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                alert('VITE_GEMINI_API_KEY is not set in your environment variables. Please add it to use the AI Scanner.');
                setIsScanning(false);
                return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Data = reader.result.split(',')[1];
                    const imagePart = { inlineData: { data: base64Data, mimeType: file.type } };

                    const prompt = `
                        You are an expert event calendar assistant. 
                        Extract the event details from this flyer. 
                        Return ONLY a JSON object with the following keys:
                        - title: string
                        - start_date: string (YYYY-MM-DD)
                        - end_date: string (YYYY-MM-DD)
                        - start_time: string (HH:MM in 24hr format, e.g. 14:30)
                        - end_time: string (HH:MM in 24hr format)
                        - description: string
                        
                        If any of these are missing, guess to the best of your ability or return an empty string. If no end time is specified, make it 1 hour after start time.
                        Ensure the output is strictly valid JSON without markdown blocks.
                    `;

                    const result = await model.generateContent([prompt, imagePart]);
                    let responseText = result.response.text();
                    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    
                    const data = JSON.parse(responseText);

                    let start = new Date();
                    let end = new Date();
                    
                    if (data.start_date) {
                        const [y, m, d] = data.start_date.split('-');
                        start = new Date(y, m - 1, d);
                        end = new Date(y, m - 1, d);
                    }
                    if (data.start_time) {
                        const [h, min] = data.start_time.split(':');
                        start.setHours(h, min, 0, 0);
                    }
                    if (data.end_date) {
                        const [y, m, d] = data.end_date.split('-');
                        end = new Date(y, m - 1, d);
                    }
                    if (data.end_time) {
                        const [h, min] = data.end_time.split(':');
                        end.setHours(h, min, 0, 0);
                    } else {
                        end = new Date(start.getTime() + 3600000);
                    }

                    setNewEventData({
                        id: null,
                        title: data.title || 'Scanned Event',
                        start: start,
                        end: end,
                        assigned_to: ['Everyone'],
                        isRecurring: false,
                        seriesId: null,
                        recurUntil: null,
                        selectedDays: [],
                        location: data.description || ''
                    });
                    setIsModalOpen(true);
                } catch(err) {
                    console.error(err);
                    alert('Failed to parse flyer: ' + err.message);
                } finally {
                    setIsScanning(false);
                }
            };
        } catch(err) {
            console.error(err);
            setIsScanning(false);
        }
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
        
        let colorObj = {};
        if (newEventData.isRecurring) {
            colorObj = {
                seriesId: newEventData.seriesId || `series-${Date.now()}`,
                recurUntil: newEventData.recurUntil,
                selectedDays: newEventData.selectedDays
            };
        }
        if (newEventData.location) {
            colorObj.location = newEventData.location;
        }
        
        const colorData = Object.keys(colorObj).length > 0 ? JSON.stringify(colorObj) : '';

        const assignedToJoined = Array.isArray(newEventData.assigned_to) ? newEventData.assigned_to.join(', ') : newEventData.assigned_to;

        if (newEventData.id && !isEditingSeries) {
            updateEvent(newEventData.id, {
                title: newEventData.title,
                start: newEventData.start,
                end: newEventData.end,
                assigned_to: assignedToJoined,
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
                        assigned_to: assignedToJoined,
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
                            assigned_to: assignedToJoined,
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
                assigned_to: assignedToJoined,
                color: colorData
            });
        }
        setIsModalOpen(false);
    };

    const toggleAssignee = (name) => {
        setNewEventData(prev => {
            let nextAssigned = Array.isArray(prev.assigned_to) ? [...prev.assigned_to] : [prev.assigned_to];
            
            if (name === 'Everyone') {
                return { ...prev, assigned_to: ['Everyone'] };
            }
            
            if (nextAssigned.includes('Everyone')) {
                nextAssigned = [name];
                return { ...prev, assigned_to: nextAssigned };
            }

            if (nextAssigned.includes(name)) {
                nextAssigned = nextAssigned.filter(n => n !== name);
                if (nextAssigned.length === 0) {
                    nextAssigned = ['Everyone'];
                }
            } else {
                nextAssigned.push(name);
            }
            
            return { ...prev, assigned_to: nextAssigned };
        });
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
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={() => {
                            setNewEventData({
                                id: null,
                                title: '',
                                start: new Date(),
                                end: new Date(Date.now() + 3600000),
                                assigned_to: ['Everyone'],
                                isRecurring: false,
                                seriesId: null,
                                recurUntil: null,
                                selectedDays: [],
                                location: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs transition-colors shadow-sm"
                    >
                        <CalendarIcon size={14} />
                        New Event
                    </button>

                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black uppercase tracking-widest text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                        {isScanning ? 'Scanning...' : 'Scan Flyer'}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />

                    <button 
                        onClick={() => setIsSubModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black border border-slate-300 dark:border-cyan-800 hover:border-cyan-400 text-slate-500 hover:text-cyan-500 font-black uppercase tracking-widest text-xs transition-colors shadow-sm"
                    >
                        <CalendarDays size={14} />
                        Feeds
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black border border-slate-300 dark:border-cyan-800 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                        <Clock size={14} className="text-cyan-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-cyan-400">
                            Live Sync
                        </span>
                    </div>
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
                    min={new Date(2000, 1, 1, 6, 0, 0)}
                    max={new Date(2000, 1, 1, 22, 0, 0)}
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

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-600 mb-2">Location / Address</label>
                                <LocationAutocomplete 
                                    value={newEventData.location}
                                    onChange={(val) => setNewEventData({...newEventData, location: val})}
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
                                <div className="flex flex-wrap gap-1.5">
                                    <button 
                                        type="button"
                                        onClick={() => toggleAssignee('Everyone')}
                                        className={`px-3 py-1.5 text-xs font-black uppercase border transition-colors ${
                                            newEventData.assigned_to.includes('Everyone')
                                                ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                                                : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-amber-400'
                                        }`}
                                    >
                                        Everyone
                                    </button>
                                    {profiles.map(p => {
                                        const isSelected = newEventData.assigned_to.includes(p.name);
                                        return (
                                            <button 
                                                key={p.id} 
                                                type="button"
                                                onClick={() => toggleAssignee(p.name)}
                                                className={`px-3 py-1.5 text-xs font-black uppercase border transition-colors ${
                                                    isSelected
                                                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-500'
                                                        : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-cyan-400'
                                                }`}
                                            >
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>
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

            {/* Subscriptions Modal */}
            <SubscriptionsModal 
                isOpen={isSubModalOpen}
                onClose={() => setIsSubModalOpen(false)}
                subscriptions={subscriptions}
                addSubscription={addSubscription}
                removeSubscription={removeSubscription}
            />
        </div>
    );
}