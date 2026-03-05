'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Upload, X, ImagePlus, Info, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';

const categories = ['girls-traditional', 'girls-western', 'women-traditional', 'women-western', 'bridal-wear'];
const occasions = ['casual', 'festive', 'wedding', 'party', 'formal'];
const fabrics = ['cotton', 'silk', 'satin', 'chiffon', 'velvet', 'georgette', 'organza', 'linen', 'crepe', 'net', 'not sure'];

export default function CustomDesignPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [occasion, setOccasion] = useState('');
  const [preferredFabric, setPreferredFabric] = useState('');
  const [budget, setBudget] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addImages(files);
  }, []);

  const addImages = (files: File[]) => {
    if (images.length + files.length > 5) { toast.error('Max 5 images allowed'); return; }
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => setImageUrls(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setImageUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please sign in first'); router.push('/auth/login'); return; }
    if (images.length === 0) { toast.error('Please upload at least one design image'); return; }
    if (!description || !category || !occasion) { toast.error('Please fill all required fields'); return; }

    setUploading(true);
    try {
      // Upload images to Firebase Storage
      const uploadedUrls: string[] = [];
      for (const [i, img] of images.entries()) {
        const storageRef = ref(storage, `custom-designs/${user.uid}/${Date.now()}-${img.name}`);
        const uploadTask = uploadBytesResumable(storageRef, img);
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            snap => setUploadProgress(((i / images.length) + (snap.bytesTransferred / snap.totalBytes / images.length)) * 100),
            reject,
            async () => { uploadedUrls.push(await getDownloadURL(uploadTask.snapshot.ref)); resolve(); }
          );
        });
      }

      // Submit to Firestore
      await addDoc(collection(db, 'customDesignRequests'), {
        userId: user.uid,
        userName: user.displayName || userProfile?.displayName || '',
        userEmail: user.email,
        designImages: uploadedUrls,
        description,
        category,
        occasion,
        preferredFabric: preferredFabric || null,
        budget: budget ? parseFloat(budget) : null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
      toast.success('Design request submitted! We\'ll review it soon. ✨');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full bg-white rounded-3xl p-10 text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
          <p className="text-gray-500 mb-4">Your custom design request has been submitted. Our team will review it and get back to you within 24-48 hours.</p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>What happens next:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-blue-700">
                  <li>Admin reviews your design images (24-48 hrs)</li>
                  <li>You receive an approval/rejection notification</li>
                  <li>If approved, you proceed to fabric & measurement selection</li>
                  <li>Final price confirmed before production begins</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/user/dashboard" className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-colors">Go to Dashboard</Link>
            <Link href="/collections" className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-rose-300 transition-colors">Browse Designs</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Custom Design</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>Upload Your Design</h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Have a design in mind? Upload your inspiration images and our expert tailors will bring it to life.</p>
        </motion.div>

        {/* Process Banner */}
        <div className="bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-100 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-gray-800 mb-1">How Custom Design Requests Work</p>
              <p className="text-sm text-gray-600">This is a <strong>tailoring order request</strong>, not an instant purchase. After submission, our team will review your design, confirm feasibility, and provide a price estimate. Your approval is needed before production begins.</p>
            </div>
          </div>
        </div>

        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-center">
            <p className="text-amber-800 mb-3 font-medium">Please sign in to submit a custom design request</p>
            <Link href="/auth/login" className="px-6 py-2.5 bg-amber-500 text-white font-semibold rounded-full hover:bg-amber-600 transition-colors">Sign In</Link>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Step 1: Upload Design Images <span className="text-red-500">*</span></h2>

          {/* Drop Zone */}
          <div
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-rose-300 transition-colors cursor-pointer"
            onClick={() => document.getElementById('image-input')?.click()}
          >
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">Drop images here or click to upload</p>
            <p className="text-sm text-gray-400">PNG, JPG up to 10MB each • Max 5 images</p>
            <input id="image-input" type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addImages(Array.from(e.target.files))} />
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {imageUrls.length < 5 && (
                <button onClick={() => document.getElementById('image-input')?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-rose-300 flex items-center justify-center transition-colors">
                  <ImagePlus className="w-6 h-6 text-gray-300" />
                </button>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Step 2: Design Details</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your design in detail — style, occasion, any special requirements, color preferences..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white capitalize">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c} className="capitalize">{c.replace(/-/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Occasion <span className="text-red-500">*</span></label>
                <select value={occasion} onChange={e => setOccasion(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white capitalize">
                  <option value="">Select occasion</option>
                  {occasions.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Fabric</label>
                <select value={preferredFabric} onChange={e => setPreferredFabric(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white capitalize">
                  <option value="">Select fabric (optional)</option>
                  {fabrics.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Approximate Budget (CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g., 500" min="0" className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {uploading && (
          <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading images...</span>
              <span className="text-sm text-rose-600 font-medium">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-rose-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
          </div>
        )}

        <Button onClick={handleSubmit} loading={uploading} disabled={!user || images.length === 0 || !description || !category || !occasion} fullWidth size="xl" className="flex items-center gap-2">
          Submit Design Request <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-center text-xs text-gray-400 mt-3">By submitting, you agree to our terms. This is a tailoring request, not an instant purchase.</p>
      </div>
    </div>
  );
}
