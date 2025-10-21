export type Role = "villager" | "werewolf" | "seer" | "doctor";
export type Phase = "lobby" | "day" | "night" | "ended";

export interface Player {
  id: string;           // socket id
  name: string;
  role?: Role;
  alive: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  hostId: string;
  players: Record<string, Player>; // key socketId
  phase: Phase;
  day: number;
  votes: Record<string, string | undefined>; // voterId -> targetId
  nightActions: {
    wolvesTarget?: string;
    seerPeeks?: Record<string, string>;
    doctorProtect?: string;
  };
  chat: { when: "day" | "night"; from: string; text: string; at: number }[];
  createdAt: number;
  endedReason?: "wolves_win" | "village_win";
}
