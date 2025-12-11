// localUI.js
// Se encarga SOLO de crear la UI del video local (wrapper, video, label, botón mic)

import { state } from "../core/state.js";

export function createUIlocal() {
  const contenedor = document.getElementById("camaras");
  if (!contenedor) return;

  let wrapper = document.getElementById("wrap-local");
  if (wrapper) {
    // Ya está creada la UI, no hacemos nada
    return;
  }

  wrapper = document.createElement("div");
  wrapper.id = "wrap-local";
  wrapper.classList.add("wrap-local");

  // Vídeo local
  const video = document.createElement("video");
  video.id = "local";
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;

  // Etiqueta "Yo"
  const label = document.createElement("div");
  label.id = "label-local";
  label.textContent = "Yo";
  label.classList.add("label-local");

  // Botón de micro
  const btnMic = document.createElement("button");
  btnMic.id = "btnMicVideo";
  btnMic.innerHTML = "🎤";
  btnMic.classList.add("btn-mic");

  btnMic.addEventListener("click", () => {
    const audioTrack = state.localStream?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    btnMic.innerHTML = audioTrack.enabled ? "🎤" : "🔇";
    btnMic.classList.toggle("muted", !audioTrack.enabled);
  });

  wrapper.appendChild(video);
  wrapper.appendChild(label);
  wrapper.appendChild(btnMic);

  contenedor.insertBefore(wrapper, contenedor.firstChild);
}
