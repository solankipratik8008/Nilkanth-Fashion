'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Heart, Share2, Clock, Scissors, ArrowRight, ChevronLeft,
  ChevronRight, Check, Ruler, Palette, Package
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDesignById, designs } from '@/data/designs';
import { gtagEvent } from '@/lib/gtag';
import DesignCard from '@/components/ui/DesignCard';
import { formatPrice, getProductionTimeline } from '@/utils/pricing';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const designId = params.id as string;

  // Check static data first (instant), then Firestore override
  const staticDesign = getDesignById(designId);
  const [design, setDesign] = useState<any>(staticDesign);
  const [designLoading, setDesignLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'fabrics' | 'sizing' | 'reviews'>('description');

  useEffect(() => {
    // Always check Firestore to get any admin overrides (updated price, images, etc.)
    setDesignLoading(true);
    getDoc(doc(db, 'designs', designId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        // Only show if not deleted by admin
        if (d.active === false || d.deletedByAdmin === true) {
          setDesign(null);
        } else {
          // Merge: static data provides basePrice/complexity fallbacks; Firestore overrides everything else
          const merged = { ...staticDesign, id: snap.id, ...d };
          setDesign(merged);
          gtagEvent('view_item', { item_id: snap.id, item_name: merged.name, item_category: merged.category });
        }
      } else if (staticDesign) {
        gtagEvent('view_item', { item_id: staticDesign.id, item_name: staticDesign.name, item_category: staticDesign.category });
      }
      // If Firestore has no doc, keep staticDesign (already set in useState)
    }).catch(() => {
      // On error, keep whatever we had (static design or null)
    }).finally(() => setDesignLoading(false));
  }, [designId]);

  if (designLoading && !design) return (
    <div className="min-h-screen flex items-center justify-center pt-24">
      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!design) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Design Not Found</h2>
          <Link href="/collections" className="text-rose-600 hover:text-rose-700 font-medium">← Back to Collections</Link>
        </div>
      </div>
    );
  }

  const handleOrderNow = () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      router.push(`/auth/login`);
      return;
    }
    router.push(`/order/new?designId=${design.id}`);
  };

  const handleWishlist = () => {
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  const relatedDesigns = designs.filter(d => d.category === design.category && d.id !== design.id && d.active).slice(0, 4);
  const complexityBadge = ({ simple: { label: 'Simple', color: 'bg-green-100 text-green-700' }, medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' }, complex: { label: 'Complex', color: 'bg-orange-100 text-orange-700' }, premium: { label: 'Premium', color: 'bg-purple-100 text-purple-700' } } as any)[design.complexity] || { label: 'Custom', color: 'bg-gray-100 text-gray-700' };

  const images: string[] = design.images?.length ? design.images : [design.image || ''];
  const fabrics: string[] = design.fabrics || [];
  const colors: string[] = design.colors || [];
  const occasions: string[] = Array.isArray(design.occasion) ? design.occasion : (design.occasion ? [design.occasion] : []);
  const styleDetails: string[] = design.styleDetails || [];
  const rating = design.rating || 4.8;
  const reviewCount = design.reviewCount || 0;

  return (
    <div className="pt-24 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-rose-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/collections" className="hover:text-rose-600">Collections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/collections/${design.category}`} className="hover:text-rose-600 capitalize">{design.category?.replace(/-/g, ' ')}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-medium line-clamp-1">{design.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-4">
              <AnimatePresence mode="wait">
                <motion.div key={selectedImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  {images[selectedImage] && (
                    <Image src={images[selectedImage]} alt={design.name} fill className="object-cover" quality={90} />
                  )}
                </motion.div>
              </AnimatePresence>

              {design.trending && <span className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full">🔥 Trending</span>}
              {design.featured && <span className="absolute top-4 right-14 px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full">⭐ Featured</span>}

              <button onClick={handleWishlist} className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${isWishlisted ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-500'}`}>
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>

              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button onClick={() => setSelectedImage(Math.min(images.length - 1, selectedImage + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow">
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-rose-500' : 'border-transparent opacity-60 hover:opacity-80'}`}>
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${complexityBadge.color}`}>{complexityBadge.label}</span>
              {occasions.map(occ => (
                <span key={occ} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">{occ}</span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>{design.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
              </div>
              <span className="text-sm text-gray-500">{rating} ({reviewCount} reviews)</span>
              <button onClick={() => navigator.share?.({ title: design.name, url: window.location.href })} className="ml-auto p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-2xl p-6 mb-6">
              <div className="text-sm text-gray-500 mb-1">Starting from (tailoring only)</div>
              <div className="text-4xl font-bold text-rose-600 mb-2">{formatPrice(design.basePrice)}</div>
              <div className="text-xs text-gray-400">Final price includes fabric, complexity, and delivery charges. Admin will confirm exact price.</div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Production Time</div>
                  <div className="text-sm font-semibold text-gray-800">{getProductionTimeline(design.category)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Scissors className="w-5 h-5 text-purple-500 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Type</div>
                  <div className="text-sm font-semibold text-gray-800">Custom Tailored</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Ruler className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Sizing</div>
                  <div className="text-sm font-semibold text-gray-800">Custom or Standard</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Package className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Delivery</div>
                  <div className="text-sm font-semibold text-gray-800">Canada Wide</div>
                </div>
              </div>
            </div>

            {/* Available Fabrics */}
            {fabrics.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Palette className="w-4 h-4 text-rose-500" /> Available Fabrics</div>
                <div className="flex flex-wrap gap-2">
                  {fabrics.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-full capitalize hover:border-rose-300 transition-colors">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-2">Available Colors</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <span key={c} className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-full capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Design Notice */}
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <span className="text-amber-500 text-base shrink-0 mt-0.5">ℹ️</span>
              <p className="text-amber-800 text-xs leading-relaxed"><strong>This is a reference design.</strong> All outfits are custom-tailored to your measurements — not ready-made. After you submit your request, our team will review it and confirm fabric, pricing, and timeline before production begins.</p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button onClick={handleOrderNow} className="w-full py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-full text-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Request This Design <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={handleWishlist} className={`w-full py-3.5 border-2 font-semibold rounded-full transition-all flex items-center justify-center gap-2 ${isWishlisted ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-300 text-gray-700 hover:border-rose-300'}`}>
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                {isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex items-center gap-6 text-xs text-gray-400">
              {['100% Custom Made', 'Secure Order', 'Quality Guaranteed'].map(b => (
                <div key={b} className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" />{b}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t border-gray-100 pt-12">
          <div className="flex border-b border-gray-100 mb-8 gap-1">
            {(['description', 'fabrics', 'sizing', 'reviews'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium capitalize rounded-t-lg transition-all ${activeTab === tab ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-3xl">
              <p className="text-gray-600 leading-relaxed text-lg mb-6">{design.description}</p>
              {styleDetails.length > 0 && (
                <>
                  <h3 className="font-bold text-gray-900 mb-4">Style Details</h3>
                  <ul className="space-y-2">
                    {styleDetails.map((detail, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600"><Check className="w-4 h-4 text-rose-500 shrink-0" />{detail}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {activeTab === 'fabrics' && (
            <div className="max-w-3xl">
              <p className="text-gray-600 mb-6">This design is available in the following fabric options. You can either provide your own fabric or request us to source it for you.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {fabrics.map(fabric => (
                  <div key={fabric} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-rose-200 transition-colors">
                    <div className="text-2xl mb-2">🧵</div>
                    <div className="font-semibold text-gray-800 capitalize">{fabric}</div>
                    <div className="text-xs text-gray-500 mt-1">Available for this design</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sizing' && (
            <div className="max-w-3xl">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm font-medium">We offer both standard and custom measurements for perfect fit!</p>
              </div>
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Standard Sizes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Size', 'Bust', 'Waist', 'Hip', 'Shoulder'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-100">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[['XS', '32"', '26"', '35"', '13.5"'], ['S', '34"', '28"', '37"', '14"'], ['M', '36"', '30"', '39"', '14.5"'], ['L', '38"', '32"', '41"', '15"'], ['XL', '40"', '34"', '43"', '15.5"'], ['XXL', '42"', '36"', '45"', '16"'], ['XXXL', '44"', '38"', '47"', '16.5"']].map(row => (
                        <tr key={row[0]} className="hover:bg-gray-50">
                          {row.map((cell, j) => <td key={j} className={`px-4 py-2.5 border border-gray-100 ${j === 0 ? 'font-bold text-rose-600' : 'text-gray-600'}`}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                <h3 className="font-bold text-gray-900 mb-2">Custom Measurements</h3>
                <p className="text-gray-600 text-sm mb-4">For the perfect fit, you can provide custom measurements during the order process.</p>
                <button onClick={handleOrderNow} className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-colors">
                  Request with Custom Measurements
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50 rounded-2xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">{rating}</div>
                  <div className="flex justify-center gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-5 h-5 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{reviewCount} reviews</div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map(s => (
                    <div key={s} className="flex items-center gap-3 mb-1">
                      <span className="text-xs text-gray-600 w-4">{s}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: s === 5 ? '70%' : s === 4 ? '20%' : '5%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No reviews yet. Be the first to order and review this design!</p>
                <button onClick={handleOrderNow} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-md transition-all">
                  Request This Design
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Designs */}
        {relatedDesigns.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {relatedDesigns.map(d => (
                <DesignCard key={d.id} design={d} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
