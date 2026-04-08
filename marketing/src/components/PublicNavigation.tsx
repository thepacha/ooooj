"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Globe } from 'lucide-react';
import { RevuLogo } from './RevuLogo';

export const PublicNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <>
      <nav 
        className={`fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 top-6 w-[calc(100%-2rem)] max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-full py-2.5 px-3`}
        aria-label="Main Navigation"
      >
        <div className="flex justify-between items-center w-full">
            <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white cursor-pointer hover:opacity-90 transition-opacity relative z-[70] ps-3">
                <RevuLogo className="h-6 md:h-7 w-auto" />
            </Link>
            
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-900 dark:text-slate-200">
                <Link href="/" className="hover:text-[#0500e2] transition-colors">About</Link>
                <Link href="/" className="hover:text-[#0500e2] transition-colors">Features</Link>
                <Link href="/pricing" className="hover:text-[#0500e2] transition-colors">Pricing</Link>
            </div>

            <div className="hidden lg:flex items-center gap-3 pe-1">
                <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase me-2">
                    <Globe size={16} />
                </button>

                <div className="flex items-center gap-2">
                    <a href="https://ais-dev-i3rbxweh47euyezi3wnvsb-312452967229.europe-west2.run.app" className="text-sm font-medium transition-colors px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200">
                        Login
                    </a>
                    
                    <a href="https://ais-dev-i3rbxweh47euyezi3wnvsb-312452967229.europe-west2.run.app" className="px-5 py-2.5 text-sm font-medium rounded-full transition-all flex items-center gap-2 bg-[#0500e2] dark:bg-white text-white dark:text-slate-900 hover:scale-105">
                        Get Started
                        <ArrowRight size={16} />
                    </a>
                </div>
            </div>

            <div className="flex items-center gap-4 lg:hidden relative z-[70] pe-2">
                <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <Globe size={20} />
                </button>
                <button 
                    className="text-slate-900 dark:text-white p-1"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
      </nav>

      <div 
        className={`fixed inset-0 z-[55] bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out lg:hidden flex flex-col ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{ top: '0', paddingTop: '80px' }}
      >
            <div className="flex flex-col h-full px-6 pb-10 overflow-y-auto">
                <div className="flex-1 flex flex-col gap-6 text-xl font-bold text-slate-900 dark:text-white mt-8">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">Features</Link>
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">How it works</Link>
                    <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="text-start hover:text-[#0500e2] transition-colors border-b border-slate-100 dark:border-slate-800 pb-4">Pricing</Link>
                </div>

                <div className="mt-auto space-y-4">
                    <a href="https://ais-dev-i3rbxweh47euyezi3wnvsb-312452967229.europe-west2.run.app" className="block text-center w-full py-3.5 rounded-xl border-2 font-bold text-lg transition-colors border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
                        Login
                    </a>
                    
                    <a href="https://ais-dev-i3rbxweh47euyezi3wnvsb-312452967229.europe-west2.run.app" className="block text-center w-full py-3.5 rounded-xl font-bold text-lg shadow-xl transition-colors bg-[#0500e2] text-white hover:bg-[#0400c0]">
                        Get Started
                    </a>
                </div>
            </div>
      </div>
    </>
  );
};
