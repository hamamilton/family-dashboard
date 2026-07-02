import PocketBase from 'pocketbase';

const pb = new PocketBase('https://hamilton-family-db.fly.dev');

async function fixChores() {
    try {
        await pb.admins.authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');
        const chores = await pb.collection('chores').getFullList();

        // 1. "B Time" -> Ben ("x5r3x55wyf1p1wj")
        const bTime = chores.find(c => c.chore_name === 'B Time');
        if (bTime && bTime.assigned_to !== 'x5r3x55wyf1p1wj') {
            await pb.collection('chores').update(bTime.id, { assigned_to: 'x5r3x55wyf1p1wj' });
            console.log("Fixed B Time");
        }

        // 2. "Set Table" -> Arthur ("4vip8uiurrnghst")
        const setTable = chores.find(c => c.chore_name.includes('Set Table'));
        if (setTable && setTable.assigned_to !== '4vip8uiurrnghst') {
            await pb.collection('chores').update(setTable.id, { assigned_to: '4vip8uiurrnghst' });
            console.log("Fixed Set Table");
        }

        // 3. "Dishes - Unload & Load" -> Pepper ("47tmgbnhln6wu2n")
        const dishes = chores.find(c => c.chore_name.includes('Dishes - Unload & Load'));
        if (dishes && dishes.assigned_to !== '47tmgbnhln6wu2n') {
            await pb.collection('chores').update(dishes.id, { assigned_to: '47tmgbnhln6wu2n' });
            console.log("Fixed Dishes");
        }
        
        console.log("Done fixing chores!");
    } catch (e) {
        console.error(e);
    }
}

fixChores();
