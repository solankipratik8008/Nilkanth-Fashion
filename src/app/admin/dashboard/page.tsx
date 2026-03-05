'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  collection, query, getDocs, orderBy, limit, where, updateDoc, doc, getCountFromServer, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  Package, Users, Palette, TrendingUp, Star,
  CheckCircle, XCircle, ShoppingBag, AlertTriangle, Upload, Settings, DollarSign, Eye, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STATUSES = [
  'pending-review', 'changes-suggested', 'awaiting-confirmation', 'user-confirmed',
  'approved-production', 'in-production', 'quality-check',
  'ready-for-delivery', 'shipped', 'delivered', 'completed', 'cancelled',
  'pending', 'design-approved', 'design-rejected',
];

const STATUS_COLORS: Record<string, string> = {
  'pending-review': 'bg-yellow-500/20 text-yellow-300',
  'changes-suggested': 'bg-orange-500/20 text-orange-300',
  'awaiting-confirmation': 'bg-amber-500/20 text-amber-300',
  'user-confirmed': 'bg-sky-500/20 text-sky-300',
  'approved-production': 'bg-blue-500/20 text-blue-300',
  'in-production': 'bg-indigo-500/20 text-indigo-300',
  delivered: 'bg-green-500/20 text-green-300',
  completed: 'bg-emerald-500/20 text-emerald-300',
  cancelled: 'bg-red-500/20 text-red-300',
  shipped: 'bg-cyan-500/20 text-cyan-300',
  pending: 'bg-yellow-500/20 text-yellow-300',
  'design-approved': 'bg-blue-500/20 text-blue-300',
};

function StatCard({ label, value, icon: Icon, gradient, change }: {
  label: string; value: string | number; icon: any; gradient: string; change?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">{change}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ orders: 0, users: 0, pendingRequests: 0, revenue: 0, designs: 0, views: 0, unreadMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      try {
        const [ordersSnap, requestsSnap, usersCount, designsCount, viewsSnap, unreadMsgs] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(8))),
          getDocs(query(collection(db, 'customDesignRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))),
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'designs')),
          getDoc(doc(db, 'siteAnalytics', 'views')),
          getCountFromServer(query(collection(db, 'contactMessages'), where('adminRead', '==', false))),
        ]);

        const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const requestsData = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const revenue = ordersData.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

        setOrders(ordersData);
        setCustomRequests(requestsData);
        setStats({
          orders: ordersData.length,
          users: usersCount.data().count,
          pendingRequests: requestsData.length,
          revenue,
          designs: designsCount.data().count,
          views: viewsSnap.exists() ? (viewsSnap.data().total || 0) : 0,
          unreadMessages: unreadMsgs.data().count,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const approveRequest = async (id: string) => {
    try {
      await updateDoc(doc(db, 'customDesignRequests', id), { status: 'approved', updatedAt: new Date() });
      setCustomRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Design request approved!');
    } catch { toast.error('Failed to approve'); }
  };

  const rejectRequest = async (id: string) => {
    try {
      await updateDoc(doc(db, 'customDesignRequests', id), { status: 'rejected', updatedAt: new Date() });
      setCustomRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Request rejected.');
    } catch { toast.error('Failed to reject'); }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date() });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Orders" value={stats.orders} icon={ShoppingBag} gradient="from-rose-600 to-pink-600" />
        <StatCard label="Registered Users" value={stats.users} icon={Users} gradient="from-blue-600 to-indigo-600" />
        <StatCard label="Est. Revenue (CAD)" value={`$${stats.revenue.toLocaleString()}`} icon={TrendingUp} gradient="from-green-600 to-emerald-600" />
        <StatCard label="Live Designs" value={stats.designs} icon={Palette} gradient="from-purple-600 to-violet-600" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Site Page Views" value={stats.views.toLocaleString()} icon={Eye} gradient="from-cyan-600 to-teal-600" />
        <StatCard label="Pending Requests" value={stats.pendingRequests} icon={AlertTriangle} gradient="from-amber-500 to-orange-500" />
        <StatCard label="Unread Messages" value={stats.unreadMessages} icon={MessageSquare} gradient="from-violet-600 to-purple-600" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Add Design', href: '/admin/designs/new', icon: Palette, color: 'from-rose-600 to-pink-600' },
          { label: 'View Orders', href: '/admin/orders', icon: Package, color: 'from-blue-600 to-indigo-600' },
          { label: 'Pricing Rules', href: '/admin/pricing', icon: DollarSign, color: 'from-green-600 to-emerald-600' },
          { label: 'Site Content', href: '/admin/content', icon: Settings, color: 'from-purple-600 to-violet-600' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`bg-gradient-to-r ${a.color} p-4 rounded-xl text-white font-semibold text-sm flex items-center gap-3 hover:opacity-90 hover:scale-[1.02] transition-all`}>
            <a.icon className="w-5 h-5" />{a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Design Requests */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" />
              <h2 className="text-white font-semibold text-sm">Pending Design Requests</h2>
              {customRequests.length > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">{customRequests.length}</span>
              )}
            </div>
            <Link href="/admin/requests" className="text-xs text-purple-400 hover:text-purple-300">View All →</Link>
          </div>
          {customRequests.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle className="w-9 h-9 text-green-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">All caught up! No pending requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {customRequests.slice(0, 4).map(req => (
                <div key={req.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{req.userName}</div>
                      <div className="text-gray-400 text-xs truncate">{req.userEmail}</div>
                      <div className="text-gray-500 text-xs mt-0.5 capitalize">{req.category?.replace(/-/g, ' ')} • {req.occasion}</div>
                    </div>
                    {req.designImages?.[0] && (
                      <img src={req.designImages[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-1">{req.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => approveRequest(req.id)}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => rejectRequest(req.id)}
                      className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-red-500/20 hover:border-red-600">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-400" />
              <h2 className="text-white font-semibold text-sm">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs text-purple-400 hover:text-purple-300">View All →</Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-white/5">
              {orders.slice(0, 6).map(order => (
                <div key={order.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium">#{order.id.slice(-6).toUpperCase()}</div>
                    <div className="text-gray-400 text-xs truncate">{order.userName} • ${order.totalAmount?.toFixed(0)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ${STATUS_COLORS[order.status] || 'bg-gray-700 text-gray-300'}`}>
                      {order.status?.replace(/-/g, ' ')}
                    </span>
                    <select
                      value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value)}
                      className="text-xs bg-gray-800 text-gray-300 border border-white/10 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Girls Traditional', color: 'bg-rose-500/10 border-rose-500/20 text-rose-300', icon: '👗' },
          { label: 'Girls Western', color: 'bg-blue-500/10 border-blue-500/20 text-blue-300', icon: '👚' },
          { label: 'Women Traditional', color: 'bg-purple-500/10 border-purple-500/20 text-purple-300', icon: '🥻' },
          { label: 'Women Western', color: 'bg-green-500/10 border-green-500/20 text-green-300', icon: '👗' },
          { label: 'Bridal Wear', color: 'bg-amber-500/10 border-amber-500/20 text-amber-300', icon: '👰' },
        ].map(cat => (
          <Link key={cat.label} href={`/admin/designs?category=${cat.label.toLowerCase().replace(/ /g, '-')}`}
            className={`${cat.color} border rounded-xl p-3 text-center hover:opacity-80 transition-all`}>
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-xs font-medium">{cat.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
