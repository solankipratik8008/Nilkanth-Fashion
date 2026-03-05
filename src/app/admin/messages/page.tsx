'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Search, Mail, MailOpen, X, Send, AlertTriangle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-300 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const PRIORITY_ICONS: Record<string, any> = {
  urgent: AlertTriangle,
  high: AlertCircle,
  medium: Clock,
  low: CheckCircle,
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-yellow-500/20 text-yellow-300',
  replied: 'bg-blue-500/20 text-blue-300',
  closed: 'bg-gray-500/20 text-gray-400',
};

const SUBJECT_LABELS: Record<string, string> = {
  'custom-order': 'Custom Order',
  'bridal': 'Bridal',
  'pricing': 'Pricing',
  'order-status': 'Order Status',
  'general': 'General',
};

export default function AdminMessagesPage() {
  const { isAdmin, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;
    fetchMessages();
  }, [isAdmin]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc')));
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openMessage = async (msg: any) => {
    setSelected(msg);
    setReplyText('');
    if (!msg.adminRead) {
      await updateDoc(doc(db, 'contactMessages', msg.id), { adminRead: true }).catch(() => {});
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, adminRead: true } : m));
    }
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      const reply = {
        message: replyText.trim(),
        adminName: user?.displayName || 'Nilkanth Fashions',
        createdAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'contactMessages', selected.id), {
        replies: arrayUnion(reply),
        status: 'replied',
        updatedAt: new Date(),
      });
      // If user is linked, notify them
      if (selected.userId) {
        await updateDoc(doc(db, 'users', selected.userId), {
          notifications: arrayUnion({
            id: `msg-reply-${selected.id}-${Date.now()}`,
            type: 'message_reply',
            message: `Admin replied to your message: "${replyText.trim().slice(0, 80)}${replyText.length > 80 ? '…' : ''}"`,
            messageId: selected.id,
            read: false,
            createdAt: new Date().toISOString(),
          }),
        });
      }
      const updated = { ...selected, replies: [...(selected.replies || []), reply], status: 'replied' };
      setSelected(updated);
      setMessages(prev => prev.map(m => m.id === selected.id ? updated : m));
      setReplyText('');
      toast.success('Reply sent!');
    } catch { toast.error('Failed to send reply'); }
    finally { setReplying(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'contactMessages', id), { status }).catch(() => {});
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));
    toast.success('Status updated');
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtered = messages.filter(m => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()) || m.subject?.toLowerCase().includes(search.toLowerCase()) || m.message?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter || (statusFilter === 'unread' && !m.adminRead);
    return matchSearch && matchStatus;
  });

  const unreadCount = messages.filter(m => !m.adminRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Messages</h1>
          <p className="text-gray-400 text-sm">
            {messages.length} total
            {unreadCount > 0 && <span className="ml-2 bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full">{unreadCount} unread</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
          <option value="all">All Messages</option>
          <option value="unread">Unread</option>
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Message List */}
        <div className="xl:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-white/5 p-10 text-center text-gray-400 text-sm">No messages found</div>
          ) : filtered.map(msg => {
            const PriorityIcon = PRIORITY_ICONS[msg.priority || 'medium'] || Clock;
            return (
              <div key={msg.id} onClick={() => openMessage(msg)}
                className={`bg-gray-900 rounded-xl border p-4 cursor-pointer transition-all hover:border-purple-500/40 ${selected?.id === msg.id ? 'border-purple-500/60 bg-purple-600/5' : !msg.adminRead ? 'border-white/15' : 'border-white/5'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${!msg.adminRead ? 'text-blue-400' : 'text-gray-600'}`}>
                    {!msg.adminRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${!msg.adminRead ? 'text-white' : 'text-gray-300'}`}>{msg.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[msg.priority || 'medium']}`}>
                        {msg.priority || 'medium'}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs mb-1">{msg.email}</div>
                    <div className="text-gray-300 text-xs font-medium">{SUBJECT_LABELS[msg.subject] || msg.subject}</div>
                    <div className="text-gray-500 text-xs mt-1 truncate">{msg.message}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[msg.status || 'open']}`}>{msg.status || 'open'}</span>
                      <span className="text-gray-600 text-xs">{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Detail */}
        {selected ? (
          <div className="xl:col-span-3 bg-gray-900 rounded-2xl border border-white/5 flex flex-col sticky top-8 self-start max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div>
                <div className="text-white font-bold">{selected.name}</div>
                <div className="text-gray-400 text-xs">{selected.email} {selected.phone && `• ${selected.phone}`}</div>
              </div>
              <div className="flex items-center gap-2">
                <select value={selected.status || 'open'} onChange={e => updateStatus(selected.id, e.target.value)}
                  className="text-xs bg-gray-800 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none">
                  <option value="open">Open</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original message */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_STYLES[selected.priority || 'medium']}`}>{selected.priority || 'medium'} priority</span>
                  <span className="text-gray-500 text-xs">{SUBJECT_LABELS[selected.subject] || selected.subject}</span>
                  <span className="text-gray-600 text-xs ml-auto">{formatDate(selected.createdAt)}</span>
                </div>
                <div className="bg-gray-800 rounded-xl p-4">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>

              {/* Replies */}
              {selected.replies?.map((reply: any, i: number) => (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%]">
                    <div className="text-xs text-gray-500 text-right mb-1">{reply.adminName} • {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {selected.status !== 'closed' && (
              <div className="p-4 border-t border-white/5 shrink-0">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type your reply... (user will be notified via email + in-app)"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none mb-3"
                />
                <button onClick={sendReply} disabled={replying || !replyText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-40">
                  <Send className="w-4 h-4" /> {replying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="xl:col-span-3 bg-gray-900 rounded-2xl border border-white/5 p-12 text-center self-start">
            <Mail className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Select a message to read and reply</p>
          </div>
        )}
      </div>
    </div>
  );
}
