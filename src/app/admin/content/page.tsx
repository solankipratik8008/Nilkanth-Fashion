'use client';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Save, Upload, Plus, Trash2, Eye, Play, Image as ImageIcon, Instagram, Facebook, Twitter, Youtube, Globe, Megaphone, Gift, Newspaper, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_CONTENT, SiteContent, clearSiteContentCache } from '@/hooks/useSiteContent';
import HeroImageCropModal from '@/components/admin/HeroImageCropModal';

type ContentType = 'announcement' | 'offer' | 'update' | 'info';
interface PageItem { id: string; title: string; description: string; image?: string; date?: string; badge?: string; active: boolean; }
interface DynamicPage { title: string; slug: string; contentType: ContentType; description?: string; items: PageItem[]; }
const CONTENT_TYPES: { value: ContentType; label: string; icon: any; desc: string }[] = [
  { value: 'announcement', label: 'Announcements', icon: Megaphone, desc: 'Business news & notices' },
  { value: 'offer', label: 'Offers & Promotions', icon: Gift, desc: 'Discounts & special deals' },
  { value: 'update', label: 'Business Updates', icon: Newspaper, desc: 'New services & changes' },
  { value: 'info', label: 'Informational', desc: 'General info page', icon: Info },
];

function TextField({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const cls = "w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600";
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} className={`${cls} resize-none`} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function ImageUploadField({ label, value, onChange, storagePath }: {
  label: string; value: string; onChange: (url: string) => void; storagePath: string;
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `${storagePath}_${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', () => {}, () => { toast.error('Upload failed'); setUploading(false); },
        async () => { const url = await getDownloadURL(task.snapshot.ref); onChange(url); setUploading(false); toast.success('Image uploaded!'); }
      );
    } catch { setUploading(false); }
  };
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="flex gap-3 items-start">
        {value ? (
          <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-gray-800 shrink-0">
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-32 h-20 rounded-xl bg-gray-800 border border-dashed border-white/20 flex items-center justify-center shrink-0">
            <ImageIcon className="w-6 h-6 text-gray-600" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="Paste image URL or upload below..."
            className="w-full px-4 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
          <label className={`flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg cursor-pointer transition-colors w-fit ${uploading ? 'opacity-50' : ''}`}>
            <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

const TABS = ['homepage', 'media', 'navigation', 'pages', 'footer', 'about & contact', 'testimonials', 'faqs'];

export default function ContentPage() {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('homepage');
  const [newVideo, setNewVideo] = useState({ title: '', description: '', url: '' });
  const [newNavLink, setNewNavLink] = useState({ label: '', href: '' });
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropUploading, setCropUploading] = useState(false);

  // Dynamic pages state
  const [dynamicPages, setDynamicPages] = useState<DynamicPage[]>([]);
  const [newPage, setNewPage] = useState<DynamicPage>({ title: '', slug: '', contentType: 'announcement', description: '', items: [] });
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [savingPage, setSavingPage] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Record<string, Partial<PageItem>>>({});

  useEffect(() => {
    if (!isAdmin) return;
    getDoc(doc(db, 'siteSettings', 'content'))
      .then(snap => { if (snap.exists()) setContent({ ...DEFAULT_CONTENT, ...snap.data() as SiteContent }); })
      .catch(console.error)
      .finally(() => setLoading(false));
    getDocs(collection(db, 'dynamicPages'))
      .then(snap => setDynamicPages(snap.docs.map(d => ({ slug: d.id, ...d.data() } as DynamicPage))))
      .catch(() => {});
  }, [isAdmin]);

  const saveDynamicPage = async (page: DynamicPage) => {
    setSavingPage(page.slug);
    try {
      await setDoc(doc(db, 'dynamicPages', page.slug), { ...page, updatedAt: new Date() });
      toast.success(`Page "/${page.slug}" saved!`);
    } catch { toast.error('Failed to save page'); }
    finally { setSavingPage(null); }
  };

  const createDynamicPage = async () => {
    const slug = newPage.slug.replace(/^\//, '').toLowerCase().replace(/\s+/g, '-');
    if (!newPage.title || !slug) { toast.error('Fill in title and slug'); return; }
    const page: DynamicPage = { ...newPage, slug, items: [] };
    setSavingPage(slug);
    try {
      await setDoc(doc(db, 'dynamicPages', slug), { ...page, createdAt: new Date(), updatedAt: new Date() });
      setDynamicPages(prev => [...prev, page]);
      setNewPage({ title: '', slug: '', contentType: 'announcement', description: '', items: [] });
      setExpandedPage(slug);
      toast.success(`Page "/${slug}" created!`);
    } catch { toast.error('Failed to create page'); }
    finally { setSavingPage(null); }
  };

  const deleteDynamicPage = async (slug: string) => {
    if (!confirm(`Delete page "/${slug}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'dynamicPages', slug));
      setDynamicPages(prev => prev.filter(p => p.slug !== slug));
      toast.success('Page deleted');
    } catch { toast.error('Failed to delete page'); }
  };

  const addItemToPage = (slug: string) => {
    const item = newItem[slug] || {};
    if (!item.title || !item.description) { toast.error('Fill in title and description'); return; }
    const fullItem: PageItem = { id: Date.now().toString(), title: item.title, description: item.description, image: item.image, date: item.date, badge: item.badge, active: true };
    setDynamicPages(prev => prev.map(p => p.slug === slug ? { ...p, items: [...(p.items || []), fullItem] } : p));
    setNewItem(prev => ({ ...prev, [slug]: {} }));
  };

  const removeItemFromPage = (slug: string, itemId: string) => {
    setDynamicPages(prev => prev.map(p => p.slug === slug ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p));
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'content'), content, { merge: true });
      clearSiteContentCache();
      toast.success('Content saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const set = (key: keyof SiteContent, val: any) => setContent(prev => ({ ...prev, [key]: val }));

  const uploadHeroImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    // Show crop modal — read file as object URL
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropDone = async (blob: Blob) => {
    setCropUploading(true);
    try {
      const storageRef = ref(storage, `content/hero_${Date.now()}.jpg`);
      const task = uploadBytesResumable(storageRef, blob);
      task.on('state_changed', () => {}, () => { toast.error('Upload failed'); setCropUploading(false); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          set('heroImages', [...content.heroImages, url]);
          toast.success('Hero image uploaded!');
          setCropImageSrc(null);
          setCropUploading(false);
        }
      );
    } catch { setCropUploading(false); }
  };

  const addVideo = () => {
    if (!newVideo.url.trim()) { toast.error('Enter a YouTube URL'); return; }
    const id = extractYoutubeId(newVideo.url.trim());
    if (!id) { toast.error('Invalid YouTube URL. Use format: https://youtube.com/watch?v=VIDEO_ID'); return; }
    set('videos', [...content.videos, { id, title: newVideo.title || 'Video', description: newVideo.description, url: `https://youtube.com/watch?v=${id}` }]);
    setNewVideo({ title: '', description: '', url: '' });
    toast.success('Video added!');
  };

  const addNavLink = () => {
    if (!newNavLink.label || !newNavLink.href) { toast.error('Fill in both label and URL'); return; }
    set('navLinks', [...content.navLinks, { ...newNavLink }]);
    setNewNavLink({ label: '', href: '' });
    toast.success('Navigation link added!');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Hero Image Crop Modal */}
      {cropImageSrc && (
        <HeroImageCropModal
          imageSrc={cropImageSrc}
          onCrop={handleCropDone}
          onCancel={() => { setCropImageSrc(null); URL.revokeObjectURL(cropImageSrc); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Content Management</h1>
          <p className="text-gray-400 text-sm">Edit all site content, images, videos, and navigation</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-all">
            <Eye className="w-4 h-4" /> Preview
          </a>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-900 rounded-xl p-1 mb-6 border border-white/5">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-5">

        {/* ─── HOMEPAGE ─── */}
        {activeTab === 'homepage' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Hero Section</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Hero Title" value={content.heroTitle} onChange={v => set('heroTitle', v)} />
                <TextField label="CTA Button Text" value={content.heroCTA} onChange={v => set('heroCTA', v)} />
              </div>
              <TextField label="Hero Subtitle" value={content.heroSubtitle} onChange={v => set('heroSubtitle', v)} multiline />
              <TextField label="CTA Link" value={content.heroCTAHref || '/collections'} onChange={v => set('heroCTAHref', v)} placeholder="/collections" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Hero Images <span className="text-gray-600">(first image shows on home page)</span></label>
                  <span className="text-xs text-gray-500">{content.heroImages.length} image{content.heroImages.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3 mb-3">
                  {content.heroImages.length === 0 && (
                    <p className="text-gray-600 text-xs py-3 text-center border border-dashed border-white/10 rounded-xl">No hero images yet. Upload one below.</p>
                  )}
                  {content.heroImages.map((url, i) => (
                    <div key={i} className={`relative rounded-xl overflow-hidden bg-gray-800 border-2 ${i === 0 ? 'border-purple-500' : 'border-white/10'}`}>
                      {i === 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Active Hero</div>
                      )}
                      <div className="relative w-full h-36">
                        <img src={url} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 flex items-center justify-between bg-gray-900/80">
                        <span className="text-gray-400 text-xs truncate max-w-[200px]">{url.length > 50 ? url.slice(0, 50) + '…' : url}</span>
                        <button
                          onClick={() => set('heroImages', content.heroImages.filter((_, idx) => idx !== i))}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-medium rounded-lg transition-all shrink-0 ml-2"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Add new hero image */}
                <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                  <p className="text-gray-400 text-xs font-medium">Add Hero Image</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      id="hero-url-input"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 placeholder-gray-600"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('hero-url-input') as HTMLInputElement;
                        const url = input?.value?.trim();
                        if (url) { set('heroImages', [...content.heroImages, url]); input.value = ''; }
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Add URL
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-600 text-xs">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <label className={`flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-white/20 hover:border-purple-500 rounded-xl cursor-pointer transition-colors text-gray-400 hover:text-white text-xs ${cropUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-4 h-4" /> {cropUploading ? 'Uploading cropped image...' : 'Upload & Crop Image'}
                    <input type="file" accept="image/*" onChange={uploadHeroImage} className="hidden" disabled={cropUploading} />
                  </label>
                </div>
                <p className="text-gray-600 text-xs mt-2">After adding or removing images, click "Save All" to apply changes to the site.</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Site Images</h3>
              <p className="text-gray-500 text-xs">These images appear on specific pages. Upload a file or paste a direct image URL.</p>
              <ImageUploadField label="Login Page — Left Side Image" value={content.loginImage} onChange={v => set('loginImage', v)} storagePath="content/login_image" />
              <ImageUploadField label="Register Page — Left Side Image" value={content.registerImage} onChange={v => set('registerImage', v)} storagePath="content/register_image" />
              <ImageUploadField label="About Page — Hero Image (optional override)" value={content.aboutHeroImage} onChange={v => set('aboutHeroImage', v)} storagePath="content/about_hero" />
            </div>
          </>
        )}

        {/* ─── MEDIA ─── */}
        {activeTab === 'media' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <div className="mb-4">
                <h3 className="text-white font-semibold text-sm">Videos</h3>
                <p className="text-gray-500 text-xs mt-0.5">Add YouTube videos — they appear in a dedicated section on the home page</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-3">
                <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Add New Video</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Title</label>
                    <input value={newVideo.title} onChange={e => setNewVideo(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Bridal Collection 2024"
                      className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">YouTube URL *</label>
                    <input value={newVideo.url} onChange={e => setNewVideo(v => ({ ...v, url: e.target.value }))} placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Description (optional)</label>
                  <input value={newVideo.description} onChange={e => setNewVideo(v => ({ ...v, description: e.target.value }))} placeholder="Short description..."
                    className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <button onClick={addVideo} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Video
                </button>
              </div>

              <div className="space-y-3">
                {content.videos.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-6">No videos yet. Add your first YouTube video above!</p>
                )}
                {content.videos.map((video, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-800 rounded-xl p-3">
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-700 shrink-0">
                      <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{video.title}</div>
                      {video.description && <div className="text-gray-400 text-xs truncate mt-0.5">{video.description}</div>}
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs hover:text-purple-300 mt-0.5 inline-block truncate max-w-xs">
                        {video.url}
                      </a>
                    </div>
                    <button onClick={() => set('videos', content.videos.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400 p-1 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <h3 className="text-white font-semibold text-sm mb-1">Gallery Images</h3>
              <p className="text-gray-500 text-xs mb-4">Upload images for a gallery section on the site</p>
              <div className="flex flex-wrap gap-3">
                {content.galleryImages.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-800">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => set('galleryImages', content.galleryImages.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const r = ref(storage, `content/gallery_${Date.now()}_${file.name}`);
                    const task = uploadBytesResumable(r, file);
                    task.on('state_changed', () => {}, () => toast.error('Upload failed'),
                      async () => { const url = await getDownloadURL(task.snapshot.ref); set('galleryImages', [...content.galleryImages, url]); toast.success('Image uploaded!'); }
                    );
                  }} />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ─── NAVIGATION ─── */}
        {activeTab === 'navigation' && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm">Custom Navigation Links</h3>
              <p className="text-gray-500 text-xs mt-0.5">These extra links are appended to the end of the main navigation bar</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-3">
              <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Add Link</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Label</label>
                  <input value={newNavLink.label} onChange={e => setNewNavLink(v => ({ ...v, label: e.target.value }))} placeholder="e.g. Sale"
                    className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">URL / Path</label>
                  <input value={newNavLink.href} onChange={e => setNewNavLink(v => ({ ...v, href: e.target.value }))} placeholder="/sale or https://..."
                    className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
              </div>
              <button onClick={addNavLink} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Add Link
              </button>
            </div>
            <div className="space-y-2">
              {content.navLinks.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No custom links yet</p>
              ) : content.navLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-white text-sm font-medium">{link.label}</div>
                    <div className="text-gray-400 text-xs">{link.href}</div>
                  </div>
                  <button onClick={() => set('navLinks', content.navLinks.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── PAGES ─── */}
        {activeTab === 'pages' && (
          <div className="space-y-5">
            {/* Create new page */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400" /> Create New Page</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Page Title *</label>
                  <input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Alterations"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">URL Slug * <span className="text-gray-600">(e.g. alterations → /alterations)</span></label>
                  <input value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))} placeholder="alterations"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1.5">Page Description (optional)</label>
                <input value={newPage.description} onChange={e => setNewPage(p => ({ ...p, description: e.target.value }))} placeholder="Brief description shown under the title"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">Content Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CONTENT_TYPES.map(ct => {
                    const Icon = ct.icon;
                    return (
                      <button key={ct.value} onClick={() => setNewPage(p => ({ ...p, contentType: ct.value }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${newPage.contentType === ct.value ? 'border-purple-500 bg-purple-600/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{ct.label}</span>
                        <span className="text-[10px] text-gray-500">{ct.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={createDynamicPage} disabled={!!savingPage}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
                <Plus className="w-4 h-4" /> {savingPage ? 'Creating...' : 'Create Page'}
              </button>
            </div>

            {/* Existing pages */}
            {dynamicPages.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl p-8 border border-white/5 text-center text-gray-500">No dynamic pages yet. Create one above.</div>
            ) : dynamicPages.map(page => {
              const ct = CONTENT_TYPES.find(c => c.value === page.contentType) || CONTENT_TYPES[0];
              const Icon = ct.icon;
              const isExpanded = expandedPage === page.slug;
              const item = newItem[page.slug] || {};
              return (
                <div key={page.slug} className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
                  {/* Page header */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedPage(isExpanded ? null : page.slug)}>
                    <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold">{page.title}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-2">
                        <span>/{page.slug}</span>
                        <span className="text-gray-600">·</span>
                        <span>{ct.label}</span>
                        <span className="text-gray-600">·</span>
                        <span>{(page.items || []).filter(i => i.active !== false).length} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={e => { e.stopPropagation(); deleteDynamicPage(page.slug); }} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/5 p-4 space-y-4">
                      {/* Existing items */}
                      {(page.items || []).length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No items yet. Add one below.</p>
                      ) : (
                        <div className="space-y-3">
                          {page.items.map(item => (
                            <div key={item.id} className="flex items-start gap-3 bg-gray-800 rounded-xl p-3">
                              {item.image && (
                                <img src={item.image} alt={item.title} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white text-sm font-semibold">{item.title}</span>
                                  {item.badge && <span className="text-xs px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded-full">{item.badge}</span>}
                                  {item.date && <span className="text-xs text-gray-500">{item.date}</span>}
                                </div>
                                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                              </div>
                              <button onClick={() => removeItemFromPage(page.slug, item.id)} className="text-gray-500 hover:text-red-400 shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new item */}
                      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                        <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Add Item</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Title *</label>
                            <input value={item.title || ''} onChange={e => setNewItem(prev => ({ ...prev, [page.slug]: { ...prev[page.slug], title: e.target.value } }))}
                              placeholder="e.g. Free Alterations Now Available"
                              className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Badge (optional)</label>
                            <input value={item.badge || ''} onChange={e => setNewItem(prev => ({ ...prev, [page.slug]: { ...prev[page.slug], badge: e.target.value } }))}
                              placeholder="e.g. New · Limited Offer · Hot"
                              className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Description *</label>
                          <textarea value={item.description || ''} onChange={e => setNewItem(prev => ({ ...prev, [page.slug]: { ...prev[page.slug], description: e.target.value } }))}
                            rows={3} placeholder="Full description of this item..."
                            className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Date (optional)</label>
                            <input value={item.date || ''} onChange={e => setNewItem(prev => ({ ...prev, [page.slug]: { ...prev[page.slug], date: e.target.value } }))}
                              placeholder="e.g. March 2026 · Valid until Apr 30"
                              className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Image URL (optional)</label>
                            <input value={item.image || ''} onChange={e => setNewItem(prev => ({ ...prev, [page.slug]: { ...prev[page.slug], image: e.target.value } }))}
                              placeholder="https://..."
                              className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                          </div>
                        </div>
                        <button onClick={() => addItemToPage(page.slug)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                      </div>

                      {/* Save page button */}
                      <button onClick={() => saveDynamicPage(page)} disabled={savingPage === page.slug}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
                        <Save className="w-4 h-4" /> {savingPage === page.slug ? 'Saving...' : `Save Page "/${page.slug}"`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── FOOTER ─── */}
        {activeTab === 'footer' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Brand Tagline</h3>
              <TextField label="Footer Brand Description" value={content.footerTagline} onChange={v => set('footerTagline', v)} multiline />
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Social Media Links</h3>
              <p className="text-gray-500 text-xs">Leave blank to hide the icon in the footer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram</label>
                  <input value={content.socialInstagram} onChange={e => set('socialInstagram', e.target.value)} placeholder="https://instagram.com/..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><Facebook className="w-3.5 h-3.5 text-blue-400" /> Facebook</label>
                  <input value={content.socialFacebook} onChange={e => set('socialFacebook', e.target.value)} placeholder="https://facebook.com/..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><Twitter className="w-3.5 h-3.5 text-sky-400" /> Twitter / X</label>
                  <input value={content.socialTwitter} onChange={e => set('socialTwitter', e.target.value)} placeholder="https://x.com/..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube</label>
                  <input value={content.socialYoutube} onChange={e => set('socialYoutube', e.target.value)} placeholder="https://youtube.com/@..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Footer Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Email" value={content.footerEmail} onChange={v => set('footerEmail', v)} placeholder="hello@nilkanthfashion.ca" />
                <TextField label="Phone" value={content.footerPhone} onChange={v => set('footerPhone', v)} placeholder="+1 (647) 999-9999" />
              </div>
              <TextField label="Address / Service Area" value={content.footerAddress} onChange={v => set('footerAddress', v)} placeholder="Serving across Canada" />
            </div>
          </>
        )}

        {/* ─── ABOUT & CONTACT ─── */}
        {activeTab === 'about & contact' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">About Section</h3>
              <TextField label="Section Title" value={content.aboutTitle} onChange={v => set('aboutTitle', v)} />
              <TextField label="About Text" value={content.aboutText} onChange={v => set('aboutText', v)} multiline />
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Email" value={content.contactEmail} onChange={v => set('contactEmail', v)} />
                <TextField label="Phone" value={content.contactPhone} onChange={v => set('contactPhone', v)} />
                <TextField label="WhatsApp" value={content.whatsapp} onChange={v => set('whatsapp', v)} />
                <TextField label="Business Hours" value={content.businessHours} onChange={v => set('businessHours', v)} />
              </div>
              <TextField label="Address / Service Area" value={content.contactAddress} onChange={v => set('contactAddress', v)} />
            </div>
          </>
        )}

        {/* ─── TESTIMONIALS ─── */}
        {activeTab === 'testimonials' && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Customer Testimonials</h3>
              <button onClick={() => set('testimonials', [...content.testimonials, { name: '', text: '', rating: 5 }])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-4">
              {content.testimonials.map((t, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">Testimonial {i + 1}</span>
                    <button onClick={() => set('testimonials', content.testimonials.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Customer Name</label>
                      <input value={t.name} onChange={e => { const u = [...content.testimonials]; u[i] = { ...u[i], name: e.target.value }; set('testimonials', u); }}
                        className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Rating</label>
                      <select value={t.rating} onChange={e => { const u = [...content.testimonials]; u[i] = { ...u[i], rating: Number(e.target.value) }; set('testimonials', u); }}
                        className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} stars</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Review Text</label>
                    <textarea value={t.text} onChange={e => { const u = [...content.testimonials]; u[i] = { ...u[i], text: e.target.value }; set('testimonials', u); }} rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none" />
                  </div>
                </div>
              ))}
              {content.testimonials.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No testimonials yet.</p>}
            </div>
          </div>
        )}

        {/* ─── FAQs ─── */}
        {activeTab === 'faqs' && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Frequently Asked Questions</h3>
              <button onClick={() => set('faqs', [...content.faqs, { question: '', answer: '' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
            <div className="space-y-3">
              {content.faqs.map((faq, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">Q{i + 1}</span>
                    <button onClick={() => set('faqs', content.faqs.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input value={faq.question} onChange={e => { const u = [...content.faqs]; u[i] = { ...u[i], question: e.target.value }; set('faqs', u); }}
                    placeholder="Question..."
                    className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                  <textarea value={faq.answer} onChange={e => { const u = [...content.faqs]; u[i] = { ...u[i], answer: e.target.value }; set('faqs', u); }} rows={2}
                    placeholder="Answer..."
                    className="w-full px-3 py-2 bg-gray-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none" />
                </div>
              ))}
              {content.faqs.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No FAQs yet.</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
