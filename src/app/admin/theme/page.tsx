'use client';
import { useState, useEffect } from 'react';
import { useTheme, PRESET_THEMES, ThemeConfig } from '@/context/ThemeContext';
import { Paintbrush, Save, Eye, Image, Type, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminThemePage() {
  const { theme, updateTheme } = useTheme();
  const [draft, setDraft] = useState<ThemeConfig>(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(theme); }, [theme]);

  const applyPreset = (presetKey: string) => {
    const preset = PRESET_THEMES[presetKey];
    setDraft(prev => ({ ...prev, ...preset }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateTheme(draft);
      toast.success('Theme saved! Changes are live on the site.');
    } catch {
      toast.error('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const currentGradient = `linear-gradient(135deg, ${draft.primaryFrom}, ${draft.primaryTo})`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Site Theme</h1>
          <p className="text-gray-400 text-sm">Customize your site's colors, hero section, and branding</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="xl:col-span-2 space-y-6">

          {/* Color Theme */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-5">
              <Paintbrush className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold">Color Theme</h3>
            </div>

            {/* Preset Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {Object.values(PRESET_THEMES).map(preset => {
                const isActive = draft.primaryFrom === preset.primaryFrom && draft.primaryTo === preset.primaryTo;
                return (
                  <button key={preset.id} onClick={() => applyPreset(preset.id)}
                    className={`relative p-3 rounded-xl border transition-all text-left ${isActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 bg-gray-800'}`}>
                    <div className="h-10 rounded-lg mb-2"
                      style={{ background: `linear-gradient(to right, ${preset.primaryFrom}, ${preset.primaryTo})` }} />
                    <div className="text-white text-xs font-semibold">{preset.label}</div>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Colors */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-gray-400 text-xs mb-3">Or set custom colors:</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Gradient Start', key: 'primaryFrom' as keyof ThemeConfig },
                  { label: 'Gradient End', key: 'primaryTo' as keyof ThemeConfig },
                  { label: 'Accent', key: 'accent' as keyof ThemeConfig },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-gray-400 text-xs block mb-1.5">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={draft[key] as string}
                        onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0" />
                      <input type="text" value={draft[key] as string}
                        onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-2 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-purple-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-5">
              <Image className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Hero Section</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Hero Background Image URL</label>
                <input type="url" value={draft.heroImage}
                  onChange={e => setDraft(prev => ({ ...prev, heroImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                {draft.heroImage && (
                  <div className="mt-2 h-24 rounded-lg overflow-hidden relative">
                    <img src={draft.heroImage} alt="Hero preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs">Preview</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Hero Title</label>
                <input type="text" value={draft.heroTitle}
                  onChange={e => setDraft(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Hero Subtitle</label>
                <textarea value={draft.heroSubtitle} rows={2}
                  onChange={e => setDraft(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">CTA Button Text</label>
                  <input type="text" value={draft.heroCTA}
                    onChange={e => setDraft(prev => ({ ...prev, heroCTA: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">CTA Link</label>
                  <input type="text" value={draft.heroCTAHref}
                    onChange={e => setDraft(prev => ({ ...prev, heroCTAHref: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="xl:col-span-1">
          <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden sticky top-8">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Eye className="w-4 h-4 text-green-400" />
              <h3 className="text-white font-semibold text-sm">Live Preview</h3>
            </div>

            {/* Mini hero preview */}
            <div className="relative h-48 overflow-hidden">
              {draft.heroImage && (
                <img src={draft.heroImage} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <p className="text-white font-bold text-sm leading-tight mb-1">{draft.heroTitle || 'Hero Title'}</p>
                <p className="text-white/70 text-xs line-clamp-2">{draft.heroSubtitle || 'Subtitle here'}</p>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1.5 text-white text-xs font-bold rounded-full"
                    style={{ background: currentGradient }}>
                    {draft.heroCTA || 'CTA Button'}
                  </span>
                </div>
              </div>
            </div>

            {/* Color preview */}
            <div className="p-4 space-y-3">
              <div>
                <p className="text-gray-400 text-xs mb-2">Primary Gradient</p>
                <div className="h-8 rounded-lg" style={{ background: currentGradient }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'From', color: draft.primaryFrom },
                  { label: 'To', color: draft.primaryTo },
                  { label: 'Accent', color: draft.accent },
                ].map(({ label, color }) => (
                  <div key={label} className="text-center">
                    <div className="h-8 rounded-lg mb-1" style={{ background: color }} />
                    <p className="text-gray-500 text-xs">{label}</p>
                  </div>
                ))}
              </div>

              {/* Button Samples */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-gray-400 text-xs mb-2">UI Elements</p>
                <button className="w-full py-2 text-white text-xs font-semibold rounded-lg transition-all"
                  style={{ background: currentGradient }}>
                  Primary Button
                </button>
                <button className="w-full py-2 text-white text-xs font-semibold rounded-lg border"
                  style={{ borderColor: draft.accent, color: draft.accent, background: 'transparent' }}>
                  Outline Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
