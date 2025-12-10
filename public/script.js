import { inputTexto, btnEnviar, mostrarMensaje, mostrarAlerta } from "./ui.js";
import { enviarMensajeATodos, iniciarCamaraLocal } from "./webrtc.js";
import { mostrarMensajePropio } from "./chat.js";
import { initSocketSignals } from "./socketSignals.js";
import { toggleMicrofono, microfonoActivo } from "./micro.js";

//---------------------------------------------------------
// IDENTIFICACIÓN + SALA
//---------------------------------------------------------
const nombreNavegador = prompt("Escribe tu nombre:");
const sala = prompt("Nombre de la sala a la que quieres unirte:");

if (!nombreNavegador || !sala) {
  alert("Nombre y sala son obligatorios.");
  throw new Error("Nombre o sala vacíos");
}

//---------------------------------------------------------
// Inicializar signaling (Socket.IO + WebRTC + salas)
//---------------------------------------------------------
const conexionSocket = initSocketSignals({
  nombre: nombreNavegador,
  sala: sala,
  onSystemMessage: mostrarAlerta
});

const socket = conexionSocket.socket
const getMyId = conexionSocket.getMyId

// 👉 Arrancamos la cámara local nada más entrar a la sala
iniciarCamaraLocal().catch(err =>
  console.error("Error iniciando la cámara local:", err)
);

//---------------------------------------------------------
// ENVIAR MENSAJE DE CHAT (a todos los conectados)
//---------------------------------------------------------
btnEnviar.onclick = enviar;
inputTexto.addEventListener("keyup", e => e.key === "Enter" && enviar());

function enviar() {
  const texto = inputTexto.value.trim();
  if (!texto) return;

  const paquete = {
    autor: nombreNavegador,
    mensaje: texto
  };

  enviarMensajeATodos(paquete);              // WebRTC → a todos los peers
  mostrarMensajePropio(nombreNavegador, texto); // UI local
  inputTexto.value = "";
}

