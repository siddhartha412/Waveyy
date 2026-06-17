import { createServer } from "node:http";
import { Server } from "socket.io";
import "dotenv/config";

const port = process.env.PORT || 3001;
const httpServer = createServer((req, res) => {
  res.writeHead(200);
  res.end("Waveyy Socket Server is running");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with your Vercel URL
    methods: ["GET", "POST"],
  },
});

const roomHosts = {};
const roomUsers = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on("join-room", (roomId, userProfile) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    if (!roomHosts[roomId]) {
      roomHosts[roomId] = socket.id;
    }
    
    if (!roomUsers[roomId]) {
      roomUsers[roomId] = {};
    }
    
    roomUsers[roomId][socket.id] = {
      id: socket.id,
      user: userProfile || { name: "Guest" }
    };
    
    // Notify others in the room
    socket.to(roomId).emit("user-joined", socket.id);
    
    // Broadcast updated user list to everyone in the room
    io.to(roomId).emit("room-users-update", Object.values(roomUsers[roomId]));
    
    // Tell this user if they are the host
    socket.emit("host-status", roomHosts[roomId] === socket.id);
  });

  // Sync state
  socket.on("sync-state", (roomId, state) => {
    socket.to(roomId).emit("sync-state", state);
  });

  // Playback events
  socket.on("play", (roomId, time) => {
    socket.to(roomId).emit("play", time);
  });

  socket.on("sync-time", (roomId, time) => {
    socket.to(roomId).emit("sync-time", time);
  });

  socket.on("pause", (roomId, time) => {
    socket.to(roomId).emit("pause", time);
  });

  socket.on("seek", (roomId, time) => {
    socket.to(roomId).emit("seek", time);
  });

  socket.on("change-song", (roomId, songId) => {
    socket.to(roomId).emit("change-song", songId);
  });

  socket.on("request-sync", (roomId) => {
    socket.to(roomId).emit("request-sync");
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    for (const roomId in roomHosts) {
      if (roomHosts[roomId] === socket.id) {
        const clients = io.sockets.adapter.rooms.get(roomId);
        if (clients && clients.size > 0) {
          roomHosts[roomId] = [...clients][0];
          io.to(roomHosts[roomId]).emit("host-status", true);
        } else {
          delete roomHosts[roomId];
        }
      }
    }
    
    for (const roomId in roomUsers) {
      if (roomUsers[roomId] && roomUsers[roomId][socket.id]) {
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit("room-users-update", Object.values(roomUsers[roomId]));
      }
    }
  });
});

httpServer.listen(port, () => {
  console.log(`> Socket server ready on port ${port}`);
});
