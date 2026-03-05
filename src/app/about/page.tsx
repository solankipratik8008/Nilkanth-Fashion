'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Award, Users, Scissors, Star, ArrowRight } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Made with Love', desc: 'Every stitch is crafted with passion and dedication to perfection.' },
  { icon: Award, title: 'Quality First', desc: 'We never compromise on fabric quality or craftsmanship.' },
  { icon: Users, title: 'Customer Centric', desc: 'Your satisfaction and confidence are our greatest rewards.' },
  { icon: Scissors, title: 'Expert Tailoring', desc: '10+ years of experience in traditional and contemporary fashion.' },
];

const team = [
  { name: 'Nilkanthbhai', role: 'Master Tailor & Founder', exp: '15+ years experience', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80' },
  { name: 'Priyaben', role: 'Senior Designer', exp: 'Specializes in Bridal Wear', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b834?w=300&q=80' },
  { name: 'Kavitaben', role: 'Embroidery Specialist', exp: 'Hand embroidery expert', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gray-950 overflow-hidden pt-40 pb-32">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&q=80" alt="About" fill className="object-cover opacity-20" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">Our Story</span>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mt-3 mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
              Crafting Dreams,<br />
              <span className="text-rose-400">One Stitch at a Time</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Nilkanth Fashions was born from a passion for bringing the rich heritage of South Asian fashion to the Canadian diaspora,
              while celebrating every woman's unique beauty and style.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">How We Started</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
                A Family Tradition of Excellence
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                What began as a small tailoring workshop in Gujarat, India, has grown into a premium custom fashion platform
                serving clients across Canada. Our founder, with over 15 years of expertise, brought with him the centuries-old
                tradition of Indian craftsmanship.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We understand the emotional significance of every garment — especially for occasions like weddings, festivals,
                and family celebrations. When you wear something custom-made, you feel the difference.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Today, Nilkanth Fashions serves women and girls across Canada, offering everything from everyday ethnic wear
                to elaborate bridal ensembles, all crafted with precision and care.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[['500+', 'Happy Clients'], ['250+', 'Designs'], ['15+', 'Years Experience']].map(([val, label]) => (
                  <div key={label} className="text-center p-4 bg-rose-50 rounded-xl">
                    <div className="text-2xl font-bold text-rose-600">{val}</div>
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Our Values</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>What We Stand For</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon className="w-7 h-7 text-rose-500" /></div>
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
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Our Team</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Meet the Artisans</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="relative w-36 h-36 mx-auto mb-4 rounded-full overflow-hidden border-4 border-rose-100">
                  <Image src={member.image} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                <p className="text-rose-600 font-medium text-sm mb-1">{member.role}</p>
                <p className="text-gray-400 text-xs">{member.exp}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-rose-600 to-purple-700 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Ready to Create Your Dream Outfit?</h2>
          <p className="text-white/80 mb-8">Browse our collections or upload your own design — we're here to make it happen.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections" className="px-8 py-4 bg-white text-rose-600 font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 justify-center">Browse Collections <ArrowRight className="w-5 h-5" /></Link>
            <Link href="/contact" className="px-8 py-4 bg-white/10 border-2 border-white/30 font-bold rounded-full hover:bg-white/20 transition-all">Contact Us</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
