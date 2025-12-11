// Gestión de la cámara y el micro locales

import { state } from "./state.js";

export async function getLocalStream() {
  if (!state.localStream) {
    state.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    const contenedor = document.getElementById("camaras");

    let wrapper = document.getElementById("wrap-local");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "wrap-local";
      wrapper.classList.add("wrap-local");

      let video = document.createElement("video");
      video.id = "local";
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;

      const label = document.createElement("div");
      label.id = "label-local";
      label.textContent = "Yo";
      label.classList.add("label-local");

      const btnMic = document.createElement("button");
      btnMic.id = "btnMicVideo";
      btnMic.innerHTML = "🎤";
      btnMic.classList.add("btn-mic");

      btnMic.addEventListener("click", () => {
        const audioTrack = state.localStream.getAudioTracks()[0];
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

    document.getElementById("local").srcObject = state.localStream;
    console.log("[MEDIA] Cámara local activada");
  }

  return state.localStream;
}

export async function iniciarCamaraLocal() {
  await getLocalStream();
}