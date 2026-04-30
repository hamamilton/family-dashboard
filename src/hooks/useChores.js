import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

export function useChores(groupBy) {
    const [chores, setChores] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [choreList, profileList] = await Promise.all([
                pb.collection('chores').getFullList({ sort: '-created' }),
                pb.collection('profiles').getFullList()
            ]);
            setChores(choreList);
            setProfiles(profileList);
        } catch (err) {
            console.error("Sync failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleChore = async (choreId, currentStatus) => {
        const chore = chores.find(c => c.id === choreId);
        const profile = profiles.find(p => p.name === chore.assigned_to);
        const newStatus = !currentStatus;

        try {
            // 1. Always update the chore status first
            await pb.collection('chores').update(choreId, {
                is_completed: newStatus
            });

            // 2. Only try to update XP if a profile exists and we are CHECKING the box
            if (profile && newStatus) {
                const baseXP = chore.xp_reward || 10;
                const earnedXP = profile.is_op ? Math.floor(baseXP * 1.5) : baseXP;

                await pb.collection('profiles').update(profile.id, {
                    xp_balance: profile.xp_balance + earnedXP,
                    is_op: profile.is_op || (profile.xp_balance + earnedXP >= 1000)
                });
            }

            console.log(`Success: ${chore.chore_name} toggled to ${newStatus}`);
        } catch (err) {
            console.error("The Raspberry Pi rejected the update:", err);
        }
    };

    useEffect(() => {
        fetchData();
        pb.collection('chores').subscribe('*', fetchData);
        pb.collection('profiles').subscribe('*', fetchData);
        return () => {
            pb.collection('chores').unsubscribe();
            pb.collection('profiles').unsubscribe();
        };
    }, [fetchData]);

    // (Keep your groupedChores and sortedGroupEntries logic here)
    const groupedChores = chores.reduce((acc, chore) => {
        const key = chore[groupBy] || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(chore);
        return acc;
    }, {});

    const sortedGroupEntries = Object.entries(groupedChores);

    return { chores, profiles, sortedGroupEntries, loading, toggleChore };
}