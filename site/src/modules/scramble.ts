const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

class TextScramble {
  el: HTMLElement;
  chars: string;
  queue: Array<{ from: string; to: string; start: number; end: number; char?: string }>;
  frame: number;
  frameRequest: number;
  resolve: (value?: unknown) => void;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = CHARS;
    this.queue = [];
    this.frame = 0;
    this.frameRequest = 0;
    this.resolve = () => {};
    this.update = this.update.bind(this);
  }

  setText(newText: string) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];
    
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;
    
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }
    
    this.el.innerHTML = output;
    
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

export const initScramble = () => {
  // Only run if reduced motion is not preferred
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          if (el.dataset.scrambled === 'true') return; // Only run once
          
          const scrambler = new TextScramble(el);
          // Store original text in data attribute if not present, or use textContent
          const originalText = el.dataset.originalText || el.textContent || '';
          if (!el.dataset.originalText) el.dataset.originalText = originalText;

          scrambler.setText(originalText);
          el.dataset.scrambled = 'true';
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('[data-scramble]').forEach((el) => {
    observer.observe(el);
  });
};
