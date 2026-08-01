
import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, BarChart3, MessageSquare, Globe, Users, ArrowRight, CheckCircle2, Sparkles, Cpu, Clock, Layers, Megaphone, HeartHandshake, Headphones, Rocket, PenTool, Search, LayoutDashboard, History, Bell, Mic2, FileText } from 'lucide-react';

interface ProductPageProps {
  onSignupClick: () => void;
  onPricingClick?: () => void;
  onContactClick?: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ onSignupClick, onPricingClick, onContactClick }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] dark:text-[#4b53fa] px-4 py-2 rounded-full text-xs font-black mb-6 border border-blue-100 dark:border-blue-800/50 uppercase tracking-widest">
                <Sparkles size={16} />
                Now in Early Access
              </div>
              <h1 className="font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
                <span className="text-[45px] block">Master High-Stakes</span>
                <span className="text-[39px] text-[#0500e2] dark:text-[#4b53fa]">Practice with AI</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
                Revu is the ultimate AI roleplay arena for Sales and Support. Train your team with lifelike AI personas that simulate real objections, emotions, and difficult scenarios.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={onSignupClick}
                  id="hero-primary-cta"
                  className="w-full sm:w-auto bg-[#0500e2] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-blue-600/20"
                >
                  Start Your Training
                </button>
                <button 
                  onClick={onPricingClick}
                  id="hero-secondary-cta"
                  className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  View Plans
                </button>
              </div>
              
              <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0a0a0a] bg-slate-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?u=${i+20}`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-500 italic">Joining 500+ professionals training daily</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:pl-12"
            >
              <div className="max-w-lg mx-auto lg:ml-auto lg:mr-0 bg-[#0500e2] rounded-[2.5rem] p-3 shadow-2xl relative z-10 overflow-hidden">
                 <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-inner">
                    <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '51.2278%', paddingBottom: 0, overflow: 'hidden', willChange: 'transform' }}>
                      <iframe 
                        loading="lazy" 
                        style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
                        src="https://www.canva.com/design/DAHI6aRLI1k/cH81Nn10S0hWTHFmA2oyzQ/watch?embed" 
                        allowFullScreen
                        allow="fullscreen"
                        title="Revu AI Simulation Video"
                      />
                    </div>
                 </div>
                 <div className="mt-3 flex justify-center items-center px-4 pb-1">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-white fill-current opacity-70" />
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Simulate in Real-Time</span>
                    </div>
                 </div>
              </div>
              
              {/* Decorative Blur */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Roleplay Cycle */}
      <section className="py-24 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">The Success Loop</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-[17px]">
              Transform theory into muscle memory through repetitive, high-fidelity practice.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Build Your Persona", desc: "Choose or create a custom AI customer. Specify their mood, pain points, and specific objections they need to hit.", icon: <Users /> },
              { step: "02", title: "Simulate & Engage", desc: "Interact via voice or chat. The AI responds dynamically based on your questions, tone, and active listening skills.", icon: <MessageSquare /> },
              { step: "03", title: "Analyze & Improve", desc: "Get a detailed scorecard instantly. Review exactly where you missed an opportunity or handled a tough objection perfectly.", icon: <BarChart3 /> }
            ].map((item, idx) => (
              <div key={idx} className="relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                <div className="text-6xl font-black text-blue-100 dark:text-blue-900/20 absolute top-4 right-8">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6 text-[#0500e2] relative z-10">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                </div>
                <h3 className="text-xl font-black mb-3 relative z-10">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Role Play Practice Hub Section */}
      <section className="py-32 bg-[#fafafa] dark:bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-[54px] font-black mb-6 leading-[1.1] tracking-tight">AI Role Play Practice Hub</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Revu isn't just about scoring; it's about providing a safe space to fail fast, learn, and then win in the real world.
              </p>
            </div>
          </div>

          <div className="grid gap-32">
            {/* Feature 1: Agents train before they go live */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white p-2"
              >
                <img 
                  src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/AI%20training%20(1).png" 
                  alt="Agents training interface" 
                  className="w-full rounded-[2.5rem]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="lg:pl-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#0500e2] mb-6">
                  <Users size={24} />
                </div>
                <h3 className="text-3xl font-black mb-6 leading-tight">Agents train before they go live</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Practice real sales, support, and compliance scenarios with adaptive AI personas. Track XP, performance, and attempts—voice or chat, any language.
                </p>
              </div>
            </div>

            {/* Feature 2: Multilingual scenarios */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white p-2"
                >
                  <img 
                    src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Your%20Scenarios%20(2).png" 
                    alt="Multilingual scenarios" 
                    className="w-full rounded-[2.5rem]"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </div>
              <div className="lg:order-1 lg:pr-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6">
                  <Globe size={24} />
                </div>
                <h3 className="text-3xl font-black mb-6 leading-tight">Multilingual scenarios, voice and chat</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Sales objections, churn recovery, compliance scripts in Arabic, English, Spanish and beyond. Each scenario is difficulty-tagged so agents know what they're walking into.
                </p>
              </div>
            </div>

            {/* Feature 3: Custom Scenario Builder (Embed) */}
            <div className="bg-slate-900 rounded-[4rem] p-12 md:p-20 text-white overflow-hidden relative">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6">
                    <PenTool size={24} />
                  </div>
                  <h3 className="text-4xl font-black mb-6 leading-tight">Custom Scenario Builder</h3>
                  <p className="text-xl text-slate-300 mb-8 leading-relaxed font-medium">
                    Every contact center is different. So is every hard conversation.
                  </p>
                  <p className="text-slate-400 mb-10 leading-relaxed">
                    Build scenarios from your real playbooks, actual customer complaints, or upcoming product launches. Set the persona mood, difficulty, and language. Let your agents practice the exact conversations they'll face before they face them.
                  </p>
                </div>
                <div className="relative">
                  <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0500e2] p-2">
                    <div className="bg-white rounded-[2rem] overflow-hidden">
                      <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', paddingBottom: 0, overflow: 'hidden', willChange: 'transform' }}>
                        <iframe 
                          loading="lazy" 
                          style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
                          src="https://www.canva.com/design/DAHI6i06LDo/MI-_OCSRQscL6_QeyHUj4w/watch?embed" 
                          allowFullScreen
                          allow="fullscreen"
                          title="Custom Scenario Builder"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Score every call against your own rubric */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white p-2"
              >
                <img 
                  src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Customise%20your%20QA%20Rubrics%20(5).png" 
                  alt="Custom QA Rubrics" 
                  className="w-full rounded-[2.5rem]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="lg:pl-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6">
                  <FileText size={24} />
                </div>
                <h3 className="text-3xl font-black mb-6 leading-tight">Score every call against your own rubric</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Define criteria empathy, compliance, accuracy with weighted scores 1 to 10. Revu runs every call through automatically. No sampling. Nothing slips through.
                </p>
              </div>
            </div>

            {/* Feature 5: Analyze any conversation in seconds */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white p-2"
                >
                  <img 
                    src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Manual%20QA%20(4).png" 
                    alt="Analyze conversations" 
                    className="w-full rounded-[2.5rem]"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </div>
              <div className="lg:order-1 lg:pr-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#0500e2] mb-6">
                  <Search size={24} />
                </div>
                <h3 className="text-3xl font-black mb-6 leading-tight">Analyze any conversation in seconds</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Paste a transcript, upload a file, or stream live audio. The Intelligence Engine scores it instantly against your active rubric.
                </p>
              </div>
            </div>

            {/* Feature 6: Full visibility on every agent */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white p-2"
              >
                <img 
                  src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Monitor%20your%20team's%20performance%20(6).png" 
                  alt="Agent visibility leaderboard" 
                  className="w-full rounded-[2.5rem]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="lg:pl-8">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6">
                  <Users size={24} />
                </div>
                <h3 className="text-3xl font-black mb-6 leading-tight">Full visibility on every agent, every shift</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Ranked leaderboard with scores, sentiment breakdowns, and last active dates. Every coaching conversation starts from data, not gut feel.
                </p>
              </div>
            </div>

            {/* Feature 7 & 8: Grid layout for smaller features */}
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-8">
                <div>
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6">
                    <History size={24} />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Every session on record</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Full log of every training session and call evaluation. Filter by score, sentiment, or agent.</p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
                  <img src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Access%20your%20training%20and%20real%20call%3Achats%20(7).png" alt="Session history" className="w-full" referrerPolicy="no-referrer" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-8">
                <div>
                   <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 mb-6">
                    <Bell size={24} />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Instant alerts when analysis is done</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Managers and agents notified the moment a call or session is evaluated. Nothing urgent gets buried.</p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
                  <img src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Real%20time%20notifications%20for%20usage%20and%20performance%20trends%20(8).png" alt="Instant alerts" className="w-full" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            {/* Feature 9: Dashboard (Embed) */}
            <div className="bg-slate-50 dark:bg-[#111111] rounded-[4rem] p-12 md:p-20 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#0500e2] mx-auto mb-6">
                  <LayoutDashboard size={24} />
                </div>
                <h3 className="text-4xl font-black mb-6 leading-tight">The full picture, always current</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Track team-wide QA scores, spot performance dips before they become problems, and identify your top agents all from one screen. No manual reporting. No waiting for weekly reviews.
                </p>
              </div>
              <div className="max-w-4xl mx-auto">
                 <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 bg-white p-2">
                    <div className="bg-slate-100 rounded-[2rem] overflow-hidden">
                      <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', paddingBottom: 0, overflow: 'hidden', willChange: 'transform' }}>
                        <iframe 
                          loading="lazy" 
                          style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
                          src="https://www.canva.com/design/DAHI6rYjmhE/Nu9fzLlrGBaFN6j9RRpizg/watch?embed" 
                          allowFullScreen
                          allow="fullscreen"
                          title="Revu Dashboard"
                        />
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Feature 10: Realistic voices for every roleplay */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white p-2"
              >
                <img 
                  src="https://pub-3f89eefcccc34790a13b41ee21b7427f.r2.dev/Multilingual%20Text%20to%20Speech%20(9).png" 
                  alt="Realistic voice models" 
                  className="w-full rounded-[2.5rem]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="lg:pl-8">
                <div className="w-12 h-12 rounded-2xl bg-[#0500e2]/10 flex items-center justify-center text-[#0500e2] mb-6">
                  <Mic2 size={24} />
                </div>
                <h3 className="text-3xl font-black mb-6 leading-tight">Realistic voices for every roleplay</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Deepgram Aura and Gemini TTS. Dozens of voice models across Arabic, English, Spanish and more so every simulation feels real.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Target Focus: Sales & Service */}
      <section className="py-24 bg-[#0500e2] text-white overflow-hidden relative">
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6">One Tool, Two Powerhouses</h2>
              <p className="text-blue-100 max-w-2xl mx-auto text-lg leading-relaxed">
                Whether you're hunting for new revenue or defending existing churn, Revu makes your team elite.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[3rem] hover:bg-white/20 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#0500e2] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                     <Megaphone size={24} />
                  </div>
                  <h3 className="text-2xl font-black mb-4 select-none">Sales Excellence</h3>
                  <p className="text-blue-50 leading-relaxed font-medium mb-6">Master cold calling, discovery questions, and closing. Practice against "Gatekeepers" and "Indifferent Executives" until your pitch is bulletproof.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm font-bold text-blue-200">
                      <CheckCircle2 size={16} /> Objection Handling Mastery
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-blue-200">
                      <CheckCircle2 size={16} /> Discovery Call Simulations
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-blue-200">
                      <CheckCircle2 size={16} /> Pricing Negotiation Practice
                    </li>
                  </ul>
               </div>

               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[3rem] hover:bg-white/20 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                     <Headphones size={24} />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Service Superstars</h3>
                  <p className="text-blue-50 leading-relaxed font-medium mb-6">Master de-escalation, empathy, and technical troubleshooting. Practice against "Angry Users" and "Critical Churn Risks" in a zero-risk environment.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                      <CheckCircle2 size={16} /> De-escalation Simulations
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                      <CheckCircle2 size={16} /> Empathy & Soft-Skill Training
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                      <CheckCircle2 size={16} /> Churn Intervention Scripts
                    </li>
                  </ul>
               </div>
            </div>
         </div>
      </section>


      {/* Core Features */}
      <section className="py-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">The Tech Behind the Talent</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Proprietary AI models designed specifically for real-world conversational nuances.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <CapabilityCard 
              icon={<Zap className="text-yellow-500" />}
              title="Real-Time Sentiment"
              description="The AI detects frustration, hesitation, and excitement in your voice, adjusting its persona dynamically."
            />
            <CapabilityCard 
              icon={<Layers className="text-blue-500" />}
              title="Scenario Library"
              description="Get started with 100+ pre-built industry scenarios, from SaaS renewals to real estate walk-ins."
            />
            <CapabilityCard 
              icon={<Shield className="text-orange-500" />}
              title="Confidence Scoring"
              description="Proprietary metrics that track not just what you say, but how you say it. Build authentic authority."
            />
            <CapabilityCard 
              icon={<Globe className="text-indigo-500" />}
              title="Global Personas"
              description="Simulate calls in 50+ languages with culturally aware personas for your global expansion."
            />
            <CapabilityCard 
              icon={<Users className="text-emerald-500" />}
              title="Collaborative Review"
              description="Managers can shadow live roleplays and leave asynchronous voice notes on specific call segments."
            />
            <CapabilityCard 
              icon={<HeartHandshake className="text-purple-500" />}
              title="Auto QA Link"
              description="Connect Revu Training to our Auto QA engine to see if trainee performance translates to real calls."
            />
          </div>
        </div>
      </section>

      {/* Product Stage Section */}
      <section className="py-24 bg-[#fafafa] dark:bg-[#080808] border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] dark:text-[#4b53fa] px-4 py-2 rounded-full text-xs font-black mb-6 border border-blue-100 dark:border-blue-800/50 uppercase tracking-widest">
              Revu Roadmap
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">What's live. What's next.</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Revu is in Early Access. Core AI Roleplay and QA are live and working with real customers today.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Live Now Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-10 md:p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 shadow-xl shadow-blue-500/5 overflow-hidden"
            >
              <div className="relative z-10">
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#0500e2] mb-6 shadow-sm">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Live now — Early Access</h3>
                  <p className="text-[#0500e2] font-black text-xs uppercase tracking-widest">Available today</p>
                </div>

                <ul className="space-y-4 mt-10">
                  {[
                    "AI Roleplay Training — voice and chat simulations with adaptive personas",
                    "Custom scenario builder — create and assign training scenarios",
                    "Automated QA scoring via transcript, file upload, or live audio",
                    "Custom scorecard builder — weighted QA criteria, fully configurable",
                    "Evaluation history — full log of all sessions and scores",
                    "Team Roster — agent rankings, sentiment breakdowns, and benchmarking",
                    "Real-time notifications for completed evaluations and critical flags",
                    "Multilingual TTS — Deepgram Aura and Gemini voice models"
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-4 text-slate-600 dark:text-slate-400 font-medium leading-tight">
                      <CheckCircle2 size={18} className="text-[#0500e2] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Coming Soon Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative p-10 md:p-12 rounded-[3.5rem] bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="relative z-10">
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
                    <Rocket size={28} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Coming soon</h3>
                  <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">In development</p>
                </div>

                <ul className="space-y-4 mt-10">
                  {[
                    "Native Aircall, Twilio, and Zendesk call ingestion — zero-touch pipeline",
                    "Agent self-serve dashboard — personal coaching plan and progress view",
                    "Manager analytics dashboard — team-wide trends and compliance risk flags",
                    "Automated coaching recommendations tied to real call gaps",
                    "Expanded language support — French, Hindi, Turkish and more",
                    "Scenario generation from real call recordings",
                    "White-label and partner program portal",
                    "Enterprise SSO and admin controls",
                    "Mobile app for on-the-go agent training"
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-4 text-slate-500 dark:text-slate-500 font-medium leading-tight">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#0500e2] dark:bg-[#4b53fa] rounded-[3.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/40">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 relative z-10">Stop Practicing on <br />Live Customers</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto relative z-10">
                Give your team the space to fail safely and get better faster. Start your AI Roleplay journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button 
                onClick={onSignupClick}
                id="cta-bottom-signup"
                className="bg-white text-[#0500e2] px-12 py-5 rounded-3xl text-xl font-bold hover:scale-105 transition-all shadow-xl"
              >
                Sign Up for Free
              </button>
              <button 
                id="cta-bottom-demo" 
                onClick={onContactClick}
                className="bg-blue-700/50 text-white border border-blue-400/30 px-12 py-5 rounded-3xl text-xl font-bold hover:bg-blue-700/70 transition-all"
              >
                Speak to an Expert
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
