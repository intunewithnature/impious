import './styles/main.css';

import { track } from './modules/analytics';
import { initMotionControls } from './modules/motion';
import { initParallax } from './modules/parallax';
import { initRevealObserver } from './modules/observer';
import { initLaurelScene } from './modules/laurelScene';
import { initScramble } from './modules/scramble';

if (typeof window !== 'undefined') {
  window.impious = {
    ...(window.impious ?? {}),
    track,
  };
}

const initHeroInteraction = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const handleScroll = () => {
    const scrollY = window.scrollY;
    if (scrollY > 20) {
      hero.classList.add('hero--engaged');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
};

const ready = () => {
  track('landing_view');
  initMotionControls();
  initParallax();
  initRevealObserver();
  initLaurelScene();
  initScramble();
  initHeroInteraction();

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  const form = document.querySelector('.cta__form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    if (button) {
      button.innerHTML = '<span class="glitch" data-glitch="SIGNAL_LOCKED">SIGNAL_LOCKED</span>';
      button.setAttribute('disabled', 'true');
      button.style.borderColor = 'var(--neon-cyan)';
      button.style.color = 'var(--neon-cyan)';
    }
  });
};

if (document.readyState !== 'loading') {
  ready();
} else {
  document.addEventListener('DOMContentLoaded', ready);
}
