import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

// Generate some mock events based on the current date so they always show up
const getMockEvents = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return [
        {
            id: 'mock-1',
            title: '⚽ Soccer Practice (Leo)',
            start: new Date(currentYear, currentMonth, today.getDate() + 1, 16, 0),
            end: new Date(currentYear, currentMonth, today.getDate() + 1, 17, 30),
            type: 'activity',
            assigned_to: 'Leo'
        },
        {
            id: 'mock-2',
            title: '🦷 Dentist Appointment (Sam)',
            start: new Date(currentYear, currentMonth, today.getDate() + 3, 10, 0),
            end: new Date(currentYear, currentMonth, today.getDate() + 3, 11, 0),
            type: 'appointment',
            assigned_to: 'Sam'
        },
        {
            id: 'mock-3',
            title: '🍕 Family Pizza Night',
            start: new Date(currentYear, currentMonth, today.getDate() + 5, 18, 0),
            end: new Date(currentYear, currentMonth, today.getDate() + 5, 20, 0),
            type: 'family',
            assigned_to: 'Everyone'
        },
        {
            id: 'mock-4',
            title: '🎸 Guitar Lesson (Sam)',
            start: new Date(currentYear, currentMonth, today.getDate() - 2, 15, 30),
            end: new Date(currentYear, currentMonth, today.getDate() - 2, 16, 30),
            type: 'activity',
            assigned_to: 'Sam'
        }
    ];
};

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
            return getMockEvents();
        }
    }
    return getMockEvents();
};

export function useCalendar() {
    const [events, setEvents] = useState(loadLocalEvents());
    const [loading, setLoading] = useState(false); // Data is loaded synchronously locally

    const fetchEvents = useCallback(async () => {
        try {
            // Fetch from PocketBase via Ngrok
            const records = await pb.collection('events').getFullList({ sort: 'start' });
            
            // Format dates for react-big-calendar
            const formattedRecords = records.map(record => ({
                ...record,
                start: new Date(record.start),
                end: new Date(record.end)
            }));
            
            setEvents(formattedRecords);
            // Sync the real data back to local storage
            localStorage.setItem('family_dashboard_events', JSON.stringify(formattedRecords));
        } catch (err) {
            console.warn("Could not fetch events from Pocketbase. Falling back to local data.", err);
            // We already loaded local data on mount, so no need to do anything here
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        
        // Setup realtime subscription if collection exists
        try {
            pb.collection('events').subscribe('*', fetchEvents);
        } catch (err) {
            // Ignore if collection doesn't exist
        }

        return () => {
            try {
                pb.collection('events').unsubscribe();
            } catch (err) {
                // Ignore
            }
        };
    }, [fetchEvents]);

    const addEvent = async (newEvent) => {
        const eventWithId = { ...newEvent, id: `temp-${Date.now()}` };
        
        // Optimistically update local state and save to localStorage as fallback
        setEvents(prev => {
            const next = [...prev, eventWithId];
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        try {
            // Try saving to pocketbase
            const record = await pb.collection('events').create({
                title: newEvent.title,
                start: newEvent.start.toISOString(),
                end: newEvent.end.toISOString(),
                assigned_to: newEvent.assigned_to,
                type: 'activity'
            });
            
            // Replace optimistic event with real one
            setEvents(prev => prev.map(e => e.id === eventWithId.id ? {
                ...record,
                start: new Date(record.start),
                end: new Date(record.end)
            } : e));
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
