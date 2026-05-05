
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Mic, Shield, Zap, TrendingUp, Phone, Check, X, MessageSquare, AlertCircle, BarChart3, Star, Search, Bell, ChevronDown, Edit2, MoreVertical, Link, ShieldCheck, ClipboardCheck, Brain, Bot, LineChart, Globe2, ListChecks, Target, Activity, Users, Blocks, Award } from 'lucide-react';
import { RevuIcon } from './RevuIcon';
import { User } from '../types';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { TidioLogo } from './TidioLogo';
import { AssemblyAILogo } from './AssemblyAILogo';
import { DeepgramLogo } from './DeepgramLogo';
import { WatiLogo } from './WatiLogo';
import { AlgoliaLogo } from './AlgoliaLogo';
import { CloseLogo } from './CloseLogo';
import { AiSdrLogoLight, AiSdrLogoDark } from './AiSdrLogo';
import { LiveChatLogo } from './LiveChatLogo';
import { MixpanelLogo } from './MixpanelLogo';
import { ApolloLogo } from './ApolloLogo';
import { LemlistLogo } from './LemlistLogo';
import { TrainualLogo } from './TrainualLogo';
import { InstantlyLogo } from './InstantlyLogo';
import { CloudflareLogo } from './CloudflareLogo';
import { CallHippoLogo } from './CallHippoLogo';
import { ReplyLogo } from './ReplyLogo';
import { EmergentLogo } from './EmergentLogo';

interface LandingPageProps {
  user?: User | null;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
  onRefundClick: () => void;
  onPartnersClick: () => void;
  onAboutClick: () => void;
  onCareersClick?: () => void;
  onContactClick?: () => void;
  onBlogClick?: () => void;
  onProductClick?: () => void;
  onFaqsClick?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, onLoginClick, onSignupClick, onPricingClick, onTermsClick, onPrivacyClick, onRefundClick, onPartnersClick, onAboutClick, onCareersClick, onContactClick, onBlogClick, onProductClick, onFaqsClick }) => {
  const { t, isRTL } = useLanguage();
  
  // Marquee Animation Logic
  const containerRef = React.useRef<HTMLDivElement>(null);
  const positionRef = React.useRef(0);
  const targetSpeedRef = React.useRef(0.5); // Normal speed
  const currentSpeedRef = React.useRef(0.5);
  const animationFrameRef = React.useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      // Smoothly interpolate current speed towards target speed
      // 0.05 is the smoothing factor (lower = smoother/slower reaction)
      currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.05;

      // Update position
      positionRef.current -= currentSpeedRef.current;

      if (containerRef.current) {
        const container = containerRef.current;
        // We assume the content is duplicated, so we reset when we scroll past half the width
        const scrollWidth = container.scrollWidth;
        const halfWidth = scrollWidth / 2;

        // Reset position for infinite loop effect
        if (Math.abs(positionRef.current) >= halfWidth) {
          positionRef.current = 0;
        }
        
        container.style.transform = `translateX(${positionRef.current}px)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    targetSpeedRef.current = 0; // Stop target
  };

  const handleMouseLeave = () => {
    targetSpeedRef.current = 0.5; // Resume speed
  };
  const [wordIndex, setWordIndex] = useState(0);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const rotatingWords = [
    t('landing.hero.words.0'),
    t('landing.hero.words.1'),
    t('landing.hero.words.2'),
    t('landing.hero.words.3'),
    t('landing.hero.words.4')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);
  
  return (
    <div 
      className={`min-h-screen bg-[#f8faff] dark:bg-[#020617] font-sans text-slate-900 dark:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      
      {/* Navigation */}
      <PublicNavigation 
        user={user}
        onLogin={onLoginClick}
        onSignup={onSignupClick}
        onPricing={onPricingClick}
        onLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onAbout={onAboutClick}
        onContact={onContactClick}
        onBlogClick={onBlogClick}
        onProductClick={onProductClick}
        activePage="landing"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden bg-[#f3f4f6] dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            
            {/* Left Side: Copy */}
            <div className="flex flex-col items-start text-start">
                <div className="mb-6">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#0500e2] uppercase bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                        {t('landing.hero.badge')}
                    </span>
                </div>
                <h1 
                    style={{ fontSize: '44px' }}
                    className="font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight flex flex-wrap gap-x-2"
                >
                    {[
                      t('landing.hero.phrase_1'),
                      t('landing.hero.phrase_2'),
                      t('landing.hero.phrase_3')
                    ].map((phrase, idx) => (
                      <motion.span 
                        key={idx}
                        animate={{ 
                          color: activePhraseIndex === idx ? '#0500e2' : 'inherit'
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {phrase}
                      </motion.span>
                    ))}
                </h1>

                <p 
                    style={{ fontSize: '18px' }}
                    className="text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-xl text-start"
                >
                    {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        onClick={user ? () => window.location.href = 'https://app.revuqai.com' : onSignupClick}
                        className="px-8 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg hover:bg-[#0400c0] transition-all flex items-center justify-center gap-4 group shadow-lg shadow-blue-500/20"
                    >
                        {user ? 'Go to Dashboard' : t('nav.get_started')} 
                        <div className="w-8 h-8 rounded-full bg-white text-[#0500e2] flex items-center justify-center group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                            <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                        </div>
                    </button>
                    {!user && (
                        <button 
                            onClick={onContactClick}
                            className="px-10 py-4 bg-transparent border-2 border-[#0500e2] text-[#0500e2] dark:text-blue-400 dark:border-blue-400 rounded-full font-bold text-lg hover:bg-[#0500e2] hover:text-white dark:hover:bg-blue-400 dark:hover:text-slate-900 transition-all"
                        >
                            Contact us
                        </button>
                    )}
                </div>
            </div>

            {/* Right Side: Visuals */}
            <div className="relative w-full mt-12 lg:mt-0 flex items-center justify-center px-4 sm:px-0">
                {/* Scenario Freedom Card */}
                <div className="relative w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-8 z-10 animate-fade-in-up border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6 sm:mb-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Scenario Freedom</h3>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise-Grade Simulations</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                            Active Deployments <ChevronDown size={14} />
                        </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                        {[
                            { 
                                title: 'Leadership Crisis Simulation', 
                                type: 'HR & Management Training', 
                                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
                                highlighted: true 
                            },
                            { 
                                title: 'Emergency Response Protocol', 
                                type: 'Public Safety & First Responders', 
                                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'
                            },
                            { 
                                title: 'Advanced Patient Diagnosis', 
                                type: 'Medical Education & Biotech', 
                                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
                            },
                        ].map((scenario, i) => (
                            <div 
                                key={i} 
                                className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl transition-all ${scenario.highlighted ? 'bg-[#fff9c4] dark:bg-yellow-900/30 ring-2 ring-yellow-400/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pe-2 sm:pe-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden shadow-md shrink-0">
                                        <img src={scenario.avatar} alt="Scenario lead" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">{scenario.title}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{scenario.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <div className="px-2 sm:px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-500/20">
                                        Custom
                                    </div>
                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><MoreVertical size={18} className="sm:w-5 sm:h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSignupClick}
                        className="mt-8 sm:mt-10 w-full py-3 sm:py-4 bg-[#0500e2] dark:bg-white text-white dark:text-slate-900 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 sm:gap-3 group"
                    >
                        {t('landing.scenario_freedom.cta')}
                        <ArrowRight size={16} className={`sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                    </motion.button>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="border-y border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex flex-col items-center justify-center gap-2 mb-8">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Trusted by top Businesses and Partners</p>
                <button onClick={onPartnersClick} className="text-xs font-medium text-[#0500e2] hover:underline">View all partners</button>
              </div>
              
              <div 
                  className="relative w-full overflow-hidden group py-4" 
                  dir="ltr"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleMouseEnter}
                  onTouchEnd={handleMouseLeave}
              >
                  <div 
                      ref={containerRef}
                      className="flex w-max"
                      style={{ willChange: 'transform' }}
                  >
                      {/* First Set */}
                      <div className="flex items-center gap-x-8 px-4 shrink-0">
                          {/* Cloudflare Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <CloudflareLogo className="w-[150px] h-auto dark:hidden" fill="black" />
                                <CloudflareLogo className="w-[150px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* ElevenLabs Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer" className="block dark:hidden">
                                <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs" style={{ width: '150px' }} />
                             </a>
                             <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer" className="hidden dark:block">
                                <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/cy7rxce8uki-IIElevenLabsGrants%201.webp" alt="ElevenLabs" style={{ width: '150px' }} />
                             </a>
                          </div>

                          {/* Tidio Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://affiliate.tidio.com/9xkyz0qoz9ls" target="_blank" rel="noopener noreferrer" className="block">
                                <TidioLogo className="w-[100px] h-auto dark:hidden" fill="#000B26" />
                                <TidioLogo className="w-[100px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* AssemblyAI Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <AssemblyAILogo className="w-[140px] h-auto dark:hidden" fill="#09032F" />
                                <AssemblyAILogo className="w-[140px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Deepgram Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://deepgram.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <DeepgramLogo className="w-[140px] h-auto dark:hidden" fill="black" />
                                <DeepgramLogo className="w-[140px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Algolia Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.algolia.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <AlgoliaLogo className="w-[130px] h-auto dark:hidden" fill="#003dff" />
                                <AlgoliaLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Close Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://refer.close.com/zlxjnul0pmti" target="_blank" rel="noopener noreferrer" className="block">
                                <CloseLogo className="w-[130px] h-auto dark:hidden" fill="black" />
                                <CloseLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* AiSdr Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://partner.aisdr.com/eaunie6ih0qb" target="_blank" rel="noopener noreferrer" className="block">
                                <AiSdrLogoLight className="w-[130px] h-auto dark:hidden" />
                                <AiSdrLogoDark className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* LiveChat Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.livechat.com/?a=vkKISurVg&utm_campaign=pp_livechat-default&utm_source=PP" target="_blank" rel="noopener noreferrer" className="block">
                                <LiveChatLogo className="w-[130px] h-auto dark:hidden" fill="#1B1B20" />
                                <LiveChatLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Mixpanel Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://mixpanel.com/home/" target="_blank" rel="noopener noreferrer" className="block">
                                <MixpanelLogo className="w-[130px] h-auto dark:hidden" fill="#7856FF" />
                                <MixpanelLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Apollo Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.apollo.io/lu68l2625bfq" target="_blank" rel="noopener noreferrer" className="block">
                                <ApolloLogo className="w-[130px] h-auto dark:hidden" fill="#1B1B20" />
                                <ApolloLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Lemlist Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.lemlist.com/om1pnwx0qp22" target="_blank" rel="noopener noreferrer" className="block">
                                <LemlistLogo className="w-[130px] h-auto dark:hidden" fill="#1D1D1B" />
                                <LemlistLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Trainual Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://start.trainual.com/5pc28cs7v3j9" target="_blank" rel="noopener noreferrer" className="block">
                                <TrainualLogo className="w-[130px] h-auto dark:hidden" fill="#5A26D8" />
                                <TrainualLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Instantly Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://refer.instantly.ai/ksddft8jgi65" target="_blank" rel="noopener noreferrer" className="block">
                                <InstantlyLogo className="w-[130px] h-auto dark:hidden" />
                                <InstantlyLogo className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* CallHippo Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://join.callhippo.com/88wju5vbplrf" target="_blank" rel="noopener noreferrer" className="block">
                                <CallHippoLogo className="w-[130px] h-auto dark:hidden" />
                                <CallHippoLogo className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* Reply Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.reply.io/mbu34hr353q4" target="_blank" rel="noopener noreferrer" className="block">
                                <ReplyLogo className="w-[130px] h-auto dark:hidden" />
                                <ReplyLogo className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* Emergent Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.emergent.sh/ba8fr8u0tg9h" target="_blank" rel="noopener noreferrer" className="block">
                                <EmergentLogo className="w-[130px] h-auto dark:hidden" fill="black" />
                                <EmergentLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>
                      </div>

                      {/* Duplicate Set */}
                      <div className="flex items-center gap-x-8 px-4 shrink-0">
                          {/* Cloudflare Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <CloudflareLogo className="w-[150px] h-auto dark:hidden" fill="black" />
                                <CloudflareLogo className="w-[150px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* ElevenLabs Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer" className="block dark:hidden">
                                <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs" style={{ width: '150px' }} />
                             </a>
                             <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer" className="hidden dark:block">
                                <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/cy7rxce8uki-IIElevenLabsGrants%201.webp" alt="ElevenLabs" style={{ width: '150px' }} />
                             </a>
                          </div>

                          {/* Tidio Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://affiliate.tidio.com/9xkyz0qoz9ls" target="_blank" rel="noopener noreferrer" className="block">
                                <TidioLogo className="w-[100px] h-auto dark:hidden" fill="#000B26" />
                                <TidioLogo className="w-[100px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* AssemblyAI Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <AssemblyAILogo className="w-[140px] h-auto dark:hidden" fill="#09032F" />
                                <AssemblyAILogo className="w-[140px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Deepgram Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://deepgram.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <DeepgramLogo className="w-[140px] h-auto dark:hidden" fill="black" />
                                <DeepgramLogo className="w-[140px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Algolia Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.algolia.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <AlgoliaLogo className="w-[130px] h-auto dark:hidden" fill="#003dff" />
                                <AlgoliaLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Close Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://refer.close.com/zlxjnul0pmti" target="_blank" rel="noopener noreferrer" className="block">
                                <CloseLogo className="w-[130px] h-auto dark:hidden" fill="black" />
                                <CloseLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* AiSdr Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://partner.aisdr.com/eaunie6ih0qb" target="_blank" rel="noopener noreferrer" className="block">
                                <AiSdrLogoLight className="w-[130px] h-auto dark:hidden" />
                                <AiSdrLogoDark className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* LiveChat Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://www.livechat.com/?a=vkKISurVg&utm_campaign=pp_livechat-default&utm_source=PP" target="_blank" rel="noopener noreferrer" className="block">
                                <LiveChatLogo className="w-[130px] h-auto dark:hidden" fill="#1B1B20" />
                                <LiveChatLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Mixpanel Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://mixpanel.com/home/" target="_blank" rel="noopener noreferrer" className="block">
                                <MixpanelLogo className="w-[130px] h-auto dark:hidden" fill="#7856FF" />
                                <MixpanelLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Apollo Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.apollo.io/lu68l2625bfq" target="_blank" rel="noopener noreferrer" className="block">
                                <ApolloLogo className="w-[130px] h-auto dark:hidden" fill="#1B1B20" />
                                <ApolloLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Lemlist Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.lemlist.com/om1pnwx0qp22" target="_blank" rel="noopener noreferrer" className="block">
                                <LemlistLogo className="w-[130px] h-auto dark:hidden" fill="#1D1D1B" />
                                <LemlistLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Trainual Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://start.trainual.com/5pc28cs7v3j9" target="_blank" rel="noopener noreferrer" className="block">
                                <TrainualLogo className="w-[130px] h-auto dark:hidden" fill="#5A26D8" />
                                <TrainualLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>

                          {/* Instantly Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://refer.instantly.ai/ksddft8jgi65" target="_blank" rel="noopener noreferrer" className="block">
                                <InstantlyLogo className="w-[130px] h-auto dark:hidden" />
                                <InstantlyLogo className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* CallHippo Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://join.callhippo.com/88wju5vbplrf" target="_blank" rel="noopener noreferrer" className="block">
                                <CallHippoLogo className="w-[130px] h-auto dark:hidden" />
                                <CallHippoLogo className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* Reply Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.reply.io/mbu34hr353q4" target="_blank" rel="noopener noreferrer" className="block">
                                <ReplyLogo className="w-[130px] h-auto dark:hidden" />
                                <ReplyLogo className="w-[130px] h-auto hidden dark:block" />
                             </a>
                          </div>

                          {/* Emergent Logo */}
                          <div className="opacity-100 hover:opacity-80 transition-opacity">
                             <a href="https://get.emergent.sh/ba8fr8u0tg9h" target="_blank" rel="noopener noreferrer" className="block">
                                <EmergentLogo className="w-[130px] h-auto dark:hidden" fill="black" />
                                <EmergentLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
                             </a>
                          </div>
                      </div>
                  </div>
                  
                  {/* Gradient Masks */}
                  <div className="pointer-events-none absolute inset-y-0 start-0 w-8 md:w-1/6 bg-gradient-to-r rtl:bg-gradient-to-l from-white dark:from-slate-900 to-transparent"></div>
                  <div className="pointer-events-none absolute inset-y-0 end-0 w-8 md:w-1/6 bg-gradient-to-l rtl:bg-gradient-to-r from-white dark:from-slate-900 to-transparent"></div>
              </div>
          </div>
      </div>

      {/* How Revu Works Section */}
      <section className="py-24 px-6 bg-[#f3f4f6]/30 dark:bg-slate-900/30">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">How Revu Works</h2>
                  <p className="text-[17px] text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      From connection to coaching, Revu automates your entire QA and training cycle.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                  {/* Decorative lines for desktop connecting cards */}
                  <div className="hidden lg:block absolute top-[15%] left-[5%] right-[5%] h-[2px] bg-blue-100 dark:bg-blue-900/20 -z-10 rounded-full"></div>
                  <div className="hidden lg:block absolute top-[65%] left-[5%] right-[5%] h-[2px] bg-blue-100 dark:bg-blue-900/20 -z-10 rounded-full"></div>

                  {[
                      { 
                          title: "1. Connect in minutes", 
                          desc: "Plug into Aircall, Twilio, Zendesk, and more. No migration, no IT project. You're live before the day ends.",
                          icon: Link,
                          delay: 0.1
                      },
                      { 
                          title: "2. Auto QA for every call", 
                          desc: "Revu scores 100% of calls in Arabic, English, or both, against your own QA criteria. No sampling. No blind spots.",
                          icon: ShieldCheck,
                          delay: 0.2
                      },
                      { 
                          title: "3. Agents get a precise breakdown", 
                          desc: "Not a manager's opinion. Not a quarterly review. Exact scores, exact moments, exact gaps, delivered instantly.",
                          icon: ClipboardCheck,
                          delay: 0.3
                      },
                      { 
                          title: "4. Data-based training scenarios", 
                          desc: "Based on each agent's real call performance, Revu identifies what they need to work on and loads the right roleplay scenarios automatically.",
                          icon: Brain,
                          delay: 0.4
                      },
                      { 
                          title: "5. Agents practice with AI Roleplay", 
                          desc: "Voice-based. Scenario-specific. Relentlessly realistic. Agents practice objections, escalations, and compliance scripts with an AI that pushes back, in Arabic, English, or both, until they're ready.",
                          icon: Bot,
                          delay: 0.5
                      },
                      { 
                          title: "6. Managers watch performance", 
                          desc: "The dashboard shows who's improving, who's stuck, and why, so every coaching conversation is targeted, not guesswork.",
                          icon: LineChart,
                          delay: 0.6
                      }
                  ].map((step, idx) => (
                      <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: step.delay, duration: 0.5 }}
                          className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative z-10"
                      >
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0500e2] dark:text-blue-400 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                              <step.icon size={26} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 leading-snug">{step.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                              {step.desc}
                          </p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* Visual Breaker */}
      <section className="py-16 bg-[#0500e2] overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent opacity-50"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  Stop sampling. Start scoring every call.
              </h2>
              <p className="text-blue-100/80 text-lg max-w-2xl mx-auto font-medium">
                  Revu turns silence into data, and data into deals.
              </p>
          </div>
      </section>

      {/* What You Can Do With Revu Section */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                      What You Can Do With Revu
                  </h2>
                  <p className="text-[17px] text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      Everything your team needs to stop losing deals to bad calls.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                      { 
                          title: "Automated QA Scoring", 
                          desc: "Score every single call automatically against your own rubric. No sampling, no bias, no backlog.",
                          icon: Award,
                          color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Multilingual Call Analysis", 
                          desc: "Built natively for MENA. Revu handles Arabic, English, French, and more, including mid-call language switching, with full accuracy across every conversation.",
                          icon: Globe2,
                          color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Custom Scorecard Builder", 
                          desc: "Define what good looks like for your team, compliance, tone, script adherence, sales technique. Revu scores to your standard.",
                          icon: ListChecks,
                          color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Real-Time Agent Feedback", 
                          desc: "Agents don't wait for a manager. They get a detailed breakdown the moment a call ends, what worked, what didn't, and why.",
                          icon: Zap,
                          color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "AI Roleplay Training", 
                          desc: "Practice before the real thing. Agents run live voice scenarios with an AI that pushes back, objects, and escalates just like real customers.",
                          icon: Bot,
                          color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Targeted Coaching Recommendations", 
                          desc: "Revu identifies each agent's weak spots and surfaces exactly what they need to work on, not generic training, personalized improvement.",
                          icon: Target,
                          color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Live Performance Dashboard", 
                          desc: "A single view of your entire team's quality metrics, trends, and risk flags, updated in real time, not end-of-month reports.",
                          icon: Activity,
                          color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Compliance Monitoring", 
                          desc: "Flag calls that miss required disclosures, scripts, or regulatory language, automatically, across 100% of volume.",
                          icon: ShieldCheck,
                          color: "text-red-600 bg-red-50 dark:bg-red-900/30",
                          layout: "col-span-1"
                      },
                      { 
                          title: "Team & Agent Benchmarking", 
                          desc: "Compare agent performance across teams, shifts, and campaigns. Identify your top performers and replicate what they do.",
                          icon: Users,
                          color: "text-teal-600 bg-teal-50 dark:bg-teal-900/30",
                          layout: "md:col-span-1 lg:col-span-2"
                      },
                      { 
                          title: "Native Integrations, Zero Setup", 
                          desc: "Connect to Aircall, Twilio, Zendesk, Freshworks, and more in minutes. No migration, no IT project, no disruption.",
                          icon: Blocks,
                          color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30",
                          layout: "md:col-span-1 lg:col-span-2 hover:bg-orange-50/50"
                      }
                  ].map((feat, idx) => (
                      <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05, duration: 0.4 }}
                          className={`p-8 rounded-[2rem] bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between ${feat.layout}`}
                      >
                          <div>
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm ${feat.color}`}>
                                  <feat.icon size={26} strokeWidth={2.5} />
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                                  {feat.title}
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-[15px]">
                                  {feat.desc}
                              </p>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* Thin Breaker */}
      <div className="max-w-7xl mx-auto px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0500e2] shadow-[0_0_10px_rgba(5,0,226,0.5)]"></div>
          </div>
      </div>

      {/* Comparison Section (The Problem) */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  {t('landing.comparison.title_start')} <span className="text-red-500 line-through decoration-[3px] decoration-red-500/30">{t('landing.comparison.title_awkward')}</span>.
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {t('landing.comparison.subtitle')}
              </p>
          </div>

          <div className="max-w-6xl mx-auto relative group/comparison">
              {/* Visual Divider (Breaker) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 hidden md:block z-10 -translate-x-1/2">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg z-20">
                      <div className="text-[10px] font-bold text-slate-400 tracking-tighter">VS</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                  {/* Old Way */}
                  <div className="p-8 md:p-12 lg:p-16 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between relative">
                      <div>
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-500 mb-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-lg">☹️</div>
                                {t('landing.comparison.old_way')}
                            </h3>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium ml-[52px]">
                                {t('landing.comparison.old_way_subtitle')}
                            </p>
                        </div>
                        <ul className="space-y-6">
                            {[1,2,3,4,5].map(i => (
                                <li key={i} className="flex items-start gap-4 text-slate-500">
                                    <div className="w-6 h-6 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <X size={14} strokeWidth={3} className="text-slate-400" />
                                    </div>
                                    <span className="text-lg">{t(`landing.comparison.old_list.${i}` as any)}</span>
                                </li>
                            ))}
                        </ul>
                      </div>
                  </div>

                  {/* New Way */}
                  <div className="p-8 md:p-12 lg:p-16 bg-[#0500e2] text-white relative overflow-hidden group flex flex-col justify-between">
                      {/* Background Decoration */}
                      <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                      
                      <div className="relative z-10">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white text-[#0500e2] flex items-center justify-center p-2">
                                    <RevuIcon className="w-full h-full text-[#0500e2]" />
                                </div>
                                {t('landing.comparison.new_way')}
                            </h3>
                            <p className="text-blue-200 text-sm font-medium ml-[52px]">
                                {t('landing.comparison.new_way_subtitle')}
                            </p>
                        </div>
                        <ul className="space-y-6">
                            {[1,2,3,4,5].map(i => (
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
          </div>
      </section>

      {/* Scenarios Grid */}
      <section className="py-24 px-6 bg-[#f8faff] dark:bg-[#020617] border-y border-slate-200/50 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                  <div className="max-w-xl text-start">
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
                  <div className="absolute -start-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
                  <div className="absolute -end-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
                  
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

              <div className="order-1 lg:order-2 text-start">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                      {t('landing.analytics.title')}
                  </h2>
                  <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-start">
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
      <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto bg-[#0500e2] dark:bg-white rounded-[2.5rem] px-8 py-14 md:py-16 md:px-16 text-center relative overflow-hidden shadow-2xl group">
              {/* Animated Background Decoration */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-colors duration-700"></div>
              
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 mx-auto">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ fontSize: '31px' }} 
                    className="font-bold text-white dark:text-slate-900 mb-4 tracking-tight leading-tight"
                  >
                      {t('landing.final_cta.title')}
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    style={{ fontSize: '17px' }}
                    className="text-blue-100 dark:text-slate-500 mb-10 opacity-90 mx-auto"
                  >
                      {t('landing.final_cta.subtitle')}
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col justify-center items-center gap-4"
                  >
                      <button 
                        onClick={onSignupClick}
                        className="px-10 py-4 bg-white text-[#0500e2] dark:bg-[#0500e2] dark:text-white rounded-xl font-bold text-lg hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] hover:-translate-y-1 transition-all flex items-center gap-3 group/btn"
                      >
                          {t('landing.final_cta.button')}
                          <ArrowRight size={20} className={`transition-transform group-hover/btn:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <p className="text-white/80 dark:text-slate-500 text-sm font-medium">
                        {t('landing.final_cta.footer_text')}
                      </p>
                  </motion.div>
              </div>
          </div>
      </section>

      <Footer 
        onTermsClick={onTermsClick} 
        onPrivacyClick={onPrivacyClick} 
        onRefundClick={onRefundClick}
        onPartnersClick={onPartnersClick}
        onAboutClick={onAboutClick}
        onContactClick={onContactClick}
        onBlogClick={onBlogClick}
        onProductClick={onProductClick}
        onCareersClick={onCareersClick}
        onPricingClick={onPricingClick}
        onFaqsClick={onFaqsClick}
      />
    </div>
  );
};
