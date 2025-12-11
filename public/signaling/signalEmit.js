import { socket } from "./socket.js";
import { state } from "../core/state.js";

// Unirse a una sala
export function emitJoinRoom(sala, nombre) {
    socket.emit("join-room", sala, nombre);
}

// Enviar una OFFER a un usuario
export function emitOffer(targetId, offer, nombre) {
    socket.emit("offer", {
        targetId,
        offer,
        from: state.miId,
        nombre
    });
}

// Enviar una ANSWER a un usuario
export function emitAnswer(targetId, answer) {
    socket.emit("answer", {
        targetId,
        answer,
        from: state.miId
    });
}

// Enviar un ICE candidate a un usuario
export function emitCandidate(targetId, candidate) {
    socket.emit("candidate", {
        targetId,
        candidate,
        from: state.miId
    });
}