'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, User, Menu, X, ChevronDown, ChevronRight, Heart, Bell,
  Package, Ruler, LogOut, ShieldCheck, Upload, LayoutDashboard
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

// Mobile nav sections — larger groupings with clear hierarchy
const mobileNavSections = [
  {
    label: 'Collections',
    href: '/collections',
    children: [
      { label: 'All Collections', href: '/collections' },
      { label: 'Girls Traditional', href: '/collections/girls-traditional' },
      { label: 'Girls Western', href: '/collections/girls-western' },
      { label: 'Women Traditional', href: '/collections/women-traditional' },
      { label: 'Women Western', href: '/collections/women-western' },
      { label: 'Bridal Wear', href: '/collections/bridal-wear' },
    ],
  },
  { label: 'Custom Design', href: '/custom-design' },
  { label: 'Bridal', href: '/collections/bridal-wear' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
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

  // Hide navbar entirely on admin pages
  if (pathname.startsWith('/admin')) return null;

  const isHomePage = pathname === '/';
  const isTransparent = isHomePage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
    setActiveDropdown(null);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const unreadNotifications = ((userProfile as any)?.notifications || []).filter((n: any) => !n.read).length;

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
            <Image
              src="/images/logo.jpg"
              alt="Nilkanth Fashions"
              width={48}
              height={48}
              className="rounded-full group-hover:scale-110 transition-transform duration-200"
              priority
            />
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
                        : 'text-violet-600 bg-violet-50 font-semibold'
                      : isTransparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-violet-600 hover:bg-violet-50'
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
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-violet-600 transition-colors"
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
          <div className="flex items-center gap-1.5">
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
                  'p-2 rounded-full transition-all hidden sm:flex',
                  isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <Link
                href="/user/dashboard"
                className={cn(
                  'p-2 rounded-full transition-all relative hidden sm:flex',
                  isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop User Menu */}
            {user ? (
              <div className="relative group hidden lg:block">
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
                  <span className="text-sm font-medium max-w-20 truncate">
                    {userProfile?.displayName?.split(' ')[0] || 'Account'}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                  <Link href="/user/dashboard" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-violet-600">My Dashboard</Link>
                  <Link href="/user/orders" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-violet-600">My Orders</Link>
                  <Link href="/user/measurements" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-violet-600">Measurements</Link>
                  <Link href="/user/wishlist" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-violet-600">Wishlist</Link>
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <Link href="/admin/dashboard" className="block px-4 py-2.5 text-sm text-purple-600 font-semibold hover:bg-purple-50">
                        Admin Panel
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={logOut} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={cn(
                  'hidden lg:inline-flex px-4 py-2 rounded-full text-sm font-semibold transition-all',
                  isTransparent
                    ? 'bg-white text-violet-600 hover:bg-rose-50'
                    : 'bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:shadow-md'
                )}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger — always visible on mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(
                'lg:hidden p-2 rounded-full transition-all',
                isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Menu className="w-6 h-6" />
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

      {/* ===== FULL-SCREEN MOBILE MENU PANEL ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide-in panel from the right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-xs bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/images/logo.jpg"
                    alt="Nilkanth Fashions"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-sm leading-tight">Nilkanth</div>
                    <div className="text-xs text-gray-400 leading-tight">Fashions</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto">
                {mobileNavSections.map((section, i) => (
                  <motion.div
                    key={section.label}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.05 }}
                  >
                    {section.children ? (
                      <>
                        <button
                          onClick={() => setMobileExpanded(mobileExpanded === section.label ? null : section.label)}
                          className="flex items-center justify-between w-full px-6 py-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-base font-semibold text-gray-900">{section.label}</span>
                          <ChevronRight className={cn('w-5 h-5 text-gray-400 transition-transform duration-200', mobileExpanded === section.label && 'rotate-90')} />
                        </button>
                        <AnimatePresence>
                          {mobileExpanded === section.label && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden bg-gray-50"
                            >
                              {section.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className="flex items-center gap-2 pl-10 pr-6 py-3 text-sm text-gray-600 border-b border-gray-100 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                  {child.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={section.href}
                        className={cn(
                          'flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                          pathname === section.href && 'text-violet-600 bg-violet-50'
                        )}
                      >
                        <span className="text-base font-semibold text-gray-900">{section.label}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}
                  </motion.div>
                ))}

                {/* Quick links */}
                <div className="px-6 py-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Access</p>
                  {user ? (
                    <>
                      <Link href="/user/dashboard" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium text-sm hover:bg-violet-50 hover:text-violet-700 transition-colors">
                        <LayoutDashboard className="w-4 h-4 shrink-0" /> My Dashboard
                      </Link>
                      <Link href="/user/orders" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium text-sm hover:bg-violet-50 hover:text-violet-700 transition-colors">
                        <Package className="w-4 h-4 shrink-0" /> My Orders
                      </Link>
                      <Link href="/user/wishlist" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium text-sm hover:bg-violet-50 hover:text-violet-700 transition-colors">
                        <Heart className="w-4 h-4 shrink-0" /> Wishlist
                      </Link>
                      <Link href="/user/measurements" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium text-sm hover:bg-violet-50 hover:text-violet-700 transition-colors">
                        <Ruler className="w-4 h-4 shrink-0" /> Measurements
                      </Link>
                      <Link href="/custom-design" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl text-white font-semibold text-sm">
                        <Upload className="w-4 h-4 shrink-0" /> Upload Your Design
                      </Link>
                      {isAdmin && (
                        <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-purple-50 rounded-xl text-purple-700 font-semibold text-sm hover:bg-purple-100 transition-colors">
                          <ShieldCheck className="w-4 h-4 shrink-0" /> Admin Panel
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link href="/custom-design" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl text-white font-semibold text-sm">
                      <Upload className="w-4 h-4 shrink-0" /> Upload Your Design
                    </Link>
                  )}
                </div>
              </nav>

              {/* Panel Footer — Sign In / Sign Out */}
              <div className="px-5 py-5 border-t border-gray-100 shrink-0">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-2 mb-3">
                      {userProfile?.photoURL ? (
                        <img src={userProfile.photoURL} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-violet-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{userProfile?.displayName || 'My Account'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={logOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Link href="/auth/login" className="block w-full text-center py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-md transition-all text-sm">
                      Sign In
                    </Link>
                    <Link href="/auth/register" className="block w-full text-center py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-rose-300 hover:text-violet-600 transition-all text-sm">
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
