'use client';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { BarChart3, Users, ShoppingBag, Palette, TrendingUp, Eye, Clock } from 'lucide-react';

interface Analytics {
  totalViews: number;
  dailyViews: Record<string, number>;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalRequests: number;
  requestsByStatus: Record<string, number>;
  totalUsers: number;
  recentOrders: any[];
}

const STATUS_COLORS: Record<string, string> = {
  'pending-review': 'bg-yellow-500/20 text-yellow-400',
  'awaiting-confirmation': 'bg-blue-500/20 text-blue-400',
  'user-confirmed': 'bg-cyan-500/20 text-cyan-400',
  'waiting-for-fabric': 'bg-orange-500/20 text-orange-400',
  'in-production': 'bg-purple-500/20 text-purple-400',
  'quality-check': 'bg-indigo-500/20 text-indigo-400',
  'ready-for-pickup': 'bg-teal-500/20 text-teal-400',
  'out-for-delivery': 'bg-blue-600/20 text-blue-300',
  'delivered': 'bg-green-500/20 text-green-400',
  'cancelled': 'bg-red-500/20 text-red-400',
  'rejected': 'bg-red-500/20 text-red-400',
  'approved': 'bg-green-500/20 text-green-400',
  'order-placed': 'bg-emerald-500/20 text-emerald-400',
  'pending': 'bg-yellow-500/20 text-yellow-400',
  'awaiting-confirmation-req': 'bg-blue-500/20 text-blue-400',
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-white/5 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
      {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
    </motion.div>
  );
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Page views
        const viewsDoc = await getDoc(doc(db, 'siteAnalytics', 'views'));
        const viewsData = viewsDoc.exists() ? viewsDoc.data() : {};
        const totalViews = viewsData.total || 0;
        const dailyViews: Record<string, number> = viewsData.daily || {};

        // Orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const ordersByStatus: Record<string, number> = {};
        orders.forEach((o: any) => {
          ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        });

        // Custom requests
        const reqSnap = await getDocs(collection(db, 'customDesignRequests'));
        const requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const requestsByStatus: Record<string, number> = {};
        requests.forEach((r: any) => {
          requestsByStatus[r.status] = (requestsByStatus[r.status] || 0) + 1;
        });

        // Users
        const usersSnap = await getDocs(collection(db, 'users'));

        // Recent orders (last 5)
        const recentOrders = orders
          .sort((a: any, b: any) => {
            const at = a.createdAt?.seconds || 0;
            const bt = b.createdAt?.seconds || 0;
            return bt - at;
          })
          .slice(0, 5);

        setAnalytics({
          totalViews,
          dailyViews,
          totalOrders: orders.length,
          ordersByStatus,
          totalRequests: requests.length,
          requestsByStatus,
          totalUsers: usersSnap.size,
          recentOrders,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Last 7 days labels
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const maxDailyViews = analytics
    ? Math.max(1, ...last7Days.map(d => analytics.dailyViews[d] || 0))
    : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-gray-400 text-center py-20">Failed to load analytics.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-gray-500 text-sm">Site traffic, orders, and design request overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total Page Views" value={analytics.totalViews.toLocaleString()} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={analytics.totalOrders} color="bg-rose-500/20 text-rose-400" />
        <StatCard icon={Palette} label="Custom Requests" value={analytics.totalRequests} color="bg-purple-500/20 text-purple-400" />
        <StatCard icon={Users} label="Registered Users" value={analytics.totalUsers} color="bg-green-500/20 text-green-400" />
      </div>

      {/* Daily views chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h2 className="text-white font-semibold">Page Views — Last 7 Days</h2>
        </div>
        <div className="flex items-end gap-2 h-32">
          {last7Days.map(day => {
            const count = analytics.dailyViews[day] || 0;
            const height = Math.round((count / maxDailyViews) * 100);
            const label = new Date(day + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-gray-500 text-xs font-medium">{count}</div>
                <div className="w-full rounded-t-lg bg-blue-500/30 relative" style={{ height: `${Math.max(4, height)}%` }}>
                  <div className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 opacity-80" />
                </div>
                <div className="text-gray-600 text-[10px] text-center leading-tight">{label.split(',')[0]}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-rose-400" />
            <h2 className="text-white font-semibold">Orders by Status</h2>
          </div>
          {Object.keys(analytics.ordersByStatus).length === 0 ? (
            <p className="text-gray-500 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(analytics.ordersByStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-700 text-gray-300'}`}>
                      {status.replace(/-/g, ' ')}
                    </span>
                    <span className="text-white font-bold text-sm">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </motion.div>

        {/* Custom requests by status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-purple-400" />
            <h2 className="text-white font-semibold">Custom Requests by Status</h2>
          </div>
          {Object.keys(analytics.requestsByStatus).length === 0 ? (
            <p className="text-gray-500 text-sm">No custom requests yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(analytics.requestsByStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-700 text-gray-300'}`}>
                      {status.replace(/-/g, ' ')}
                    </span>
                    <span className="text-white font-bold text-sm">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-amber-400" />
          <h2 className="text-white font-semibold">Recent Orders</h2>
        </div>
        {analytics.recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.recentOrders.map((order: any) => {
              const createdAt = order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-CA')
                : '—';
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <div className="text-white text-sm font-medium">#{order.id.slice(-6).toUpperCase()}</div>
                    <div className="text-gray-500 text-xs">{order.userEmail || order.userName || '—'} · {createdAt}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-bold">${(order.totalAmount || 0).toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-gray-700 text-gray-300'}`}>
                      {(order.status || '').replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
