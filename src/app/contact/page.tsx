'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useAuth } from '@/context/AuthContext';

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'General question, no rush' },
  { value: 'medium', label: 'Medium', desc: 'Need a response within a few days' },
  { value: 'high', label: 'High', desc: 'Time-sensitive, respond ASAP' },
  { value: 'urgent', label: 'Urgent', desc: 'Critical issue or event very soon' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', priority: 'medium' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { content } = useSiteContent();
  const { user, userProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...form,
        userId: user?.uid || null,
        userName: user?.displayName || form.name,
        status: 'open',
        adminRead: false,
        replies: [],
        createdAt: serverTimestamp(),
      });
      setSent(true);
      toast.success('Message sent! We\'ll get back to you within 24 hours. ✉️');
      setForm({ name: '', email: '', phone: '', subject: '', message: '', priority: 'medium' });
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const contactItems = [
    content.contactEmail && { icon: Mail, label: 'Email', value: content.contactEmail, href: `mailto:${content.contactEmail}`, desc: 'We reply within 24 hours' },
    content.contactPhone && { icon: Phone, label: 'Phone / WhatsApp', value: content.contactPhone, href: `tel:${content.contactPhone.replace(/\s/g, '')}`, desc: content.businessHours || '' },
    content.contactAddress && { icon: MapPin, label: 'Location', value: content.contactAddress, href: '#', desc: '' },
    content.businessHours && !content.contactPhone && { icon: Clock, label: 'Business Hours', value: content.businessHours, href: '#', desc: '' },
  ].filter(Boolean) as { icon: any; label: string; value: string; href: string; desc: string }[];

  const socialLinks = [
    content.socialInstagram && { icon: Instagram, label: 'Instagram', href: content.socialInstagram, color: 'hover:text-pink-600' },
    content.socialFacebook && { icon: Facebook, label: 'Facebook', href: content.socialFacebook, color: 'hover:text-blue-600' },
    content.socialTwitter && { icon: Twitter, label: 'Twitter / X', href: content.socialTwitter, color: 'hover:text-sky-500' },
    content.socialYoutube && { icon: Youtube, label: 'YouTube', href: content.socialYoutube, color: 'hover:text-red-600' },
  ].filter(Boolean) as { icon: any; label: string; href: string; color: string }[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-rose-600 to-purple-700 text-white pt-36 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-rose-200 font-semibold text-sm uppercase tracking-widest">Get in Touch</span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-3 mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Contact Us</h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">Have questions about custom orders or bridal consultations? We'd love to hear from you!</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {contactItems.map(({ icon: Icon, label, value, href, desc }) => (
                <a key={label} href={href} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all group block">
                  <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                    <Icon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-1">{label}</div>
                    <div className="font-semibold text-gray-900 text-sm">{value}</div>
                    {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
                  </div>
                </a>
              ))}

              {/* Social */}
              {socialLinks.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-xs text-gray-400 font-medium mb-3">Follow us on social media</div>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map(({ icon: Icon, label, href, color }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-gray-500 ${color} transition-colors text-sm font-medium`}>
                        <Icon className="w-5 h-5" />{label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

              {sent && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-green-800">
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Your message was sent! We'll reply within 24 hours.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Your name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="your@email.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone (optional)</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (xxx) xxx-xxxx" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject *</label>
                    <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white">
                      <option value="">Select subject</option>
                      <option value="custom-order">Custom Order Inquiry</option>
                      <option value="bridal">Bridal Consultation</option>
                      <option value="pricing">Pricing Questions</option>
                      <option value="order-status">Order Status</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority / Urgency</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                        className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                          form.priority === p.value
                            ? p.value === 'urgent' ? 'bg-red-50 border-red-400 text-red-700'
                              : p.value === 'high' ? 'bg-orange-50 border-orange-400 text-orange-700'
                              : p.value === 'medium' ? 'bg-blue-50 border-blue-400 text-blue-700'
                              : 'bg-gray-50 border-gray-400 text-gray-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold">{p.label}</div>
                        <div className="text-xs mt-0.5 opacity-70">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required rows={5} placeholder="Tell us about your design ideas, occasion, timeline, or any questions..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 resize-none" />
                </div>
                <Button type="submit" loading={sending} size="lg" className="flex items-center gap-2">
                  <Send className="w-5 h-5" /> Send Message
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
