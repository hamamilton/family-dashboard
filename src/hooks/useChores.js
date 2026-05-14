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

export function useChores(groupBy) {
    const [chores, setChores] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [todayHoliday, setTodayHoliday] = useState(null);
    const [birthdayProfiles, setBirthdayProfiles] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            const [rawChoreList, profileList] = await Promise.all([
                pb.collection('chores').getFullList({ sort: '-created', expand: 'round_robin_pool,assigned_to' }),
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
                    
                    // Use round_robin_pool if it exists, otherwise fall back to all profiles
                    let pool = [];
                    if (c.expand?.round_robin_pool) {
                        // Relation field — use expanded profile names
                        pool = c.expand.round_robin_pool.map(p => p.name);
                    } else if (c.round_robin_pool) {
                        // Legacy text field fallback
                        if (typeof c.round_robin_pool === 'string') pool = c.round_robin_pool.split(',').map(n => n.trim());
                    } else {
                        pool = profileList.map(p => p.name);
                    }
                    
                    if (pool.length > 0) {
                        if (pool.length > 1) {
                            // Find current assigned person's name
                            const currentAssignedName = c.expand?.assigned_to?.name || c.assigned_to;
                            const currentIdx = pool.indexOf(currentAssignedName);
                            const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % pool.length;
                            const nextName = pool[nextIdx];
                            
                            // Find the profile ID for this name to save as relation
                            const nextProfile = profileList.find(p => p.name === nextName);
                            updateData.assigned_to = nextProfile ? nextProfile.id : nextName;
                        } else if (pool.length === 1) {
                            const p = profileList.find(p => p.name === pool[0]);
                            updateData.assigned_to = p ? p.id : pool[0];
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
                    if (c.expand?.round_robin_pool) {
                        pool = c.expand.round_robin_pool; // Array of profile objects
                    } else {
                        pool = profileList; // Fallback to all profile objects
                    }
                    
                    if (pool.length > 0) {
                        const assignedProfile = pool[index % pool.length];
                        return pb.collection('chores').update(c.id, { assigned_to: assignedProfile.id });
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
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleChore = async (choreId, currentStatus) => {
        const chore = chores.find(c => c.id === choreId);
        const profile = profiles.find(p => p.name === chore.assigned_to);
        const newStatus = !currentStatus;

        try {
            // Optimistically update UI immediately
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: newStatus } : c));

            // 1. Always update the chore status first
            await pb.collection('chores').update(choreId, { is_completed: newStatus });

            // 2. Only try to update XP if a profile exists and we are CHECKING the box
            if (profile && newStatus) {
                const baseXP = chore.xp_reward || 10;
                
                // Calculate Late Penalty
                let penaltyMultiplier = 1;
                const daysLate = getDaysLate(chore);
                if (daysLate > 0) {
                    penaltyMultiplier = Math.max(0.1, 1 - (daysLate * 0.15));
                }

                // Temporary OP status on holidays!
                const isOp = profile.is_op || todayHoliday !== null; 
                const earnedXP = isOp ? Math.floor(baseXP * penaltyMultiplier * 1.5) : Math.floor(baseXP * penaltyMultiplier);

                await pb.collection('profiles').update(profile.id, {
                    xp_balance: profile.xp_balance + earnedXP,
                    is_op: profile.is_op || (profile.xp_balance + earnedXP >= 1000)
                });
            }

            console.log(`Success: ${chore.chore_name} toggled to ${newStatus}`);
        } catch (err) {
            // Revert optimistic update on failure
            setChores(prev => prev.map(c => c.id === choreId ? { ...c, is_completed: currentStatus } : c));
            console.error("Update failed:", err);
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
    const groupedChores = chores.map(c => ({
        ...c,
        // Ensure assigned_to display is the name, not the ID
        assigned_to: c.expand?.assigned_to?.name || c.assigned_to
    })).reduce((acc, chore) => {
        const key = chore[groupBy] || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(chore);
        return acc;
    }, {});

    const sortedGroupEntries = Object.entries(groupedChores);

    return { chores, profiles, sortedGroupEntries, loading, toggleChore, todayHoliday, birthdayProfiles };
}