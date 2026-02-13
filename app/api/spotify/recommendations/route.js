import { NextResponse } from "next/server";
import { getCachedJson, setCachedJson } from "@/lib/redis-server";
import { decodeHTML } from "@/lib/decode-html";

const SPOTIFY_REC_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_TRACK_SEARCH_LIMIT = 8;
const SAAVN_QUERY_RESULTS_LIMIT = 12;
const SAAVN_CANDIDATE_SCAN_LIMIT = 12;
const MATCH_ACCEPTANCE_SCORE = 0.24;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "of",
  "in",
  "to",
  "for",
  "from",
  "song",
  "track",
  "movie",
  "film",
  "official",
  "audio",
  "video",
  "music",
  "version",
]);

const FLAVOR_MARKERS = [
  "remix",
  "lofi",
  "lo fi",
  "slowed",
  "reverb",
  "sped up",
  "nightcore",
  "cover",
  "instrumental",
  "karaoke",
  "acoustic",
  "live",
  "reprised",
  "unplugged",
  "mashup",
  "dj",
];

let cachedToken = null;
let tokenExpiresAt = 0;

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const normalizeText = (value = "") =>
  decodeHTML(String(value || ""))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));

const tokenJaccard = (leftTokens = [], rightTokens = []) => {
  if (!leftTokens.length || !rightTokens.length) return 0;
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  if (!union) return 0;
  return intersection / union;
};

const buildBigrams = (value = "") => {
  const compact = normalizeText(value).replace(/\s+/g, "");
  if (compact.length < 2) {
    return compact ? [compact] : [];
  }
  const pairs = [];
  for (let i = 0; i < compact.length - 1; i += 1) {
    pairs.push(compact.slice(i, i + 2));
  }
  return pairs;
};

const diceCoefficient = (leftValue = "", rightValue = "") => {
  const left = buildBigrams(leftValue);
  const right = buildBigrams(rightValue);
  if (!left.length || !right.length) return 0;

  const freq = new Map();
  for (const gram of left) {
    freq.set(gram, (freq.get(gram) || 0) + 1);
  }

  let matches = 0;
  for (const gram of right) {
    const count = freq.get(gram) || 0;
    if (!count) continue;
    matches += 1;
    if (count === 1) freq.delete(gram);
    else freq.set(gram, count - 1);
  }

  return (2 * matches) / (left.length + right.length);
};

const textSimilarity = (leftValue = "", rightValue = "") => {
  const left = normalizeText(leftValue);
  const right = normalizeText(rightValue);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const tokenScore = tokenJaccard(tokenize(left), tokenize(right));
  const diceScore = diceCoefficient(left, right);
  const containmentBoost =
    left.includes(right) || right.includes(left) ? 0.12 : 0;
  return clamp01(0.55 * diceScore + 0.45 * tokenScore + containmentBoost);
};

const listSimilarity = (leftList = [], rightList = []) => {
  const left = leftList.filter(Boolean);
  const right = rightList.filter(Boolean);
  if (!left.length || !right.length) return 0;

  let best = 0;
  for (const leftItem of left) {
    for (const rightItem of right) {
      best = Math.max(best, textSimilarity(leftItem, rightItem));
    }
  }
  const combined = textSimilarity(left.join(" "), right.join(" "));
  return clamp01(Math.max(best, 0.7 * best + 0.3 * combined));
};

const durationSimilarity = (leftSeconds, rightSeconds) => {
  if (
    !Number.isFinite(leftSeconds) ||
    !Number.isFinite(rightSeconds) ||
    leftSeconds <= 0 ||
    rightSeconds <= 0
  ) {
    return 0;
  }
  const diff = Math.abs(leftSeconds - rightSeconds);
  return clamp01(1 - diff / 90);
};

const parseYear = (value = "") => {
  const match = String(value || "").match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
};

const detectFlavorSet = (value = "") => {
  const normalized = ` ${normalizeText(value)} `;
  const found = new Set();
  for (const marker of FLAVOR_MARKERS) {
    const normalizedMarker = ` ${normalizeText(marker)} `;
    if (!normalizedMarker.trim()) continue;
    if (normalized.includes(normalizedMarker)) {
      found.add(marker);
    }
  }
  return found;
};

const collectSpotifyArtistNames = (track) =>
  (Array.isArray(track?.artists) ? track.artists : [])
    .map((artist) => artist?.name)
    .filter(Boolean);

const collectSaavnArtistNames = (song) => {
  const names = [];
  const groups = [song?.artists?.primary, song?.artists?.featured, song?.artists?.all];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const artist of group) {
      if (artist?.name) names.push(artist.name);
    }
  }
  return [...new Set(names)];
};

const scoreSpotifySeedCandidate = (track, sourceName, sourceArtist) => {
  const titleScore = textSimilarity(track?.name || "", sourceName || "");
  const artistScore = sourceArtist
    ? listSimilarity(collectSpotifyArtistNames(track), [sourceArtist])
    : 0.5;
  return clamp01(0.78 * titleScore + 0.22 * artistScore);
};

const scoreSaavnCandidate = (saavnSong, spotifyTrack) => {
  const titleScore = textSimilarity(saavnSong?.name || "", spotifyTrack?.name || "");
  const artistScore = listSimilarity(
    collectSaavnArtistNames(saavnSong),
    collectSpotifyArtistNames(spotifyTrack),
  );
  const albumScore = textSimilarity(
    saavnSong?.album?.name || "",
    spotifyTrack?.album?.name || "",
  );
  const durationScore = durationSimilarity(
    Number(saavnSong?.duration || 0),
    Number(spotifyTrack?.duration_ms || 0) / 1000,
  );

  const spotifyYear = parseYear(spotifyTrack?.album?.release_date || "");
  const saavnYear = parseYear(saavnSong?.year || saavnSong?.releaseDate || "");
  let yearScore = 0;
  if (spotifyYear && saavnYear) {
    const diff = Math.abs(spotifyYear - saavnYear);
    if (diff <= 1) yearScore = 1;
    else if (diff <= 3) yearScore = 0.6;
    else if (diff <= 5) yearScore = 0.35;
  }

  const spotifyFlavor = detectFlavorSet(
    `${spotifyTrack?.name || ""} ${spotifyTrack?.album?.name || ""}`,
  );
  const saavnFlavor = detectFlavorSet(
    `${saavnSong?.name || ""} ${saavnSong?.album?.name || ""}`,
  );
  let flavorAdjustment = 0;
  if (spotifyFlavor.size || saavnFlavor.size) {
    const overlap = [...spotifyFlavor].filter((token) => saavnFlavor.has(token)).length;
    if (overlap > 0) flavorAdjustment += 0.04;
    else flavorAdjustment -= 0.1;
  }

  let score =
    0.56 * titleScore +
    0.27 * artistScore +
    0.1 * albumScore +
    0.05 * durationScore +
    0.02 * yearScore +
    flavorAdjustment;

  if (titleScore > 0.92) score += 0.03;
  if (artistScore > 0.92) score += 0.03;

  return clamp01(score);
};

const cleanTrackName = (value = "") => {
  const decoded = decodeHTML(String(value || ""));
  const stripped = decoded
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\s*[-–—]\s*(from|movie|film|official|lyrics?|video|audio).*/gi, " ");
  const clean = stripped.replace(/\s+/g, " ").trim();
  return clean || decoded.trim();
};

const buildSaavnQueries = (spotifyTrack) => {
  const title = cleanTrackName(spotifyTrack?.name || "");
  const originalTitle = String(spotifyTrack?.name || "").trim();
  const firstArtist = spotifyTrack?.artists?.[0]?.name || "";
  const albumName = spotifyTrack?.album?.name || "";
  const queries = [];
  const addQuery = (value) => {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    if (queries.includes(clean)) return;
    queries.push(clean);
  };

  addQuery(`${title} ${firstArtist}`);
  addQuery(`${originalTitle} ${firstArtist}`);
  if (albumName) addQuery(`${title} ${albumName}`);
  addQuery(title);
  if (firstArtist) addQuery(`${firstArtist} ${title}`);

  return queries.slice(0, 5);
};

const getSpotifyAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Spotify token");
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
};

const getOriginFromRequest = (req) => {
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return host ? `${proto}://${host}` : "";
};

const searchJioSaavn = async (origin, query, limit = SAAVN_QUERY_RESULTS_LIMIT) => {
  if (!origin) return null;
  const params = new URLSearchParams({
    path: "searchSongs",
    q: query,
    limit: String(limit),
  });
  const res = await fetch(`${origin}/api/jiosaavn?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
};

const extractSaavnResults = (payload) => {
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.songs)) return payload.data.songs;
  if (Array.isArray(payload?.songs)) return payload.songs;
  if (Array.isArray(payload?.data)) return payload.data;
  return Array.isArray(payload) ? payload : [];
};

const searchSpotifyTracks = async (token, query, limit = SPOTIFY_TRACK_SEARCH_LIMIT) => {
  const res = await fetch(
    `${SPOTIFY_API_BASE}/search?type=track&limit=${limit}&q=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return [];
  const payload = await res.json();
  return Array.isArray(payload?.tracks?.items) ? payload.tracks.items : [];
};

const findBestSpotifySeedTrack = async (token, name, artist) => {
  const queries = [];
  if (artist) queries.push(`track:${name} artist:${artist}`);
  queries.push(`${name} ${artist}`.trim());
  queries.push(name);

  let best = null;
  const seen = new Set();

  for (const query of queries) {
    if (!query) continue;
    const items = await searchSpotifyTracks(token, query);
    for (const item of items) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      const score = scoreSpotifySeedCandidate(item, name, artist);
      if (!best || score > best.score) {
        best = { track: item, score };
      }
    }
    if (best?.score >= 0.95) break;
  }

  return best?.track || null;
};

const getSaavnSearchPayload = async (origin, query, cache) => {
  const key = normalizeText(query);
  if (cache.has(key)) return cache.get(key);
  const payload = await searchJioSaavn(origin, query);
  cache.set(key, payload);
  return payload;
};

const mapSpotifyTrackToSaavn = async (spotifyTrack, origin, searchCache) => {
  const queries = buildSaavnQueries(spotifyTrack);
  let best = null;

  for (const query of queries) {
    const payload = await getSaavnSearchPayload(origin, query, searchCache);
    const candidates = extractSaavnResults(payload).slice(0, SAAVN_CANDIDATE_SCAN_LIMIT);
    for (const candidate of candidates) {
      const score = scoreSaavnCandidate(candidate, spotifyTrack);
      if (!best || score > best.score) {
        best = { song: candidate, score };
      }
    }
    if (best?.score >= 0.94) break;
  }

  if (best && best.score >= MATCH_ACCEPTANCE_SCORE) {
    return best.song;
  }
  return null;
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "";
    const artist = searchParams.get("artist") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 20);
    const cacheKey = `spotify:rec:${name}:${artist}:${limit}`.toLowerCase();

    if (!name) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const cached = await getCachedJson(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

    const token = await getSpotifyAccessToken();
    const seedTrack = await findBestSpotifySeedTrack(token, name, artist);
    const seedTrackId = seedTrack?.id;

    if (!seedTrackId) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const seedArtistId = seedTrack?.artists?.[0]?.id || "";
    const recParams = new URLSearchParams({
      limit: String(limit),
      seed_tracks: seedTrackId,
    });
    if (seedArtistId) {
      recParams.set("seed_artists", seedArtistId);
    }

    const recRes = await fetch(
      `${SPOTIFY_API_BASE}/recommendations?${recParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!recRes.ok) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const recData = await recRes.json();
    const tracks = recData?.tracks || [];

    if (!tracks.length) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const origin = getOriginFromRequest(req);
    const results = [];
    const seen = new Set();
    const searchCache = new Map();

    for (const track of tracks) {
      if (results.length >= limit) break;
      const mappedSong = await mapSpotifyTrackToSaavn(track, origin, searchCache);
      if (mappedSong?.id && !seen.has(mappedSong.id)) {
        seen.add(mappedSong.id);
        results.push(mappedSong);
      }
    }

    const payload = { data: results };
    if (results.length > 0) {
      await setCachedJson(cacheKey, payload, SPOTIFY_REC_CACHE_TTL_SECONDS);
    }
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json({ data: [], error: "Spotify recommendations failed" }, { status: 200 });
  }
}
