/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [content, setContent] = useState({});
  const [founderImages, setFounderImages] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeFounderIdx, setActiveFounderIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // State for Lightbox Image Modal
  const [selectedMedia, setSelectedMedia] = useState(null);

  // New state for Contact Form
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle'); // idle, submitting, success, error

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 1. Fetch text content
      const { data: textData } = await supabase.from('site_content').select('*');
      if (textData) {
        const mappedText = {};
        textData.forEach(item => {
          mappedText[item.id] = item.content;
        });
        setContent(mappedText);
      }

      // 2. Fetch founder images
      const { data: imagesData } = await supabase
        .from('founder_images')
        .select('*')
        .order('display_order', { ascending: true });
      if (imagesData && imagesData.length > 0) {
        setFounderImages(imagesData);
      } else {
        setFounderImages([
          { image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800' },
          { image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800' }
        ]);
      }

      // 3. Fetch achievements
      const { data: achData } = await supabase
        .from('achievements')
        .select('*')
        .order('display_order', { ascending: true });
      if (achData) {
        setAchievements(achData);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Handler for Contact Form Submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('submitting');
    
    const { error } = await supabase.from('inquiries').insert([{
      name: contactForm.name,
      email: contactForm.email,
      message: contactForm.message
    }]);

    if (error) {
      console.error(error);
      setContactStatus('error');
    } else {
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactStatus('idle'), 5000); // Reset after 5s
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#58111A] border-t-[#C5A059] rounded-full animate-spin"></div>
          <p className="font-serif text-[#58111A] text-lg tracking-widest uppercase animate-pulse">Loading AELLYNA...</p>
        </div>
      </div>
    );
  }

  // Fallback image if logo_url is not set in DB
  const logoSrc = content.site_logo_url || '/logo.png';

  return (
    <main className="selection:bg-[#58111A] selection:text-[#C5A059] bg-[#FAF7F5] text-stone-800 antialiased scroll-smooth">
      
      {/* Navigation - Dynamic Island Style */}
      <div className="fixed top-6 w-full z-50 flex justify-center px-4 pointer-events-none">
        <nav className="w-full max-w-4xl bg-[#FAF7F5]/85 backdrop-blur-lg border border-[#C5A059]/30 rounded-full shadow-2xl shadow-[#3B0B13]/10 transition-all duration-300 pointer-events-auto">
          <div className="px-6 h-16 flex items-center justify-between">
            
            {/* Circular Image Logo & Brand Name */}
            <a href="#" className="flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C5A059]/40 p-0.5 transition-transform duration-300 group-hover:scale-105 shadow-sm bg-white">
                <img 
                  src={logoSrc} 
                  alt="AELLYNA Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=200';
                  }}
                />
              </div>
              <span className="font-serif text-xl font-semibold tracking-[0.2em] text-[#3B0B13] group-hover:text-[#58111A] transition-colors">
                AELLYNA
              </span>
            </a>

            {/* Navigation Links (Collection Removed) */}
            <div className="hidden md:flex space-x-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-700">
              <a href="#about" className="hover:text-[#58111A] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C5A059] hover:after:w-full after:transition-all">Our Story</a>
              <a href="#founder" className="hover:text-[#58111A] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C5A059] hover:after:w-full after:transition-all">Founder</a>
              <a href="#achievements" className="hover:text-[#58111A] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C5A059] hover:after:w-full after:transition-all">Legacy</a>
              <a href="#contact" className="hover:text-[#58111A] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C5A059] hover:after:w-full after:transition-all">Connect</a>
            </div>

            <a href="#contact" className="hidden md:inline-flex bg-[#58111A] text-[#FAF7F5] border border-[#C5A059]/30 text-[10px] font-semibold px-5 py-2 rounded-full hover:bg-[#3B0B13] hover:border-[#C5A059] active:scale-95 transition-all tracking-[0.18em] uppercase shadow-md shadow-[#58111A]/10">
              Reserve
            </a>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <header id="hero" className="relative min-h-screen flex items-center bg-cover bg-center py-28" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589367920969-ab8e050bfc18?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-linear-to-r from-[#1A0509]/90 via-[#2A080E]/60 to-black/30"></div>
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 pt-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-8 lg:col-span-7 bg-white/85 backdrop-blur-lg rounded-3xl p-10 md:p-14 border border-white/60 shadow-2xl shadow-[#2A080E]/15">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-[#C5A059]"></div>
                <p className="text-[#58111A] font-semibold tracking-[0.2em] text-xs uppercase">
                  {content.hero_subtitle || 'Est. 2026'}
                </p>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-[#3B0B13] mb-6 leading-[1.15]">
                {content.hero_title || 'Elevating the Art of Pastry & Beverage.'}
              </h1>
              <p className="text-base md:text-lg text-stone-700 font-normal mb-6 leading-relaxed">
                {content.hero_desc}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="relative py-32 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-[#2A080E]/75 backdrop-blur-[2px]"></div>
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-4 hidden md:block"></div>
            <div className="md:col-span-8 bg-white/95 backdrop-blur-lg rounded-3xl p-10 md:p-16 border border-white/50 shadow-2xl">
              <span className="text-[#C5A059] text-xs font-semibold tracking-[0.2em] uppercase mb-3 block">Heritage</span>
              <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#3B0B13] mb-6">
                {content.about_title || 'Our Origin Story'}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A059] mb-8"></div>
              <p className="text-base md:text-lg text-stone-700 leading-relaxed font-normal mb-6">
                {content.about_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section id="founder" className="py-32 relative bg-[#FAF7F5]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Founder Image Container */}
            <div className="lg:col-span-5 relative w-full aspect-4/5 rounded-3xl overflow-hidden shadow-2xl shadow-[#3B0B13]/15 border border-[#C5A059]/30 bg-[#3B0B13]">
              <img 
                src={founderImages[activeFounderIdx]?.image_url} 
                alt="Founder" 
                className="w-full h-full object-cover transition-all duration-700 hover:scale-105" 
              />
              {founderImages.length > 1 && (
                <div className="absolute bottom-6 right-6 flex items-center gap-2 backdrop-blur-md bg-black/40 p-1.5 rounded-full border border-white/20">
                  <button 
                    onClick={() => setActiveFounderIdx((prev) => (prev === 0 ? founderImages.length - 1 : prev - 1))}
                    className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#3B0B13] flex items-center justify-center font-semibold transition-all active:scale-90"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setActiveFounderIdx((prev) => (prev + 1) % founderImages.length)}
                    className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#3B0B13] flex items-center justify-center font-semibold transition-all active:scale-90"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Founder Content */}
            <div className="lg:col-span-7">
              <span className="text-[#C5A059] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">The Visionary</span>
              <h2 className="text-3xl md:text-5xl font-serif text-[#3B0B13] mb-8 font-medium">
                {content.founder_title || 'Meet the Founder'}
              </h2>
              <div className="w-12 h-0.5 bg-[#C5A059]/60 mb-8"></div>
              <p className="text-base md:text-lg text-stone-700 leading-relaxed font-normal mb-6 whitespace-pre-line">
                {content.founder_desc_1}
              </p>
              <p className="text-base md:text-lg text-stone-700 leading-relaxed font-normal mb-10 whitespace-pre-line">
                {content.founder_desc_2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <section id="achievements" className="py-32 relative bg-[#F4EFEA] border-t border-[#C5A059]/20">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="text-[#C5A059] text-xs font-semibold tracking-[0.2em] uppercase mb-3 block">Excellence</span>
              <h2 className="text-3xl md:text-5xl font-serif text-[#3B0B13] font-medium">Milestones & Recognition</h2>
            </div>
            
            {/* Grid of Achievements */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {achievements.map((item) => (
                <div key={item.id} className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-[#C5A059]/20 hover:border-[#C5A059]/60 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div>
                    {/* Media Display Box */}
                    <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 mb-6 flex items-center justify-center group-hover:shadow-inner">
                      {item.file_type === 'pdf' ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-14 h-14 bg-[#58111A]/10 rounded-full flex items-center justify-center text-[#58111A] font-semibold text-xs tracking-wider mb-3 shadow-sm group-hover:scale-110 transition-transform">
                            PDF
                          </div>
                          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest">
                            Dokumen / Sijil
                          </span>
                        </div>
                      ) : (
                        <img
                          src={item.file_url}
                          alt={item.title || 'Sijil Pencapaian'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                          onClick={() => setSelectedMedia(item.file_url)}
                        />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-semibold text-[#3B0B13] text-xl mb-4 line-clamp-2">
                      {item.title || 'Pencapaian'}
                    </h3>
                  </div>

                  {/* Action Link / Button */}
                  <div className="pt-4 border-t border-[#C5A059]/15 mt-auto">
                    {item.file_type === 'pdf' ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#58111A] hover:text-[#C5A059] transition-colors uppercase tracking-widest"
                      >
                        <span>Lihat Dokumen PDF</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <button
                        onClick={() => setSelectedMedia(item.file_url)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#58111A] hover:text-[#C5A059] transition-colors uppercase tracking-widest"
                      >
                        <span>Besarkan Gambar</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial / Contact Section */}
      <section id="contact" className="py-32 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-[#2A080E]/85 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Quote Section (Left Side) */}
          <div>
            <span className="text-[#C5A059] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">The Experience</span>
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-10 font-medium">A Class Apart.</h2>
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-10 border border-white/10 relative border-l-4 border-l-[#C5A059]">
              <p className="text-lg md:text-xl font-serif italic text-stone-200 leading-relaxed mb-6 pt-2">
                &quot;{content.quote_text}&quot;
              </p>
            </div>
          </div>

          {/* Connect Form Section (Right Side) */}
          <div className="bg-[#1A0509]/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-[#C5A059]/20 shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 font-medium">Connect</h3>
            <p className="text-stone-300/80 font-normal mb-8 text-xs tracking-wider uppercase">Inquire for events, partnerships, or specialized orders.</p>
            
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-[#C5A059] mb-2 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={contactForm.name} 
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})} 
                  className="w-full bg-white/5 text-white border border-white/10 px-4 py-3.5 rounded-2xl transition-all outline-none focus:border-[#C5A059] focus:bg-white/10 placeholder-stone-500 text-sm" 
                  placeholder="Jane Doe" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#C5A059] mb-2 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={contactForm.email} 
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})} 
                  className="w-full bg-white/5 text-white border border-white/10 px-4 py-3.5 rounded-2xl transition-all outline-none focus:border-[#C5A059] focus:bg-white/10 placeholder-stone-500 text-sm" 
                  placeholder="jane@example.com" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#C5A059] mb-2 uppercase tracking-widest">Inquiry Details</label>
                <textarea 
                  required 
                  rows="4" 
                  value={contactForm.message} 
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})} 
                  className="w-full bg-white/5 text-white border border-white/10 px-4 py-3.5 rounded-2xl transition-all resize-none outline-none focus:border-[#C5A059] focus:bg-white/10 placeholder-stone-500 text-sm" 
                  placeholder="How can we elevate your next event?"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={contactStatus === 'submitting'} 
                className="w-full bg-[#C5A059] text-[#2A080E] py-4 rounded-2xl font-semibold hover:bg-white transition-all tracking-[0.18em] uppercase text-xs shadow-xl disabled:opacity-70 active:scale-[0.99]"
              >
                {contactStatus === 'submitting' ? 'Sending...' : 'Submit Inquiry'}
              </button>
              
              {contactStatus === 'success' && (
                <p className="text-[#C5A059] font-medium text-xs text-center mt-4">Thank you. Our concierge will be in touch shortly.</p>
              )}
              {contactStatus === 'error' && (
                <p className="text-red-400 font-medium text-xs text-center mt-4">Something went wrong. Please try again.</p>
              )}
            </form>
          </div>

        </div>
      </section>

      {/* Brand Footer */}
      <footer className="bg-[#1A0509] text-stone-300 py-20 border-t border-[#C5A059]/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Column 1: Logo & Tagline */}
          <div className="space-y-6 md:col-span-1">
            <a href="#" className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[#C5A059]/40 p-0.5 bg-white/5 shadow-md">
                <img 
                  src={logoSrc} 
                  alt="AELLYNA Circular Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=200';
                  }}
                />
              </div>
              <div>
                <h4 className="font-serif text-xl font-medium text-white tracking-[0.2em]">AELLYNA</h4>
                <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.2em] font-semibold">Artisanal Pastry</p>
              </div>
            </a>
            <p className="text-xs text-stone-400 leading-relaxed font-light">
              {content.footer_about || 'Crafting extraordinary confectionery & bespoke beverage experiences defined by sophistication and flair.'}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h5 className="font-serif text-base font-medium text-white mb-6 tracking-wider">Explore</h5>
            <ul className="space-y-3 text-xs text-stone-400">
              <li><a href="#hero" className="hover:text-[#C5A059] transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-[#C5A059] transition-colors">Our Story</a></li>
              <li><a href="#founder" className="hover:text-[#C5A059] transition-colors">The Visionary</a></li>
              <li><a href="#achievements" className="hover:text-[#C5A059] transition-colors">Legacy & Awards</a></li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h5 className="font-serif text-base font-medium text-white mb-6 tracking-wider">Contact Us</h5>
            <ul className="space-y-4 text-xs text-stone-400">
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{content.footer_address || 'Kuala Lumpur, Malaysia'}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#C5A059] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${content.footer_email || 'concierge@aellyna.com'}`} className="hover:text-[#C5A059] transition-colors">
                  {content.footer_email || 'concierge@aellyna.com'}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#C5A059] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${content.footer_phone || '+60123456789'}`} className="hover:text-[#C5A059] transition-colors">
                  {content.footer_phone || '+60 12-345 6789'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Media Links */}
          <div>
            <h5 className="font-serif text-base font-medium text-white mb-6 tracking-wider">Social Media</h5>
            <p className="text-[11px] text-stone-400 mb-4">Follow our journey and daily creations.</p>
            <div className="flex flex-wrap gap-3">
              <a 
                href={content.social_instagram || "https://instagram.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#C5A059] hover:text-[#2A080E] transition-all flex items-center justify-center border border-white/10"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              <a 
                href={content.social_tiktok || "https://tiktok.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#C5A059] hover:text-[#2A080E] transition-all flex items-center justify-center border border-white/10"
                aria-label="TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.33 1.55-1.3 2.55.01.81.4 1.6 1.05 2.08.79.6 1.86.75 2.81.46.94-.27 1.72-.98 2.06-1.91.24-.62.28-1.31.28-1.98-.01-5.12 0-10.24-.01-15.36z"/>
                </svg>
              </a>

              <a 
                href={content.social_facebook || "https://facebook.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#C5A059] hover:text-[#2A080E] transition-all flex items-center justify-center border border-white/10"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
                </svg>
              </a>

              <a 
                href={content.social_whatsapp || "https://wa.me/60123456789"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#C5A059] hover:text-[#2A080E] transition-all flex items-center justify-center border border-white/10"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar / Copyright + Discreet Admin Portal Button */}
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 AELLYNA. All rights reserved.</p>
          <p className="font-serif italic text-[#C5A059]/70 text-sm">AELLYNA</p>
          
          {/* Subtle Admin Portal Button */}
          <a 
            href="/admin" 
            className="inline-flex items-center gap-1.5 text-[11px] tracking-wider uppercase text-stone-500 hover:text-[#C5A059] transition-colors py-1 px-3 rounded-full border border-stone-800 hover:border-[#C5A059]/40 bg-white/5"
          >
            <svg className="w-3 h-3 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Admin Portal</span>
          </a>
        </div>
      </footer>

      {/* IMAGE LIGHTBOX MODAL */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl p-2">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 bg-white/10 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold hover:bg-[#58111A] transition-colors backdrop-blur-md z-10 border border-white/20 text-xs"
            >
              ✕
            </button>
            <img
              src={selectedMedia}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </main>
  );
}