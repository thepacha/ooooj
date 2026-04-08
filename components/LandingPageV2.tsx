import React from 'react';
import { motion } from 'motion/react';
import { RevuLogo } from './RevuLogo';
import { ArrowRight, CheckCircle2, Zap, BarChart3, MessageSquare, Shield, Globe, Users } from 'lucide-react';

interface LandingPageV2Props {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export const LandingPageV2: React.FC<LandingPageV2Props> = ({ onLoginClick, onSignupClick }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RevuLogo className="h-8 w-auto text-[#0500e2] dark:text-[#4b53fa]" />
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">REVU</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors">Features</a>
            <a href="#solutions" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors">Solutions</a>
            <button onClick={onLoginClick} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors">Login</button>
            <button 
              onClick={onSignupClick}
              className="bg-[#0500e2] dark:bg-[#4b53fa] text-white px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-600/20"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] dark:text-[#4b53fa] px-4 py-2 rounded-full text-xs font-black mb-8 border border-blue-100 dark:border-blue-800/50 uppercase tracking-widest"
          >
            <Sparkles size={14} />
            Next-Gen Quality Assurance
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]"
          >
            Scale Quality <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0500e2] to-[#4b53fa]">Without the Effort</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Revu AI uses advanced language models to analyze 100% of your customer interactions. 
            Get instant scores, coaching insights, and performance trends automatically.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              onClick={onSignupClick}
              className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-3xl text-lg font-bold hover:scale-105 transition-all shadow-2xl shadow-slate-900/10"
            >
              Start Free Trial
            </button>
            <button className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-3xl text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              Book a Demo
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-20 border-y border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Interactions Analyzed', value: '10M+' },
              { label: 'Time Saved', value: '85%' },
              { label: 'Accuracy Rate', value: '99.2%' },
              { label: 'Active Teams', value: '500+' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6">Built for High-Performance Teams</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Everything you need to automate your QA workflow and drive agent performance.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Automated Scoring',
                desc: 'Upload transcripts and get instant scores based on your custom quality rubrics.',
                icon: <Zap className="text-blue-600" size={32} />
              },
              {
                title: 'Coaching Insights',
                desc: 'AI identifies specific areas for improvement and provides actionable feedback for agents.',
                icon: <MessageSquare className="text-indigo-600" size={32} />
              },
              {
                title: 'Trend Analysis',
                desc: 'Track performance over time across teams, agents, and specific quality metrics.',
                icon: <BarChart3 className="text-emerald-600" size={32} />
              },
              {
                title: 'Global Support',
                desc: 'Native support for over 50 languages with high-accuracy transcription and analysis.',
                icon: <Globe className="text-orange-600" size={32} />
              },
              {
                title: 'Team Collaboration',
                desc: 'Share insights, leave comments, and track coaching progress in one unified platform.',
                icon: <Users className="text-purple-600" size={32} />
              },
              {
                title: 'Enterprise Security',
                desc: 'Bank-grade encryption and SOC2 compliance to keep your customer data safe.',
                icon: <Shield className="text-red-600" size={32} />
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0500e2] dark:bg-[#4b53fa] rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 relative z-10">Ready to automate your QA?</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto relative z-10">
              Join forward-thinking support teams who are scaling quality with Revu AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button 
                onClick={onSignupClick}
                className="bg-white text-[#0500e2] px-12 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-all shadow-xl"
              >
                Get Started Free
              </button>
              <button className="bg-blue-700/50 text-white border border-blue-400/30 px-12 py-5 rounded-2xl text-xl font-bold hover:bg-blue-700/70 transition-all">
                Talk to Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <RevuLogo className="h-6 w-auto text-[#0500e2] dark:text-[#4b53fa]" />
            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">REVU</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
          </div>
          <div className="text-sm text-slate-400 dark:text-slate-600">
            © 2026 RevuQA AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const Sparkles = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" />
  </svg>
);
