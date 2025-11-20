export type HeroCopy = {
  badge: string;
  title: string;
  description: string;
  status: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export type LoreEntry = {
  title: string;
  body: string;
  tag: string;
};

export type GameSectionCopy = {
  intro: string;
  protocols: string[];
  arenaLegend: string[];
  arenaDescription: string;
  signalsDescription: string;
};

export type TimelineEntry = {
  title: string;
  description: string;
};

export type CtaCopy = {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  links: { label: string; href: string }[];
};

export type FooterCopy = {
  tagline: string;
  links: { label: string; href: string }[];
};

export const heroCopy: HeroCopy = {
  badge: 'Neon Imperium Dispatch',
  title: 'Impious Imperium',
  description:
    'Where Roman ritual collides with cyberpunk conspiracies. Gather your cohort, unmask the impostors, and seize the throne beneath a neon dawn.',
  status: 'Alpha signals warming up &mdash; enlistments open soon.',
  primaryCta: { label: 'Decode the Lore', href: '#lore' },
  secondaryCta: { label: 'Join the Cohort', href: '#call-to-arms' },
};

export const loreEntries: LoreEntry[] = [
  {
    title: 'House of Embers',
    body: 'Bio-scribes weave augments into laurels, branding chosen legionnaires with living fire.',
    tag: 'Faction',
  },
  {
    title: 'The Null Oracle',
    body: 'An outlaw AI trapped in a marble bust. Feed it secrets to bend probability.',
    tag: 'Relic',
  },
  {
    title: 'Grid Basilica',
    body: 'Cathedral of code, lit by magenta glass. Each column a firewall. Each fresco a kill-switch.',
    tag: 'Location',
  },
];

export const gameCopy: GameSectionCopy = {
  intro: 'Social deduction evolves with faction tech, asynchronous rituals, and cross-realm dossiers.',
  protocols: [
    'Faction whispers with encrypted channels.',
    'Procedural missions that rewrite loyalties.',
    'Consecrated cooldowns to pace the intrigue.',
  ],
  arenaLegend: ['Oracles', 'Saboteurs', 'Centurions'],
  arenaDescription: 'CSS-driven holo mock shows squads, allegiances, and actionable intel. Tilt to inspect layers.',
  signalsDescription: 'GraphQL shards + WebSocket rituals keep browsers and bots aligned. Build overlays, telemetry, and companion feeds.',
};

export const timeline: TimelineEntry[] = [
  { title: 'Q1 – Lore Vault', description: 'Landing page v1, player codex, public API keys for read-only lore scrapes.' },
  { title: 'Q2 – Closed Arena', description: 'Invite-only alpha, faction dashboards, Discord cohort bridge.' },
  { title: 'Q3 – Open Legion', description: 'Global events, battle pass experiments, on-chain badge proofs.' },
];

export const ctaCopy: CtaCopy = {
  eyebrow: 'Call to Arms',
  title: 'Enlist before the eclipse',
  description: 'Drop your signal to receive alpha summons, devlogs, and clandestine lore drops.',
  placeholder: 'legionary@imperiumsolis.org',
  links: [
    { label: 'Discord Cohort', href: 'https://discord.gg' },
    { label: 'GitHub Intel', href: 'https://github.com/impious' },
    { label: 'Contact the Senate', href: 'mailto:hello@imperiumsolis.org' },
  ],
};

export const footerCopy: FooterCopy = {
  tagline: 'Impious Imperium. Forged in Roman neon.',
  links: [
    { label: 'Back to summit', href: '#top' },
    { label: 'Status', href: 'https://status.imperiumsolis.org' },
  ],
};
