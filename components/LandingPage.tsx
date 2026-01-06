
import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Zap, Menu, X, BarChart3, MessageSquare, ShieldCheck, Sparkles, PlayCircle } from 'lucide-react';
import { RevuLogo } from './RevuLogo';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-[#0500e2] selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 flex justify-between items-center max-w-7xl mx-auto w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all mt-4 rounded-2xl">
        <div className="flex items-center gap-1 text-[#0500e2] dark:text-[#4b53fa]">
            <RevuLogo className="h-8 md:h-10 w-auto" />
            {/* Logo is a wordmark "Revu", so we just add "QA" to complete the brand name */}
            <span className="font-bold text-xl tracking-tight hidden sm:block text-slate-900 dark:text-white pt-1">QA</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#" className="hover:text-[#0500e2] dark:hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-[#0500e2] dark:hover:text-white transition-colors">Customers</a>
            <a href="#" className="hover:text-[#0500e2] dark:hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#0500e2] dark:hover:text-white transition-colors">Company</a>
        </div>

        <div className="hidden lg:flex items-center gap-4">
            <button onClick={onLoginClick} className="text-sm font-semibold hover:text-[#0500e2] transition-colors">Sign in</button>
            <button 
                onClick={onSignupClick}
                className="group relative px-6 py-2.5 bg-[#0500e2] text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/30 hover:bg-[#0400c0] hover:shadow-blue-500/40 transition-all overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-2">
                    Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-shine skew-x-12"></div>
            </button>
        </div>

        <button 
            className="lg:hidden p-2 text-slate-900 dark:text-white"
            onClick={() => setIsMenuOpen(true)}
        >
            <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 p-6 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            
            {/* Background Elements for "richness" */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-0 right-0 -z-10 m-auto h-[300px] w-[300px] rounded-full bg-[#0500e2] opacity-5 blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 -z-10 m-auto h-[200px] w-[200px] rounded-full bg-purple-500 opacity-5 blur-[80px]"></div>
            </div>

            <div className="relative z-10 flex justify-between items-center mb-12">
                 <div className="flex items-center gap-1">
                    <RevuLogo className="h-8 w-auto text-[#0500e2]" />
                    <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white pt-1">QA</span>
                 </div>
                 <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="relative z-10 space-y-8 flex flex-col text-3xl font-serif font-bold tracking-tight px-2">
                <a href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-900 dark:text-white hover:text-[#0500e2] transition-colors">Features</a>
                <a href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-900 dark:text-white hover:text-[#0500e2] transition-colors">Customers</a>
                <a href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-900 dark:text-white hover:text-[#0500e2] transition-colors">Pricing</a>
                <a href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-900 dark:text-white hover:text-[#0500e2] transition-colors">Company</a>
            </div>

            <div className="relative z-10 mt-12 space-y-3">
                 <button 
                    onClick={onLoginClick} 
                    className="w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                    Log In
                </button>
                 <button 
                    onClick={onSignupClick} 
                    className="w-full py-4 bg-[#0500e2] text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-[#0400c0] transition-colors flex items-center justify-center gap-2"
                >
                    Get Started <ArrowRight size={18} />
                </button>
            </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
            
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-8 animate-fade-in-up">
                <span className="flex h-2 w-2 rounded-full bg-[#0500e2]"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">New: Gemini 2.5 Flash Integration</span>
                <ArrowRight size={12} className="text-slate-400 ml-1" />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-[1.1] max-w-5xl mx-auto">
                Quality Assurance <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0500e2] to-violet-500">on Autopilot.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Automate 100% of your customer support scoring. Eliminate bias, uncover coaching insights, and build a world-class team with human-level AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <button 
                    onClick={onSignupClick}
                    className="w-full sm:w-auto px-8 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-[#0400c0] hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                    Start Analysis Now
                </button>
                <button 
                    onClick={onLoginClick}
                    className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <PlayCircle size={20} /> Watch Demo
                </button>
            </div>

            {/* 3D Dashboard Preview */}
            <div className="relative max-w-5xl mx-auto group perspective-1000">
                {/* Glow effect behind */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
                
                <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-x-2">
                    {/* Browser Header */}
                    <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <div className="mx-auto px-3 py-1 bg-slate-900 rounded-md text-[10px] text-slate-500 font-mono border border-slate-800 flex items-center gap-2">
                            <ShieldCheck size={10} /> revuqa.ai/dashboard
                        </div>
                    </div>

                    {/* Mock Dashboard Content */}
                    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50 grid grid-cols-12 gap-6 text-left">
                        {/* Sidebar */}
                        <div className="hidden md:block col-span-2 space-y-4">
                            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8"></div>
                            {[1,2,3,4].map(i => (
                                <div key={i} className="h-8 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
                            ))}
                        </div>
                        
                        {/* Main Content */}
                        <div className="col-span-12 md:col-span-10 space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                <div className="h-10 w-32 bg-[#0500e2] rounded-lg opacity-80"></div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { color: "text-[#0500e2]", label: "Avg Score", val: "92%" },
                                    { color: "text-green-500", label: "Sentiment", val: "Positive" },
                                    { color: "text-purple-500", label: "Evaluations", val: "1,240" }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="h-4 w-20 bg-slate-100 dark:bg-slate-900 rounded mb-4"></div>
                                        <div className={`text-3xl font-bold font-serif ${stat.color}`}>{stat.val}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-64 flex items-end justify-between px-8 pb-4 gap-4">
                                {[40, 65, 45, 80, 55, 90, 75, 85, 95, 88].map((h, i) => (
                                    <div key={i} className="w-full bg-indigo-50 dark:bg-slate-900 rounded-t-lg relative group" style={{height: '100%'}}>
                                        <div 
                                            className="absolute bottom-0 w-full bg-[#0500e2] rounded-t-lg transition-all duration-1000" 
                                            style={{height: `${h}%`, opacity: 0.1 + (i/15)}}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Floating Overlay Element */}
                    <div className="absolute bottom-8 right-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-float z-20 hidden md:block">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Sparkles size={16} />
                            </div>
                            <div className="text-xs font-bold dark:text-white">AI Insight Detected</div>
                        </div>
                        <div className="text-[10px] text-slate-500 w-48 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                            "Agent displayed high empathy during the refund discussion. Recommended for peer coaching."
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by support teams at</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                 {/* Simple Text Logos for Cleanliness */}
                <h3 className="text-2xl font-serif font-bold text-slate-700 dark:text-slate-300">Acme Corp</h3>
                <h3 className="text-2xl font-sans font-black tracking-tighter text-slate-700 dark:text-slate-300">GlobalBank</h3>
                <h3 className="text-2xl font-serif italic font-bold text-slate-700 dark:text-slate-300">LuxeStay</h3>
                <h3 className="text-xl font-mono font-semibold text-slate-700 dark:text-slate-300">TechFlow_</h3>
                <h3 className="text-2xl font-sans font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><div className="w-6 h-6 bg-slate-700 dark:bg-slate-300 rounded-full"></div>Circle</h3>
            </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-slate-900 dark:text-white">Everything you need to <br/> scale quality.</h2>
                <p className="text-lg text-slate-500">RevuQA replaces manual spreadsheet grading with intelligent, automated analysis that scales with your volume.</p>
            </div>

            {/* Reduced height from 800px to 600px to tighten up space */}
            <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
                
                {/* Feature 1: Main Large Box - Optimized */}
                <div className="md:col-span-2 md:row-span-2 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-8 pb-64 md:p-10 relative overflow-hidden group border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl hover:border-blue-100 dark:hover:border-blue-900/30">
                     {/* Background decoration */}
                     <div className="absolute inset-0 bg-[radial-gradient(#0500e2_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] dark:opacity-[0.05]"></div>
                     
                     <div className="relative z-10 flex flex-col h-full md:max-w-xs lg:max-w-sm pointer-events-none">
                        <div>
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm text-[#0500e2] border border-slate-100 dark:border-slate-700">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="text-3xl font-serif font-bold mb-4 dark:text-white leading-tight">100% Coverage, <br/>Zero Effort.</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-8">
                                Stop sampling 2%. Auto-score every interaction for compliance and tone instantly.
                            </p>
                        </div>
                        
                        <ul className="space-y-4">
                            {[
                                { text: 'Scale to 10k+ chats/hr', delay: '0' }, 
                                { text: 'Real-time fail detection', delay: '100' }, 
                                { text: 'Bias-free scoring', delay: '200' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium" style={{animationDelay: `${item.delay}ms`}}>
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0500e2] dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                     </div>

                     {/* Abstract Chart Graphic - Resized and Enhanced */}
                     <div className="absolute bottom-0 right-0 w-full h-[240px] md:w-[65%] md:h-[80%] bg-white dark:bg-slate-950 rounded-tl-[3rem] border-t border-l border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl shadow-blue-900/5 translate-y-8 translate-x-8 md:translate-y-6 md:translate-x-6 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500 ease-out">
                        
                        {/* Live Indicator */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
                                 <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                 </span>
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Ingestion</span>
                            </div>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500">2,492 / min</div>
                        </div>

                        {/* Bars */}
                        <div className="h-full w-full flex items-end gap-2 md:gap-3 pb-4">
                            {[35, 50, 45, 70, 60, 85, 95, 65, 75, 80, 55, 90].map((h, i) => (
                                <div key={i} className="w-full bg-slate-100 dark:bg-slate-900 rounded-t-md relative overflow-hidden h-full">
                                     <div 
                                        className="absolute bottom-0 w-full bg-[#0500e2] dark:bg-[#4b53fa] rounded-t-md transition-all duration-700 ease-in-out group-hover:bg-blue-600 group-hover:h-[105%]" 
                                        style={{height: `${h}%`, transitionDelay: `${i*30}ms`}}
                                     >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                     </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>

                {/* Feature 2: Top Right - REDESIGNED */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between md:min-h-[320px]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.05]"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 text-purple-600 shadow-sm border border-slate-100 dark:border-slate-700">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2 dark:text-white">AI Coaching</h3>
                        <p className="text-slate-500 text-sm">Real-time nudges for tone and compliance.</p>
                    </div>

                    <div className="relative z-10 mt-6 space-y-3">
                        {/* Agent Message */}
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm w-[90%] relative opacity-60">
                            <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Agent</div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">"We don't offer refunds for that."</div>
                             <div className="absolute -right-2 -top-2 bg-red-100 text-red-500 rounded-full p-0.5 border-2 border-slate-50 dark:border-slate-900">
                                <X size={10} strokeWidth={3} />
                            </div>
                        </div>

                        {/* AI Suggestion */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3.5 rounded-2xl rounded-tr-none border border-purple-100 dark:border-purple-800/50 shadow-md ml-auto w-[95%] transform transition-transform duration-300 group-hover:-translate-y-1">
                             <div className="flex gap-2 items-center mb-1.5">
                                 <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold shadow-sm">AI</div>
                                 <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Better Approach</span>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                                "Try: <span className="italic text-purple-600 dark:text-purple-400">'I wish I could help, but due to policy...'</span>"
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 3: Bottom Right */}
                <div className="bg-[#0500e2] rounded-[2.5rem] p-8 relative overflow-hidden text-white group shadow-xl shadow-blue-600/20 flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-white backdrop-blur-sm border border-white/10">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2">Instant Setup</h3>
                        <p className="text-blue-100 text-sm">Define your scorecard and start grading in under 5 minutes.</p>
                    </div>
                    <button onClick={onSignupClick} className="mt-6 px-4 py-2 bg-white text-[#0500e2] rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors w-fit relative z-10">
                        Try Demo
                    </button>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                </div>

            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 -skew-y-2 transform origin-top-left z-0 scale-110"></div>
         
         <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
                Ready to upgrade your <br/> support team?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                Join forward-thinking CX leaders who use RevuQA to deliver 5-star experiences at scale.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                 <button 
                    onClick={onSignupClick}
                    className="px-10 py-4 bg-[#0500e2] text-white rounded-full font-bold text-lg shadow-xl hover:bg-[#0400c0] hover:-translate-y-1 transition-all w-full sm:w-auto"
                >
                    Get Started for Free
                </button>
                <p className="text-sm text-slate-500 mt-4 sm:mt-0 sm:ml-6">No credit card required. <br className="hidden sm:block"/> Cancel anytime.</p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 pt-20 pb-10 px-6 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
                <div className="flex items-center gap-1 text-[#0500e2] mb-6">
                    <RevuLogo className="h-8 w-auto" />
                    <span className="font-bold text-xl text-slate-900 dark:text-white pt-1">QA</span>
                </div>
                <p className="text-slate-500 text-sm max-w-xs mb-6">
                    The AI-first Quality Assurance platform for modern customer support teams.
                </p>
                <div className="flex gap-4">
                    {/* Social Placeholders */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-[#0500e2] hover:text-white transition-colors cursor-pointer">
                        <ArrowRight size={14} className="-rotate-45" />
                    </div>
                </div>
            </div>
            
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                    <li><a href="#" className="hover:text-[#0500e2]">Features</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Integrations</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Pricing</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Changelog</a></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Company</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                    <li><a href="#" className="hover:text-[#0500e2]">About</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Careers</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Blog</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Contact</a></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                    <li><a href="#" className="hover:text-[#0500e2]">Privacy</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Terms</a></li>
                    <li><a href="#" className="hover:text-[#0500e2]">Security</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>© 2024 RevuQA AI Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                System Operational
            </div>
        </div>
      </footer>

    </div>
  );
};
