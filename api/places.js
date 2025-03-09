export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { lat, lon, type, keyword } = req.query;
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY; 
    
    if (!API_KEY) {
        console.error("Missing Google Maps API Key");
        return res.status(500).json({ error: "Missing Google Maps API Key" });
    }
    
    if (!lat || !lon || !type || !keyword) {
        console.error("Missing required parameters:", { lat, lon, type, keyword });
        return res.status(400).json({ error: "Missing required parameters" });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=2000&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${API_KEY}`;
    console.log("Calling Google Places API with URL:", url.replace(API_KEY, "API_KEY_HIDDEN"));
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.status && data.status !== "OK") {
            console.error("Google Places API error:", data.status, data.error_message);
            return res.status(400).json({ 
                error: "Google Places API error", 
                status: data.status,
                message: data.error_message 
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error("Failed to fetch places data:", error);
        res.status(500).json({ error: "Failed to fetch data", message: error.message });
    }
}
