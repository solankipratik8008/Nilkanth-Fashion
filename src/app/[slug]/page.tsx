'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Megaphone, Gift, Info, Newspaper } from 'lucide-react';

type ContentType = 'announcement' | 'offer' | 'update' | 'info';

interface PageItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  badge?: string;
  active: boolean;
}

interface DynamicPage {
  title: string;
  slug: string;
  contentType: ContentType;
  description?: string;
  items: PageItem[];
  createdAt: any;
  updatedAt: any;
}

const typeConfig: Record<ContentType, { icon: any; color: string; bg: string; label: string }> = {
  announcement: { icon: Megaphone, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', label: 'Announcement' },
  offer: { icon: Gift, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', label: 'Offer' },
  update: { icon: Newspaper, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Update' },
  info: { icon: Info, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Info' },
};

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<DynamicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getDoc(doc(db, 'dynamicPages', slug))
      .then(snap => {
        if (snap.exists()) {
          setPage(snap.data() as DynamicPage);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🌸</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">This page doesn't exist or has been removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-full font-semibold hover:bg-violet-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const config = typeConfig[page.contentType] || typeConfig.info;
  const Icon = config.icon;
  const activeItems = page.items?.filter(item => item.active !== false) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </motion.div>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-4">
            <Icon className="w-4 h-4" />
            {config.label}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 font-serif">{page.title}</h1>
          {page.description && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">{page.description}</p>
          )}
        </motion.div>

        {/* Items */}
        {activeItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-400">
            <Icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No content yet. Check back soon!</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {activeItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.2 }}
                className={`rounded-2xl border p-6 ${config.bg} shadow-sm`}
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  {item.image && (
                    <div className="relative w-full sm:w-48 h-36 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {item.badge && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${config.color} bg-white/70 border border-current/20`}>
                          <Tag className="w-3 h-3" />
                          {item.badge}
                        </span>
                      )}
                      {item.date && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
