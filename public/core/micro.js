import { state } from "./state";

export let microfonoActivo = true;

// Cambia el estado del micro
export function toggleMicrofono() {
    if (!state.localStream) return;

    const audioTracks = state.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    microfonoActivo = !microfonoActivo;
    audioTracks[0].enabled = microfonoActivo;

    return microfonoActivo;
}
