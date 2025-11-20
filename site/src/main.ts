import './styles/main.css';

import { initMotionControls } from './modules/motion';
import { initParallax } from './modules/parallax';
import { initRevealObserver } from './modules/observer';
import { initLaurelScene } from './modules/laurelScene';
import {
  heroCopy,
  loreEntries,
  gameCopy,
  timeline as roadmap,
  ctaCopy,
  footerCopy,
} from './components/content';
import { renderHero, renderMain, renderFooter } from './components/sections';

const renderApp = () => {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) {
    throw new Error('Missing #app root for landing page render');
  }

  root.innerHTML = [
    renderHero(heroCopy),
    renderMain({ loreEntries, gameCopy, timeline: roadmap, ctaCopy }),
    renderFooter(footerCopy),
  ].join('');
};

const updateYear = () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
};

const bindCtaSubmit = () => {
  const form = document.querySelector<HTMLFormElement>('.cta__form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button');
    if (button) {
      button.textContent = 'Signal Sent';
      button.setAttribute('disabled', 'true');
    }
  });
};

const ready = () => {
  renderApp();
  updateYear();
  bindCtaSubmit();

  initMotionControls();
  initParallax();
  initRevealObserver();
  initLaurelScene();
};

if (document.readyState !== 'loading') {
  ready();
} else {
  document.addEventListener('DOMContentLoaded', ready);
}
