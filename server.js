import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  const roomHosts = {};

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      if (!roomHosts[roomId]) {
        roomHosts[roomId] = socket.id;
      }
      
      // Notify others in the room
      socket.to(roomId).emit("user-joined", socket.id);
      
      // Tell this user if they are the host
      socket.emit("host-status", roomHosts[roomId] === socket.id);
    });

    // Sync state (when a new user joins, host can send current state)
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

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // If host disconnects, reassign host
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
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
