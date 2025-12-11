// Gestión de la cámara y el micro locales

import { state } from "./state.js";
import { createUIlocal } from "../UI/localUI.js";

export async function getLocalStream() {
    if (!state.localStream) {
        state.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        createUIlocal();

        const videoLocal = document.getElementById("local")
        if (videoLocal) {
            videoLocal.srcObject = state.localStream;
        }
        console.log("[MEDIA] Cámara local activada");
    }

    return state.localStream;
}

export async function iniciarCamaraLocal() {
    await getLocalStream();
}