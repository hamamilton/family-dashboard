import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

const getMockGroceries = () => [
    { id: 'mock-1', name: 'Milk', is_checked: false },
    { id: 'mock-2', name: 'Eggs', is_checked: false },
    { id: 'mock-3', name: 'Bread', is_checked: true }
];

const loadLocalGroceries = () => {
    const localData = localStorage.getItem('family_dashboard_groceries');
    if (localData) {
        try {
            return JSON.parse(localData);
        } catch (e) {
            return getMockGroceries();
        }
    }
    return getMockGroceries();
};

export function useGroceries() {
    const [groceries, setGroceries] = useState(loadLocalGroceries());
    const [loading, setLoading] = useState(false);

    const fetchGroceries = useCallback(async () => {
        try {
            const records = await pb.collection('groceries').getFullList({ sort: 'created' });
            setGroceries(records);
            localStorage.setItem('family_dashboard_groceries', JSON.stringify(records));
        } catch (err) {
            console.warn("Could not fetch groceries from Pocketbase. Falling back to local data.", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroceries();
        pb.collection('groceries').subscribe('*', fetchGroceries);
        return () => pb.collection('groceries').unsubscribe();
    }, [fetchGroceries]);

    const addGrocery = async (name) => {
        const itemWithId = { id: `temp-${Date.now()}`, name, is_checked: false };
        setGroceries(prev => {
            const next = [...prev, itemWithId];
            localStorage.setItem('family_dashboard_groceries', JSON.stringify(next));
            return next;
        });

        try {
            const record = await pb.collection('groceries').create({ name, is_checked: false });
            setGroceries(prev => prev.map(g => g.id === itemWithId.id ? record : g));
        } catch (err) {
            console.warn("Could not save grocery to Pocketbase.", err);
        }
    };

    const toggleGrocery = async (id) => {
        const item = groceries.find(g => g.id === id);
        if (!item) return;

        setGroceries(prev => {
            const next = prev.map(g => g.id === id ? { ...g, is_checked: !g.is_checked } : g);
            localStorage.setItem('family_dashboard_groceries', JSON.stringify(next));
            return next;
        });

        if (!id.startsWith('temp-')) {
            try {
                await pb.collection('groceries').update(id, { is_checked: !item.is_checked });
            } catch (err) {
                console.warn("Could not update grocery in Pocketbase.", err);
            }
        }
    };

    const clearChecked = async () => {
        const checkedItems = groceries.filter(g => g.is_checked);
        
        setGroceries(prev => {
            const next = prev.filter(g => !g.is_checked);
            localStorage.setItem('family_dashboard_groceries', JSON.stringify(next));
            return next;
        });

        for (const item of checkedItems) {
            if (!item.id.startsWith('temp-')) {
                try {
                    await pb.collection('groceries').delete(item.id);
                } catch (err) {
                    console.warn(`Could not delete grocery ${item.id} in Pocketbase.`, err);
                }
            }
        }
    };

    return { groceries, loading, addGrocery, toggleGrocery, clearChecked };
}
