'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getDesignById } from '@/data/designs';
import { Upload, X, Star, ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['girls-traditional', 'girls-western', 'women-traditional', 'women-western', 'bridal-wear'];
const OCCASIONS = ['everyday', 'party', 'wedding', 'festival', 'casual', 'formal', 'bridal'];
const FABRICS = ['cotton', 'silk', 'satin', 'chiffon', 'velvet', 'georgette', 'organza', 'linen', 'crepe', 'net', 'brocade', 'chanderi', 'banarasi', 'other'];
const COMPLEXITIES = ['simple', 'medium', 'complex', 'premium'];

export default function EditDesignPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const designId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [tag, setTag] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'girls-traditional',
    occasion: 'everyday',
    description: '',
    basePrice: '',
    complexity: 'medium',
    fabrics: [] as string[],
    tags: [] as string[],
    featured: false,
    trending: false,
    productionDays: '7',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  });

  const populateFromData = (d: any) => {
    setExistingImages(d.images || []);
    setForm({
      name: d.name || '',
      category: d.category || 'girls-traditional',
      occasion: Array.isArray(d.occasion) ? d.occasion[0] : (d.occasion || 'everyday'),
      description: d.description || '',
      basePrice: String(d.basePrice || ''),
      complexity: d.complexity || 'medium',
      fabrics: d.fabrics || [],
      tags: d.tags || [],
      featured: d.featured || false,
      trending: d.trending || false,
      productionDays: String(d.productionDays || d.productionTime || 7),
      availableSizes: d.availableSizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    });
  };

  useEffect(() => {
    if (!isAdmin || !designId) return;
    getDoc(doc(db, 'designs', designId))
      .then(snap => {
        if (snap.exists()) {
          populateFromData(snap.data());
        } else {
          // Fall back to static design data
          const staticDesign = getDesignById(designId);
          if (staticDesign) {
            populateFromData(staticDesign);
          } else {
            toast.error('Design not found');
            router.push('/admin/designs');
          }
        }
      })
      .catch(() => toast.error('Failed to load design'))
      .finally(() => setLoading(false));
  }, [isAdmin, designId, router]);

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const total = existingImages.length + newImageFiles.length;
    const files = Array.from(e.target.files || []).slice(0, 5 - total);
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (i: number) => setExistingImages(prev => prev.filter((_, idx) => idx !== i));
  const removeNewImage = (i: number) => {
    setNewImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setNewImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const toggleFabric = (fabric: string) => {
    setForm(prev => ({ ...prev, fabrics: prev.fabrics.includes(fabric) ? prev.fabrics.filter(f => f !== fabric) : [...prev.fabrics, fabric] }));
  };

  const addTag = () => {
    if (tag.trim() && !form.tags.includes(tag.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
      setTag('');
    }
  };

  const uploadNewImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i];
      const storageRef = ref(storage, `designs/${Date.now()}_${file.name}`);
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file);
        task.on('state_changed',
          snap => setUploadProgress(Math.round(((i + snap.bytesTransferred / snap.totalBytes) / newImageFiles.length) * 100)),
          reject,
          async () => { const url = await getDownloadURL(task.snapshot.ref); urls.push(url); resolve(); }
        );
      });
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages === 0) { toast.error('At least one image is required'); return; }
    if (!form.name.trim()) { toast.error('Design name is required'); return; }
    if (!form.basePrice || isNaN(Number(form.basePrice))) { toast.error('Enter a valid price'); return; }
    if (form.fabrics.length === 0) { toast.error('Select at least one fabric'); return; }

    setSaving(true);
    try {
      const newUrls = newImageFiles.length > 0 ? await uploadNewImages() : [];
      const allImages = [...existingImages, ...newUrls];

      // Use setDoc with merge — works for both new (static override) and existing Firestore docs
      await setDoc(doc(db, 'designs', designId), {
        name: form.name.trim(),
        category: form.category,
        occasion: [form.occasion],
        description: form.description.trim(),
        basePrice: Number(form.basePrice),
        complexity: form.complexity,
        fabrics: form.fabrics,
        tags: form.tags,
        featured: form.featured,
        trending: form.trending,
        active: true,
        productionDays: Number(form.productionDays),
        availableSizes: form.availableSizes,
        images: allImages,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success('Design saved!');
      router.push('/admin/designs');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));
  const totalImages = existingImages.length + newImageFiles.length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Design</h1>
          <p className="text-gray-400 text-sm">Changes are saved to Firestore and override built-in data</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-4">Design Images <span className="text-gray-500 text-xs font-normal">(up to 5, any image format accepted)</span></h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {existingImages.map((src, i) => (
              <div key={`existing-${i}`} className="relative w-24 h-32 rounded-xl overflow-hidden bg-gray-800">
                <Image src={src} alt="" fill className="object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">Main</div>}
              </div>
            ))}
            {newImagePreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative w-24 h-32 rounded-xl overflow-hidden bg-gray-800">
                <Image src={src} alt="" fill className="object-cover" />
                <button type="button" onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-purple-600/80 text-white text-xs text-center py-0.5">New</div>
              </div>
            ))}
            {totalImages < 5 && (
              <label className="w-24 h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Upload</span>
                <input type="file" accept="image/*,image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic" multiple onChange={handleNewImages} className="hidden" />
              </label>
            )}
          </div>
          {saving && uploadProgress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">Uploading... {uploadProgress}%</div>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white font-semibold">Basic Information</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Design Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="e.g. Royal Embroidered Lehenga"
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Occasion</label>
              <select value={form.occasion} onChange={e => set('occasion', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
                {OCCASIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Describe the design, embroidery, embellishments, style..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Base Price (CA$) *</label>
              <input type="number" value={form.basePrice} onChange={e => set('basePrice', e.target.value)} min="0" required
                placeholder="299"
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Complexity</label>
              <select value={form.complexity} onChange={e => set('complexity', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500">
                {COMPLEXITIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Production Days</label>
              <input type="number" value={form.productionDays} onChange={e => set('productionDays', e.target.value)} min="1"
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>

        {/* Fabrics */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-4">Available Fabrics *</h2>
          <div className="flex flex-wrap gap-2">
            {FABRICS.map(fabric => (
              <button key={fabric} type="button" onClick={() => toggleFabric(fabric)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                  form.fabrics.includes(fabric)
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-white/10 text-gray-400 hover:border-purple-500 hover:text-white'
                }`}>
                {fabric}
              </button>
            ))}
          </div>
        </div>

        {/* Tags & Flags */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-4">Tags & Visibility</h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1.5">Tags</label>
            <div className="flex gap-2 mb-2">
              <input value={tag} onChange={e => setTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
              <button type="button" onClick={addTag}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs rounded-lg">
                  {t}
                  <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} className="text-purple-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.featured ? 'bg-amber-500' : 'bg-gray-700'}`}
                onClick={() => set('featured', !form.featured)}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="flex items-center gap-1.5 text-sm text-gray-300">
                <Star className="w-4 h-4 text-amber-400" /> Featured Design
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.trending ? 'bg-rose-500' : 'bg-gray-700'}`}
                onClick={() => set('trending', !form.trending)}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.trending ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-300">Trending</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-xl font-semibold text-sm transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
