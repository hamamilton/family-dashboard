import { useState, useEffect } from 'react';

export function useInactivity(timeoutMs = 600000) {
    const [isIdle, setIsIdle] = useState(true);

    useEffect(() => {
        let timeoutId;

        const resetTimer = () => {
            setIsIdle(false);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setIsIdle(true), timeoutMs);
        };

        // resetTimer(); // Removed for testing so it starts idle

        // Listen for activity events
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        return () => {
            clearTimeout(timeoutId);
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMs]);

    return { isIdle, setIsIdle };
}
