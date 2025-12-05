// signal.js

export function registerSignal(io) {
  io.on("connection", socket => {
    console.log("[IO] Cliente conectado:", socket.id);

    // Unirse a una sala con nombre y usuario
    socket.on("join-room", async ({ sala, nombre }) => {
      socket.sala = sala;
      socket.nombre = nombre;

      await socket.join(sala);
      console.log(`[ROOM] ${nombre} (${socket.id}) se une a sala: ${sala}`);

      // Obtener otros usuarios de la sala
      const socketsEnSala = await io.in(sala).fetchSockets();
      const otros = socketsEnSala
        .filter(s => s.id !== socket.id)
        .map(s => ({ id: s.id, nombre: s.nombre || "Desconocido" }));

      // Enviar al nuevo usuario la lista de los que ya están
      socket.emit("existing-users", otros);

      // Avisar al resto de la sala de que entra uno nuevo
      socket.to(sala).emit("user-joined", {
        id: socket.id,
        nombre
      });
    });

    // OFFER dirigida a un usuario concreto
    socket.on("offer", ({ targetId, offer, from, nombre }) => {
      console.log(`[SIGNAL] Offer de ${from} → ${targetId}(nombre: ${nombre})`);
      io.to(targetId).emit("offer", { from, offer, nombre });
    });

    // ANSWER dirigida
    socket.on("answer", ({ targetId, answer, from }) => {
      console.log(`[SIGNAL] Answer de ${from} → ${targetId}`);
      io.to(targetId).emit("answer", { from, answer });
    });

    // ICE CANDIDATE dirigida
    socket.on("candidate", ({ targetId, candidate, from }) => {
      console.log(`[SIGNAL] Candidate de ${from} → ${targetId}`);
      io.to(targetId).emit("candidate", { from, candidate });
    });

    socket.on("disconnect", () => {
      console.log(`[IO] Cliente desconectado: ${socket.id} (${socket.nombre || "sin nombre"})`);
      if (socket.sala) {
        socket.to(socket.sala).emit("user-left", {
          id: socket.id,
          nombre: socket.nombre
        });
      }
    });
  });
}
