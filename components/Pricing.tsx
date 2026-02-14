
import React, { useState } from 'react';
import { Check, X, Zap, ChevronDown, ChevronUp, Users, Sparkles, Shield, Globe, Brain, Info, CreditCard, Star, ArrowRight, Crown } from 'lucide-react';
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

  const calculatePrice = (basePrice: number) => {
      return billingCycle === 'yearly' ? Math.floor(basePrice * 0.75) : basePrice;
  };

  const plans = [
    {
      id: 'trial',
      name: '7-Day Access',
      subtitle: 'Test Drive',
      description: 'Full access to Pro features to test the AI capabilities.',
      price: 1,
      period: 'one-time',
      seats: 'Single User',
      volume: '20 Sessions Total',
      features: [
        'Full Pro Feature Access',
        '20 AI Roleplay Sessions',
        'Advanced Analytics',
        'Priority Support Included',
        '8 Days Access'
      ],
      cta: 'Start Trial for $1',
      style: 'trial',
      minSeats: 1
    },
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'For Individuals',
      description: 'Perfect for solo founders and individual rep practice.',
      price: calculatePrice(20),
      period: '/mo',
      seats: '1 Seat',
      volume: '80 Sessions / mo',
      features: [
        '80 Training Sessions/mo',
        '15 Active Scenarios',
        'Manual Scenario Creation',
        'Basic Pass/Fail Analytics',
        'Priority Support Included'
      ],
      cta: isLoggedIn ? 'Switch to Starter' : 'Choose Starter',
      style: 'standard',
      minSeats: 1
    },
    {
      id: 'pro',
      name: 'Pro Team',
      subtitle: 'Most Popular',
      description: 'For growing sales teams and support departments.',
      price: calculatePrice(59),
      period: '/seat/mo',
      seats: 'Min 3 Seats',
      volume: '300 Sessions / mo',
      features: [
        '300 Sessions/mo (per agent)',
        '80 Active Scenarios',
        'Shared Team Workspace',
        'Deep Scorecards & Sentiment',
        'Manager Oversight Dashboard',
        'Priority Support Included'
      ],
      cta: isLoggedIn ? 'Upgrade to Pro' : 'Start Scaling',
      style: 'popular',
      highlight: true,
      minSeats: 3
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      subtitle: 'For Organizations',
      description: 'Maximum power for large contact centers.',
      price: calculatePrice(199),
      period: '/seat/mo',
      seats: 'Min 5 Seats',
      volume: 'Unlimited',
      features: [
        'Unlimited Training Sessions',
        '250+ Active Scenarios',
        'AI Auto-Generated Scenarios',
        'Local Dialects (Khaleeji, etc)',
        'White-Labeled Reporting',
        'Priority + Dedicated Manager'
      ],
      cta: 'Contact Sales',
      style: 'enterprise',
      minSeats: 5
    }
  ];

  const faqs = [
    { q: "How do the seat minimums work?", a: "To ensure proper team collaboration features, Pro Team requires a minimum of 3 seats ($177/mo base), and Enterprise requires 5 seats. You can add more seats at the per-agent rate anytime." },
    { q: "What happens if I run out of training sessions?", a: "No problem. All plans allow for Credit Top-Ups. You can purchase bundles of 25 additional training sessions for just $10, which never expire." },
    { q: "Can I upgrade from Starter to Pro later?", a: "Absolutely. All your custom scenarios and training history will migrate seamlessly to the Team Workspace when you upgrade." },
    { q: "How does the $1 Trial work?", a: "You get 8 days of access with a specific allowance of 20 training sessions. This gives you enough runway to test the AI realism and see the analytics engine in action." },
  ];

  return (
    <div className={`animate-fade-in ${onBack ? 'min-h-screen bg-white dark:bg-slate-950' : ''}`}>
      
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
                <Star size={14} fill="currentColor" /> Enterprise-grade security included in all plans
            </div>
            
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                Simple, transparent pricing.
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-light">
                Choose the plan that fits your team's stage. No hidden fees. Cancel anytime.
            </p>

            {/* Toggle */}
            <div className="relative inline-flex bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 p-1.5 cursor-pointer" onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}>
                <div 
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-full shadow-sm transition-all duration-300 ease-out ${
                        billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full'
                    }`}
                ></div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setBillingCycle('monthly'); }}
                    className={`relative z-10 w-36 py-2.5 rounded-full text-sm font-bold transition-colors text-center ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setBillingCycle('yearly'); }}
                    className={`relative z-10 w-36 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center justify-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Yearly <span className="text-[10px] text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">-25%</span>
                </button>
            </div>
        </div>

        {/* New Card Layout */}
        <div className="max-w-[1400px] mx-auto px-6 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch">
                {plans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300 group ${
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
                                Most Popular
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

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
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
                                <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center ${
                                    plan.style === 'enterprise' ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                    Starts at <strong>${plan.price * plan.minSeats}/mo</strong>
                                    <br/>(includes {plan.minSeats} seats)
                                </div>
                            ) : (
                                <div className="mt-4 h-[42px]"></div> // Spacer
                            )}
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
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
                            {plan.cta} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Feature Table (Desktop) */}
        <div className="max-w-7xl mx-auto px-6 mb-32 hidden lg:block">
            <h3 className="text-3xl font-serif font-bold text-center mb-16 text-slate-900 dark:text-white">Compare Features</h3>
            
            <div className="overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="text-left p-6 w-1/3"></th>
                            <th className="p-6 text-center text-lg font-bold text-slate-900 dark:text-white">Starter</th>
                            <th className="p-6 text-center text-lg font-bold text-[#0500e2]">Pro Team</th>
                            <th className="p-6 text-center text-lg font-bold text-slate-900 dark:text-white">Enterprise</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {/* Section Header */}
                        <tr><td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 uppercase tracking-wider rounded-xl">Core Usage</td></tr>
                        
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300">Training Sessions</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">80 / mo</td>
                            <td className="p-6 text-center font-bold text-[#0500e2]">300 / mo</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white">Unlimited</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300">Active Scenarios</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">15</td>
                            <td className="p-6 text-center font-bold text-[#0500e2]">80</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white">250+</td>
                        </tr>
                        
                        {/* Spacer */}
                        <tr><td className="h-8"></td></tr>

                        {/* Section Header */}
                        <tr><td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 uppercase tracking-wider rounded-xl">AI Capabilities</td></tr>

                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300">Scenario Builder</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">Manual Only</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">Manual Only</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2"><Sparkles size={14} className="text-[#0500e2]"/> AI Auto-Gen</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300">Voice Dialects</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">Standard Neural</td>
                            <td className="p-6 text-center text-slate-600 dark:text-slate-400">Standard Neural</td>
                            <td className="p-6 text-center font-bold text-slate-900 dark:text-white">Local Accents</td>
                        </tr>
                        
                        {/* Spacer */}
                        <tr><td className="h-8"></td></tr>

                        {/* Section Header */}
                        <tr><td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 uppercase tracking-wider rounded-xl">Admin & Support</td></tr>

                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300">Customer Support</td>
                            <td className="p-6 text-center font-bold text-slate-700 dark:text-slate-300">
                                <div className="flex items-center justify-center gap-2"><Star size={14} className="text-emerald-500" fill="currentColor" /> Priority</div>
                            </td>
                            <td className="p-6 text-center text-[#0500e2] font-bold">
                                <div className="flex items-center justify-center gap-2"><Star size={14} fill="currentColor" /> Priority</div>
                            </td>
                            <td className="p-6 text-center text-slate-900 dark:text-white font-bold">
                                <div className="flex items-center justify-center gap-2"><Crown size={14} className="text-yellow-500" fill="currentColor"/> Priority + Dedicated Mgr</div>
                            </td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-6 font-medium text-slate-700 dark:text-slate-300">SSO & SAML</td>
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
            <h3 className="text-3xl font-serif font-bold text-center mb-12 text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <button 
                            onClick={() => toggleFaq(i)}
                            className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                        >
                            <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{faq.q}</span>
                            {openFaq === i ? <ChevronUp size={20} className="text-[#0500e2]"/> : <ChevronDown size={20} className="text-slate-400"/>}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">
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
