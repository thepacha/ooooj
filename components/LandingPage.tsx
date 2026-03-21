
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Mic, Shield, Zap, TrendingUp, Phone, Check, MessageSquare, AlertCircle, BarChart3, Star, Search, Bell, ChevronDown, Edit2, MoreVertical } from 'lucide-react';
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
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
  onRefundClick: () => void;
  onPartnersClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onPricingClick, onTermsClick, onPrivacyClick, onRefundClick, onPartnersClick }) => {
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
    <div 
      className={`min-h-screen bg-[#f8faff] dark:bg-[#020617] font-sans text-slate-900 dark:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      
      {/* Navigation */}
      <PublicNavigation 
        onLogin={onLoginClick}
        onSignup={onSignupClick}
        onPricing={onPricingClick}
        onLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight uppercase">
                    {t('landing.hero.prefix')}
                </h1>

                <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-xl text-start">
                    {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        onClick={onSignupClick}
                        className="px-8 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg hover:bg-[#0400c0] transition-all flex items-center justify-center gap-4 group shadow-lg shadow-blue-500/20"
                    >
                        {t('nav.get_started')} 
                        <div className="w-8 h-8 rounded-full bg-white text-[#0500e2] flex items-center justify-center group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                            <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                        </div>
                    </button>
                    <button 
                        onClick={onLoginClick}
                        className="px-10 py-4 bg-transparent border-2 border-[#0500e2] text-[#0500e2] dark:text-blue-400 dark:border-blue-400 rounded-full font-bold text-lg hover:bg-[#0500e2] hover:text-white dark:hover:bg-blue-400 dark:hover:text-slate-900 transition-all"
                    >
                        Contact us
                    </button>
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
                  <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                  
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
      <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto bg-[#0500e2] dark:bg-white rounded-[3rem] px-8 py-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-slate-900/0 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-white dark:text-slate-900 mb-8 tracking-tight">
                      {t('landing.final_cta.title')}
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button 
                        onClick={onSignupClick}
                        className="px-10 py-5 bg-white text-[#0500e2] dark:bg-[#0500e2] dark:text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform shadow-lg shadow-blue-500/30"
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
        onPartnersClick={onPartnersClick}
      />
    </div>
  );
};
