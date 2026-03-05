'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { Ruler, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const measurementFields = [
  { key: 'bust', label: 'Bust', unit: 'inches', hint: 'Fullest part of chest' },
  { key: 'shoulderWidth', label: 'Shoulder Width', unit: 'inches', hint: 'Across the back, shoulder to shoulder' },
  { key: 'blouseWaist', label: 'Blouse Waist', unit: 'inches', hint: 'Natural waist for blouse' },
  { key: 'pantWaist', label: 'Pant Waist', unit: 'inches', hint: 'Waist for pants/skirts' },
  { key: 'hipCircumference', label: 'Hip Circumference', unit: 'inches', hint: 'Fullest part of hips' },
  { key: 'neckRound', label: 'Neck Round', unit: 'inches', hint: 'Around the base of neck' },
  { key: 'sleeveLength', label: 'Sleeve Length', unit: 'inches', hint: 'Shoulder to wrist' },
  { key: 'armhole', label: 'Armhole', unit: 'inches', hint: 'Around the arm opening' },
  { key: 'thighCircumference', label: 'Thigh Circumference', unit: 'inches', hint: 'Fullest part of thigh' },
  { key: 'ankleOpening', label: 'Ankle Opening', unit: 'inches', hint: 'Around ankle for pants' },
  { key: 'dressLength', label: 'Dress Length', unit: 'inches', hint: 'Shoulder to hem' },
  { key: 'topLength', label: 'Top Length', unit: 'inches', hint: 'Shoulder to bottom of top' },
  { key: 'bottomLength', label: 'Bottom Length', unit: 'inches', hint: 'Waist to hem' },
  { key: 'inseam', label: 'Inseam', unit: 'inches', hint: 'Crotch to ankle (inner leg)' },
  { key: 'outseam', label: 'Outseam', unit: 'inches', hint: 'Waist to ankle (outer leg)' },
  { key: 'waistToFloor', label: 'Waist to Floor', unit: 'inches', hint: 'Waist to floor, standing straight' },
];

export default function MeasurementsPage() {
  const { user, userProfile, refreshUserProfile, loading } = useAuth();
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (userProfile?.measurements) {
      const m = userProfile.measurements as Record<string, any>;
      const filled: Record<string, string> = {};
      Object.entries(m).forEach(([k, v]) => { if (k !== 'notes' && v) filled[k] = String(v); });
      setMeasurements(filled);
      if (m.notes) setNotes(m.notes);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const parsed: Record<string, any> = {};
      Object.entries(measurements).forEach(([k, v]) => { if (v) parsed[k] = parseFloat(v); });
      parsed.notes = notes;
      await setDoc(doc(db, 'users', user.uid), { measurements: parsed, updatedAt: serverTimestamp() }, { merge: true });
      await refreshUserProfile();
      toast.success('Measurements saved! ✓');
    } catch (err) {
      toast.error('Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-24"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Ruler className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Measurements</h1>
              <p className="text-gray-500 text-sm">Save your measurements for precise custom tailoring</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>How to measure:</strong> Use a soft measuring tape. Measure snugly but not tight. All measurements are in inches.
              When in doubt, our team can guide you during consultation. These measurements will auto-fill during your order process.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-6 text-lg">Body Measurements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {measurementFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={measurements[field.key] || ''}
                      onChange={e => setMeasurements(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`e.g., 36`}
                      className="w-full pr-16 pl-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{field.unit}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special fitting notes (e.g., prefer loose fit, specific alterations...)"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} loading={saving} size="lg" className="flex items-center gap-2">
              <Save className="w-5 h-5" /> Save Measurements
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/user/dashboard')}>Back to Dashboard</Button>
          </div>

          {/* Size Guide Reference */}
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Standard Size Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Size', 'Bust', 'Waist', 'Hip', 'Shoulder'].map(h => <th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[['XS', '32"', '26"', '35"', '13.5"'], ['S', '34"', '28"', '37"', '14"'], ['M', '36"', '30"', '39"', '14.5"'], ['L', '38"', '32"', '41"', '15"'], ['XL', '40"', '34"', '43"', '15.5"'], ['XXL', '42"', '36"', '45"', '16"'], ['XXXL', '44"', '38"', '47"', '16.5"']].map(row => (
                    <tr key={row[0]} className="border-t border-gray-50">
                      {row.map((cell, j) => <td key={j} className={`px-4 py-2 ${j === 0 ? 'font-bold text-rose-600' : 'text-gray-600'}`}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
