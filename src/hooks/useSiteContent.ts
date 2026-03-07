'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const DEFAULT_CONTENT = {
  announcementBanner: '',
  heroTitle: 'Crafted for Her Story',
  heroSubtitle: 'Premium custom tailoring for women and girls — traditional, western, and bridal wear made to order across Canada.',
  heroCTA: 'Explore Collections',
  heroCTAHref: '/collections',
  heroImages: [] as string[],

  // About page content
  aboutTitle: 'Stitching Dreams into Reality',
  aboutText: 'Nilkanth Fashions brings the art of traditional South Asian tailoring to Canada. Every outfit is handcrafted with precision, using the finest fabrics sourced from around the world.',
  aboutHeroTitle: 'Crafting Dreams, One Stitch at a Time',
  aboutHeroSubtitle: 'Nilkanth Fashions was born from a passion for bringing the rich heritage of South Asian fashion to the Canadian diaspora, while celebrating every woman\'s unique beauty and style.',
  aboutStoryTitle: 'A Family Tradition of Excellence',
  aboutStoryP1: 'What began as a small tailoring workshop in Gujarat, India, has grown into a premium custom fashion platform serving clients across Canada. Our founder, with over 15 years of expertise, brought with him the centuries-old tradition of Indian craftsmanship.',
  aboutStoryP2: 'We understand the emotional significance of every garment — especially for occasions like weddings, festivals, and family celebrations. When you wear something custom-made, you feel the difference.',
  aboutStoryP3: 'Today, Nilkanth Fashions serves women and girls across Canada, offering everything from everyday ethnic wear to elaborate bridal ensembles, all crafted with precision and care.',
  aboutStat1Value: '500+', aboutStat1Label: 'Happy Clients',
  aboutStat2Value: '250+', aboutStat2Label: 'Designs',
  aboutStat3Value: '15+',  aboutStat3Label: 'Years Experience',

  // Team members (managed in Admin → Content → Team)
  teamMembers: [] as { name: string; role: string; experience: string; bio: string; image: string }[],

  // Contact
  contactEmail: 'hello@nilkanthfashion.ca',
  contactPhone: '+1 (647) 999-9999',
  contactAddress: 'Serving across Canada — nilkanthfashion.ca',
  businessHours: 'Mon–Fri: 10am–7pm EST | Sat–Sun: 11am–5pm EST',
  whatsapp: '',

  testimonials: [] as { name: string; text: string; rating: number }[],
  faqs: [] as { question: string; answer: string }[],

  // Site images
  loginImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80',
  registerImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80',
  aboutHeroImage: '',

  // Media
  videos: [] as { id: string; title: string; description: string; url: string }[],
  galleryImages: [] as string[],

  // Navigation
  navLinks: [] as { label: string; href: string }[],

  // Footer
  footerTagline: 'Premium custom tailoring for women and girls. From everyday elegance to bridal grandeur — every outfit crafted with love and precision. Serving the South Asian diaspora across Canada.',
  socialInstagram: 'https://www.instagram.com/nilkanthfashions?igsh=MXUwamIzZGd1ZWpiaw%3D%3D',
  socialFacebook: '',
  socialTwitter: '',
  socialYoutube: '',
  footerEmail: 'hello@nilkanthfashion.ca',
  footerPhone: '+1 (647) 999-9999',
  footerAddress: 'Serving across Canada',
};

export type SiteContent = typeof DEFAULT_CONTENT;

// Module-level cache so all component instances share one fetch
let cached: SiteContent | null = null;
let cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function clearSiteContentCache() {
  cached = null;
  cacheTs = 0;
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(cached ?? DEFAULT_CONTENT);
  const [contentLoading, setContentLoading] = useState(!cached);

  useEffect(() => {
    if (cached && Date.now() - cacheTs < CACHE_TTL) {
      setContent(cached);
      setContentLoading(false);
      return;
    }
    getDoc(doc(db, 'siteSettings', 'content'))
      .then(snap => {
        if (snap.exists()) {
          const data = { ...DEFAULT_CONTENT, ...snap.data() } as SiteContent;
          cached = data;
          cacheTs = Date.now();
          setContent(data);
        }
      })
      .catch(console.error)
      .finally(() => setContentLoading(false));
  }, []);

  return { content, contentLoading };
}
