// webrtc.js
// WebRTC multiusuario (mesh) usando mapas: conexions, dataChannels, etc.

import { procesarMensajeRecibido } from "../UI/chat.js";
import { state } from "./state.js";
import { getLocalStream } from "./media.js";
import { adjuntarStreamRemoto } from "../UI/remoteUI.js";

// Stream remoto por usuario
const remoteStreams = {};           // { peerId: MediaStream }

// Crear o reutilizar RTCPeerConnection para un peerId
function crearConexion(peerId, onLocalCandidate, nombre) {
  nombre = nombre || state.nombresPeers[peerId] || "Desconocido";
  if (state.conexiones[peerId]) {
    return state.conexiones[peerId];
  }

  console.log(`[P2P] Creando RTCPeerConnection con ` + nombre, peerId);

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  state.conexiones[peerId] = pc;
  state.pendingCandidates[peerId] = state.pendingCandidates[peerId] || [];

  pc.onicecandidate = e => {
    if (e.candidate) {
      console.log(`[ICE] Candidate local para ` + nombre, e.candidate);
      onLocalCandidate(e.candidate);
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[ICE] state con = ` + nombre, pc.iceConnectionState);
  };

  pc.onconnectionstatechange = () => {
    console.log(`[P2P] Connection state con = ` + nombre, pc.connectionState);
  };

  pc.ontrack = event => {
    console.log(`[P2P] Track remoto recibido de ` + nombre);

    let stream = remoteStreams[peerId];
    if (!stream) {
      stream = new MediaStream();
      remoteStreams[peerId] = stream;
      adjuntarStreamRemoto(peerId, stream, state.nombresPeers[peerId]);
    }
    stream.addTrack(event.track);
  };

  // Añadir pistas locales
  if (state.localStream) {
    state.localStream.getTracks().forEach(track => {
      pc.addTrack(track, state.localStream);
    });
  }

  return pc;
}

// ====================
// FLUJO: soy el que llama (creo Offer)
// ====================
export async function iniciarConexionCon(peerId, nombreUsuario, sendOffer, sendCandidate) {
  console.log("[P2P] Iniciando conexión con", nombreUsuario);

  await getLocalStream();
  state.nombresPeers[peerId] = nombreUsuario;

  const pc = crearConexion(peerId, candidate => sendCandidate(candidate), nombreUsuario);

  // Creamos DataChannel para chat
  const channel = pc.createDataChannel("chat");
  state.dataChannels[peerId] = channel;

  channel.onopen = () => console.log("[P2P] DataChannel ABIERTO con " + nombreUsuario, peerId);
  channel.onmessage = e => {
    procesarMensajeRecibido(e.data);
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  console.log(`[P2P] Offer creada para ${nombreUsuario} `, peerId);
  sendOffer(offer);
}

// ====================
// FLUJO: recibo una Offer (respondo con Answer)
// ====================
export async function recibirOffer(peerId, offer, nombreUsuario, sendAnswer, sendCandidate) {
  state.nombresPeers[peerId] = nombreUsuario;
  console.log(`[SIGNAL] Offer recibida de ` + nombreUsuario, peerId);

  await getLocalStream();
  const pc = crearConexion(peerId, candidate => sendCandidate(candidate));

  pc.ondatachannel = e => {
    console.log("[P2P] DataChannel recibido de " + nombreUsuario, peerId);
    const channel = e.channel;
    state.dataChannels[peerId] = channel;

    channel.onopen = () => console.log(`[P2P] DataChannel ABIERTO con ` + nombreUsuario, peerId);
    channel.onmessage = ev => {
      procesarMensajeRecibido(ev.data);
    };
  };

  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  const nombre = state.nombresPeers[peerId] || "Desconocido";
  console.log("[P2P] Answer creada para " + nombre, peerId);
  sendAnswer(answer);

  // Aplicar ICE pendientes si hubiera
  if (state.pendingCandidates[peerId]?.length) {
    for (const c of state.pendingCandidates[peerId]) {
      await pc.addIceCandidate(c);
    }
    state.pendingCandidates[peerId] = [];
  }
}

// ====================
// FLUJO: recibo una Answer
// ====================
export async function recibirAnswer(peerId, answer) {
  const nombre = state.nombresPeers[peerId] || "Desconocido";
  console.log("[SIGNAL] Answer recibida de " + nombre, peerId);

  const pc = state.conexiones[peerId];
  if (!pc) {
    console.error("[P2P] No existe RTCPeerConnection para " + nombre, peerId);
    return;
  }

  await pc.setRemoteDescription(answer);

  if (state.pendingCandidates[peerId]?.length) {
    for (const c of state.pendingCandidates[peerId]) {
      await pc.addIceCandidate(c);
    }
    state.pendingCandidates[peerId] = [];
  }
}

// ====================
// FLUJO: recibo ICE candidate
// ====================
export async function recibirCandidate(peerId, candidate) {
  const pc = state.conexiones[peerId];
  if (!pc || !pc.remoteDescription) {
    state.pendingCandidates[peerId] = state.pendingCandidates[peerId] || [];
    state.pendingCandidates[peerId].push(candidate);
    const nombre = state.nombresPeers[peerId] || "Desconocido";
    console.log("[ICE] Candidate guardado en pendientes para " + nombre, peerId);
    return;
  }

  try {
    await pc.addIceCandidate(candidate);
    const nombre = state.nombresPeers[peerId] || "Desconocido";
    console.log("[ICE] Candidate aplicado para " + nombre, peerId);
  } catch (err) {
    console.error("[ICE ERROR] Error al agregar candidate para " + nombre, peerId, err);
  }
}

// ====================
// Enviar mensaje de chat a TODOS los peers conectados
// ====================
export function enviarMensajeATodos(paquete) {
  const data = JSON.stringify(paquete);

  const canales = Object.values(state.dataChannels);
  if (!canales.length) {
    console.warn("[P2P] No hay dataChannels abiertos para enviar mensajes");
  }

  canales.forEach(ch => {
    if (ch.readyState === "open") {
      ch.send(data);
    }
  });
}

export function eliminarUsuarioPeer(peerId) {
  const nombre = state.nombresPeers[peerId] || "Desconocido";
  console.log("[P2P] Eliminando conexión con " + nombre, peerId);

  if (state.conexiones[peerId]) {
    state.conexiones[peerId].close();
    delete state.conexiones[peerId];
  }

  if (state.dataChannels[peerId]) {
    delete state.dataChannels[peerId];
  }

  if (state.nombresPeers[peerId]) {
    delete state.nombresPeers[peerId];
  }

  if (remoteStreams[peerId]) {
    delete remoteStreams[peerId];
  }

  const wrapper = document.getElementById(`wrap-${peerId}`);
  if (wrapper && wrapper.parentNode) {
    wrapper.parentNode.removeChild(wrapper);
  }
}

