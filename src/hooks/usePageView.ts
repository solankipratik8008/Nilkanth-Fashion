'use client';
import { useEffect } from 'react';
import { doc, setDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Tracks a page view. Call once per page/route.
// Stores: siteAnalytics/views.total, siteAnalytics/views.daily[YYYY-MM-DD]
export function usePageView() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ref = doc(db, 'siteAnalytics', 'views');
    setDoc(ref, {
      total: increment(1),
      [`daily.${today}`]: increment(1),
      lastUpdated: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  }, []);
}
