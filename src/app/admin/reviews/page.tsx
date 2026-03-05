'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Star, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    fetchReviews();
  }, [isAdmin]);

  const fetchReviews = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')));
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filtered = reviews.filter(r => {
    const matchSearch = r.userName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.designName?.toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
    return matchSearch && matchRating;
  });

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reviews Management</h1>
          <p className="text-gray-400 text-sm">{reviews.length} total reviews • Avg rating: {avgRating} ⭐</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = reviews.filter(r => r.rating === rating).length;
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <div key={rating} onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
              className={`bg-gray-900 rounded-xl p-3 border cursor-pointer transition-all text-center ${
                ratingFilter === rating ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 hover:border-white/10'
              }`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-white text-sm font-bold">{rating}</span>
              </div>
              <div className="text-gray-400 text-xs">{count} reviews</div>
              <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input placeholder="Search by customer, review text, or design name..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center border border-white/5">
          <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{review.userName || 'Anonymous'}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                      ))}
                    </div>
                    {review.designName && (
                      <span className="text-gray-400 text-xs">on "{review.designName}"</span>
                    )}
                    <span className="text-gray-500 text-xs ml-auto">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                  {review.userEmail && (
                    <div className="text-gray-500 text-xs mt-2">{review.userEmail}</div>
                  )}
                </div>
                <button onClick={() => deleteReview(review.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
