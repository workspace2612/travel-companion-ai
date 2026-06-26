// Amadeus Self-Service API helpers (server-only).
// Activates when AMADEUS_CLIENT_ID + AMADEUS_CLIENT_SECRET are set.

const BASE = "https://test.api.amadeus.com";

let tokenCache: { value: string; expiresAt: number } | null = null;

export function amadeusConfigured(): boolean {
  return !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;
  const id = process.env.AMADEUS_CLIENT_ID!;
  const secret = process.env.AMADEUS_CLIENT_SECRET!;
  const r = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    }),
  });
  if (!r.ok) throw new Error(`Amadeus auth failed: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  tokenCache = { value: j.access_token, expiresAt: Date.now() + j.expires_in * 1000 };
  return tokenCache.value;
}

async function amadeusGet(path: string, params: Record<string, string | number>): Promise<unknown> {
  const token = await getToken();
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const r = await fetch(`${BASE}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Amadeus ${path} ${r.status}: ${body.slice(0, 400)}`);
  }
  return r.json();
}

interface FlightOffer {
  price: { total: string; currency: string };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
    }>;
  }>;
}

export async function searchFlights(args: {
  origin_iata: string;
  destination_iata: string;
  date: string;
  adults?: number;
  max?: number;
}) {
  const data = (await amadeusGet("/v2/shopping/flight-offers", {
    originLocationCode: args.origin_iata.toUpperCase(),
    destinationLocationCode: args.destination_iata.toUpperCase(),
    departureDate: args.date,
    adults: args.adults ?? 1,
    max: args.max ?? 5,
    currencyCode: "INR",
  })) as { data?: FlightOffer[] };
  const offers = (data.data ?? []).map((o) => {
    const it = o.itineraries[0];
    const first = it.segments[0];
    const last = it.segments[it.segments.length - 1];
    return {
      price: Number(o.price.total),
      currency: o.price.currency,
      duration: it.duration,
      stops: it.segments.length - 1,
      carrier: first.carrierCode,
      flight_number: `${first.carrierCode}${first.number}`,
      depart: first.departure,
      arrive: last.arrival,
    };
  });
  return { origin: args.origin_iata, destination: args.destination_iata, date: args.date, offers };
}

export async function searchFlightsFlex(args: {
  origin_iata: string;
  destination_iata: string;
  date: string;
  flex_days?: number;
}) {
  const flex = args.flex_days ?? 3;
  const center = new Date(args.date + "T00:00:00Z");
  const dates: string[] = [];
  for (let d = -flex; d <= flex; d++) {
    const x = new Date(center);
    x.setUTCDate(x.getUTCDate() + d);
    dates.push(x.toISOString().slice(0, 10));
  }
  const results = await Promise.all(
    dates.map(async (date) => {
      try {
        const r = await searchFlights({
          origin_iata: args.origin_iata,
          destination_iata: args.destination_iata,
          date,
          max: 1,
        });
        const cheapest = r.offers[0];
        return cheapest ? { date, price: cheapest.price, currency: cheapest.currency } : null;
      } catch {
        return null;
      }
    }),
  );
  const days = results.filter(Boolean) as Array<{ date: string; price: number; currency: string }>;
  days.sort((a, b) => a.price - b.price);
  return {
    origin: args.origin_iata,
    destination: args.destination_iata,
    window: { center: args.date, flex_days: flex },
    cheapest_day: days[0] ?? null,
    days,
  };
}

interface HotelOffer {
  hotel: { name: string; hotelId: string; cityCode?: string };
  offers?: Array<{ price: { total: string; currency: string }; room?: { description?: { text?: string } } }>;
}

export async function searchHotels(args: {
  city_code: string;
  check_in: string;
  check_out: string;
  adults?: number;
}) {
  // Step 1: hotel IDs in city.
  const list = (await amadeusGet("/v1/reference-data/locations/hotels/by-city", {
    cityCode: args.city_code.toUpperCase(),
  })) as { data?: Array<{ hotelId: string }> };
  const ids = (list.data ?? []).slice(0, 20).map((h) => h.hotelId);
  if (ids.length === 0) {
    return { city: args.city_code, hotels: [], note: "No hotels found for city code." };
  }
  // Step 2: offers for those IDs.
  const offers = (await amadeusGet("/v3/shopping/hotel-offers", {
    hotelIds: ids.join(","),
    checkInDate: args.check_in,
    checkOutDate: args.check_out,
    adults: args.adults ?? 1,
    currency: "INR",
  })) as { data?: HotelOffer[] };
  const hotels = (offers.data ?? []).slice(0, 10).map((h) => {
    const o = h.offers?.[0];
    return {
      name: h.hotel.name,
      hotel_id: h.hotel.hotelId,
      price: o ? Number(o.price.total) : null,
      currency: o?.price.currency ?? "INR",
      room: o?.room?.description?.text ?? null,
    };
  });
  return {
    city: args.city_code,
    check_in: args.check_in,
    check_out: args.check_out,
    hotels,
  };
}
