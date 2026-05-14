import PocketBase from 'pocketbase';

// Connect to PocketBase hosted on Fly.io (no tunnel needed!)
export const pb = new PocketBase('https://hamilton-family-db.fly.dev');