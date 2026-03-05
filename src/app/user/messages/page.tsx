'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Mail, MessageCircle, Plus, Clock, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const SUBJECT_LABELS: Record<string, string> = {
  'custom-order': 'Custom Order',
  'bridal': 'Bridal',
  'pricing': 'Pricing',
  'order-status': 'Order Status',
  'general': 'General',
};

export default function UserMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login?redirect=/user/messages'); return; }
    fetchMessages();
  }, [user, authLoading]);

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(
        collection(db, 'contactMessages'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ));
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Messages</h1>
            <p className="text-gray-500 text-sm mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/contact"
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Message
          </Link>
        </div>

        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm mb-6">Have a question? Send us a message and we'll reply within 24 hours.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition-colors">
              <Mail className="w-4 h-4" /> Contact Us
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                  className="w-full text-left p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{SUBJECT_LABELS[msg.subject] || msg.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[msg.priority || 'medium']}`}>{msg.priority || 'medium'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[msg.status || 'open']}`}>{msg.status || 'open'}</span>
                      {msg.replies?.length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{msg.replies.length} repl{msg.replies.length === 1 ? 'y' : 'ies'}</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm truncate">{msg.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(msg.createdAt)}</p>
                  </div>
                  <div className={`text-gray-400 transition-transform shrink-0 mt-1 ${expanded === msg.id ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>

                {/* Expanded */}
                {expanded === msg.id && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
                    {/* Original */}
                    <div className="bg-gray-50 rounded-xl p-4 mt-4">
                      <p className="text-xs text-gray-400 mb-2">Your message — {formatDate(msg.createdAt)}</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {/* Replies */}
                    {msg.replies?.length > 0 && (
                      <div className="space-y-3">
                        {msg.replies.map((reply: any, i: number) => (
                          <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                            <p className="text-xs text-rose-400 mb-2 font-medium">{reply.adminName} replied • {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.status === 'open' && (!msg.replies || msg.replies.length === 0) && (
                      <p className="text-gray-400 text-sm text-center py-2">Waiting for admin reply...</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
