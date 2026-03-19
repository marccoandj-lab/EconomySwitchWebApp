import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 9000;

// Serve static files from the dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Socket.io logic for room-based multiplayer
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create-room', (roomId) => {
    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room: ${roomId}`);
  });

  socket.on('message', (data) => {
    // data should contain { roomId, msg }
    const { roomId, msg } = data;
    // Broadcast to everyone in the room except sender (if needed) or everyone
    // For this game's logic, we often broadcast to everyone
    io.to(roomId).emit('message', { senderId: socket.id, msg });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
