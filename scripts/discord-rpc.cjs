require("dotenv").config();
const RPC = require("discord-rpc");

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BASE_URL = (process.env.DISCORD_ACTIVITY_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const ACTIVITY_ENDPOINT = `${BASE_URL}/api/discord/activity`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || BASE_URL;
const POLL_MS = Number(process.env.DISCORD_RPC_POLL_MS || 5000);

if (!CLIENT_ID) {
  console.error("Missing DISCORD_CLIENT_ID. Add it to your environment before starting RPC.");
  process.exit(1);
}

const rpc = new RPC.Client({ transport: "ipc" });
let lastSignature = "";
let ready = false;

const safeText = (value, fallback) => {
  const text = (value || fallback || "").toString().trim();
  return text.slice(0, 128);
};

const fetchActivity = async () => {
  const res = await fetch(ACTIVITY_ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const syncPresence = async () => {
  if (!ready) return;

  let activity;
  try {
    activity = await fetchActivity();
  } catch (error) {
    console.error("Failed to fetch activity:", error.message);
    return;
  }

  const signature = JSON.stringify({
    active: Boolean(activity?.active),
    songId: activity?.songId || null,
    title: activity?.title || "",
    artist: activity?.artist || "",
    playing: Boolean(activity?.playing),
    durationSeconds: Number(activity?.durationSeconds) || 0,
    positionSeconds: Math.floor(Number(activity?.positionSeconds) || 0),
  });

  if (signature === lastSignature) return;
  lastSignature = signature;

  if (!activity?.active) {
    await rpc.clearActivity();
    return;
  }

  const durationSeconds = Math.max(0, Number(activity.durationSeconds) || 0);
  const positionSeconds = Math.max(0, Number(activity.positionSeconds) || 0);
  const startedAtMs = Date.now() - positionSeconds * 1000;
  const endsAtMs = startedAtMs + durationSeconds * 1000;

  const payload = {
    details: safeText(activity.title, "Listening on Waveyy"),
    state: safeText(activity.artist, "Music"),
    buttons: [{ label: "Open Waveyy", url: APP_URL }],
    instance: false,
  };

  if (activity.playing) {
    payload.startTimestamp = new Date(startedAtMs);
    if (durationSeconds > 0) payload.endTimestamp = new Date(endsAtMs);
  }

  await rpc.setActivity(payload);
};

rpc.on("ready", () => {
  ready = true;
  console.log("Discord RPC connected.");
  syncPresence().catch(() => {});
  setInterval(() => {
    syncPresence().catch((error) => {
      console.error("RPC sync error:", error.message);
    });
  }, POLL_MS);
});

rpc.on("disconnected", () => {
  ready = false;
  console.error("Discord RPC disconnected.");
});

rpc.login({ clientId: CLIENT_ID }).catch((error) => {
  console.error("Discord RPC login failed:", error.message);
  process.exit(1);
});
