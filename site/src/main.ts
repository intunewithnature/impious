import './styles/main.css';

import { initMotionControls } from './modules/motion';
import { initParallax } from './modules/parallax';
import { initRevealObserver } from './modules/observer';
import { initLaurelScene } from './modules/laurelScene';
import { initScramble } from './modules/scramble';

const ready = () => {
  initMotionControls();
  initParallax();
  initRevealObserver();
  initLaurelScene();
  initScramble();

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
