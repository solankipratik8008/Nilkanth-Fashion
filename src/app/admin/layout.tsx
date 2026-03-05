'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Crown, LayoutDashboard, Package, Palette, Upload, Star,
  Users, Settings, DollarSign, FileText, Menu, LogOut, ChevronRight, Paintbrush, MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const navLinks = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Designs', href: '/admin/designs', icon: Palette },
  { label: 'Custom Requests', href: '/admin/requests', icon: Upload },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Pricing', href: '/admin/pricing', icon: DollarSign },
  { label: 'Content', href: '/admin/content', icon: FileText },
  { label: 'Theme', href: '/admin/theme', icon: Paintbrush },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    getCountFromServer(query(collection(db, 'contactMessages'), where('adminRead', '==', false)))
      .then(snap => setUnreadMessages(snap.data().count))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/auth/login');
      else if (!isAdmin) router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Admin Panel</div>
            <div className="text-gray-500 text-xs">Nilkanth Fashions</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-4 flex-1 space-y-0.5 overflow-y-auto">
        {navLinks.map(link => {
          const active = pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <link.icon className={cn('w-4 h-4 shrink-0', active ? 'text-purple-400' : '')} />
              {link.label}
              {link.href === '/admin/messages' && unreadMessages > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadMessages}
                </span>
              )}
              {active && link.href !== '/admin/messages' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <div className="px-3 py-2 mb-1">
          <div className="text-white text-xs font-medium truncate">{user?.displayName || user?.email}</div>
          <div className="text-gray-500 text-xs">Administrator</div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm mb-1"
        >
          ← Back to site
        </Link>
        <button
          onClick={logOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-60 shrink-0 bg-gray-900 border-r border-white/5 flex-col fixed h-full z-30">
        <SidebarInner />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 bg-gray-900 border-r border-white/5 flex flex-col">
            <SidebarInner />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/5 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-white font-bold text-sm">Admin Panel</span>
          </div>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
