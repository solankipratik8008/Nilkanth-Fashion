export const GA_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function gtagPageView(url: string) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: url });
}

export function gtagEvent(action: string, params?: Record<string, any>) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
}
