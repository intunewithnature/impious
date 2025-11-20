import { prefersReducedMotion } from './motion';

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

export const initParallax = () => {
  if (typeof window === 'undefined') return;
  const layers = Array.from(document.querySelectorAll<HTMLElement>('.layer'));
  if (!layers.length) return;

  let currentX = 0;
  let currentY = 0;
  let rafId = 0;

  const handleScroll = () => {
    if (prefersReducedMotion()) {
      layers.forEach((layer) => (layer.style.transform = 'translate3d(0, 0, 0)'));
      return;
    }

    const targetY = window.scrollY * 0.02;
    const targetX = (window.scrollX || 0) * 0.02;

    currentY = lerp(currentY, targetY, 0.1);
    currentX = lerp(currentX, targetX, 0.1);

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || '0.2');
      const translateX = -currentX * depth;
      const translateY = -currentY * depth;
      layer.style.transform = `translate3d(${translateX}rem, ${translateY}rem, 0)`;
    });
  };

  const loop = () => {
    handleScroll();
    rafId = requestAnimationFrame(loop);
  };

  loop();

  window.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        loop();
      }
    },
    { passive: true }
  );
};
