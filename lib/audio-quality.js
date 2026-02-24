const LOSSLESS_MARKERS = ["lossless", "flac", "wav", "alac", "1411", "24bit", "hi-res", "hires"];

const normalize = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const parseBitrate = (quality = "", url = "") => {
  const qualityText = normalize(quality);
  const qualityMatch = qualityText.match(/(\d+(?:\.\d+)?)\s*(k|kbps|mbps|m)/);
  if (qualityMatch) {
    const value = Number(qualityMatch[1]);
    const unit = qualityMatch[2];
    if (Number.isFinite(value)) {
      if (unit === "m" || unit === "mbps") return Math.round(value * 1000);
      return Math.round(value);
    }
  }

  const urlText = normalize(url);
  const urlMatch = urlText.match(/_(\d{2,4})\.(mp3|mp4|m4a|aac|flac|wav)\b/);
  if (urlMatch) {
    const parsed = Number(urlMatch[1]);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
};

const isLikelyLossless = (quality = "", url = "") => {
  const combined = `${normalize(quality)} ${normalize(url)}`;
  return LOSSLESS_MARKERS.some((marker) => combined.includes(marker));
};

const buildStreamMeta = (entry) => {
  const url = entry?.url || "";
  const quality = entry?.quality || "";
  const bitrate = parseBitrate(quality, url);
  const lossless = isLikelyLossless(quality, url);
  const rank = (lossless ? 1_000_000 : 0) + bitrate;
  return {
    url,
    quality,
    bitrate,
    lossless,
    rank,
  };
};

export const selectBestAudioStream = (downloadUrls = []) => {
  if (!Array.isArray(downloadUrls) || downloadUrls.length === 0) {
    return { url: "", quality: "", bitrate: 0, lossless: false };
  }

  const streams = downloadUrls
    .filter((entry) => entry?.url)
    .map((entry) => buildStreamMeta(entry))
    .sort((left, right) => right.rank - left.rank);

  if (streams.length === 0) {
    return { url: "", quality: "", bitrate: 0, lossless: false };
  }

  return streams[0];
};

export const selectBestAudioUrl = (downloadUrls = []) =>
  selectBestAudioStream(downloadUrls).url || "";

