// webrtc.js
// WebRTC multiusuario (mesh) usando mapas: conexions, dataChannels, etc.

import { procesarMensajeRecibido } from "./chat.js";

export let localStream = null;

// Un RTCPeerConnection por cada usuario
export const conexions = {};        // { peerId: RTCPeerConnection }
// Un DataChannel por usuario (para chat)
export const dataChannels = {};     // { peerId: RTCDataChannel }
// Stream remoto por usuario
const remoteStreams = {};           // { peerId: MediaStream }
// ICE pendientes por usuario
const pendingCandidates = {};       // { peerId: RTCIceCandidate[] }

export const nombresPeers = {}; // Almacen de nombres de usuario

export async function iniciarCamaraLocal() {
  await getLocalStream();
}

// Obtener (y crear si hace falta) el stream local
async function getLocalStream() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    // 🟢 CREAR ETIQUETA COMO EL RESTO
    const contenedor = document.getElementById("camaras");

    // Si ya existe, no lo recreamos
    let wrapper = document.getElementById("wrap-local");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "wrap-local";
      wrapper.style.position = "relative";
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";

      let video = document.createElement("video");
      video.id = "local";
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";

      const label = document.createElement("div");
      label.id = "label-local";
      label.textContent = "Yo";
      label.style.position = "absolute";
      label.style.bottom = "5px";
      label.style.left = "5px";
      label.style.padding = "2px 6px";
      label.style.background = "rgba(0,0,0,0.6)";
      label.style.color = "white";
      label.style.borderRadius = "4px";
      label.style.fontSize = "14px";
      label.style.pointerEvents = "none";

      wrapper.appendChild(video);
      wrapper.appendChild(label);
      contenedor.insertBefore(wrapper, contenedor.firstChild);
    }

    document.getElementById("local").srcObject = localStream;
    console.log("[P2P] Cámara local activada");
  }

  return localStream;
}


// Crear o reutilizar RTCPeerConnection para un peerId
function crearConexion(peerId, onLocalCandidate, nombre) {
  if (conexions[peerId]) {
    return conexions[peerId];
  }

  console.log(`[P2P] Creando RTCPeerConnection con ${nombre}`, peerId);

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  conexions[peerId] = pc;
  pendingCandidates[peerId] = pendingCandidates[peerId] || [];

  pc.onicecandidate = e => {
    if (e.candidate) {
      console.log(`[ICE] Candidate local para ${nombre}`, e.candidate);
      onLocalCandidate(e.candidate);
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[ICE] state con ${nombre} = ` , pc.iceConnectionState);
  };

  pc.onconnectionstatechange = () => {
    console.log(`[P2P] Connection state con ${nombre} = ` , pc.connectionState);
  };

  pc.ontrack = event => {
    console.log(`[P2P] Track remoto recibido de ${nombre}`);

    let stream = remoteStreams[peerId];
    if (!stream) {
      stream = new MediaStream();
      remoteStreams[peerId] = stream;
      adjuntarStreamRemoto(peerId, stream, nombresPeers[peerId]);
    }
    stream.addTrack(event.track);
  };

  // Añadir pistas locales
  if (localStream) {
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
  }

  return pc;
}

// Crea o busca el <video> para un peer y le pone el stream
function adjuntarStreamRemoto(peerId, stream, nombreUsuario = "Usuario") {
  let contenedor = document.getElementById("camaras");

  // Contenedor principal del video con nombre
  let wrapper = document.getElementById(`wrap-${peerId}`);

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = `wrap-${peerId}`;
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";

    // Etiqueta de nombre
    const label = document.createElement("div");
    label.id = `label-${peerId}`;
    label.style.position = "absolute";
    label.style.bottom = "5px";
    label.style.left = "5px";
    label.style.padding = "2px 6px";
    label.style.background = "rgba(0,0,0,0.6)";
    label.style.color = "white";
    label.style.borderRadius = "4px";
    label.style.fontSize = "14px";
    label.style.pointerEvents = "none";

    // Video
    const video = document.createElement("video");
    video.id = `remote-${peerId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    wrapper.appendChild(video);
    wrapper.appendChild(label);
    contenedor.appendChild(wrapper);
  }

  // SIEMPRE: actualizar nombre
  const label = document.getElementById(`label-${peerId}`);
  if (label) label.textContent = nombreUsuario || "Usuario";

  const video = document.getElementById(`remote-${peerId}`);
  if (video) video.srcObject = stream;
}

// ====================
// FLUJO: soy el que llama (creo Offer)
// ====================
export async function iniciarConexionCon(peerId, nombreUsuario, sendOffer, sendCandidate) {
  console.log("[P2P] Iniciando conexión con", nombreUsuario);

  await getLocalStream();
  nombresPeers[peerId] = nombreUsuario;

  const pc = crearConexion(peerId, candidate => sendCandidate(candidate), nombreUsuario);

  // Creamos DataChannel para chat
  const channel = pc.createDataChannel("chat");
  dataChannels[peerId] = channel;

  channel.onopen = () => console.log("[P2P] DataChannel ABIERTO con", peerId);
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
  console.log(`[SIGNAL] Offer recibida de`, peerId);
  nombresPeers[peerId] = nombreUsuario;

  await getLocalStream();
  const pc = crearConexion(peerId, candidate => sendCandidate(candidate));

  pc.ondatachannel = e => {
    console.log("[P2P] DataChannel recibido de", peerId);
    const channel = e.channel;
    dataChannels[peerId] = channel;

    channel.onopen = () => console.log(`[P2P] DataChannel ABIERTO con ${nombre}`, peerId);
    channel.onmessage = ev => {
      procesarMensajeRecibido(ev.data);
    };
  };

  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  console.log("[P2P] Answer creada para", peerId);
  sendAnswer(answer);

  // Aplicar ICE pendientes si hubiera
  if (pendingCandidates[peerId]?.length) {
    for (const c of pendingCandidates[peerId]) {
      await pc.addIceCandidate(c);
    }
    pendingCandidates[peerId] = [];
  }
}

// ====================
// FLUJO: recibo una Answer
// ====================
export async function recibirAnswer(peerId, answer) {
  console.log("[SIGNAL] Answer recibida de", peerId);

  const pc = conexions[peerId];
  if (!pc) {
    console.error("[P2P] No existe RTCPeerConnection para", peerId);
    return;
  }

  await pc.setRemoteDescription(answer);

  if (pendingCandidates[peerId]?.length) {
    for (const c of pendingCandidates[peerId]) {
      await pc.addIceCandidate(c);
    }
    pendingCandidates[peerId] = [];
  }
}

// ====================
// FLUJO: recibo ICE candidate
// ====================
export async function recibirCandidate(peerId, candidate) {
  const pc = conexions[peerId];
  if (!pc || !pc.remoteDescription) {
    pendingCandidates[peerId] = pendingCandidates[peerId] || [];
    pendingCandidates[peerId].push(candidate);
    console.log("[ICE] Candidate guardado en pendientes para", peerId);
    return;
  }

  try {
    await pc.addIceCandidate(candidate);
    console.log("[ICE] Candidate aplicado para", peerId);
  } catch (err) {
    console.error("[ICE ERROR] Error al agregar candidate para", peerId, err);
  }
}

// ====================
// Enviar mensaje de chat a TODOS los peers conectados
// ====================
export function enviarMensajeATodos(paquete) {
  const data = JSON.stringify(paquete);

  const canales = Object.values(dataChannels);
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

  console.log("[P2P] Eliminando conexión con", peerId);

  if (conexions[peerId]) {
    conexions[peerId].close();
    delete conexions[peerId];
  }

  if (dataChannels[peerId]) {
    delete dataChannels[peerId];
  }

  if (nombresPeers[peerId]) {
    delete nombresPeers[peerId];
  }

  if (remoteStreams[peerId]) {
    delete remoteStreams[peerId];
  }

  const wrapper = document.getElementById(`wrap-${peerId}`);
  if (wrapper && wrapper.parentNode) {
    wrapper.parentNode.removeChild(wrapper);
  }
}

