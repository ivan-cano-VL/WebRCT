// socketSignals.js
// Controla TODO el signaling vía Socket.IO (salas + WebRTC)

import {
  iniciarConexionCon,
  recibirOffer,
  recibirAnswer,
  recibirCandidate,
  eliminarUsuarioPeer
} from "./webrtc.js";
import { actualizarUI_Microfono } from "./webrtc.js";

/**
 * Inicializa toda la lógica de sockets (salas + WebRTC)
 * nombre -> nombre del usuario
 * sala -> nombre de la sala
 * onSystemMessage(texto, color) -> callback para pintar mensajes en la UI
 */

export const socket = io();

export function initSocketSignals( config ) {
  const { nombre, sala, onSystemMessage } = config

  let myId = null;

  socket.on("connect", () => {
    myId = socket.id;

  console.log(`[SOCKET] Conectado como ${nombre}`, myId);

    socket.emit("join-room", sala, nombre);

    onSystemMessage(`Te has unido a la sala "${sala}" como ${nombre}`, "info");
  });

  // Usuarios que ya estaban en la sala cuando entro
  socket.on("existing-users", usuarios => {
    console.log("[SALA] Usuarios ya en la sala:", usuarios);

    usuarios.forEach(u => {
      // Soy el nuevo → inicio conexión (creo Offer) hacia cada uno
      iniciarConexionCon(
        u.id,
        u.nombre,
        offer => socket.emit("offer", { targetId: u.id, offer, from: myId, nombre: nombre }),
        candidate => socket.emit("candidate", { targetId: u.id, candidate, from: myId })
      );
    });
  });

  // Aviso cuando entra alguien nuevo (será él quien nos llame)
  socket.on("user-joined", usuario => {
    console.log("[ROOM] Usuario se une:", usuario);
    onSystemMessage(`${usuario.nombre} se ha unido a la sala`, "join");
    // En nuestro modelo, el que entra nuevo genera las offers,
    // así que aquí no iniciamos nada, solo avisamos.
  });

  // Aviso cuando alguien se va
  socket.on("user-left", usuario => {
    console.log("[ROOM] Usuario salió:", usuario);
    eliminarUsuarioPeer(usuario.id);
    onSystemMessage(`${usuario?.nombre || "Alguien"} ha salido de la sala`, "leave");
    // Opcionalmente, se podría limpiar la RTCPeerConnection aquí más adelante.
  });

  // ---------------------------------------------------------
  // SIGNALING: Offer / Answer / Candidate
  // ---------------------------------------------------------
  socket.on("offer", ({ from, offer, nombre }) => {
    console.log(`[SIGNAL] Offer recibida de ${nombre}`, from);

    recibirOffer(
      from,
      offer,
      nombre,
      answer => socket.emit("answer", { targetId: from, answer, from: myId}),
      candidate => socket.emit("candidate", { targetId: from, candidate, from: myId })
    );
  });

  socket.on("answer", ({ from, answer, nombreEmisor }) => {
    console.log("[SIGNAL] Answer recibida de " + nombreEmisor, from);
    recibirAnswer(from, answer);
  });

  socket.on("candidate", ({ from, candidate, nombreEmisor }) => {
    console.log("[SIGNAL] Candidate recibida de " + nombreEmisor," " + from);
    recibirCandidate(from, candidate);
  });

  // Devolvemos el socket por si más adelante quieres usarlo para otras cosas
  return { socket, getMyId: () => myId };
}


