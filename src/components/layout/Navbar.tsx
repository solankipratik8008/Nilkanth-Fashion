'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, Menu, X, ChevronDown, Heart, Bell, Crown, Package, Ruler, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { useSiteContent } from '@/hooks/useSiteContent';

const navItems = [
  { label: 'Home', href: '/' },
  {
    label: 'Collections', href: '/collections',
    children: [
      { label: 'Girls Traditional', href: '/collections/girls-traditional' },
      { label: 'Girls Western', href: '/collections/girls-western' },
      { label: 'Women Traditional', href: '/collections/women-traditional' },
      { label: 'Women Western', href: '/collections/women-western' },
      { label: 'Bridal Wear', href: '/collections/bridal-wear' },
    ],
  },
  { label: 'Traditional', href: '/collections/women-traditional' },
  { label: 'Western', href: '/collections/women-western' },
  { label: 'Bridal', href: '/collections/bridal-wear' },
  { label: 'Custom Design', href: '/custom-design' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { user, userProfile, logOut, isAdmin } = useAuth();
  const { content } = useSiteContent();
  const navRef = useRef<HTMLDivElement>(null);

  const allNavItems = [
    ...navItems,
    ...(content.navLinks || []).map(l => ({ label: l.label, href: l.href, children: undefined })),
  ];

  // Hide navbar entirely on admin pages (admin has its own layout)
  if (pathname.startsWith('/admin')) return null;

  // Only the home page gets the transparent-at-top treatment
  const isHomePage = pathname === '/';
  const isTransparent = isHomePage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isTransparent
          ? 'bg-transparent py-4'
          : 'bg-white shadow-sm border-b border-gray-100 py-2'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={navRef}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Nilkanth
              </span>
              <span className={cn(
                'text-xl font-light ml-1 transition-colors duration-300',
                isTransparent ? 'text-white/90' : 'text-gray-700'
              )}>Fashions</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {allNavItems.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
                    pathname === item.href
                      ? isTransparent
                        ? 'text-white bg-white/15 font-semibold'
                        : 'text-rose-600 bg-rose-50 font-semibold'
                      : isTransparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-rose-600 hover:bg-rose-50'
                  )}
                >
                  {item.label}
                  {item.children && <ChevronDown className="w-3.5 h-3.5" />}
                </Link>
                {item.children && activeDropdown === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={cn(
                'p-2 rounded-full transition-all',
                isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            {user && (
              <Link
                href="/user/wishlist"
                className={cn(
                  'p-2 rounded-full transition-all',
                  isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* Notifications */}
            {user && (() => {
              const unread = ((userProfile as any)?.notifications || []).filter((n: any) => !n.read).length;
              return (
                <Link
                  href="/user/dashboard"
                  className={cn(
                    'p-2 rounded-full transition-all relative',
                    isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              );
            })()}

            {/* User Menu */}
            {user ? (
              <div className="relative group">
                <button className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full transition-all',
                  isTransparent
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}>
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="avatar" className="w-6 h-6 rounded-full" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden md:block text-sm font-medium max-w-20 truncate">
                    {userProfile?.displayName?.split(' ')[0] || 'Account'}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                  <Link href="/user/dashboard" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">My Dashboard</Link>
                  <Link href="/user/orders" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">My Orders</Link>
                  <Link href="/user/measurements" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">Measurements</Link>
                  <Link href="/user/wishlist" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">Wishlist</Link>
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link href="/admin/dashboard" className="block px-4 py-2.5 text-sm text-purple-600 font-semibold hover:bg-purple-50">
                        Admin Panel
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button onClick={logOut} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                  isTransparent
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:shadow-md'
                )}
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'lg:hidden p-2 rounded-full transition-all',
                isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="py-3 pb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search designs, fabrics, occasions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              {allNavItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-4 py-2.5 font-medium rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-rose-50 text-rose-600'
                        : 'text-gray-700 hover:bg-rose-50 hover:text-rose-600'
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {user ? (
                <div className="pt-4 border-t border-gray-100 space-y-1">
                  <Link href="/user/dashboard" className="flex items-center gap-3 px-4 py-2.5 font-medium rounded-lg text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <User className="w-4 h-4" /> My Dashboard
                  </Link>
                  <Link href="/user/orders" className="flex items-center gap-3 px-4 py-2.5 font-medium rounded-lg text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link href="/user/measurements" className="flex items-center gap-3 px-4 py-2.5 font-medium rounded-lg text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <Ruler className="w-4 h-4" /> Measurements
                  </Link>
                  <Link href="/user/wishlist" className="flex items-center gap-3 px-4 py-2.5 font-medium rounded-lg text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                  {isAdmin && (
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 font-semibold rounded-lg text-purple-700 hover:bg-purple-50 transition-colors">
                      <ShieldCheck className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={logOut} className="flex w-full items-center gap-3 px-4 py-2.5 font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <Link href="/auth/login" className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="block w-full text-center px-4 py-2.5 border-2 border-rose-500 text-rose-600 font-semibold rounded-full">
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
