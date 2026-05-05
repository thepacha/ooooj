import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Users, Heart, Sparkles, Send } from 'lucide-react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';

interface CareersProps {
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
  onBack: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onRefundClick?: () => void;
  onPartnersClick?: () => void;
  onContactClick?: () => void;
  onBlogClick?: () => void;
  onAboutClick?: () => void;
  onProductClick?: () => void;
  onCareersClick?: () => void;
  onFaqsClick?: () => void;
}

export const Careers: React.FC<CareersProps> = ({ 
  onLogin, 
  onSignup, 
  onPricing, 
  onBack,
  onTermsClick,
  onPrivacyClick,
  onRefundClick,
  onPartnersClick,
  onContactClick,
  onBlogClick,
  onAboutClick,
  onProductClick,
  onCareersClick,
  onFaqsClick
}) => {
  const { isRTL } = useLanguage();

  return (
    <div 
      className={`min-h-screen bg-[#f8faff] dark:bg-[#020617] font-sans text-slate-900 dark:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <PublicNavigation 
        onLogin={onLogin}
        onSignup={onSignup}
        onPricing={onPricing}
        onLanding={onBack}
        onAbout={onAboutClick}
        onContact={onContactClick}
        onBlogClick={onBlogClick}
        onProductClick={onProductClick}
        activePage="careers"
      />

      <main className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0500e2]/10 text-[#0500e2] dark:text-[#4b53fa] font-medium text-sm mb-6">
              <Rocket size={16} />
              <span>We're growing fast!</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              Join the Future of <span className="text-[#0500e2] dark:text-[#4b53fa]">AI-Powered</span> Teams
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              We're building the next generation of quality assurance and training tools. Be part of a mission-driven team dedicated to human-centric AI innovation.
            </p>
          </motion.div>
        </div>

        {/* Hiring Soon Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden mb-20 text-center"
        >
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0500e2]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Hiring Very Soon
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              We're hard at work building something amazing and while we don't have open roles at this exact moment, we're expanding our teams across engineering, design, and growth very shortly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onContactClick}
                className="w-full sm:w-auto px-8 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg hover:bg-[#0400c0] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
              >
                Send Us Your Resume
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button 
                onClick={onAboutClick}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-full font-bold text-lg hover:border-[#0500e2] dark:hover:border-[#4b53fa] transition-all"
              >
                Learn More About Us
              </button>
            </div>
            
            <p className="mt-8 text-sm text-slate-400 italic">
              * Bookmark this page or reach out to mohamed@revuqai.com to be the first to know when we launch our careers portal.
            </p>
          </div>
        </motion.div>

        {/* Why Join Us */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="p-8 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 hover:border-[#0500e2]/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0500e2] dark:text-[#4b53fa] mb-6 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">People First</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We believe in building a team that's as diverse and innovative as the technology we create. Your growth is our growth.
            </p>
          </div>
          <div className="p-8 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 hover:border-[#0500e2]/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Radical Empathy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We build tools for human interactions. Our culture is rooted in understanding our users and each other.
            </p>
          </div>
          <div className="p-8 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 hover:border-[#0500e2]/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Innovation Lab</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We don't just use AI; we push its boundaries. Join us if you love solving complex problems with cutting-edge tech.
            </p>
          </div>
        </div>

        {/* Culture Section */}
        <div className="bg-slate-900 dark:bg-[#0a0a0a] rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4b53fa,transparent_70%)]" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">Our Remote-First Culture</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#0500e2] flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Work From Anywhere</h4>
                    <p className="text-slate-300">We care about what you do, not where you sit. Our team spans multiple time zones.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#0500e2] flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Async-First Workflow</h4>
                    <p className="text-slate-300">Fewer meetings, more doing. We optimize for deep work and clear documentation.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#0500e2] flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Company Gatherings</h4>
                    <p className="text-slate-300">We may be remote, but we value connection. We organize regular team retreats globally.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-slate-800 border border-slate-700 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0500e2]/20 to-transparent" />
                <div className="p-8 h-full flex flex-col justify-end">
                  <p className="text-2xl font-serif italic mb-4 leading-relaxed">
                    "Building RevuQA is about more than just code. It's about empowering people to perform at their best."
                  </p>
                  <p className="font-bold text-slate-400">— Mohamed, Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
        onPricingClick={onPricing}
        onHomeClick={onBack}
        onFaqsClick={onFaqsClick}
      />
    </div>
  );
};
