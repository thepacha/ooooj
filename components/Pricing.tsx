
import React, { useState } from 'react';
import { Check, X, Zap, ChevronDown, ChevronUp, Users, Sparkles, Shield, Globe, Brain, Info, CreditCard, Star, ArrowRight, Crown } from 'lucide-react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';

interface PricingProps {
  onPlanSelect?: (plan: string) => void;
  isLoggedIn?: boolean;
  onBack?: () => void;
  onLogin?: () => void;
  onSignup?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onRefundClick?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onPlanSelect, isLoggedIn = false, onBack, onLogin, onSignup, onTermsClick, onPrivacyClick, onRefundClick }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t, isRTL } = useLanguage();

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const calculatePrice = (basePrice: number) => {
      return billingCycle === 'yearly' ? Math.floor(basePrice * 0.75) : basePrice;
  };

  const plans = [
    {
      id: 'trial',
      name: t('pricing.plans.trial.name'),
      subtitle: t('pricing.plans.trial.subtitle'),
      description: t('pricing.plans.trial.desc'),
      price: 1,
      period: 'one-time',
      seats: t('pricing.plans.trial.seats'),
      volume: t('pricing.plans.trial.volume'),
      features: [
        t('pricing.plans.trial.features.0'),
        t('pricing.plans.trial.features.1'),
        t('pricing.plans.trial.features.2'),
        t('pricing.plans.trial.features.3'),
        t('pricing.plans.trial.features.4')
      ],
      cta: t('pricing.plans.trial.cta'),
      style: 'trial',
      minSeats: 1
    },
    {
      id: 'starter',
      name: t('pricing.plans.starter.name'),
      subtitle: t('pricing.plans.starter.subtitle'),
      description: t('pricing.plans.starter.desc'),
      price: calculatePrice(20),
      period: '/mo',
      seats: t('pricing.plans.starter.seats'),
      volume: t('pricing.plans.starter.volume'),
      features: [
        t('pricing.plans.starter.features.0'),
        t('pricing.plans.starter.features.1'),
        t('pricing.plans.starter.features.2'),
        t('pricing.plans.starter.features.3'),
        t('pricing.plans.starter.features.4')
      ],
      cta: isLoggedIn ? t('pricing.plans.starter.cta_logged_in') : t('pricing.plans.starter.cta_logged_out'),
      style: 'standard',
      minSeats: 1
    },
    {
      id: 'pro',
      name: t('pricing.plans.pro.name'),
      subtitle: t('pricing.plans.pro.subtitle'),
      description: t('pricing.plans.pro.desc'),
      price: calculatePrice(59),
      period: '/seat/mo',
      seats: t('pricing.plans.pro.seats'),
      volume: t('pricing.plans.pro.volume'),
      features: [
        t('pricing.plans.pro.features.0'),
        t('pricing.plans.pro.features.1'),
        t('pricing.plans.pro.features.2'),
        t('pricing.plans.pro.features.3'),
        t('pricing.plans.pro.features.4'),
        t('pricing.plans.pro.features.5')
      ],
      cta: isLoggedIn ? t('pricing.plans.pro.cta_logged_in') : t('pricing.plans.pro.cta_logged_out'),
      style: 'popular',
      highlight: true,
      minSeats: 3
    },
    {
      id: 'enterprise',
      name: t('pricing.plans.enterprise.name'),
      subtitle: t('pricing.plans.enterprise.subtitle'),
      description: t('pricing.plans.enterprise.desc'),
      price: calculatePrice(199),
      period: '/seat/mo',
      seats: t('pricing.plans.enterprise.seats'),
      volume: t('pricing.plans.enterprise.volume'),
      features: [
        t('pricing.plans.enterprise.features.0'),
        t('pricing.plans.enterprise.features.1'),
        t('pricing.plans.enterprise.features.2'),
        t('pricing.plans.enterprise.features.3'),
        t('pricing.plans.enterprise.features.4'),
        t('pricing.plans.enterprise.features.5')
      ],
      cta: t('pricing.plans.enterprise.cta'),
      style: 'enterprise',
      minSeats: 5
    }
  ];

  const faqs = [
    { q: t('pricing.faq.1.q'), a: t('pricing.faq.1.a') },
    { q: t('pricing.faq.2.q'), a: t('pricing.faq.2.a') },
    { q: t('pricing.faq.3.q'), a: t('pricing.faq.3.a') },
    { q: t('pricing.faq.4.q'), a: t('pricing.faq.4.a') },
  ];

  return (
    <div 
        className={`animate-fade-in ${onBack ? 'min-h-screen bg-white dark:bg-slate-950' : ''} ${isRTL ? 'rtl' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
    >
      
      {onBack && (
        <PublicNavigation 
            onLanding={onBack}
            onPricing={() => {}} 
            onLogin={onLogin} 
            onSignup={onSignup}
            activePage="pricing"
        />
      )}

      <div className={`py-12 md:py-24 ${onBack ? 'pt-32' : ''}`}>
        
        {/* Header Content */}
        <div className="max-w-4xl mx-auto text-center mb-20 px-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-8 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                <Star size={14} fill="currentColor" /> {t('pricing.priority_support')}
            </div>
            
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                {t('pricing.title')}
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-light">
                {t('pricing.subtitle')}
            </p>

            {/* Toggle */}
            <div 
                className="relative inline-flex bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 p-1.5 cursor-pointer" 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            >
                <div 
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-full shadow-sm transition-transform duration-300 ease-out 
                    start-1.5 
                    ${billingCycle === 'monthly' 
                        ? 'translate-x-0' 
                        : (isRTL ? '-translate-x-[calc(100%+4px)]' : 'translate-x-[calc(100%+4px)]')
                    }`}
                ></div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setBillingCycle('monthly'); }}
                    className={`relative z-10 w-36 py-2.5 rounded-full text-sm font-bold transition-colors text-center ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('pricing.monthly')}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setBillingCycle('yearly'); }}
                    className={`relative z-10 w-36 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center justify-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('pricing.yearly')} <span className="text-[10px] text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">{t('pricing.save_text')}</span>
                </button>
            </div>
        </div>

        {/* New Card Layout */}
        <div className="max-w-[1400px] mx-auto px-6 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch justify-center">
                {plans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300 group text-center ${
                            plan.style === 'enterprise'
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                            : plan.style === 'popular'
                            ? 'bg-white dark:bg-slate-900 border-2 border-[#0500e2] dark:border-[#4b53fa] shadow-2xl shadow-blue-900/10 scale-105 z-10'
                            : plan.style === 'trial'
                            ? 'bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl'
                        }`}
                    >
                        {plan.highlight && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0500e2] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                {t('pricing.most_popular')}
                            </div>
                        )}

                        <div className="mb-8">
                            <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${plan.style === 'enterprise' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {plan.subtitle}
                            </p>
                            <h3 className={`text-3xl font-serif font-bold mb-4 ${plan.style === 'enterprise' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                {plan.name}
                            </h3>
                            <p className={`text-sm leading-relaxed ${plan.style === 'enterprise' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {plan.description}
                            </p>
                        </div>

                        <div className="mb-8 flex flex-col items-center">
                            <div className="flex items-baseline gap-1" dir="ltr">
                                <span className={`text-5xl font-bold tracking-tight ${plan.style === 'enterprise' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                    ${plan.price}
                                </span>
                                {plan.period !== 'one-time' && (
                                    <span className={`text-sm font-medium ${plan.style === 'enterprise' ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {plan.period}
                                    </span>
                                )}
                            </div>
                            
                            {plan.minSeats > 1 ? (
                                <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center w-full ${
                                    plan.style === 'enterprise' ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                    {t('pricing.starts_at')} <strong dir="ltr">${plan.price * plan.minSeats}/mo</strong>
                                    <br/>({t('pricing.includes_seats').replace('{n}', plan.minSeats.toString())})
                                </div>
                            ) : (
                                <div className="mt-4 h-[42px]"></div> // Spacer
                            )}
                        </div>

                        <div className="flex-1 space-y-4 mb-8 text-start">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                        plan.style === 'enterprise' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/20 text-[#0500e2]'
                                    }`}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span className={`text-sm font-medium ${plan.style === 'enterprise' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => onPlanSelect && onPlanSelect(plan.id)}
                            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group ${
                                plan.style === 'enterprise'
                                ? 'bg-white text-slate-900 hover:bg-slate-100'
                                : plan.style === 'popular'
                                ? 'bg-[#0500e2] hover:bg-[#0400c0] text-white shadow-xl shadow-blue-600/20'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                            }`}
                        >
                            {plan.cta} <ArrowRight size={16} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Feature Table (Desktop) */}
        <div className="max-w-7xl mx-auto px-6 mb-32 hidden lg:block">
            <h3 className="text-3xl font-serif font-bold text-center mb-16 text-slate-900 dark:text-white">{t('pricing.compare.title')}</h3>
            
            <div className="overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="text-start p-6 w-1/3"></th>
                            <th className="p-6 text-center text-lg font-bold text-slate-900 dark:text-white">{t('pricing.plans.starter.name')}</th>
                            <th className="p-6 text-center text-lg font-bold text-[#0500e2]">{t('pricing.plans.pro.name')}</th>
                            <th className="p-6 text-center text-lg font-bold text-slate-900 dark:text-white">{t('pricing.plans.enterprise.name')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {/* Section Header */}
                        <tr><td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 uppercase tracking-wider rounded-xl text-start">{t('pricing.compare.core_usage')}</td></tr>
                        
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300 text-start">{t('pricing.compare.training_sessions')}</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">80 / mo</td>
                            <td className="p-6 text-center font-bold text-[#0500e2]">300 / mo</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white">{t('pricing.val.unlimited')}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300 text-start">{t('pricing.compare.active_scenarios')}</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">15</td>
                            <td className="p-6 text-center font-bold text-[#0500e2]">80</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white">250+</td>
                        </tr>
                        
                        {/* Spacer */}
                        <tr><td className="h-8"></td></tr>

                        {/* Section Header */}
                        <tr><td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 uppercase tracking-wider rounded-xl text-start">{t('pricing.compare.ai_capabilities')}</td></tr>

                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300 text-start">{t('pricing.compare.scenario_builder')}</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">{t('pricing.val.manual_only')}</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">{t('pricing.val.manual_only')}</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2"><Sparkles size={14} className="text-[#0500e2]"/> {t('pricing.val.ai_auto_gen')}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300 text-start">{t('pricing.compare.voice_dialects')}</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">{t('pricing.val.standard_neural')}</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">{t('pricing.val.standard_neural')}</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white">{t('pricing.val.local_accents')}</td>
                        </tr>
                        
                        {/* Spacer */}
                        <tr><td className="h-8"></td></tr>

                        {/* Section Header */}
                        <tr><td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 uppercase tracking-wider rounded-xl text-start">{t('pricing.compare.admin_support')}</td></tr>

                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300 text-start">{t('pricing.compare.customer_support')}</td>
                            <td className="p-6 text-center font-bold text-slate-700 dark:text-slate-300">
                                <div className="flex items-center justify-center gap-2"><Star size={14} className="text-emerald-500" fill="currentColor" /> {t('pricing.val.priority')}</div>
                            </td>
                            <td className="p-6 text-center text-[#0500e2] font-bold">
                                <div className="flex items-center justify-center gap-2"><Star size={14} fill="currentColor" /> {t('pricing.val.priority')}</div>
                            </td>
                            <td className="p-6 text-center text-slate-900 dark:text-white font-bold">
                                <div className="flex items-center justify-center gap-2"><Crown size={14} className="text-yellow-500" fill="currentColor"/> {t('pricing.val.priority_dedicated')}</div>
                            </td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300 text-start">{t('pricing.compare.sso')}</td>
                            <td className="p-6 text-center"><div className="w-1 h-1 bg-slate-300 rounded-full mx-auto"></div></td>
                            <td className="p-6 text-center"><div className="w-1 h-1 bg-slate-300 rounded-full mx-auto"></div></td>
                            <td className="p-6 text-center"><div className="flex justify-center"><Check size={20} className="text-emerald-500"/></div></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6">
            <h3 className="text-3xl font-serif font-bold text-center mb-12 text-slate-900 dark:text-white">{t('pricing.faq.title')}</h3>
            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <button 
                            onClick={() => toggleFaq(i)}
                            className="w-full flex items-center justify-between p-6 text-start focus:outline-none"
                        >
                            <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{faq.q}</span>
                            {openFaq === i ? <ChevronUp size={20} className="text-[#0500e2]"/> : <ChevronDown size={20} className="text-slate-400"/>}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed text-start">
                                {faq.a}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {onBack && (
        <Footer 
            onTermsClick={onTermsClick} 
            onPrivacyClick={onPrivacyClick} 
            onRefundClick={onRefundClick}
        />
      )}
    </div>
  );
};
