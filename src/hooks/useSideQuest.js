import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

const QUEST_POOL = [
    "📞 Call Grandma (Check in & say hi!)",
    "📞 Call Pop-pop (Share a fun story)",
    "📞 Call Nana (Ask about her day)",
    "📞 Call Soda (Check on Great-Grandma)",
    "🧹 Clean the 'Mystery Spot' (You know the one)",
    "👟 Organize the shoe rack / Entryway",
    "♻️ Take out the recycling early",
    "💌 Write a quick thank you note to someone",
    "🧦 Match all the loose socks in the bin",
    "🍎 Wipe down the fruit bowl and counters"
];

export function useSideQuest(profiles = []) {
    const [quest, setQuest] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Try to find today's quest
            const records = await pb.collection('side_quests').getList(1, 1, {
                filter: `date = "${today}"`,
                expand: 'completed_by'
            });

            if (records.items.length > 0) {
                setQuest(records.items[0]);
            } else {
                // 2. Create a new surprise quest for today
                const randomQuest = QUEST_POOL[Math.floor(Math.random() * QUEST_POOL.length)];
                const newQuest = await pb.collection('side_quests').create({
                    title: randomQuest,
                    date: today,
                    is_completed: false
                });
                setQuest(newQuest);
            }
            setLoading(false);
        } catch (err) {
            console.error("SideQuest sync failed:", err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        pb.collection('side_quests').subscribe('*', fetchData);
        return () => pb.collection('side_quests').unsubscribe('*');
    }, [fetchData]);

    const claimQuest = async (profileId) => {
        if (!quest || quest.is_completed) return;

        try {
            // 1. Mark quest as completed
            await pb.collection('side_quests').update(quest.id, {
                is_completed: true,
                completed_by: profileId
            });

            // 2. Award 15 XP to the profile
            const profile = profiles.find(p => p.id === profileId);
            if (profile) {
                await pb.collection('profiles').update(profileId, {
                    xp_balance: (profile.xp_balance || 0) + 15
                });
            }
        } catch (err) {
            console.error("Failed to claim quest:", err);
        }
    };

    return { quest, loading, claimQuest };
}
