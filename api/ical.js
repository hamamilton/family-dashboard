export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Normalize webcal:// or webcals:// protocols
    targetUrl = targetUrl.trim().replace(/^webcals?:\/\//i, 'https://');

    try {
        const fetchRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'FamilyHub-Calendar/1.0',
                'Accept': 'text/calendar, text/plain, */*'
            },
            redirect: 'follow'
        });
        
        if (!fetchRes.ok) {
            return res.status(fetchRes.status).send(`Failed to fetch (${fetchRes.status}): ${fetchRes.statusText}`);
        }

        const text = await fetchRes.text();
        
        // Return CORS headers and the iCal text
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.status(200).send(text);
    } catch (error) {
        console.error('Proxy fetch error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
