type AnalyticsPayload = Record<string, unknown>;

export const trackEvent = (eventName: string, data: AnalyticsPayload = {}) => {
  try {
    const w = window as unknown as {
      firebaseAnalytics?: { logEvent?: (name: string, params?: AnalyticsPayload) => void };
      gtag?: (command: string, name: string, params?: AnalyticsPayload) => void;
    };

    if (w.firebaseAnalytics?.logEvent) {
      w.firebaseAnalytics.logEvent(eventName, data);
      return;
    }

    if (w.gtag) {
      w.gtag('event', eventName, data);
      return;
    }

    // Mock fallback
    console.info('[analytics]', eventName, data);
  } catch {
    // no-op
  }
};
