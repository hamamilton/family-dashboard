import { useState, useEffect } from 'react';

const DEFAULT_LAYOUT = {
    lg: [
        { i: 'chores', x: 0, y: 0, w: 8, h: 1 },
        { i: 'calendar', x: 8, y: 0, w: 4, h: 2 },
        { i: 'meals', x: 0, y: 1, w: 4, h: 1 },
        { i: 'groceries', x: 4, y: 1, w: 4, h: 1 },
        { i: 'photos', x: 0, y: 2, w: 12, h: 2 },
    ],
    md: [
        { i: 'chores', x: 0, y: 0, w: 10, h: 1 },
        { i: 'calendar', x: 0, y: 1, w: 10, h: 2 },
        { i: 'meals', x: 0, y: 3, w: 5, h: 1 },
        { i: 'groceries', x: 5, y: 3, w: 5, h: 1 },
        { i: 'photos', x: 0, y: 4, w: 10, h: 2 },
    ],
    sm: [
        { i: 'chores', x: 0, y: 0, w: 6, h: 1 },
        { i: 'calendar', x: 0, y: 1, w: 6, h: 2 },
        { i: 'meals', x: 0, y: 3, w: 6, h: 1 },
        { i: 'groceries', x: 0, y: 4, w: 6, h: 1 },
        { i: 'photos', x: 0, y: 5, w: 6, h: 2 },
    ]
};

const loadLocalLayout = () => {
    const localData = localStorage.getItem('family_dashboard_layout');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            // Upgrade logic to add 'photos' if it's missing from an old saved layout
            if (!parsed.lg.find(item => item.i === 'photos')) {
                parsed.lg.push({ i: 'photos', x: 0, y: 2, w: 12, h: 2 });
                parsed.md.push({ i: 'photos', x: 0, y: 4, w: 10, h: 2 });
                parsed.sm.push({ i: 'photos', x: 0, y: 5, w: 6, h: 2 });
                localStorage.setItem('family_dashboard_layout', JSON.stringify(parsed));
            }
            return parsed;
        } catch (e) {
            return DEFAULT_LAYOUT;
        }
    }
    return DEFAULT_LAYOUT;
};

export function useLayout() {
    const [layouts, setLayouts] = useState(loadLocalLayout());

    const onLayoutChange = (layout, layouts) => {
        setLayouts(layouts);
        localStorage.setItem('family_dashboard_layout', JSON.stringify(layouts));
    };

    return { layouts, onLayoutChange };
}
