
import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Globe } from 'lucide-react';
import { RevuLogo } from './RevuLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicNavigationProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onPricing?: () => void;
  onLanding?: () => void;
  activePage?: 'landing' | 'pricing' | 'login' | 'signup';
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
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          showBackground
            ? 'bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-sm py-4' 
            : 'bg-transparent py-6'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            {/* Logo */}
            <button 
                onClick={() => handleNavClick(onLanding)} 
                className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] cursor-pointer hover:opacity-90 transition-opacity relative z-[70]"
                aria-label="Go to Home"
            >
                <RevuLogo className="h-8 md:h-9 w-auto" />
            </button>
            
            {/* Desktop Nav Links - Clean & Simple */}
            <div className="hidden lg:flex items-center gap-10 text-sm font-bold text-slate-600 dark:text-slate-300">
                <button onClick={() => handleNavClick(onLanding)} className="hover:text-[#0500e2] dark:hover:text-white transition-colors">{t('nav.features')}</button>
                <button onClick={() => handleNavClick(onLanding)} className="hover:text-[#0500e2] dark:hover:text-white transition-colors">{t('nav.how_it_works')}</button>
                <button onClick={() => handleNavClick(onPricing)} className={`hover:text-[#0500e2] dark:hover:text-white transition-colors ${activePage === 'pricing' ? 'text-[#0500e2] dark:text-white' : ''}`}>{t('nav.pricing')}</button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-6">
                <button 
                    onClick={toggleLanguage}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase"
                    title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                >
                    <Globe size={16} />
                    {language}
                </button>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleNavClick(onLogin)} 
                        className={`text-sm font-bold transition-colors ${
                            activePage === 'login' 
                            ? 'text-[#0500e2] dark:text-white cursor-default' 
                            : 'text-slate-700 dark:text-slate-200 hover:text-[#0500e2] dark:hover:text-white'
                        }`}
                    >
                        {t('nav.login')}
                    </button>
                    
                    <button 
                        onClick={() => handleNavClick(onSignup)}
                        className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
                            activePage === 'signup'
                            ? 'bg-[#0400c0] text-white cursor-default'
                            : 'bg-[#0500e2] text-white hover:bg-[#0400c0] hover:shadow-lg hover:-translate-y-0.5'
                        }`}
                    >
                        {t('nav.get_started')} 
                    </button>
                </div>
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center gap-5 lg:hidden relative z-[70]">
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
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
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
                <div className="flex-1 flex flex-col gap-8 text-2xl font-bold text-slate-900 dark:text-white mt-10">
                    <button onClick={() => handleNavClick(onLanding)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">{t('nav.features')}</button>
                    <button onClick={() => handleNavClick(onLanding)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">{t('nav.how_it_works')}</button>
                    <button onClick={() => handleNavClick(onPricing)} className={`text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4 ${activePage === 'pricing' ? 'text-[#0500e2]' : ''}`}>{t('nav.pricing')}</button>
                </div>

                <div className="mt-auto space-y-4">
                    <button 
                        onClick={() => handleNavClick(onLogin)} 
                        className={`w-full py-4 rounded-xl border-2 font-bold text-lg transition-colors ${
                            activePage === 'login'
                            ? 'border-[#0500e2] text-[#0500e2] bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {t('nav.login')}
                    </button>
                    
                    <button 
                        onClick={() => handleNavClick(onSignup)} 
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-colors ${
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
