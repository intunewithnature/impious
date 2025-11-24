type AnalyticsPayload = Record<string, unknown>;

const invokeSafely = (label: string, callback: () => void) => {
  try {
    callback();
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[Analytics:${label}] suppressed error`, error);
    }
  }
};

export const track = (eventName: string, payload?: AnalyticsPayload) => {
  if (!eventName) {
    return;
  }

  const isDev = Boolean(import.meta.env?.DEV);

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', eventName);
  }

  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag === 'function') {
    invokeSafely('gtag', () => {
      window.gtag?.('event', eventName, payload ?? {});
    });
  }

  if (typeof window.plausible === 'function') {
    invokeSafely('plausible', () => {
      window.plausible?.(eventName, payload ? { props: payload } : undefined);
    });
  }

  if (typeof window.fbq === 'function') {
    invokeSafely('fbq', () => {
      window.fbq?.('trackCustom', eventName, payload);
    });
  }
};

declare global {
  interface Window {
    impious?: {
      track: typeof track;
    };
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: AnalyticsPayload }) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type { AnalyticsPayload };
