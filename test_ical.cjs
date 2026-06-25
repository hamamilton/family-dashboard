const ICAL = require('ical.js');

async function testProxy(name, proxyUrl) {
    console.log(`\nTesting proxy: ${name}`);
    console.log("URL:", proxyUrl);
    try {
        const res = await fetch(proxyUrl);
        console.log("Status:", res.status);
        if (!res.ok) {
            console.log("Failed to fetch");
            return;
        }
        const text = await res.text();
        console.log("Text length:", text.length);
        console.log("First 100 chars:", text.substring(0, 100).replace(/\n/g, '\\n'));
    } catch(err) {
        console.error("Fetch error:", err.message);
    }
}

async function test() {
    const url = 'https://churchofjesuschrist.org/church-calendar/services/ext/v3.0/export/ical/group/46d39ccf50994bfbab9a1c924495ef51';
    
    await testProxy('corsproxy.io', `https://corsproxy.io/?${encodeURIComponent(url)}`);
    await testProxy('codetabs', `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`);
    await testProxy('thingproxy', `https://thingproxy.freeboard.io/fetch/${url}`);
}

test();
