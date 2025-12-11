// socket.js
// Punto donde se crea el socket de Socket.IO

import { state } from "../core/state.js";

// Creamos el socket global para toda la app
export const socket = io();

// Cuando se conecta al servidor
socket.on("connect", () => {
  state.miId = socket.id;
  console.log("[SOCKET] Conectado con ID:", state.miId);
});

// Cuando se desconecta del servidor (por cerrar pestaña, perder conexión, etc.)
socket.on("disconnect", () => {
  console.log("[SOCKET] Desconectado del servidor");
});
