'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Clock, X, MessageSquare, Plus, Wand2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  suggestChangesToRequest,
  approveDesignRequest,
  rejectDesignRequest,
} from '@/services/designRequestService';

const STATUS_TABS = ['pending', 'awaiting-confirmation', 'user-confirmed', 'waiting-for-fabric', 'approved', 'order-placed', 'rejected', 'all'];

const FABRIC_OPTIONS = ['silk', 'velvet', 'chiffon', 'satin', 'georgette', 'cotton', 'crepe', 'organza', 'net', 'linen', 'brocade', 'chanderi', 'banarasi', 'polyester'];
const COLOR_OPTIONS = ['red', 'maroon', 'gold', 'royal blue', 'navy blue', 'emerald', 'forest green', 'black', 'white', 'ivory', 'beige', 'pink', 'rose', 'purple', 'lavender', 'teal', 'orange', 'cream', 'silver', 'champagne'];

export default function CustomRequestsPage() {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestion, setSuggestion] = useState<{ fabrics: string[]; colors: string[]; message: string }>({ fabrics: [], colors: [], message: '' });
  const [customFabric, setCustomFabric] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchRequests();
  }, [isAdmin, activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = activeTab === 'all'
        ? query(collection(db, 'customDesignRequests'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'customDesignRequests'), where('status', '==', activeTab), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setActionLoading(true);
    try {
      await approveDesignRequest(id, req.userId, req.category || 'design');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: 'approved' }));
      toast.success('Request approved! User notified.');
    } catch { toast.error('Failed to approve'); }
    setActionLoading(false);
  };

  const handleReject = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setActionLoading(true);
    try {
      await rejectDesignRequest(id, req.userId, req.category || 'design', rejectNote);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', adminNote: rejectNote } : r));
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: 'rejected', adminNote: rejectNote }));
      setShowRejectModal(null);
      setRejectNote('');
      toast.success('Request rejected. User notified.');
    } catch { toast.error('Failed to reject'); }
    setActionLoading(false);
  };

  const handleSuggestChanges = async (id: string) => {
    if (!suggestion.message.trim()) { toast.error('A message to the customer is required'); return; }
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setActionLoading(true);
    try {
      await suggestChangesToRequest(id, req.userId, req.userName || '', req.category || 'design', {
        fabrics: suggestion.fabrics,
        colors: suggestion.colors,
        message: suggestion.message,
        suggestedAt: new Date().toISOString(),
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'awaiting-confirmation', adminSuggestions: { ...suggestion } } : r));
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: 'awaiting-confirmation', adminSuggestions: { ...suggestion } }));
      setSuggestion({ fabrics: [], colors: [], message: '' });
      setShowSuggestionForm(false);
      toast.success('Suggestions sent to customer!');
    } catch { toast.error('Failed to send suggestions'); }
    setActionLoading(false);
  };

  const handleApproveAfterConfirmation = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setActionLoading(true);
    try {
      await approveDesignRequest(id, req.userId, req.category || 'design');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: 'approved' }));
      toast.success('Design request approved for ordering!');
    } catch { toast.error('Failed to approve'); }
    setActionLoading(false);
  };

  const toggleFabric = (f: string) => setSuggestion(s => ({
    ...s, fabrics: s.fabrics.includes(f) ? s.fabrics.filter(x => x !== f) : [...s.fabrics, f],
  }));
  const toggleColor = (c: string) => setSuggestion(s => ({
    ...s, colors: s.colors.includes(c) ? s.colors.filter(x => x !== c) : [...s.colors, c],
  }));
  const addCustomFabric = () => {
    const v = customFabric.trim().toLowerCase();
    if (v && !suggestion.fabrics.includes(v)) setSuggestion(s => ({ ...s, fabrics: [...s.fabrics, v] }));
    setCustomFabric('');
  };
  const addCustomColor = () => {
    const v = customColor.trim().toLowerCase();
    if (v && !suggestion.colors.includes(v)) setSuggestion(s => ({ ...s, colors: [...s.colors, v] }));
    setCustomColor('');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'awaiting-confirmation': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'user-confirmed': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      'waiting-for-fabric': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      approved: 'bg-green-500/20 text-green-300 border-green-500/30',
      'order-placed': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return map[status] || 'bg-gray-500/20 text-gray-300';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      'awaiting-confirmation': 'Awaiting Customer',
      'user-confirmed': 'Customer Confirmed',
      'waiting-for-fabric': 'Waiting for Fabric',
      'order-placed': 'Order Placed',
    };
    return map[status] || status;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Custom Design Requests</h1>
        <p className="text-gray-400 text-sm">Review, suggest changes, and approve customer design submissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6 border border-white/5 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {statusLabel(tab) || tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-10 text-center border border-white/5">
              <Clock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No {activeTab} requests</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id}
                onClick={() => { setSelected(req); setShowSuggestionForm(false); setSuggestion({ fabrics: [], colors: [], message: '' }); }}
                className={`bg-gray-900 rounded-2xl p-4 border cursor-pointer transition-all hover:border-purple-500/50 ${
                  selected?.id === req.id ? 'border-purple-500/50 bg-gray-800' : 'border-white/5'
                }`}>
                <div className="flex items-start gap-3">
                  {req.designImages?.[0] && (
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0">
                      <Image src={req.designImages[0]} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-white font-semibold text-sm truncate">{req.userName}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${statusBadge(req.status)}`}>
                        {statusLabel(req.status) || req.status}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs mb-1 truncate">{req.userEmail}</div>
                    <div className="text-gray-500 text-xs capitalize mb-2">
                      {req.category?.replace(/-/g, ' ')} • {req.occasion}
                    </div>
                    <p className="text-gray-300 text-xs line-clamp-2">{req.description}</p>
                  </div>
                </div>

                {/* Quick actions for pending */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={e => { e.stopPropagation(); handleApprove(req.id); }}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSelected(req); setShowSuggestionForm(true); }}
                      className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-600 text-amber-400 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-amber-500/20 hover:border-transparent">
                      <Wand2 className="w-3.5 h-3.5" /> Suggest
                    </button>
                    <button onClick={e => { e.stopPropagation(); setShowRejectModal(req.id); }}
                      className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-red-500/20 hover:border-transparent">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {/* Quick action for user-confirmed */}
                {req.status === 'user-confirmed' && (
                  <button onClick={e => { e.stopPropagation(); handleApproveAfterConfirmation(req.id); }}
                    className="w-full mt-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve for Ordering
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden sticky top-8 self-start max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <h3 className="text-white font-semibold">Request Details</h3>
              <button onClick={() => { setSelected(null); setShowSuggestionForm(false); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Images */}
              {selected.designImages?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selected.designImages.map((url: string, i: number) => (
                    <div key={i} className="relative w-20 h-24 rounded-xl overflow-hidden">
                      <Image src={url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Basic info */}
              <div className="space-y-2 text-sm">
                {[
                  ['Name', selected.userName],
                  ['Email', selected.userEmail],
                  ['Category', selected.category?.replace(/-/g, ' ')],
                  ['Occasion', selected.occasion],
                  ['Preferred Fabric', selected.preferredFabric || '—'],
                  ['Budget', selected.budget ? `CAD $${selected.budget}` : '—'],
                  ['Status', statusLabel(selected.status) || selected.status],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-medium capitalize">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusBadge(selected.status)}`}>
                    {statusLabel(selected.status) || selected.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div>
                  <div className="text-gray-400 text-xs mb-1">Customer Notes</div>
                  <p className="text-gray-300 text-sm bg-gray-800 rounded-xl p-3">{selected.description}</p>
                </div>
              )}

              {/* Admin suggestion already sent */}
              {selected.adminSuggestions && ['awaiting-confirmation', 'user-confirmed', 'waiting-for-fabric'].includes(selected.status) && (
                <div>
                  <div className="text-gray-400 text-xs mb-1 flex items-center gap-1"><Wand2 className="w-3 h-3" /> Suggestions Sent</div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2 text-sm">
                    <p className="text-amber-200 text-xs">{selected.adminSuggestions.message}</p>
                    {selected.adminSuggestions.fabrics?.length > 0 && (
                      <div className="text-xs text-gray-400">Fabrics: <span className="text-amber-300 capitalize">{selected.adminSuggestions.fabrics.join(', ')}</span></div>
                    )}
                    {selected.adminSuggestions.colors?.length > 0 && (
                      <div className="text-xs text-gray-400">Colors: <span className="text-amber-300 capitalize">{selected.adminSuggestions.colors.join(', ')}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* User response */}
              {selected.userResponse && (
                <div>
                  <div className="text-gray-400 text-xs mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Customer Response</div>
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs space-y-1">
                    <div className="text-sky-300 font-medium capitalize">{
                      selected.userResponse.type === 'accept-suggested' ? 'Accepted suggested options' :
                      selected.userResponse.type === 'provide-own' ? 'Will provide own fabric' :
                      'Cancelled'
                    }</div>
                    {selected.userResponse.selectedFabric && <div className="text-gray-400">Fabric: <span className="text-white capitalize">{selected.userResponse.selectedFabric}</span></div>}
                    {selected.userResponse.selectedColor && <div className="text-gray-400">Color: <span className="text-white capitalize">{selected.userResponse.selectedColor}</span></div>}
                  </div>
                </div>
              )}

              {/* Admin feedback (rejection note) */}
              {selected.adminNote && (
                <div>
                  <div className="text-gray-400 text-xs mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Admin Feedback</div>
                  <p className="text-gray-300 text-sm bg-gray-800 rounded-xl p-3">{selected.adminNote}</p>
                </div>
              )}

              {/* Linked order */}
              {selected.orderId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs">
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-300">Order placed: <strong>#{selected.orderId.slice(-6).toUpperCase()}</strong></span>
                </div>
              )}

              {/* ===== SUGGESTION FORM ===== */}
              {showSuggestionForm && selected.status === 'pending' && (
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <h4 className="text-white font-semibold text-sm">Suggest Changes</h4>
                  </div>

                  {/* Fabrics */}
                  <div className="mb-3">
                    <div className="text-gray-400 text-xs mb-2">Suggest Fabrics (optional)</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {FABRIC_OPTIONS.map(f => (
                        <button key={f} onClick={() => toggleFabric(f)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all border ${
                            suggestion.fabrics.includes(f) ? 'bg-orange-500 text-white border-orange-500' : 'border-white/10 text-gray-400 hover:border-orange-400 hover:text-orange-300'
                          }`}>{f}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={customFabric} onChange={e => setCustomFabric(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomFabric()}
                        placeholder="Add custom fabric…"
                        className="flex-1 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-orange-400" />
                      <button onClick={addCustomFabric} className="px-2 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {suggestion.fabrics.length > 0 && <div className="mt-1.5 text-xs text-orange-400 capitalize">Selected: {suggestion.fabrics.join(', ')}</div>}
                  </div>

                  {/* Colors */}
                  <div className="mb-3">
                    <div className="text-gray-400 text-xs mb-2">Suggest Colors (optional)</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {COLOR_OPTIONS.map(c => (
                        <button key={c} onClick={() => toggleColor(c)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all border ${
                            suggestion.colors.includes(c) ? 'bg-pink-500 text-white border-pink-500' : 'border-white/10 text-gray-400 hover:border-pink-400 hover:text-pink-300'
                          }`}>{c}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={customColor} onChange={e => setCustomColor(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomColor()}
                        placeholder="Add custom color…"
                        className="flex-1 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-pink-400" />
                      <button onClick={addCustomColor} className="px-2 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {suggestion.colors.length > 0 && <div className="mt-1.5 text-xs text-pink-400 capitalize">Selected: {suggestion.colors.join(', ')}</div>}
                  </div>

                  {/* Message */}
                  <div className="mb-3">
                    <div className="text-gray-400 text-xs mb-1.5">Message to Customer <span className="text-red-400">*</span></div>
                    <textarea value={suggestion.message}
                      onChange={e => setSuggestion(s => ({ ...s, message: e.target.value }))}
                      rows={3}
                      placeholder="e.g. The requested silk fabric is unavailable. We suggest velvet or georgette in maroon or gold."
                      className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 placeholder-gray-600 resize-none" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setShowSuggestionForm(false); setSuggestion({ fabrics: [], colors: [], message: '' }); }}
                      className="flex-1 py-2 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-all">
                      Cancel
                    </button>
                    <button onClick={() => handleSuggestChanges(selected.id)} disabled={actionLoading || !suggestion.message.trim()}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all">
                      {actionLoading ? 'Sending…' : 'Send Suggestions'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons for pending */}
              {selected.status === 'pending' && !showSuggestionForm && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(selected.id)} disabled={actionLoading}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => setShowRejectModal(selected.id)} disabled={actionLoading}
                      className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20 hover:border-transparent disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                  <button onClick={() => setShowSuggestionForm(true)}
                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-amber-500/20 hover:border-transparent">
                    <Wand2 className="w-4 h-4" /> Suggest Changes
                  </button>
                </div>
              )}

              {/* Approve after user confirms */}
              {selected.status === 'user-confirmed' && (
                <button onClick={() => handleApproveAfterConfirmation(selected.id)} disabled={actionLoading}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> {actionLoading ? 'Approving…' : 'Approve for Ordering'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-white font-bold text-lg mb-2">Reject Request</h3>
            <p className="text-gray-400 text-sm mb-4">Optionally add feedback to help the customer understand why their request was rejected.</p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. The design requires more detail or reference images..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 placeholder-gray-600 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(null); setRejectNote(''); }}
                className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all">
                Cancel
              </button>
              <button onClick={() => handleReject(showRejectModal)} disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
                {actionLoading ? 'Rejecting…' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
