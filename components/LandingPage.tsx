import React from 'react';
import { Star, ArrowRight, ArrowUpRight, Check, Shield, Zap, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

const RevuLogo = ({ className = "h-8" }: { className?: string }) => (
  <svg viewBox="0 0 146 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22 11C22 11 20.5 0 7.5 0C-5.5 0 -0.5 22 -0.5 22C-0.5 38 2.5 44 15.5 44H20V28H24L28 44H39L34 25C34 25 40 22 40 14C40 6 30 11 30 11H22V21H12V11H22Z" fill="#0500E2"/>
    <path d="M12 17L15 20L21 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M47 23C47 15 52 11 60 11C67 11 71 15 72 21H58C58 24 60 26 62 26C64 26 65 25 66 24H75C74 31 68 34 61 34C52 34 47 28 47 23ZM62 19C60 19 58 20 58 22H66C66 20 64 19 62 19Z" fill="#0500E2"/>
    <path d="M80 11H90L96 30L102 11H112L101 43H91L80 11Z" fill="#0500E2"/>
    <path d="M119 11H129V29C129 30 131 31 132 31C134 31 135 30 135 29V11H145V28C145 38 141 40 135 40C131 40 128 39 126 37L123 42L119 40V11Z" fill="#0500E2"/>
  </svg>
);

const StarBorderButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
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
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto w-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
            <RevuLogo className="h-8" />
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
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
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
                    <div className="flex items-center gap-3">
                        <RevuLogo className="h-6" />
                    </div>
                    <a href="#" onClick={(e) => { e.preventDefault(); onEnterApp(); }} className="flex items-center gap-1 text-sm font-medium hover:underline">
                        Read Story <ArrowUpRight size={14} />
                    </a>
                </div>

                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-light leading-relaxed max-w-lg">
                    “ The Best Platform To Use For Automating Support QA and Coaching, Highly Recommend ”
                </p>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden border-2 border-white dark:border-slate-900">
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

            {/* Right Column: Visuals */}
            <div className="relative min-h-[500px] flex items-center justify-center perspective-1000">
                {/* Abstract Background Blur */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 via-purple-200 to-orange-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-blue-900/20 rounded-[3rem] blur-xl opacity-60"></div>
                <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover rounded-[3rem] opacity-30 mix-blend-overlay"
                    alt="Abstract"
                />

                {/* Main Card */}
                <div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 p-6 rounded-3xl shadow-2xl w-full max-w-md transform transition-transform hover:scale-[1.02] duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Shield size={20} className="text-[#0500e2]" />
                             </div>
                             <div>
                                 <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Evaluation</p>
                                 <p className="font-bold text-lg">Agent Performance</p>
                             </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center text-white shadow-lg shadow-green-400/30">
                            <Check size={24} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="space-y-6">
                         <div>
                             <p className="text-xs text-slate-400 mb-1">Agent Name</p>
                             <div className="text-2xl font-mono tracking-tight font-medium">Jenifer Lawrence</div>
                         </div>
                         
                         <div className="flex justify-between items-end">
                             <div>
                                <p className="text-xs text-slate-400 mb-1">QA Score</p>
                                <div className="text-xl font-medium">98/100</div>
                             </div>
                             <div>
                                <p className="text-xs text-slate-400 mb-1">Sentiment</p>
                                <div className="text-xl font-medium">Positive</div>
                             </div>
                             <div>
                                <p className="text-xs text-slate-400 mb-1">Date</p>
                                <div className="text-xl font-medium">Oct 24</div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Floating Element Top */}
                <div className="absolute -top-6 right-8 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slow border border-slate-100 dark:border-slate-700">
                    <div className="font-bold text-sm">Jenifer <span className="text-slate-400">scored</span> 98/100 <span className="text-slate-400">on Empathy</span></div>
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                        <Check size={14} />
                    </div>
                    <ArrowUpRight size={14} className="text-slate-400" />
                </div>

                 {/* Floating Element Bottom */}
                 <div className="absolute -bottom-8 left-0 md:left-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 pr-6 rounded-full shadow-xl flex items-center gap-4 border border-slate-100 dark:border-slate-700 animate-pulse-slow">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">New Coaching Tip Available</p>
                        <p className="text-xs text-slate-500">"Great job handling the objection..."</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                        <span className="font-bold text-xs">!</span>
                    </div>
                    <ArrowRight size={14} />
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
                    <div key={i} className="p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl hover:bg-[#0500e2] hover:text-white group transition-all duration-300">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6 text-black dark:text-white group-hover:text-[#0500e2]">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-slate-500 group-hover:text-blue-100">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

    </div>
  );
};