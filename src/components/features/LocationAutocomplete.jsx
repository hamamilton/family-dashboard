import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

export function LocationAutocomplete({ value, onChange }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

    // Sync external value changes
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Using Photon API powered by OpenStreetMap
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`);
            const data = await res.json();
            
            if (data && data.features) {
                const formatted = data.features.map(f => {
                    const props = f.properties;
                    const name = props.name || '';
                    const street = props.street || '';
                    const housenumber = props.housenumber || '';
                    const city = props.city || props.town || props.village || '';
                    const state = props.state || '';
                    
                    let primary = name;
                    let secondaryArr = [];
                    
                    if (housenumber && street) {
                        if (!primary) primary = `${housenumber} ${street}`;
                        else secondaryArr.push(`${housenumber} ${street}`);
                    } else if (street) {
                        if (!primary) primary = street;
                        else secondaryArr.push(street);
                    }
                    
                    if (city) secondaryArr.push(city);
                    if (state) secondaryArr.push(state);
                    
                    const secondary = secondaryArr.join(', ');
                    
                    return {
                        id: f.properties.osm_id || Math.random().toString(),
                        primary,
                        secondary,
                        full: secondary ? `${primary}, ${secondary}` : primary
                    };
                });
                setSuggestions(formatted);
            }
        } catch (err) {
            console.error('Error fetching address suggestions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val); // update parent state immediately so they can just type whatever
        setIsOpen(true);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 400);
    };

    const handleSelect = (suggestion) => {
        setQuery(suggestion.full);
        onChange(suggestion.full);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-400 dark:text-slate-500" />
                <input 
                    type="text" 
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { if (query.length >= 3) setIsOpen(true); }}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 py-3 pl-10 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Search for an address or place..."
                />
                {loading && (
                    <Loader2 size={16} className="absolute right-3 text-cyan-500 animate-spin" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                        <div 
                            key={`${item.id}-${idx}`}
                            onClick={() => handleSelect(item)}
                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                            <MapPin size={16} className="text-cyan-500 mt-1 flex-shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.primary}</span>
                                {item.secondary && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.secondary}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
