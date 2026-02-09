
import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { RevuLogo } from './RevuLogo';

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
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

  // Always show background on auth pages to prevent overlapping issues
  const isAuthPage = activePage === 'login' || activePage === 'signup';
  const showBackground = scrolled || isAuthPage || isMenuOpen;

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          showBackground
            ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm py-4' 
            : 'bg-transparent py-6'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            {/* Logo */}
            <button 
                onClick={() => handleNavClick(onLanding)} 
                className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] cursor-pointer hover:opacity-80 transition-opacity relative z-[70]"
                aria-label="Go to Home"
            >
                <RevuLogo className="h-8 md:h-9 w-auto" />
            </button>
            
            {/* Desktop Nav Links - Always Visible */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                <button onClick={() => handleNavClick(onLanding)} className="hover:text-[#0500e2] dark:hover:text-white transition-colors">Features</button>
                <button onClick={() => handleNavClick(onLanding)} className="hover:text-[#0500e2] dark:hover:text-white transition-colors">How it works</button>
                <button onClick={() => handleNavClick(onPricing)} className={`hover:text-[#0500e2] dark:hover:text-white transition-colors ${activePage === 'pricing' ? 'text-[#0500e2] dark:text-white font-bold' : ''}`}>Pricing</button>
            </div>

            {/* Desktop Auth Buttons - Always Visible */}
            <div className="hidden lg:flex items-center gap-4">
                <button 
                    onClick={() => handleNavClick(onLogin)} 
                    className={`text-sm font-bold transition-colors ${
                        activePage === 'login' 
                        ? 'text-[#0500e2] dark:text-white cursor-default' 
                        : 'text-slate-700 dark:text-slate-200 hover:text-[#0500e2] dark:hover:text-white'
                    }`}
                >
                    Log in
                </button>
                
                <button 
                    onClick={() => handleNavClick(onSignup)}
                    className={`group px-5 py-2.5 text-sm font-bold rounded-full shadow-lg transition-all flex items-center gap-2 ${
                        activePage === 'signup'
                        ? 'bg-[#0400c0] text-white cursor-default shadow-none ring-2 ring-offset-2 ring-[#0400c0] dark:ring-offset-slate-900'
                        : 'bg-[#0500e2] text-white shadow-blue-600/20 hover:bg-[#0400c0] hover:shadow-blue-600/30 hover:-translate-y-0.5'
                    }`}
                >
                    Get Started <ArrowRight size={16} className={activePage === 'signup' ? '' : 'group-hover:translate-x-0.5 transition-transform'} />
                </button>
            </div>

            {/* Mobile Toggle */}
            <button 
                className="lg:hidden p-2 text-slate-900 dark:text-white relative z-[70]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
                aria-expanded={isMenuOpen}
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[55] bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out lg:hidden flex flex-col ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{ top: '0', paddingTop: '80px' }} // Ensure it starts below the top area visually
        aria-hidden={!isMenuOpen}
      >
            <div className="flex flex-col h-full px-6 pb-8 overflow-y-auto">
                <div className="flex-1 flex flex-col gap-6 text-2xl font-serif font-bold text-slate-900 dark:text-white mt-8">
                    <button onClick={() => handleNavClick(onLanding)} className="text-left hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">Features</button>
                    <button onClick={() => handleNavClick(onLanding)} className="text-left hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">How it works</button>
                    <button onClick={() => handleNavClick(onPricing)} className={`text-left hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4 ${activePage === 'pricing' ? 'text-[#0500e2]' : ''}`}>Pricing</button>
                </div>

                <div className="mt-auto space-y-4 mb-8">
                    <button 
                        onClick={() => handleNavClick(onLogin)} 
                        className={`w-full py-4 rounded-xl border-2 font-bold text-lg transition-colors ${
                            activePage === 'login'
                            ? 'border-[#0500e2] text-[#0500e2] bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        Log In
                    </button>
                    
                    <button 
                        onClick={() => handleNavClick(onSignup)} 
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-colors ${
                            activePage === 'signup'
                            ? 'bg-[#0400c0] text-white cursor-default shadow-none ring-2 ring-offset-2 ring-[#0400c0] dark:ring-offset-slate-900'
                            : 'bg-[#0500e2] text-white shadow-blue-600/20 hover:bg-[#0400c0]'
                        }`}
                    >
                        Get Started
                    </button>
                </div>
            </div>
      </div>
    </>
  );
};
