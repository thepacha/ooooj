
import React from 'react';
import { RevuLogo } from './RevuLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onRefundClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTermsClick, onPrivacyClick, onRefundClick }) => {
  const { t } = useLanguage();

  return (
      <footer className="bg-slate-50 dark:bg-slate-950 pt-20 pb-10 px-6 border-t border-slate-200 dark:border-slate-800">
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
                
                {[
                    { key: 'product', label: t('landing.footer.product') }, 
                    { key: 'company', label: t('landing.footer.company') }, 
                    { key: 'resources', label: t('landing.footer.resources') }
                ].map((col, i) => (
                    <div key={i}>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{col.label}</h4>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            {[1,2,3,4].map(item => (
                                <li key={item}><a href="#" className="hover:text-[#0500e2] transition-colors">Link Item {item}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}

                {/* Legal Column with Functional Link */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">{t('landing.footer.legal')}</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li>
                            <button onClick={onTermsClick} className="hover:text-[#0500e2] transition-colors text-left">
                                Terms of Service
                            </button>
                        </li>
                        <li>
                            <button onClick={onPrivacyClick} className="hover:text-[#0500e2] transition-colors text-left">
                                Privacy Policy
                            </button>
                        </li>
                        <li>
                            <button onClick={onRefundClick} className="hover:text-[#0500e2] transition-colors text-left">
                                Refund Policy
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} RevuQA AI Inc. {t('landing.footer.rights')}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('landing.footer.status')}
                </div>
            </div>
        </div>
      </footer>
  );
};
