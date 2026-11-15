import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

const dayMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

export function getAssignedArray(assigned_to) {
    if (Array.isArray(assigned_to)) return assigned_to;
    if (typeof assigned_to === 'string') return assigned_to.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

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

export function getDaysBetween(dateStrA, dateStrB) {
    if (!dateStrA || !dateStrB) return 0;
    const partsA = dateStrA.split('-').map(Number);
    const partsB = dateStrB.split('-').map(Number);
    if (partsA.length !== 3 || partsB.length !== 3) return 0;
    const dateA = new Date(partsA[0], partsA[1] - 1, partsA[2]);
    const dateB = new Date(partsB[0], partsB[1] - 1, partsB[2]);
    return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPoolArray(round_robin_pool, profileList = []) {
    let raw = [];
    if (Array.isArray(round_robin_pool)) {
        raw = round_robin_pool;
    } else if (typeof round_robin_pool === 'string' && round_robin_pool.trim() !== '') {
        raw = round_robin_pool.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (profileList.length === 0) return raw;
    return raw.map(val => {
        const profile = profileList.find(p => p.id === val || p.name === val);
        return profile ? profile.id : val;
    }).filter(Boolean);
}

export function getNextAssignee(currentAssignee, pool) {
    if (!pool || pool.length === 0) return currentAssignee;
    if (pool.length === 1) return pool[0];
    const currentId = getAssignedArray(currentAssignee)[0] || currentAssignee;
    const currentIdx = pool.indexOf(currentId);
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % pool.length;
    return pool[nextIdx];
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
    if (chore.is_completed || chore.is_skipped) return false;
    if (chore.frequency === 'daily') return false; // Daily chores are never shown as overdue in the UI
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const createdDate = parsePBDate(chore.created);
    
    if (!chore.frequency || chore.frequency === 'none') {
        const dateStr = chore.one_off_date || (Array.isArray(chore.due_dates) && chore.due_dates[0]);
        if (dateStr) {
            const parts = dateStr.split('-');
            let due;
            if (parts.length === 3) {
                due = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                due = parsePBDate(dateStr);
            }
            due.setHours(0,0,0,0);
            return now.getTime() > due.getTime();
        }
        return false;
    }

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
    if (chore.is_completed || chore.is_skipped) return false;
    
    const now = new Date();
    now.setHours(0,0,0,0);
    // Use updated date so recurring chores that are reset don't get permanently stuck triggering penalties
    const lastTouchedDate = parsePBDate(chore.updated);
    
    if (!chore.frequency || chore.frequency === 'none') {
        const dateStr = chore.one_off_date || (Array.isArray(chore.due_dates) && chore.due_dates[0]);
        if (dateStr) {
            const parts = dateStr.split('-');
            let due;
            if (parts.length === 3) {
                due = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                due = parsePBDate(dateStr);
            }
            due.setHours(0,0,0,0);
            return now.getTime() > due.getTime();
        }
        return false;
    }

    if (chore.frequency === 'daily') {
        return lastTouchedDate < now; 
    }
    
    if (chore.frequency === 'weekly' || chore.frequency === 'monthly') {
        let minDiff = getDaysLate(chore); 
        
        if (minDiff === 0) {
            if (chore.frequency === 'weekly') {
                let daysArray = [];
                if (Array.isArray(chore.due_dates)) daysArray = chore.due_dates.map(d => String(d).trim());
                else if (typeof chore.due_dates === 'string') daysArray = chore.due_dates.split(',').map(d => d.trim());
                
                const days = daysArray.map(d => dayMap[d]).filter(d => d !== undefined);
                if (days.length > 0) {
                    const currentDayInt = now.getDay();
                    let prevDiff = Infinity;
                    for (let dueDayInt of days) {
                        let diff = currentDayInt - dueDayInt;
                        if (diff <= 0) diff += 7;
                        if (diff < prevDiff) prevDiff = diff;
                    }
                    if (prevDiff !== Infinity) minDiff = prevDiff;
                }
            } else if (chore.frequency === 'monthly') {
                let dates = [];
                if (Array.isArray(chore.due_dates)) dates = chore.due_dates.map(d => parseInt(String(d).trim(), 10));
                else if (typeof chore.due_dates === 'string') dates = chore.due_dates.split(',').map(d => parseInt(d.trim(), 10));
                dates = dates.filter(n => !isNaN(n));
                
                if (dates.length > 0) {
                    let prevDiff = Infinity;
                    for (let dueDay of dates) {
                        let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
                        if (now.getDate() <= dueDay) {
                            dueDate = new Date(now.getFullYear(), now.getMonth() - 1, dueDay);
                        }
                        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays > 0 && diffDays < prevDiff) prevDiff = diffDays;
                    }
                    if (prevDiff !== Infinity) minDiff = prevDiff;
                }
            }
        }
        
        if (minDiff === 0) return false; 
        
        const recentDue = new Date();
        recentDue.setHours(0,0,0,0);
        recentDue.setDate(recentDue.getDate() - minDiff);
        
        const dayAfterDue = new Date(recentDue);
        dayAfterDue.setDate(dayAfterDue.getDate() + 1);
        
        return lastTouchedDate < dayAfterDue;
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
                            is_op: false,
                            last_reset_month: currentMonthStr
                        });
                    }));
                    fetchData(); // Refetch cleanly
                    return;
                }
            }

            // 1. Process Overdue Penalties (-2 XP daily) and Rotate Incomplete Chores
            const choresToPenalize = rawChoreList.filter(c => {
                if (c.last_reset_date === todayStr) return false; // Already reset or penalized today
                if (!shouldPenalize(c)) return false;
                
                const updatedStr = getLocalYYYYMMDD(parsePBDate(c.updated));
                if (updatedStr === todayStr) return false; // Already penalized/touched today
                
                return true;
            });

            if (choresToPenalize.length > 0) {
                await Promise.all(choresToPenalize.map(async (c) => {
                    // Fetch the latest chore state right before penalizing to prevent multi-client race conditions
                    let latestChore;
                    try {
                        latestChore = await pb.collection('chores').getOne(c.id);
                    } catch (e) {
                        return; // Chore might have been deleted
                    }
                    const latestUpdatedStr = getLocalYYYYMMDD(parsePBDate(latestChore.updated));
                    if (latestChore.last_reset_date === todayStr || latestUpdatedStr === todayStr || !shouldPenalize(latestChore)) {
                        return; // Already penalized or handled by another client!
                    }

                    const assignedIds = getAssignedArray(latestChore.assigned_to);
                    const assignedProfiles = assignedIds.map(id => profileList.find(p => p.id === id || p.name === id)).filter(Boolean);
                    
                    const isStrict = latestChore.chore_name && latestChore.chore_name.includes('[STRICT]');
                    const penaltyAmount = isStrict ? 5 : 2;
                    let updateData = {
                        last_reset_date: todayStr
                    };

                    if (isStrict && latestChore.frequency !== 'daily') {
                        // For non-daily strict chores (weekly, monthly, one-off):
                        // Strict deadline was missed (-5 XP penalty).
                        // Mark as skipped (NOT completed!), so it disappears and forfeits late completion
                        // without falsely showing up as completed with a green checkmark.
                        // Weekly/monthly strict chores will reset naturally on their next due date via choresToReset.
                        updateData.is_skipped = true;
                        updateData.is_completed = false;
                    } else {
                        // For daily chores (both strict and regular) and non-strict recurring chores:
                        // Penalty is deducted, but the task must NEVER be marked complete!
                        // For daily chores, yesterday's deadline was missed, but today is a brand new day
                        // where the task is active and pending (is_completed: false, is_skipped: false).
                        updateData.is_completed = false;
                        updateData.is_skipped = false;

                        // Toggle a trailing space to force PocketBase to update the timestamp
                        const currentName = latestChore.chore_name || '';
                        updateData.chore_name = currentName.endsWith(' ') ? currentName.trimEnd() : currentName + ' ';
                        
                        // Rotate incomplete chores if rotation period elapsed or due date arrived
                        const pool = getPoolArray(latestChore.round_robin_pool, profileList);
                        if (pool.length > 1) {
                            if (latestChore.frequency === 'daily') {
                                const period = latestChore.rotation_period && latestChore.rotation_period > 0 ? latestChore.rotation_period : 3;
                                const lastRotatedStr = latestChore.last_rotated || getLocalYYYYMMDD(parsePBDate(latestChore.created)) || todayStr;
                                const daysElapsed = getDaysBetween(lastRotatedStr, todayStr);
                                if (daysElapsed >= period) {
                                    updateData.assigned_to = getNextAssignee(latestChore.assigned_to, pool);
                                    updateData.last_rotated = todayStr;
                                }
                            } else {
                                let isDueToday = false;
                                if (latestChore.frequency === 'monthly' && latestChore.due_dates) {
                                    let dates = [];
                                    if (Array.isArray(latestChore.due_dates)) dates = latestChore.due_dates.map(d => parseInt(String(d).trim(), 10));
                                    else if (typeof latestChore.due_dates === 'string') dates = latestChore.due_dates.split(',').map(d => parseInt(d.trim(), 10));
                                    isDueToday = dates.includes(now.getDate());
                                } else if (latestChore.frequency === 'weekly' && latestChore.due_dates) {
                                    const todayName = Object.keys(dayMap).find(k => dayMap[k] === now.getDay());
                                    let dueDays = [];
                                    if (Array.isArray(latestChore.due_dates)) dueDays = latestChore.due_dates.map(d => String(d).trim());
                                    else if (typeof latestChore.due_dates === 'string') dueDays = latestChore.due_dates.split(',').map(d => d.trim());
                                    isDueToday = dueDays.includes(todayName);
                                }
                                if (isDueToday) {
                                    updateData.assigned_to = getNextAssignee(latestChore.assigned_to, pool);
                                    updateData.last_rotated = todayStr;
                                }
                            }
                        }
                    }

                    await pb.collection('chores').update(latestChore.id, updateData);

                    for (const profile of assignedProfiles) {
                        const latestProfile = await pb.collection('profiles').getOne(profile.id);
                        const newBalance = Math.max(0, (latestProfile.xp_balance || 0) - penaltyAmount);
                        await pb.collection('profiles').update(profile.id, {
                            xp_balance: newBalance,
                            is_op: newBalance >= 100
                        });
                    }
                }));
                
                fetchData(); // Refetch cleanly
                return;
            }

            // 1.5. Reset Recurring Chores (Daily chores overnight reset; Weekly/Monthly when their due date arrives)
            const choresToReset = rawChoreList.filter(c => {
                if (!c.frequency || c.frequency === 'none') return false;
                if (c.last_reset_date === todayStr) return false; // Already reset or penalized today

                const updatedStr = getLocalYYYYMMDD(parsePBDate(c.updated));
                const createdStr = getLocalYYYYMMDD(parsePBDate(c.created));
                if (createdStr === todayStr) return false; // Don't reset if created today

                if (c.frequency === 'daily') {
                    if (updatedStr === todayStr) return false; // Don't reset if just checked off or touched today
                    return c.is_completed || c.is_skipped;
                }
                
                if (!c.due_dates) return false;

                // For weekly/monthly chores: reset when today matches scheduled due date
                let isDueToday = false;
                if (c.frequency === 'monthly') {
                    let dates = [];
                    if (Array.isArray(c.due_dates)) dates = c.due_dates.map(d => parseInt(String(d).trim(), 10));
                    else if (typeof c.due_dates === 'string') dates = c.due_dates.split(',').map(d => parseInt(d.trim(), 10));
                    isDueToday = dates.includes(now.getDate());
                } else if (c.frequency === 'weekly') {
                    const todayName = Object.keys(dayMap).find(k => dayMap[k] === now.getDay());
                    let dueDays = [];
                    if (Array.isArray(c.due_dates)) dueDays = c.due_dates.map(d => String(d).trim());
                    else if (typeof c.due_dates === 'string') dueDays = c.due_dates.split(',').map(d => d.trim());
                    isDueToday = dueDays.includes(todayName);
                }

                if (!isDueToday) return false;
                if (updatedStr === todayStr) return false; // Don't reset if already completed or updated today

                // A new due date cycle has arrived (resets whether completed, skipped, or missed previously)
                return true;
            });

            if (choresToReset.length > 0) {
                await Promise.all(choresToReset.map(async (c) => {
                    let latestChore;
                    try {
                        latestChore = await pb.collection('chores').getOne(c.id);
                    } catch (e) {
                        return;
                    }
                    if (latestChore.last_reset_date === todayStr) {
                        return; // Handled by another client
                    }

                    let updateData = { 
                        is_completed: false, 
                        is_skipped: false,
                        last_reset_date: todayStr
                    };

                    const pool = getPoolArray(latestChore.round_robin_pool, profileList);
                    if (pool.length > 1) {
                        if (latestChore.frequency === 'daily') {
                            const period = latestChore.rotation_period && latestChore.rotation_period > 0 ? latestChore.rotation_period : 3;
                            const lastRotatedStr = latestChore.last_rotated || getLocalYYYYMMDD(parsePBDate(latestChore.created)) || todayStr;
                            const daysElapsed = getDaysBetween(lastRotatedStr, todayStr);
                            if (daysElapsed >= period) {
                                updateData.assigned_to = getNextAssignee(latestChore.assigned_to, pool);
                                updateData.last_rotated = todayStr;
                            }
                        } else {
                            // Weekly/monthly chores rotate on their due date
                            updateData.assigned_to = getNextAssignee(latestChore.assigned_to, pool);
                            updateData.last_rotated = todayStr;
                        }
                    }

                    return pb.collection('chores').update(latestChore.id, updateData);
                }));
                fetchData(); // Refetch cleanly
                return;
            }

            // 1.5. Assign unassigned chores
            const unassignedChores = rawChoreList.filter(c => getAssignedArray(c.assigned_to).length === 0);
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
                if (!(c.is_completed || c.is_skipped)) return true; 
                const updatedStr = getLocalYYYYMMDD(parsePBDate(c.updated));
                if (updatedStr === todayStr) return true; 
                
                return false; 
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
            const bdays = profileList.filter(p => {
                if (!p.birthday) return false;
                const clean = p.birthday.trim().split('T')[0].split(' ')[0];
                const parts = clean.split('-');
                if (parts.length === 3) {
                    return `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` === todayMMDD;
                }
                if (parts.length === 2) {
                    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}` === todayMMDD;
                }
                return clean === todayMMDD;
            });
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
        const assignedIds = getAssignedArray(chore.assigned_to);
        const assignedProfiles = assignedIds.map(id => profiles.find(p => p.name === id || p.id === id)).filter(Boolean);
        const newStatus = !currentStatus;

        const baseXP = (chore.xp_reward !== undefined && chore.xp_reward !== null) ? chore.xp_reward : 10;

        try {
            // Optimistically update chores UI immediately (score is intentionally delayed to wait for DB)
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: newStatus } : c));

            // 1. Always update the chore status first
            await pb.collection('chores').update(choreId, { is_completed: newStatus });

            // 2. Update XP if a profile exists and we are not covered
            if (assignedProfiles.length > 0 && !isCovered) {
                await Promise.all(assignedProfiles.map(async (profile) => {
                    // Fetch the latest profile to prevent race conditions from rapid toggling
                    const latestProfile = await pb.collection('profiles').getOne(profile.id);
                    let earnedXP;
                    if (newStatus) {
                        const isOp = latestProfile.is_op || todayHoliday !== null; 
                        earnedXP = isOp ? Math.floor(baseXP * 1.5) : baseXP;
                    } else {
                        if (todayHoliday !== null) {
                            earnedXP = Math.floor(baseXP * 1.5);
                        } else {
                            if ((latestProfile.xp_balance || 0) - Math.floor(baseXP * 1.5) >= 100) {
                                earnedXP = Math.floor(baseXP * 1.5);
                            } else {
                                earnedXP = baseXP;
                            }
                        }
                    }

                    const newBalance = newStatus 
                        ? (latestProfile.xp_balance || 0) + earnedXP 
                        : Math.max(0, (latestProfile.xp_balance || 0) - earnedXP);

                    return pb.collection('profiles').update(profile.id, {
                        xp_balance: newBalance,
                        is_op: newBalance >= 100
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

    const skipChore = async (choreId, currentSkipStatus) => {
        const chore = chores.find(c => c.id === choreId);
        const newStatus = !currentSkipStatus;

        try {
            // Optimistically update UI immediately
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_skipped: newStatus } : c));
            await pb.collection('chores').update(choreId, { is_skipped: newStatus });
            console.log(`Success: ${chore.chore_name} skipped toggled to ${newStatus}`);
        } catch (err) {
            // Revert optimistic update on failure
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_skipped: currentSkipStatus } : c));
            console.error("Skip update failed:", err);
        }
    };

    const rotateAssignee = async (choreId) => {
        const chore = chores.find(c => c.id === choreId);
        if (!chore) return;
        
        const pool = getPoolArray(chore.round_robin_pool, profiles);
        if (pool.length > 1) {
            const nextAssigneeId = getNextAssignee(chore.assigned_to, pool);
            const todayStr = getLocalYYYYMMDD(new Date());
            
            try {
                await pb.collection('chores').update(choreId, { 
                    assigned_to: nextAssigneeId,
                    last_rotated: todayStr,
                    last_reset_date: todayStr
                });
                fetchData(); // reload correctly to compute projections
            } catch (err) {
                console.error("Rotate failed:", err);
            }
        }
    };

    useEffect(() => {
        fetchData();
        
        let timeoutId;
        const debouncedFetch = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fetchData();
            }, 800);
        };

        // Realtime subscriptions (works now that we're on Fly.io, not Ngrok)
        pb.collection('chores').subscribe('*', debouncedFetch);
        pb.collection('profiles').subscribe('*', () => {
            debouncedFetch();
            window.dispatchEvent(new Event('profiles-updated'));
        });
        const handleProfilesUpdated = () => debouncedFetch();
        window.addEventListener('profiles-updated', handleProfilesUpdated);
        
        return () => {
            clearTimeout(timeoutId);
            pb.collection('chores').unsubscribe();
            pb.collection('profiles').unsubscribe();
            window.removeEventListener('profiles-updated', handleProfilesUpdated);
        };
    }, [fetchData]);

    // (Keep your groupedChores and sortedGroupEntries logic here)
    const expandedChores = chores.flatMap(c => {
        let resolvedName;
        const cAssigned = getAssignedArray(c.assigned_to);
        if (cAssigned.length > 0) {
            resolvedName = cAssigned.map(id => {
                const p = profiles.find(p => p.id === id || p.name === id);
                return p ? p.name : id;
            }).join(', ');
        } else {
            resolvedName = c.assigned_to;
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIdx = new Date().getDay();
        const dateStr = c.one_off_date || (Array.isArray(c.due_dates) && c.due_dates[0]);

        if (c.frequency === 'daily' || c.frequency === 'weekly' || ((c.frequency === 'none' || !c.frequency) && dateStr)) {
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

            const firstAssigned = getAssignedArray(c.assigned_to)[0] || c.assigned_to;
            const firstAssignedP = profiles.find(p => p.id === firstAssigned || p.name === firstAssigned);
            const firstAssignedName = firstAssignedP ? firstAssignedP.name : firstAssigned;
            const currentIdx = pool.indexOf(firstAssignedName) === -1 ? 0 : pool.indexOf(firstAssignedName);
            const projected = [];
            let dueDays = [];
            let oneOffDateObj = null;

            if (c.frequency === 'weekly') {
                if (Array.isArray(c.due_dates)) dueDays = c.due_dates.map(d => String(d).trim());
                else if (typeof c.due_dates === 'string') dueDays = c.due_dates.split(',').map(d => d.trim());
            } else if (c.frequency === 'none' || !c.frequency) {
                const parts = dateStr.split('-'); // YYYY-MM-DD
                if (parts.length === 3) {
                    oneOffDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    oneOffDateObj = parsePBDate(dateStr);
                }
                oneOffDateObj.setHours(0,0,0,0);
            }

            let assignmentCounter = 0;
            const overdue = isChoreOverdue(c) || (oneOffDateObj && oneOffDateObj.getTime() < new Date().setHours(0,0,0,0) && !(c.is_completed || c.is_skipped));
            
            const parents = profiles.filter(p => p.is_parent);
            const parentName = parents.length > 0 ? parents[0].name : 'Mom/Dad';
            const todayStr = getLocalYYYYMMDD(new Date());
            const period = c.rotation_period && c.rotation_period > 0 ? c.rotation_period : 3;
            const lastRotatedStr = c.last_rotated || getLocalYYYYMMDD(parsePBDate(c.created)) || todayStr;
            const daysSinceRotation = Math.max(0, getDaysBetween(lastRotatedStr, todayStr));

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
                
                if ((c.frequency === 'none' || !c.frequency) && oneOffDateObj) {
                    if (targetDate.getTime() !== oneOffDateObj.getTime()) {
                        if (overdue && i === 0) {
                            // let it pass to today
                        } else {
                            continue;
                        }
                    }
                }

                let projectedName;
                if (pool.length > 0) {
                    if (c.frequency === 'daily') {
                        const rotationStep = Math.floor((daysSinceRotation + i) / period) - Math.floor(daysSinceRotation / period);
                        projectedName = pool[(currentIdx + rotationStep) % pool.length];
                    } else {
                        projectedName = pool[(currentIdx + assignmentCounter) % pool.length];
                    }
                } else {
                    projectedName = resolvedName;
                }
                
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
                    is_skipped: i === 0 ? c.is_skipped : false,
                    is_future: i > 0,
                    sort_order: i
                });

                assignmentCounter++;
            }
            
            if (projected.length > 0) return projected;
        }

        let day_due = 'Uncategorized';
        if (c.frequency === 'monthly') day_due = 'Monthly';
        else if (c.frequency === 'none' || !c.frequency) {
            if (c.one_off_date || (c.due_dates && c.due_dates.length > 0)) {
                day_due = 'Upcoming One-off Tasks';
            } else {
                day_due = 'One-off Tasks';
            }
        }

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

    return { chores, profiles, sortedGroupEntries, loading, toggleChore, skipChore, rotateAssignee, todayHoliday, birthdayProfiles, fetchError };
}