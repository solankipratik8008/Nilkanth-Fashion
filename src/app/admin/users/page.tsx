'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Search, Shield, User, ShieldOff, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const promoteToAdmin = async (uid: string) => {
    if (!confirm('Promote this user to admin? They will have full admin access.')) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role: 'admin' });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'admin' } : u));
      if (selected?.uid === uid) setSelected((s: any) => ({ ...s, role: 'admin' }));
      toast.success('User promoted to admin!');
    } catch { toast.error('Failed to update role'); }
  };

  const demoteToUser = async (uid: string) => {
    if (uid === currentUser?.uid) { toast.error("You can't demote yourself"); return; }
    if (!confirm('Remove admin access from this user?')) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role: 'user' });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'user' } : u));
      if (selected?.uid === uid) setSelected((s: any) => ({ ...s, role: 'user' }));
      toast.success('Admin access removed');
    } catch { toast.error('Failed to update role'); }
  };

  const deactivate = async (uid: string) => {
    if (uid === currentUser?.uid) { toast.error("You can't deactivate yourself"); return; }
    if (!confirm('Deactivate this account? They will not be able to use the platform.')) return;
    try {
      await updateDoc(doc(db, 'users', uid), { active: false });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, active: false } : u));
      if (selected?.uid === uid) setSelected((s: any) => ({ ...s, active: false }));
      toast.success('Account deactivated');
    } catch { toast.error('Failed to deactivate'); }
  };

  const reactivate = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { active: true });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, active: true } : u));
      if (selected?.uid === uid) setSelected((s: any) => ({ ...s, active: true }));
      toast.success('Account reactivated');
    } catch { toast.error('Failed to reactivate'); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filtered = users.filter(u => {
    const matchSearch = u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
        <p className="text-gray-400 text-sm">{users.length} registered users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>
        <div className="flex gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
          {(['all', 'admin', 'user'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="xl:col-span-2 bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">User</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Role</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Joined</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(u => (
                    <tr key={u.id}
                      onClick={() => setSelected(u)}
                      className={`cursor-pointer transition-colors hover:bg-white/5 ${selected?.id === u.id ? 'bg-purple-600/10' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-300" />
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">{u.displayName || 'No name'}</div>
                            <div className="text-gray-400 text-xs truncate max-w-[180px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-gray-700/50 text-gray-400 border-gray-600'
                        }`}>
                          {u.role || 'user'}
                        </span>
                        {u.uid === currentUser?.uid && (
                          <span className="ml-1 text-xs text-gray-500">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.active === false ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                          {u.active === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Detail */}
        {selected ? (
          <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden sticky top-8 self-start">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-semibold">User Profile</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                {selected.photoURL ? (
                  <img src={selected.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-600/30 flex items-center justify-center">
                    <User className="w-8 h-8 text-purple-300" />
                  </div>
                )}
                <div>
                  <div className="text-white font-bold">{selected.displayName || 'No name'}</div>
                  <div className="text-gray-400 text-sm">{selected.email}</div>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                    selected.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700 text-gray-300'
                  }`}>{selected.role || 'user'}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Joined</span>
                  <span className="text-white">{formatDate(selected.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white">{selected.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Has Measurements</span>
                  <span className="text-white">{selected.measurements ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={selected.active === false ? 'text-red-400' : 'text-green-400'}>
                    {selected.active === false ? 'Inactive' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                {selected.role !== 'admin' ? (
                  <button onClick={() => promoteToAdmin(selected.uid)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white text-sm font-semibold rounded-xl transition-all">
                    <Shield className="w-4 h-4" /> Promote to Admin
                  </button>
                ) : selected.uid !== currentUser?.uid && (
                  <button onClick={() => demoteToUser(selected.uid)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 border border-white/10 text-gray-300 text-sm font-semibold rounded-xl transition-all">
                    <ShieldOff className="w-4 h-4" /> Remove Admin Access
                  </button>
                )}
                {selected.uid !== currentUser?.uid && (
                  selected.active === false ? (
                    <button onClick={() => reactivate(selected.uid)}
                      className="w-full py-2.5 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-300 hover:text-white text-sm font-semibold rounded-xl transition-all">
                      Reactivate Account
                    </button>
                  ) : (
                    <button onClick={() => deactivate(selected.uid)}
                      className="w-full py-2.5 flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white text-sm font-semibold rounded-xl transition-all">
                      Deactivate Account
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-white/5 p-8 text-center self-start">
            <User className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Click a user to view their profile and manage their account</p>
          </div>
        )}
      </div>
    </div>
  );
}
