
import React from 'react';
import { RevuLogo } from './RevuLogo';
import { useLanguage } from '../contexts/LanguageContext';
import { Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';

interface FooterProps {
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onRefundClick?: () => void;
  onPartnersClick?: () => void;
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onBlogClick?: () => void;
  onHomeClick?: () => void;
  onPricingClick?: () => void;
  onProductClick?: () => void;
  onCareersClick?: () => void;
  onFaqsClick?: () => void;
  onFeaturesClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onTermsClick, 
  onPrivacyClick, 
  onRefundClick, 
  onPartnersClick, 
  onAboutClick, 
  onContactClick, 
  onBlogClick, 
  onHomeClick, 
  onPricingClick, 
  onProductClick, 
  onCareersClick, 
  onFaqsClick,
  onFeaturesClick
}) => {
  const { t } = useLanguage();

  return (
      <footer className="bg-[#fafbfc] dark:bg-[#0a0a0a] pt-20 pb-10 px-6 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0500e2]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-6">
                        <RevuLogo className="h-6 w-auto" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
                        {t('landing.footer.desc')}
                    </p>
                    <div className="flex items-center gap-3 mt-8">
                        <a 
                            href="https://www.linkedin.com/company/revuqai" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm"
                            aria-label="LinkedIn"
                        >
                            <Linkedin size={20} />
                        </a>
                        <a 
                            href="https://x.com/revuqai1" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-black hover:border-black hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm"
                            aria-label="X (Twitter)"
                        >
                            <Twitter size={20} />
                        </a>
                        <a 
                            href="#" 
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-[#1877f2] hover:border-[#1877f2] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm"
                            aria-label="Facebook"
                        >
                            <Facebook size={20} />
                        </a>
                        <a 
                            href="#" 
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-[#E4405F] hover:border-[#E4405F] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm"
                            aria-label="Instagram"
                        >
                            <Instagram size={20} />
                        </a>
                        <a 
                            href="#" 
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-[#000000] hover:border-[#000000] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm"
                            aria-label="TikTok"
                        >
                            <svg fill="currentColor" width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.656 1.029c1.637-0.025 3.262-0.012 4.886-0.025 0.054 2.031 0.878 3.859 2.189 5.213l-0.002-0.002c1.411 1.271 3.247 2.095 5.271 2.235l0.028 0.002v5.036c-1.912-0.048-3.71-0.489-5.331-1.247l0.082 0.034c-0.784-0.377-1.447-0.764-2.077-1.196l0.052 0.034c-0.012 3.649 0.012 7.298-0.025 10.934-0.103 1.853-0.719 3.543-1.707 4.954l0.020-0.031c-1.652 2.366-4.328 3.919-7.371 4.011l-0.014 0c-0.123 0.006-0.268 0.009-0.414 0.009-1.73 0-3.347-0.482-4.725-1.319l0.040 0.023c-2.508-1.509-4.238-4.091-4.558-7.094l-0.004-0.041c-0.025-0.625-0.037-1.25-0.012-1.862 0.49-4.779 4.494-8.476 9.361-8.476 0.547 0 1.083 0.047 1.604 0.136l-0.056-0.008c0.025 1.849-0.050 3.699-0.050 5.548-0.423-0.153-0.911-0.242-1.42-0.242-1.868 0-3.457 1.194-4.045 2.861l-0.009 0.030c-0.133 0.427-0.21 0.918-0.21 1.426 0 0.206 0.013 0.41 0.037 0.61l-0.002-0.024c0.332 2.046 2.086 3.59 4.201 3.59 0.061 0 0.121-0.001 0.181-0.004l-0.009 0c1.463-0.044 2.733-0.831 3.451-1.994l0.010-0.018c0.267-0.372 0.45-0.822 0.511-1.311l0.001-0.014c0.125-2.237 0.075-4.461 0.087-6.698 0.012-5.036-0.012-10.060 0.025-15.083z"></path>
                            </svg>
                        </a>
                    </div>
                </div>
                
                {/* Product Column */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.product')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><button onClick={onProductClick} className="hover:text-[#0500e2] transition-colors text-start w-full">Product</button></li>
                        <li><button onClick={onFeaturesClick || (() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }))} className="hover:text-[#0500e2] transition-colors text-start w-full">Features</button></li>
                        <li><button onClick={onPricingClick} className="hover:text-[#0500e2] transition-colors text-start w-full">Pricing</button></li>
                    </ul>
                </div>

                {/* Company Column */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.company')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li>
                            <button onClick={onAboutClick} className="hover:text-[#0500e2] transition-colors text-start">
                                About Us
                            </button>
                        </li>
                        <li>
                            <button onClick={onCareersClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Careers
                            </button>
                        </li>
                        <li>
                            <button onClick={onBlogClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Blog
                            </button>
                        </li>
                        <li>
                            <button onClick={onPartnersClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Partners
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Resources Column */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.resources')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><button onClick={onFaqsClick} className="hover:text-[#0500e2] transition-colors text-start">FAQs</button></li>
                        <li>
                            <button onClick={onContactClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Contact Us
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Legal Column with Functional Link */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.legal')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li>
                            <button onClick={onTermsClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Terms of Service
                            </button>
                        </li>
                        <li>
                            <button onClick={onPrivacyClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Privacy Policy
                            </button>
                        </li>
                        <li>
                            <button onClick={onRefundClick} className="hover:text-[#0500e2] transition-colors text-start">
                                Refund Policy
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} Revu AI. {t('landing.footer.rights')}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('landing.footer.status')}
                </div>
            </div>
        </div>
      </footer>
  );
};
