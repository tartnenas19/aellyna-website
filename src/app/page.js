/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* ---------- Small reusable pieces ---------- */

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-16 bg-linear-to-r from-transparent to-[#C5A059]"></span>
      <span className="w-2 h-2 rotate-45 bg-[#C5A059]"></span>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-[#C5A059]"></span>
    </div>
  );
}

function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="text-center mb-16 reveal">
      <span className="text-[#C5A059] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">{eyebrow}</span>
      <h2 className="text-3xl md:text-5xl font-serif text-white font-medium mb-6">{title}</h2>
      <Ornament />
      {children}
    </div>
  );
}

function BigNumber({ n, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none select-none absolute font-serif leading-none text-[10rem] md:text-[18rem] ${className}`}
      style={{ color: 'transparent', WebkitTextStroke: '1px rgba(197,160,89,0.10)' }}
    >
      {n}
    </span>
  );
}

const MARQUEE_WORDS = ['Artisan Pastry', 'Bespoke Beverages', 'Refined Flavours', 'AELLYNA'];

export default function Home() {
  const [content, setContent] = useState({});
  const [founderImages, setFounderImages] = useState([]);
  const [achievements, setAchievements] = useState([]);

  // Restored States
  const [menuItems, setMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [activeFounderIdx, setActiveFounderIdx] = useState(0);
  const [activeMenuCategory, setActiveMenuCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // State for Lightbox Image Modal
  const [selectedMedia, setSelectedMedia] = useState(null);

  // State for Contact Form
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle'); // idle, submitting, success, error

  const progressRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch all tables concurrently
      const [
        { data: textData },
        { data: imagesData },
        { data: achData },
        { data: menuData },
        { data: promoData },
        { data: feedbackData }
      ] = await Promise.all([
        supabase.from('site_content').select('*'),
        supabase.from('founder_images').select('*').order('display_order', { ascending: true }),
        supabase.from('achievements').select('*').order('display_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('display_order', { ascending: true }),
        supabase.from('promotions').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        supabase.from('customer_feedback').select('*').order('display_order', { ascending: true })
      ]);

      if (textData) {
        const mappedText = {};
        textData.forEach(item => { mappedText[item.id] = item.content; });
        setContent(mappedText);
      }

      if (imagesData && imagesData.length > 0) {
        setFounderImages(imagesData);
      } else {
        setFounderImages([
          { image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800' },
          { image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800' }
        ]);
      }

      if (achData) setAchievements(achData);
      if (menuData) setMenuItems(menuData);
      if (promoData) setPromotions(promoData);
      if (feedbackData) setFeedbacks(feedbackData);

      setLoading(false);
    }

    fetchData();
  }, []);

  // Scroll-reveal animation
  useEffect(() => {
    if (loading) return;
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [loading, activeMenuCategory, menuItems.length, achievements.length, feedbacks.length]);

  // Scroll progress bar
  useEffect(() => {
    if (loading) return;
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading]);

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
      setTimeout(() => setContactStatus('idle'), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A0509] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin"></div>
          <p className="font-serif text-[#C5A059] text-lg tracking-widest uppercase animate-pulse">Loading AELLYNA...</p>
        </div>
      </div>
    );
  }

  const logoSrc = content.site_logo_url || '/logo.png';
  const logoFallback = (e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=200'; };
  const menuCategories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredMenu = activeMenuCategory === 'All' ? menuItems : menuItems.filter(item => item.category === activeMenuCategory);

  const stats = [
    { value: menuItems.length, label: 'Signature Creations' },
    { value: achievements.length, label: 'Awards & Milestones' },
    { value: feedbacks.length, label: 'Guest Reviews' },
  ].filter(s => s.value > 0);

  const navLink = "text-stone-200 hover:text-[#C5A059] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#C5A059] hover:after:w-full after:transition-all";

  return (
    <main className="selection:bg-[#C5A059] selection:text-[#2A080E] bg-[#1A0509] text-stone-200 antialiased scroll-smooth overflow-x-hidden">

      {/* Global effects */}
      <style>{`
        .reveal { opacity: 0; transform: translateY(32px); transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); transition-delay: var(--d, 0ms); }
        .reveal.is-visible { opacity: 1; transform: none; }
        @keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-22px) } }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes shimmer { to { background-position: 200% center } }
        @keyframes spinSlow { to { transform: rotate(360deg) } }
        @keyframes scrollDot { 0% { opacity: 0; transform: translateY(0) } 40% { opacity: 1 } 100% { opacity: 0; transform: translateY(14px) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .animate-fadeIn { animation: fadeIn .3s ease; }
        .gold-text { background: linear-gradient(90deg, #C5A059, #F3E3B3, #C5A059); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 6s linear infinite; }
        .dots-bg { background-image: radial-gradient(rgba(197,160,89,.14) 1px, transparent 1px); background-size: 30px 30px; }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; transition: none; }
          .gold-text, [style*="spinSlow"], [style*="floaty"] { animation: none !important; }
        }
      `}</style>

      {/* Scroll progress */}
      <div className="fixed top-0 left-0 w-full h-0.5 z-60 bg-transparent pointer-events-none">
        <div ref={progressRef} className="h-full bg-linear-to-r from-[#58111A] via-[#C5A059] to-[#F3E3B3]" style={{ width: '0%' }}></div>
      </div>

      {/* Navigation - Dynamic Island Style */}
      <div className="fixed top-6 w-full z-50 flex justify-center px-4 pointer-events-none">
        <nav className="w-full max-w-5xl bg-[#1A0509]/70 backdrop-blur-xl border border-[#C5A059]/30 rounded-full shadow-2xl shadow-black/40 transition-all duration-300 pointer-events-auto">
          <div className="px-6 h-16 flex items-center justify-between">

            <a href="#" className="flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C5A059]/50 p-0.5 transition-transform duration-300 group-hover:scale-105 shadow-sm bg-white">
                <img src={logoSrc} alt="AELLYNA Logo" className="w-full h-full object-cover rounded-full" onError={logoFallback} />
              </div>
              <span className="font-serif text-xl font-semibold tracking-[0.2em] text-white group-hover:text-[#C5A059] transition-colors">AELLYNA</span>
            </a>

            <div className="hidden lg:flex space-x-6 text-[10px] font-semibold uppercase tracking-[0.15em]">
              <a href="#about" className={navLink}>Story</a>
              {content.show_menu === 'true' && <a href="#menu" className={navLink}>Menu</a>}
              <a href="#founder" className={navLink}>Founder</a>
              <a href="#achievements" className={navLink}>Legacy</a>
              {content.show_feedback === 'true' && <a href="#reviews" className={navLink}>Reviews</a>}
              <a href="#contact" className={navLink}>Connect</a>
            </div>

            <a href="#contact" className="hidden md:inline-flex bg-[#C5A059] text-[#2A080E] text-[10px] font-bold px-5 py-2 rounded-full hover:bg-white active:scale-95 transition-all tracking-[0.18em] uppercase shadow-md shadow-[#C5A059]/20">
              Reserve
            </a>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <header id="hero" className="relative min-h-screen flex items-center bg-cover bg-center py-28 overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589367920969-ab8e050bfc18?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-linear-to-r from-[#1A0509]/95 via-[#2A080E]/65 to-black/30"></div>
        <div className="absolute inset-0 bg-linear-to-t from-[#1A0509] via-transparent to-transparent"></div>
        <div className="absolute inset-0 dots-bg opacity-40"></div>

        {/* floating glows */}
        <div className="absolute -top-20 -left-24 w-96 h-96 rounded-full bg-[#58111A]/60 blur-3xl" style={{ animation: 'floaty 9s ease-in-out infinite' }}></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-[#C5A059]/15 blur-3xl" style={{ animation: 'floaty 11s ease-in-out infinite' }}></div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 pt-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 bg-[#1A0509]/75 backdrop-blur-xl rounded-3xl p-10 md:p-14 border border-[#C5A059]/25 shadow-2xl shadow-black/40 reveal">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-[#C5A059]"></div>
                <p className="text-[#C5A059] font-semibold tracking-[0.25em] text-xs uppercase">{content.hero_subtitle || 'Est. 2026'}</p>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white mb-6 leading-[1.15]">
                {content.hero_title || 'Elevating the Art of Pastry & Beverage.'}
              </h1>
              <p className="text-base md:text-lg text-stone-300 font-normal mb-10 leading-relaxed">
                {content.hero_desc}
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#about" className="inline-flex items-center gap-2 bg-[#C5A059] text-[#2A080E] px-8 py-3.5 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white active:scale-95 transition-all shadow-lg shadow-[#C5A059]/20">
                  Discover Our Story <span aria-hidden="true">→</span>
                </a>
                {content.show_menu === 'true' && (
                  <a href="#menu" className="inline-flex items-center gap-2 border border-[#C5A059]/60 text-[#C5A059] px-8 py-3.5 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059]/10 active:scale-95 transition-all">
                    View Menu
                  </a>
                )}
              </div>
            </div>

            {/* Rotating emblem */}
            <div className="hidden lg:flex lg:col-span-5 justify-center reveal" style={{ '--d': '200ms' }}>
              <div className="relative w-80 h-80">
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{ animation: 'spinSlow 30s linear infinite' }}>
                  <defs>
                    <path id="emblemCircle" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
                  </defs>
                  <text fill="#C5A059" fontSize="11" letterSpacing="3" fontFamily="serif">
                    <textPath href="#emblemCircle" textLength="496" lengthAdjust="spacing">ARTISAN PASTRY • BESPOKE BEVERAGES • AELLYNA • REFINED FLAVOURS • </textPath>
                  </text>
                </svg>
                <div className="absolute inset-10 rounded-full border border-[#C5A059]/40 bg-[#1A0509]/60 backdrop-blur-md p-1.5 shadow-2xl shadow-black/50">
                  <img src={logoSrc} alt="AELLYNA emblem" className="w-full h-full object-cover rounded-full" onError={logoFallback} />
                </div>
                <div className="absolute inset-3 rounded-full border border-dashed border-[#C5A059]/20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <a href="#about" aria-label="Scroll down" className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 text-[#C5A059]/80 hover:text-[#C5A059] transition-colors">
          <span className="text-[9px] tracking-[0.35em] uppercase">Scroll</span>
          <span className="w-5 h-9 rounded-full border border-[#C5A059]/60 flex justify-center pt-2">
            <span className="w-1 h-1.5 rounded-full bg-[#C5A059]" style={{ animation: 'scrollDot 1.8s ease-in-out infinite' }}></span>
          </span>
        </a>
      </header>

      {/* Promotions Banner */}
      {content.show_promo === 'true' && promotions.length > 0 && (
        <div className="bg-[#1A0509] border-y border-[#C5A059]/30 py-4 relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
              {promotions.map((promo) => (
                <div key={promo.id} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
                  <span className="text-white font-serif italic text-lg">{promo.title}</span>
                  <span className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase border border-[#C5A059]/40 px-2 py-0.5 rounded-full">{promo.tagline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Marquee ribbon */}
      <div className="relative bg-[#58111A] border-y border-[#C5A059]/40 overflow-hidden py-4" aria-hidden="true">
        <div className="flex w-max" style={{ animation: 'marquee 35s linear infinite' }}>
          {[0, 1].map(g => (
            <div key={g} className="flex shrink-0 items-center">
              {[...Array(3)].map((_, r) => MARQUEE_WORDS.map((w, i) => (
                <span key={`${r}-${i}`} className="flex items-center">
                  <span className="font-serif italic text-lg md:text-2xl text-[#F3E3B3] px-8 whitespace-nowrap">{w}</span>
                  <span className="text-[#C5A059] text-xs">✦</span>
                </span>
              )))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats band */}
      {stats.length > 0 && (
        <div className="relative bg-[#1A0509] py-16 border-b border-[#C5A059]/15">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {stats.map((s, i) => (
              <div key={s.label} className="reveal" style={{ '--d': `${i * 120}ms` }}>
                <div className="font-serif text-6xl gold-text mb-2">{String(s.value).padStart(2, '0')}</div>
                <div className="text-[11px] tracking-[0.3em] uppercase text-stone-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Section */}
      <section id="about" className="relative py-32 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-[#2A080E]/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 dots-bg opacity-30"></div>
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-4 hidden md:block"></div>
            <div className="md:col-span-8 bg-white/95 backdrop-blur-lg rounded-3xl p-10 md:p-16 border border-white/50 shadow-2xl reveal" style={{ '--d': '150ms' }}>
              <span className="text-[#C5A059] text-xs font-semibold tracking-[0.2em] uppercase mb-3 block">Heritage</span>
              <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#3B0B13] mb-6">{content.about_title || 'Our Origin Story'}</h2>
              <div className="w-12 h-0.5 bg-[#C5A059] mb-8"></div>
              <p className="text-base md:text-lg text-stone-700 leading-relaxed font-normal">{content.about_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      {content.show_menu === 'true' && menuItems.length > 0 && (
        <section id="menu" className="py-32 relative bg-[#2A080E] overflow-hidden">
          <div className="absolute inset-0 dots-bg opacity-40"></div>
          <div className="absolute -top-40 -right-40 w-xl h-[36rem] rounded-full bg-[#58111A]/50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-[#C5A059]/10 blur-3xl"></div>
          <BigNumber n="01" className="top-6 right-4" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <SectionHeader eyebrow="Artisanal Selection" title="Our Creations">
              <div className="flex flex-wrap justify-center gap-3 mt-10">
                {menuCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveMenuCategory(cat)}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeMenuCategory === cat ? 'bg-[#C5A059] text-[#2A080E] shadow-lg shadow-[#C5A059]/20' : 'bg-white/5 border border-white/10 text-stone-300 hover:border-[#C5A059]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </SectionHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMenu.map((item, i) => (
                <div key={item.id} className="reveal" style={{ '--d': `${(i % 3) * 110}ms` }}>
                  <div className="group relative h-full bg-linear-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-sm rounded-3xl p-4 border border-[#C5A059]/15 hover:border-[#C5A059]/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 transition-all duration-500">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-5 bg-linear-to-br from-[#58111A] to-[#1A0509] flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <span className="font-serif text-6xl gold-text">✦</span>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-[#1A0509]/70 via-transparent to-transparent"></div>
                      {item.category && (
                        <span className="absolute top-3 left-3 bg-[#1A0509]/70 backdrop-blur-md border border-[#C5A059]/40 text-[#C5A059] text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full">{item.category}</span>
                      )}
                      <span className="absolute bottom-3 right-3 bg-[#C5A059] text-[#2A080E] font-bold text-sm px-4 py-1.5 rounded-full shadow-lg">${item.price}</span>
                    </div>
                    <div className="px-1 pb-2">
                      <h3 className="font-serif font-medium text-xl text-white mb-2 group-hover:text-[#C5A059] transition-colors">{item.title}</h3>
                      <div className="w-8 h-px bg-[#C5A059]/60 mb-3 group-hover:w-16 transition-all duration-500"></div>
                      <p className="text-sm text-stone-400 leading-relaxed line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Founder Section */}
      <section id="founder" className="py-32 relative bg-[#1A0509] border-y border-[#C5A059]/10 overflow-hidden">
        <div className="absolute inset-0 dots-bg opacity-30"></div>
        <div className="absolute top-1/3 -left-40 w-[32rem] h-[32rem] rounded-full bg-[#58111A]/50 blur-3xl"></div>
        <BigNumber n="02" className="bottom-0 left-4" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 relative reveal">
              {/* offset gold frame */}
              <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl border border-[#C5A059]/50"></div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-3xl bg-[#C5A059]/20 blur-xl"></div>
              <div className="relative w-full aspect-4/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-[#C5A059]/30 bg-[#3B0B13]">
                <img src={founderImages[activeFounderIdx]?.image_url} alt="Founder" className="w-full h-full object-cover transition-all duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-linear-to-t from-[#1A0509]/60 via-transparent to-transparent pointer-events-none"></div>
                {founderImages.length > 1 && (
                  <>
                    <div className="absolute bottom-6 left-6 flex items-center gap-2">
                      {founderImages.map((_, i) => (
                        <button key={i} aria-label={`Show photo ${i + 1}`} onClick={() => setActiveFounderIdx(i)} className={`h-1.5 rounded-full transition-all ${i === activeFounderIdx ? 'w-8 bg-[#C5A059]' : 'w-3 bg-white/50 hover:bg-white'}`}></button>
                      ))}
                    </div>
                    <div className="absolute bottom-6 right-6 flex items-center gap-2 backdrop-blur-md bg-black/40 p-1.5 rounded-full border border-white/20">
                      <button onClick={() => setActiveFounderIdx((prev) => (prev === 0 ? founderImages.length - 1 : prev - 1))} className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#3B0B13] flex items-center justify-center font-semibold transition-all active:scale-90">‹</button>
                      <button onClick={() => setActiveFounderIdx((prev) => (prev + 1) % founderImages.length)} className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#3B0B13] flex items-center justify-center font-semibold transition-all active:scale-90">›</button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-7 relative reveal" style={{ '--d': '150ms' }}>
              <span aria-hidden="true" className="absolute -top-16 -left-2 font-serif text-[10rem] leading-none text-[#C5A059]/15 select-none">“</span>
              <span className="relative text-[#C5A059] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">The Visionary</span>
              <h2 className="relative text-3xl md:text-5xl font-serif text-white mb-6 font-medium">{content.founder_title || 'Meet the Founder'}</h2>
              <div className="relative mb-8"><div className="w-16 h-0.5 bg-linear-to-r from-[#C5A059] to-transparent"></div></div>
              <p className="relative text-base md:text-lg text-stone-300 leading-relaxed font-normal mb-6 whitespace-pre-line">{content.founder_desc_1}</p>
              <p className="relative text-base md:text-lg text-stone-300 leading-relaxed font-normal whitespace-pre-line">{content.founder_desc_2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <section id="achievements" className="py-32 relative bg-[#2A080E] overflow-hidden">
          <div className="absolute inset-0 dots-bg opacity-40"></div>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[24rem] rounded-full bg-[#C5A059]/10 blur-3xl"></div>
          <BigNumber n="03" className="top-6 left-4" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <SectionHeader eyebrow="Excellence" title="Milestones & Recognition" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {achievements.map((item, idx) => (
                <div key={item.id} className="reveal" style={{ '--d': `${(idx % 3) * 110}ms` }}>
                  <div className="relative h-full bg-linear-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-lg rounded-3xl p-6 border border-[#C5A059]/20 hover:border-[#C5A059]/70 transition-all duration-500 flex flex-col group shadow-sm hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-2">
                    <span className="absolute -top-3 left-6 z-10 bg-[#C5A059] text-[#2A080E] text-[10px] font-bold tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">{String(idx + 1).padStart(2, '0')}</span>
                    <div>
                      <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-6 flex items-center justify-center group-hover:shadow-inner">
                        {item.file_type === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-14 h-14 bg-[#C5A059]/10 rounded-full flex items-center justify-center text-[#C5A059] font-semibold text-xs mb-3 shadow-sm group-hover:scale-110 transition-transform ring-1 ring-[#C5A059]/40">PDF</div>
                            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Dokumen / Sijil</span>
                          </div>
                        ) : (
                          <img src={item.file_url} alt={item.title || 'Sijil Pencapaian'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => setSelectedMedia(item.file_url)} />
                        )}
                      </div>
                      <h3 className="font-serif font-semibold text-white text-xl mb-4 line-clamp-2">{item.title || 'Pencapaian'}</h3>
                    </div>
                    <div className="pt-4 border-t border-[#C5A059]/15 mt-auto">
                      {item.file_type === 'pdf' ? (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-[#C5A059] hover:text-white transition-colors uppercase tracking-widest">
                          <span>Enlarge</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      ) : (
                        <button onClick={() => setSelectedMedia(item.file_url)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#C5A059] hover:text-white transition-colors uppercase tracking-widest">
                          <span>Enlarge</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feedback / Testimonials */}
      {content.show_feedback === 'true' && feedbacks.length > 0 && (
        <section id="reviews" className="py-32 relative bg-[#1A0509] overflow-hidden">
          <div className="absolute inset-0 dots-bg opacity-30"></div>
          <div className="absolute -bottom-40 -right-32 w-[34rem] h-[34rem] rounded-full bg-[#58111A]/50 blur-3xl"></div>
          <BigNumber n="04" className="top-6 right-4" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <SectionHeader eyebrow="Testimonials" title="Guest Experiences" />
            <div className="grid md:grid-cols-3 gap-6">
              {feedbacks.slice(0, 3).map((fb, i) => (
                <div key={fb.id} className="reveal" style={{ '--d': `${i * 120}ms` }}>
                  <div className="relative h-full bg-linear-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-[#C5A059]/50 p-8 rounded-3xl backdrop-blur-sm transition-all duration-500 hover:-translate-y-2">
                    <span aria-hidden="true" className="absolute top-2 right-6 font-serif text-8xl leading-none text-[#C5A059]/20 select-none">”</span>
                    <div className="flex gap-1 mb-4 text-[#C5A059]">
                      {[...Array(Number(fb.rating) || 0)].map((_, k) => <span key={k}>★</span>)}
                    </div>
                    <p className="relative text-stone-300 text-sm italic leading-relaxed mb-8">"{fb.comment}"</p>
                    <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                      <span className="w-10 h-10 rounded-full bg-[#C5A059] text-[#2A080E] font-serif font-bold flex items-center justify-center">{(fb.customer_name || '?').charAt(0).toUpperCase()}</span>
                      <p className="text-white font-serif uppercase tracking-wider text-xs">{fb.customer_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Connect Section */}
      <section id="contact" className="py-32 relative bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-[#2A080E]/85 backdrop-blur-sm"></div>
        <div className="absolute inset-0 dots-bg opacity-30"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <span className="text-[#C5A059] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">The Experience</span>
            <h2 className="text-4xl md:text-6xl font-serif gold-text mb-10 font-medium">A Class Apart.</h2>
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-10 border border-white/10 relative border-l-4 border-l-[#C5A059]">
              <p className="text-lg md:text-xl font-serif italic text-stone-200 leading-relaxed pt-2">"{content.quote_text}"</p>
            </div>
          </div>

          <div className="bg-[#1A0509]/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-[#C5A059]/20 shadow-2xl reveal" style={{ '--d': '150ms' }}>
            <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 font-medium">Connect</h3>
            <p className="text-stone-300/80 font-normal mb-8 text-xs tracking-wider uppercase">Inquire for events, partnerships, or specialized orders.</p>
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-[#C5A059] mb-2 uppercase tracking-widest">Full Name</label>
                <input type="text" required value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} className="w-full bg-white/5 text-white border border-white/10 px-4 py-3.5 rounded-2xl transition-all outline-none focus:border-[#C5A059] focus:bg-white/10 placeholder-stone-500 text-sm" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#C5A059] mb-2 uppercase tracking-widest">Email Address</label>
                <input type="email" required value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} className="w-full bg-white/5 text-white border border-white/10 px-4 py-3.5 rounded-2xl transition-all outline-none focus:border-[#C5A059] focus:bg-white/10 placeholder-stone-500 text-sm" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#C5A059] mb-2 uppercase tracking-widest">Inquiry Details</label>
                <textarea required rows="4" value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} className="w-full bg-white/5 text-white border border-white/10 px-4 py-3.5 rounded-2xl transition-all resize-none outline-none focus:border-[#C5A059] focus:bg-white/10 placeholder-stone-500 text-sm" placeholder="How can we elevate your next event?"></textarea>
              </div>
              <button type="submit" disabled={contactStatus === 'submitting'} className="w-full bg-[#C5A059] text-[#2A080E] py-4 rounded-2xl font-semibold hover:bg-white transition-all tracking-[0.18em] uppercase text-xs shadow-xl disabled:opacity-70 active:scale-[0.99]">
                {contactStatus === 'submitting' ? 'Sending...' : 'Submit Inquiry'}
              </button>
              {contactStatus === 'success' && <p className="text-[#C5A059] font-medium text-xs text-center mt-4">Thank you. Our concierge will be in touch shortly.</p>}
              {contactStatus === 'error' && <p className="text-red-400 font-medium text-xs text-center mt-4">Something went wrong. Please try again.</p>}
            </form>
          </div>
        </div>
      </section>

      {/* Brand Footer */}
      <footer className="relative bg-[#1A0509] text-stone-300 py-20 border-t border-[#C5A059]/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#C5A059] to-transparent"></div>
        <div className="absolute inset-0 dots-bg opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">

          <div className="space-y-6 md:col-span-1">
            <a href="#" className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[#C5A059]/40 p-0.5 bg-white/5 shadow-md">
                <img src={logoSrc} alt="AELLYNA Circular Logo" className="w-full h-full object-cover rounded-full" onError={logoFallback} />
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

          <div>
            <h5 className="font-serif text-base font-medium text-white mb-6 tracking-wider">Explore</h5>
            <ul className="space-y-3 text-xs text-stone-400">
              <li><a href="#hero" className="hover:text-[#C5A059] transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-[#C5A059] transition-colors">Our Story</a></li>
              <li><a href="#founder" className="hover:text-[#C5A059] transition-colors">The Visionary</a></li>
              <li><a href="#achievements" className="hover:text-[#C5A059] transition-colors">Legacy & Awards</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-serif text-base font-medium text-white mb-6 tracking-wider">Contact Us</h5>
            <ul className="space-y-4 text-xs text-stone-400">
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{content.footer_address || 'Kuala Lumpur, Malaysia'}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#C5A059] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href={`mailto:${content.footer_email || 'concierge@aellyna.com'}`} className="hover:text-[#C5A059] transition-colors">{content.footer_email || 'concierge@aellyna.com'}</a>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#C5A059] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href={`tel:${content.footer_phone || '+60123456789'}`} className="hover:text-[#C5A059] transition-colors">{content.footer_phone || '+60 12-345 6789'}</a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-serif text-base font-medium text-white mb-6 tracking-wider">Social Media</h5>
            <p className="text-[11px] text-stone-400 mb-4">Follow our journey and daily creations.</p>
            <div className="flex flex-wrap gap-3">
              {content.social_instagram && (
                <a href={content.social_instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#C5A059] hover:text-[#2A080E] transition-all flex items-center justify-center border border-white/10" aria-label="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {content.social_facebook && (
                <a href={content.social_facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#C5A059] hover:text-[#2A080E] transition-all flex items-center justify-center border border-white/10" aria-label="Facebook">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-stone-500 gap-4 relative z-10">
          <p>© 2026 AELLYNA. All rights reserved.</p>
          <a href="#hero" className="inline-flex items-center gap-2 font-serif italic text-[#C5A059]/80 hover:text-[#C5A059] text-sm transition-colors">
            <span aria-hidden="true">↑</span> Back to top
          </a>
          <a href="/admin" className="inline-flex items-center gap-1.5 text-[11px] tracking-wider uppercase text-stone-500 hover:text-[#C5A059] transition-colors py-1 px-3 rounded-full border border-stone-800 hover:border-[#C5A059]/40 bg-white/5">
            <svg className="w-3 h-3 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span>Admin Portal</span>
          </a>
        </div>
      </footer>

      {/* IMAGE LIGHTBOX MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={() => setSelectedMedia(null)}>
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl p-2">
            <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 bg-white/10 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold hover:bg-[#58111A] transition-colors backdrop-blur-md z-10 border border-white/20 text-xs">✕</button>
            <img src={selectedMedia} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </main>
  );
}