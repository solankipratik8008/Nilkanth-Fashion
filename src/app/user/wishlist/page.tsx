'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { designs } from '@/data/designs';
import DesignCard from '@/components/ui/DesignCard';

export default function WishlistPage() {
  // For demo — in production this would be fetched from Firestore
  const [wishlistIds, setWishlistIds] = useState<string[]>([
    'bw-001', 'wt-001', 'gw-004', 'ww-003',
  ]);

  const wishlistDesigns = designs.filter(d => wishlistIds.includes(d.id));
  const toggleWishlist = (id: string) => setWishlistIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> My Wishlist
            </h1>
            <p className="text-gray-500 text-sm mt-1">{wishlistDesigns.length} saved design{wishlistDesigns.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/collections" className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full font-semibold text-sm hover:bg-rose-600 transition-colors">
            <ShoppingBag className="w-4 h-4" /> Browse More
          </Link>
        </div>

        {wishlistDesigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center">
            <div className="text-6xl mb-4">💝</div>
            <h3 className="font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 text-sm mb-6">Save your favorite designs to revisit them later</p>
            <Link href="/collections" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-md transition-all">
              Explore Collections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlistDesigns.map((design, i) => (
              <motion.div key={design.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <DesignCard design={design} wishlistIds={wishlistIds} onWishlistToggle={toggleWishlist} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
