import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const res = await pb.collection('chores').getList(1, 1);
    if (res.items.length > 0) {
      console.log("Updated string from PB:", res.items[0].updated);
      console.log("Parsed Date:", new Date(res.items[0].updated));
    }
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
