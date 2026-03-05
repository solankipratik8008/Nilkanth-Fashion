'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Package, Heart, Ruler, Bell, Settings, LogOut, CheckCircle, ShoppingBag, Upload, ChevronRight, XCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';

const quickActions = [
  { label: 'Browse Designs', href: '/collections', icon: ShoppingBag, color: 'bg-rose-50 text-rose-600', desc: 'Explore collections' },
  { label: 'My Orders', href: '/user/orders', icon: Package, color: 'bg-blue-50 text-blue-600', desc: 'Track your orders' },
  { label: 'Measurements', href: '/user/measurements', icon: Ruler, color: 'bg-purple-50 text-purple-600', desc: 'Update measurements' },
  { label: 'Wishlist', href: '/user/wishlist', icon: Heart, color: 'bg-pink-50 text-pink-600', desc: 'Saved designs' },
  { label: 'My Messages', href: '/user/messages', icon: MessageSquare, color: 'bg-violet-50 text-violet-600', desc: 'Contact history' },
  { label: 'Custom Design', href: '/custom-design', icon: Upload, color: 'bg-orange-50 text-orange-600', desc: 'Upload your design' },
];

const orderStatusColors: Record<string, string> = {
  'pending': 'bg-yellow-100 text-yellow-700',
  'design-approved': 'bg-blue-100 text-blue-700',
  'in-production': 'bg-purple-100 text-purple-700',
  'delivered': 'bg-green-100 text-green-700',
  'completed': 'bg-gray-100 text-gray-700',
};

interface Notification {
  id: string;
  type: 'design_request' | 'order_update' | string;
  status: string;
  message: string;
  requestId?: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export default function UserDashboard() {
  const { user, userProfile, logOut, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [designRequests, setDesignRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    // Real-time orders listener
    const ordersQ = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOrdersLoading(false);
    }, (e) => { console.error(e); setOrdersLoading(false); });

    // Design requests (one-time fetch is fine — admin notifications cover updates)
    getDocs(query(collection(db, 'customDesignRequests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5)))
      .then(snap => setDesignRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error);

    return unsubOrders;
  }, [user]);

  const markAllRead = async () => {
    if (!user || !userProfile) return;
    try {
      const notifications: Notification[] = (userProfile as any).notifications || [];
      const updated = notifications.map((n: Notification) => ({ ...n, read: true }));
      await updateDoc(doc(db, 'users', user.uid), { notifications: updated });
    } catch (e) { console.error(e); }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center pt-24">
      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const displayName = userProfile?.displayName || user.displayName || 'Fashionista';
  const hasMeasurements = !!(userProfile?.measurements?.bust);
  const notifications: Notification[] = ((userProfile as any)?.notifications || [])
    .slice().reverse().slice(0, 10);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-700 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="relative flex items-center gap-6">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Avatar" width={80} height={80} className="rounded-full border-4 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white/70 text-sm font-medium">Welcome back,</p>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-white/70 mt-1">{user.email}</p>
            </div>
            <div className="ml-auto hidden md:flex gap-4">
              <Link href="/user/settings" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button onClick={logOut} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/30 rounded-full text-sm font-medium transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Total Orders', value: orders.length },
              { label: 'Design Requests', value: designRequests.length },
              { label: 'Completed', value: orders.filter(o => o.status === 'completed').length },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-white/70 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.map(notif => (
                <div key={notif.id} className={`px-6 py-4 flex items-start gap-4 ${!notif.read ? 'bg-rose-50/50' : ''}`}>
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    notif.status === 'approved' || notif.status === 'completed' || notif.status === 'delivered' ? 'bg-green-100'
                    : notif.status === 'rejected' || notif.status === 'cancelled' ? 'bg-red-100'
                    : notif.type === 'order_update' ? 'bg-blue-100'
                    : 'bg-amber-100'
                  }`}>
                    {notif.status === 'approved' || notif.status === 'completed' || notif.status === 'delivered' ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : notif.status === 'rejected' || notif.status === 'cancelled' ? <XCircle className="w-4 h-4 text-red-500" />
                      : notif.type === 'order_update' ? <Package className="w-4 h-4 text-blue-600" />
                      : <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 shrink-0" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Alert: Missing Measurements */}
        {!hasMeasurements && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-semibold text-amber-900 text-sm">Add your measurements</div>
                <div className="text-amber-700 text-xs">Save your measurements for faster custom orders</div>
              </div>
            </div>
            <Link href="/user/measurements" className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-full hover:bg-amber-600 transition-colors whitespace-nowrap ml-4">
              Add Now
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="group flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${action.color}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-gray-800 text-center leading-tight">{action.label}</div>
                <div className="text-xs text-gray-400 text-center mt-1">{action.desc}</div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <Link href="/user/orders" className="text-sm text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {ordersLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-500 text-sm mb-4">No orders yet</p>
                <Link href="/collections" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold rounded-full hover:shadow-md transition-all">
                  Browse Collections
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map(order => (
                  <div key={order.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                        <Package className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">#{order.id.slice(-6).toUpperCase()}</div>
                        <div className="text-xs text-gray-400">{order.createdAt?.toDate?.()?.toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${orderStatusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status?.replace(/-/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Design Requests */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">My Design Requests</h2>
              <Link href="/custom-design" className="text-sm text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1">
                New Request <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {ordersLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>
            ) : designRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">✏️</div>
                <p className="text-gray-500 text-sm mb-4">No design requests yet</p>
                <Link href="/custom-design" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold rounded-full hover:shadow-md transition-all">
                  Submit Design
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {designRequests.map(req => (
                  <div key={req.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {req.designImages?.[0] ? (
                        <div className="relative w-9 h-11 rounded-lg overflow-hidden shrink-0">
                          <Image src={req.designImages[0]} alt="" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-11 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4 text-purple-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800 text-sm capitalize">{req.category?.replace(/-/g, ' ') || 'Custom Design'}</div>
                        <div className="text-xs text-gray-400">{req.createdAt?.toDate?.()?.toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {req.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                      {req.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700'
                        : req.status === 'rejected' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Custom Design CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 text-white text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-white/70" />
          <h3 className="text-2xl font-bold mb-2">Have a Design in Mind?</h3>
          <p className="text-white/80 mb-6 max-w-md mx-auto">Upload your own design inspiration and our tailors will bring it to life!</p>
          <Link href="/custom-design" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-purple-700 font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all">
            <Upload className="w-5 h-5" /> Upload Custom Design
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
