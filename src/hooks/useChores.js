import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

const dayMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

export function parsePBDate(dateStr) {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string' && dateStr.includes(' ')) {
        return new Date(dateStr.replace(' ', 'T'));
    }
    return new Date(dateStr);
}

export function getLocalYYYYMMDD(dateObjOrString) {
    const dateObj = (typeof dateObjOrString === 'string' || !dateObjOrString?.getFullYear) 
        ? parsePBDate(dateObjOrString) 
        : dateObjOrString;
    if (isNaN(dateObj.getFullYear())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getDaysLate(chore) {
    if (!chore.frequency || chore.frequency === 'daily' || !chore.due_dates) return 0;
    
    const now = new Date();
    
    if (chore.frequency === 'monthly') {
        let dates = [];
        if (Array.isArray(chore.due_dates)) dates = chore.due_dates.map(d => parseInt(String(d).trim(), 10));
        else if (typeof chore.due_dates === 'string') dates = chore.due_dates.split(',').map(d => parseInt(d.trim(), 10));
        dates = dates.filter(n => !isNaN(n));
        
        if (dates.length === 0) return 0;
        
        let minDiff = Infinity;
        for (let dueDay of dates) {
            let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
            if (now.getDate() < dueDay) {
                dueDate = new Date(now.getFullYear(), now.getMonth() - 1, dueDay);
            }
            const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < minDiff) minDiff = diffDays;
        }
        return minDiff === Infinity ? 0 : minDiff;
    }

    if (chore.frequency === 'weekly') {
        let daysArray = [];
        if (Array.isArray(chore.due_dates)) daysArray = chore.due_dates.map(d => String(d).trim());
        else if (typeof chore.due_dates === 'string') daysArray = chore.due_dates.split(',').map(d => d.trim());
        
        const days = daysArray.map(d => dayMap[d]).filter(d => d !== undefined);
        if (days.length === 0) return 0;
        
        const currentDayInt = now.getDay();
        let minDiff = Infinity;
        for (let dueDayInt of days) {
            let diff = currentDayInt - dueDayInt;
            if (diff < 0) diff += 7;
            if (diff < minDiff) minDiff = diff;
        }
        return minDiff === Infinity ? 0 : minDiff;
    }
    
    return 0;
}

export function isChoreOverdue(chore) {
    if (chore.is_completed) return false;
    if (!chore.frequency || chore.frequency === 'none') return false; 
    if (chore.frequency === 'daily') return false; // Daily chores are never shown as overdue in the UI
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const createdDate = parsePBDate(chore.created);
    
    if (chore.frequency === 'weekly' || chore.frequency === 'monthly') {
        const minDiff = getDaysLate(chore); 
        if (minDiff === 0) return false; // Due today
        
        const recentDue = new Date();
        recentDue.setHours(0,0,0,0);
        recentDue.setDate(recentDue.getDate() - minDiff);
        
        const dayAfterDue = new Date(recentDue);
        dayAfterDue.setDate(dayAfterDue.getDate() + 1);
        
        return createdDate < dayAfterDue;
    }
    
    return false;
}

export function shouldPenalize(chore) {
    if (chore.is_completed) return false;
    if (!chore.frequency || chore.frequency === 'none') return false; 
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const createdDate = parsePBDate(chore.created);
    
    if (chore.frequency === 'daily') {
        return createdDate < now; // If it was created before today and isn't completed, it missed yesterday
    }
    
    if (chore.frequency === 'weekly' || chore.frequency === 'monthly') {
        const minDiff = getDaysLate(chore); 
        if (minDiff === 0) return false; 
        
        const recentDue = new Date();
        recentDue.setHours(0,0,0,0);
        recentDue.setDate(recentDue.getDate() - minDiff);
        
        const dayAfterDue = new Date(recentDue);
        dayAfterDue.setDate(dayAfterDue.getDate() + 1);
        
        return createdDate < dayAfterDue;
    }
    
    return false;
}

export function isMultiDay(event) {
    if (event.title === '[ICAL_SUBSCRIPTION]') return false;
    try {
        if (event.color && event.color.startsWith('{')) {
            const meta = JSON.parse(event.color);
            if (meta.seriesId) return false;
        }
    } catch(e) {}

    const start = parsePBDate(event.start || event.date);
    const end = parsePBDate(event.end);
    if (!end || isNaN(end.getTime()) || !start || isNaN(start.getTime())) return false;
    
    const startStr = getLocalYYYYMMDD(start);
    const endStr = getLocalYYYYMMDD(end);
    return startStr !== endStr;
}

export function useChores(groupBy) {
    const [chores, setChores] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [rawEvents, setRawEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [todayHoliday, setTodayHoliday] = useState(null);
    const [birthdayProfiles, setBirthdayProfiles] = useState([]);
    const [fetchError, setFetchError] = useState(null);

    const fetchData = useCallback(async () => {
        setFetchError(null);
        try {
            const [rawChoreList, profileList, eventList] = await Promise.all([
                pb.collection('chores').getFullList({ sort: '-created' }),
                pb.collection('profiles').getFullList(),
                pb.collection('events').getFullList()
            ]);
            
            setRawEvents(eventList);

            const now = new Date();
            const todayStr = getLocalYYYYMMDD(now);
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // 0.5. Monthly XP Reset
            if (now.getDate() === 1) {
                const profilesToReset = profileList.filter(p => !p.is_parent && p.last_reset_month !== currentMonthStr);
                
                if (profilesToReset.length > 0) {
                    await Promise.all(profilesToReset.map(async (p) => {
                        await pb.collection('profiles').update(p.id, {
                            xp_balance: 0,
                            last_reset_month: currentMonthStr
                        });
                    }));
                    fetchData(); // Refetch cleanly
                    return;
                }
            }

            // 1. Reset Recurring Chores
            const choresToReset = rawChoreList.filter(c => {
                if (!c.is_completed || !c.frequency || c.frequency === 'none') return false;
                const updatedStr = getLocalYYYYMMDD(parsePBDate(c.updated));
                if (updatedStr === todayStr) return false; // Don't reset if just checked off today

                if (c.frequency === 'daily') return true;
                
                if (!c.due_dates) return false;

                if (c.frequency === 'monthly') {
                    let dates = [];
                    if (Array.isArray(c.due_dates)) dates = c.due_dates.map(d => parseInt(String(d).trim(), 10));
                    else if (typeof c.due_dates === 'string') dates = c.due_dates.split(',').map(d => parseInt(d.trim(), 10));
                    return dates.includes(now.getDate());
                }

                if (c.frequency === 'weekly') {
                    const todayName = Object.keys(dayMap).find(k => dayMap[k] === now.getDay());
                    let dueDays = [];
                    if (Array.isArray(c.due_dates)) dueDays = c.due_dates.map(d => String(d).trim());
                    else if (typeof c.due_dates === 'string') dueDays = c.due_dates.split(',').map(d => d.trim());
                    return dueDays.includes(todayName);
                }

                return false;
            });

            if (choresToReset.length > 0) {
                await Promise.all(choresToReset.map(async (c, index) => {
                    let updateData = { is_completed: false };
                    let pool = [];
                    if (Array.isArray(c.round_robin_pool) && c.round_robin_pool.length > 0) {
                        pool = c.round_robin_pool.map(val => {
                            const profile = profileList.find(p => p.id === val || p.name === val);
                            return profile ? profile.id : val;
                        }).filter(Boolean);
                    } else if (typeof c.round_robin_pool === 'string' && c.round_robin_pool.trim() !== '') {
                        pool = c.round_robin_pool.split(',').map(val => {
                            const profile = profileList.find(p => p.id === val.trim() || p.name === val.trim());
                            return profile ? profile.id : val.trim();
                        }).filter(Boolean);
                    }
                    
                    if (pool.length > 1) {
                        const currentAssignedId = Array.isArray(c.assigned_to) ? c.assigned_to[0] : c.assigned_to;
                        const currentIdx = pool.indexOf(currentAssignedId);
                        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % pool.length;
                        updateData.assigned_to = pool[nextIdx];
                    }

                    return pb.collection('chores').update(c.id, updateData);
                }));
                fetchData(); // Refetch cleanly
                return;
            }

            // 1.5. Process Overdue Penalties (-2 XP daily)
            const choresToPenalize = rawChoreList.filter(c => {
                if (!shouldPenalize(c)) return false;
                
                const updatedStr = getLocalYYYYMMDD(parsePBDate(c.updated));
                if (updatedStr === todayStr) return false; // Already penalized/touched today
                
                return true;
            });

            if (choresToPenalize.length > 0) {
                await Promise.all(choresToPenalize.map(async (c) => {
                    const assignedIds = Array.isArray(c.assigned_to) ? c.assigned_to : (c.assigned_to ? [c.assigned_to] : []);
                    const assignedProfiles = assignedIds.map(id => profileList.find(p => p.id === id || p.name === id)).filter(Boolean);
                    
                    const isStrict = c.chore_name && c.chore_name.includes('[STRICT]');
                    const penaltyAmount = isStrict ? 5 : 2;

                    if (isStrict) {
                        // Mark as completed so it disappears and resets naturally next week.
                        await pb.collection('chores').update(c.id, { is_completed: true });
                    } else {
                        // Toggle a trailing space to force PocketBase to update the timestamp
                        const currentName = c.chore_name || '';
                        const newName = currentName.endsWith(' ') ? currentName.trimEnd() : currentName + ' ';
                        await pb.collection('chores').update(c.id, { chore_name: newName });
                    }

                    for (const profile of assignedProfiles) {
                        // Fetch the latest profile to prevent race conditions during parallel updates
                        const latestProfile = await pb.collection('profiles').getOne(profile.id);
                        await pb.collection('profiles').update(profile.id, {
                            xp_balance: Math.max(0, (latestProfile.xp_balance || 0) - penaltyAmount)
                        });
                    }
                }));
                
                fetchData(); // Refetch cleanly
                return;
            }

            // 1.5. Assign unassigned chores
            const unassignedChores = rawChoreList.filter(c => !c.assigned_to || (Array.isArray(c.assigned_to) && c.assigned_to.length === 0));
            if (unassignedChores.length > 0) {
                await Promise.all(unassignedChores.map(async (c, index) => {
                    let pool = [];
                    if (Array.isArray(c.round_robin_pool) && c.round_robin_pool.length > 0) {
                        pool = c.round_robin_pool.map(val => {
                            const profile = profileList.find(p => p.id === val || p.name === val);
                            return profile ? profile.id : val;
                        }).filter(Boolean);
                    } else if (typeof c.round_robin_pool === 'string' && c.round_robin_pool.trim() !== '') {
                        pool = c.round_robin_pool.split(',').map(val => {
                            const profile = profileList.find(p => p.id === val.trim() || p.name === val.trim());
                            return profile ? profile.id : val.trim();
                        }).filter(Boolean);
                    } else {
                        pool = profileList.filter(p => !p.is_parent).map(p => p.id);
                    }
                    
                    if (pool.length > 0) {
                        const assignedName = pool[index % pool.length];
                        return pb.collection('chores').update(c.id, { assigned_to: assignedName });
                    }
                }));
                fetchData(); 
                return;
            }

            // 2. Filter Visibility
            const visibleChores = rawChoreList.filter(c => {
                if (!c.is_completed) return true; 
                const updatedStr = getLocalYYYYMMDD(parsePBDate(c.updated));
                if (updatedStr === todayStr) return true; 
                
                if (c.frequency === 'monthly' || c.frequency === 'weekly') return false;
                return true; 
            });

            setChores(visibleChores);
            setProfiles(profileList);

            // Fetch Holidays
            const year = new Date().getFullYear();
            try {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
                if (res.ok) {
                    const holidays = await res.json();
                    const holiday = holidays.find(h => h.date === todayStr);
                    setTodayHoliday(holiday ? holiday.name : null);
                }
            } catch (e) {
                console.error("Holiday API failed", e);
            }

            // Check Birthdays
            const todayMMDD = todayStr.substring(5); // "MM-DD"
            const bdays = profileList.filter(p => p.birthday === todayMMDD);
            setBirthdayProfiles(bdays.map(p => p.name));
        } catch (err) {
            if (!err.isAbort) {
                console.error("Fetch error:", err);
                setFetchError(err.message || String(err));
            }
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleChore = async (choreId, currentStatus, isCovered = false) => {
        const chore = chores.find(c => c.id === choreId);
        const assignedIds = Array.isArray(chore.assigned_to) ? chore.assigned_to : [chore.assigned_to];
        const assignedProfiles = assignedIds.map(id => profiles.find(p => p.name === id || p.id === id)).filter(Boolean);
        const newStatus = !currentStatus;

        try {
            // Optimistically update UI immediately
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: newStatus } : c));

            // 1. Always update the chore status first
            await pb.collection('chores').update(choreId, { is_completed: newStatus });

            // 2. Update XP if a profile exists and we are not covered
            if (assignedProfiles.length > 0 && !isCovered) {
                const baseXP = chore.xp_reward || 10;

                await Promise.all(assignedProfiles.map(async (profile) => {
                    // Fetch the latest profile to prevent race conditions from rapid toggling
                    const latestProfile = await pb.collection('profiles').getOne(profile.id);
                    const isOp = latestProfile.is_op || todayHoliday !== null; 
                    const earnedXP = isOp ? Math.floor(baseXP * 1.5) : baseXP;

                    const newBalance = newStatus 
                        ? (latestProfile.xp_balance || 0) + earnedXP 
                        : Math.max(0, (latestProfile.xp_balance || 0) - earnedXP);

                    return pb.collection('profiles').update(profile.id, {
                        xp_balance: newBalance,
                        is_op: newBalance >= 1000
                    });
                }));
            }

            console.log(`Success: ${chore.chore_name} toggled to ${newStatus}`);
        } catch (err) {
            // Revert optimistic update on failure
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: currentStatus } : c));
            console.error("Update failed:", err);
        }
    };

    const rotateAssignee = async (choreId) => {
        const chore = chores.find(c => c.id === choreId);
        if (!chore) return;
        
        let pool = [];
        if (Array.isArray(chore.round_robin_pool) && chore.round_robin_pool.length > 0) {
            pool = chore.round_robin_pool.map(val => {
                const profile = profiles.find(p => p.id === val || p.name === val);
                return profile ? profile.id : val;
            }).filter(Boolean);
        } else if (typeof chore.round_robin_pool === 'string' && chore.round_robin_pool.trim() !== '') {
            pool = chore.round_robin_pool.split(',').map(val => {
                const profile = profiles.find(p => p.id === val.trim() || p.name === val.trim());
                return profile ? profile.id : val.trim();
            }).filter(Boolean);
        }
        
        if (pool.length > 1) {
            const currentAssignedId = Array.isArray(chore.assigned_to) ? chore.assigned_to[0] : chore.assigned_to;
            const currentIdx = pool.indexOf(currentAssignedId);
            const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % pool.length;
            const nextAssigneeId = pool[nextIdx];
            
            try {
                await pb.collection('chores').update(choreId, { assigned_to: nextAssigneeId });
                fetchData(); // reload correctly to compute projections
            } catch (err) {
                console.error("Rotate failed:", err);
            }
        }
    };

    useEffect(() => {
        fetchData();
        // Realtime subscriptions (works now that we're on Fly.io, not Ngrok)
        pb.collection('chores').subscribe('*', fetchData);
        pb.collection('profiles').subscribe('*', fetchData);
        return () => {
            pb.collection('chores').unsubscribe();
            pb.collection('profiles').unsubscribe();
        };
    }, [fetchData]);

    // (Keep your groupedChores and sortedGroupEntries logic here)
    const expandedChores = chores.flatMap(c => {
        let resolvedName;
        if (Array.isArray(c.assigned_to)) {
            resolvedName = c.assigned_to.map(id => {
                const p = profiles.find(p => p.id === id || p.name === id);
                return p ? p.name : id;
            }).join(', ');
        } else {
            const p = profiles.find(p => p.id === c.assigned_to || p.name === c.assigned_to);
            resolvedName = p ? p.name : c.assigned_to;
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIdx = new Date().getDay();

        if (c.frequency === 'daily' || c.frequency === 'weekly') {
            let pool = [];
            if (Array.isArray(c.round_robin_pool) && c.round_robin_pool.length > 0) {
                pool = c.round_robin_pool.map(val => {
                    const p = profiles.find(p => p.id === val || p.name === val);
                    return p ? p.name : val;
                }).filter(Boolean);
            } else if (typeof c.round_robin_pool === 'string' && c.round_robin_pool.trim() !== '') {
                pool = c.round_robin_pool.split(',').map(val => {
                    const p = profiles.find(p => p.id === val.trim() || p.name === val.trim());
                    return p ? p.name : val.trim();
                }).filter(Boolean);
            }

            const firstAssigned = Array.isArray(c.assigned_to) ? c.assigned_to[0] : c.assigned_to;
            const firstAssignedP = profiles.find(p => p.id === firstAssigned || p.name === firstAssigned);
            const firstAssignedName = firstAssignedP ? firstAssignedP.name : firstAssigned;
            const currentIdx = pool.indexOf(firstAssignedName) === -1 ? 0 : pool.indexOf(firstAssignedName);
            const projected = [];
            let dueDays = [];

            if (c.frequency === 'weekly') {
                if (Array.isArray(c.due_dates)) dueDays = c.due_dates.map(d => String(d).trim());
                else if (typeof c.due_dates === 'string') dueDays = c.due_dates.split(',').map(d => d.trim());
            }

            let assignmentCounter = 0;
            const overdue = isChoreOverdue(c);
            
            const parents = profiles.filter(p => p.is_parent);
            const parentName = parents.length > 0 ? parents[0].name : 'Mom/Dad';

            for (let i = 0; i < 7; i++) {
                const targetDayIdx = (todayIdx + i) % 7;
                const targetDayName = days[targetDayIdx];
                
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + i);
                targetDate.setHours(0,0,0,0);
                
                if (c.frequency === 'weekly' && !dueDays.includes(targetDayName)) {
                    // Force overdue tasks to appear Today so they can be completed
                    if (overdue && i === 0) {
                        // let it pass
                    } else {
                        continue;
                    }
                }

                const projectedName = pool.length > 0 
                    ? pool[(currentIdx + assignmentCounter) % pool.length] 
                    : resolvedName;
                
                let finalAssignee = pool.length > 0 ? projectedName : resolvedName;
                
                // Multi-day Event Overrides
                let assigneesList = finalAssignee.split(',').map(s => s.trim());
                let newAssigneesList = [...assigneesList];
                let isCovered = false;

                for (let aIdx = 0; aIdx < assigneesList.length; aIdx++) {
                    const person = assigneesList[aIdx];
                    
                    const isBusy = rawEvents.some(e => {
                        if (isMultiDay(e)) {
                            const eStart = parsePBDate(e.start || e.date);
                            eStart.setHours(0,0,0,0);
                            const eEnd = parsePBDate(e.end);
                            if (eEnd.getHours() === 0 && eEnd.getMinutes() === 0) {
                                eEnd.setDate(eEnd.getDate() - 1);
                            }
                            eEnd.setHours(23,59,59,999);
                            
                            const eventAssigneeStr = e.assignee || e.assigned_to || '';
                            const eAssignees = Array.isArray(eventAssigneeStr) ? eventAssigneeStr : eventAssigneeStr.split(',').map(s=>s.trim());
                            if (!eAssignees.includes(person) && !eAssignees.includes('Everyone')) return false;

                            return targetDate >= eStart && targetDate <= eEnd;
                        }
                        return false;
                    });

                    if (isBusy && !parents.some(p => p.name === person) && !c.cannot_cover) {
                        newAssigneesList[aIdx] = `${person} (Covered by Parents)`;
                        isCovered = true;
                    }
                }

                if (isCovered) {
                    finalAssignee = newAssigneesList.join(', ');
                }

                const displayDay = i === 0 ? `Today (${targetDayName})` : targetDayName;

                projected.push({
                    ...c,
                    id: i === 0 ? c.id : `${c.id}_future_${i}`,
                    assigned_to: finalAssignee,
                    day_due: displayDay,
                    is_completed: i === 0 ? c.is_completed : false,
                    is_future: i > 0,
                    sort_order: i
                });

                assignmentCounter++;
            }
            
            if (projected.length > 0) return projected;
        }

        let day_due = 'Uncategorized';
        if (c.frequency === 'monthly') day_due = 'Monthly';
        else if (c.frequency === 'none' || !c.frequency) day_due = 'One-off Tasks';

        return [{
            ...c,
            assigned_to: resolvedName,
            day_due: day_due,
            sort_order: 99
        }];
    });

    const groupedChores = expandedChores.reduce((acc, chore) => {
        const key = chore[groupBy] || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(chore);
        return acc;
    }, {});

    const sortedGroupEntries = Object.entries(groupedChores).sort((a, b) => {
        const orderA = a[1][0]?.sort_order ?? 99;
        const orderB = b[1][0]?.sort_order ?? 99;
        return orderA - orderB;
    });

    return { chores, profiles, sortedGroupEntries, loading, toggleChore, rotateAssignee, todayHoliday, birthdayProfiles, fetchError };
}