
export type LumaEventData = {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    start_at: string;
    cover_url: string;
    url: string;
    timezone?: string;
    visibility: string;
    geo_address_json?: {
      city: string;
      [key: string]: any;
    };
  };
};

export async function getUpcomingEvents(): Promise<LumaEventData[]> {
  const apiKey = process.env.LUMA_API;
  
  if (!apiKey) {
    console.warn("LUMA_API environment variable is not set");
    return [];
  }

  try {
    let allEntries: LumaEventData[] = [];
    let nextCursor: string | null = null;
    let hasMore = true;
    let pageCount = 0;
    const MAX_PAGES = 20; // Increase limit to traverse past events (2024-2026)

    console.log("Fetching Luma events...");

    while (hasMore && pageCount < MAX_PAGES) {
      const url = new URL("https://public-api.luma.com/v1/calendar/list-events");
      if (nextCursor) {
        url.searchParams.append("pagination_cursor", nextCursor);
      }

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-luma-api-key": apiKey,
        },
        next: { revalidate: 0 } // Disable cache for immediate updates
      });

      if (!res.ok) {
        console.error(`Luma API error: ${res.status} ${res.statusText}`);
        break;
      }

      const data = (await res.json()) as { entries: LumaEventData[], next_cursor?: string, has_more?: boolean };
      
      if (data.entries && data.entries.length > 0) {
        allEntries = allEntries.concat(data.entries);
      } else {
         // If no entries returned, likely end of list
         hasMore = false;
      }

      if (data.next_cursor) {
        nextCursor = data.next_cursor;
      } else {
        hasMore = false;
      }
      
      pageCount++;
    }
    
    // Filter for events from "Today" onwards (IST perspective)
    const now = new Date();
    
    // Calculate 00:00:00 IST for the current day
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    istDate.setUTCHours(0, 0, 0, 0); // Snap to start of day
    
    // The absolute timestamp for 00:00 IST is (Snapped IST Time - Offset)
    const startOfTodayIST = new Date(istDate.getTime() - istOffset);

    // Filter all accumulated events (Time >= Today AND Visibility == public)
    const upcomingEvents = allEntries.filter(entry => 
      new Date(entry.event.start_at) >= startOfTodayIST && 
      entry.event.visibility === "public"
    );

    // Sort Descending (Future -> Present) as requested
    upcomingEvents.sort((a, b) => new Date(b.event.start_at).getTime() - new Date(a.event.start_at).getTime());

    return upcomingEvents;

  } catch (error) {
    console.error("Failed to fetch Luma events:", error);
    return [];
  }
}
