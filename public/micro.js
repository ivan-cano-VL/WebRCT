import { localStream } from "./webrtc.js";
import { socket } from "./socketSignals.js";

export let microfonoActivo = true;

// Cambia el estado del micro
export function toggleMicrofono() {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    microfonoActivo = !microfonoActivo;
    audioTracks[0].enabled = microfonoActivo;

    return microfonoActivo;
}
