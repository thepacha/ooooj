
import React from 'react';
import { ArrowRight, Check, Zap, BarChart3, MessageSquare, ShieldCheck, Sparkles, PlayCircle, Users, Mic, TrendingUp, Shield } from 'lucide-react';
import { RevuLogo } from './RevuLogo';
import { PublicNavigation } from './PublicNavigation';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onPricingClick }) => {
  const { t, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-[#0500e2] selection:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}>
      
      {/* Navigation */}
      <PublicNavigation 
        onLogin={onLoginClick}
        onSignup={onSignupClick}
        onPricing={onPricingClick}
        onLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        activePage="landing"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Clean, Subtle Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(#0500e2 1px, transparent 1px)', 
                 backgroundSize: '32px 32px' 
             }}>
        </div>
        
        {/* Subtle Gradient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-100/50 dark:bg-slate-900/50 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-8 animate-fade-in-up">
                <span className="flex h-2 w-2 rounded-full bg-[#0500e2]"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase">{t('landing.hero.badge')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1] max-w-5xl mx-auto">
                {t('landing.hero.title_start')} <br className="hidden md:block" />
                <span className="text-[#0500e2]">{t('landing.hero.title_end')}</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <button 
                    onClick={onSignupClick}
                    className="w-full sm:w-auto px-8 py-4 bg-[#0500e2] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-900/10 hover:bg-[#0400c0] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    {t('landing.cta.start')}
                </button>
                <button 
                    onClick={onLoginClick}
                    className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                >
                    <PlayCircle size={20} className="text-slate-400 group-hover:text-[#0500e2] transition-colors" /> {t('landing.cta.demo')}
                </button>
            </div>

            {/* Application Preview */}
            <div className="relative max-w-6xl mx-auto perspective-1000 group animate-fade-in-up" style={{ animationDelay: '0.2s' }} dir="ltr">
                {/* Soft Shadow instead of glow */}
                <div className="absolute -inset-4 bg-slate-200/50 dark:bg-slate-900/50 rounded-[2rem] blur-xl -z-10"></div>
                
                <div className="relative bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                    {/* Toolbar */}
                    <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                        </div>
                        <div className="flex-1 max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-md px-3 py-1.5 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono border border-slate-200 dark:border-slate-800 shadow-sm">
                             <ShieldCheck size={12} /> app.revuqa.ai/training
                        </div>
                    </div>

                    {/* Mock Interface - Training View */}
                    <div className="grid grid-cols-12 h-[450px] bg-slate-50 dark:bg-slate-950">
                        {/* Sidebar */}
                        <div className="hidden md:flex col-span-2 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex-col gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0500e2] mb-4"></div>
                            <div className="space-y-3">
                                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                                <div className="w-2/3 h-2 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="col-span-12 md:col-span-10 p-8 flex gap-8">
                            <div className="flex-1 space-y-6">
                                {/* Chat Bubbles */}
                                <div className="flex flex-col gap-4">
                                    <div className="self-start max-w-[80%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 mb-1">AI Customer (Angry Persona)</p>
                                        <p className="text-sm text-slate-800 dark:text-slate-200">I've been waiting for two weeks! Why hasn't my refund been processed yet?</p>
                                    </div>
                                    <div className="self-end max-w-[80%] bg-[#0500e2] text-white p-4 rounded-2xl rounded-br-sm shadow-md">
                                        <p className="text-xs font-bold text-blue-200 mb-1">Sales Agent (You)</p>
                                        <p className="text-sm">I completely understand your frustration. Let me check the status of that transaction right now.</p>
                                    </div>
                                </div>
                                
                                {/* Analysis Pill */}
                                <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg">
                                    <Check size={14} className="text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-bold text-green-700 dark:text-green-300">Great empathy demonstrated.</span>
                                </div>
                            </div>

                            {/* Stats Panel */}
                            <div className="hidden lg:block w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-fit">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Live Performance</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-slate-500">
                                            <span>Empathy</span>
                                            <span className="text-emerald-600 font-bold">92%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[92%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-slate-500">
                                            <span>Clarity</span>
                                            <span className="text-[#0500e2] font-bold">88%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#0500e2] w-[88%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">{t('landing.social_proof')}</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-40 hover:opacity-80 transition-opacity duration-500" dir="ltr">
                {/* Simplified Text Logos for Enterprise Feel */}
                <div className="text-xl font-bold font-sans text-slate-800 dark:text-white flex items-center gap-2"><div className="w-5 h-5 bg-current rounded-sm"></div> Acme Corp</div>
                <div className="text-xl font-serif font-black text-slate-800 dark:text-white">GlobalBank</div>
                <div className="text-xl font-sans font-bold italic tracking-tighter text-slate-800 dark:text-white">TechFlow</div>
                <div className="text-xl font-mono font-semibold text-slate-800 dark:text-white">stripe</div>
                <div className="text-xl font-sans font-bold text-slate-800 dark:text-white">Linear</div>
            </div>
        </div>
      </section>

      {/* Two-Column Feature: AI Training */}
      <section id="training" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide mb-6">
                        For Sales & Support Teams
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                        Train agents with realistic AI simulations.
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Don't practice on real customers. Our AI personas simulate angry customers, difficult sales prospects, and technical troubleshooting scenarios so your team handles the real thing with confidence.
                    </p>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0500e2] shrink-0">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sales Pitch Practice</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Agents practice handling objections (e.g. "It's too expensive") with an AI that pushes back.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 shrink-0">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">De-escalation Drills</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Simulate frustrated customers to train empathy and conflict resolution without the risk.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 shrink-0">
                                <Mic size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Voice & Tone Analysis</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time feedback on speaking pace, tone, and filler words during the simulation.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="relative">
                    {/* Abstract Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10"></div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                            <h3 className="font-bold text-slate-900 dark:text-white">Active Scenario: "The Angry Renewal"</h3>
                            <p className="text-sm text-slate-500">Difficulty: Intermediate • Voice: Enabled</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-10 h-10 rounded-full bg-[#0500e2] shrink-0 flex items-center justify-center text-white text-xs font-bold">YOU</div>
                                <div className="space-y-2 flex-1 flex flex-col items-end">
                                    <div className="h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-full p-3 text-sm text-[#0500e2] dark:text-blue-200 font-medium">
                                        "I understand you're upset about the renewal price..."
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl flex items-start gap-3">
                                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 mt-0.5">
                                    <Sparkles size={14} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">AI Coach Tip</p>
                                    <p className="text-sm text-green-800 dark:text-green-200">Good acknowledgment. Now try pivoting to value before discussing the discount.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Feature Grid: QA & Analytics */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-6 whitespace-pre-line">{t('landing.features.title')}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-light">{t('landing.features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="col-span-1 bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#0500e2] mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('landing.feature1.title')}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-sm">
                        {t('landing.feature1.desc')}
                    </p>
                    <div className="space-y-3">
                        {[t('landing.feature1.list1'), t('landing.feature1.list2'), t('landing.feature1.list3')].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <Check size={16} className="text-[#0500e2]" /> {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feature 2: Large Center Card */}
                <div className="md:col-span-2 bg-[#0500e2] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10 max-w-lg">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                            <Users size={24} />
                        </div>
                        <h3 className="text-3xl font-serif font-bold mb-4">Scalable Team Management</h3>
                        <p className="text-blue-100 text-lg leading-relaxed mb-8">
                            Whether you have 5 agents or 500, manage performance with unified rosters, automated leaderboards, and personalized coaching plans.
                        </p>
                        <button onClick={onSignupClick} className="inline-flex items-center gap-2 font-bold border-b border-white/40 pb-1 hover:border-white transition-colors">
                            View Roster Features <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                        </button>
                    </div>
                    
                    {/* Background Pattern */}
                    <div className="absolute -right-20 -bottom-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-10 right-10 opacity-20">
                        <ShieldCheck size={120} />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
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
                    { key: 'resources', label: t('landing.footer.resources') }, 
                    { key: 'legal', label: t('landing.footer.legal') }
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
            </div>
            
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>&copy; 2026 RevuQA AI Inc. {t('landing.footer.rights')}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('landing.footer.status')}
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
