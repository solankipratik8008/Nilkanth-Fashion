'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Award, Users, Scissors, ArrowRight } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

const DEFAULT_TEAM = [
  { name: 'Nilkanthbhai', role: 'Master Tailor & Founder', experience: '15+ years experience', bio: '', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80' },
  { name: 'Priyaben', role: 'Senior Designer', experience: 'Specializes in Bridal Wear', bio: '', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b834?w=300&q=80' },
  { name: 'Kavitaben', role: 'Embroidery Specialist', experience: 'Hand embroidery expert', bio: '', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80' },
];
// Note: DEFAULT_TEAM is only shown when admin has never saved team data to Firestore.

const values = [
  { icon: Heart, title: 'Made with Love', desc: 'Every stitch is crafted with passion and dedication to perfection.' },
  { icon: Award, title: 'Quality First', desc: 'We never compromise on fabric quality or craftsmanship.' },
  { icon: Users, title: 'Customer Centric', desc: 'Your satisfaction and confidence are our greatest rewards.' },
  { icon: Scissors, title: 'Expert Tailoring', desc: '10+ years of experience in traditional and contemporary fashion.' },
];

export default function AboutPage() {
  const { content } = useSiteContent();

  const team = content.teamMembers && content.teamMembers.length > 0
    ? content.teamMembers
    : DEFAULT_TEAM;

  const heroTitle = content.aboutHeroTitle || 'Crafting Dreams, One Stitch at a Time';
  const heroSubtitle = content.aboutHeroSubtitle || 'Nilkanth Fashions was born from a passion for bringing the rich heritage of South Asian fashion to the Canadian diaspora, while celebrating every woman\'s unique beauty and style.';
  const storyTitle = content.aboutStoryTitle || 'A Family Tradition of Excellence';
  const p1 = content.aboutStoryP1 || 'What began as a small tailoring workshop in Gujarat, India, has grown into a premium custom fashion platform serving clients across Canada. Our founder, with over 15 years of expertise, brought with him the centuries-old tradition of Indian craftsmanship.';
  const p2 = content.aboutStoryP2 || 'We understand the emotional significance of every garment — especially for occasions like weddings, festivals, and family celebrations. When you wear something custom-made, you feel the difference.';
  const p3 = content.aboutStoryP3 || 'Today, Nilkanth Fashions serves women and girls across Canada, offering everything from everyday ethnic wear to elaborate bridal ensembles, all crafted with precision and care.';

  const stat1 = { value: content.aboutStat1Value || '500+', label: content.aboutStat1Label || 'Happy Clients' };
  const stat2 = { value: content.aboutStat2Value || '250+', label: content.aboutStat2Label || 'Designs' };
  const stat3 = { value: content.aboutStat3Value || '15+',  label: content.aboutStat3Label || 'Years Experience' };

  const heroImage = content.aboutHeroImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&q=80';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gray-950 overflow-hidden pt-40 pb-32">
        <div className="absolute inset-0">
          <Image src={heroImage} alt="About" fill className="object-cover opacity-20" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-violet-400 font-semibold text-sm uppercase tracking-widest">Our Story</span>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mt-3 mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
              {heroTitle.includes(',') ? (
                <>
                  {heroTitle.split(',')[0]},<br />
                  <span className="text-violet-400">{heroTitle.split(',').slice(1).join(',').trim()}</span>
                </>
              ) : heroTitle}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">{heroSubtitle}</p>
          </motion.div>
        </div>
      </div>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-violet-500 font-semibold text-sm uppercase tracking-widest">How We Started</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>{storyTitle}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{p1}</p>
              <p className="text-gray-600 leading-relaxed mb-4">{p2}</p>
              <p className="text-gray-600 leading-relaxed mb-6">{p3}</p>
              <div className="grid grid-cols-3 gap-4">
                {[stat1, stat2, stat3].map(({ value, label }) => (
                  <div key={label} className="text-center p-4 bg-violet-50 rounded-xl">
                    <div className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'var(--font-playfair)' }}>{value}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
              {['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&q=80', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80'].map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                  <Image src={src} alt="" fill className="object-cover" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-violet-50/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-violet-500 font-semibold text-sm uppercase tracking-widest">Our Values</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>What We Stand For</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 text-center border border-violet-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon className="w-7 h-7 text-violet-500" /></div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-violet-500 font-semibold text-sm uppercase tracking-widest">Our Team</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Meet the Artisans</h2>
          </motion.div>
          <div className={`grid gap-8 ${team.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
            {team.map((member, i) => (
              <motion.div key={member.name + i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="relative w-36 h-36 mx-auto mb-4 rounded-full overflow-hidden border-4 border-violet-100">
                  {member.image ? (
                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                      <span className="text-4xl font-bold text-violet-400">{member.name[0]}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'var(--font-playfair)' }}>{member.name}</h3>
                <p className="text-violet-600 font-medium text-sm mb-1">{member.role}</p>
                <p className="text-gray-400 text-xs">{member.experience}</p>
                {member.bio && <p className="text-gray-500 text-xs mt-2 leading-relaxed max-w-xs mx-auto">{member.bio}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-700 via-purple-600 to-violet-800 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Ready to Create Your Dream Outfit?</h2>
          <p className="text-white/80 mb-8">Browse our collections or upload your own design — we're here to make it happen.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections" className="px-8 py-4 bg-white text-violet-600 font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 justify-center">Browse Collections <ArrowRight className="w-5 h-5" /></Link>
            <Link href="/contact" className="px-8 py-4 bg-white/10 border-2 border-white/30 font-bold rounded-full hover:bg-white/20 transition-all">Contact Us</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
