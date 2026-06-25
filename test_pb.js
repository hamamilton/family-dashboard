import PocketBase from 'pocketbase';
const pb = new PocketBase('https://hamilton-family-db.fly.dev');
async function test() {
  try {
    const res = await pb.collection('events').create({
      title: 'Test Event Address',
      date: new Date().toISOString(),
      end: new Date().toISOString(),
      assignee: 'Everyone',
      location: '123 Test St',
      address: '456 Fake Ave'
    });
    console.log("Success! Inserted:", res);
    await pb.collection('events').delete(res.id);
  } catch(e) {
    console.error("Error:", e.response);
  }
}
test();
