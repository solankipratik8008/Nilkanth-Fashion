'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Crown, Shield, Globe, Bell, Database, MapPin, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'Nilkanth Fashions',
    address: '',
    phone: '',
    email: '',
    fabricDeliveryInstructions: 'Please deliver or ship your fabric to our store within 15 days. Include your Order ID and contact details with the package.',
  });
  const [savingStore, setSavingStore] = useState(false);
  const [storeLoaded, setStoreLoaded] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'siteSettings', 'storeInfo')).then(snap => {
      if (snap.exists()) setStoreInfo(prev => ({ ...prev, ...snap.data() }));
      setStoreLoaded(true);
    }).catch(() => setStoreLoaded(true));
  }, []);

  const saveStoreInfo = async () => {
    setSavingStore(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'storeInfo'), { ...storeInfo, updatedAt: new Date().toISOString() }, { merge: true });
      toast.success('Store information saved!');
    } catch {
      toast.error('Failed to save store info');
    }
    setSavingStore(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Settings</h1>
        <p className="text-gray-400 text-sm">Platform configuration and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Store Address (shown first — most important) */}
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <MapPin className="w-5 h-5 text-violet-400" />
            <h3 className="text-white font-semibold">Store Information</h3>
            <span className="text-xs text-gray-500">Shown to customers when they choose to provide their own fabric</span>
          </div>
          {!storeLoaded ? (
            <div className="flex items-center justify-center h-24"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Store Name</label>
                  <input value={storeInfo.storeName} onChange={e => setStoreInfo(s => ({ ...s, storeName: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Phone Number</label>
                  <input value={storeInfo.phone} onChange={e => setStoreInfo(s => ({ ...s, phone: e.target.value }))}
                    placeholder="+1 (647) 000-0000"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Store Address (full address with city, province, postal code)</label>
                <input value={storeInfo.address} onChange={e => setStoreInfo(s => ({ ...s, address: e.target.value }))}
                  placeholder="123 Main Street, Brampton, ON L6X 1A1, Canada"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Contact Email</label>
                <input value={storeInfo.email} onChange={e => setStoreInfo(s => ({ ...s, email: e.target.value }))}
                  placeholder="nilkanthfashions1309@gmail.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Fabric Delivery Instructions (shown to customers)</label>
                <textarea value={storeInfo.fabricDeliveryInstructions}
                  onChange={e => setStoreInfo(s => ({ ...s, fabricDeliveryInstructions: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400 resize-none" />
              </div>
              <button onClick={saveStoreInfo} disabled={savingStore}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />
                {savingStore ? 'Saving...' : 'Save Store Information'}
              </button>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Admin Profile</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-purple-600/30 flex items-center justify-center">
                <Crown className="w-7 h-7 text-purple-300" />
              </div>
            )}
            <div>
              <div className="text-white font-bold">{user?.displayName || 'Admin'}</div>
              <div className="text-gray-400 text-sm">{user?.email}</div>
              <span className="inline-block mt-1 text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">Administrator</span>
            </div>
          </div>
        </div>

        {/* Firebase Info */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Firebase Configuration</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Project ID', value: 'nilkanth-fashions' },
              { label: 'Auth Domain', value: 'nilkanth-fashions.firebaseapp.com' },
              { label: 'Storage Bucket', value: 'nilkanth-fashions.firebasestorage.app' },
              { label: 'Region', value: 'us-central1' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-white font-mono text-xs bg-gray-800 px-2 py-1 rounded">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Site Links */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Quick Links</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Firebase Console', href: 'https://console.firebase.google.com/project/nilkanth-fashions/overview' },
              { label: 'Firestore Database', href: 'https://console.firebase.google.com/project/nilkanth-fashions/firestore' },
              { label: 'Firebase Storage', href: 'https://console.firebase.google.com/project/nilkanth-fashions/storage' },
              { label: 'Firebase Auth', href: 'https://console.firebase.google.com/project/nilkanth-fashions/authentication' },
              { label: 'Firebase Hosting', href: 'https://console.firebase.google.com/project/nilkanth-fashions/hosting' },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors group">
                <span className="text-gray-300 text-sm group-hover:text-white">{link.label}</span>
                <span className="text-gray-500 text-xs">↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">Notification Settings</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New custom design requests', enabled: true },
              { label: 'New order placed', enabled: true },
              { label: 'Order status updates', enabled: false },
              { label: 'New user registrations', enabled: false },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-300 text-sm">{n.label}</span>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${n.enabled ? 'bg-purple-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${n.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
            <p className="text-gray-500 text-xs mt-2">Configure notification emails via Firebase Cloud Functions.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
