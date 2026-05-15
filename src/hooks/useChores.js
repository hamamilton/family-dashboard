import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

const dayMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

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
        const createdDate = new Date(chore.created || Date.now());
        createdDate.setHours(0,0,0,0);

        for (let dueDay of dates) {
            let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
            if (now.getDate() < dueDay) {
                dueDate = new Date(now.getFullYear(), now.getMonth() - 1, dueDay);
            }
            dueDate.setHours(0,0,0,0);

            if (dueDate >= createdDate) {
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < minDiff) minDiff = diffDays;
            }
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
        const createdDate = new Date(chore.created || Date.now());
        createdDate.setHours(0,0,0,0);

        for (let dueDayInt of days) {
            let diff = currentDayInt - dueDayInt;
            if (diff < 0) diff += 7;
            
            let actualDueDate = new Date(now.getTime() - diff * 24 * 60 * 60 * 1000);
            actualDueDate.setHours(0,0,0,0);

            if (actualDueDate >= createdDate) {
                if (diff < minDiff) minDiff = diff;
            }
        }
        return minDiff === Infinity ? 0 : minDiff;
    }
    
    return 0;
}

export function useChores(groupBy) {
    const [chores, setChores] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [todayHoliday, setTodayHoliday] = useState(null);
    const [birthdayProfiles, setBirthdayProfiles] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            const [rawChoreList, profileList] = await Promise.all([
                pb.collection('chores').getFullList({ sort: '-created' }),
                pb.collection('profiles').getFullList()
            ]);

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            // 1. Reset Recurring Chores
            const choresToReset = rawChoreList.filter(c => {
                if (!c.is_completed || !c.frequency || c.frequency === 'none') return false;
                const updatedStr = new Date(c.updated).toISOString().split('T')[0];
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
                            return profile ? profile.id : null;
                        }).filter(Boolean);
                    } else {
                        pool = profileList.map(p => p.id);
                    }
                    
                    if (pool.length > 0) {
                        if (pool.length > 1) {
                            const currentAssignedId = c.assigned_to;
                            const currentIdx = pool.indexOf(currentAssignedId);
                            const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % pool.length;
                            updateData.assigned_to = pool[nextIdx];
                        } else if (pool.length === 1) {
                            updateData.assigned_to = pool[0];
                        }
                    }

                    return pb.collection('chores').update(c.id, updateData);
                }));
                fetchData(); // Refetch cleanly
                return;
            }

            // 1.5. Assign unassigned chores
            const unassignedChores = rawChoreList.filter(c => !c.assigned_to);
            if (unassignedChores.length > 0) {
                await Promise.all(unassignedChores.map(async (c, index) => {
                    let pool = [];
                    if (Array.isArray(c.round_robin_pool) && c.round_robin_pool.length > 0) {
                        pool = c.round_robin_pool.map(val => {
                            const profile = profileList.find(p => p.id === val || p.name === val);
                            return profile ? profile.id : null;
                        }).filter(Boolean);
                    } else {
                        pool = profileList.map(p => p.id);
                    }
                    
                    if (pool.length > 0) {
                        const assignedId = pool[index % pool.length];
                        return pb.collection('chores').update(c.id, { assigned_to: assignedId });
                    }
                }));
                fetchData(); 
                return;
            }

            // 2. Filter Visibility
            const visibleChores = rawChoreList.filter(c => {
                if (!c.is_completed) return true; 
                const updatedStr = new Date(c.updated).toISOString().split('T')[0];
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
                    const todayStr = new Date().toISOString().split('T')[0];
                    const holiday = holidays.find(h => h.date === todayStr);
                    setTodayHoliday(holiday ? holiday.name : null);
                }
            } catch (e) {
                console.error("Holiday API failed", e);
            }

            // Check Birthdays
            const todayMMDD = new Date().toISOString().split('T')[0].substring(5); // "MM-DD"
            const bdays = profileList.filter(p => p.birthday === todayMMDD);
            setBirthdayProfiles(bdays.map(p => p.name));
        } catch (err) {
            console.error("Fetch error:", err);
            if (err.response) {
                console.error("Detailed Error Response:", JSON.stringify(err.response, null, 2));
            }
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleChore = async (choreId, currentStatus) => {
        const chore = chores.find(c => c.id === choreId);
        if (!chore) return;
        
        // Robust parsing of assigned agents - handles both arrays (native PB) and strings (manual entry)
        const assignedToArray = Array.isArray(chore.assigned_to) 
            ? chore.assigned_to 
            : (typeof chore.assigned_to === 'string' ? chore.assigned_to.split(',').map(s => s.trim()) : []);
        const assignedProfiles = profiles.filter(p => assignedToArray.includes(p.id) || assignedToArray.includes(p.name));
        const newStatus = !currentStatus;

        try {
            // Optimistically update UI immediately
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: newStatus } : c));

            // 1. Always update the chore status first
            await pb.collection('chores').update(choreId, { is_completed: newStatus });

            // 2. Update XP for all assigned profiles
            if (assignedProfiles.length > 0) {
                for (const profile of assignedProfiles) {
                    const baseXP = chore.xp_reward || 10;
                    let penaltyMultiplier = 1;
                    const daysLate = getDaysLate(chore);
                    if (daysLate > 0) {
                        penaltyMultiplier = Math.max(0.1, 1 - (daysLate * 0.15));
                    }
                    const isOp = profile.is_op || todayHoliday !== null; 
                    const earnedXP = isOp ? Math.floor(baseXP * penaltyMultiplier * 1.5) : Math.floor(baseXP * penaltyMultiplier);

                    let newBalance = profile.xp_balance;
                    if (newStatus) {
                        newBalance += earnedXP;
                    } else {
                        newBalance = Math.max(0, newBalance - earnedXP);
                    }

                    await pb.collection('profiles').update(profile.id, {
                        xp_balance: newBalance,
                        is_op: profile.is_op || (newBalance >= 1000)
                    });
                }
            }

            console.log(`Success: ${chore.chore_name} toggled to ${newStatus}`);
        } catch (err) {
            // Revert optimistic update on failure
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: currentStatus } : c));
            console.error("Update failed:", err);
        }
    };

    const reassignChore = async (choreId) => {
        const chore = chores.find(c => c.id === choreId);
        if (!chore) return;

        // Get pool
        let pool = [];
        if (Array.isArray(chore.round_robin_pool) && chore.round_robin_pool.length > 0) {
            pool = chore.round_robin_pool.map(val => {
                const profile = profiles.find(p => p.id === val || p.name === val);
                return profile ? profile.id : null;
            }).filter(Boolean);
        } else {
            pool = profiles.map(p => p.id);
        }

        if (pool.length <= 1) return;

        const currentIdx = pool.indexOf(chore.assigned_to);
        const nextIdx = (currentIdx + 1) % pool.length;
        const nextId = pool[nextIdx];

        try {
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, assigned_to: nextId } : c));
            await pb.collection('chores').update(choreId, { assigned_to: nextId });
        } catch (err) {
            console.error("Reassign failed:", err);
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, assigned_to: chore.assigned_to } : c));
        }
    };

    const addChore = async (choreName, assignedTo = '') => {
        try {
            const data = {
                chore_name: choreName,
                assigned_to: assignedTo,
                frequency: 'none',
                is_completed: false,
                xp_reward: 25 
            };
            await pb.collection('chores').create(data);
            fetchData();
        } catch (err) {
            console.error("Add chore failed:", err);
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
    // Maps the raw database chores into a display-ready format for the Mission Board
    const expandedChores = chores.flatMap(c => {
        // Resolve assignee IDs into readable Names
        let assignedToArray = [];
        if (Array.isArray(c.assigned_to)) {
            assignedToArray = c.assigned_to;
        } else if (typeof c.assigned_to === 'string' && c.assigned_to.trim() !== '') {
            assignedToArray = c.assigned_to.split(',').map(s => s.trim());
        }
        
        if (assignedToArray.length === 0) assignedToArray = ['Unassigned'];

        const resolvedNames = assignedToArray.map(val => {
            const p = profiles.find(p => p.id === val || p.name === val);
            return p ? p.name : val;
        });

        // Joined string for display on a single card
        const allNames = resolvedNames.join(', ');

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIdx = new Date().getDay();

        if (c.frequency === 'daily' || c.frequency === 'weekly') {
            let pool = [];
            let isRoundRobin = false;
            
            if (Array.isArray(c.round_robin_pool) && c.round_robin_pool.length > 0) {
                isRoundRobin = true;
                pool = c.round_robin_pool.map(val => {
                    const p = profiles.find(p => p.id === val || p.name === val);
                    return p ? p.name : val;
                }).filter(Boolean);
            } else if (typeof c.round_robin_pool === 'string' && c.round_robin_pool.trim() !== '') {
                isRoundRobin = true;
                pool = c.round_robin_pool.split(',').map(val => {
                    const p = profiles.find(p => p.id === val.trim() || p.name === val.trim());
                    return p ? p.name : val.trim();
                }).filter(Boolean);
            }

            const projected = [];
            let dueDays = [];

            if (c.frequency === 'weekly') {
                if (Array.isArray(c.due_dates)) dueDays = c.due_dates.map(d => String(d).trim());
                else if (typeof c.due_dates === 'string') dueDays = c.due_dates.split(',').map(d => d.trim());
            }

            let assignmentCounter = 0;

            for (let i = 0; i < 7; i++) {
                const targetDayIdx = (todayIdx + i) % 7;
                const targetDayName = days[targetDayIdx];
                
                if (c.frequency === 'weekly' && !dueDays.includes(targetDayName)) {
                    continue;
                }

                const namesForDay = [];
                if (isRoundRobin) {
                    const currentIdx = pool.indexOf(resolvedNames[0]) === -1 ? 0 : pool.indexOf(resolvedNames[0]);
                    namesForDay.push(pool[(currentIdx + assignmentCounter) % pool.length]);
                } else {
                    namesForDay.push(...resolvedNames);
                }
                
                const displayDay = i === 0 ? `Today (${targetDayName})` : targetDayName;

                // Special handling for the "By Person" group view:
                // We split the chore into multiple sections so it shows up for each person,
                // but each card still shows the full list of names.
                if (groupBy === 'assigned_to' && namesForDay.length > 0) {
                    namesForDay.forEach(n => {
                        projected.push({
                            ...c,
                            id: i === 0 ? `${c.id}_${n}` : `${c.id}_future_${i}_${n}`,
                            assigned_to: allNames, // Display joined names
                            assigned_to_group: n, // Target specific person for the group header
                            day_due: displayDay,
                            is_completed: i === 0 ? c.is_completed : false,
                            is_future: i > 0,
                            sort_order: i
                        });
                    });
                } else {
                    // Standard day view: just show the mission once with all names
                    projected.push({
                        ...c,
                        id: i === 0 ? c.id : `${c.id}_future_${i}`,
                        assigned_to: allNames,
                        day_due: displayDay,
                        is_completed: i === 0 ? c.is_completed : false,
                        is_future: i > 0,
                        sort_order: i
                    });
                }

                assignmentCounter++;
            }
            
            if (projected.length > 0) return projected;
        }

        let day_due = 'Uncategorized';
        if (c.frequency === 'monthly') day_due = 'Monthly';
        else if (c.frequency === 'none' || !c.frequency) day_due = 'One-off Tasks';

        if (groupBy === 'assigned_to' && resolvedNames.length > 0) {
            return resolvedNames.map(n => ({
                ...c,
                assigned_to: allNames,
                assigned_to_group: n,
                day_due,
                sort_order: 99
            }));
        }

        return [{
            ...c,
            assigned_to: allNames,
            day_due,
            sort_order: 99
        }];
    });

    const groupedChores = expandedChores.reduce((acc, chore) => {
        const groupField = groupBy === 'assigned_to' ? 'assigned_to_group' : groupBy;
        const key = chore[groupField] || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(chore);
        return acc;
    }, {});

    const sortedGroupEntries = Object.entries(groupedChores).sort((a, b) => {
        const orderA = a[1][0]?.sort_order ?? 99;
        const orderB = b[1][0]?.sort_order ?? 99;
        return orderA - orderB;
    });

    return { chores, profiles, sortedGroupEntries, loading, toggleChore, reassignChore, addChore, todayHoliday, birthdayProfiles };
}