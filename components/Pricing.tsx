
import React, { useState } from 'react';
import { Check, X, Zap, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';

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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small teams just getting started with QA automation.',
      price: billingCycle === 'monthly' ? 20 : 15,
      credits: '1,000',
      features: [
        '1,000 Analysis Credits / mo',
        'Standard Transcription',
        'Basic Sentiment Analysis',
        '3 Team Members',
        '7-day History Retention'
      ],
      notIncluded: [
        'Advanced Coaching Tips',
        'Custom Criteria Weights',
        'API Access',
        'Priority Support'
      ],
      cta: isLoggedIn ? 'Current Plan' : 'Start for Free',
      highlight: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing support teams that need deeper insights and coaching.',
      price: billingCycle === 'monthly' ? 49 : 39,
      credits: '10,000',
      features: [
        '10,000 Analysis Credits / mo',
        'High-Fidelity Transcription',
        'Advanced Coaching & Tips',
        'Custom Criteria & Weights',
        'Unlimited Team Members',
        '90-day History Retention',
        'Export to PDF/CSV'
      ],
      notIncluded: [
        'API Access',
        'Dedicated Success Manager'
      ],
      cta: isLoggedIn ? 'Upgrade to Pro' : 'Start 14-Day Trial',
      highlight: true
    },
    {
      id: 'scale',
      name: 'Scale',
      description: 'Full power for large organizations processing high volumes.',
      price: billingCycle === 'monthly' ? 199 : 159,
      credits: '50,000',
      features: [
        '50,000 Analysis Credits / mo',
        'Real-time API Access',
        'Custom AI Models',
        'SSO & Advanced Security',
        'Unlimited History',
        'Dedicated Success Manager',
        'SLA Support'
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  const faqs = [
    { q: "How are 'credits' calculated?", a: "Credits correspond to the complexity of the task. A standard text analysis costs 10 credits. A minute of audio transcription costs 20 credits. Chat messages cost 1 credit." },
    { q: "Can I change plans anytime?", a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, with pro-rated billing." },
    { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption for all data in transit and at rest. We do not use your customer data to train our public models." },
    { q: "What happens if I run out of credits?", a: "We'll notify you when you reach 80% and 100% of your limit. You can purchase 'top-up' packs or upgrade to the next tier to keep analyzing without interruption." },
  ];

  return (
    <div className={`animate-fade-in ${onBack ? 'min-h-screen bg-slate-50 dark:bg-slate-950' : ''}`}>
      
      {/* Header */}
      {onBack && (
        <PublicNavigation 
            onLanding={onBack}
            onPricing={() => {}} // Already here
            onLogin={onLogin} 
            onSignup={onSignup}
            activePage="pricing"
        />
      )}

      <div className={`py-12 md:py-20 pt-24 md:pt-32 ${onBack ? 'px-6' : ''}`}>
        {/* Header Content */}
        <div className="max-w-3xl mx-auto text-center mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6">
            Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Choose the plan that fits your team's volume. No hidden fees, cancel anytime.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
                <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Monthly</span>
                <button 
                    onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                    className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded-full p-1 relative transition-colors duration-300 focus:outline-none"
                >
                    <div className={`w-6 h-6 bg-[#0500e2] rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    Yearly <span className="text-[#0500e2] text-xs ml-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Save 20%</span>
                </span>
            </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 mb-24">
            {plans.map((plan) => (
                <div 
                    key={plan.id}
                    className={`relative flex flex-col p-8 rounded-[2rem] border transition-all duration-300 hover:-translate-y-2 ${
                        plan.highlight 
                        ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-indigo-500/30 shadow-2xl shadow-blue-900/20 z-10 scale-105 md:scale-110 ring-1 ring-white/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xl hover:shadow-2xl'
                    }`}
                >
                    {plan.highlight && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                            Most Popular
                        </div>
                    )}

                    <div className="mb-8">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <p className={`text-sm ${plan.highlight ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'} min-h-[40px]`}>
                            {plan.description}
                        </p>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-serif font-bold">${plan.price}</span>
                            <span className={`text-sm font-medium ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>/month</span>
                        </div>
                        {billingCycle === 'yearly' && plan.price > 0 && (
                            <p className="text-xs text-green-400 mt-2 font-medium">Billed ${plan.price * 12} yearly</p>
                        )}
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${plan.highlight ? 'bg-white/10' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                            <Zap size={18} className={plan.highlight ? 'text-yellow-400' : 'text-[#0500e2]'} fill="currentColor" />
                            <span className="font-bold text-sm">{plan.credits} Credits</span>
                        </div>

                        {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Check size={18} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-green-400' : 'text-green-600 dark:text-green-500'}`} />
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                        
                        {plan.notIncluded.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 opacity-50">
                                <X size={18} className="shrink-0 mt-0.5" />
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onPlanSelect && onPlanSelect(plan.id)}
                        className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                            plan.highlight
                            ? 'bg-[#0500e2] hover:bg-[#0400c0] text-white shadow-lg shadow-blue-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                        }`}
                    >
                        {plan.cta}
                    </button>
                </div>
            ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto px-6 mb-24 hidden md:block">
            <h3 className="text-2xl font-bold text-center mb-10 text-slate-900 dark:text-white">Feature Comparison</h3>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                            <th className="p-6 text-left text-sm font-semibold text-slate-500 dark:text-slate-400">Features</th>
                            <th className="p-6 text-center text-sm font-bold text-slate-900 dark:text-white">Starter</th>
                            <th className="p-6 text-center text-sm font-bold text-[#0500e2]">Pro</th>
                            <th className="p-6 text-center text-sm font-bold text-slate-900 dark:text-white">Scale</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                            { name: 'Analysis Credits', s: '1,000', p: '10,000', e: '50,000+' },
                            { name: 'Team Members', s: '3', p: 'Unlimited', e: 'Unlimited' },
                            { name: 'History Retention', s: '7 Days', p: '90 Days', e: 'Unlimited' },
                            { name: 'Data Export', s: false, p: true, e: true },
                            { name: 'Custom AI Criteria', s: false, p: true, e: true },
                            { name: 'API Access', s: false, p: false, e: true },
                            { name: 'SSO (SAML)', s: false, p: false, e: true },
                            { name: 'Support', s: 'Email', p: 'Priority Email', e: 'Dedicated Slack' },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-6 text-sm font-medium text-slate-700 dark:text-slate-300">{row.name}</td>
                                <td className="p-6 text-center text-sm text-slate-600 dark:text-slate-400">
                                    {typeof row.s === 'boolean' ? (row.s ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.s}
                                </td>
                                <td className="p-6 text-center text-sm font-bold text-[#0500e2] bg-blue-50/30 dark:bg-blue-900/10">
                                    {typeof row.p === 'boolean' ? (row.p ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.p}
                                </td>
                                <td className="p-6 text-center text-sm text-slate-600 dark:text-slate-400">
                                    {typeof row.e === 'boolean' ? (row.e ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.e}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6">
            <h3 className="text-2xl font-bold text-center mb-10 text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
                        <button 
                            onClick={() => toggleFaq(i)}
                            className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                        >
                            <span className="font-bold text-slate-800 dark:text-slate-200">{faq.q}</span>
                            {openFaq === i ? <ChevronUp size={20} className="text-[#0500e2]"/> : <ChevronDown size={20} className="text-slate-400"/>}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                            <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
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
