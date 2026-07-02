import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const chores = await pb.collection('chores').getFullList();
    for (const c of chores) {
      console.log(`Chore: ${c.chore_name} | XP: ${c.xp_reward} | is_completed: ${c.is_completed} | updated: ${c.updated}`);
    }
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
