'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { designs as staticDesigns } from '@/data/designs';
import DesignCard from '@/components/ui/DesignCard';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [firestoreDesigns, setFirestoreDesigns] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/user/wishlist');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Load wishlist IDs from Firestore user document
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        const ids: string[] = snap.data()?.wishlistIds || [];
        setWishlistIds(ids);
        // Fetch any Firestore-only designs (not in static array)
        const staticIds = new Set(staticDesigns.map(d => d.id));
        const firestoreOnlyIds = ids.filter(id => !staticIds.has(id));
        if (firestoreOnlyIds.length > 0) {
          getDocs(collection(db, 'designs'))
            .then(snap => {
              const fsDesigns = snap.docs
                .filter(d => firestoreOnlyIds.includes(d.id))
                .map(d => ({ id: d.id, ...d.data() }));
              setFirestoreDesigns(fsDesigns);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoadingWishlist(false));
  }, [user]);

  const toggleWishlist = async (designId: string) => {
    if (!user) return;
    const newIds = wishlistIds.includes(designId)
      ? wishlistIds.filter(id => id !== designId)
      : [...wishlistIds, designId];
    setWishlistIds(newIds);
    try {
      await updateDoc(doc(db, 'users', user.uid), { wishlistIds: newIds });
    } catch {
      // Revert on error
      setWishlistIds(wishlistIds);
    }
  };

  const clearAll = async () => {
    if (!user || wishlistIds.length === 0) return;
    setWishlistIds([]);
    try {
      await updateDoc(doc(db, 'users', user.uid), { wishlistIds: [] });
    } catch {
      // silently fail
    }
  };

  // Merge static + Firestore designs that are wishlisted
  const wishlistedStaticDesigns = staticDesigns.filter(d => wishlistIds.includes(d.id));
  const wishlistedFirestoreDesigns = firestoreDesigns.filter(d => wishlistIds.includes(d.id));
  const wishlistDesigns = [...wishlistedStaticDesigns, ...wishlistedFirestoreDesigns];

  if (authLoading || loadingWishlist) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> My Wishlist
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {wishlistDesigns.length} saved design{wishlistDesigns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {wishlistDesigns.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            )}
            <Link
              href="/collections"
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full font-semibold text-sm hover:bg-rose-600 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Browse More
            </Link>
          </div>
        </div>

        {wishlistDesigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-20 text-center"
          >
            <div className="text-6xl mb-4">💝</div>
            <h3 className="font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 text-sm mb-6">Save your favorite designs to revisit them later</p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-md transition-all"
            >
              Explore Collections <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlistDesigns.map((design, i) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <DesignCard
                  design={design}
                  wishlistIds={wishlistIds}
                  onWishlistToggle={toggleWishlist}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
