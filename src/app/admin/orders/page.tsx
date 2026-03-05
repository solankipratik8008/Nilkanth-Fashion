'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Search, Filter, DollarSign, X, ChevronDown, Download, Clock, Image as ImageIcon, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const STATUSES = [
  'pending-review', 'awaiting-confirmation', 'user-confirmed', 'waiting-for-fabric',
  'approved-production', 'in-production', 'quality-check',
  'ready-for-delivery', 'shipped', 'delivered', 'completed', 'cancelled',
  // legacy
  'pending', 'design-approved', 'design-rejected',
];

const STATUS_COLORS: Record<string, string> = {
  'pending-review': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'awaiting-confirmation': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'user-confirmed': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'waiting-for-fabric': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'approved-production': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'in-production': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'quality-check': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  shipped: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-300 border-green-500/30',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'design-approved': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'design-rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
};

const FABRIC_OPTIONS = ['silk', 'velvet', 'chiffon', 'satin', 'georgette', 'cotton', 'crepe', 'organza', 'net', 'linen', 'brocade', 'chanderi', 'banarasi', 'polyester'];
const COLOR_OPTIONS = ['red', 'maroon', 'gold', 'royal blue', 'navy blue', 'emerald', 'forest green', 'black', 'white', 'ivory', 'beige', 'pink', 'rose', 'purple', 'lavender', 'teal', 'orange', 'cream', 'silver', 'champagne'];

export default function AdminOrdersPage() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [editingTime, setEditingTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [suggestion, setSuggestion] = useState({ fabrics: [] as string[], colors: [] as string[], message: '' });
  const [customFabric, setCustomFabric] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [savingSuggestion, setSavingSuggestion] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchOrders();
  }, [isAdmin, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let q = statusFilter === 'all'
        ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'orders'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    'pending-review': 'received and is under review by our team',
    'awaiting-confirmation': 'pending your confirmation of the suggested changes',
    'user-confirmed': 'confirmed by you and is awaiting production approval',
    'waiting-for-fabric': 'waiting for you to deliver the fabric to our store',
    'approved-production': 'approved and will now go into production',
    'design-approved': 'approved and will now go into production',
    'design-rejected': 'rejected by our team. Please contact us for more details',
    'in-production': 'now in production',
    'quality-check': 'currently in quality check',
    'ready-for-delivery': 'ready for delivery',
    'shipped': 'shipped and on its way',
    'delivered': 'delivered',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date() });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selected?.id === orderId) setSelected((s: any) => ({ ...s, status }));
      if (order?.userId && statusLabels[status]) {
        const designName = order.items?.[0]?.designName || 'your order';
        await updateDoc(doc(db, 'users', order.userId), {
          notifications: arrayUnion({
            id: `${orderId}-${status}-${Date.now()}`,
            type: 'order_update',
            status,
            message: `Your order for "${designName}" is ${statusLabels[status]}.`,
            orderId,
            read: false,
            createdAt: new Date().toISOString(),
          }),
        });
      }
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const savePrice = async () => {
    if (!selected || !editingPrice) return;
    const price = parseFloat(editingPrice);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }
    setSavingPrice(true);
    try {
      await updateDoc(doc(db, 'orders', selected.id), { totalAmount: price, priceAdjustedByAdmin: true, updatedAt: new Date() });
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, totalAmount: price } : o));
      setSelected((s: any) => ({ ...s, totalAmount: price }));
      if (selected.userId) {
        const designName = selected.items?.[0]?.designName || 'your order';
        await updateDoc(doc(db, 'users', selected.userId), {
          notifications: arrayUnion({ id: `${selected.id}-price-${Date.now()}`, type: 'order_update', status: 'price-updated', message: `The confirmed price for "${designName}" has been updated to CA$${price.toFixed(2)}.`, orderId: selected.id, read: false, createdAt: new Date().toISOString() }),
        });
      }
      toast.success('Price updated & user notified');
      setEditingPrice('');
    } catch { toast.error('Failed to update price'); }
    setSavingPrice(false);
  };

  const saveProductionTime = async () => {
    if (!selected || !editingTime.trim()) return;
    setSavingTime(true);
    try {
      await updateDoc(doc(db, 'orders', selected.id), { productionTimeEstimate: editingTime.trim(), updatedAt: new Date() });
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, productionTimeEstimate: editingTime.trim() } : o));
      setSelected((s: any) => ({ ...s, productionTimeEstimate: editingTime.trim() }));
      if (selected.userId) {
        const designName = selected.items?.[0]?.designName || 'your order';
        await updateDoc(doc(db, 'users', selected.userId), {
          notifications: arrayUnion({ id: `${selected.id}-time-${Date.now()}`, type: 'order_update', status: 'time-updated', message: `Estimated production time for "${designName}": ${editingTime.trim()}.`, orderId: selected.id, read: false, createdAt: new Date().toISOString() }),
        });
      }
      toast.success('Production time saved & user notified');
      setEditingTime('');
    } catch { toast.error('Failed to save production time'); }
    setSavingTime(false);
  };

  const saveAdminNote = async () => {
    if (!selected || !adminNote.trim()) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'orders', selected.id), { adminNote: adminNote.trim(), updatedAt: new Date() });
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, adminNote: adminNote.trim() } : o));
      setSelected((s: any) => ({ ...s, adminNote: adminNote.trim() }));
      if (selected.userId) {
        const designName = selected.items?.[0]?.designName || 'your order';
        await updateDoc(doc(db, 'users', selected.userId), {
          notifications: arrayUnion({ id: `${selected.id}-note-${Date.now()}`, type: 'order_update', status: 'note-added', message: `Admin note for "${designName}": ${adminNote.trim()}`, orderId: selected.id, read: false, createdAt: new Date().toISOString() }),
        });
      }
      toast.success('Note saved & user notified');
      setAdminNote('');
    } catch { toast.error('Failed to save note'); }
    setSavingNote(false);
  };

  const toggleFabric = (f: string) => setSuggestion(s => ({
    ...s, fabrics: s.fabrics.includes(f) ? s.fabrics.filter(x => x !== f) : [...s.fabrics, f],
  }));
  const toggleColor = (c: string) => setSuggestion(s => ({
    ...s, colors: s.colors.includes(c) ? s.colors.filter(x => x !== c) : [...s.colors, c],
  }));
  const addCustomFabric = () => {
    const f = customFabric.trim().toLowerCase();
    if (f && !suggestion.fabrics.includes(f)) setSuggestion(s => ({ ...s, fabrics: [...s.fabrics, f] }));
    setCustomFabric('');
  };
  const addCustomColor = () => {
    const c = customColor.trim().toLowerCase();
    if (c && !suggestion.colors.includes(c)) setSuggestion(s => ({ ...s, colors: [...s.colors, c] }));
    setCustomColor('');
  };

  const saveSuggestion = async () => {
    if (!selected || !suggestion.message.trim()) return;
    setSavingSuggestion(true);
    try {
      const suggestionData = { fabrics: suggestion.fabrics, colors: suggestion.colors, message: suggestion.message.trim(), suggestedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'orders', selected.id), {
        status: 'awaiting-confirmation',
        adminSuggestions: suggestionData,
        updatedAt: new Date(),
      });
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: 'awaiting-confirmation', adminSuggestions: suggestionData } : o));
      setSelected((s: any) => ({ ...s, status: 'awaiting-confirmation', adminSuggestions: suggestionData }));
      if (selected.userId) {
        const designName = selected.items?.[0]?.designName || 'your order';
        await updateDoc(doc(db, 'users', selected.userId), {
          notifications: arrayUnion({
            id: `${selected.id}-suggestion-${Date.now()}`,
            type: 'order_update',
            status: 'awaiting-confirmation',
            message: `Our team has suggested changes for "${designName}". Please review and respond.`,
            orderId: selected.id,
            read: false,
            createdAt: new Date().toISOString(),
          }),
        });
      }
      setSuggestion({ fabrics: [], colors: [], message: '' });
      toast.success('Suggestion sent to customer');
    } catch { toast.error('Failed to send suggestion'); }
    setSavingSuggestion(false);
  };

  const exportToExcel = (exportOrders: any[]) => {
    const rows = exportOrders.map(order => {
      const item = order.items?.[0] || {};
      const m = item.measurements || {};
      return {
        'Order ID': order.id.slice(-6).toUpperCase(),
        'Date': formatDate(order.createdAt),
        'Customer Name': order.userName || '',
        'Email': order.userEmail || '',
        'Phone': order.phone || '',
        'Design Name': item.designName || '',
        'Category': item.category || '',
        'Fabric': item.fabric || '',
        'Fabric Source': item.fabricSource?.replace(/-/g, ' ') || '',
        'Size Type': item.sizeType || '',
        'Standard Size': item.standardSize || '',
        'Chest (in)': m.chest || '',
        'Waist (in)': m.waist || '',
        'Hips (in)': m.hips || '',
        'Height (in)': m.height || '',
        'Shoulder (in)': m.shoulder || '',
        'Sleeve (in)': m.sleeve || '',
        'Inseam (in)': m.inseam || '',
        'Special Instructions': item.specialInstructions || '',
        'Delivery Method': order.deliveryMethod?.replace(/-/g, ' ') || '',
        'Delivery Address': order.deliveryAddress?.street ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.province} ${order.deliveryAddress.postalCode}` : '',
        'Amount (CAD)': order.totalAmount?.toFixed(2) || '',
        'Price Adjusted': order.priceAdjustedByAdmin ? 'Yes' : 'No',
        'Production Time': order.productionTimeEstimate || order.items?.[0]?.productionTime || '',
        'Status': order.status?.replace(/-/g, ' ') || '',
        'Admin Note': order.adminNote || '',
        'Design Image URL': item.designImage || item.images?.[0] || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || {}).map(key => ({ wch: Math.max(key.length, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `nilkanth-orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel file downloaded');
  };

  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.userName?.toLowerCase().includes(search.toLowerCase()) ||
    o.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Order Management</h1>
          <p className="text-gray-400 text-sm">{orders.length} total orders</p>
        </div>
        <button onClick={() => exportToExcel(filtered)} disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40">
          <Download className="w-4 h-4" /> Export Excel ({filtered.length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search by order ID, name, or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders Table */}
        <div className="xl:col-span-2 bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Order</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Customer</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Amount</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(order => (
                    <tr key={order.id}
                      onClick={() => { setSelected(order); setEditingPrice(order.totalAmount?.toString() || ''); setEditingTime(order.productionTimeEstimate || ''); setAdminNote(''); setSuggestion({ fabrics: [], colors: [], message: '' }); setCustomFabric(''); setCustomColor(''); }}
                      className={`cursor-pointer transition-colors hover:bg-white/5 ${selected?.id === order.id ? 'bg-purple-600/10' : ''}`}>
                      <td className="px-4 py-3"><span className="text-white font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-white text-sm font-medium">{order.userName}</div>
                        <div className="text-gray-400 text-xs truncate max-w-[140px]">{order.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-semibold">CA${order.totalAmount?.toFixed(2)}</span>
                        {order.priceAdjustedByAdmin && <div className="text-amber-400 text-xs">Admin adjusted</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border capitalize whitespace-nowrap ${STATUS_COLORS[order.status] || 'bg-gray-700/50 text-gray-400 border-gray-600'}`}>
                          {order.status?.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3"><ChevronDown className="w-4 h-4 text-gray-500 rotate-[-90deg]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail */}
        {selected ? (
          <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden sticky top-8 self-start">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <div className="text-white font-bold">#{selected.id.slice(-6).toUpperCase()}</div>
                <div className="text-gray-400 text-xs">{formatDate(selected.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportToExcel([selected])}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-medium rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">

              {/* Customer */}
              <div>
                <div className="text-gray-400 text-xs mb-2">Customer</div>
                <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{selected.userName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-white text-xs">{selected.userEmail}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Phone</span><span className="text-white">{selected.phone || '—'}</span></div>
                </div>
              </div>

              {/* Design Image */}
              {(() => {
                const img = selected.items?.[0]?.designImage || selected.items?.[0]?.images?.[0];
                if (!img) return null;
                return (
                  <div>
                    <div className="text-gray-400 text-xs mb-2 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Design Image</div>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-800">
                      <img src={img} alt="Design" className="w-full h-full object-cover" />
                    </div>
                  </div>
                );
              })()}

              {/* Order Details */}
              <div>
                <div className="text-gray-400 text-xs mb-2">Order Details</div>
                <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-sm">
                  {selected.items?.map((item: any, i: number) => (
                    <div key={i} className="space-y-1.5 pb-2 mb-2 border-b border-white/5 last:border-0 last:pb-0 last:mb-0">
                      <div className="flex justify-between"><span className="text-gray-400">Design</span><span className="text-white">{item.designName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Fabric</span><span className="text-white capitalize">{item.fabric}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Fabric Source</span><span className="text-white capitalize">{item.fabricSource?.replace(/-/g, ' ')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Size</span><span className="text-white">{item.sizeType === 'custom' ? 'Custom measurements' : `Standard — ${item.standardSize}`}</span></div>
                      {item.specialInstructions && (
                        <div className="flex flex-col gap-1"><span className="text-gray-400">Notes</span><span className="text-white text-xs">{item.specialInstructions}</span></div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between"><span className="text-gray-400">Delivery</span><span className="text-white capitalize">{selected.deliveryMethod?.replace(/-/g, ' ')}</span></div>
                  {selected.deliveryAddress?.street && (
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Address</span><span className="text-white text-right max-w-[160px]">{selected.deliveryAddress.street}, {selected.deliveryAddress.city}, {selected.deliveryAddress.province} {selected.deliveryAddress.postalCode}</span></div>
                  )}
                </div>
              </div>

              {/* Measurements */}
              {(() => {
                const measurements = selected.items?.[0]?.measurements;
                if (!measurements || Object.keys(measurements).length === 0) return null;
                return (
                  <div>
                    <div className="text-gray-400 text-xs mb-2">Custom Measurements</div>
                    <div className="bg-gray-800 rounded-xl p-3 grid grid-cols-2 gap-1.5 text-xs">
                      {Object.entries(measurements).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white">{String(val)}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Admin Note (existing) */}
              {selected.adminNote && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <div className="text-amber-400 text-xs font-medium mb-1">Admin Note (visible to customer)</div>
                  <p className="text-white text-sm">{selected.adminNote}</p>
                </div>
              )}

              {/* Existing Suggestion Summary */}
              {selected.adminSuggestions && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <div className="text-orange-400 text-xs font-medium mb-2">Suggested Changes Sent to Customer</div>
                  {(selected.adminSuggestions.fabrics?.length > 0) && (
                    <div className="text-xs text-gray-300 mb-1">
                      <span className="text-gray-500">Fabrics: </span>
                      <span className="capitalize">{selected.adminSuggestions.fabrics.join(', ')}</span>
                    </div>
                  )}
                  {(selected.adminSuggestions.colors?.length > 0) && (
                    <div className="text-xs text-gray-300 mb-1">
                      <span className="text-gray-500">Colors: </span>
                      <span className="capitalize">{selected.adminSuggestions.colors.join(', ')}</span>
                    </div>
                  )}
                  {selected.adminSuggestions.message && (
                    <div className="text-xs text-gray-300 mb-1">
                      <span className="text-gray-500">Message: </span>{selected.adminSuggestions.message}
                    </div>
                  )}
                  {selected.userResponse && (
                    <div className={`mt-2 text-xs font-semibold capitalize ${
                      selected.userResponse?.type === 'accept-suggested' ? 'text-green-400' :
                      selected.userResponse?.type === 'provide-own' ? 'text-violet-400' : 'text-red-400'
                    }`}>
                      {selected.userResponse?.type === 'accept-suggested'
                        ? `Accepted — ${selected.userResponse.selectedFabric || ''} ${selected.userResponse.selectedColor ? `/ ${selected.userResponse.selectedColor}` : ''}`
                        : selected.userResponse?.type === 'provide-own'
                        ? 'Will provide their own fabric'
                        : `Declined`}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Approve / Reject for pending-review */}
              {(selected.status === 'pending-review' || selected.status === 'pending') && (
                <div>
                  <div className="text-gray-400 text-xs mb-2">Quick Action</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateStatus(selected.id, 'approved-production')}
                      className="py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      Approve
                    </button>
                    <button onClick={() => updateStatus(selected.id, 'cancelled')}
                      className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Approve for Production after user confirmed */}
              {(selected.status === 'user-confirmed' || selected.status === 'waiting-for-fabric') && (
                <div>
                  <button onClick={() => updateStatus(selected.id, 'approved-production')}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    Approve for Production
                  </button>
                </div>
              )}

              {/* Suggest Changes — multi-select chip UI */}
              {(['pending-review', 'pending', 'user-confirmed'].includes(selected.status)) && (
                <div>
                  <div className="text-gray-400 text-xs font-medium mb-3">Suggest Changes to Customer</div>

                  {/* Fabric chips */}
                  <div className="mb-3">
                    <div className="text-gray-500 text-xs mb-2">Select fabric options to offer:</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {FABRIC_OPTIONS.map(f => (
                        <button key={f} onClick={() => toggleFabric(f)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${suggestion.fabrics.includes(f) ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-white/10'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={customFabric} onChange={e => setCustomFabric(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomFabric()}
                        placeholder="Add custom fabric..."
                        className="flex-1 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-orange-400 placeholder-gray-600" />
                      <button onClick={addCustomFabric} className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {suggestion.fabrics.length > 0 && (
                      <div className="mt-1.5 text-xs text-orange-400">Selected: {suggestion.fabrics.join(', ')}</div>
                    )}
                  </div>

                  {/* Color chips */}
                  <div className="mb-3">
                    <div className="text-gray-500 text-xs mb-2">Select color options to offer:</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {COLOR_OPTIONS.map(c => (
                        <button key={c} onClick={() => toggleColor(c)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${suggestion.colors.includes(c) ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-white/10'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={customColor} onChange={e => setCustomColor(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomColor()}
                        placeholder="Add custom color..."
                        className="flex-1 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-orange-400 placeholder-gray-600" />
                      <button onClick={addCustomColor} className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {suggestion.colors.length > 0 && (
                      <div className="mt-1.5 text-xs text-orange-400">Selected: {suggestion.colors.join(', ')}</div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="mb-2">
                    <div className="text-gray-500 text-xs mb-1.5">Message to customer (required):</div>
                    <textarea value={suggestion.message} onChange={e => setSuggestion(s => ({ ...s, message: e.target.value }))}
                      rows={3} placeholder="e.g. The selected silk fabric is currently unavailable. Please choose from the options above..."
                      className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-orange-400 resize-none placeholder-gray-600" />
                  </div>
                  <button onClick={saveSuggestion} disabled={savingSuggestion || !suggestion.message.trim()}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40">
                    {savingSuggestion ? 'Sending...' : 'Send Suggestion to Customer'}
                  </button>
                </div>
              )}

              {/* Update Status */}
              <div>
                <div className="text-gray-400 text-xs mb-2">Update Status</div>
                <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
                </select>
              </div>

              {/* Adjust Price */}
              <div>
                <div className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Confirmed Price (notifies customer)
                </div>
                <div className="flex gap-2">
                  <input type="number" value={editingPrice} onChange={e => setEditingPrice(e.target.value)}
                    placeholder={selected.totalAmount?.toFixed(2)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
                  <button onClick={savePrice} disabled={savingPrice}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {savingPrice ? '...' : 'Save'}
                  </button>
                </div>
                <div className="text-gray-500 text-xs mt-1">Current: CA${selected.totalAmount?.toFixed(2)}</div>
              </div>

              {/* Production Time */}
              <div>
                <div className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Production Time Estimate (notifies customer)
                </div>
                <div className="flex gap-2">
                  <input type="text" value={editingTime} onChange={e => setEditingTime(e.target.value)}
                    placeholder={selected.productionTimeEstimate || 'e.g. 3–4 weeks'}
                    className="flex-1 px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
                  <button onClick={saveProductionTime} disabled={savingTime}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {savingTime ? '...' : 'Save'}
                  </button>
                </div>
                {selected.productionTimeEstimate && <div className="text-gray-500 text-xs mt-1">Current: {selected.productionTimeEstimate}</div>}
              </div>

              {/* Admin Note */}
              <div>
                <div className="text-gray-400 text-xs mb-2">Message to Customer (notifies them)</div>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                  placeholder="e.g. We have a question about your fabric preference..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 resize-none placeholder-gray-600" />
                <button onClick={saveAdminNote} disabled={savingNote || !adminNote.trim()}
                  className="mt-2 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40">
                  {savingNote ? 'Sending...' : 'Send Note to Customer'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-white/5 p-8 text-center self-start">
            <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Click an order to view details and manage it</p>
          </div>
        )}
      </div>
    </div>
  );
}
