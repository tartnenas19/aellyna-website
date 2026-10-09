/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  // --- Auth State ---
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- CMS State (Original + New) ---
  const [activeTab, setActiveTab] = useState('content');
  const [content, setContent] = useState({});
  const [logo, setLogo] = useState({ file: null, previewUrl: '', currentUrl: '' });
  const [founderImages, setFounderImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [deletedAchievements, setDeletedAchievements] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  
  // New CMS State
  const [menuItems, setMenuItems] = useState([]);
  const [deletedMenuItems, setDeletedMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [deletedPromotions, setDeletedPromotions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [deletedFeedbacks, setDeletedFeedbacks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // --- Auth Effect ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
      if (session) fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- Auth Actions ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // --- CMS Data Fetching ---
  async function fetchData() {
    setLoading(true);
    try {
      const [
        { data: textData },
        { data: imgData },
        { data: achData },
        { data: inqData },
        { data: menuData },
        { data: promoData },
        { data: feedbackData }
      ] = await Promise.all([
        supabase.from('site_content').select('*'),
        supabase.from('founder_images').select('*').order('display_order', { ascending: true }),
        supabase.from('achievements').select('*').order('display_order', { ascending: true }),
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_items').select('*').order('display_order', { ascending: true }),
        supabase.from('promotions').select('*').order('display_order', { ascending: true }),
        supabase.from('customer_feedback').select('*').order('display_order', { ascending: true })
      ]);

      if (textData) {
        const mappedText = {};
        textData.forEach(item => { mappedText[item.id] = item.content; });
        setContent(mappedText);
        if (mappedText['site_logo_url']) {
          setLogo({ file: null, previewUrl: '', currentUrl: mappedText['site_logo_url'] });
        }
      }

      if (imgData) setFounderImages(imgData);
      if (achData) setAchievements(achData);
      if (inqData) setInquiries(inqData);
      if (menuData) setMenuItems(menuData);
      if (promoData) setPromotions(promoData);
      if (feedbackData) setFeedbacks(feedbackData);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- General CMS Handlers ---
  const handleChange = (id, value) => setContent(prev => ({ ...prev, [id]: value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogo({ ...logo, file, previewUrl: URL.createObjectURL(file) });
  };

  const handleFileChange = (index, e, stateSetter, stateArray) => {
    const file = e.target.files[0];
    if (!file) return;
    const updated = [...stateArray];
    updated[index].file = file;
    updated[index].previewUrl = URL.createObjectURL(file);
    stateSetter(updated);
  };

  const handleAchievementFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updated = [...achievements];
    updated[index].file = file;
    updated[index].file_type = file.type.includes('pdf') ? 'pdf' : 'image';
    if (!file.type.includes('pdf')) {
      updated[index].previewUrl = URL.createObjectURL(file);
    }
    setAchievements(updated);
  };

  const handleFieldChange = (index, field, value, stateSetter, stateArray) => {
    const updated = [...stateArray];
    updated[index][field] = value;
    stateSetter(updated);
  };

  const handleRemoveItem = (index, stateSetter, stateArray, delSetter, delArray) => {
    const item = stateArray[index];
    if (item.id) delSetter([...delArray, item.id]);
    stateSetter(stateArray.filter((_, i) => i !== index));
  };

  const handleDeleteInquiry = async (id) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (!error) setInquiries(inquiries.filter(item => item.id !== id));
  };

  // --- Save Handler ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // 1. Save Text Content & Logo
      const textUpdates = Object.keys(content).map(id => ({ id, content: content[id] }));
      if (logo.file) {
        const fileExt = logo.file.name.split('.').pop();
        const fileName = `site-logo-${Date.now()}.${fileExt}`;
        await supabase.storage.from('images').upload(fileName, logo.file);
        const finalLogoUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        
        const logoIndex = textUpdates.findIndex(item => item.id === 'site_logo_url');
        if (logoIndex >= 0) textUpdates[logoIndex].content = finalLogoUrl;
        else textUpdates.push({ id: 'site_logo_url', content: finalLogoUrl });
      }
      const { error: textError } = await supabase.from('site_content').upsert(textUpdates);
      if (textError) throw new Error('Text saving failed: ' + textError.message);

      // Helper function for uploading files and syncing tables
      const syncTable = async (tableName, items, deletedIds, hasImage = true) => {
        if (deletedIds.length > 0) {
          await supabase.from(tableName).delete().in('id', deletedIds);
        }
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          let finalImageUrl = item.image_url || item.file_url;
          
          if (hasImage && item.file) {
            const fileName = `${tableName}-${Date.now()}.${item.file.name.split('.').pop()}`;
            await supabase.storage.from('images').upload(fileName, item.file);
            finalImageUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
          }

          const record = { ...item, display_order: i };
          delete record.file;
          delete record.previewUrl;
          if (hasImage) {
            record.image_url = finalImageUrl;
            if (record.file_url !== undefined) record.file_url = finalImageUrl;
          }

          if (item.id) {
            await supabase.from(tableName).update(record).eq('id', item.id);
          } else {
            delete record.id;
            await supabase.from(tableName).insert(record);
          }
        }
      };

      // 2. Sync all tables
      await syncTable('founder_images', founderImages, deletedImages);
      await syncTable('achievements', achievements, deletedAchievements);
      await syncTable('menu_items', menuItems, deletedMenuItems);
      await syncTable('promotions', promotions, deletedPromotions);
      await syncTable('customer_feedback', feedbacks, deletedFeedbacks, false);

      setMessage('✅ Command Center updated successfully.');
      fetchData();
    } catch (error) {
      console.error(error);
      setMessage('❌ ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Render Auth States ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#1A0509] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#58111A] border-t-[#C5A059] rounded-full animate-spin"></div>
          <p className="font-serif text-[#C5A059] text-xs tracking-widest uppercase animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#1A0509] flex items-center justify-center p-4 selection:bg-[#58111A] selection:text-[#C5A059]">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-[#C5A059]/20">
          <h1 className="text-3xl font-serif text-white font-medium text-center mb-1">Admin Portal</h1>
          <p className="text-center text-[10px] text-[#C5A059] mb-8 uppercase tracking-widest font-bold">Authorized Access Only</p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-200 text-xs rounded-xl text-center">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3.5 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3.5 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm" />
            </div>
            <button type="submit" disabled={isAuthLoading} className="w-full bg-linear-to-r from-[#C5A059] to-[#b38e4a] text-[#1A0509] font-bold py-4 rounded-full hover:brightness-110 transition-all disabled:opacity-50 text-[10px] tracking-widest uppercase mt-4 shadow-xl">
              Sign In to Command Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A0509] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#58111A] border-t-[#C5A059] rounded-full animate-spin"></div>
          <p className="font-serif text-[#C5A059] text-xs tracking-widest uppercase animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A0509] text-stone-200 p-4 md:p-8 font-sans pb-36 selection:bg-[#58111A] selection:text-[#C5A059]">
      <div className="max-w-6xl mx-auto bg-black/20 backdrop-blur-xl p-6 md:p-12 rounded-3xl shadow-2xl border border-[#C5A059]/20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[#C5A059]/15">
          <div>
            <span className="text-[#C5A059] text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Administration</span>
            <h1 className="text-3xl md:text-4xl font-serif text-white font-medium">Command Center</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1A0509] border border-[#C5A059] bg-[#C5A059] px-5 py-3 rounded-full hover:brightness-110 transition-all shadow-sm">
              <span>View Live Site</span>
            </a>
            <button onClick={handleSignOut} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-400 transition-colors px-3 py-3">
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Pill Style) */}
        <div className="flex gap-2 p-1.5 bg-black/40 rounded-full border border-white/10 w-fit mb-10 overflow-x-auto shadow-inner">
          {['content', 'media', 'menu', 'promotions', 'feedback', 'inquiries'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-[#C5A059] text-[#1A0509] shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab === 'content' ? 'Brand Copy' : tab === 'media' ? 'Media & Assets' : tab}</span>
              {tab === 'inquiries' && inquiries.length > 0 && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans ${activeTab === 'inquiries' ? 'bg-[#1A0509] text-white' : 'bg-[#C5A059] text-[#1A0509]'}`}>
                  {inquiries.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: BRAND COPY & TOGGLES (Restored Full) */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Toggles */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Site Section Toggles
              </h2>
              <div className="grid md:grid-cols-3 gap-5">
                {['show_menu', 'show_promo', 'show_feedback'].map(key => (
                  <label key={key} className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/10 cursor-pointer hover:border-[#C5A059]/50 transition-colors">
                    <input type="checkbox" checked={content[key] === 'true'} onChange={(e) => handleChange(key, e.target.checked ? 'true' : 'false')} className="w-5 h-5 accent-[#C5A059]" />
                    <span className="text-xs uppercase tracking-widest font-bold text-stone-300">{key.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Hero Section */}
              <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
                <h2 className="font-serif text-2xl font-medium text-white mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Hero Section
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Subtitle (Est. Date)</label>
                    <input type="text" placeholder="Est. 2026" value={content.hero_subtitle || ''} onChange={(e) => handleChange('hero_subtitle', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Main Headline</label>
                    <input type="text" placeholder="Elevating the Art..." value={content.hero_title || ''} onChange={(e) => handleChange('hero_title', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Hero Description</label>
                    <textarea rows="3" placeholder="Hero description copy..." value={content.hero_desc || ''} onChange={(e) => handleChange('hero_desc', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500 resize-none"></textarea>
                  </div>
                </div>
              </div>

              {/* Our Story Section */}
              <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
                <h2 className="font-serif text-2xl font-medium text-white mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Heritage & Origin
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Section Title</label>
                    <input type="text" placeholder="Our Heritage" value={content.about_title || ''} onChange={(e) => handleChange('about_title', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Heritage Body Copy</label>
                    <textarea rows="6" placeholder="The story of AELLYNA..." value={content.about_desc || ''} onChange={(e) => handleChange('about_desc', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500 resize-none"></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Section */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> The Visionary
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Section Title</label>
                  <input type="text" placeholder="Meet the Founder" value={content.founder_title || ''} onChange={(e) => handleChange('founder_title', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Paragraph 1</label>
                    <textarea rows="4" placeholder="First paragraph..." value={content.founder_desc_1 || ''} onChange={(e) => handleChange('founder_desc_1', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Paragraph 2</label>
                    <textarea rows="4" placeholder="Second paragraph..." value={content.founder_desc_2 || ''} onChange={(e) => handleChange('founder_desc_2', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500 resize-none"></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer & Social Media */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Contact & Social Channels
              </h2>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Atelier Address</label>
                    <textarea rows="3" placeholder="Full physical address..." value={content.footer_address || ''} onChange={(e) => handleChange('footer_address', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Contact Email</label>
                    <input type="email" placeholder="concierge@aellyna.com" value={content.footer_email || ''} onChange={(e) => handleChange('footer_email', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Contact Phone</label>
                    <input type="text" placeholder="+1 (800) 000-0000" value={content.footer_phone || ''} onChange={(e) => handleChange('footer_phone', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Instagram Link</label>
                    <input type="text" placeholder="https://instagram.com/..." value={content.social_instagram || ''} onChange={(e) => handleChange('social_instagram', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">Facebook Link</label>
                    <input type="text" placeholder="https://facebook.com/..." value={content.social_facebook || ''} onChange={(e) => handleChange('social_facebook', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">TikTok Link</label>
                    <input type="text" placeholder="https://tiktok.com/..." value={content.social_tiktok || ''} onChange={(e) => handleChange('social_tiktok', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C5A059] mb-2 uppercase tracking-widest">X / Twitter Link</label>
                    <input type="text" placeholder="https://x.com/..." value={content.social_twitter || ''} onChange={(e) => handleChange('social_twitter', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Quote */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Signature Brand Quote
              </h2>
              <textarea rows="3" placeholder="Closing brand statement..." value={content.quote_text || ''} onChange={(e) => handleChange('quote_text', e.target.value)} className="w-full bg-black/50 text-white border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#C5A059] text-sm placeholder-stone-500 resize-none"></textarea>
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA & ACHIEVEMENTS (Restored Full) */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            
            {/* Site Logo */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-medium text-white">Primary Brand Logo</h2>
                <p className="text-xs text-stone-400 mt-1">Displayed in top navigation bar and footer across the public site.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-black/40 p-6 rounded-2xl border border-white/10 shadow-sm">
                <div className="w-28 h-28 bg-[#1A0509] rounded-xl border border-[#C5A059]/30 flex items-center justify-center p-3 shrink-0">
                  {(logo.previewUrl || logo.currentUrl) ? (
                    <img src={logo.previewUrl || logo.currentUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">No Logo</span>
                  )}
                </div>
                <div className="grow space-y-2 text-center sm:text-left">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange} 
                    className="w-full text-xs text-stone-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#C5A059] file:text-[#1A0509] cursor-pointer transition-all" 
                  />
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider">PNG or SVG with transparent background recommended.</p>
                </div>
              </div>
            </div>

            {/* Founder Carousel Images */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-white">Founder Gallery Carousel</h2>
                  <p className="text-xs text-stone-400 mt-1">Upload images for the interactive founder showcase.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFounderImages([...founderImages, { image_url: '', file: null, display_order: founderImages.length }])} 
                  className="bg-[#C5A059] text-[#1A0509] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition shadow-sm"
                >
                  + Add Image
                </button>
              </div>
              
              <div className="space-y-4">
                {founderImages.map((img, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10 shadow-sm">
                    <div className="w-16 h-16 bg-[#1A0509] rounded-xl overflow-hidden shrink-0 border border-[#C5A059]/30 flex items-center justify-center">
                      {(img.previewUrl || img.image_url) ? (
                        <img src={img.previewUrl || img.image_url} alt="Carousel image" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">No Photo</span>
                      )}
                    </div>
                    <div className="grow w-full">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(index, e, setFounderImages, founderImages)} 
                        className="w-full text-xs text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(index, setFounderImages, founderImages, setDeletedImages, deletedImages)} 
                      className="text-red-400 font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-red-900/30 rounded-full transition-colors self-end sm:self-center"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {founderImages.length === 0 && <p className="text-stone-500 italic text-xs text-center py-4">No gallery images added yet.</p>}
              </div>
            </div>

            {/* Achievements & Certificates */}
            <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-white">Achievements & Certifications</h2>
                  <p className="text-xs text-stone-400 mt-1">Upload high-res credentials, certificates, or press documentation.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAchievements([...achievements, { title: '', file_url: '', file: null, file_type: 'image', display_order: achievements.length }])} 
                  className="bg-[#C5A059] text-[#1A0509] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition shadow-sm"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {achievements.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 p-5 rounded-2xl border border-white/10 shadow-sm">
                    <div className="w-16 h-16 bg-[#1A0509] rounded-xl overflow-hidden shrink-0 border border-[#C5A059]/30 flex items-center justify-center">
                      {item.file_type === 'pdf' ? (
                        <span className="text-[10px] font-bold text-[#C5A059] bg-[#58111A] px-3 py-1 rounded-full uppercase tracking-wider">PDF</span>
                      ) : (item.previewUrl || item.file_url) ? (
                        <img src={item.previewUrl || item.file_url} alt="Achievement preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">No File</span>
                      )}
                    </div>
                    
                    <div className="grow space-y-3 w-full">
                      <input 
                        type="text" 
                        placeholder="Certificate or Award Title" 
                        value={item.title || ''} 
                        onChange={(e) => handleFieldChange(index, 'title', e.target.value, setAchievements, achievements)} 
                        className="w-full bg-black/50 border border-[#C5A059]/30 px-4 py-2.5 rounded-xl text-xs font-medium text-white focus:border-[#C5A059] outline-none"
                      />
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleAchievementFileChange(index, e)} 
                        className="w-full text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" 
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(index, setAchievements, achievements, setDeletedAchievements, deletedAchievements)} 
                      className="text-red-400 font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-red-900/30 rounded-full transition-colors self-end sm:self-center shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {achievements.length === 0 && <p className="text-stone-500 italic text-xs text-center py-4">No certificates or achievements added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MENU ITEMS (New) */}
        {activeTab === 'menu' && (
          <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-white">Menu Management</h2>
              <button onClick={() => setMenuItems([...menuItems, { title: '', price: '', category: 'Pastry', description: '', is_available: true }])} className="bg-[#C5A059] text-[#1A0509] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest">+ Add Item</button>
            </div>
            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 bg-black/40 p-5 rounded-2xl border border-white/10">
                  <div className="w-20 h-20 bg-[#1A0509] rounded-xl border border-[#C5A059]/30 shrink-0 overflow-hidden">
                    {(item.previewUrl || item.image_url) && <img src={item.previewUrl || item.image_url} alt="Menu" className="w-full h-full object-cover" />}
                  </div>
                  <div className="grow space-y-3">
                    <div className="flex gap-3">
                      <input type="text" placeholder="Item Name" value={item.title || ''} onChange={(e) => handleFieldChange(index, 'title', e.target.value, setMenuItems, menuItems)} className="w-full bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white" />
                      <input type="text" placeholder="Price ($)" value={item.price || ''} onChange={(e) => handleFieldChange(index, 'price', e.target.value, setMenuItems, menuItems)} className="w-32 bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white" />
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <select value={item.category || 'Pastry'} onChange={(e) => handleFieldChange(index, 'category', e.target.value, setMenuItems, menuItems)} className="bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white">
                        <option value="Pastry">Pastry</option>
                        <option value="Beverage">Beverage</option>
                        <option value="Savory">Savory</option>
                      </select>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(index, e, setMenuItems, menuItems)} className="text-[10px] text-stone-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white/10 file:text-white" />
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(index, setMenuItems, menuItems, setDeletedMenuItems, deletedMenuItems)} className="text-red-400 text-[10px] font-bold uppercase self-start sm:self-center">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROMOTIONS (New) */}
        {activeTab === 'promotions' && (
          <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-white">Promotional Banners</h2>
              <button onClick={() => setPromotions([...promotions, { title: '', tagline: '', is_active: true }])} className="bg-[#C5A059] text-[#1A0509] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest">+ Add Promo</button>
            </div>
            <div className="space-y-4">
              {promotions.map((promo, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 bg-black/40 p-5 rounded-2xl border border-white/10 items-center">
                  <div className="grow space-y-3 w-full">
                    <input type="text" placeholder="Promo Title (e.g., Holiday Special)" value={promo.title || ''} onChange={(e) => handleFieldChange(index, 'title', e.target.value, setPromotions, promotions)} className="w-full bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white" />
                    <input type="text" placeholder="Promo Code / Tagline" value={promo.tagline || ''} onChange={(e) => handleFieldChange(index, 'tagline', e.target.value, setPromotions, promotions)} className="w-full bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white" />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#C5A059] uppercase tracking-widest shrink-0">
                    <input type="checkbox" checked={promo.is_active} onChange={(e) => handleFieldChange(index, 'is_active', e.target.checked, setPromotions, promotions)} className="w-4 h-4 accent-[#C5A059]" /> Active
                  </label>
                  <button onClick={() => handleRemoveItem(index, setPromotions, promotions, setDeletedPromotions, deletedPromotions)} className="text-red-400 text-[10px] font-bold uppercase shrink-0">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FEEDBACK (New) */}
        {activeTab === 'feedback' && (
          <div className="bg-white/5 p-8 rounded-3xl border border-[#C5A059]/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-white">Customer Testimonials</h2>
              <button onClick={() => setFeedbacks([...feedbacks, { customer_name: '', comment: '', rating: 5 }])} className="bg-[#C5A059] text-[#1A0509] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest">+ Add Review</button>
            </div>
            <div className="space-y-4">
              {feedbacks.map((fb, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 bg-black/40 p-5 rounded-2xl border border-white/10">
                  <div className="grow space-y-3">
                    <div className="flex gap-3">
                      <input type="text" placeholder="Customer Name" value={fb.customer_name || ''} onChange={(e) => handleFieldChange(index, 'customer_name', e.target.value, setFeedbacks, feedbacks)} className="w-full bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white" />
                      <input type="number" min="1" max="5" placeholder="Stars (1-5)" value={fb.rating || 5} onChange={(e) => handleFieldChange(index, 'rating', parseInt(e.target.value), setFeedbacks, feedbacks)} className="w-24 bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white" />
                    </div>
                    <textarea placeholder="Review Comment" rows="2" value={fb.comment || ''} onChange={(e) => handleFieldChange(index, 'comment', e.target.value, setFeedbacks, feedbacks)} className="w-full bg-black/50 border border-[#C5A059]/30 px-3 py-2 rounded-lg text-xs text-white resize-none"></textarea>
                  </div>
                  <button onClick={() => handleRemoveItem(index, setFeedbacks, feedbacks, setDeletedFeedbacks, deletedFeedbacks)} className="text-red-400 text-[10px] font-bold uppercase self-start sm:self-center">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMER INQUIRIES (Restored Full) */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#C5A059]/15">
              <div>
                <h2 className="font-serif text-2xl font-medium text-white">Customer Inquiries</h2>
                <p className="text-xs text-stone-400 mt-1">Direct inquiries submitted through the contact form.</p>
              </div>
              <button 
                type="button" 
                onClick={fetchData} 
                className="text-[10px] font-bold uppercase tracking-widest text-[#1A0509] border border-[#C5A059] bg-[#C5A059] px-4 py-2 rounded-full hover:brightness-110 transition-colors"
              >
                Refresh List
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-16 text-center bg-white/5 rounded-3xl border border-dashed border-[#C5A059]/30">
                <p className="text-stone-400 font-serif text-base">No customer inquiries submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="bg-black/40 p-6 rounded-3xl border border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-3 grow">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-lg font-medium text-[#C5A059]">{inq.name}</h3>
                        <span className="text-[10px] font-sans text-stone-300 bg-white/10 border border-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <a href={`mailto:${inq.email}`} className="text-xs font-semibold text-white hover:text-[#C5A059] transition-colors inline-block">
                        ✉️ {inq.email}
                      </a>
                      <p className="text-sm text-stone-300 bg-[#1A0509]/50 p-5 rounded-2xl border border-[#C5A059]/15 whitespace-pre-wrap leading-relaxed">
                        {inq.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteInquiry(inq.id)}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-900/30 px-4 py-2 rounded-full border border-red-900/50 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Save Action Bar */}
        {activeTab !== 'inquiries' && (
          <div className="mt-12 pt-6 border-t border-[#C5A059]/15 sticky bottom-6 z-50">
            {message && (
              <div className={`p-4 rounded-2xl font-bold text-xs text-center mb-4 shadow-lg backdrop-blur-md border ${message.includes('✅') ? 'bg-emerald-900/80 text-emerald-100 border-emerald-500/30' : 'bg-red-900/80 text-red-100 border-red-500/30'}`}>
                {message}
              </div>
            )}
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full bg-linear-to-r from-[#C5A059] to-[#b38e4a] text-[#1A0509] font-bold py-4 rounded-full hover:brightness-110 transition-all disabled:opacity-50 shadow-xl border border-[#C5A059]/30 text-xs tracking-widest uppercase flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1A0509]/30 border-t-[#1A0509] rounded-full animate-spin"></div>
                  <span>Persisting Changes...</span>
                </>
              ) : (
                'Save All Changes'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}