import React from 'react';
import { Star, ArrowRight, ArrowUpRight, Check, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { RevuLogo } from './RevuLogo';

interface LandingPageProps {
  onEnterApp: () => void;
}

const StarBorderButton = ({ children, onClick }: { children?: React.ReactNode, onClick: () => void }) => {
  return (
    <button className="star-border-container" onClick={onClick}>
      <div className="border-gradient-bottom"></div>
      <div className="border-gradient-top"></div>
      <div className="inner-content">
        {children}
      </div>
    </button>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-[#0500e2] selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto w-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md transition-all">
        <div className="flex items-center gap-4 text-[#0500e2]">
            <RevuLogo className="h-16 w-auto" />
            <span className="hidden sm:inline-block text-sm font-medium text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-4">/ sales@revuqa.io</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Product</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Solutions</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Developers</a>
        </div>

        <div className="flex items-center gap-6">
            <button onClick={onEnterApp} className="hidden md:block text-sm font-medium hover:text-[#0500e2] transition-colors">Log in</button>
            <StarBorderButton onClick={onEnterApp}>
                Apply Now — It's Free
            </StarBorderButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            
            {/* Left Column: Text */}
            <div className="space-y-8 animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
                        <Star size={16} fill="currentColor" className="text-black dark:text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">5.0 Rated</p>
                        <p className="text-xs text-slate-500">Over 12.5K — Ratings on Hunt</p>
                    </div>
                </div>

                <h1 className="text-7xl md:text-[7rem] leading-[0.9] font-serif tracking-tighter text-black dark:text-white">
                    Quality
                </h1>

                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 max-w-md">
                    <div className="flex items-center gap-3 text-[#0500e2]">
                        <RevuLogo className="h-9 w-auto" />
                    </div>
                    <a href="#" onClick={(e) => { e.preventDefault(); onEnterApp(); }} className="flex items-center gap-1 text-sm font-medium hover:underline">
                        Read Story <ArrowUpRight size={14} />
                    </a>
                </div>

                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-light leading-relaxed max-w-lg">
                    “ The Best Platform To Use For Automating Support QA and Coaching, Highly Recommend ”
                </p>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden border-2 border-white dark:border-slate-900 shadow-md">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Robert" alt="User" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Robert J.</p>
                        <p className="text-xs text-slate-500">Head of CX / RevuQA User</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <StarBorderButton onClick={onEnterApp}>
                        Start Analyzing — It's Free
                    </StarBorderButton>
                    <button onClick={onEnterApp} className="px-8 py-3 rounded-full font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        Our Process
                    </button>
                </div>
            </div>

            {/* Right Column: Visuals - Restored Clean Design */}
            <div className="relative h-[600px] w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                
                {/* Abstract Background */}
                <div className="absolute inset-0 overflow-hidden">
                     {/* Blue Orb */}
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0500e2]/15 rounded-full blur-[80px] animate-pulse-slow"></div>
                     {/* Purple Orb */}
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[80px] animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
                     {/* Noise Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 brightness-100 contrast-150 mix-blend-overlay"></div>
                </div>

                {/* Content Wrapper - Centered */}
                <div className="relative z-10 w-full max-w-[380px] perspective-1000">
                    
                    {/* Top Floating Badge */}
                    <div className="absolute -top-8 -right-2 z-20 bg-white dark:bg-slate-800 p-2 pr-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow border border-slate-100 dark:border-slate-700 max-w-[180px]">
                         <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                            <Check size={16} strokeWidth={3} />
                        </div>
                        <div className="text-[10px] font-semibold leading-tight">
                             Score <span className="text-green-600">98/100</span> <br/>
                             <span className="text-slate-400 font-normal">on Empathy</span>
                        </div>
                    </div>

                    {/* Main Glass Card */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 p-8 rounded-[2.5rem] shadow-2xl relative z-10 transform transition-transform duration-500 hover:scale-[1.02]">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-[#0500e2]">
                                    <Shield size={24} />
                                 </div>
                                 <div>
                                     <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Evaluation</p>
                                     <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-none">Agent Performance</h3>
                                 </div>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                                <Check size={16} strokeWidth={3} />
                             </div>
                        </div>

                        {/* Card Content */}
                        <div className="space-y-6">
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Agent Name</label>
                                 <div className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Jenifer Lawrence</div>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                 <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Score</label>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white">98</div>
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sentiment</label>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white">Positive</div>
                                 </div>
                                 <div className="text-right">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</label>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white">Oct 24</div>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Bottom Floating Badge */}
                    <div className="absolute -bottom-4 -left-2 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-2 pr-3 rounded-xl shadow-lg flex items-center gap-2.5 border border-slate-100 dark:border-slate-700 animate-pulse-slow max-w-[200px]">
                        <div className="w-8 h-8 rounded-full bg-[#0500e2] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-md shadow-blue-900/20">
                            AI
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">New Coaching Tip</p>
                            <p className="text-[9px] text-slate-500 leading-tight truncate">"Improve closing tone..."</p>
                        </div>
                        <ArrowRight size={12} className="text-slate-400 ml-auto shrink-0" />
                    </div>

                </div>
            </div>
        </div>
      </section>

      {/* Logo Section */}
      <section className="py-12 border-t border-slate-100 dark:border-slate-900">
         <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-wrap justify-between items-center gap-8 grayscale opacity-60 hover:opacity-100 transition-opacity duration-500">
                <span className="text-2xl font-bold font-serif">Rakuten</span>
                <span className="text-2xl font-bold font-serif">NCR</span>
                <span className="text-2xl font-bold font-serif italic">monday<span className="font-sans not-italic font-normal">.com</span></span>
                <span className="text-3xl font-serif">Disney</span>
                <div className="flex items-center gap-2 font-bold text-xl"><span className="text-2xl">❖</span> Dropbox</div>
            </div>
         </div>
      </section>

      {/* Feature Highlight Section (Bonus) */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-4xl font-serif font-bold mb-4">Why Support Teams Choose Us</h2>
                <p className="text-slate-500">Automate 100% of your quality assurance and give your agents the feedback they need to thrive.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: "Instant Scoring", desc: "Get consistent scores in seconds.", icon: <Zap size={24} /> },
                    { title: "Bias Elimination", desc: "AI evaluates every chat fairly.", icon: <Shield size={24} /> },
                    { title: "Actionable Insights", desc: "Automated coaching tips for agents.", icon: <CheckCircle2 size={24} /> }
                ].map((item, i) => (
                    <div key={i} className="p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl hover:bg-[#0500e2] hover:text-white group transition-all duration-300 border border-slate-100 dark:border-slate-800 hover:border-transparent hover:shadow-xl hover:-translate-y-1">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6 text-black dark:text-white group-hover:text-[#0500e2] shadow-sm">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-slate-500 group-hover:text-blue-100 transition-colors">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

    </div>
  );
};