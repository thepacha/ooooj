
import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Globe } from 'lucide-react';
import { RevuLogo } from './RevuLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicNavigationProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onPricing?: () => void;
  onLanding?: () => void;
  activePage?: 'landing' | 'pricing' | 'login' | 'signup' | 'partners';
}

export const PublicNavigation: React.FC<PublicNavigationProps> = ({ 
  onLogin, 
  onSignup, 
  onPricing, 
  onLanding, 
  activePage = 'landing' 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, language, setLanguage, isRTL } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleNavClick = (action?: () => void) => {
    setIsMenuOpen(false);
    if (action) action();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // Ensure consistent background on auth pages or when scrolled
  const isAuthPage = activePage === 'login' || activePage === 'signup';
  const showBackground = scrolled || isAuthPage || isMenuOpen;

  return (
    <>
      <nav 
        className={`fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 top-6 w-[calc(100%-2rem)] max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-full py-2.5 px-3`}
        aria-label="Main Navigation"
      >
        <div className="flex justify-between items-center w-full">
            {/* Logo */}
            <button 
                onClick={() => handleNavClick(onLanding)} 
                className="flex items-center gap-2 text-slate-900 dark:text-white cursor-pointer hover:opacity-90 transition-opacity relative z-[70] pl-3"
                aria-label="Go to Home"
            >
                <RevuLogo className="h-6 md:h-7 w-auto" />
            </button>
            
            {/* Desktop Nav Links - Clean & Simple */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-900 dark:text-slate-200">
                <button onClick={() => handleNavClick(onLanding)} className="hover:text-[#0500e2] transition-colors">About</button>
                <button onClick={() => handleNavClick(onLanding)} className="hover:text-[#0500e2] transition-colors">Features</button>
                <button onClick={() => handleNavClick(onPricing)} className={`hover:text-[#0500e2] transition-colors ${activePage === 'pricing' ? 'text-[#0500e2]' : ''}`}>Pricing</button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3 pr-1">
                <button 
                    onClick={toggleLanguage}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase mr-2"
                    title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                >
                    <Globe size={16} />
                </button>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleNavClick(onLogin)} 
                        className={`text-sm font-medium transition-colors px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${
                            activePage === 'login' 
                            ? 'text-slate-900 dark:text-white cursor-default bg-slate-100 dark:bg-slate-800' 
                            : 'text-slate-900 dark:text-slate-200'
                        }`}
                    >
                        {t('nav.login')}
                    </button>
                    
                    <button 
                        onClick={() => handleNavClick(onSignup)}
                        className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all flex items-center gap-2 ${
                            activePage === 'signup'
                            ? 'bg-[#0500e2] dark:bg-white text-white dark:text-slate-900 cursor-default'
                            : 'bg-[#0500e2] dark:bg-white text-white dark:text-slate-900 hover:scale-105'
                        }`}
                    >
                        {t('nav.get_started')}
                        <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                </div>
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center gap-4 lg:hidden relative z-[70] pr-2">
                <button 
                    onClick={toggleLanguage}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                    <Globe size={20} />
                </button>
                <button 
                    className="text-slate-900 dark:text-white p-1"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
                    aria-expanded={isMenuOpen}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[55] bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out lg:hidden flex flex-col ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{ top: '0', paddingTop: '80px' }}
        aria-hidden={!isMenuOpen}
      >
            <div className="flex flex-col h-full px-6 pb-10 overflow-y-auto">
                <div className="flex-1 flex flex-col gap-6 text-xl font-bold text-slate-900 dark:text-white mt-8">
                    <button onClick={() => handleNavClick(onLanding)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">{t('nav.features')}</button>
                    <button onClick={() => handleNavClick(onLanding)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">{t('nav.how_it_works')}</button>
                    <button onClick={() => handleNavClick(onPricing)} className={`text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4 ${activePage === 'pricing' ? 'text-[#0500e2]' : ''}`}>{t('nav.pricing')}</button>
                </div>

                <div className="mt-auto space-y-4">
                    <button 
                        onClick={() => handleNavClick(onLogin)} 
                        className={`w-full py-3.5 rounded-xl border-2 font-bold text-lg transition-colors ${
                            activePage === 'login'
                            ? 'border-[#0500e2] text-[#0500e2] bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {t('nav.login')}
                    </button>
                    
                    <button 
                        onClick={() => handleNavClick(onSignup)} 
                        className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-xl transition-colors ${
                            activePage === 'signup'
                            ? 'bg-[#0400c0] text-white cursor-default'
                            : 'bg-[#0500e2] text-white hover:bg-[#0400c0]'
                        }`}
                    >
                        {t('nav.get_started')}
                    </button>
                </div>
            </div>
      </div>
    </>
  );
};
