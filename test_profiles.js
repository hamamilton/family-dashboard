import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const res = await pb.collection('profiles').getFullList();
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
