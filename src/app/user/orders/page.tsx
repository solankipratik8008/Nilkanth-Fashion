'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Package, Clock, ShoppingBag, CheckCircle, XCircle, MapPin, Phone, Mail, Truck, Palette, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/utils/pricing';
import { canCancelOrder, cancelOrder } from '@/services/orderService';
import { respondToDesignRequestSuggestion } from '@/services/designRequestService';
import toast from 'react-hot-toast';

const statusSteps = [
  'pending-review', 'awaiting-confirmation', 'user-confirmed',
  'approved-production', 'in-production', 'quality-check',
  'ready-for-delivery', 'shipped', 'delivered', 'completed',
];

const statusColors: Record<string, string> = {
  'pending-review': 'bg-yellow-100 text-yellow-700',
  'awaiting-confirmation': 'bg-amber-100 text-amber-700',
  'user-confirmed': 'bg-sky-100 text-sky-700',
  'waiting-for-fabric': 'bg-violet-100 text-violet-700',
  'approved-production': 'bg-blue-100 text-blue-700',
  'in-production': 'bg-purple-100 text-purple-700',
  'quality-check': 'bg-indigo-100 text-indigo-700',
  'ready-for-delivery': 'bg-cyan-100 text-cyan-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const statusMessages: Record<string, string> = {
  'pending-review': 'Your order request is awaiting review by our team.',
  'awaiting-confirmation': 'Our team has suggested changes. Please review and respond below.',
  'user-confirmed': 'You confirmed the changes! Our team will approve and begin production soon.',
  'waiting-for-fabric': 'Please deliver your fabric to our store within 15 days.',
  'approved-production': 'Your order is approved and entering production.',
  'in-production': 'Your outfit is being crafted by our tailors.',
  'quality-check': 'Your outfit is undergoing quality inspection.',
  'ready-for-delivery': 'Your outfit is ready and will be dispatched soon.',
  shipped: 'Your order is on its way!',
  delivered: 'Your order has been delivered.',
  completed: 'Order completed. Thank you!',
  cancelled: 'This order has been cancelled.',
  pending: 'Your order is awaiting admin review.',
};

type ConfirmMode = 'idle' | 'accept' | 'own-fabric';
interface ConfirmState { mode: ConfirmMode; fabric: string; color: string; }

const DEFAULT_STORE = {
  storeName: 'Nilkanth Fashions',
  address: 'Please contact us for the store address',
  phone: '+1 (647) 000-0000',
  email: 'nilkanthfashions1309@gmail.com',
  fabricDeliveryInstructions: 'Please deliver or ship your fabric to our store within 15 days. Make sure to include your Order ID and contact details with the package.',
};

export default function UserOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'orders' | 'requests'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [designRequests, setDesignRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [responding, setResponding] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<Record<string, ConfirmState>>({});
  const [reqConfirmState, setReqConfirmState] = useState<Record<string, ConfirmState>>({});
  const [storeInfo, setStoreInfo] = useState<any>(DEFAULT_STORE);
  // Cancel modal state
  const [cancelModal, setCancelModal] = useState<{ show: boolean; orderId: string; orderRef: string; orderStatus: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    getDoc(doc(db, 'siteSettings', 'storeInfo')).then(snap => {
      if (snap.exists()) setStoreInfo({ ...DEFAULT_STORE, ...snap.data() });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOrdersLoading(false);
    }, () => setOrdersLoading(false));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'customDesignRequests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setDesignRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRequestsLoading(false);
    }, () => setRequestsLoading(false));
    return unsub;
  }, [user]);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const getStatusProgress = (status: string) => {
    const idx = statusSteps.indexOf(status);
    return idx >= 0 ? ((idx + 1) / statusSteps.length) * 100 : 0;
  };

  // --- Order confirm state helpers ---
  const getConfirm = (id: string): ConfirmState => confirmState[id] || { mode: 'idle', fabric: '', color: '' };
  const setConfirm = (id: string, update: Partial<ConfirmState>) =>
    setConfirmState(prev => ({ ...prev, [id]: { ...getConfirm(id), ...update } }));

  // --- Design Request confirm state helpers ---
  const getReqConfirm = (id: string): ConfirmState => reqConfirmState[id] || { mode: 'idle', fabric: '', color: '' };
  const setReqConfirm = (id: string, update: Partial<ConfirmState>) =>
    setReqConfirmState(prev => ({ ...prev, [id]: { ...getReqConfirm(id), ...update } }));

  // --- Respond to listing order suggestion ---
  const respondToOrderSuggestion = async (
    orderId: string,
    type: 'accept-suggested' | 'provide-own' | 'cancel',
    extras?: { fabric: string; color: string }
  ) => {
    if (!user) return;
    setResponding(orderId);
    try {
      let newStatus: string;
      let userResponse: any;
      if (type === 'accept-suggested') {
        newStatus = 'user-confirmed';
        userResponse = { type: 'accept-suggested', selectedFabric: extras?.fabric || '', selectedColor: extras?.color || '', respondedAt: new Date().toISOString() };
      } else if (type === 'provide-own') {
        newStatus = 'waiting-for-fabric';
        userResponse = { type: 'provide-own', respondedAt: new Date().toISOString() };
      } else {
        newStatus = 'cancelled';
        userResponse = { type: 'cancel', respondedAt: new Date().toISOString() };
      }
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, userResponse, updatedAt: new Date() });
      setConfirm(orderId, { mode: 'idle', fabric: '', color: '' });
      const msgs: Record<string, string> = {
        'accept-suggested': `Changes accepted! Selected: ${extras?.fabric || ''}${extras?.color ? ` / ${extras.color}` : ''}. Our team will approve soon.`,
        'provide-own': 'Got it! Please deliver your fabric to our store within 15 days.',
        cancel: 'Order cancelled.',
      };
      toast.success(msgs[type]);
    } catch {
      toast.error('Failed to respond. Please try again.');
    }
    setResponding(null);
  };

  // --- Respond to design request suggestion ---
  const respondToReqSuggestion = async (
    requestId: string,
    type: 'accept-suggested' | 'provide-own' | 'cancel',
    extras?: { fabric: string; color: string }
  ) => {
    setResponding(requestId);
    try {
      await respondToDesignRequestSuggestion(requestId, type, extras);
      setReqConfirm(requestId, { mode: 'idle', fabric: '', color: '' });
      const msgs: Record<string, string> = {
        'accept-suggested': `Selection confirmed! ${extras?.fabric || ''}${extras?.color ? ` / ${extras.color}` : ''}. Our team will approve soon.`,
        'provide-own': 'Got it! Please deliver your fabric to our store within 15 days.',
        cancel: 'Design request cancelled.',
      };
      toast.success(msgs[type]);
    } catch {
      toast.error('Failed to respond. Please try again.');
    }
    setResponding(null);
  };

  // --- Cancel order ---
  const confirmCancelOrder = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await cancelOrder(cancelModal.orderId, cancelReason);
      setCancelModal(null);
      setCancelReason('');
      toast.success('Order cancelled successfully.');
    } catch {
      toast.error('Failed to cancel order. Please try again.');
    }
    setCancelling(false);
  };

  const needsConfirmation = (order: any) => order.status === 'awaiting-confirmation';

  // --- Suggestion response UI (shared between orders and design requests) ---
  const renderSuggestionResponse = (
    id: string,
    sugg: any,
    confirm: ConfirmState,
    onSetConfirm: (update: Partial<ConfirmState>) => void,
    onRespond: (type: 'accept-suggested' | 'provide-own' | 'cancel', extras?: { fabric: string; color: string }) => void
  ) => (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-amber-800 mb-1">Message from our team:</p>
      <p className="text-xs text-amber-700 mb-3 leading-relaxed">{sugg.message || sugg.notes}</p>

      {confirm.mode === 'idle' && (
        <div className="space-y-2">
          {(sugg.fabrics?.length > 0 || sugg.colors?.length > 0) && (
            <button onClick={() => onSetConfirm({ mode: 'accept', fabric: sugg.fabrics?.[0] || '', color: sugg.colors?.[0] || '' })}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
              <CheckCircle className="w-4 h-4" /> I accept one of the suggested fabrics/colors
            </button>
          )}
          <button onClick={() => onSetConfirm({ mode: 'own-fabric', fabric: '', color: '' })}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Truck className="w-4 h-4" /> I will provide my own fabric
          </button>
          <button onClick={() => onRespond('cancel')} disabled={responding === id}
            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-red-200 transition-colors disabled:opacity-60">
            <XCircle className="w-4 h-4" /> Cancel my order
          </button>
        </div>
      )}

      {confirm.mode === 'accept' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-amber-800">Select your preferred fabric and color:</p>
          {sugg.fabrics?.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1.5">Fabric:</div>
              <div className="flex flex-wrap gap-2">
                {sugg.fabrics.map((f: string) => (
                  <button key={f} onClick={() => onSetConfirm({ fabric: f })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${confirm.fabric === f ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
          {sugg.colors?.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1.5">Color:</div>
              <div className="flex flex-wrap gap-2">
                {sugg.colors.map((c: string) => (
                  <button key={c} onClick={() => onSetConfirm({ color: c })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${confirm.color === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onSetConfirm({ mode: 'idle' })}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors">Back</button>
            <button
              onClick={() => onRespond('accept-suggested', { fabric: confirm.fabric, color: confirm.color })}
              disabled={responding === id || (!confirm.fabric && sugg.fabrics?.length > 0)}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
              {responding === id ? 'Confirming…' : 'Confirm Selection'}
            </button>
          </div>
        </div>
      )}

      {confirm.mode === 'own-fabric' && (
        <div className="space-y-3">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-violet-800 mb-3">Deliver your fabric to our store within 15 days:</p>
            <div className="space-y-2 text-xs text-violet-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div><div className="font-semibold">{storeInfo.storeName}</div><div>{storeInfo.address}</div></div>
              </div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{storeInfo.phone}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><span>{storeInfo.email}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-violet-200 text-xs text-violet-700">
              <strong>Instructions:</strong> {storeInfo.fabricDeliveryInstructions}
            </div>
            <div className="mt-2 text-xs text-violet-600 font-medium">
              Include your Order ID <strong>#{id.slice(-6).toUpperCase()}</strong> with your fabric.
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSetConfirm({ mode: 'idle' })}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors">Back</button>
            <button onClick={() => onRespond('provide-own')} disabled={responding === id}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60">
              {responding === id ? 'Confirming…' : 'I Understand, Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Track your custom tailoring requests</p>
          </div>
          <Link href="/collections" className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full font-semibold text-sm hover:bg-rose-600 transition-colors">
            <ShoppingBag className="w-4 h-4" /> New Request
          </Link>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1 mb-6 w-fit">
          <button onClick={() => setMainTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'orders' ? 'bg-rose-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            <Package className="w-4 h-4" /> My Orders
            {orders.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${mainTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{orders.length}</span>}
          </button>
          <button onClick={() => setMainTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'requests' ? 'bg-rose-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            <Palette className="w-4 h-4" /> Design Requests
            {designRequests.filter(r => ['pending', 'awaiting-confirmation'].includes(r.status)).length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${mainTab === 'requests' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                {designRequests.filter(r => ['pending', 'awaiting-confirmation'].includes(r.status)).length}
              </span>
            )}
          </button>
        </div>

        {/* ===== DESIGN REQUESTS TAB ===== */}
        {mainTab === 'requests' && (
          <>
            {requestsLoading ? (
              <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>
            ) : designRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="font-semibold text-gray-800 mb-2">No design requests yet</h3>
                <p className="text-gray-500 text-sm mb-6">Have your own design idea? Upload images and we'll make it for you.</p>
                <Link href="/custom-design" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-md transition-all">Upload Your Design</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {designRequests.map((req, i) => {
                  const reqConfirm = getReqConfirm(req.id);
                  return (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Palette className="w-5 h-5 text-purple-500" /></div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">Request #{req.id.slice(-6).toUpperCase()}</div>
                            <div className="text-xs text-gray-400 capitalize">{req.category?.replace(/-/g, ' ')} • {req.occasion}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700 animate-pulse">Under Review</span>}
                          {req.status === 'awaiting-confirmation' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 animate-pulse">Action Required</span>}
                          {req.status === 'user-confirmed' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-sky-100 text-sky-700">Confirmed</span>}
                          {req.status === 'waiting-for-fabric' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-100 text-violet-700">Fabric Needed</span>}
                          {req.status === 'approved' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">✓ Approved</span>}
                          {req.status === 'order-placed' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">Order Placed</span>}
                          {req.status === 'rejected' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700">✕ Not Approved</span>}
                          {req.status === 'cancelled' && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-600">Cancelled</span>}
                          <span className="text-xs text-gray-400">{req.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}</span>
                        </div>
                      </div>
                      <div className="px-6 py-4">
                        {/* Design Images */}
                        {req.designImages?.length > 0 && (
                          <div className="flex gap-2 mb-4">
                            {req.designImages.slice(0, 4).map((url: string, j: number) => (
                              <div key={j} className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                <Image src={url} alt="" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                        {req.description && <p className="text-sm text-gray-700 mb-3 line-clamp-2">{req.description}</p>}
                        <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
                          {req.preferredFabric && <span className="capitalize">Fabric: <strong>{req.preferredFabric}</strong></span>}
                          {req.budget && <span>Budget: <strong>CAD ${req.budget}</strong></span>}
                        </div>

                        {/* Status-specific content */}
                        {req.status === 'pending' && (
                          <div className="px-3 py-2 bg-yellow-50 rounded-xl text-xs text-yellow-700 font-medium">
                            ⏳ Our team is reviewing your design. You'll be notified within 24–48 hours.
                          </div>
                        )}

                        {req.status === 'awaiting-confirmation' && req.adminSuggestions && (
                          renderSuggestionResponse(
                            req.id,
                            req.adminSuggestions,
                            reqConfirm,
                            (update) => setReqConfirm(req.id, update),
                            (type, extras) => respondToReqSuggestion(req.id, type, extras)
                          )
                        )}

                        {req.status === 'user-confirmed' && (
                          <div className="px-3 py-2 bg-sky-50 rounded-xl text-xs text-sky-700 font-medium">
                            ✅ You confirmed your selection. Our team is reviewing before final approval.
                            {req.userResponse?.selectedFabric && <span className="block mt-1">Selected: <strong className="capitalize">{req.userResponse.selectedFabric}</strong>{req.userResponse.selectedColor ? ` / ${req.userResponse.selectedColor}` : ''}</span>}
                          </div>
                        )}

                        {req.status === 'waiting-for-fabric' && (
                          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-violet-800 mb-2">Deliver your fabric to our store within 15 days:</p>
                            <div className="space-y-1.5 text-xs text-violet-700">
                              <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><div><div className="font-semibold">{storeInfo.storeName}</div><div>{storeInfo.address}</div></div></div>
                              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{storeInfo.phone}</span></div>
                            </div>
                            <div className="mt-2 text-xs text-violet-600 font-medium">Request ID: <strong>#{req.id.slice(-6).toUpperCase()}</strong></div>
                          </div>
                        )}

                        {req.status === 'approved' && (
                          <div className="space-y-3">
                            <div className="px-3 py-2 bg-green-50 rounded-xl text-xs text-green-700 font-medium">
                              ✅ Your design request has been approved! Proceed to select fabric, measurements and delivery options.
                            </div>
                            <Link href={`/order/new?requestId=${req.id}`}
                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-md transition-all">
                              Proceed to Order <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}

                        {req.status === 'order-placed' && (
                          <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />
                            Order placed! Check your <Link href="#" onClick={() => setMainTab('orders')} className="underline font-semibold">My Orders</Link> tab to track it.
                            {req.orderId && <span className="ml-auto font-bold">#{req.orderId.slice(-6).toUpperCase()}</span>}
                          </div>
                        )}

                        {req.status === 'rejected' && (
                          <div className="space-y-2">
                            <div className="px-3 py-2 bg-red-50 rounded-xl text-xs text-red-700">
                              <span className="font-semibold">Not approved at this time.</span>
                              {req.adminNote && <p className="mt-1">{req.adminNote}</p>}
                            </div>
                            <Link href="/custom-design" className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:border-rose-300 hover:text-rose-600 transition-all">
                              Submit a new request
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== ORDERS TAB ===== */}
        {mainTab === 'orders' && (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['all', 'pending-review', 'awaiting-confirmation', 'waiting-for-fabric', 'approved-production', 'in-production', 'shipped', 'completed', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize ${filter === f ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'}`}>
                  {f === 'all' ? 'All Orders' : f.replace(/-/g, ' ')}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="font-semibold text-gray-800 mb-2">No orders {filter !== 'all' ? `with status "${filter.replace(/-/g, ' ')}"` : 'yet'}</h3>
                <p className="text-gray-500 text-sm mb-6">Start browsing and submit your first custom order request</p>
                <Link href="/collections" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-md transition-all">Browse Collections</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, i) => {
                  const confirm = getConfirm(order.id);
                  const sugg = order.adminSuggestions;
                  const isCancellable = canCancelOrder(order.status);
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">

                      {/* Order header */}
                      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-rose-500" /></div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">Order #{order.id.slice(-6).toUpperCase()}</div>
                            <div className="text-xs text-gray-400">{order.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {needsConfirmation(order) && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 animate-pulse">Action Required</span>
                          )}
                          {order.status === 'waiting-for-fabric' && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-100 text-violet-700">Fabric Needed</span>
                          )}
                          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status?.replace(/-/g, ' ')}
                          </span>
                          <span className="font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</span>
                        </div>
                      </div>

                      <div className="px-6 py-4">
                        {/* Status message */}
                        {statusMessages[order.status] && (
                          <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium ${
                            order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            needsConfirmation(order) ? 'bg-amber-50 text-amber-700' :
                            order.status === 'waiting-for-fabric' ? 'bg-violet-50 text-violet-700' :
                            ['user-confirmed', 'approved-production', 'completed'].includes(order.status) ? 'bg-green-50 text-green-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {statusMessages[order.status]}
                          </div>
                        )}

                        {/* Admin Suggested Changes — 3-option response */}
                        {needsConfirmation(order) && sugg && (
                          renderSuggestionResponse(
                            order.id,
                            sugg,
                            confirm,
                            (update) => setConfirm(order.id, update),
                            (type, extras) => respondToOrderSuggestion(order.id, type, extras)
                          )
                        )}

                        {/* Waiting for fabric */}
                        {order.status === 'waiting-for-fabric' && (
                          <div className="mb-3 bg-violet-50 border border-violet-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-violet-800 mb-2">Deliver your fabric to our store:</p>
                            <div className="space-y-1.5 text-xs text-violet-700">
                              <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><div><div className="font-semibold">{storeInfo.storeName}</div><div>{storeInfo.address}</div></div></div>
                              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{storeInfo.phone}</span></div>
                            </div>
                            <div className="mt-2 text-xs text-violet-600 font-medium">Order ID: <strong>#{order.id.slice(-6).toUpperCase()}</strong></div>
                          </div>
                        )}

                        {/* Admin Note */}
                        {order.adminNote && (
                          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                            <span className="font-semibold">Note from our team:</span> {order.adminNote}
                          </div>
                        )}

                        {/* Progress bar */}
                        {!['cancelled', 'completed', 'waiting-for-fabric'].includes(order.status) && !needsConfirmation(order) && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                              <span>Order Progress</span>
                              <span>{Math.round(getStatusProgress(order.status))}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-gradient-to-r from-rose-400 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${getStatusProgress(order.status)}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Items preview */}
                        {order.items?.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {order.items.slice(0, 2).map((item: any, j: number) => (
                              <div key={j} className="flex items-center gap-3">
                                {item.designImage && <img src={item.designImage} alt={item.designName} className="w-12 h-14 rounded-lg object-cover" />}
                                <div>
                                  <div className="text-sm font-medium text-gray-800">{item.designName}</div>
                                  <div className="text-xs text-gray-400 capitalize">{item.fabric} • {item.sizeType === 'standard' ? item.standardSize : 'Custom Size'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {order.estimatedDelivery && !['cancelled', 'completed'].includes(order.status) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Clock className="w-3.5 h-3.5" />
                            Est. Delivery: {new Date(order.estimatedDelivery?.seconds ? order.estimatedDelivery.seconds * 1000 : order.estimatedDelivery).toLocaleDateString()}
                          </div>
                        )}

                        {/* Cancel button */}
                        {isCancellable && (
                          <button
                            onClick={() => setCancelModal({ show: true, orderId: order.id, orderRef: order.id.slice(-6).toUpperCase(), orderStatus: order.status })}
                            className="mt-1 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== CANCEL ORDER MODAL ===== */}
      <AnimatePresence>
        {cancelModal?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { if (!cancelling) { setCancelModal(null); setCancelReason(''); } }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Cancel Order #{cancelModal.orderRef}?</h3>
                  <p className="text-gray-500 text-sm">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
                <strong>⚠ Important:</strong> Cancelling this order may stop the production process. If tailoring has already begun, cancellation may not be possible and fabric costs may apply. Please contact us if you have concerns.
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for cancellation (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Change of plans, found a different design..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelModal(null); setCancelReason(''); }}
                  disabled={cancelling}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50">
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'Yes, Cancel Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
