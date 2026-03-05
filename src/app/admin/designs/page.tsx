'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { designs as staticDesigns } from '@/data/designs';
import { Plus, Trash2, Edit, Search, Star, Eye, Database, FileText, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'girls-traditional', 'girls-western', 'women-traditional', 'women-western', 'bridal-wear'];

export default function AdminDesignsPage() {
  const { isAdmin } = useAuth();
  const [firestoreDesigns, setFirestoreDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchFirestoreDesigns();
  }, [isAdmin]);

  const fetchFirestoreDesigns = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'designs'), orderBy('createdAt', 'desc')));
      setFirestoreDesigns(snap.docs.map(d => ({ id: d.id, ...d.data(), _source: 'firestore' })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Merge: Firestore overrides static for same ID, new Firestore designs appended
  const mergedDesigns = (() => {
    const firestoreIds = new Set(firestoreDesigns.map(d => d.id));
    // Static designs not overridden by Firestore
    const staticOnly = staticDesigns
      .filter(d => !firestoreIds.has(d.id))
      .map(d => ({ ...d, _source: 'static' }));
    return [...firestoreDesigns, ...staticOnly];
  })();

  const filtered = mergedDesigns.filter(d => {
    const matchesSearch = !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || d.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleRestore = async (design: any) => {
    try {
      await setDoc(doc(db, 'designs', design.id), { active: true, deletedByAdmin: false }, { merge: true });
      setFirestoreDesigns(prev => prev.map(d => d.id === design.id ? { ...d, active: true, deletedByAdmin: false } : d));
      toast.success('Design restored');
    } catch (e) {
      toast.error('Failed to restore design');
    }
  };

  const handleDelete = async (design: any) => {
    if (!confirm(`Delete "${design.name}"? This cannot be undone.`)) return;
    setDeleting(design.id);
    try {
      if (design._source === 'firestore') {
        // Delete images from Storage
        if (design.images?.length) {
          await Promise.allSettled(
            design.images.map((url: string) => {
              try { return deleteObject(ref(storage, url)); } catch { return Promise.resolve(); }
            })
          );
        }
        await deleteDoc(doc(db, 'designs', design.id));
        setFirestoreDesigns(prev => prev.filter(d => d.id !== design.id));
      } else {
        // Static design: save a "hidden" override to Firestore
        await setDoc(doc(db, 'designs', design.id), {
          ...design,
          active: false,
          _source: undefined,
          deletedByAdmin: true,
          updatedAt: new Date(),
        });
        setFirestoreDesigns(prev => [...prev, { ...design, active: false, _source: 'firestore' }]);
      }
      toast.success('Design removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete design');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Designs</h1>
          <p className="text-gray-400 text-sm">
            {filtered.length} designs
            <span className="ml-2 text-xs">
              (<Database className="w-3 h-3 inline text-purple-400" /> {firestoreDesigns.filter(d => d.active !== false).length} custom •{' '}
              <FileText className="w-3 h-3 inline text-blue-400" /> {mergedDesigns.filter(d => d._source === 'static' && d.active !== false).length} built-in)
            </span>
          </p>
        </div>
        <Link href="/admin/designs/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Add Design
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search designs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center border border-white/5">
          <p className="text-gray-400 mb-4">No designs found.</p>
          <Link href="/admin/designs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-semibold text-sm rounded-xl hover:bg-rose-700 transition-colors">
            <Plus className="w-4 h-4" /> Add First Design
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(design => {
            const isHidden = design.active === false || design.deletedByAdmin;
            return (
              <div key={design.id} className={`bg-gray-900 rounded-xl overflow-hidden border transition-all ${isHidden ? 'border-red-900/40' : 'border-white/5'}`}>
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-800">
                  {design.images?.[0] ? (
                    <Image src={design.images[0]} alt={design.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No image</div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {design.featured && (
                      <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" /> Featured
                      </span>
                    )}
                    {isHidden && (
                      <span className="bg-red-700 text-white text-xs px-2 py-0.5 rounded-full font-medium">Hidden</span>
                    )}
                  </div>
                  <div className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    design._source === 'firestore' ? 'bg-purple-600/90 text-white' : 'bg-blue-600/90 text-white'
                  }`}>
                    {design._source === 'firestore' ? 'Custom' : 'Built-in'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 border-b border-white/5">
                  <div className="text-white text-sm font-semibold truncate">{design.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-gray-400 text-xs capitalize">{design.category?.replace(/-/g, ' ')}</div>
                    <div className="text-rose-400 text-xs font-bold">CA${design.basePrice}</div>
                  </div>
                </div>

                {/* Action Buttons — always visible */}
                <div className="p-2 flex items-center gap-2">
                  {!isHidden && (
                    <Link href={`/designs/${design.id}`} target="_blank"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 text-xs font-medium">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  )}
                  <Link href={`/admin/designs/${design.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition-colors text-blue-400 text-xs font-medium">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  {isHidden ? (
                    <button
                      onClick={() => handleRestore(design)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg transition-colors text-green-400 text-xs font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(design)}
                      disabled={deleting === design.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg transition-colors text-red-400 text-xs font-medium disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {deleting === design.id ? '...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
