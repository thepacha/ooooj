
import React from 'react';
import { ArrowRight, Check, Zap, BarChart3, MessageSquare, ShieldCheck, Sparkles, PlayCircle } from 'lucide-react';
import { RevuLogo } from './RevuLogo';
import { PublicNavigation } from './PublicNavigation';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onPricingClick }) => {
  const { t, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-[#0500e2] selection:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}>
      
      {/* Navigation */}
      <PublicNavigation 
        onLogin={onLoginClick}
        onSignup={onSignupClick}
        onPricing={onPricingClick}
        onLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        activePage="landing"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] max-w-7xl pointer-events-none">
             <div className="absolute top-[-100px] left-[10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal dark:bg-blue-900/20 animate-pulse-slow"></div>
             <div className="absolute top-[100px] right-[10%] w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal dark:bg-purple-900/20 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-sm mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0500e2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0500e2]"></span>
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">{t('landing.hero.badge')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1] max-w-5xl mx-auto drop-shadow-sm">
                {t('landing.hero.title_start')} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0500e2] to-violet-600">{t('landing.hero.title_end')}</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <button 
                    onClick={onSignupClick}
                    className="w-full sm:w-auto px-8 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg shadow-xl shadow-blue-600/30 hover:bg-[#0400c0] hover:scale-105 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2"
                >
                    {t('landing.cta.start')}
                </button>
                <button 
                    onClick={onLoginClick}
                    className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                >
                    <PlayCircle size={20} className="text-slate-400 group-hover:text-[#0500e2] transition-colors" /> {t('landing.cta.demo')}
                </button>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative max-w-6xl mx-auto perspective-1000 group" dir="ltr">
                {/* Keep dashboard mockup always LTR for now as it simulates a generic interface, or force LTR to avoid breaking absolute positioning unless redesigned */}
                {/* Glow under the dashboard */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-slate-900 rounded-[1.5rem] border border-slate-800 shadow-2xl overflow-hidden transform transition-all duration-700 hover:rotate-x-2 hover:scale-[1.01]">
                    {/* Browser Toolbar */}
                    <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <div className="flex-1 max-w-xl mx-auto bg-slate-900 rounded-lg px-3 py-1.5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono border border-slate-800">
                             <ShieldCheck size={12} /> https://app.revuqa.ai/dashboard
                        </div>
                    </div>

                    {/* Mock Content */}
                    <div className="grid grid-cols-12 h-[400px] md:h-[600px] bg-slate-50 dark:bg-slate-900/50">
                        {/* Sidebar */}
                        <div className="hidden md:flex col-span-2 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex-col gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0500e2] mb-4"></div>
                            <div className="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800/50"></div>
                            <div className="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800/50"></div>
                            <div className="w-full h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-[#0500e2]"></div>
                            <div className="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800/50"></div>
                        </div>

                        {/* Main View */}
                        <div className="col-span-12 md:col-span-10 p-6 md:p-8 overflow-hidden relative">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
                                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {[1,2,3].map(i => (
                                    <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900 mb-4"></div>
                                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
                                        <div className="h-4 w-16 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm h-64 p-6 relative">
                                <div className="absolute bottom-0 left-0 right-0 h-48 px-6 flex items-end justify-between gap-2 md:gap-4">
                                     {[35, 55, 45, 70, 60, 75, 50, 65, 80, 75, 90, 85].map((h, i) => (
                                        <div key={i} className="w-full bg-blue-50 dark:bg-slate-900 rounded-t-sm relative overflow-hidden h-full group-hover:h-full transition-all">
                                            <div 
                                                className="absolute bottom-0 w-full bg-[#0500e2] rounded-t-sm transition-all duration-1000 ease-out" 
                                                style={{ height: `${h}%`, opacity: 0.8 }}
                                            ></div>
                                        </div>
                                     ))}
                                </div>
                            </div>
                            
                            {/* Floating Popups */}
                            <div className="absolute top-1/4 right-10 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-float hidden md:block z-10">
                                <div className="flex gap-3 items-center">
                                    <div className="bg-green-100 text-green-600 p-1.5 rounded-lg"><Check size={14} strokeWidth={3}/></div>
                                    <div className="text-xs font-bold dark:text-white">Transcript Analyzed</div>
                                </div>
                            </div>
                            
                             <div className="absolute bottom-20 left-10 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-float hidden md:block z-10" style={{animationDelay: '1.5s'}}>
                                <div className="flex gap-3 items-center">
                                    <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg"><Sparkles size={14}/></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Coach Suggestion</div>
                                        <div className="text-xs font-bold dark:text-white">"Show more empathy here"</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">{t('landing.social_proof')}</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-60 hover:opacity-100 transition-opacity duration-500" dir="ltr">
                <div className="flex items-center gap-2 text-xl font-bold font-sans"><div className="w-6 h-6 bg-slate-800 dark:bg-white rounded-md"></div>Acme Corp</div>
                <div className="flex items-center gap-2 text-xl font-serif font-black"><span className="text-2xl">M</span> MonoSpace</div>
                <div className="flex items-center gap-2 text-xl font-sans font-bold italic tracking-tighter">intercom</div>
                <div className="flex items-center gap-2 text-xl font-mono font-semibold">stripe</div>
                <div className="flex items-center gap-2 text-xl font-sans font-bold">Linear</div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6 whitespace-pre-line">{t('landing.features.title')}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">{t('landing.features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
                
                {/* Feature 1: Large Card */}
                <div className="md:col-span-2 row-span-2 bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all">
                    <div className="relative z-10 max-w-md">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#0500e2] mb-6">
                            <BarChart3 size={28} />
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-4 whitespace-pre-line">{t('landing.feature1.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                            {t('landing.feature1.desc')}
                        </p>
                        <div className="flex flex-col gap-3">
                            {[
                                t('landing.feature1.list1'), 
                                t('landing.feature1.list2'), 
                                t('landing.feature1.list3')
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs shrink-0"><Check size={12} strokeWidth={3}/></div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Abstract Visual */}
                    <div className="absolute top-1/2 -right-20 md:-right-10 rtl:-left-20 rtl:md:-left-10 rtl:right-auto w-[400px] h-[400px] bg-slate-50 dark:bg-slate-900 rounded-full border-[30px] border-slate-100 dark:border-slate-800/50 flex items-center justify-center transform -translate-y-1/2 group-hover:scale-105 transition-transform duration-700">
                        <div className="w-[250px] h-[250px] bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner relative overflow-hidden">
                             <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,#0500e2_360deg)] opacity-20 animate-spin-slow"></div>
                             <div className="text-center z-10">
                                 <div className="text-5xl font-bold text-[#0500e2]">100%</div>
                                 <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Coverage</div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2: Coaching */}
                <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">{t('landing.feature2.title')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('landing.feature2.desc')}</p>
                        
                        {/* Chat Bubbles Visual - Force LTR for consistency in example or translate content? Keeping simple for now. */}
                        <div className="space-y-3 mt-8" dir="ltr">
                            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none w-[90%] text-xs text-slate-500">
                                "Sorry, we can't do that."
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl rounded-tr-none w-[90%] ml-auto text-xs text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50 shadow-sm transform group-hover:-translate-y-1 transition-transform">
                                <span className="font-bold block mb-1">Better:</span>
                                "I wish I could help, but due to policy..."
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 3: Fast Setup */}
                <div className="bg-[#0500e2] rounded-[2.5rem] p-8 border border-blue-700 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden group flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2">{t('landing.feature3.title')}</h3>
                        <p className="text-blue-100 text-sm">{t('landing.feature3.desc')}</p>
                    </div>
                    
                    <button onClick={onSignupClick} className="relative z-10 mt-8 w-fit flex items-center gap-2 text-sm font-bold border-b border-white/30 pb-0.5 hover:border-white transition-colors">
                        {t('landing.feature3.cta')} <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
                    </button>

                    <div className="absolute -bottom-12 -right-12 rtl:-left-12 rtl:right-auto w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                </div>

            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 pt-20 pb-10 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-6">
                        <RevuLogo className="h-6 w-auto" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mb-6">
                        {t('landing.footer.desc')}
                    </p>
                    <div className="flex gap-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#0500e2] hover:text-white transition-colors cursor-pointer">
                                <ArrowRight size={14} className={isRTL ? "-rotate-135" : "-rotate-45"} />
                            </div>
                        ))}
                    </div>
                </div>
                
                {[
                    { key: 'product', label: t('landing.footer.product') }, 
                    { key: 'company', label: t('landing.footer.company') }, 
                    { key: 'resources', label: t('landing.footer.resources') }, 
                    { key: 'legal', label: t('landing.footer.legal') }
                ].map((col, i) => (
                    <div key={i}>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{col.label}</h4>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            {[1,2,3,4].map(item => (
                                <li key={item}><a href="#" className="hover:text-[#0500e2] transition-colors">Link Item {item}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>&copy; 2026 RevuQA AI Inc. {t('landing.footer.rights')}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('landing.footer.status')}
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
