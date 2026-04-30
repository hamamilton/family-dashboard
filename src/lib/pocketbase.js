import PocketBase from 'pocketbase';

// The "export" keyword here is the handshake for the rest of your app
export const pb = new PocketBase('http://family-hub.local:8090');