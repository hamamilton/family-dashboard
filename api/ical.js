export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const fetchRes = await fetch(targetUrl);
        
        if (!fetchRes.ok) {
            return res.status(fetchRes.status).send(`Failed to fetch: ${fetchRes.statusText}`);
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
