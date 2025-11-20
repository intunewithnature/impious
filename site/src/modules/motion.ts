let reduceMotion = false;

const getMediaQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)');

const applyMotionState = (reduced: boolean) => {
  reduceMotion = reduced;
  document.body.dataset.motion = reduced ? 'reduced' : 'full';
};

export const initMotionControls = () => {
  if (typeof window === 'undefined') {
    return;
  }
  const media = getMediaQuery();
  applyMotionState(media.matches);
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', (event) => applyMotionState(event.matches));
  } else {
    media.addListener((event) => applyMotionState(event.matches));
  }
};

export const prefersReducedMotion = () => reduceMotion;
