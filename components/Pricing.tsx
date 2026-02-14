
import React, { useState } from 'react';
import { Check, X, Zap, ChevronDown, ChevronUp, Users, Sparkles, Shield, Globe, Brain, Info, CreditCard } from 'lucide-react';
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
      name: '7-Day Trial',
      description: 'Experience the full power of Pro before you commit.',
      price: 1,
      period: 'one-time',
      seats: 'Single User',
      volume: '20 Training Sessions',
      features: [
        'Full Pro Feature Access',
        '20 AI Roleplay Sessions',
        'Advanced Analytics',
        '8 Days Access'
      ],
      cta: 'Start for $1',
      style: 'trial',
      minSeats: 1
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For solo founders and individual rep practice.',
      price: calculatePrice(20),
      period: '/mo',
      seats: 'Strictly 1 Seat',
      volume: '80 Sessions / mo',
      features: [
        '80 Training Sessions/mo',
        '15 Active Scenarios',
        'Manual Scenario Creation',
        'Basic Pass/Fail Analytics',
        'Standard Neutral Voices'
      ],
      cta: isLoggedIn ? 'Switch to Starter' : 'Choose Starter',
      style: 'standard',
      minSeats: 1
    },
    {
      id: 'pro',
      name: 'Pro Team',
      description: 'For sales managers and growing departments.',
      price: calculatePrice(59),
      period: '/seat/mo',
      seats: 'Min 3 Seats',
      volume: '300 Sessions / mo',
      features: [
        '300 Sessions/mo (per agent)',
        '80 Active Scenarios',
        'Shared Team Workspace',
        'Deep Scorecards & Sentiment',
        'Manager Oversight Dashboard'
      ],
      cta: isLoggedIn ? 'Upgrade to Pro' : 'Start Growth',
      style: 'popular',
      highlight: 'Most Popular',
      minSeats: 3
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For VPs of Sales and large contact centers.',
      price: calculatePrice(199),
      period: '/seat/mo',
      seats: 'Min 5 Seats',
      volume: 'Unlimited Sessions',
      features: [
        'Unlimited Training Sessions',
        '250+ Active Scenarios',
        'AI Auto-Generated Scenarios',
        'Local Dialects (Khaleeji, etc)',
        'White-Labeled Reporting',
        'BYOK (Bring Your Own Key)'
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
    <div className={`animate-fade-in ${onBack ? 'min-h-screen bg-slate-50 dark:bg-slate-950' : ''}`}>
      
      {onBack && (
        <PublicNavigation 
            onLanding={onBack}
            onPricing={() => {}} 
            onLogin={onLogin} 
            onSignup={onSignup}
            activePage="pricing"
        />
      )}

      <div className={`py-12 md:py-20 pt-24 md:pt-32 ${onBack ? 'px-6' : ''}`}>
        
        {/* Header Content */}
        <div className="max-w-4xl mx-auto text-center mb-16 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[#0500e2] dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800">
                <Sparkles size={14} /> World-Class Training Infrastructure
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Plans that scale with your<br className="hidden md:block" /> <span className="text-[#0500e2]">performance culture.</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                From solo practice to global contact centers. Choose the capacity that fits your team's ambition.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-6 mb-12 bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 w-fit mx-auto">
                <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Monthly Billing
                </button>
                <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-[#0500e2] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Yearly Billing <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">Save 25%</span>
                </button>
            </div>
            
            {/* Volume Discount Banner */}
            <div className="max-w-md mx-auto bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-12">
                <Users size={16} /> 
                <span>Need 30+ seats?</span> 
                <span className="font-bold underline cursor-pointer">Get an additional 10% volume discount.</span>
            </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1400px] mx-auto px-4 mb-24 items-start">
            {plans.map((plan) => (
                <div 
                    key={plan.id}
                    className={`relative flex flex-col p-6 rounded-[2rem] border transition-all duration-300 hover:-translate-y-2 h-full ${
                        plan.style === 'enterprise'
                        ? 'bg-slate-900 text-white border-slate-800 shadow-2xl shadow-slate-900/20' 
                        : plan.style === 'popular'
                        ? 'bg-white dark:bg-slate-900 border-[#0500e2] dark:border-[#4b53fa] shadow-xl shadow-blue-900/10 ring-1 ring-[#0500e2]/20 scale-105 z-10'
                        : plan.style === 'trial'
                        ? 'bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg'
                    }`}
                >
                    {plan.highlight && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0500e2] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            {plan.highlight}
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className={`text-xl font-bold mb-2 ${plan.style === 'enterprise' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{plan.name}</h3>
                        <p className={`text-xs leading-relaxed min-h-[40px] ${plan.style === 'enterprise' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {plan.description}
                        </p>
                    </div>

                    <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-serif font-bold">${plan.price}</span>
                            {plan.period !== 'one-time' && (
                                <span className={`text-xs font-bold ${plan.style === 'enterprise' ? 'text-slate-500' : 'text-slate-400'}`}>{plan.period}</span>
                            )}
                        </div>
                        {plan.minSeats > 1 ? (
                            <p className={`text-[10px] font-medium mt-2 ${plan.style === 'enterprise' ? 'text-indigo-300' : 'text-[#0500e2] dark:text-[#4b53fa]'}`}>
                                Starts at ${plan.price * plan.minSeats}/mo ({plan.minSeats} seats)
                            </p>
                        ) : (
                            <p className="text-[10px] text-transparent mt-2 select-none">Single User</p>
                        )}
                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold w-full ${
                            plan.style === 'enterprise' ? 'bg-white/10 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                            <Zap size={14} className={plan.style === 'enterprise' ? 'text-yellow-400' : 'text-[#0500e2]'} />
                            {plan.volume}
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-8">
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${plan.style === 'enterprise' ? 'text-slate-500' : 'text-slate-400'}`}>
                            Includes:
                        </p>
                        {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Check size={16} className={`shrink-0 mt-0.5 ${
                                    plan.style === 'enterprise' ? 'text-emerald-400' : 
                                    plan.style === 'popular' ? 'text-[#0500e2]' : 
                                    'text-slate-400'
                                }`} />
                                <span className={`text-xs font-medium ${plan.style === 'enterprise' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onPlanSelect && onPlanSelect(plan.id)}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                            plan.style === 'enterprise'
                            ? 'bg-white text-slate-900 hover:bg-slate-100'
                            : plan.style === 'popular'
                            ? 'bg-[#0500e2] hover:bg-[#0400c0] text-white shadow-lg shadow-blue-600/30'
                            : plan.style === 'trial' 
                            ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                        }`}
                    >
                        {plan.cta}
                    </button>
                </div>
            ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto px-6 mb-24 hidden lg:block">
            <h3 className="text-2xl font-bold text-center mb-10 text-slate-900 dark:text-white">Detailed Capability Matrix</h3>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                            <th className="p-6 text-left text-sm font-bold text-slate-900 dark:text-white w-1/4">Features</th>
                            <th className="p-6 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 w-1/5">Starter</th>
                            <th className="p-6 text-center text-sm font-bold text-[#0500e2] w-1/5 bg-blue-50/50 dark:bg-blue-900/10">Pro Team</th>
                            <th className="p-6 text-center text-sm font-bold text-slate-900 dark:text-white w-1/5">Enterprise</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {/* Usage & Limits */}
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <td colSpan={4} className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Usage & Capacity</td>
                        </tr>
                        {[
                            { name: 'Training Sessions', s: '80 / mo', p: '300 / mo', e: 'Unlimited' },
                            { name: 'Active Scenarios', s: '15 Max', p: '80 Max', e: '250 Max' },
                            { name: 'Seat Minimum', s: '1 Seat', p: '3 Seats', e: '5 Seats' },
                            { name: 'History Retention', s: '30 Days', p: '1 Year', e: 'Unlimited' },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="p-5 px-6 font-medium text-slate-700 dark:text-slate-300">{row.name}</td>
                                <td className="p-5 text-center text-slate-500 dark:text-slate-400">{row.s}</td>
                                <td className="p-5 text-center font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/5">{row.p}</td>
                                <td className="p-5 text-center font-bold text-slate-900 dark:text-white">{row.e}</td>
                            </tr>
                        ))}

                        {/* AI Intelligence */}
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <td colSpan={4} className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">AI Intelligence</td>
                        </tr>
                        {[
                            { name: 'Scenario Creation', s: 'Manual Builder', p: 'Manual Builder', e: 'AI Auto-Generation' },
                            { name: 'Voice Reality', s: 'Standard Neural', p: 'Standard Neural', e: 'Local Dialects & Accents' },
                            { name: 'Analytics Depth', s: 'Pass/Fail', p: 'Deep Scorecards', e: 'Macro Trend Analysis' },
                            { name: 'BYOK (Own LLM Key)', s: false, p: false, e: true },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="p-5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    {row.name} {row.name === 'BYOK (Own LLM Key)' && <Info size={14} className="text-slate-400" />}
                                </td>
                                <td className="p-5 text-center text-slate-500 dark:text-slate-400">
                                    {typeof row.s === 'boolean' ? (row.s ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.s}
                                </td>
                                <td className="p-5 text-center font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/5">
                                    {typeof row.p === 'boolean' ? (row.p ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.p}
                                </td>
                                <td className="p-5 text-center font-bold text-slate-900 dark:text-white">
                                    {typeof row.e === 'boolean' ? (row.e ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.e}
                                </td>
                            </tr>
                        ))}

                        {/* Admin & Security */}
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <td colSpan={4} className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace & Control</td>
                        </tr>
                        {[
                            { name: 'Collaboration', s: 'Single Player', p: 'Shared Workspace', e: 'Shared Workspace' },
                            { name: 'Role Management', s: false, p: true, e: true },
                            { name: 'White-Label Reports', s: false, p: false, e: true },
                            { name: 'SSO & SAML', s: false, p: false, e: true },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="p-5 px-6 font-medium text-slate-700 dark:text-slate-300">{row.name}</td>
                                <td className="p-5 text-center text-slate-500 dark:text-slate-400">
                                    {typeof row.s === 'boolean' ? (row.s ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.s}
                                </td>
                                <td className="p-5 text-center font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/5">
                                    {typeof row.p === 'boolean' ? (row.p ? <Check size={18} className="mx-auto text-green-500"/> : <X size={18} className="mx-auto text-slate-300"/>) : row.p}
                                </td>
                                <td className="p-5 text-center font-bold text-slate-900 dark:text-white">
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
