
import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Mic, Shield, Zap, TrendingUp, Phone, Check, MessageSquare, AlertCircle, BarChart3, Star, Search, Bell, ChevronDown } from 'lucide-react';
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
    }, 2500);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);
  
  return (
    <div className={`min-h-screen bg-[#f8faff] dark:bg-[#020617] font-sans text-slate-900 dark:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}>
      
      {/* Navigation */}
      <PublicNavigation 
        onLogin={onLoginClick}
        onSignup={onSignupClick}
        onPricing={onPricingClick}
        onLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        activePage="landing"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-0 lg:pt-40 lg:pb-0 px-6 overflow-hidden bg-[#f8faff] dark:bg-[#020617]">
        {/* Decorative Background Elements */}
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-[100px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
            
            {/* Center: Copy */}
            <div className="w-full mb-16 flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-full shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-[#0500e2]"></span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">{t('landing.hero.badge')}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a0f2c] dark:text-white tracking-tight mb-6 leading-[1.2] max-w-5xl mx-auto">
                    {t('landing.hero.prefix' as any)} <br />
                    <span 
                      key={wordIndex} 
                      className="text-[#0500e2] inline-block animate-slide-up-fade"
                    >
                      {rotatingWords[wordIndex]}
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed max-w-3xl">
                    {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
                    <button 
                        onClick={onSignupClick}
                        className="px-8 py-4 bg-[#0500e2] text-white rounded-full font-medium text-lg hover:bg-[#0400c0] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 hover:-translate-y-1"
                    >
                        {t('landing.cta.start')} 
                    </button>
                    <button 
                        onClick={onLoginClick}
                        className="px-6 py-4 text-slate-800 dark:text-white font-medium text-lg hover:text-[#0500e2] dark:hover:text-blue-400 transition-all flex items-center justify-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-pink-400 text-white flex items-center justify-center shadow-md">
                            <Play size={18} className="fill-current ml-1" />
                        </div>
                        {t('landing.cta.demo')}
                    </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mt-2">
                    <div className="flex gap-1 text-amber-400">
                        {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                    <p>
                        <span className="font-bold text-slate-900 dark:text-white">4.9/5</span> rating from 500+ teams
                    </p>
                </div>
            </div>

            {/* Bottom: UI Visualization */}
            <div className="relative w-full max-w-5xl flex items-center justify-center">
                {/* Simulated Call Card - styled closer to dashboard UI */}
                <div className="relative w-full bg-[#1c1c1e] dark:bg-slate-900 rounded-t-[2rem] shadow-2xl border border-slate-800 p-6 md:p-8 animate-fade-in-up transition-transform hover:scale-[1.02] duration-500 overflow-hidden border-b-0 min-h-[400px]">
                    
                    {/* Header / Mockup Nav */}
                    <div className="flex justify-between items-center mb-12">
                        <div className="flex gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500"></div>
                           <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-1 max-w-md mx-8 hidden sm:block">
                            <div className="h-10 bg-[#2c2c2e] rounded-lg flex items-center px-4 text-slate-400 text-sm">
                                <Search size={16} className="mr-2" /> Search here...
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Bell size={18} className="text-slate-400" />
                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                            </div>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-[#1c1c1e] dark:border-slate-900 shadow-md">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Customer" className="w-full h-full" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-[#1c1c1e] dark:border-slate-900 rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{t('landing.demo.customer_name')}</h3>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <span className="px-2 py-0.5 rounded bg-slate-800">Support</span>
                                    <span>•</span>
                                    <span>00:42</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-red-900/30 text-red-500 text-xs font-bold uppercase rounded-full flex items-center gap-1.5 animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {t('landing.demo.recording')}
                        </div>
                    </div>

                    {/* Waveform */}
                    <div className="h-24 flex items-center justify-center gap-1.5 mb-8 opacity-70" dir="ltr">
                        {[...Array(60)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-white rounded-full animate-[bounce_1.2s_infinite]" 
                                style={{ 
                                    height: `${20 + Math.random() * 80}%`, 
                                    animationDelay: `${i * 0.05}s` 
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* AI Feedback Overlay */}
                    <div className="space-y-3 relative max-w-2xl mx-auto">
                        <div className="relative bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700 shadow-sm flex gap-4 transition-all hover:translate-x-1">
                            <div className="w-9 h-9 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0 z-10 ring-2 ring-slate-800">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">AI Coach</p>
                                <p className="text-sm font-medium text-slate-200">{t('landing.demo.feedback_good')}</p>
                            </div>
                        </div>

                        <div className="relative bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700 shadow-sm flex gap-4 transition-all hover:translate-x-1">
                            <div className="w-9 h-9 rounded-full bg-amber-900/50 text-amber-400 flex items-center justify-center shrink-0 z-10 ring-2 ring-slate-800">
                                <AlertCircle size={16} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">AI Coach</p>
                                <p className="text-sm font-medium text-slate-200">{t('landing.demo.feedback_bad')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="border-y border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-sm font-medium text-slate-500 mb-6">{t('landing.social_proof_text')}</p>
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-60 grayscale" dir="ltr">
                  <span className="text-xl font-serif font-black text-slate-800 dark:text-white">Acme Corp</span>
                  <span className="text-xl font-sans font-bold italic text-slate-700 dark:text-slate-200">GlobalBank</span>
                  <span className="text-xl font-mono font-semibold text-slate-600 dark:text-slate-300">stripe</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">UBER</span>
                  <span className="text-xl font-bold tracking-widest text-slate-700 dark:text-slate-200">LINEAR</span>
              </div>
          </div>
      </div>

      {/* Comparison Section (The Problem) */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  {t('landing.comparison.title_start')} <span className="text-red-500 decoration-4 underline decoration-wavy underline-offset-4">{t('landing.comparison.title_awkward')}</span>.
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {t('landing.comparison.subtitle')}
              </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Old Way */}
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-slate-500 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">☹️</div>
                      {t('landing.comparison.old_way')}
                  </h3>
                  <ul className="space-y-6">
                      {[1,2,3].map(i => (
                          <li key={i} className="flex items-start gap-4 text-slate-500">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                              <span className="text-lg">{t(`landing.comparison.old_list.${i}` as any)}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              {/* New Way */}
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-[#0500e2] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-[#0500e2] flex items-center justify-center">🚀</div>
                        {t('landing.comparison.new_way')}
                    </h3>
                    <ul className="space-y-6">
                        {[1,2,3].map(i => (
                            <li key={i} className="flex items-start gap-4 font-medium text-blue-50">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check size={14} strokeWidth={3} className="text-white" />
                                </div> 
                                <span className="text-lg">{t(`landing.comparison.new_list.${i}` as any)}</span>
                            </li>
                        ))}
                    </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* Scenarios Grid */}
      <section className="py-24 px-6 bg-[#f8faff] dark:bg-[#020617] border-y border-slate-200/50 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                  <div className="max-w-xl">
                      <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{t('landing.scenarios.title')}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-lg">
                          {t('landing.scenarios.subtitle')}
                      </p>
                  </div>
                  <button onClick={onSignupClick} className="group flex items-center gap-2 font-bold text-[#0500e2] hover:text-[#0400c0] transition-colors px-6 py-3 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md">
                      {t('landing.scenarios.cta')} 
                      <ArrowRight size={18} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                      { icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', title: t('landing.scenarios.card1.title'), desc: t('landing.scenarios.card1.desc') },
                      { icon: TrendingUp, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', title: t('landing.scenarios.card2.title'), desc: t('landing.scenarios.card2.desc') },
                      { icon: Shield, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', title: t('landing.scenarios.card3.title'), desc: t('landing.scenarios.card3.desc') },
                  ].map((card, i) => (
                      <div key={i} className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${card.color}`}>
                              <card.icon size={28} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                              {card.desc}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-50 dark:border-slate-800">
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span> {t('landing.scenarios.duration')}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Analytics Feature */}
      <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="order-2 lg:order-1 relative">
                  {/* Decorative Elements */}
                  <div className="absolute -left-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
                  <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
                  
                  {/* Mockup Card */}
                  <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 transform hover:scale-[1.01] transition-transform duration-700">
                      <div className="flex items-center justify-between mb-10">
                          <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#0500e2]">
                                    <BarChart3 size={24} />
                                </div>
                                {t('landing.analytics.mockup.title')}
                            </h4>
                          </div>
                          <div className="px-4 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-bold rounded-full border border-green-100 dark:border-green-900/30">
                              {t('landing.analytics.mockup.badge')}
                          </div>
                      </div>
                      
                      <div className="space-y-8">
                          {[
                              { label: t('landing.analytics.mockup.metric1'), val: 92, color: 'bg-green-500' },
                              { label: t('landing.analytics.mockup.metric2'), val: 88, color: 'bg-[#0500e2]' },
                              { label: t('landing.analytics.mockup.metric3'), val: 74, color: 'bg-amber-500' },
                          ].map((stat, i) => (
                              <div key={i}>
                                  <div className="flex justify-between text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                                      <span>{stat.label}</span>
                                      <span>{stat.val}%</span>
                                  </div>
                                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${stat.color} transition-all duration-1000 ease-out`} style={{ width: `${stat.val}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="order-1 lg:order-2">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                      {t('landing.analytics.title')}
                  </h2>
                  <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                      {t('landing.analytics.subtitle')}
                  </p>
                  <ul className="space-y-5 mb-12">
                      {[
                          t('landing.analytics.list.1'),
                          t('landing.analytics.list.2'),
                          t('landing.analytics.list.3')
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-slate-700 dark:text-slate-200 font-medium">
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0500e2] shrink-0 border border-blue-100 dark:border-blue-900/30">
                                  <Check size={16} strokeWidth={3} />
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
                  <button 
                    onClick={onSignupClick}
                    className="text-[#0500e2] font-bold text-lg hover:text-[#0400c0] flex items-center gap-2 group"
                  >
                      {t('landing.analytics.cta')} 
                      <ArrowRight size={20} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </button>
              </div>
          </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto bg-slate-900 dark:bg-white rounded-[3rem] px-8 py-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-slate-900/0 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-white dark:text-slate-900 mb-8 tracking-tight">
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
                  <p className="mt-8 text-sm font-medium text-slate-400 dark:text-slate-500">{t('landing.final_cta.note')}</p>
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
