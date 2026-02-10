"use client";
import { MusicContext } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { logListeningEvent } from "@/lib/listening-events";
import {
  addUserPlaylistSong,
  createUserPlaylist,
  deleteUserPlaylist,
  getUserPlaylists,
  removeUserPlaylistSong,
} from "@/lib/playlists";
import { useCallback, useEffect, useRef, useState } from "react";

const LIKED_PLAYLIST_NAME = "Liked Songs";
const LIKED_PLAYLIST_PREFIX = "liked_";

const getLikedPlaylistId = (userId) => (userId ? `${LIKED_PLAYLIST_PREFIX}${userId}` : null);

const isLikedPlaylistId = (playlistId, userId) =>
  Boolean(playlistId && userId && playlistId === getLikedPlaylistId(userId));

const sortPlaylists = (items = [], likedPlaylistId = null) => {
  const seen = new Set();
  const normalized = [];
  for (const item of items || []) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    normalized.push({
      ...item,
      createdAt: Number(item.createdAt) || Date.now(),
      songs: Array.isArray(item.songs) ? item.songs : [],
    });
  }

  normalized.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!likedPlaylistId) return normalized;
  const liked = normalized.find((playlist) => playlist.id === likedPlaylistId);
  if (!liked) return normalized;
  return [liked, ...normalized.filter((playlist) => playlist.id !== likedPlaylistId)];
};

const isMissingPlaylistTableError = (error) => {
  const message = String(error?.message || "");
  return (
    error?.code === "PGRST205" ||
    message.includes("Could not find the table 'public.playlists'") ||
    message.includes("Could not find the table 'public.playlist_songs'")
  );
};

const playlistSetupError = () =>
  new Error("Playlists are not configured yet. Run supabase/playlists.sql in Supabase.");

export default function MusicProvider({ children }) {
  const { user } = useAuth();
  const [music, setMusic] = useState(null);
  const previousMusicRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("song-history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [playLog, setPlayLog] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("song-play-log");
      if (!saved) return [];
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((entry) => entry && typeof entry.id === "string")
          .map((entry) => ({
            id: entry.id,
            playedAt: Number(entry.playedAt) || Date.now(),
          }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [queue, setQueue] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [playlistBackendMissing, setPlaylistBackendMissing] = useState(false);
  const likedPlaylistId = getLikedPlaylistId(user?.id);
  const likedPlaylist = likedPlaylistId
    ? playlists.find((playlist) => playlist.id === likedPlaylistId) || null
    : null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("last-played");
    }
  }, []);

  useEffect(() => {
    if (!music) setPlayerOpen(false);
  }, [music]);

  useEffect(() => {
    localStorage.setItem("song-history", JSON.stringify(history.slice(-50)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("song-play-log", JSON.stringify(playLog.slice(-300)));
  }, [playLog]);

  const refreshPlaylists = useCallback(async () => {
    if (!user?.id) {
      setPlaylists([]);
      setPlaylistBackendMissing(false);
      return { ok: true, error: null };
    }
    const systemLikedId = getLikedPlaylistId(user.id);
    const { data, error } = await getUserPlaylists({ userId: user.id });
    if (error) {
      if (isMissingPlaylistTableError(error)) {
        setPlaylistBackendMissing(true);
        setPlaylists([]);
        return { ok: false, error };
      }
      setPlaylistBackendMissing(false);
      console.warn("Failed to load playlists:", error.message || error);
      setPlaylists([]);
      return { ok: false, error };
    }

    let nextPlaylists = Array.isArray(data) ? data : [];
    const likedExists = nextPlaylists.some((playlist) => playlist.id === systemLikedId);

    if (!likedExists) {
      const liked = {
        id: systemLikedId,
        name: LIKED_PLAYLIST_NAME,
        createdAt: 0,
        songs: [],
      };
      const { error: createError } = await createUserPlaylist({
        userId: user.id,
        playlist: liked,
      });
      if (createError) {
        if (isMissingPlaylistTableError(createError)) {
          setPlaylistBackendMissing(true);
          setPlaylists([]);
          return { ok: false, error: createError };
        }
        console.warn("Failed to ensure liked songs playlist:", createError.message || createError);
      } else {
        nextPlaylists = [liked, ...nextPlaylists];
      }
    }

    setPlaylistBackendMissing(false);
    setPlaylists(sortPlaylists(nextPlaylists, systemLikedId));
    return { ok: true, error: null };
  }, [user?.id]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;
    const onFocus = () => {
      if (playlistBackendMissing) refreshPlaylists();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id, playlistBackendMissing, refreshPlaylists]);

  const createPlaylist = async (name = "My Playlist") => {
    if (!user?.id) return { data: null, error: new Error("Please login first") };
    if (playlistBackendMissing) {
      const { ok, error } = await refreshPlaylists();
      if (!ok && isMissingPlaylistTableError(error)) {
        return { data: null, error: playlistSetupError() };
      }
    }
    const trimmed = String(name).trim();
    const safeName = trimmed || "My Playlist";
    if (safeName.toLowerCase() === LIKED_PLAYLIST_NAME.toLowerCase()) {
      return {
        data: null,
        error: new Error(`"${LIKED_PLAYLIST_NAME}" is reserved for your likes`),
      };
    }
    const playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: safeName,
      createdAt: Date.now(),
      songs: [],
    };
    setPlaylists((prev) => sortPlaylists([playlist, ...prev], getLikedPlaylistId(user.id)));
    const { error } = await createUserPlaylist({ userId: user.id, playlist });
    if (error) {
      if (isMissingPlaylistTableError(error)) {
        setPlaylistBackendMissing(true);
        const friendlyError = playlistSetupError();
        setPlaylists((prev) => prev.filter((item) => item.id !== playlist.id));
        return { data: null, error: friendlyError };
      } else {
        console.warn("Failed to create playlist:", error.message || error);
      }
      setPlaylists((prev) => prev.filter((item) => item.id !== playlist.id));
      return { data: null, error };
    }
    return { data: playlist, error: null };
  };

  const deletePlaylist = async (playlistId) => {
    if (!user?.id) return { error: new Error("Please login first") };
    if (isLikedPlaylistId(playlistId, user.id)) {
      return { error: new Error("Liked Songs playlist cannot be deleted") };
    }
    if (playlistBackendMissing) {
      const { ok, error } = await refreshPlaylists();
      if (!ok && isMissingPlaylistTableError(error)) {
        return { error: playlistSetupError() };
      }
    }
    const previous = playlists;
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId));
    const { error } = await deleteUserPlaylist({ userId: user.id, playlistId });
    if (error) {
      if (isMissingPlaylistTableError(error)) {
        setPlaylistBackendMissing(true);
        setPlaylists(previous);
        return { error: playlistSetupError() };
      } else {
        console.warn("Failed to delete playlist:", error.message || error);
      }
      setPlaylists(previous);
      return { error };
    }
    return { error: null };
  };

  const ensureLikedPlaylist = useCallback(async () => {
    if (!user?.id) return { data: null, error: new Error("Please login first") };
    if (playlistBackendMissing) {
      const { ok, error } = await refreshPlaylists();
      if (!ok && isMissingPlaylistTableError(error)) {
        return { data: null, error: playlistSetupError() };
      }
    }

    const id = getLikedPlaylistId(user.id);
    const existing = playlists.find((playlist) => playlist.id === id);
    if (existing) return { data: existing, error: null };

    const liked = {
      id,
      name: LIKED_PLAYLIST_NAME,
      createdAt: 0,
      songs: [],
    };

    setPlaylists((prev) => sortPlaylists([liked, ...prev], id));
    const { error } = await createUserPlaylist({ userId: user.id, playlist: liked });
    if (error) {
      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id));
      if (isMissingPlaylistTableError(error)) {
        setPlaylistBackendMissing(true);
        return { data: null, error: playlistSetupError() };
      }
      return { data: null, error };
    }
    return { data: liked, error: null };
  }, [playlists, playlistBackendMissing, refreshPlaylists, user?.id]);

  const addSongToPlaylist = async (playlistId, song) => {
    if (!user?.id) return { error: new Error("Please login first") };
    if (!playlistId || !song?.id) return { error: new Error("Invalid song or playlist") };
    if (playlistBackendMissing) {
      const { ok, error } = await refreshPlaylists();
      if (!ok && isMissingPlaylistTableError(error)) {
        return { error: playlistSetupError() };
      }
    }
    const payload = {
      id: String(song.id),
      name: String(song.name || "Unknown"),
      artist: String(song.artist || "unknown"),
      image: String(song.image || ""),
      playCount: Number(song.playCount) || 0,
      addedAt: new Date().toISOString(),
    };
    const previous = playlists;
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        if (playlist.songs.some((item) => item.id === payload.id)) return playlist;
        return { ...playlist, songs: [payload, ...playlist.songs] };
      })
    );
    const { error } = await addUserPlaylistSong({ userId: user.id, playlistId, song: payload });
    if (error) {
      if (isMissingPlaylistTableError(error)) {
        setPlaylistBackendMissing(true);
        setPlaylists(previous);
        return { error: playlistSetupError() };
      } else {
        console.warn("Failed to add song to playlist:", error.message || error);
      }
      setPlaylists(previous);
      return { error };
    }
    return { error: null };
  };

  const addSongToLiked = async (song) => {
    if (!song?.id) return { error: new Error("Invalid song") };
    const { data: liked, error } = await ensureLikedPlaylist();
    if (error || !liked?.id) return { error: error || new Error("Failed to load liked songs") };
    return addSongToPlaylist(liked.id, song);
  };

  const removeSongFromLiked = async (songId) => {
    if (!user?.id) return { error: new Error("Please login first") };
    if (!songId) return { error: new Error("Invalid song") };
    const likedId = getLikedPlaylistId(user.id);
    if (!likedId) return { error: new Error("Liked Songs not found") };
    return removeSongFromPlaylist(likedId, String(songId));
  };

  const isSongLiked = useCallback(
    (songId) => {
      if (!songId || !likedPlaylist) return false;
      return likedPlaylist.songs.some((song) => song.id === String(songId));
    },
    [likedPlaylist]
  );

  const toggleLikedSong = async (song) => {
    const songId = String(song?.id || "");
    if (!songId) return { liked: false, error: new Error("Invalid song") };
    const currentlyLiked = isSongLiked(songId);
    if (currentlyLiked) {
      const { error } = await removeSongFromLiked(songId);
      return { liked: false, error: error || null };
    }
    const { error } = await addSongToLiked(song);
    return { liked: true, error: error || null };
  };

  const removeSongFromPlaylist = async (playlistId, songId) => {
    if (!user?.id) return { error: new Error("Please login first") };
    if (playlistBackendMissing) {
      const { ok, error } = await refreshPlaylists();
      if (!ok && isMissingPlaylistTableError(error)) {
        return { error: playlistSetupError() };
      }
    }
    const previous = playlists;
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, songs: playlist.songs.filter((song) => song.id !== songId) }
          : playlist
      )
    );
    const { error } = await removeUserPlaylistSong({ userId: user.id, playlistId, songId });
    if (error) {
      if (isMissingPlaylistTableError(error)) {
        setPlaylistBackendMissing(true);
        setPlaylists(previous);
        return { error: playlistSetupError() };
      } else {
        console.warn("Failed to remove song from playlist:", error.message || error);
      }
      setPlaylists(previous);
      return { error };
    }
    return { error: null };
  };

  useEffect(() => {
    if (!music || previousMusicRef.current === music) return;
    previousMusicRef.current = music;
    const playedAt = Date.now();
    setPlayLog((prev) => {
      const next = [...prev, { id: music, playedAt }];
      return next.slice(-300);
    });
    if (user?.id) {
      logListeningEvent({
        userId: user.id,
        songId: music,
        playedAt: new Date(playedAt).toISOString(),
      }).catch(() => {});
    }
  }, [music]);

  return (
    <MusicContext.Provider
      value={{
        music,
        setMusic,
        current,
        setCurrent,
        history,
        setHistory,
        playLog,
        setPlayLog,
        queue,
        setQueue,
        downloadProgress,
        setDownloadProgress,
        playerOpen,
        setPlayerOpen,
        playRequested,
        setPlayRequested,
        shuffleEnabled,
        setShuffleEnabled,
        audioRef,
        playing,
        setPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        audioURL,
        setAudioURL,
        playlists,
        setPlaylists,
        likedPlaylistId,
        likedPlaylist,
        createPlaylist,
        deletePlaylist,
        ensureLikedPlaylist,
        addSongToPlaylist,
        addSongToLiked,
        removeSongFromPlaylist,
        removeSongFromLiked,
        isSongLiked,
        toggleLikedSong,
        isLikedPlaylist: (playlistId) => isLikedPlaylistId(playlistId, user?.id),
        playlistBackendMissing,
        refreshPlaylists,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
