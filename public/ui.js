// ui.js
export const divMensajes = document.getElementById("mensajes");
export const inputTexto = document.getElementById("texto");
export const btnEnviar = document.getElementById("enviar");
export const localVideo = document.getElementById("local");
export const remoteVideo = document.getElementById("remote");
export const divAlertas = document.getElementById("zona-alertas");

// 🔹 Función para mostrar mensajes en la UI
export function mostrarMensaje(texto, color = "black") {
  const p = document.createElement("p");
  p.textContent = texto;
  p.style.color = color;
  divMensajes.appendChild(p);
}

// 🔹 Mostrar alerta de sistema (entradas/salidas)
export function mostrarAlerta(texto, tipo = "info") {
  const p = document.createElement("p");
  p.textContent = texto;
  switch (tipo) {
    case "join": p.style.color = "green"; break;
    case "leave": p.style.color = "red"; break;
    case "info": p.style.color = "blue"; break;
  }
  divAlertas.appendChild(p);
}
