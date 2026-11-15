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

// Cache for holidays to avoid repeated API calls
let cachedHolidays = null;
let lastHolidayFetchYear = null;

async function getHolidays() {
    const currentYear = new Date().getFullYear();
    if (cachedHolidays && lastHolidayFetchYear === currentYear) {
        return cachedHolidays;
    }
    try {
        const years = [currentYear - 1, currentYear, currentYear + 1];
        const results = await Promise.all(
            years.map(y => 
                fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/US`)
                    .then(res => res.ok ? res.json() : [])
                    .catch(() => [])
            )
        );
        const combined = results.flat();
        cachedHolidays = combined.map(h => {
            const [year, month, day] = h.date.split('-').map(Number);
            const start = new Date(year, month - 1, day, 0, 0, 0);
            const end = new Date(year, month - 1, day, 23, 59, 59);
            return {
                id: `holiday-${h.date}-${encodeURIComponent(h.name)}`,
                title: `🎉 ${h.name}`,
                start,
                end,
                assigned_to: 'Holiday',
                isHoliday: true,
                allDay: true,
                readonly: true,
                color: '#f59e0b'
            };
        });
        lastHolidayFetchYear = currentYear;
        return cachedHolidays;
    } catch (err) {
        console.warn('Could not fetch holidays:', err);
        return [];
    }
}

async function getBirthdays() {
    try {
        const profiles = await pb.collection('profiles').getFullList({ requestKey: null });
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear, currentYear + 1];
        const birthdayEvents = [];

        profiles.forEach(p => {
            if (!p.birthday || !p.birthday.includes('-')) return;
            const clean = p.birthday.trim().split('T')[0].split(' ')[0];
            const parts = clean.split('-').map(Number);
            let month, day;
            if (parts.length === 3) {
                [, month, day] = parts;
            } else if (parts.length === 2) {
                [month, day] = parts;
            }
            if (!month || !day) return;

            years.forEach(y => {
                const start = new Date(y, month - 1, day, 0, 0, 0);
                const end = new Date(y, month - 1, day, 23, 59, 59);
                birthdayEvents.push({
                    id: `birthday-${p.id}-${y}`,
                    title: `🎂 ${p.name}'s Birthday!`,
                    start,
                    end,
                    assigned_to: p.name,
                    isBirthday: true,
                    allDay: true,
                    readonly: true,
                    color: '#ec4899'
                });
            });
        });
        return birthdayEvents;
    } catch (err) {
        console.warn('Could not fetch profile birthdays:', err);
        return [];
    }
}

export function normalizeCalendarUrl(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return '';
    let str = rawInput.trim();
    if (!str) return '';

    // 1. If user pasted an <iframe> embed code, extract the src attribute
    if (str.includes('<iframe') && str.includes('src=')) {
        const match = str.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) {
            str = match[1].replace(/&amp;/g, '&').trim();
        }
    }

    // 2. Convert webcal:// or webcals:// to https://
    str = str.replace(/^webcals?:\/\//i, 'https://');

    // 3. If user pasted a raw Google Calendar ID (e.g. xxx@group.calendar.google.com or email)
    if (!str.includes('://') && !str.startsWith('/') && str.includes('@') && !str.includes(' ')) {
        return `https://calendar.google.com/calendar/ical/${encodeURIComponent(str)}/public/basic.ics`;
    }

    // 4. Parse Google Calendar web/share/embed links and convert to .ics feed URL
    try {
        const url = new URL(str);
        if (url.hostname.includes('calendar.google.com')) {
            // Case A: https://calendar.google.com/calendar/embed?src=...
            const srcParam = url.searchParams.get('src');
            if (srcParam) {
                return `https://calendar.google.com/calendar/ical/${encodeURIComponent(srcParam.trim())}/public/basic.ics`;
            }

            // Case B: https://calendar.google.com/calendar/u/0?cid=... or /calendar/render?cid=...
            const cidParam = url.searchParams.get('cid');
            if (cidParam) {
                let calId = cidParam.trim();
                if (!calId.includes('@')) {
                    try {
                        const base64 = calId.replace(/-/g, '+').replace(/_/g, '/');
                        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
                        const decoded = atob(padded).trim();
                        if (decoded && (decoded.includes('@') || /^[\x20-\x7E]+$/.test(decoded))) {
                            calId = decoded;
                        }
                    } catch (e) {
                        // keep original cidParam if not base64
                    }
                }
                return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/basic.ics`;
            }
        }
    } catch (e) {
        // Not a valid URL yet
    }

    return str;
}

async function fetchAndParseIcalFeed(rawUrl, subId, assignee) {
    const normalizedUrl = normalizeCalendarUrl(rawUrl);
    if (!normalizedUrl) {
        return { ok: false, status: 'error', error: 'Empty calendar URL.', events: [], normalizedUrl };
    }

    let text = '';
    let lastStatus = null;

    try {
        const directRes = await fetch(normalizedUrl);
        if (directRes.ok) {
            text = await directRes.text();
        } else {
            lastStatus = directRes.status;
            throw new Error('Direct fetch failed');
        }
    } catch (e) {
        try {
            const proxyUrl = `/api/ical?url=${encodeURIComponent(normalizedUrl)}`;
            const res = await fetch(proxyUrl);
            lastStatus = res.status;
            if (!res.ok) {
                if (res.status === 404 && normalizedUrl.includes('calendar.google.com') && normalizedUrl.includes('/public/')) {
                    return {
                        ok: false,
                        status: 'error',
                        error: "This Google Calendar is private (404). Either enable 'Make available to public' in Google Calendar settings, or paste the 'Secret address in iCal format' (.../private-xxx/basic.ics) from Settings → Integrate calendar.",
                        events: [],
                        normalizedUrl
                    };
                }
                return {
                    ok: false,
                    status: 'error',
                    error: `Failed to download feed (HTTP ${res.status}). Verify the URL is a valid public or secret iCal (.ics) address.`,
                    events: [],
                    normalizedUrl
                };
            }
            text = await res.text();
        } catch (proxyErr) {
            return {
                ok: false,
                status: 'error',
                error: `Network error fetching calendar feed${lastStatus ? ` (HTTP ${lastStatus})` : ''}.`,
                events: [],
                normalizedUrl
            };
        }
    }

    if (!text || !text.includes('BEGIN:VCALENDAR')) {
        return {
            ok: false,
            status: 'error',
            error: "Link returned a webpage instead of an iCal (.ics) feed. In Google Calendar Settings → Integrate calendar, copy the 'Public address in iCal format' or 'Secret address in iCal format'.",
            events: [],
            normalizedUrl
        };
    }

    try {
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const calendarName = comp.getFirstPropertyValue('x-wr-calname') || '';
        const vevents = comp.getAllSubcomponents('vevent');

        const now = new Date();
        const minDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // 1 year ago
        const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), 1); // 1 year ahead
        const subEvents = [];

        vevents.forEach(vevent => {
            const event = new ICAL.Event(vevent);
            if (!event.startDate) return;

            const duration = event.endDate ? event.endDate.toUnixTime() - event.startDate.toUnixTime() : 3600;

            if (event.isRecurring()) {
                try {
                    const iter = event.iterator();
                    let next;
                    let limit = 0;
                    while ((next = iter.next()) && limit < 2000) {
                        const jsDate = next.toJSDate();
                        if (jsDate > maxDate) break;
                        if (jsDate >= minDate) {
                            const nextEnd = new Date(jsDate.getTime() + duration * 1000);
                            subEvents.push({
                                id: `ical-${subId}-${event.uid}-${limit}`,
                                title: event.summary,
                                start: jsDate,
                                end: nextEnd,
                                assigned_to: assignee || 'Everyone',
                                color: '#64748b',
                                isExternal: true,
                                readonly: true
                            });
                        }
                        limit++;
                    }
                } catch (e) {
                    console.warn("Recurrence error", e);
                }
            } else {
                const jsDate = event.startDate.toJSDate();
                if (jsDate >= minDate && jsDate <= maxDate) {
                    subEvents.push({
                        id: `ical-${subId}-${event.uid}`,
                        title: event.summary,
                        start: jsDate,
                        end: event.endDate ? event.endDate.toJSDate() : new Date(jsDate.getTime() + duration * 1000),
                        assigned_to: assignee || 'Everyone',
                        color: '#64748b',
                        isExternal: true,
                        readonly: true
                    });
                }
            }
        });

        return {
            ok: true,
            status: 'ok',
            calendarName,
            eventCount: subEvents.length,
            totalVevents: vevents.length,
            events: subEvents,
            normalizedUrl
        };
    } catch (err) {
        console.warn('Failed to parse ical feed', rawUrl, err);
        return {
            ok: false,
            status: 'error',
            error: `Could not parse iCal (.ics) data: ${err.message}`,
            events: [],
            normalizedUrl
        };
    }
}

const isSystemOrExternal = (id) => {
    if (typeof id !== 'string') return false;
    return id.startsWith('temp-') || 
           id.startsWith('mock-') || 
           id.startsWith('holiday-') || 
           id.startsWith('birthday-') || 
           id.startsWith('ical-');
};

export function useCalendar() {
    const [events, setEvents] = useState(loadLocalEvents());
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const records = await pb.collection('events').getFullList({ sort: 'date', requestKey: null });
            
            const subRecords = records.filter(r => r.title === '[ICAL_SUBSCRIPTION]');
            const overrideRecord = records.find(r => r.title === '[ICAL_OVERRIDES]');
            const normalRecords = records.filter(r => r.title !== '[ICAL_SUBSCRIPTION]' && r.title !== '[ICAL_OVERRIDES]');

            let icalOverrides = {};
            if (overrideRecord && overrideRecord.color) {
                try {
                    icalOverrides = JSON.parse(overrideRecord.color);
                } catch (e) {
                    icalOverrides = {};
                }
            }

            setSubscriptions(subRecords.map(r => ({
                id: r.id,
                url: r.color,
                assignee: r.assignee,
                status: 'loading'
            })));

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
            const updatedSubMeta = [];
            for (const sub of subRecords) {
                const feedRes = await fetchAndParseIcalFeed(sub.color, sub.id, sub.assignee);
                if (feedRes.ok) {
                    const eventsWithOverrides = feedRes.events.map(evt => {
                        if (icalOverrides[evt.id]) {
                            return { ...evt, assigned_to: icalOverrides[evt.id] };
                        }
                        return evt;
                    });
                    subEvents.push(...eventsWithOverrides);
                }
                updatedSubMeta.push({
                    id: sub.id,
                    url: sub.color,
                    normalizedUrl: feedRes.normalizedUrl,
                    assignee: sub.assignee,
                    status: feedRes.status,
                    error: feedRes.error || null,
                    calendarName: feedRes.calendarName || '',
                    eventCount: feedRes.eventCount || 0
                });
            }
            setSubscriptions(updatedSubMeta);

            // Fetch Holidays & Birthdays
            const [holidayEvents, birthdayEvents] = await Promise.all([
                getHolidays(),
                getBirthdays()
            ]);

            const allEvents = [...formattedRecords, ...subEvents, ...holidayEvents, ...birthdayEvents];
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
        const handleProfilesUpdated = () => fetchEvents();
        window.addEventListener('profiles-updated', handleProfilesUpdated);
        return () => {
            pb.collection('events').unsubscribe();
            window.removeEventListener('profiles-updated', handleProfilesUpdated);
        };
    }, [fetchEvents]);

    const toIsoString = (val, fallback) => {
        if (!val) return fallback ? toIsoString(fallback) : new Date().toISOString();
        if (val instanceof Date) {
            return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };

    const addEvent = async (newEvent) => {
        const startIso = toIsoString(newEvent.start || newEvent.date);
        const endIso = toIsoString(newEvent.end, newEvent.start || newEvent.date);
        const assigneeVal = Array.isArray(newEvent.assigned_to)
            ? newEvent.assigned_to.join(', ')
            : (newEvent.assigned_to || newEvent.assignee || 'Everyone');
        const colorVal = newEvent.color || (newEvent.description ? newEvent.description : '');

        const eventWithId = { 
            ...newEvent, 
            id: `temp-${Date.now()}`,
            start: new Date(startIso),
            end: new Date(endIso),
            assigned_to: assigneeVal
        };
        
        setEvents(prev => {
            const next = [...prev, eventWithId];
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        try {
            await pb.collection('events').create({
                title: newEvent.title,
                date: startIso,
                end: endIso,
                assignee: assigneeVal,
                color: colorVal,
            });
            await fetchEvents();
        } catch (err) {
            console.error("Could not save to Pocketbase:", err);
        }
    };

    const addEvents = async (newEventsArray) => {
        const eventsWithIds = newEventsArray.map((evt, idx) => {
            const sIso = toIsoString(evt.start || evt.date);
            const eIso = toIsoString(evt.end, evt.start || evt.date);
            const aVal = Array.isArray(evt.assigned_to) ? evt.assigned_to.join(', ') : (evt.assigned_to || evt.assignee || 'Everyone');
            return {
                ...evt,
                id: `temp-${Date.now()}-${idx}`,
                start: new Date(sIso),
                end: new Date(eIso),
                assigned_to: aVal
            };
        });

        setEvents(prev => {
            const next = [...prev, ...eventsWithIds];
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        try {
            // Write in smaller batches of 5 to avoid SQLite busy locks on Fly.io
            for (let i = 0; i < newEventsArray.length; i += 5) {
                const chunk = newEventsArray.slice(i, i + 5);
                await Promise.all(chunk.map(newEvent => {
                    const startIso = toIsoString(newEvent.start || newEvent.date);
                    const endIso = toIsoString(newEvent.end, newEvent.start || newEvent.date);
                    const assigneeVal = Array.isArray(newEvent.assigned_to)
                        ? newEvent.assigned_to.join(', ')
                        : (newEvent.assigned_to || newEvent.assignee || 'Everyone');
                    const colorVal = newEvent.color || (newEvent.description ? newEvent.description : '');

                    return pb.collection('events').create({
                        title: newEvent.title,
                        date: startIso,
                        end: endIso,
                        assignee: assigneeVal,
                        color: colorVal,
                    }, { requestKey: null });
                }));
            }
            await fetchEvents();
        } catch (err) {
            console.error("Could not save bulk events to Pocketbase:", err);
        }
    };

    const deleteEvent = async (id, isSeries = false) => {
        let targetSeriesId = null;
        if (isSeries) {
            const eventToDelete = events.find(e => e.id === id);
            if (eventToDelete && eventToDelete.color) {
                try {
                    const meta = JSON.parse(eventToDelete.color);
                    if (meta.seriesId) {
                        targetSeriesId = meta.seriesId;
                    }
                } catch (err) {}
            }
        }

        const matchesDeleteTarget = (evt) => {
            if (targetSeriesId) {
                try {
                    const m = JSON.parse(evt.color || '{}');
                    return m.seriesId === targetSeriesId;
                } catch (err) {
                    return evt.id === id;
                }
            }
            return evt.id === id;
        };

        const eventsToDelete = events.filter(matchesDeleteTarget);
        const idsToDelete = new Set(eventsToDelete.map(e => e.id));
        if (idsToDelete.size === 0 && id) {
            idsToDelete.add(id);
        }

        setEvents(prev => {
            const newEventsState = prev.filter(e => !matchesDeleteTarget(e) && !idsToDelete.has(e.id));
            localStorage.setItem('family_dashboard_events', JSON.stringify(newEventsState));
            return newEventsState;
        });

        // Delete from DB in small batches to avoid SQLite locking or request cancellation
        const dbIds = Array.from(idsToDelete).filter(evtId => !isSystemOrExternal(evtId));
        const chunkSize = 5;
        for (let i = 0; i < dbIds.length; i += chunkSize) {
            const chunk = dbIds.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (evtId) => {
                try {
                    await pb.collection('events').delete(evtId, { requestKey: null });
                } catch (err) {
                    console.warn(`Could not delete event ${evtId} from Pocketbase.`, err);
                }
            }));
        }
        await fetchEvents();
    };

    const updateEvent = async (id, updatedData) => {
        const startIso = toIsoString(updatedData.start || updatedData.date);
        const endIso = toIsoString(updatedData.end, updatedData.start || updatedData.date);
        const assigneeVal = Array.isArray(updatedData.assigned_to)
            ? updatedData.assigned_to.join(', ')
            : (updatedData.assigned_to || updatedData.assignee || 'Everyone');
        const colorVal = updatedData.color !== undefined ? updatedData.color : (updatedData.description || '');

        const optimisticEvent = {
            ...updatedData,
            start: new Date(startIso),
            end: new Date(endIso),
            assigned_to: assigneeVal
        };

        setEvents(prev => {
            const next = prev.map(e => e.id === id ? { ...e, ...optimisticEvent } : e);
            localStorage.setItem('family_dashboard_events', JSON.stringify(next));
            return next;
        });

        if (!isSystemOrExternal(id)) {
            try {
                await pb.collection('events').update(id, {
                    title: updatedData.title,
                    date: startIso,
                    end: endIso,
                    assignee: assigneeVal,
                    color: colorVal
                });
                await fetchEvents();
            } catch (err) {
                console.error("Could not update in Pocketbase:", err);
            }
        } else if (typeof id === 'string' && id.startsWith('ical-')) {
            try {
                const records = await pb.collection('events').getFullList({ filter: 'title = "[ICAL_OVERRIDES]"', requestKey: null });
                const existing = records[0];
                let overrides = {};
                if (existing && existing.color) {
                    try {
                        overrides = JSON.parse(existing.color);
                    } catch (e) {
                        overrides = {};
                    }
                }
                overrides[id] = assigneeVal;
                if (existing) {
                    await pb.collection('events').update(existing.id, {
                        color: JSON.stringify(overrides)
                    });
                } else {
                    await pb.collection('events').create({
                        title: '[ICAL_OVERRIDES]',
                        color: JSON.stringify(overrides),
                        assignee: 'System',
                        date: new Date().toISOString(),
                        end: new Date().toISOString()
                    });
                }
                await fetchEvents();
            } catch (err) {
                console.error("Could not save iCal participant override in Pocketbase:", err);
            }
        }
    };

    const updateSubscription = async (id, assignee = 'Everyone') => {
        try {
            await pb.collection('events').update(id, {
                assignee: assignee
            });
            await fetchEvents();
        } catch (err) {
            console.error("Failed to update subscription assignee", err);
        }
    };

    const addSubscription = async (url, assignee = 'Everyone') => {
        const normalizedUrl = normalizeCalendarUrl(url);
        const validation = await fetchAndParseIcalFeed(normalizedUrl, 'verify', assignee);
        if (!validation.ok) {
            return {
                ok: false,
                error: validation.error,
                normalizedUrl
            };
        }

        try {
            await pb.collection('events').create({
                title: '[ICAL_SUBSCRIPTION]',
                color: normalizedUrl,
                assignee: assignee,
                date: new Date().toISOString(),
                end: new Date().toISOString()
            });
            await fetchEvents();
            return {
                ok: true,
                calendarName: validation.calendarName,
                eventCount: validation.eventCount,
                normalizedUrl
            };
        } catch (err) {
            console.error("Failed to add subscription", err);
            return {
                ok: false,
                error: `Database error saving subscription: ${err.message || String(err)}`,
                normalizedUrl
            };
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

    return { events, subscriptions, loading, addEvent, addEvents, deleteEvent, updateEvent, addSubscription, updateSubscription, removeSubscription };
}

export const getEventMetadata = (event) => {
    if (!event.color) return null;
    try {
        return JSON.parse(event.color);
    } catch(e) {
        return null;
    }
};
