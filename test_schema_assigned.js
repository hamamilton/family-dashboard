import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    await pb.admins.authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');
    const col = await pb.collections.getOne('chores');
    console.log(JSON.stringify(col.schema.find(f => f.name === 'assigned_to'), null, 2));
  } catch(e) {
    console.error("Error:", e.response || e);
  }
}
test();
