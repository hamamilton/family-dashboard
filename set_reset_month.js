import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function setLastResetMonth() {
  try {
    await pb.admins.authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');
    const profiles = await pb.collection('profiles').getFullList();
    for (const p of profiles) {
      await pb.collection('profiles').update(p.id, { last_reset_month: '2026-07' });
      console.log(`Updated ${p.name} last_reset_month`);
    }
  } catch(e) {
    console.error("Error:", e.response || e);
  }
}
setLastResetMonth();
