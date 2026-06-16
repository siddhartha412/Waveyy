"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "@/hooks/use-socket";
import { MusicContext } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";

const RoomContext = createContext(null);

export const useRoom = () => useContext(RoomContext);

export default function RoomProvider({ children }) {
  const socket = useSocket();
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const isHostRef = useRef(false);
  
  const { user } = useAuth() || {};
  
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);
  
  // Access player state to sync
  const musicCtx = useContext(MusicContext);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const roomFromUrl = urlParams.get("room");
      if (roomFromUrl) {
        setRoomId(roomFromUrl);
      }
    }
  }, []);

  const musicCtxRef = useRef(musicCtx);
  useEffect(() => {
    musicCtxRef.current = musicCtx;
  }, [musicCtx]);

  const [lastReceivedSong, setLastReceivedSong] = useState(null);

  useEffect(() => {
    if (musicCtx?.music && musicCtx.music !== lastReceivedSong) {
      if (socket && roomId) {
        socket.emit("change-song", roomId, musicCtx.music);
      }
    }
  }, [musicCtx?.music, roomId, socket, lastReceivedSong]);

  useEffect(() => {
    if (!socket || !roomId || !isHost) return;

    const interval = setInterval(() => {
      const currentCtx = musicCtxRef.current;
      if (currentCtx?.playing && currentCtx?.audioRef?.current) {
        socket.emit("sync-time", roomId, currentCtx.audioRef.current.currentTime);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, roomId, isHost]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const userProfile = user ? {
      name: user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || "User",
      avatar: user.user_metadata?.avatar_url || null
    } : {
      name: "Guest",
      avatar: null
    };

    socket.emit("join-room", roomId, userProfile);

    const onRoomUsersUpdate = (users) => {
      setUsersInRoom(users);
    };

    const onUserJoined = (id) => {
      console.log(`User joined: ${id}`);
      // Host can emit current state here if needed
      const currentCtx = musicCtxRef.current;
      if (currentCtx?.music) {
        socket.emit("sync-state", roomId, {
          music: currentCtx.music,
          playing: currentCtx.playing,
          currentTime: currentCtx.currentTime
        });
      }
    };

    const onSyncState = (state) => {
      console.log("Syncing state", state);
      const currentCtx = musicCtxRef.current;
      if (state.music && currentCtx?.setMusic) currentCtx.setMusic(state.music);
      if (state.currentTime !== undefined && currentCtx?.audioRef?.current) {
        currentCtx.audioRef.current.currentTime = state.currentTime;
      }
      if (state.playing && currentCtx?.setPlaying) {
        currentCtx.setPlaying(true);
      }
    };

    const onPlay = (time) => {
      const currentCtx = musicCtxRef.current;
      if (currentCtx?.audioRef?.current && Math.abs(currentCtx.audioRef.current.currentTime - time) > 2) {
         currentCtx.audioRef.current.currentTime = time;
      }
      if (currentCtx?.setPlaying) currentCtx.setPlaying(true);
    };

    const onPause = (time) => {
      const currentCtx = musicCtxRef.current;
      if (currentCtx?.audioRef?.current) currentCtx.audioRef.current.currentTime = time;
      if (currentCtx?.setPlaying) currentCtx.setPlaying(false);
    };

    const onSeek = (time) => {
      const currentCtx = musicCtxRef.current;
      if (currentCtx?.audioRef?.current) currentCtx.audioRef.current.currentTime = time;
    };

    const onChangeSong = (songId) => {
      const currentCtx = musicCtxRef.current;
      setLastReceivedSong(songId);
      if (currentCtx?.setMusic) currentCtx.setMusic(songId);
    };

    const onHostStatus = (status) => {
      setIsHost(status);
    };

    const onSyncTime = (time) => {
      if (isHostRef.current) return;
      const currentCtx = musicCtxRef.current;
      if (currentCtx?.audioRef?.current) {
        const diff = Math.abs(currentCtx.audioRef.current.currentTime - time);
        if (diff > 3) {
           currentCtx.audioRef.current.currentTime = time;
        }
      }
    };

    socket.on("user-joined", onUserJoined);
    socket.on("room-users-update", onRoomUsersUpdate);
    socket.on("sync-state", onSyncState);
    socket.on("play", onPlay);
    socket.on("pause", onPause);
    socket.on("seek", onSeek);
    socket.on("change-song", onChangeSong);
    socket.on("host-status", onHostStatus);
    socket.on("sync-time", onSyncTime);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("room-users-update", onRoomUsersUpdate);
      socket.off("sync-state", onSyncState);
      socket.off("play", onPlay);
      socket.off("pause", onPause);
      socket.off("seek", onSeek);
      socket.off("change-song", onChangeSong);
      socket.off("host-status", onHostStatus);
      socket.off("sync-time", onSyncTime);
    };
  }, [socket, roomId]);

  const joinRoom = (id) => {
    setRoomId(id);
  };

  const leaveRoom = () => {
    setRoomId(null);
  };

  const emitPlay = (time) => {
    if (socket && roomId) socket.emit("play", roomId, time);
  };

  const emitPause = (time) => {
    if (socket && roomId) socket.emit("pause", roomId, time);
  };

  const emitSeek = (time) => {
    if (socket && roomId) socket.emit("seek", roomId, time);
  };

  const emitChangeSong = (songId) => {
    if (socket && roomId) socket.emit("change-song", roomId, songId);
  };

  return (
    <RoomContext.Provider value={{
      roomId,
      joinRoom,
      leaveRoom,
      emitPlay,
      emitPause,
      emitSeek,
      emitChangeSong,
      usersInRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
}
