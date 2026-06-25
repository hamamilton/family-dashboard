import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function run() {
    const events = await pb.collection('events').getFullList();
    console.log(events.map(e => ({ title: e.title, start: e.start, date: e.date, end: e.end, assigned_to: e.assigned_to })));
}
run();
