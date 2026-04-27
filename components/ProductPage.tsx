
import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, BarChart3, MessageSquare, Globe, Users, ArrowRight, CheckCircle2, Sparkles, Cpu, Clock, Layers } from 'lucide-react';

interface ProductPageProps {
  onSignupClick: () => void;
  onPricingClick?: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ onSignupClick, onPricingClick }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] dark:text-[#4b53fa] px-4 py-2 rounded-full text-xs font-black mb-6 border border-blue-100 dark:border-blue-800/50 uppercase tracking-widest">
                <Cpu size={14} />
                AI-Powered QA Platform
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
                Complete Quality <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0500e2] to-[#4b53fa]">Control at Scale</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
                Moving beyond random sampling. Revu AI analyzes every single interaction, providing 100% coverage and actionable insights automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onSignupClick}
                  className="bg-[#0500e2] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-blue-600/20"
                >
                  Start Your Free Trial
                </button>
                <button 
                  onClick={onPricingClick}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  View Pricing
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-4 shadow-2xl relative z-10 overflow-hidden">
                 <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-video flex items-center justify-center p-8">
                    <div className="w-full space-y-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-1/2"></div>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center gap-2">
                                <div className="text-[#0500e2] font-black text-xl">98%</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
                            </div>
                            <div className="h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center justify-center gap-2">
                                <div className="text-indigo-600 font-black text-xl">100%</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400">Coverage</div>
                            </div>
                            <div className="h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-center justify-center gap-2">
                                <div className="text-emerald-600 font-black text-xl">10min</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400">Analysis</div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400/20 blur-2xl rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl z-20 border border-slate-100 dark:border-slate-700 max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-xl">
                        <Zap size={20} />
                    </div>
                    <span className="font-bold text-sm">Real-time</span>
                </div>
                <p className="text-xs text-slate-500">Analysis results delivered instantly after upload.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Designed for Every Workflow</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Powerful tools that integrate directly into your support ecosystem to drive excellence without friction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <CapabilityCard 
              icon={<Zap className="text-yellow-500" />}
              title="Automated Scoring"
              description="Eliminate bias with objective AI scoring based on your specific quality criteria and business goals."
            />
            <CapabilityCard 
              icon={<Layers className="text-blue-500" />}
              title="Bulk Analysis"
              description="Analyze thousands of calls and chats simultaneously. Scale your QA from 2% to 100% overnight."
            />
            <CapabilityCard 
              icon={<MessageSquare className="text-indigo-500" />}
              title="Actionable Coaching"
              description="AI doesn't just score; it explains. Get hyper-specific coaching notes for every agent behavior."
            />
            <CapabilityCard 
              icon={<Globe className="text-orange-500" />}
              title="Multi-Lingual Support"
              description="Support for 50+ languages natively. Quality assurance that transcends borders and cultures."
            />
            <CapabilityCard 
              icon={<Shield className="text-emerald-500" />}
              title="Enterprise Grade"
              description="Full SOC2 compliance and PII redaction. Your customer data remains private and secure."
            />
            <CapabilityCard 
              icon={<BarChart3 className="text-purple-500" />}
              title="Executive Dashboard"
              description="Visual reporting for team leads and executives. Track trends and ROI in real-time."
            />
          </div>
        </div>
      </section>

      {/* Detailed Feature Sections */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 order-2 lg:order-1">
              <div className="w-16 h-16 rounded-[2rem] bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-8 text-[#0500e2] dark:text-[#4b53fa]">
                <Clock size={32} />
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-6">Analyze 100% of Calls <br />In Minutes</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Stop wasting time manually listening to random calls. Revu AI processes hours of audio in seconds, identifying compliance risks, sentiment shifts, and sales opportunities instantly.
              </p>
              <ul className="space-y-4">
                <FeatureItem text="Instant transcription with 95%+ accuracy" />
                <FeatureItem text="Automated sentiment mapping" />
                <FeatureItem text="Speaker diarization (Agent vs Customer)" />
              </ul>
            </div>
            <div className="flex-1 order-1 lg:order-2">
                <div className="relative p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="font-black text-xl">Transcript Preview</div>
                            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold uppercase">Processing...</div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-4/5"></div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 bg-blue-100/50 dark:bg-blue-900/10 rounded-full w-full"></div>
                                    <div className="h-3 bg-blue-100/50 dark:bg-blue-900/10 rounded-full w-3/4"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Animated Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-slate-950/80 to-transparent flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-500 backdrop-blur-[2px]">
                        <button onClick={onSignupClick} className="bg-[#0500e2] text-white px-8 py-4 rounded-2xl font-bold shadow-xl">See Full Dashboard</button>
                    </div>
                </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800/50">
                        <div className="text-3xl font-black text-[#0500e2] mb-2">+42%</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-tight">Agent Performance</div>
                    </div>
                    <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50 mt-8">
                        <div className="text-3xl font-black text-emerald-600 mb-2">-80%</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-tight">QA Overhead</div>
                    </div>
                </div>
            </div>
            <div className="flex-1 lg:order-2">
              <div className="w-16 h-16 rounded-[2rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-8 text-emerald-600">
                <Zap size={32} />
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-6">Drive Revenue Through <br />Quality</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Better quality means better outcomes. Revu AI identifies why your top performers are winning and helps you replicate that success across your entire team.
              </p>
              <ul className="space-y-4">
                <FeatureItem text="Identification of sales objections & winners" />
                <FeatureItem text="Automated coaching workflows" />
                <FeatureItem text="Performance tracking over time" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#0500e2] dark:bg-[#4b53fa] rounded-[3.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 relative z-10">Start Scaling Quality <br />Today</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto relative z-10">
                Revu AI is ready to help you transform your support into a high-performance engine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button 
                onClick={onSignupClick}
                className="bg-white text-[#0500e2] px-12 py-5 rounded-3xl text-xl font-bold hover:scale-105 transition-all shadow-xl"
              >
                Join Revu AI
              </button>
              <button className="bg-blue-700/50 text-white border border-blue-400/30 px-12 py-5 rounded-3xl text-xl font-bold hover:bg-blue-700/70 transition-all">
                Book Personalized Demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const CapabilityCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
  >
    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8">
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium">{description}</p>
  </motion.div>
);

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3">
    <div className="p-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-full">
      <CheckCircle2 size={18} />
    </div>
    <span className="text-slate-700 dark:text-slate-300 font-medium">{text}</span>
  </li>
);
