import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ExpressPeerServer } from 'peer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 9000;

// Serve static files from the dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// PeerJS Signaling Server
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/',
  proxied: true // Important for Render/Vercel reverse proxies
});

app.use('/peerjs', peerServer);

// Wildcard for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
