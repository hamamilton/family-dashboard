import { useState, useEffect } from 'react';

export function useInactivity(timeoutMs = 5000) {
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let timeoutId;

        const resetTimer = () => {
            setIsIdle(false);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setIsIdle(true), timeoutMs);
        };

        // Initialize the timer
        resetTimer();

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
