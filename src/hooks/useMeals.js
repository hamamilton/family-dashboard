import { useState, useEffect, useCallback } from 'react';
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
    const [loading, setLoading] = useState(false);

    const fetchMeals = useCallback(async () => {
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
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeals();
        try {
            pb.collection('meals').subscribe('*', fetchMeals);
        } catch (err) {
            // Ignore
        }
        return () => {
            try {
                pb.collection('meals').unsubscribe();
            } catch (err) { }
        };
    }, [fetchMeals]);

    const updateMeal = async (day, field, value) => {
        const existingMeal = meals.find(m => m.day === day);
        if (!existingMeal) return;

        const updatedMeal = { ...existingMeal, [field]: value };

        setMeals(prev => {
            const next = prev.map(m => m.day === day ? updatedMeal : m);
            localStorage.setItem('family_dashboard_meals', JSON.stringify(next));
            return next;
        });

        try {
            if (existingMeal.id && !existingMeal.id.startsWith('temp-') && !existingMeal.id.startsWith('mock-')) {
                await pb.collection('meals').update(existingMeal.id, { [field]: value });
            } else {
                // If the record doesn't exist yet on PB, we create it
                const record = await pb.collection('meals').create({ 
                    day, 
                    main_dish: updatedMeal.main_dish, 
                    side_dish: updatedMeal.side_dish 
                });
                setMeals(prev => prev.map(m => m.day === day ? record : m));
            }
        } catch (err) {
            console.warn("Could not save meal to Pocketbase.", err);
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

    return { meals, loading, updateMeal, clearMeals };
}
