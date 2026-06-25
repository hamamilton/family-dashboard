import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import ICAL from 'ical.js';

const loadLocalEvents = () => {
    const localData = localStorage.getItem('family_dashboard_events');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            return parsed.map(e => ({
                ...e,
                start: new Date(e.start),
                end: new Date(e.end)
            }));
        } catch (e) {
            return [];
        }
    }
    return [];
};

export function useCalendar() {
    const [events, setEvents] = useState(loadLocalEvents());
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const records = await pb.collection('events').getFullList({ sort: 'date' });
            
            const subRecords = records.filter(r => r.title === '[ICAL_SUBSCRIPTION]');
            const normalRecords = records.filter(r => r.title !== '[ICAL_SUBSCRIPTION]');

            setSubscriptions(subRecords.map(r => ({ id: r.id, url: r.color })));

            const formattedRecords = normalRecords.map(record => {
                const startDate = new Date(record.date || record.start);
                const endDate = record.end 
                    ? new Date(record.end) 
                    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default: 1hr duration

                return {
                    ...record,
                    assigned_to: record.assignee || record.assigned_to || 'Everyone',
                    start: startDate,
                    end: endDate,
                };
            }).filter(e => !isNaN(e.start.getTime()) && !isNaN(e.end.getTime()));
            
            // Fetch subscriptions
            let subEvents = [];
            for (const sub of subRecords) {
                try {
                    let text = '';
                    try {
                        const directRes = await fetch(sub.color);
                        if (directRes.ok) {
                            text = await directRes.text();
                        } else {
                            throw new Error('Direct fetch failed');
                        }
                    } catch (e) {
                        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sub.color)}`;
                        const res = await fetch(proxyUrl);
                        if (!res.ok) continue;
                        text = await res.text();
                    }
                    
                    const jcalData = ICAL.parse(text);
                    const comp = new ICAL.Component(jcalData);
                    const vevents = comp.getAllSubcomponents('vevent');
                    
                    const now = new Date();
                    const minDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // 1 year ago
                    const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), 1); // 1 year ahead

                    vevents.forEach(vevent => {
                        const event = new ICAL.Event(vevent);
                        if (!event.startDate) return;
                        
                        const duration = event.endDate ? event.endDate.toUnixTime() - event.startDate.toUnixTime() : 3600;

                        if (event.isRecurring()) {
                            try {
                                const iter = event.iterator();
                                let next;
                                let limit = 0;
                                while ((next = iter.next()) && limit < 100) {
                                    const jsDate = next.toJSDate();
                                    if (jsDate > maxDate) break;
                                    if (jsDate >= minDate) {
                                        const nextEnd = new Date(jsDate.getTime() + duration * 1000);
                                        subEvents.push({
                                            id: `ical-${sub.id}-${event.uid}-${limit}`,
                                            title: event.summary,
                                            start: jsDate,
                                            end: nextEnd,
                                            assigned_to: 'Everyone',
                                            color: '#64748b', // slate-500 representation
                                            isExternal: true,
                                            readonly: true
                                        });
                                    }
                                    limit++;
                                }
                            } catch(e) { console.warn("Recurrence error", e); }
                        } else {
                            const jsDate = event.startDate.toJSDate();
                            if (jsDate >= minDate && jsDate <= maxDate) {
                                subEvents.push({
                                    id: `ical-${sub.id}-${event.uid}`,
                                    title: event.summary,
                                    start: jsDate,
                                    end: event.endDate ? event.endDate.toJSDate() : new Date(jsDate.getTime() + duration * 1000),
                                    assigned_to: 'Everyone',
                                    color: '#64748b',
                                    isExternal: true,
                                    readonly: true
                                });
                            }
                        }
                    });
                } catch(err) {
                    console.warn('Failed to parse ical feed', sub.color, err);
                }
            }

            const allEvents = [...formattedRecords, ...subEvents];
            setEvents(allEvents);
            localStorage.setItem('family_dashboard_events', JSON.stringify(allEvents));
        } catch (err) {
            console.warn("Could not fetch events from Pocketbase.", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        pb.collection('events').subscribe('*', fetchEvents);
        return () => pb.collection('events').unsubscribe();
    }, [fetchEvents]);

    const addEvent = async (newEvent) => {
        const eventWithId = { ...newEvent, id: `temp-${Date.now()}` };
        
        setEvents(prev => {
            const next = [...prev, eventWithId];
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        try {
            await pb.collection('events').create({
                title: newEvent.title,
                date: newEvent.start.toISOString(),
                end: newEvent.end.toISOString(),
                assignee: newEvent.assigned_to,
                color: newEvent.color || '',
            });
            await fetchEvents();
        } catch (err) {
            console.warn("Could not save to Pocketbase. Event exists only locally.", err);
        }
    };

    const addEvents = async (newEventsArray) => {
        const eventsWithIds = newEventsArray.map((evt, idx) => ({
            ...evt,
            id: `temp-${Date.now()}-${idx}`
        }));

        setEvents(prev => {
            const next = [...prev, ...eventsWithIds];
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        try {
            await Promise.all(newEventsArray.map(newEvent => 
                pb.collection('events').create({
                    title: newEvent.title,
                    date: newEvent.start.toISOString(),
                    end: newEvent.end.toISOString(),
                    assignee: newEvent.assigned_to,
                    color: newEvent.color || '',
                }, { requestKey: null }) // Prevent PocketBase auto-cancellation
            ));
            await fetchEvents();
        } catch (err) {
            console.warn("Could not save bulk events to Pocketbase.", err);
        }
    };

    const deleteEvent = async (id, isSeries = false) => {
        let eventsToDelete = [];
        let newEventsState = [];

        setEvents(prev => {
            if (isSeries) {
                // Find all events belonging to this series
                const eventToDelete = prev.find(e => e.id === id);
                if (eventToDelete && eventToDelete.color) {
                    try {
                        const meta = JSON.parse(eventToDelete.color);
                        if (meta.seriesId) {
                            eventsToDelete = prev.filter(e => {
                                try {
                                    const m = JSON.parse(e.color || '{}');
                                    return m.seriesId === meta.seriesId;
                                } catch(err) { return false; }
                            });
                            newEventsState = prev.filter(e => !eventsToDelete.includes(e));
                            localStorage.setItem('family_dashboard_events', JSON.stringify(newEventsState));
                            return newEventsState;
                        }
                    } catch(err) {}
                }
            }
            
            // Single event fallback
            eventsToDelete = prev.filter(e => e.id === id);
            newEventsState = prev.filter(e => e.id !== id);
            localStorage.setItem('family_dashboard_events', JSON.stringify(newEventsState));
            return newEventsState;
        });

        // Delete from DB
        for (const evt of eventsToDelete) {
            if (!evt.id.startsWith('temp-') && !evt.id.startsWith('mock-')) {
                try {
                    await pb.collection('events').delete(evt.id);
                } catch (err) {
                    console.warn(`Could not delete event ${evt.id} from Pocketbase.`, err);
                }
            }
        }
    };

    const updateEvent = async (id, updatedData) => {
        const optimisticEvent = {
            ...updatedData,
            start: new Date(updatedData.start),
            end: new Date(updatedData.end)
        };

        setEvents(prev => {
            const next = prev.map(e => e.id === id ? { ...e, ...optimisticEvent } : e);
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        if (!id.startsWith('temp-') && !id.startsWith('mock-')) {
            try {
                await pb.collection('events').update(id, {
                    title: updatedData.title,
                    date: new Date(updatedData.start).toISOString(),
                    end: new Date(updatedData.end).toISOString(),
                    assignee: updatedData.assigned_to,
                    color: updatedData.color || ''
                });
            } catch (err) {
                console.warn("Could not update in Pocketbase.", err);
            }
        }
    };

    const addSubscription = async (url) => {
        try {
            await pb.collection('events').create({
                title: '[ICAL_SUBSCRIPTION]',
                color: url,
                date: new Date().toISOString(),
                end: new Date().toISOString()
            });
            await fetchEvents();
        } catch (err) {
            console.error("Failed to add subscription", err);
        }
    };

    const removeSubscription = async (id) => {
        try {
            await pb.collection('events').delete(id);
            await fetchEvents();
        } catch (err) {
            console.error("Failed to remove subscription", err);
        }
    };

    return { events, subscriptions, loading, addEvent, addEvents, deleteEvent, updateEvent, addSubscription, removeSubscription };
}

export const getEventMetadata = (event) => {
    if (!event.color) return null;
    try {
        return JSON.parse(event.color);
    } catch(e) {
        return null;
    }
};
