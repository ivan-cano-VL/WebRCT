import { socket } from "./socket.js";
import { state } from "../core/state.js";

import {
    iniciarConexionCon,
    recibirOffer,
    recibirAnswer,
    recibirCandidate,
    eliminarUsuarioPeer
} from "../core/webrtc.js";

import {
    emitJoinRoom,
    emitOffer,
    emitAnswer,
    emitCandidate
} from "./signalEmit.js";

// Función desde script.js
export function initSocketSignals({ nombre, sala, onSystemMessage }) {

    // Cuando me conecto al servidor
    socket.on("connect", () => {
        state.miId = socket.id;
        state.miNombre = nombre;

        console.log(`[SOCKET] Conectado como ${nombre}`, state.miId);

        emitJoinRoom(sala, nombre);

        onSystemMessage(`Te has unido a la sala "${sala}" como ${nombre}`, "info");
    });

    // Usuarios que ya estaban en la sala cuando entro
    socket.on("existing-users", usuarios => {
        console.log("[SALA] Usuarios ya en la sala:", usuarios);

        usuarios.forEach(u => {
            // Soy el nuevo → inicio conexión (creo Offer) hacia cada uno
            iniciarConexionCon(
                u.id,
                u.nombre,
                offer => emitOffer(u.id, offer, nombre),
                candidate => emitCandidate(u.id, candidate)
            );
        });
    });

    // Aviso cuando entra alguien nuevo (será él quien nos llame)
    socket.on("user-joined", usuario => {
        console.log("[ROOM] Usuario se une:", usuario);
        onSystemMessage(`${usuario.nombre} se ha unido a la sala`, "join");
    });

    // Aviso cuando alguien se va
    socket.on("user-left", usuario => {
        console.log("[ROOM] Usuario salió:", usuario);
        eliminarUsuarioPeer(usuario.id);
        onSystemMessage(`${usuario?.nombre || "Alguien"} ha salido de la sala`, "leave");
    });

    // -----------------------------
    // SIGNALING: Offer / Answer / ICE
    // -----------------------------
    socket.on("offer", ({ from, offer, nombre }) => {
        console.log(`[SIGNAL] Offer recibida de ${nombre}`, from);

        recibirOffer(
            from,
            offer,
            nombre,
            answer => emitAnswer(from, answer),
            candidate => emitCandidate(from, candidate)
        );
    });

    socket.on("answer", ({ from, answer, nombreEmisor }) => {
        console.log("[SIGNAL] Answer recibida de " + nombreEmisor, from);
        recibirAnswer(from, answer);
    });

    socket.on("candidate", ({ from, candidate, nombreEmisor }) => {
        console.log("[SIGNAL] Candidate recibida de " + nombreEmisor, " " + from);
        recibirCandidate(from, candidate);
    });

    // Si quieres seguir usando esto en script.js:
    return { socket, getMyId: () => state.miId };
}
