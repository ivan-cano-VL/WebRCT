// chat.js
// Lógica de chat (solo UI), independiente de WebRTC

import { mostrarMensaje } from "./ui.js";

// Mostrar mi propio mensaje
export function mostrarMensajePropio(nombre, texto) {
  mostrarMensaje(`Yo: ${texto}`, "purple");
}

// Procesar mensaje recibido desde cualquier DataChannel
export function procesarMensajeRecibido(data) {
  const paquete = JSON.parse(data);
  mostrarMensaje(`${paquete.autor}: ${paquete.mensaje}`, "green");
}
