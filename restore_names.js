import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function restore() {
  try {
    await pb.admins.authWithPassword('marty@buildu.io', 'vezzaM-kiwdef-9cyzfu');
    const updates = {
      "47tmgbnhln6wu2n": { name: "Pepper", is_parent: false },
      "x5r3x55wyf1p1wj": { name: "Ben", is_parent: false },
      "4vip8uiurrnghst": { name: "Arthur", is_parent: false },
      "byyxnpzl37tj9db": { name: "Curtis", is_parent: false },
      "shxcmnvk9yxnu0z": { name: "Mom", is_parent: true },
      "yex2g9hp4rzuwia": { name: "Marty", is_parent: true }
    };
    
    for (const [id, data] of Object.entries(updates)) {
      await pb.collection('profiles').update(id, data);
      console.log(`Restored ${id} to ${data.name}`);
    }
  } catch(e) {
    console.error("Error:", e.response);
  }
}
restore();
