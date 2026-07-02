import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const chores = await pb.collection('chores').getFullList();
    for (const c of chores) {
      console.log(`Chore: ${c.chore_name} -> Assigned to: ${c.assigned_to}`);
    }
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
