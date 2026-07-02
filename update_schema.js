import PocketBase from 'pocketbase';

async function updateSchema() {
    const pb = new PocketBase('https://hamilton-family-db.fly.dev');
    await pb.admins.authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');

    const collection = await pb.collections.getOne('profiles');
    
    // Check if it already has last_reset_month
    const hasField = collection.schema.some(f => f.name === 'last_reset_month');
    if (!hasField) {
        collection.schema.push({
            name: 'last_reset_month',
            type: 'text',
            required: false,
            options: { min: null, max: null, pattern: '' }
        });
        
        await pb.collections.update('profiles', collection);
        console.log('Successfully added last_reset_month to profiles schema.');
    } else {
        console.log('last_reset_month already exists in schema.');
    }
}

updateSchema().catch(console.error);
