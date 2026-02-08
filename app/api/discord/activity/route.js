import { NextResponse } from "next/server";

const STORE_KEY = "__waveyy_discord_activity__";

const getStore = () => {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      active: false,
      updatedAt: Date.now(),
    };
  }
  return globalThis[STORE_KEY];
};

export async function GET() {
  return NextResponse.json(getStore(), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const nextPayload = {
      active: Boolean(payload?.active),
      songId: payload?.songId || null,
      title: payload?.title || "",
      artist: payload?.artist || "",
      album: payload?.album || "",
      playing: Boolean(payload?.playing),
      durationSeconds: Number(payload?.durationSeconds) || 0,
      positionSeconds: Number(payload?.positionSeconds) || 0,
      updatedAt: Date.now(),
    };
    globalThis[STORE_KEY] = nextPayload;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

