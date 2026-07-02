import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const chores = await pb.collection('chores').getFullList();
    console.log("Chores assigned_to:", chores.map(c => c.assigned_to).filter(Boolean));
    const events = await pb.collection('events').getFullList();
    console.log("Events assignee:", events.map(e => e.assignee).filter(Boolean));
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
