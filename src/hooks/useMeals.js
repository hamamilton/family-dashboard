import { useState, useEffect, useCallback, useRef } from 'react';
import { pb } from '../lib/pocketbase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMockMeals = () => {
    return DAYS.map((day, index) => ({
        id: `mock-meal-${index}`,
        day: day,
        main_dish: '',
        side_dish: ''
    }));
};

const loadLocalMeals = () => {
    const localData = localStorage.getItem('family_dashboard_meals');
    if (localData) {
        try {
            return JSON.parse(localData);
        } catch (e) {
            return getMockMeals();
        }
    }
    return getMockMeals();
};

export function useMeals() {
    const [meals, setMeals] = useState(loadLocalMeals());
    const [cookedHistory, setCookedHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const lastTyped = useRef(0);
    const updateTimeouts = useRef({});

    const fetchMeals = useCallback(async () => {
        // If we typed in the last 2 seconds, ignore incoming server syncs to avoid jumping cursors.
        if (Date.now() - lastTyped.current < 2000) return;
        try {
            const records = await pb.collection('meals').getFullList();
            
            // Map records to days
            const mealsMap = records.reduce((acc, meal) => {
                acc[meal.day] = meal;
                return acc;
            }, {});

            const fullMealsList = DAYS.map((day, index) => {
                if (mealsMap[day]) return mealsMap[day];
                return { id: `temp-meal-${index}`, day: day, main_dish: '', side_dish: '' };
            });

            setMeals(fullMealsList);
            localStorage.setItem('family_dashboard_meals', JSON.stringify(fullMealsList));
        } catch (err) {
            console.warn("Could not fetch meals from Pocketbase. Falling back to local data.", err);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const records = await pb.collection('cooked_meals').getFullList({
                sort: '-created',
            });
            setCookedHistory(records);
        } catch (err) {
            console.warn("Could not fetch cooked_meals from Pocketbase.");
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchMeals(), fetchHistory()]).finally(() => setLoading(false));

        pb.collection('meals').subscribe('*', fetchMeals);
        pb.collection('cooked_meals').subscribe('*', fetchHistory);

        return () => {
            pb.collection('meals').unsubscribe();
            pb.collection('cooked_meals').unsubscribe();
        };
    }, [fetchMeals, fetchHistory]);

    const updateMeal = async (day, field, value) => {
        lastTyped.current = Date.now();
        
        const existingMeal = meals.find(m => m.day === day);
        if (!existingMeal) return;

        const updatedMeal = { ...existingMeal, [field]: value };

        setMeals(prev => {
            const next = prev.map(m => m.day === day ? updatedMeal : m);
            localStorage.setItem('family_dashboard_meals', JSON.stringify(next));
            return next;
        });

        if (updateTimeouts.current[day]) {
            clearTimeout(updateTimeouts.current[day]);
        }

        updateTimeouts.current[day] = setTimeout(async () => {
            try {
                if (existingMeal.id && !existingMeal.id.startsWith('temp-') && !existingMeal.id.startsWith('mock-')) {
                    await pb.collection('meals').update(existingMeal.id, { [field]: value }, { requestKey: null });
                } else {
                    // Create the record
                    const record = await pb.collection('meals').create({ 
                        day, 
                        main_dish: updatedMeal.main_dish, 
                        side_dish: updatedMeal.side_dish 
                    }, { requestKey: null });
                    
                    // Safely inject the new real ID into the local state without destroying whatever the user just typed!
                    setMeals(prev => prev.map(m => m.day === day ? { ...m, id: record.id } : m));
                }
            } catch (err) {
                if (!err.isAbort) {
                    console.warn("Could not save meal to Pocketbase.", err);
                }
            }
        }, 500);
    };

    const addToHistory = async (meal) => {
        if (!meal.main_dish) return;
        try {
            // Check if it already exists to avoid duplicates
            const existing = cookedHistory.find(h => h.main_dish.toLowerCase() === meal.main_dish.toLowerCase());
            if (existing) {
                await pb.collection('cooked_meals').update(existing.id, {
                    last_cooked: new Date().toISOString()
                });
            } else {
                await pb.collection('cooked_meals').create({
                    main_dish: meal.main_dish,
                    side_dish: meal.side_dish || '',
                    last_cooked: new Date().toISOString()
                });
            }
            fetchHistory();
        } catch (err) {
            console.warn("Could not save to cooked_meals history.", err);
        }
    };

    const clearMeals = async () => {
        const resetMeals = meals.map(m => ({ ...m, main_dish: '', side_dish: '' }));
        
        setMeals(resetMeals);
        localStorage.setItem('family_dashboard_meals', JSON.stringify(resetMeals));

        // Update backend
        for (const meal of resetMeals) {
            if (meal.id && !meal.id.startsWith('temp-') && !meal.id.startsWith('mock-')) {
                try {
                    await pb.collection('meals').update(meal.id, { main_dish: '', side_dish: '' });
                } catch (err) {
                    console.warn("Could not clear meal on Pocketbase", err);
                }
            }
        }
    };

    const getRandomInspiration = () => {
        if (cookedHistory.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * cookedHistory.length);
        return cookedHistory[randomIndex];
    };

    return { meals, cookedHistory, loading, updateMeal, clearMeals, addToHistory, getRandomInspiration };
}
