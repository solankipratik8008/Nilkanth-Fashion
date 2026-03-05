'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function Footer() {
  const pathname = usePathname();
  const { content } = useSiteContent();
  if (pathname.startsWith('/admin')) return null;

  const socials = [
    { Icon: Instagram, href: content.socialInstagram, label: 'Instagram' },
    { Icon: Facebook, href: content.socialFacebook, label: 'Facebook' },
    { Icon: Twitter, href: content.socialTwitter, label: 'Twitter' },
    { Icon: Youtube, href: content.socialYoutube, label: 'YouTube' },
  ].filter(s => s.href && s.href.length > 1);

  return (
    <footer className="bg-gray-950 text-white">
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2">Stay in Style</h3>
          <p className="text-white/80 mb-6">Get exclusive updates on new collections, seasonal trends, and special offers</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Your email address"
              className="flex-1 px-5 py-3 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white" />
            <button className="px-6 py-3 bg-white text-rose-600 font-bold rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Nilkanth</span>
                <span className="text-xl font-light text-gray-300 ml-1">Fashions</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {content.footerTagline}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-4">
                {socials.map(({ Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 flex items-center justify-center transition-all duration-200 hover:scale-110">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-widest">Collections</h4>
            <ul className="space-y-2.5">
              {[
                ['Girls Traditional', '/collections/girls-traditional'],
                ['Girls Western', '/collections/girls-western'],
                ['Women Traditional', '/collections/women-traditional'],
                ['Women Western', '/collections/women-western'],
                ['Bridal Wear', '/collections/bridal-wear'],
              ].map(([label, href]) => (
                <li key={label}><Link href={href} className="text-gray-400 hover:text-rose-400 text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-widest">Services</h4>
            <ul className="space-y-2.5">
              {[
                ['Custom Design', '/custom-design'],
                ['Tailoring Orders', '/collections'],
                ['Bridal Consultation', '/contact'],
                ['Alterations & Fitting', '/contact'],
                ['Rush Orders', '/contact'],
              ].map(([label, href]) => (
                <li key={label}><Link href={href} className="text-gray-400 hover:text-rose-400 text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-widest">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">{content.footerAddress}</span>
              </li>
              {content.footerEmail && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                  <a href={`mailto:${content.footerEmail}`} className="text-gray-400 hover:text-rose-400 text-sm transition-colors">{content.footerEmail}</a>
                </li>
              )}
              {content.footerPhone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                  <a href={`tel:${content.footerPhone.replace(/\s/g, '')}`} className="text-gray-400 hover:text-rose-400 text-sm transition-colors">{content.footerPhone}</a>
                </li>
              )}
            </ul>
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-gray-400 font-medium mb-1">Business Hours</p>
              <p className="text-xs text-gray-500 whitespace-pre-line">{content.businessHours}</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Nilkanth Fashions. All rights reserved. Made with{' '}
            <Heart className="inline w-3.5 h-3.5 text-rose-500 fill-rose-500" />{' '}in Canada.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-rose-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-rose-400 transition-colors">Terms of Service</Link>
            <Link href="/shipping" className="hover:text-rose-400 transition-colors">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
