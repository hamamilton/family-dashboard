import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function run() {
    const events = await pb.collection('events').getFullList();
    const camps = events.filter(e => e.title.includes('Camp'));
    console.log(JSON.stringify(camps.map(e => ({ title: e.title, assignee: e.assignee, assigned_to: e.assigned_to })), null, 2));
}
run();
