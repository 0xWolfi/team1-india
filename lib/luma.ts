import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Shape expected by all consumers (pages, components)
export type LumaEventData = {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    start_at: string;
    end_at?: string;
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

// ── DB → LumaEventData shape converter ──
function dbToLumaEvent(row: {
  apiId: string;
  name: string;
  startAt: Date;
  endAt: Date | null;
  coverUrl: string | null;
  url: string;
  timezone: string | null;
  visibility: string;
  city: string | null;
  geoData: any;
}): LumaEventData {
  return {
    api_id: row.apiId,
    event: {
      api_id: row.apiId,
      name: row.name,
      start_at: row.startAt.toISOString(),
      end_at: row.endAt?.toISOString(),
      cover_url: row.coverUrl || "",
      url: row.url,
      timezone: row.timezone || undefined,
      visibility: row.visibility,
      geo_address_json: row.city ? { city: row.city, ...(row.geoData || {}) } : undefined,
    },
  };
}

// ── READ: Get all events from DB (instant, no API call) ──
export async function getAllEvents(): Promise<LumaEventData[]> {
  const rows = await prisma.lumaEvent.findMany({
    where: { visibility: "public" },
    orderBy: { startAt: "desc" },
  });
  return rows.map(dbToLumaEvent);
}

// ── READ: Get upcoming events from DB (instant) ──
export async function getUpcomingEvents(): Promise<LumaEventData[]> {
  const now = new Date();
  const rows = await prisma.lumaEvent.findMany({
    where: {
      visibility: "public",
      startAt: { gte: now },
    },
    orderBy: { startAt: "asc" },
  });
  return rows.map(dbToLumaEvent);
}

// ── SYNC: Fetch from Luma API and upsert into DB ──
export async function syncLumaEvents(): Promise<{ synced: number; errors: number }> {
  const apiKey = process.env.LUMA_API;
  if (!apiKey) {
    console.warn("LUMA_API environment variable is not set");
    return { synced: 0, errors: 0 };
  }

  try {
    type LumaApiEntry = {
      api_id: string;
      event: {
        api_id: string;
        name: string;
        start_at: string;
        end_at?: string;
        cover_url: string;
        url: string;
        timezone?: string;
        visibility: string;
        geo_address_json?: { city: string; [key: string]: any };
      };
    };

    let allEntries: LumaApiEntry[] = [];
    let nextCursor: string | null = null;
    let hasMore = true;
    let pageCount = 0;
    const MAX_PAGES = 20;

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
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(`Luma API error: ${res.status} ${res.statusText}`);
        break;
      }

      const data = (await res.json()) as {
        entries: LumaApiEntry[];
        next_cursor?: string;
        has_more?: boolean;
      };

      if (data.entries && data.entries.length > 0) {
        allEntries = allEntries.concat(data.entries);
      } else {
        hasMore = false;
      }

      if (data.next_cursor) {
        nextCursor = data.next_cursor;
      } else {
        hasMore = false;
      }

      pageCount++;
    }

    // Upsert all events into DB
    let synced = 0;
    let errors = 0;
    const now = new Date();

    for (const entry of allEntries) {
      try {
        await prisma.lumaEvent.upsert({
          where: { apiId: entry.api_id },
          update: {
            name: entry.event.name,
            startAt: new Date(entry.event.start_at),
            endAt: entry.event.end_at ? new Date(entry.event.end_at) : null,
            coverUrl: entry.event.cover_url || null,
            url: entry.event.url,
            timezone: entry.event.timezone || null,
            visibility: entry.event.visibility,
            city: entry.event.geo_address_json?.city || null,
            geoData: entry.event.geo_address_json || Prisma.JsonNull,
            syncedAt: now,
          },
          create: {
            apiId: entry.api_id,
            name: entry.event.name,
            startAt: new Date(entry.event.start_at),
            endAt: entry.event.end_at ? new Date(entry.event.end_at) : null,
            coverUrl: entry.event.cover_url || null,
            url: entry.event.url,
            timezone: entry.event.timezone || null,
            visibility: entry.event.visibility,
            city: entry.event.geo_address_json?.city || null,
            geoData: entry.event.geo_address_json || Prisma.JsonNull,
            syncedAt: now,
          },
        });
        synced++;
      } catch (err) {
        console.error(`Failed to upsert event ${entry.api_id}:`, err);
        errors++;
      }
    }

    return { synced, errors };
  } catch (error) {
    console.error("Luma sync failed:", error);
    return { synced: 0, errors: 1 };
  }
}
