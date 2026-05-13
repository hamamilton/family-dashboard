import PocketBase from 'pocketbase';

// Connect to the Raspberry Pi database via Ngrok Tunnel
export const pb = new PocketBase('https://flogging-campsite-untying.ngrok-free.dev');

// Bypass Ngrok's browser interstitial warning page for all API requests
pb.beforeSend = function (url, options) {
    options.headers = Object.assign({}, options.headers, {
        'ngrok-skip-browser-warning': 'true',
    });
    return { url, options };
};