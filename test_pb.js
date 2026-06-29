import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const res = await pb.collections.getFullList();
    console.log(res.map(c => c.name));
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
