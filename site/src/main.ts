import './styles/main.css';

import { initMotionControls } from './modules/motion';
import { initParallax } from './modules/parallax';
import { initRevealObserver } from './modules/observer';
import { initLaurelScene } from './modules/laurelScene';

const ready = () => {
  initMotionControls();
  initParallax();
  initRevealObserver();
  initLaurelScene();

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  const form = document.querySelector('.cta__form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    if (button) {
      button.textContent = 'Signal Sent';
      button.setAttribute('disabled', 'true');
    }
  });
};

if (document.readyState !== 'loading') {
  ready();
} else {
  document.addEventListener('DOMContentLoaded', ready);
}
