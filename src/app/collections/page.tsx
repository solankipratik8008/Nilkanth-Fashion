'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/data/designs';

const categoryHeroes: Record<string, string> = {
  'girls-traditional': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
  'girls-western': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
  'women-traditional': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  'women-western': 'https://images.unsplash.com/photo-1594938298603-4b5c9be11c3f?w=600&q=80',
  'bridal-wear': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
};

const categoryDescriptions: Record<string, string> = {
  'girls-traditional': 'Lehengas, anarkalis, salwar suits & more for girls',
  'girls-western': 'Dresses, jumpsuits, co-ords & party wear for girls',
  'women-traditional': 'Sarees, suits, lehengas & traditional sets for women',
  'women-western': 'Blazers, dresses, co-ords & contemporary styles',
  'bridal-wear': 'Bridal lehengas, gowns & complete wedding collections',
};

const gradients: Record<string, string> = {
  'girls-traditional': 'from-rose-600 to-pink-700',
  'girls-western': 'from-blue-600 to-indigo-700',
  'women-traditional': 'from-purple-600 to-violet-700',
  'women-western': 'from-emerald-600 to-teal-700',
  'bridal-wear': 'from-amber-500 to-rose-600',
};

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-rose-600 to-purple-700 text-white pt-36 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-rose-200 font-semibold text-sm uppercase tracking-widest">All Collections</span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-3 mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
              Explore Our Collections
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              250+ custom designs across 5 categories. Every outfit crafted to your exact measurements and style.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Reference Design Notice */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl shrink-0 mt-0.5">ℹ️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">These are reference designs, not ready-made products.</p>
            <p className="text-amber-700 text-sm mt-0.5">Every outfit is custom-tailored to your measurements and preferences. Select a design to submit an order request — our team will review it and confirm details before production begins.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cat.id === 'bridal-wear' ? 'sm:col-span-2 lg:col-span-1' : ''}
            >
              <Link href={`/collections/${cat.id}`} className="group relative block overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={categoryHeroes[cat.id]}
                    alt={cat.label}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradients[cat.id]} opacity-60 group-hover:opacity-70 transition-opacity`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>{cat.label}</h3>
                  <p className="text-white/80 text-sm mb-3 line-clamp-2">{categoryDescriptions[cat.id]}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">{cat.count} designs</span>
                    <div className="flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                      Explore <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Custom Design CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-10 text-center text-white"
        >
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Don't See What You Want?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Upload your own design inspiration and our expert tailors will create exactly what you envision.</p>
          <Link href="/custom-design" className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 text-white font-bold rounded-full hover:bg-rose-600 hover:scale-105 transition-all">
            Upload Custom Design <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
