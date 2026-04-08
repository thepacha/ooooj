
import React from 'react';
import { RevuLogo } from './RevuLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onRefundClick?: () => void;
  onPartnersClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTermsClick, onPrivacyClick, onRefundClick, onPartnersClick }) => {
  const { t } = useLanguage();

  return (
      <footer className="bg-[#f5f4f0] dark:bg-[#0a0a0a] pt-20 pb-10 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-6">
                        <RevuLogo className="h-6 w-auto" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
                        {t('landing.footer.desc')}
                    </p>
                </div>
                
                {/* Product Column */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.product')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Security</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Roadmap</a></li>
                    </ul>
                </div>

                {/* Company Column */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.company')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Blog</a></li>
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
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Help Center</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">API Documentation</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Community</a></li>
                        <li><a href="#" className="hover:text-[#0500e2] transition-colors">Status</a></li>
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
                <p>&copy; {new Date().getFullYear()} RevuQA AI app. {t('landing.footer.rights')}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('landing.footer.status')}
                </div>
            </div>
        </div>
      </footer>
  );
};
