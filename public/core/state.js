// state.js
// Aquí guardamos el estado global compartido entre módulos

export const state = {
    miId: null,
    miNombre: null,
    salaActual: null,

    localStream: null,

    conexiones: {},        // peerId -> RTCPeerConnection
    dataChannels: {},      // peerId -> RTCDataChannel
    nombresPeers: {},      // peerId -> nombre
    pendingCandidates: {}  // peerId -> []

    
};
// Solo para depuración en consola
window.appState = state;

