import React from 'react';
import { motion } from 'motion/react';
import { Linkedin, Mail } from 'lucide-react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutUsProps {
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
  onBack: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onRefundClick?: () => void;
  onPartnersClick?: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ 
  onLogin, 
  onSignup, 
  onPricing, 
  onBack,
  onTermsClick,
  onPrivacyClick,
  onRefundClick,
  onPartnersClick
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
        onAbout={() => {}}
        activePage="about"
      />

      <main className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
            About Us
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
              We are on a mission to revolutionize how businesses evaluate and improve their customer interactions. By leveraging advanced AI, we provide deep insights that were previously impossible to capture at scale.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Our Vision</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  To empower every organization with the tools they need to deliver exceptional customer experiences, driven by objective, AI-powered analysis and actionable feedback.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Our Values</h2>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="text-[#0500e2] font-bold">•</span>
                    Innovation in AI and Machine Learning
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0500e2] font-bold">•</span>
                    Commitment to Data Privacy and Security
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0500e2] font-bold">•</span>
                    Customer-Centric Product Development
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0500e2] font-bold">•</span>
                    Transparency and Trust
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Our Team</h2>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  <img 
                    src="/mohamed_ibrahim.jpeg" 
                    alt="Mohamed Ibrahim" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('/public/')) {
                        if (target.src.endsWith('.jpeg')) {
                          target.src = target.src.replace('.jpeg', '.jpg');
                        }
                        return;
                      }
                      target.src = '/public/mohamed_ibrahim.jpeg';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Mohamed Ibrahim</h3>
                      <p className="text-[#0500e2] dark:text-[#4b53fa] font-medium">Founder</p>
                    </div>
                    <a 
                      href="https://www.linkedin.com/in/iampachai/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-500 hover:text-[#0077b5] transition-colors"
                    >
                      <Linkedin size={20} />
                      <span className="text-sm font-medium">LinkedIn Profile</span>
                    </a>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    AI SaaS builder and Web3 BD with experience in partnerships and growth across multiple ecosystems. Currently building Revu, an AI platform for training customer service and sales teams through realistic roleplay simulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Contact Us</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Have questions or want to learn more about how Revu can help your team? We'd love to hear from you.
              </p>
              <a 
                href="mailto:mohamed@revuqai.com" 
                className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white hover:border-[#0500e2] dark:hover:border-[#4b53fa] hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-all shadow-sm"
              >
                <Mail size={20} />
                <span className="font-medium">mohamed@revuqai.com</span>
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white text-center">Join Our Journey</h2>
              <p className="text-center text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                We're building the future of quality assurance and team training. Discover how our platform can transform your operations today.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={onSignup}
                  className="px-8 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg hover:bg-[#0400c0] transition-all shadow-lg shadow-blue-500/20"
                >
                  Get Started Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer 
        onTermsClick={onTermsClick} 
        onPrivacyClick={onPrivacyClick} 
        onRefundClick={onRefundClick}
        onPartnersClick={onPartnersClick}
        onAboutClick={() => {}}
      />
    </div>
  );
};
