'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Star, Trash2, Search, Check, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

type ReviewTab = 'pending' | 'approved' | 'all';

export default function ReviewsPage() {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [tab, setTab] = useState<ReviewTab>('pending');

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

  const approveReview = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { approved: true, updatedAt: new Date() });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: true } : r));
      toast.success('Review approved — now visible on site');
    } catch { toast.error('Failed to approve review'); }
  };

  const unapproveReview = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { approved: false, updatedAt: new Date() });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: false } : r));
      toast.success('Review hidden from site');
    } catch { toast.error('Failed to update review'); }
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

  const tabFiltered = reviews.filter(r => {
    if (tab === 'pending') return !r.approved;
    if (tab === 'approved') return r.approved === true;
    return true;
  });

  const filtered = tabFiltered.filter(r => {
    const matchSearch = !search ||
      r.userName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.designName?.toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
    return matchSearch && matchRating;
  });

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';

  const pendingCount = reviews.filter(r => !r.approved).length;
  const approvedCount = reviews.filter(r => r.approved === true).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reviews</h1>
          <p className="text-gray-400 text-sm">
            {reviews.length} total · {approvedCount} approved · {pendingCount} pending · Avg: {avgRating}
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline ml-1" />
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([['pending', `Pending (${pendingCount})`], ['approved', `Approved (${approvedCount})`], ['all', 'All']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Rating breakdown */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = reviews.filter(r => r.rating === rating).length;
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <button key={rating} onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
              className={`bg-gray-900 rounded-xl p-3 border transition-all text-center ${ratingFilter === rating ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 hover:border-white/10'}`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-white text-sm font-bold">{rating}</span>
              </div>
              <div className="text-gray-400 text-xs">{count}</div>
              <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input placeholder="Search by customer, review text, or design..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center border border-white/5">
          <p className="text-gray-400 text-sm">{tab === 'pending' ? 'No reviews pending approval' : 'No reviews found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-gray-900 rounded-2xl p-5 border transition-all ${review.approved ? 'border-green-500/20' : 'border-amber-500/20'}`}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {review.userPhoto ? (
                  <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-purple-400 font-bold text-sm">{(review.userName || 'A')[0].toUpperCase()}</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold text-sm">{review.userName || 'Anonymous'}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                      ))}
                    </div>
                    {review.approved
                      ? <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-medium">Approved</span>
                      : <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium animate-pulse">Pending</span>
                    }
                    <span className="text-gray-500 text-xs ml-auto">{formatDate(review.createdAt)}</span>
                  </div>

                  {review.designName && (
                    <div className="text-gray-500 text-xs mb-1.5">on "{review.designName}"</div>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                  {review.userEmail && (
                    <div className="text-gray-600 text-xs mt-1.5">{review.userEmail}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!review.approved ? (
                    <button onClick={() => approveReview(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  ) : (
                    <button onClick={() => unapproveReview(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold rounded-lg transition-colors">
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </button>
                  )}
                  <button onClick={() => deleteReview(review.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
