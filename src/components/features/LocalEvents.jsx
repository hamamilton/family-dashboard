import { useState, useEffect } from 'react';
import { MapPin, Calendar as CalendarIcon, Ticket, GripHorizontal, Settings, Key, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export function LocalEvents() {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('tm_api_key') || '');
    const [tempKey, setTempKey] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isConfiguring, setIsConfiguring] = useState(!localStorage.getItem('tm_api_key'));

    useEffect(() => {
        if (apiKey && !isConfiguring) {
            fetchEvents();
        }
    }, [apiKey, isConfiguring]);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch events in Iowa, specifically targeting the requested corridor
            // We use stateCode=IA and search for major cities in that corridor
            const cities = 'Des Moines,Iowa City,Coralville,Cedar Rapids,Davenport,Bettendorf';
            const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&stateCode=IA&city=${encodeURIComponent(cities)}&sort=date,asc&size=20`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data?.fault?.faultstring || 'Failed to fetch events from Ticketmaster');
            }

            if (data._embedded && data._embedded.events) {
                setEvents(data._embedded.events);
            } else {
                setEvents([]);
            }
        } catch (err) {
            setError(err.message);
            // If it's an auth error, kick them back to config
            if (err.message.toLowerCase().includes('invalid api key')) {
                setApiKey('');
                localStorage.removeItem('tm_api_key');
                setIsConfiguring(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKey = (e) => {
        e.preventDefault();
        if (tempKey.trim()) {
            localStorage.setItem('tm_api_key', tempKey.trim());
            setApiKey(tempKey.trim());
            setIsConfiguring(false);
            setTempKey('');
        }
    };

    const formatDate = (dateStr, timeStr) => {
        try {
            const date = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
            return new Intl.DateTimeFormat('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: timeStr ? 'numeric' : undefined,
                minute: timeStr ? '2-digit' : undefined,
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-300 dark:border-violet-900 shadow-lg dark:shadow-[0_0_30px_rgba(139,92,246,0.1)] relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-none border-b border-slate-200 dark:border-violet-900/50 bg-white dark:bg-black z-10">
                <div className="flex items-center gap-4">
                    <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-violet-400 transition-colors flex-none" />
                    <Ticket size={24} className="text-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    <h2 className="text-2xl font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]">
                        Local Events
                    </h2>
                </div>
                
                {apiKey && !isConfiguring && (
                    <button 
                        onClick={() => setIsConfiguring(true)}
                        className="text-slate-400 hover:text-violet-400 transition-colors"
                        title="Configure API Key"
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 p-6 relative">
                
                {isConfiguring ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
                        <Key size={48} className="text-violet-500 mb-6 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white mb-4">
                            Ticketmaster Integration
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                            To pull live events from Des Moines to the Quad Cities, you need a free Ticketmaster API key. 
                            It takes 60 seconds to create an account and grab your key.
                        </p>
                        
                        <a 
                            href="https://developer.ticketmaster.com/products-and-docs/apis/getting-started/" 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold uppercase tracking-widest text-xs hover:underline mb-8"
                        >
                            Get Free API Key <ExternalLink size={14} />
                        </a>

                        <form onSubmit={handleSaveKey} className="w-full flex flex-col gap-4">
                            <input 
                                type="text" 
                                placeholder="Paste API Key Here..." 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                className="w-full bg-white dark:bg-black border-2 border-slate-300 dark:border-violet-900/50 p-4 text-center font-mono text-slate-800 dark:text-violet-200 focus:outline-none focus:border-violet-500 transition-colors shadow-inner"
                                required
                            />
                            <button 
                                type="submit"
                                className="w-full bg-violet-600 text-white font-black uppercase tracking-[0.2em] py-4 hover:bg-violet-500 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                Connect Widget
                            </button>
                            {apiKey && (
                                <button 
                                    type="button"
                                    onClick={() => setIsConfiguring(false)}
                                    className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-700 dark:hover:text-slate-300 mt-2"
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-violet-500">
                        <Loader2 className="animate-spin" size={48} />
                        <span className="font-black uppercase tracking-widest text-xs animate-pulse">Scanning Iowa...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <AlertCircle size={48} className="text-rose-500" />
                        <p className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest text-sm max-w-sm">
                            {error}
                        </p>
                        <button 
                            onClick={fetchEvents}
                            className="mt-4 px-6 py-2 border border-violet-500 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-slate-500">
                        <Ticket size={48} className="opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-sm">No upcoming events found in the corridor.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {events.map((event) => {
                            const venue = event._embedded?.venues?.[0];
                            const image = event.images?.find(img => img.ratio === '16_9' && img.width > 600) || event.images?.[0];
                            
                            return (
                                <div 
                                    key={event.id}
                                    className="group relative bg-white dark:bg-black border border-slate-200 dark:border-violet-900/30 overflow-hidden flex flex-col hover:border-violet-400 dark:hover:border-violet-500 transition-colors shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                                >
                                    {/* Image */}
                                    {image && (
                                        <div className="w-full h-32 shrink-0 relative overflow-hidden bg-slate-900">
                                            <img 
                                                src={image.url} 
                                                alt={event.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-4 flex flex-col justify-between flex-1 gap-4 min-w-0">
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-wide text-slate-800 dark:text-white leading-tight mb-2 line-clamp-2">
                                                {event.name}
                                            </h4>
                                            
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                                                    <CalendarIcon size={14} />
                                                    <span>
                                                        {formatDate(event.dates?.start?.localDate, event.dates?.start?.localTime)}
                                                    </span>
                                                </div>
                                                
                                                {venue && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        <MapPin size={14} className="shrink-0" />
                                                        <span className="truncate">
                                                            {venue.name} &bull; {venue.city?.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex justify-end">
                                            <a 
                                                href={event.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-colors"
                                            >
                                                Get Tickets <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
