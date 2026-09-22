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

  // --- CMS State ---
  const [activeTab, setActiveTab] = useState('content');
  const [content, setContent] = useState({});
  const [logo, setLogo] = useState({ file: null, previewUrl: '', currentUrl: '' });
  const [founderImages, setFounderImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [deletedAchievements, setDeletedAchievements] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // --- Auth Effect (Deduplicated) ---
useEffect(() => {
  // onAuthStateChange automatically fires on mount with 'INITIAL_SESSION'
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

 // --- CMS Data Fetching (Parallelized with Promise.all) ---
async function fetchData() {
  setLoading(true);

  try {
    // Run ALL 4 queries in parallel instead of one after another
    const [
      { data: textData },
      { data: imgData },
      { data: achData },
      { data: inqData }
    ] = await Promise.all([
      supabase.from('site_content').select('*'),
      supabase.from('founder_images').select('*').order('display_order', { ascending: true }),
      supabase.from('achievements').select('*').order('display_order', { ascending: true }),
      supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    ]);

    // Process Text Content
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

  } catch (error) {
    console.error('Error fetching admin data:', error);
  } finally {
    setLoading(false);
  }
}

  // --- CMS Handlers ---
  const handleChange = (id, value) => setContent(prev => ({ ...prev, [id]: value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogo({ ...logo, file, previewUrl: URL.createObjectURL(file) });
  };

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updatedImages = [...founderImages];
    updatedImages[index].file = file;
    updatedImages[index].previewUrl = URL.createObjectURL(file);
    setFounderImages(updatedImages);
  };

  const handleAddImage = () => setFounderImages([...founderImages, { image_url: '', file: null, display_order: founderImages.length }]);

  const handleRemoveImage = (index) => {
    const imgToRemove = founderImages[index];
    if (imgToRemove.id) setDeletedImages([...deletedImages, imgToRemove.id]);
    setFounderImages(founderImages.filter((_, i) => i !== index));
  };

  const handleAchievementTitleChange = (index, value) => {
    const updated = [...achievements];
    updated[index].title = value;
    setAchievements(updated);
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

  const handleAddAchievement = () => setAchievements([...achievements, { title: '', file_url: '', file: null, file_type: 'image', display_order: achievements.length }]);

  const handleRemoveAchievement = (index) => {
    const itemToRemove = achievements[index];
    if (itemToRemove.id) setDeletedAchievements([...deletedAchievements, itemToRemove.id]);
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleDeleteInquiry = async (id) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (!error) {
      setInquiries(inquiries.filter(item => item.id !== id));
    } else {
      alert('Failed to delete inquiry.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // 1. Handle Logo Upload
      let finalLogoUrl = logo.currentUrl;
      if (logo.file) {
        const fileExt = logo.file.name.split('.').pop();
        const fileName = `site-logo-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, logo.file);
        if (uploadErr) throw new Error('Logo upload failed: ' + uploadErr.message);
        finalLogoUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Save Text Content
      const textUpdates = Object.keys(content).map(id => ({ id: id, content: content[id] }));
      if (finalLogoUrl) {
        const logoIndex = textUpdates.findIndex(item => item.id === 'site_logo_url');
        if (logoIndex >= 0) {
          textUpdates[logoIndex].content = finalLogoUrl;
        } else {
          textUpdates.push({ id: 'site_logo_url', content: finalLogoUrl });
        }
      }

      const { error: textError } = await supabase.from('site_content').upsert(textUpdates);
      if (textError) throw new Error('Text saving failed: ' + textError.message);

      // 3. Handle Founder Images
      if (deletedImages.length > 0) {
        const { error: delError } = await supabase.from('founder_images').delete().in('id', deletedImages);
        if (delError) throw new Error('Failed to delete images: ' + delError.message);
      }
      
      for (let i = 0; i < founderImages.length; i++) {
        let img = founderImages[i];
        let finalImageUrl = img.image_url;

        if (img.file) {
          const fileExt = img.file.name.split('.').pop();
          const fileName = `founder-${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, img.file);
          if (uploadErr) throw new Error('Image upload failed: ' + uploadErr.message);
          finalImageUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        }

        if (img.id) {
          const { error: updateErr } = await supabase.from('founder_images').update({ image_url: finalImageUrl, display_order: i }).eq('id', img.id);
          if (updateErr) throw new Error('Image update failed: ' + updateErr.message);
        } else {
          const { error: insErr } = await supabase.from('founder_images').insert({ image_url: finalImageUrl, display_order: i });
          if (insErr) throw new Error('Image insert failed: ' + insErr.message);
        }
      }

      // 4. Handle Achievements
      if (deletedAchievements.length > 0) {
        const { error: delAchErr } = await supabase.from('achievements').delete().in('id', deletedAchievements);
        if (delAchErr) throw new Error('Failed to delete achievements: ' + delAchErr.message);
      }
      
      for (let i = 0; i < achievements.length; i++) {
        let item = achievements[i];
        let finalFileUrl = item.file_url;

        if (!item.id && !item.file && !item.file_url) {
          throw new Error(`Please upload a file for the achievement: ${item.title || 'Untitled'}`);
        }

        if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `achieve-${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, item.file);
          if (uploadErr) throw new Error('Achievement upload failed: ' + uploadErr.message);
          finalFileUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        }

        const record = { 
          title: item.title, 
          file_url: finalFileUrl, 
          image_url: finalFileUrl,
          file_type: item.file_type, 
          display_order: i,
          description: '',
          category: 'General'
        };
        
        if (item.id) {
          const { error: updateErr } = await supabase.from('achievements').update(record).eq('id', item.id);
          if (updateErr) throw new Error('Achievement update failed: ' + updateErr.message);
        } else {
          const { error: insErr } = await supabase.from('achievements').insert(record);
          if (insErr) throw new Error('Achievement insert failed: ' + insErr.message);
        }
      }

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
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#58111A] border-t-[#C5A059] rounded-full animate-spin"></div>
          <p className="font-serif text-[#58111A] text-xs tracking-widest uppercase animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center p-4 selection:bg-[#58111A] selection:text-[#C5A059]">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-[#C5A059]/20">
          <h1 className="text-3xl font-serif text-[#3B0B13] font-medium text-center mb-1">Admin Portal</h1>
          <p className="text-center text-[10px] text-stone-400 mb-8 uppercase tracking-widest font-bold">Authorized Access Only</p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200/50 text-red-700 text-xs rounded-xl text-center shadow-inner">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="w-full bg-white text-stone-800 border border-[#C5A059]/30 px-4 py-3.5 rounded-xl transition-all outline-none focus:border-[#58111A] shadow-inner text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="w-full bg-white text-stone-800 border border-[#C5A059]/30 px-4 py-3.5 rounded-xl transition-all outline-none focus:border-[#58111A] shadow-inner text-sm" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isAuthLoading} 
              className="w-full bg-linear-to-r from-[#58111A] to-[#3B0B13] text-[#FAF7F5] font-bold py-4 rounded-full hover:brightness-110 transition-all disabled:opacity-50 text-[10px] tracking-widest uppercase mt-4 shadow-xl border border-[#C5A059]/30"
            >
              Sign In to Command Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Render CMS Dashboard ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#58111A] border-t-[#C5A059] rounded-full animate-spin"></div>
          <p className="font-serif text-[#58111A] text-xs tracking-widest uppercase animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-stone-800 p-4 md:p-8 font-sans pb-36 selection:bg-[#58111A] selection:text-[#C5A059]">
      <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-xl p-6 md:p-12 rounded-3xl shadow-2xl shadow-[#3B0B13]/5 border border-[#C5A059]/20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[#C5A059]/15">
          <div>
            <span className="text-[#C5A059] text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Administration</span>
            <h1 className="text-3xl md:text-4xl font-serif text-[#3B0B13] font-medium">Command Center</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#58111A] border border-[#C5A059]/30 bg-white px-5 py-3 rounded-full hover:bg-[#58111A] hover:border-[#58111A] hover:text-[#FAF7F5] transition-all shadow-sm"
            >
              <span>View Live Site</span>
            </a>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-red-600 transition-colors px-3 py-3"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Pill Style) */}
        <div className="flex gap-2 p-1.5 bg-stone-100/70 rounded-full border border-stone-200/80 w-fit mb-10 overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-[#58111A] text-white shadow-md'
                : 'text-stone-500 hover:text-[#58111A] hover:bg-stone-200/50'
            }`}
          >
            Brand Copy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full whitespace-nowrap ${
              activeTab === 'media'
                ? 'bg-[#58111A] text-white shadow-md'
                : 'text-stone-500 hover:text-[#58111A] hover:bg-stone-200/50'
            }`}
          >
            Media & Assets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'bg-[#58111A] text-white shadow-md'
                : 'text-stone-500 hover:text-[#58111A] hover:bg-stone-200/50'
            }`}
          >
            <span>Inquiries</span>
            {inquiries.length > 0 && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans ${activeTab === 'inquiries' ? 'bg-[#C5A059] text-white' : 'bg-[#58111A] text-white'}`}>
                {inquiries.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: BRAND COPY */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Hero Section */}
              <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
                <h2 className="font-serif text-2xl font-medium text-[#3B0B13] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Hero Section
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Subtitle (Est. Date)</label>
                    <input type="text" placeholder="Est. 2026" value={content.hero_subtitle || ''} onChange={(e) => handleChange('hero_subtitle', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Main Headline</label>
                    <input type="text" placeholder="Elevating the Art..." value={content.hero_title || ''} onChange={(e) => handleChange('hero_title', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Hero Description</label>
                    <textarea rows="3" placeholder="Hero description copy..." value={content.hero_desc || ''} onChange={(e) => handleChange('hero_desc', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400 resize-none"></textarea>
                  </div>
                </div>
              </div>

              {/* Our Story Section */}
              <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
                <h2 className="font-serif text-2xl font-medium text-[#3B0B13] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Heritage & Origin
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Section Title</label>
                    <input type="text" placeholder="Our Heritage" value={content.about_title || ''} onChange={(e) => handleChange('about_title', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Heritage Body Copy</label>
                    <textarea rows="6" placeholder="The story of AELLYNA..." value={content.about_desc || ''} onChange={(e) => handleChange('about_desc', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400 resize-none"></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Section */}
            <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-[#3B0B13] mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> The Visionary
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Section Title</label>
                  <input type="text" placeholder="Meet the Founder" value={content.founder_title || ''} onChange={(e) => handleChange('founder_title', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Paragraph 1</label>
                    <textarea rows="4" placeholder="First paragraph..." value={content.founder_desc_1 || ''} onChange={(e) => handleChange('founder_desc_1', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Paragraph 2</label>
                    <textarea rows="4" placeholder="Second paragraph..." value={content.founder_desc_2 || ''} onChange={(e) => handleChange('founder_desc_2', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400 resize-none"></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer & Social Media */}
            <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-[#3B0B13] mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Contact & Social Channels
              </h2>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Atelier Address</label>
                    <textarea rows="3" placeholder="Full physical address..." value={content.footer_address || ''} onChange={(e) => handleChange('footer_address', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Contact Email</label>
                    <input type="email" placeholder="concierge@aellyna.com" value={content.footer_email || ''} onChange={(e) => handleChange('footer_email', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Contact Phone</label>
                    <input type="text" placeholder="+1 (800) 000-0000" value={content.footer_phone || ''} onChange={(e) => handleChange('footer_phone', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Instagram Link</label>
                    <input type="text" placeholder="https://instagram.com/..." value={content.social_instagram || ''} onChange={(e) => handleChange('social_instagram', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">Facebook Link</label>
                    <input type="text" placeholder="https://facebook.com/..." value={content.social_facebook || ''} onChange={(e) => handleChange('social_facebook', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">TikTok Link</label>
                    <input type="text" placeholder="https://tiktok.com/..." value={content.social_tiktok || ''} onChange={(e) => handleChange('social_tiktok', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#58111A] mb-2 uppercase tracking-widest">X / Twitter Link</label>
                    <input type="text" placeholder="https://x.com/..." value={content.social_twitter || ''} onChange={(e) => handleChange('social_twitter', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Quote */}
            <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <h2 className="font-serif text-2xl font-medium text-[#3B0B13] mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span> Signature Brand Quote
              </h2>
              <textarea rows="3" placeholder="Closing brand statement..." value={content.quote_text || ''} onChange={(e) => handleChange('quote_text', e.target.value)} className="w-full bg-white/70 text-stone-800 border border-[#C5A059]/30 px-4 py-3 rounded-xl transition-all outline-none focus:border-[#58111A] focus:bg-white text-sm shadow-inner placeholder-stone-400 resize-none"></textarea>
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA & ACHIEVEMENTS */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            
            {/* Site Logo */}
            <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-medium text-[#3B0B13]">Primary Brand Logo</h2>
                <p className="text-xs text-stone-500 mt-1">Displayed in top navigation bar and footer across the public site.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-2xl border border-[#C5A059]/20 shadow-sm">
                <div className="w-28 h-28 bg-[#FAF7F5] rounded-xl border border-stone-200 flex items-center justify-center p-3 shrink-0">
                  {(logo.previewUrl || logo.currentUrl) ? (
                    <img src={logo.previewUrl || logo.currentUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">No Logo</span>
                  )}
                </div>
                <div className="grow space-y-2 text-center sm:text-left">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange} 
                    className="w-full text-xs text-stone-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#58111A] file:text-white hover:file:bg-[#3B0B13] cursor-pointer transition-all" 
                  />
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">PNG or SVG with transparent background recommended.</p>
                </div>
              </div>
            </div>

            {/* Founder Carousel Images */}
            <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-[#3B0B13]">Founder Gallery Carousel</h2>
                  <p className="text-xs text-stone-500 mt-1">Upload images for the interactive founder showcase.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddImage} 
                  className="bg-[#58111A] text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#3B0B13] transition shadow-sm"
                >
                  + Add Image
                </button>
              </div>
              
              <div className="space-y-4">
                {founderImages.map((img, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-[#C5A059]/20 shadow-sm">
                    <div className="w-16 h-16 bg-[#FAF7F5] rounded-xl overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center">
                      {(img.previewUrl || img.image_url) ? (
                        <img src={img.previewUrl || img.image_url} alt="Carousel image" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">No Photo</span>
                      )}
                    </div>
                    <div className="grow w-full">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(index, e)} 
                        className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#58111A]/10 file:text-[#58111A] hover:file:bg-[#58111A]/20 cursor-pointer" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImage(index)} 
                      className="text-red-600 font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-full transition-colors self-end sm:self-center"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {founderImages.length === 0 && <p className="text-stone-400 italic text-xs text-center py-4">No gallery images added yet.</p>}
              </div>
            </div>

            {/* Achievements & Certificates */}
            <div className="bg-[#FAF7F5]/80 p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-[#3B0B13]">Achievements & Certifications</h2>
                  <p className="text-xs text-stone-500 mt-1">Upload high-res credentials, certificates, or press documentation.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddAchievement} 
                  className="bg-[#58111A] text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#3B0B13] transition shadow-sm"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {achievements.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#C5A059]/20 shadow-sm">
                    <div className="w-16 h-16 bg-[#FAF7F5] rounded-xl overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center">
                      {item.file_type === 'pdf' ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">PDF</span>
                      ) : (item.previewUrl || item.file_url) ? (
                        <img src={item.previewUrl || item.file_url} alt="Achievement preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">No File</span>
                      )}
                    </div>
                    
                    <div className="grow space-y-3 w-full">
                      <input 
                        type="text" 
                        placeholder="Certificate or Award Title (e.g., International Excellence Award)" 
                        value={item.title} 
                        onChange={(e) => handleAchievementTitleChange(index, e.target.value)} 
                        className="w-full bg-[#FAF7F5]/50 border border-[#C5A059]/30 px-4 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:border-[#58111A] outline-none"
                      />
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleAchievementFileChange(index, e)} 
                        className="w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#58111A]/10 file:text-[#58111A] hover:file:bg-[#58111A]/20 cursor-pointer" 
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveAchievement(index)} 
                      className="text-red-600 font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-full transition-colors self-end sm:self-center shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {achievements.length === 0 && <p className="text-stone-400 italic text-xs text-center py-4">No certificates or achievements added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#C5A059]/15">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#3B0B13]">Customer Inquiries</h2>
                <p className="text-xs text-stone-500 mt-1">Direct inquiries submitted through the contact form.</p>
              </div>
              <button 
                type="button" 
                onClick={fetchData} 
                className="text-[10px] font-bold uppercase tracking-widest text-[#58111A] border border-[#C5A059]/30 bg-white px-4 py-2 rounded-full hover:bg-[#58111A] hover:text-white transition-colors"
              >
                Refresh List
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-16 text-center bg-[#FAF7F5]/80 rounded-3xl border border-dashed border-[#C5A059]/30">
                <p className="text-stone-500 font-serif text-base">No customer inquiries submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="bg-white p-6 rounded-3xl border border-[#C5A059]/20 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-3 grow">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-lg font-medium text-[#3B0B13]">{inq.name}</h3>
                        <span className="text-[10px] font-sans text-stone-400 bg-[#FAF7F5] border border-stone-200 px-3 py-1 rounded-full uppercase tracking-wider">
                          {new Date(inq.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <a href={`mailto:${inq.email}`} className="text-xs font-semibold text-[#58111A] hover:underline inline-block">
                        ✉️ {inq.email}
                      </a>
                      <p className="text-sm text-stone-700 bg-[#FAF7F5]/80 p-5 rounded-2xl border border-[#C5A059]/15 whitespace-pre-wrap leading-relaxed">
                        {inq.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteInquiry(inq.id)}
                      className="text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-full border border-red-200 transition-colors shrink-0"
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
              <div className={`p-4 rounded-2xl font-bold text-xs text-center mb-4 shadow-lg backdrop-blur-md ${message.includes('✅') ? 'bg-emerald-900/90 text-emerald-100 border border-emerald-500/30' : 'bg-red-900/90 text-red-100 border border-red-500/30'}`}>
                {message}
              </div>
            )}
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full bg-linear-to-r from-[#58111A] to-[#3B0B13] text-[#FAF7F5] font-bold py-4 rounded-full hover:brightness-110 transition-all disabled:opacity-50 shadow-xl border border-[#C5A059]/30 text-xs tracking-widest uppercase flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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