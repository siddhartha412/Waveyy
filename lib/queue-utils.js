export const getQueueSongId = (song) => String(song?.id || "");

export const getQueueSongName = (song) => String(song?.name || song?.title || "Unknown");

export const getQueueSongArtist = (song) => {
  if (typeof song?.artist === "string" && song.artist.trim()) return song.artist.trim();
  const primary = Array.isArray(song?.artists?.primary) ? song.artists.primary : [];
  const names = primary.map((artist) => artist?.name).filter(Boolean);
  if (names.length) return names.join(", ");
  return "unknown";
};

export const getQueueSongImage = (song) => {
  if (typeof song?.image === "string") return song.image;
  if (Array.isArray(song?.image)) {
    return song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url || "";
  }
  if (typeof song?.image?.url === "string") return song.image.url;
  return "";
};

export const normalizeQueueSong = (song) => {
  const id = getQueueSongId(song);
  if (!id) return null;

  const name = getQueueSongName(song);
  const artist = getQueueSongArtist(song);
  const image = getQueueSongImage(song);

  return {
    id,
    name,
    image: [{ url: image }, { url: image }, { url: image }],
    artists: { primary: [{ name: artist }] },
    album: { name: song?.album?.name || "unknown" },
    playCount: Number(song?.playCount) || 0,
  };
};

export const mapQueueSongToNextData = (song) => ({
  id: getQueueSongId(song),
  name: getQueueSongName(song),
  artist: getQueueSongArtist(song),
  album: song?.album?.name || "unknown",
  image: getQueueSongImage(song),
});
