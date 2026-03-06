'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { gtagPageView } from '@/lib/gtag';

// Tracks a page view on every route change.
// Stores: siteAnalytics/views.total, siteAnalytics/views.daily[YYYY-MM-DD]
// Also fires GA4 page_view event.
export function usePageView() {
  const pathname = usePathname();

  useEffect(() => {
    // Firestore analytics
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ref = doc(db, 'siteAnalytics', 'views');
    setDoc(ref, {
      total: increment(1),
      [`daily.${today}`]: increment(1),
      lastUpdated: new Date().toISOString(),
    }, { merge: true }).catch(() => {});

    // GA4 page view
    gtagPageView(pathname);
  }, [pathname]);
}
