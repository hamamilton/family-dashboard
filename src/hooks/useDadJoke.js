import { useState, useCallback } from 'react';

export function useDadJoke() {
    const [loading, setLoading] = useState(false);

    const fetchJoke = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('https://icanhazdadjoke.com/', {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FamilyDashboard (https://github.com/hamamilton/family-dashboard)'
                }
            });
            const data = await response.json();
            setLoading(false);
            return data.joke;
        } catch (error) {
            console.error('Failed to fetch dad joke:', error);
            setLoading(false);
            return null;
        }
    }, []);

    return { fetchJoke, loading };
}
