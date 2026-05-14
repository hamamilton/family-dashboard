import { useState, useEffect } from 'react';

const DEFAULT_LAYOUT = {
    lg: [
        { i: 'agents', x: 0, y: 0, w: 12, h: 1 },
        { i: 'chores', x: 0, y: 1, w: 8, h: 1 },
        { i: 'calendar', x: 8, y: 1, w: 4, h: 2 },
        { i: 'gospel', x: 0, y: 2, w: 4, h: 1 },
        { i: 'bonus', x: 4, y: 2, w: 4, h: 1 },
        { i: 'quest', x: 8, y: 2, w: 4, h: 1 },
        { i: 'meals', x: 0, y: 3, w: 4, h: 1 },
        { i: 'groceries', x: 4, y: 3, w: 4, h: 1 },
        { i: 'photos', x: 8, y: 3, w: 4, h: 2 },
    ],
    md: [
        { i: 'agents', x: 0, y: 0, w: 10, h: 1 },
        { i: 'chores', x: 0, y: 1, w: 10, h: 1 },
        { i: 'calendar', x: 0, y: 2, w: 10, h: 2 },
        { i: 'gospel', x: 0, y: 4, w: 5, h: 1 },
        { i: 'bonus', x: 5, y: 4, w: 5, h: 1 },
        { i: 'quest', x: 0, y: 5, w: 5, h: 1 },
        { i: 'meals', x: 5, y: 5, w: 5, h: 1 },
        { i: 'groceries', x: 0, y: 6, w: 5, h: 1 },
        { i: 'photos', x: 5, y: 6, w: 5, h: 2 },
    ],
    sm: [
        { i: 'agents', x: 0, y: 0, w: 6, h: 1 },
        { i: 'chores', x: 0, y: 1, w: 6, h: 1 },
        { i: 'calendar', x: 0, y: 2, w: 6, h: 2 },
        { i: 'gospel', x: 0, y: 4, w: 6, h: 1 },
        { i: 'bonus', x: 0, y: 5, w: 6, h: 1 },
        { i: 'quest', x: 0, y: 6, w: 6, h: 1 },
        { i: 'meals', x: 0, y: 7, w: 6, h: 1 },
        { i: 'groceries', x: 0, y: 8, w: 6, h: 1 },
        { i: 'photos', x: 0, y: 9, w: 6, h: 2 },
    ]
};

const loadLocalLayout = () => {
    const localData = localStorage.getItem('family_dashboard_layout');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            // Upgrade: add 'agents' if missing from saved layout
            if (!parsed.lg.find(item => item.i === 'agents')) {
                parsed.lg.unshift({ i: 'agents', x: 0, y: 0, w: 12, h: 1 });
                parsed.md.unshift({ i: 'agents', x: 0, y: 0, w: 10, h: 1 });
                parsed.sm.unshift({ i: 'agents', x: 0, y: 0, w: 6, h: 1 });
                localStorage.setItem('family_dashboard_layout', JSON.stringify(parsed));
            }
            // Upgrade: add 'photos' if missing from saved layout
            if (!parsed.lg.find(item => item.i === 'photos')) {
                parsed.lg.push({ i: 'photos', x: 0, y: 3, w: 12, h: 2 });
                parsed.md.push({ i: 'photos', x: 5, y: 5, w: 5, h: 2 });
                parsed.sm.push({ i: 'photos', x: 0, y: 7, w: 6, h: 2 });
            }
            // Upgrade: add 'gospel' if missing from saved layout
            if (!parsed.lg.find(item => item.i === 'gospel')) {
                parsed.lg.push({ i: 'gospel', x: 0, y: 2, w: 4, h: 1 });
                parsed.md.push({ i: 'gospel', x: 0, y: 4, w: 5, h: 1 });
                parsed.sm.push({ i: 'gospel', x: 0, y: 4, w: 6, h: 1 });
            }
            // Upgrade: add 'bonus' if missing from saved layout
            if (!parsed.lg.find(item => item.i === 'bonus')) {
                parsed.lg.push({ i: 'bonus', x: 4, y: 2, w: 4, h: 1 });
                parsed.md.push({ i: 'bonus', x: 5, y: 4, w: 5, h: 1 });
                parsed.sm.push({ i: 'bonus', x: 0, y: 5, w: 6, h: 1 });
            }
            // Upgrade: add 'quest' if missing from saved layout
            if (!parsed.lg.find(item => item.i === 'quest')) {
                parsed.lg.push({ i: 'quest', x: 8, y: 2, w: 4, h: 1 });
                parsed.md.push({ i: 'quest', x: 0, y: 5, w: 5, h: 1 });
                parsed.sm.push({ i: 'quest', x: 0, y: 6, w: 6, h: 1 });
            }
            localStorage.setItem('family_dashboard_layout', JSON.stringify(parsed));
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
