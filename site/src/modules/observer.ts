export const initRevealObserver = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    document.querySelectorAll<HTMLElement>('[data-observe]').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px',
    }
  );

  document.querySelectorAll('[data-observe]').forEach((el) => observer.observe(el));
};
