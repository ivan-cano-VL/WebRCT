// remoteUI.js
// TODO lo visual relacionado con los usuarios remotos (vídeo, nombre, icono micro)

export function adjuntarStreamRemoto(peerId, stream, nombreUsuario = "Usuario") {
  const contenedor = document.getElementById("camaras");
  let wrapper = document.getElementById(`wrap-${peerId}`);

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = `wrap-${peerId}`;
    wrapper.classList.add("remote-wrapper");

    // Etiqueta del nombre
    const label = document.createElement("div");
    label.id = `label-${peerId}`;
    label.classList.add("remote-label");

    // Vídeo remoto
    const video = document.createElement("video");
    video.id = `remote-${peerId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.classList.add("remote-video");

    wrapper.appendChild(video);
    wrapper.appendChild(label);

    contenedor.appendChild(wrapper);
  }

  const label = document.getElementById(`label-${peerId}`);
  if (label) label.textContent = nombreUsuario || "Usuario";

  const video = document.getElementById(`remote-${peerId}`);
  if (video) video.srcObject = stream;
}

