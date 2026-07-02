import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    await pb.admins.authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');
    const backups = await pb.backups.getFullList();
    console.log("Backups:", backups);
  } catch(e) {
    // maybe superusers
    try {
      await pb.collection('_superusers').authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');
      const backups = await pb.backups.getFullList();
      console.log("Backups:", backups);
    } catch(e2) {
      console.error("Error:", e2.response);
    }
  }
}
test();
