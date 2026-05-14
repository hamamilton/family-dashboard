import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

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
    const [loading, setLoading] = useState(false); // Data is loaded synchronously locally

    const fetchEvents = useCallback(async () => {
        try {
            const records = await pb.collection('events').getFullList({ sort: 'date' });
            
            const formattedRecords = records.map(record => {
                // Support both 'date' field (what we create) and legacy 'start'/'end' fields
                const startDate = new Date(record.date || record.start);
                const endDate = record.end 
                    ? new Date(record.end) 
                    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default: 1hr duration

                return {
                    ...record,
                    // Map 'assignee' field back to 'assigned_to' for the EventComponent
                    assigned_to: record.assignee || record.assigned_to || 'Everyone',
                    start: startDate,
                    end: endDate,
                };
            }).filter(e => !isNaN(e.start.getTime())); // Remove any records with invalid dates
            
            console.log(`Fetched ${formattedRecords.length} calendar events from PocketBase`);
            setEvents(formattedRecords);
            localStorage.setItem('family_dashboard_events', JSON.stringify(formattedRecords));
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
                assignee: newEvent.assigned_to,
                color: newEvent.color || '',
            });
            // Refetch to get real record with server ID
            await fetchEvents();
        } catch (err) {
            console.warn("Could not save to Pocketbase. Event exists only locally.", err);
        }
    };

    const deleteEvent = async (id) => {
        setEvents(prev => {
            const next = prev.filter(e => e.id !== id);
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        if (!id.startsWith('temp-') && !id.startsWith('mock-')) {
            try {
                await pb.collection('events').delete(id);
            } catch (err) {
                console.warn("Could not delete from Pocketbase.", err);
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
                    ...updatedData,
                    start: new Date(updatedData.start).toISOString(),
                    end: new Date(updatedData.end).toISOString()
                });
            } catch (err) {
                console.warn("Could not update in Pocketbase.", err);
            }
        }
    };

    return { events, loading, addEvent, deleteEvent, updateEvent };
}
