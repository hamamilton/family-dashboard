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

function getSpawnTime(dateString) {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
        hash |= 0;
    }
    const minutesPast7 = Math.abs(hash) % (12 * 60); // 12 hours * 60 mins
    return { 
        spawnHour: 7 + Math.floor(minutesPast7 / 60), 
        spawnMinute: minutesPast7 % 60 
    };
}

export function useSideQuest(profiles = []) {
    const [rawQuest, setRawQuest] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkVisibility = useCallback((q) => {
        if (!q) {
            setIsVisible(false);
            return;
        }
        if (q.is_completed) {
            setIsVisible(true);
            return;
        }
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const { spawnHour, spawnMinute } = getSpawnTime(q.date);

        if (currentHour >= 19) {
            setIsVisible(false); // Disappears at 7 PM
        } else if (currentHour > spawnHour || (currentHour === spawnHour && currentMinute >= spawnMinute)) {
            setIsVisible(true); // Spawned
        } else {
            setIsVisible(false); // Hasn't spawned yet
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Try to find today's quest
            const records = await pb.collection('side_quests').getList(1, 1, {
                filter: `date = "${today}"`,
                expand: 'completed_by'
            });

            let newRawQuest = null;
            if (records.items.length > 0) {
                newRawQuest = records.items[0];
            } else {
                // 2. Create a new surprise quest for today
                const randomQuest = QUEST_POOL[Math.floor(Math.random() * QUEST_POOL.length)];
                newRawQuest = await pb.collection('side_quests').create({
                    title: randomQuest,
                    date: today,
                    is_completed: false
                });
            }
            setRawQuest(newRawQuest);
            checkVisibility(newRawQuest);
            setLoading(false);
        } catch (err) {
            console.error("SideQuest sync failed:", err);
            setLoading(false);
        }
    }, [checkVisibility]);

    useEffect(() => {
        fetchData();
        pb.collection('side_quests').subscribe('*', fetchData);
        return () => pb.collection('side_quests').unsubscribe('*');
    }, [fetchData]);

    useEffect(() => {
        const interval = setInterval(() => {
            checkVisibility(rawQuest);
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [rawQuest, checkVisibility]);

    const claimQuest = async (profileId) => {
        if (!rawQuest || rawQuest.is_completed) return;

        try {
            // 1. Mark quest as completed
            await pb.collection('side_quests').update(rawQuest.id, {
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

    return { quest: isVisible ? rawQuest : null, loading, claimQuest };
}
