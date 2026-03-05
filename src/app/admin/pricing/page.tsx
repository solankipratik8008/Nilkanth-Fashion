'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_PRICING = {
  // Base tailoring
  baseTailoring: { simple: 80, medium: 150, complex: 250, premium: 400 },
  // Category premiums
  categoryPremium: { 'girls-traditional': 0, 'girls-western': 0, 'women-traditional': 20, 'women-western': 20, 'bridal-wear': 200 },
  // Fabric premiums (per yard)
  fabricPremium: { cotton: 0, chiffon: 10, georgette: 15, silk: 30, satin: 25, velvet: 40, brocade: 50, banarasi: 80, chanderi: 60, net: 20, organza: 25, linen: 5, crepe: 10, other: 0 },
  // Delivery charges
  delivery: { home: 15, provincial: 25, national: 40, international: 80 },
  // Production timelines (days)
  productionTimelines: { western: 7, traditional: 10, bridal: 30 },
  // Embroidery / embellishments
  embroidery: { light: 50, medium: 120, heavy: 250 },
  // Fabric sourcing fee
  fabricSourcingFee: 25,
  // Rush order premium (%)
  rushOrderPremium: 30,
  // Tax rate (%)
  taxRate: 13,
};

type PricingData = typeof DEFAULT_PRICING;

function NumberField({ label, value, onChange, prefix = '' }: { label: string; value: number; onChange: (v: number) => void; prefix?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500`}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
      <h3 className="text-white font-semibold mb-4 text-sm">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { isAdmin } = useAuth();
  const [pricing, setPricing] = useState<PricingData>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    loadPricing();
  }, [isAdmin]);

  const loadPricing = async () => {
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'pricing'));
      if (snap.exists()) {
        setPricing({ ...DEFAULT_PRICING, ...snap.data() as PricingData });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'pricing'), pricing, { merge: true });
      toast.success('Pricing saved successfully!');
    } catch {
      toast.error('Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  const setNested = (section: keyof PricingData, key: string, value: number) => {
    setPricing(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [key]: value },
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Pricing Management</h1>
          <p className="text-gray-400 text-sm">Configure all pricing rules — changes apply site-wide instantly</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPricing}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-all">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <SectionCard title="Base Tailoring Costs (CA$)">
          {Object.entries(pricing.baseTailoring).map(([key, val]) => (
            <NumberField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} prefix="$"
              onChange={v => setNested('baseTailoring', key, v)} />
          ))}
        </SectionCard>

        <SectionCard title="Category Premiums (CA$)">
          {Object.entries(pricing.categoryPremium).map(([key, val]) => (
            <NumberField key={key} label={key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} value={val} prefix="$"
              onChange={v => setNested('categoryPremium', key, v)} />
          ))}
        </SectionCard>

        <SectionCard title="Fabric Premiums per Yard (CA$)">
          {Object.entries(pricing.fabricPremium).map(([key, val]) => (
            <NumberField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} prefix="$"
              onChange={v => setNested('fabricPremium', key, v)} />
          ))}
        </SectionCard>

        <SectionCard title="Delivery Charges (CA$)">
          {Object.entries(pricing.delivery).map(([key, val]) => (
            <NumberField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} prefix="$"
              onChange={v => setNested('delivery', key, v)} />
          ))}
        </SectionCard>

        <SectionCard title="Embroidery Costs (CA$)">
          {Object.entries(pricing.embroidery).map(([key, val]) => (
            <NumberField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} prefix="$"
              onChange={v => setNested('embroidery', key, v)} />
          ))}
        </SectionCard>

        <SectionCard title="Production Timelines (days)">
          {Object.entries(pricing.productionTimelines).map(([key, val]) => (
            <NumberField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val}
              onChange={v => setNested('productionTimelines', key, v)} />
          ))}
        </SectionCard>

        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-4 text-sm">Other Fees</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <NumberField label="Fabric Sourcing Fee (CA$)" value={pricing.fabricSourcingFee} prefix="$"
              onChange={v => setPricing(prev => ({ ...prev, fabricSourcingFee: v }))} />
            <NumberField label="Rush Order Premium (%)" value={pricing.rushOrderPremium}
              onChange={v => setPricing(prev => ({ ...prev, rushOrderPremium: v }))} />
            <NumberField label="Tax Rate (%)" value={pricing.taxRate}
              onChange={v => setPricing(prev => ({ ...prev, taxRate: v }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
