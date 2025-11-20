import type {
  HeroCopy,
  LoreEntry,
  GameSectionCopy,
  TimelineEntry,
  CtaCopy,
  FooterCopy,
} from './content';

const mapList = (items: string[]) => items.map((item) => `<li>${item}</li>`).join('');

export const renderHero = (copy: HeroCopy) => `
<header class="hero" id="top">
  <div class="hero__layers" aria-hidden="true">
    <div class="layer layer--stars" data-depth="0.1"></div>
    <div class="layer layer--aurora" data-depth="0.25"></div>
    <div class="layer layer--city" data-depth="0.35"></div>
    <div class="layer layer--columns" data-depth="0.45"></div>
  </div>
  <div class="hero__content floating">
    <div class="hero__badge">${copy.badge}</div>
    <h1 class="glitch" data-glitch="${copy.title}">${copy.title}</h1>
    <p>${copy.description}</p>
    <div class="hero__cta">
      <a class="btn btn--primary" href="${copy.primaryCta.href}">${copy.primaryCta.label}</a>
      <a class="btn btn--ghost" href="${copy.secondaryCta.href}">${copy.secondaryCta.label}</a>
    </div>
    <div class="hero__status">
      <span class="status-dot" aria-hidden="true"></span>
      ${copy.status}
    </div>
  </div>
  <div class="hero__canvas floating" data-depth="0.1">
    <canvas id="laurel-canvas" aria-hidden="true"></canvas>
  </div>
</header>
`;

export const renderMain = ({
  loreEntries,
  gameCopy,
  timeline,
  ctaCopy,
}: {
  loreEntries: LoreEntry[];
  gameCopy: GameSectionCopy;
  timeline: TimelineEntry[];
  ctaCopy: CtaCopy;
}) => `
<main>
  ${renderLore(loreEntries)}
  ${renderGame(gameCopy)}
  ${renderTimeline(timeline)}
  ${renderCta(ctaCopy)}
</main>
`;

const renderLore = (entries: LoreEntry[]) => `
<section id="lore" class="section section--lore" aria-label="Imperium lore">
  <div class="section__header">
    <p class="eyebrow">Lore Codex</p>
    <h2>Scrolls of a Neon Senate</h2>
    <p>The Impious Senate augments prophecy with silicon augurs. Every district in the sprawl whispers a different truth.</p>
  </div>
  <div class="lore__grid">
    ${entries
      .map(
        (entry) => `
      <article class="lore-card floating" data-observe>
        <h3>${entry.title}</h3>
        <p>${entry.body}</p>
        <span class="tag">${entry.tag}</span>
      </article>`
      )
      .join('')}
  </div>
</section>
`;

const renderGame = (copy: GameSectionCopy) => `
<section id="game" class="section section--game" aria-label="Game preview">
  <div class="section__header">
    <p class="eyebrow">Game Systems</p>
    <h2>The Arena of Deception</h2>
    <p>${copy.intro}</p>
  </div>
  <div class="game__grid">
    <article class="hud-card" data-observe>
      <h3>Legion Protocols</h3>
      <ul>
        ${mapList(copy.protocols)}
      </ul>
    </article>
    <article class="hud-card floating" data-observe>
      <h3>Neon Arena</h3>
      <p>${copy.arenaDescription}</p>
      <div class="arena-mock" aria-hidden="true">
        <div class="arena-mock__ring"></div>
        <div class="arena-mock__pulse"></div>
        <div class="arena-mock__legend">
          ${copy.arenaLegend.map((legend) => `<span>${legend}</span>`).join('')}
        </div>
      </div>
    </article>
    <article class="hud-card" data-observe>
      <h3>Signals &amp; APIs</h3>
      <p>${copy.signalsDescription}</p>
    </article>
  </div>
</section>
`;

const renderTimeline = (entries: TimelineEntry[]) => `
<section id="roadmap" class="section section--roadmap" aria-label="Roadmap">
  <div class="section__header">
    <p class="eyebrow">Roadmap</p>
    <h2>Pillars of the Neon Senate</h2>
  </div>
  <div class="timeline">
    ${entries
      .map(
        (entry) => `
      <article class="pillar" data-observe>
        <h3>${entry.title}</h3>
        <p>${entry.description}</p>
      </article>`
      )
      .join('')}
  </div>
</section>
`;

const renderCta = (copy: CtaCopy) => `
<section id="call-to-arms" class="section section--cta" aria-label="Call to arms">
  <div class="cta__content" data-observe>
    <p class="eyebrow">${copy.eyebrow}</p>
    <h2>${copy.title}</h2>
    <p>${copy.description}</p>
    <form class="cta__form">
      <label class="sr-only" for="enlist-email">Email</label>
      <input id="enlist-email" type="email" placeholder="${copy.placeholder}" required />
      <button type="submit" class="btn btn--primary">Transmit</button>
    </form>
    <div class="cta__links">
      ${copy.links
        .map((link) => `<a href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a>`)
        .join('')}
    </div>
  </div>
</section>
`;

export const renderFooter = (copy: FooterCopy) => `
<footer class="footer">
  <p>&copy; <span id="year"></span> ${copy.tagline}</p>
  <div class="footer__links">
    ${copy.links.map((link) => `<a href="${link.href}"${link.href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${link.label}</a>`).join('')}
  </div>
</footer>
`;
