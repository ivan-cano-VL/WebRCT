import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { registerSignal } from "./signal.js";

// Necesario para tener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Certificados HTTPS
const options = {
  key: fs.readFileSync(path.join(__dirname, "192.168.3.33-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "192.168.3.33.pem"))
};


// 📁 Función para servir archivos desde /public
const serveStatic = (req, res) => {
  let filePath = path.join(__dirname, "../public", req.url === "/" ? "/index.html" : req.url);

  // Detectar extensión para el content-type
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon"
  };

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Archivo no encontrado");
  }
};

// 🌍 Crear servidor HTTPS
const server = https.createServer(options, serveStatic);

// 🚀 Socket.IO
import { Server } from "socket.io";
const io = new Server(server, { cors: { origin: "*" } });

registerSignal(io);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en https://192.168.3.33:${PORT}`);
});
