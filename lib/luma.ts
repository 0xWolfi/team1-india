export interface LumaEvent {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    cover_url: string;
    start_at: string;
    end_at: string;
    url: string;
    location_type: string;
    location_address?: string;
  };
}

export async function getBeforeEvents(): Promise<LumaEvent[]> {
  const API_KEY = process.env.luma_api;
  
  if (!API_KEY) {
    console.warn("Missing process.env.luma_api");
    return [];
  }

  try {
    // Fetch upcoming events
    // Using pagination_limit=4 to get the closest 4
    // Using 'after=now' implicitly by default for upcoming, usually
    const res = await fetch(`https://api.lu.ma/public/v1/calendar/list-events?pagination_limit=4&after=${new Date().toISOString()}`, {
      headers: {
        "x-luma-api-key": API_KEY,
        "accept": "application/json"
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
        // If 404/401, return empty
        const text = await res.text();
        console.error("Luma API Error:", res.status, text);
        return [];
    }

    const json = await res.json();
    
    // The structure typically is { entries: [...] } or { events: [...] }
    // Docs say response has 'entries' list
    return json.entries || [];
  } catch (error) {
    console.error("Failed to fetch Luma events:", error);
    return [];
  }
}
