
import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Mic, Shield, Zap, TrendingUp, Phone, X, Check, Headphones, MessageSquare, AlertCircle, BarChart3 } from 'lucide-react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
  onRefundClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onPricingClick, onTermsClick, onPrivacyClick, onRefundClick }) => {
  const { t, isRTL } = useLanguage();
  const [wordIndex, setWordIndex] = useState(0);
  
  const rotatingWords = [
    t('landing.hero.words.0' as any),
    t('landing.hero.words.1' as any),
    t('landing.hero.words.2' as any),
    t('landing.hero.words.3' as any),
    t('landing.hero.words.4' as any)
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500); // 2.5 seconds per word
    return () => clearInterval(interval);
  }, [rotatingWords.length]);
  
  return (
    <div className={`min-h-screen bg-[#faf9f6] dark:bg-[#020617] font-sans text-slate-900 dark:text-white selection:bg-[#0500e2] selection:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}>
      
      {/* Navigation */}
      <PublicNavigation 
        onLogin={onLoginClick}
        onSignup={onSignupClick}
        onPricing={onPricingClick}
        onLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        activePage="landing"
      />

      {/* Hero Section: The Flight Simulator */}
      <section className="relative pt-32 pb-12 lg:pt-48 lg:pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            
            {/* Left: Copy */}
            <div className="relative z-10 max-w-2xl lg:max-w-none">
                <div className={`inline-flex items-center gap-2 px-3 py-1 mb-8 ${isRTL ? 'border-r-2' : 'border-l-2'} border-[#0500e2] bg-blue-50 dark:bg-blue-900/10`}>
                    <span className="text-xs font-bold text-[#0500e2] uppercase tracking-widest">{t('landing.hero.badge')}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
                    {t('landing.hero.prefix' as any)} <br />
                    <span 
                      key={wordIndex} 
                      className="text-[#0500e2] inline-block animate-slide-up-fade text-2xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold sm:whitespace-nowrap"
                    >
                      {rotatingWords[wordIndex]}
                    </span>
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-lg">
                    {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onSignupClick}
                        className="px-8 py-4 bg-[#0500e2] text-white rounded-lg font-bold text-lg hover:bg-[#0400c0] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 hover:-translate-y-1"
                    >
                        {t('landing.cta.start')} <ArrowRight size={20} className={isRTL ? "rotate-180" : ""} />
                    </button>
                    <button 
                        onClick={onLoginClick}
                        className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-lg font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                    >
                        <Play size={20} className="fill-current" /> {t('landing.cta.demo')}
                    </button>
                </div>
                
                <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700"></div>
                        ))}
                    </div>
                    <p>{t('landing.social_proof_text')}</p>
                </div>
            </div>

            {/* Right: UI Visualization */}
            <div className="relative">
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Simulated Call Card */}
                <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-fade-in-up">
                    {/* Call Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 animate-pulse">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{t('landing.demo.customer_name')}</h3>
                                <p className="text-xs font-mono text-slate-500">00:42 • {t('landing.demo.scenario')}</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold uppercase rounded-full animate-pulse">
                            {t('landing.demo.recording')}
                        </div>
                    </div>

                    {/* Waveform Visualization */}
                    <div className="h-24 flex items-center justify-center gap-1 mb-8 opacity-80" dir="ltr">
                        {[...Array(40)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-[#0500e2] rounded-full animate-[bounce_1s_infinite]" 
                                style={{ 
                                    height: `${Math.random() * 100}%`, 
                                    animationDelay: `${i * 0.05}s` 
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Live Feedback Popups */}
                    <div className="space-y-3">
                        <div className={`bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg flex items-center gap-3 transform ${isRTL ? '-translate-x-4' : 'translate-x-4'}`}>
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3} /></div>
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t('landing.demo.feedback_good')}</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg flex items-center gap-3 w-max">
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0"><AlertCircle size={14} strokeWidth={3} /></div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('landing.demo.feedback_bad')}</p>
                        </div>
                    </div>

                    {/* Call Actions */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Mic size={20} />
                        </div>
                        <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <MessageSquare size={20} />
                        </div>
                        <div className="h-12 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                            <Phone size={20} className="rotate-[135deg]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500" dir="ltr">
              <span className="text-xl font-serif font-black text-slate-800 dark:text-white">Acme Corp</span>
              <span className="text-xl font-sans font-bold italic text-slate-700 dark:text-slate-200">GlobalBank</span>
              <span className="text-xl font-mono font-semibold text-slate-600 dark:text-slate-300">stripe</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">UBER</span>
              <span className="text-xl font-bold tracking-widest text-slate-700 dark:text-slate-200">LINEAR</span>
          </div>
      </div>

      {/* The Problem: Awkward Roleplay */}
      <section className="py-24 px-6 bg-[#faf9f6] dark:bg-[#020617]">
          <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6">
                  {t('landing.comparison.title_start')} <span className="text-red-500 line-through decoration-4 decoration-red-200">{t('landing.comparison.title_awkward')}</span>.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                  {t('landing.comparison.subtitle')}
              </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Old Way */}
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-60">
                  <h3 className="text-xl font-bold text-slate-500 mb-6 flex items-center gap-2">
                      <X size={24} /> {t('landing.comparison.old_way')}
                  </h3>
                  <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {t('landing.comparison.old_list.1')}
                      </li>
                      <li className="flex items-center gap-3 text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {t('landing.comparison.old_list.2')}
                      </li>
                      <li className="flex items-center gap-3 text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {t('landing.comparison.old_list.3')}
                      </li>
                  </ul>
              </div>

              {/* New Way */}
              <div className="p-8 rounded-3xl bg-[#0500e2] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                  <div className={`absolute top-0 ${isRTL ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl'} p-3 bg-white/10`}>
                      <span className="text-xs font-bold uppercase tracking-wider">{t('landing.comparison.badge')}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Check size={24} /> {t('landing.comparison.new_way')}
                  </h3>
                  <ul className="space-y-4">
                      <li className="flex items-center gap-3 font-medium">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check size={12} strokeWidth={3} /></div> 
                          {t('landing.comparison.new_list.1')}
                      </li>
                      <li className="flex items-center gap-3 font-medium">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check size={12} strokeWidth={3} /></div> 
                          {t('landing.comparison.new_list.2')}
                      </li>
                      <li className="flex items-center gap-3 font-medium">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check size={12} strokeWidth={3} /></div> 
                          {t('landing.comparison.new_list.3')}
                      </li>
                  </ul>
              </div>
          </div>
      </section>

      {/* Scenarios Grid */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                  <div>
                      <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">{t('landing.scenarios.title')}</h2>
                      <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                          {t('landing.scenarios.subtitle')}
                      </p>
                  </div>
                  <button onClick={onSignupClick} className="text-[#0500e2] font-bold flex items-center gap-2 hover:gap-3 transition-all">
                      {t('landing.scenarios.cta')} <ArrowRight size={18} className={isRTL ? "rotate-180" : ""} />
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                      { icon: Zap, color: 'text-amber-500', title: t('landing.scenarios.card1.title'), desc: t('landing.scenarios.card1.desc') },
                      { icon: TrendingUp, color: 'text-green-500', title: t('landing.scenarios.card2.title'), desc: t('landing.scenarios.card2.desc') },
                      { icon: Shield, color: 'text-blue-500', title: t('landing.scenarios.card3.title'), desc: t('landing.scenarios.card3.desc') },
                  ].map((card, i) => (
                      <div key={i} className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all group cursor-default">
                          <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm mb-6 ${card.color} group-hover:scale-110 transition-transform`}>
                              <card.icon size={24} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                              {card.desc}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span> {t('landing.scenarios.duration')}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Analytics Feature */}
      <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                  {/* Decorative Elements */}
                  <div className="absolute -left-10 top-10 w-32 h-32 bg-[#0500e2] rounded-full blur-[80px] opacity-20"></div>
                  
                  {/* Mockup */}
                  <div className={`relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 ${isRTL ? 'rotate-2' : 'rotate-[-2deg]'} hover:rotate-0 transition-transform duration-500`}>
                      <div className="flex items-center justify-between mb-8">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <BarChart3 size={20} className="text-[#0500e2]" /> {t('landing.analytics.mockup.title')}
                          </h4>
                          <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">
                              {t('landing.analytics.mockup.badge')}
                          </div>
                      </div>
                      <div className="space-y-6">
                          {[
                              { label: t('landing.analytics.mockup.metric1'), val: 92, color: 'bg-green-500' },
                              { label: t('landing.analytics.mockup.metric2'), val: 88, color: 'bg-blue-500' },
                              { label: t('landing.analytics.mockup.metric3'), val: 74, color: 'bg-amber-500' },
                          ].map((stat, i) => (
                              <div key={i}>
                                  <div className="flex justify-between text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                      <span>{stat.label}</span>
                                      <span>{stat.val}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.val}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="order-1 lg:order-2">
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6">
                      {t('landing.analytics.title')}
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                      {t('landing.analytics.subtitle')}
                  </p>
                  <ul className="space-y-4 mb-10">
                      {[
                          t('landing.analytics.list.1'),
                          t('landing.analytics.list.2'),
                          t('landing.analytics.list.3')
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                              <div className="w-6 h-6 rounded-full bg-[#0500e2]/10 flex items-center justify-center text-[#0500e2] shrink-0">
                                  <Check size={14} strokeWidth={3} />
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
                  <button 
                    onClick={onSignupClick}
                    className="text-slate-900 dark:text-white font-bold border-b-2 border-slate-900 dark:border-white hover:text-[#0500e2] hover:border-[#0500e2] transition-colors"
                  >
                      {t('landing.analytics.cta')}
                  </button>
              </div>
          </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-slate-900 dark:bg-white rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0500e2] rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
              
              <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-white dark:text-slate-900 mb-8">
                      {t('landing.final_cta.title')}
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button 
                        onClick={onSignupClick}
                        className="px-10 py-5 bg-[#0500e2] text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform shadow-lg shadow-blue-500/30"
                      >
                          {t('landing.final_cta.button')}
                      </button>
                  </div>
                  <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">{t('landing.final_cta.note')}</p>
              </div>
          </div>
      </section>

      <Footer 
        onTermsClick={onTermsClick} 
        onPrivacyClick={onPrivacyClick} 
        onRefundClick={onRefundClick}
      />
    </div>
  );
};
