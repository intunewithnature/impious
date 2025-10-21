import { Lobby, Player, Role } from "./types";
import { randomUUID } from "crypto";

export class LobbyManager {
  private lobbies = new Map<string, Lobby>();

  list() {
    return Array.from(this.lobbies.values()).map(l => ({
      id: l.id, name: l.name, phase: l.phase, players: Object.keys(l.players).length, day: l.day
    }));
  }

  get(id: string) {
    return this.lobbies.get(id);
  }

  create(name: string, hostId: string): Lobby {
    const id = randomUUID().slice(0, 8);
    const lobby: Lobby = {
      id, name, hostId,
      players: {},
      phase: "lobby",
      day: 0,
      votes: {},
      nightActions: {},
      chat: [],
      createdAt: Date.now()
    };
    this.lobbies.set(id, lobby);
    return lobby;
  }

  join(lobby: Lobby, playerId: string, name: string): Player {
    const p: Player = { id: playerId, name, alive: true };
    lobby.players[playerId] = p;
    return p;
  }

  leave(lobby: Lobby, playerId: string) {
    delete lobby.players[playerId];
    // if host left, pass host to first remaining player
    if (lobby.hostId === playerId) {
      const next = Object.keys(lobby.players)[0];
      if (next) lobby.hostId = next;
    }
  }

  start(lobby: Lobby) {
    const count = Object.values(lobby.players).length;
    if (count < 4) throw new Error("Need at least 4 players");
    this.assignRoles(lobby);
    lobby.phase = "night"; // classic starts at night
    lobby.day = 0;
    lobby.votes = {};
    lobby.nightActions = {};
  }

  private assignRoles(lobby: Lobby) {
    const players = Object.values(lobby.players);
    // baseline ratios
    const wolves = Math.max(1, Math.floor(players.length / 4));
    const roles: Role[] = [];
    for (let i = 0; i < wolves; i++) roles.push("werewolf");
    roles.push("seer");
    roles.push("doctor");
    while (roles.length < players.length) roles.push("villager");
    // shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    players.forEach((p, i) => { p.role = roles[i]; p.alive = true; });
  }

  vote(lobby: Lobby, voterId: string, targetId?: string) {
    lobby.votes[voterId] = targetId;
  }

  tallyDay(lobby: Lobby): string | undefined {
    const counts: Record<string, number> = {};
    Object.values(lobby.players).forEach(p => { if (p.alive) counts[p.id] = 0; });
    Object.entries(lobby.votes).forEach(([voter, target]) => {
      if (!target) return;
      const voterAlive = lobby.players[voter]?.alive;
      const targetAlive = lobby.players[target]?.alive;
      if (voterAlive && targetAlive) counts[target] = (counts[target] || 0) + 1;
    });
    let best: string | undefined;
    let max = 0;
    for (const [pid, c] of Object.entries(counts)) {
      if (c > max) { max = c; best = pid; }
    }
    // simple majority, tie = no lynch
    const alive = Object.values(lobby.players).filter(p => p.alive).length;
    if (best && max > Math.floor(alive / 2)) return best;
  }

  resolveNight(lobby: Lobby) {
    const { wolvesTarget, doctorProtect } = lobby.nightActions;
    if (wolvesTarget && wolvesTarget !== doctorProtect) {
      const victim = lobby.players[wolvesTarget];
      if (victim) victim.alive = false;
    }
    // clear night actions
    lobby.nightActions = {};
  }

  checkWin(lobby: Lobby): Lobby["endedReason"] | undefined {
    const alive = Object.values(lobby.players).filter(p => p.alive);
    const wolves = alive.filter(p => p.role === "werewolf").length;
    const town = alive.length - wolves;
    if (wolves === 0) return "village_win";
    if (wolves >= town) return "wolves_win";
  }

  toPublic(lobby: Lobby) {
    return {
      id: lobby.id,
      name: lobby.name,
      hostId: lobby.hostId,
      phase: lobby.phase,
      day: lobby.day,
      players: Object.values(lobby.players).map(p => ({
        id: p.id, name: p.name, alive: p.alive, role: undefined
      })),
      votes: lobby.votes,
      chat: lobby.chat.slice(-50),
      endedReason: lobby.endedReason
    };
  }
}
