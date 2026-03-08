'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { designs as staticDesigns, categories } from '@/data/designs';
import DesignCard from '@/components/ui/DesignCard';
import { Occasion, FabricType } from '@/types';
import { useAuth } from '@/context/AuthContext';

const categoryLabels: Record<string, string> = {
  'girls-traditional': 'Girls Traditional',
  'girls-western': 'Girls Western',
  'women-traditional': 'Women Traditional',
  'women-western': 'Women Western',
  'bridal-wear': 'Bridal Wear',
};

const categoryDescriptions: Record<string, string> = {
  'girls-traditional': 'Beautiful traditional outfits for girls — from lehengas to anarkalis, crafted with love and precision.',
  'girls-western': 'Fun and stylish western outfits for girls — dresses, jumpsuits, and more.',
  'women-traditional': 'Elegant traditional wear for women — sarees, suits, lehengas, and more.',
  'women-western': 'Contemporary western styles for modern women — blazers, dresses, and power suits.',
  'bridal-wear': 'Exquisite bridal collections for your special day — from lehengas to gowns, every stitch perfection.',
};

const occasions: Occasion[] = ['casual', 'festive', 'wedding', 'party', 'formal'];
const fabrics: FabricType[] = ['cotton', 'silk', 'satin', 'chiffon', 'velvet', 'georgette', 'organza', 'linen', 'crepe', 'net'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'trending', label: 'Trending' },
];

export default function CollectionPage() {
  const params = useParams();
  const category = params.category as string;
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<FabricType[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [firestoreDesigns, setFirestoreDesigns] = useState<any[]>([]);

  // Load wishlist from Firestore
  useEffect(() => {
    if (!user) { setWishlistIds([]); return; }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => setWishlistIds(snap.data()?.wishlistIds || []))
      .catch(() => {});
  }, [user]);

  // Load Firestore designs for this category (overrides + new ones)
  useEffect(() => {
    getDocs(collection(db, 'designs')).then(snap => {
      setFirestoreDesigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(() => {});
  }, []);

  // Merge: Firestore overrides static for same ID. New Firestore designs included if category matches.
  const mergedDesigns = useMemo(() => {
    const firestoreMap = new Map(firestoreDesigns.map(d => [d.id, d]));
    // Static designs - replace with Firestore override if exists
    const fromStatic = staticDesigns
      .filter(d => d.category === category)
      .map(d => {
        const override = firestoreMap.get(d.id);
        if (override) {
          // deleted by admin
          if (override.active === false || override.deletedByAdmin === true) return null;
          return { ...d, ...override };
        }
        return d.active !== false ? d : null;
      })
      .filter(Boolean);

    // New Firestore-only designs for this category
    const staticIds = new Set(staticDesigns.map(d => d.id));
    const newFirestore = firestoreDesigns
      .filter(d => d.category === category && !staticIds.has(d.id) && d.active !== false && !d.deletedByAdmin);

    return [...fromStatic, ...newFirestore] as any[];
  }, [firestoreDesigns, category]);

  const categoryDesigns = useMemo(() => {
    let result = [...mergedDesigns];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        (d.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    if (selectedOccasions.length > 0) {
      result = result.filter(d => {
        const occ = Array.isArray(d.occasion) ? d.occasion : [d.occasion];
        return occ.some((o: string) => selectedOccasions.includes(o as Occasion));
      });
    }
    if (selectedFabrics.length > 0) {
      result = result.filter(d => (d.fabrics || []).some((f: string) => selectedFabrics.includes(f as FabricType)));
    }
    result = result.filter(d => d.basePrice >= priceRange[0] && d.basePrice <= priceRange[1]);
    if (trendingOnly) result = result.filter(d => d.trending);

    switch (sortBy) {
      case 'price-asc': return result.sort((a, b) => a.basePrice - b.basePrice);
      case 'price-desc': return result.sort((a, b) => b.basePrice - a.basePrice);
      case 'rating': return result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'trending': return result.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
      default: return result.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });
    }
  }, [mergedDesigns, searchQuery, selectedOccasions, selectedFabrics, priceRange, sortBy, trendingOnly]);

  const toggleWishlist = async (id: string) => {
    if (!user) return;
    const newIds = wishlistIds.includes(id)
      ? wishlistIds.filter(i => i !== id)
      : [...wishlistIds, id];
    setWishlistIds(newIds);
    try {
      await updateDoc(doc(db, 'users', user.uid), { wishlistIds: newIds });
    } catch {
      setWishlistIds(wishlistIds);
    }
  };
  const toggleOccasion = (o: Occasion) => setSelectedOccasions(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  const toggleFabric = (f: FabricType) => setSelectedFabrics(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const activeFilterCount = selectedOccasions.length + selectedFabrics.length + (trendingOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-purple-700 text-white pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="text-sm text-white/60 mb-4">
              <span>Home</span> / <span>Collections</span> / <span className="text-white">{categoryLabels[category]}</span>
            </nav>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
              {categoryLabels[category] || 'Collection'}
            </h1>
            <p className="text-white/80 max-w-2xl text-lg">{categoryDescriptions[category]}</p>
            <div className="mt-4 text-white/70 text-sm">{categoryDesigns.length} designs available • All custom-made to order</div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reference Design Notice */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0 mt-0.5">ℹ️</span>
          <p className="text-amber-800 text-sm"><strong>Reference designs only</strong> — every outfit is custom-tailored to your measurements. Submit an order request and our team will confirm all details before production starts.</p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search designs, fabrics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-medium transition-all ${showFilters ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="w-5 h-5 bg-rose-100 text-rose-700 rounded-full text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300">
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Occasions */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Occasion</h3>
                <div className="flex flex-wrap gap-2">
                  {occasions.map(occ => (
                    <button key={occ} onClick={() => toggleOccasion(occ)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedOccasions.includes(occ) ? 'bg-rose-500 text-white border-rose-500' : 'border-gray-200 text-gray-600 hover:border-rose-300'}`}>
                      {occ.charAt(0).toUpperCase() + occ.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabrics */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Fabric</h3>
                <div className="flex flex-wrap gap-2">
                  {fabrics.map(fab => (
                    <button key={fab} onClick={() => toggleFabric(fab)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedFabrics.includes(fab) ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                      {fab.charAt(0).toUpperCase() + fab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Other</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={trendingOnly} onChange={e => setTrendingOnly(e.target.checked)} className="w-4 h-4 accent-rose-500" />
                  <span className="text-sm text-gray-700">Trending only</span>
                </label>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Price Range: CAD ${priceRange[0]} – ${priceRange[1]}</div>
                  <input type="range" min={0} max={3000} step={50} value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-rose-500" />
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setSelectedOccasions([]); setSelectedFabrics([]); setTrendingOnly(false); setPriceRange([0, 3000]); }} className="mt-3 text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <div className="text-sm text-gray-500 mb-6">
          Showing <strong className="text-gray-900">{categoryDesigns.length}</strong> designs
        </div>

        {categoryDesigns.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No designs found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
            <button onClick={() => { setSearchQuery(''); setSelectedOccasions([]); setSelectedFabrics([]); }} className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categoryDesigns.map((design, i) => (
              <motion.div key={design.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                <DesignCard design={design} wishlistIds={wishlistIds} onWishlistToggle={toggleWishlist} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Other Categories */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Other Collections</h2>
          <div className="flex flex-wrap gap-3">
            {categories.filter(c => c.id !== category).map(cat => (
              <a key={cat.id} href={`/collections/${cat.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-rose-300 hover:text-rose-600 transition-all">
                {cat.icon} {cat.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
