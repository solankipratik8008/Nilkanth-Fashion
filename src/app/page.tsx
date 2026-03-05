'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState } from 'react';
import {
  ArrowRight, Star, Sparkles, Clock, Shield, Truck, MessageCircle,
  ChevronRight, TrendingUp, Scissors, Crown, Heart, Users
} from 'lucide-react';
import { getFeaturedDesigns, getTrendingDesigns, categories } from '@/data/designs';
import DesignCard from '@/components/ui/DesignCard';
import { useTheme } from '@/context/ThemeContext';
import { useSiteContent } from '@/hooks/useSiteContent';

const heroSlides = [
  {
    title: 'Crafted for',
    highlight: 'Her Story',
    subtitle: 'Bespoke tailoring that celebrates every woman — from traditional elegance to modern chic',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80',
    cta: 'Explore Collections',
    ctaHref: '/collections/women-traditional',
    badge: '🌟 100% Custom Made',
  },
  {
    title: 'Bridal Dreams',
    highlight: 'Made Real',
    subtitle: 'Your perfect wedding outfit, tailored with love. From lehenga to gown — we make it happen',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=80',
    cta: 'View Bridal Collection',
    ctaHref: '/collections/bridal-wear',
    badge: '💍 Bridal Specialist',
  },
];

const stats = [
  { value: '500+', label: 'Happy Clients', icon: Users },
  { value: '250+', label: 'Designs', icon: Scissors },
  { value: '5★', label: 'Avg Rating', icon: Star },
  { value: '10+', label: 'Years Experience', icon: Crown },
];

const features = [
  { icon: Scissors, title: '100% Custom Made', desc: 'Every piece tailored to your exact measurements' },
  { icon: Shield, title: 'Quality Guaranteed', desc: 'Premium fabrics and expert craftsmanship' },
  { icon: Clock, title: 'Fast Turnaround', desc: '1 week for casual wear, ~1 month for bridal' },
  { icon: Truck, title: 'Canada-Wide Delivery', desc: 'Free consultation and delivery across Canada' },
];

const occasions = [
  { label: 'Wedding', icon: '💍', href: '/collections?occasion=wedding', bg: 'from-rose-400 to-pink-600' },
  { label: 'Festive', icon: '🪔', href: '/collections?occasion=festive', bg: 'from-orange-400 to-red-500' },
  { label: 'Party', icon: '🎉', href: '/collections?occasion=party', bg: 'from-purple-400 to-indigo-600' },
  { label: 'Casual', icon: '☀️', href: '/collections?occasion=casual', bg: 'from-amber-400 to-orange-500' },
  { label: 'Formal', icon: '👔', href: '/collections?occasion=formal', bg: 'from-slate-500 to-gray-700' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Bride, Toronto', text: 'My dream bridal lehenga was crafted with absolute perfection. Every detail was exactly as envisioned!', rating: 5, image: 'https://images.unsplash.com/photo-1494790108755-2616b612b834?w=100&q=80' },
  { name: 'Meera Patel', role: 'Bride, Calgary', text: 'From measurements to delivery, seamless experience. My wedding gown got countless compliments!', rating: 5, image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80' },
  { name: 'Anita Verma', role: 'Regular Client, Vancouver', text: 'Multiple outfits ordered and they always exceed expectations. Custom fit makes all the difference!', rating: 5, image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80' },
];

const processSteps = [
  { step: '01', title: 'Browse & Select', desc: 'Explore designs or upload inspiration', icon: '🔍' },
  { step: '02', title: 'Submit Request', desc: 'Fill measurements and select fabric', icon: '📋' },
  { step: '03', title: 'Get Approval', desc: 'Team reviews and confirms price', icon: '✅' },
  { step: '04', title: 'Crafting', desc: 'Expert tailors craft your outfit', icon: '✂️' },
  { step: '05', title: 'Quality Check', desc: 'Thorough inspection before packaging', icon: '🔍' },
  { step: '06', title: 'Delivered', desc: 'Custom outfit at your doorstep', icon: '📦' },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const { theme } = useTheme();
  const { content } = useSiteContent();

  const featuredDesigns = getFeaturedDesigns().slice(0, 8);
  const trendingDesigns = getTrendingDesigns().slice(0, 8);

  const toggleWishlist = (id: string) => {
    setWishlistIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Merge theme into first hero slide
  const slides = [
    {
      ...heroSlides[0],
      image: content.heroImages?.[0] || heroSlides[0].image,
      title: theme.heroTitle ? theme.heroTitle.split(' ').slice(0, -1).join(' ') : heroSlides[0].title,
      highlight: theme.heroTitle ? theme.heroTitle.split(' ').slice(-1)[0] : heroSlides[0].highlight,
      subtitle: theme.heroSubtitle || heroSlides[0].subtitle,
      cta: theme.heroCTA || heroSlides[0].cta,
      ctaHref: theme.heroCTAHref || heroSlides[0].ctaHref,
    },
    heroSlides[1],
  ];
  const slide = slides[currentSlide];

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center">
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <Image src={slide.image} alt="Hero" fill className="object-cover" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </motion.div>

        <motion.div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24" style={{ opacity: heroOpacity }}>
          <div className="max-w-2xl">
            <motion.div key={`badge-${currentSlide}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-full text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              {slide.badge}
            </motion.div>
            <motion.h1 key={`title-${currentSlide}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
              {slide.title}{' '}
              <span className="bg-gradient-to-r from-rose-300 to-pink-300 bg-clip-text text-transparent">{slide.highlight}</span>
            </motion.h1>
            <motion.p key={`sub-${currentSlide}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/80 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
              {slide.subtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
              <Link href={slide.ctaHref} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all text-lg">
                {slide.cta} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/custom-design" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border-2 border-white/40 text-white font-bold rounded-full hover:bg-white/20 transition-all text-lg">
                Upload Your Design
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-50 rounded-xl mb-3"><Icon className="w-6 h-6 text-rose-500" /></div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Browse By</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Our Collections</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every design is custom-made to order</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={`/collections/${cat.id}`} className="group flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-rose-200 transition-all duration-300 hover:-translate-y-1">
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <h3 className="text-sm font-bold text-gray-800 text-center mb-1">{cat.label}</h3>
                  <span className="text-xs text-gray-400">{cat.count} designs</span>
                  <div className="mt-3 flex items-center gap-1 text-rose-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED DESIGNS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Handpicked</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Featured Designs</h2>
            </motion.div>
            <Link href="/collections" className="flex items-center gap-2 text-rose-600 font-semibold hover:gap-3 transition-all">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {featuredDesigns.map((design, i) => (
              <motion.div key={design.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <DesignCard design={design} wishlistIds={wishlistIds} onWishlistToggle={toggleWishlist} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OCCASIONS */}
      <section className="py-20 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">Perfect For</span>
            <h2 className="text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Every Occasion</h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4">
            {occasions.map((occ, i) => (
              <motion.div key={occ.label} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={occ.href} className={`flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r ${occ.bg} font-bold text-white hover:scale-105 transition-all shadow-lg`}>
                  <span className="text-2xl">{occ.icon}</span>
                  {occ.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Trending Now</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Hot This Season</h2>
            </motion.div>
            <Link href="/collections?filter=trending" className="flex items-center gap-2 text-orange-500 font-semibold hover:gap-3 transition-all">See All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {trendingDesigns.map((design, i) => (
              <motion.div key={design.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <DesignCard design={design} wishlistIds={wishlistIds} onWishlistToggle={toggleWishlist} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      {content.videos && content.videos.length > 0 && (
        <section className="py-20 bg-gray-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">Behind the Craft</span>
              <h2 className="text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Watch Us Create</h2>
              <p className="text-gray-400 mt-3 max-w-xl mx-auto">A glimpse into our craftsmanship and passion for fashion</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.videos.map((video, i) => (
                <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-2xl overflow-hidden bg-gray-900 border border-white/10">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.url}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  {(video.title || video.description) && (
                    <div className="p-4">
                      {video.title && <h3 className="font-semibold text-white text-sm mb-1">{video.title}</h3>}
                      {video.description && <p className="text-gray-400 text-xs leading-relaxed">{video.description}</p>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="py-24 bg-gradient-to-br from-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>How It Works</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {processSteps.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-md border-2 border-rose-200 flex items-center justify-center text-2xl mb-4">{step.icon}</div>
                <span className="text-xs font-bold text-rose-500 mb-1">{step.step}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
            <Link href="/collections" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all text-lg">
              Start Browsing <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-6 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-100 transition-colors"><Icon className="w-6 h-6 text-rose-500" /></div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>What Our Clients Say</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-gray-600 leading-relaxed mb-6 text-sm italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <Image src={t.image} alt={t.name} width={44} height={44} className="rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 text-white relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4 text-pink-200 fill-pink-200" /> Have a custom design in mind?
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Upload Your Dream Design</h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">Upload your inspiration image and our expert tailors will bring it to life.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/custom-design" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-rose-600 font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all text-lg">
                Upload Design <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 px-10 py-4 bg-white/10 border-2 border-white/40 text-white font-bold rounded-full hover:bg-white/20 transition-all text-lg">
                <MessageCircle className="w-5 h-5" /> Talk to Designer
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
