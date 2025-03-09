
export default function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
        console.error("Missing Google Maps API Key");
        return res.status(500).json({ error: "Missing Google Maps API Key" });
    }

    res.json({ key: API_KEY });
}
