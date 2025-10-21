import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { LobbyManager } from "./state";
import { Lobby } from "./types";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(cors());
app.use(express.json());

// serve static files from public directory
app.use("/", express.static("public"));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true }
});

const lobbies = new LobbyManager();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.get("/api/lobbies", (_req, res) => res.json(lobbies.list()));

function emitLobby(lobby: Lobby) {
  io.to(lobby.id).emit("lobby:update", lobbies.toPublic(lobby));
}

io.on("connection", socket => {
  let currentLobbyId: string | undefined;

  socket.on("lobby:create", ({ name, playerName }: { name: string; playerName: string }) => {
    const lobby = lobbies.create(name || "Lobby", socket.id);
    lobbies.join(lobby, socket.id, playerName || "Player");
    socket.join(lobby.id);
    currentLobbyId = lobby.id;
    emitLobby(lobby);
  });

  socket.on("lobby:join", ({ lobbyId, playerName }: { lobbyId: string; playerName: string }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return socket.emit("error", "Lobby not found");
    lobbies.join(lobby, socket.id, playerName || "Player");
    socket.join(lobby.id);
    currentLobbyId = lobby.id;
    emitLobby(lobby);
  });

  socket.on("lobby:leave", () => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby) return;
    lobbies.leave(lobby, socket.id);
    socket.leave(lobby.id);
    emitLobby(lobby);
    currentLobbyId = undefined;
  });

  socket.on("game:start", () => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby) return;
    if (lobby.hostId !== socket.id) return socket.emit("error", "Only host can start");
    try {
      lobbies.start(lobby);
      emitLobby(lobby);
      io.to(lobby.id).emit("game:phase", { phase: lobby.phase, day: lobby.day });
    } catch (e: any) {
      socket.emit("error", e.message || "Cannot start");
    }
  });

  socket.on("chat:send", ({ text }: { text: string }) => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby) return;
    const when = lobby.phase === "night" ? "night" : "day";
    lobby.chat.push({ when, from: socket.id, text: String(text || "").slice(0, 300), at: Date.now() });
    emitLobby(lobby);
  });

  socket.on("day:vote", ({ targetId }: { targetId?: string }) => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby || lobby.phase !== "day") return;
    lobbies.vote(lobby, socket.id, targetId);
    emitLobby(lobby);
  });

  socket.on("day:end", () => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== "day") return;
    const lynchId = lobbies.tallyDay(lobby);
    if (lynchId) {
      const victim = lobby.players[lynchId];
      if (victim) victim.alive = false;
    }
    const win = lobbies.checkWin(lobby);
    if (win) {
      lobby.phase = "ended"; lobby.endedReason = win;
    } else {
      lobby.phase = "night";
    }
    lobby.votes = {};
    emitLobby(lobby);
    io.to(lobby.id).emit("game:phase", { phase: lobby.phase, day: lobby.day });
  });

  socket.on("night:action", ({ kind, targetId }: { kind: "wolf" | "seer" | "doctor"; targetId?: string }) => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby || lobby.phase !== "night") return;
    const me = lobby.players[socket.id];
    if (!me || !me.alive) return;
    if (kind === "wolf" && me.role === "werewolf") lobby.nightActions.wolvesTarget = targetId;
    if (kind === "seer" && me.role === "seer" && targetId) {
      lobby.nightActions.seerPeeks = lobby.nightActions.seerPeeks || {};
      lobby.nightActions.seerPeeks[socket.id] = targetId;
      const target = lobby.players[targetId];
      socket.emit("night:seer_result", { targetId, isWolf: !!target && target.role === "werewolf" });
    }
    if (kind === "doctor" && me.role === "doctor") lobby.nightActions.doctorProtect = targetId;
    emitLobby(lobby);
  });

  socket.on("night:end", () => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== "night") return;
    lobbies.resolveNight(lobby);
    const win = lobbies.checkWin(lobby);
    if (win) {
      lobby.phase = "ended"; lobby.endedReason = win;
    } else {
      lobby.phase = "day";
      lobby.day += 1;
    }
    emitLobby(lobby);
    io.to(lobby.id).emit("game:phase", { phase: lobby.phase, day: lobby.day });
  });

  socket.on("disconnect", () => {
    if (!currentLobbyId) return;
    const lobby = lobbies.get(currentLobbyId);
    if (!lobby) return;
    lobbies.leave(lobby, socket.id);
    emitLobby(lobby);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`werewolf game listening on :${PORT}`);
});
