
import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, BarChart3, MessageSquare, Globe, Users, ArrowRight, CheckCircle2, Sparkles, Cpu, Clock, Layers, Megaphone, HeartHandshake, Headphones } from 'lucide-react';

interface ProductPageProps {
  onSignupClick: () => void;
  onPricingClick?: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ onSignupClick, onPricingClick }) => {
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
                <Sparkles size={14} />
                Now in Early Access
              </div>
              <h1 className="font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
                <span className="text-[45px] block">Master High-Stakes</span>
                <span className="text-[39px] text-[#0500e2] dark:text-[#4b53fa]">Conversations with AI</span>
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
              className="relative"
            >
              <div className="bg-[#0500e2] rounded-[3rem] p-4 shadow-2xl relative z-10 overflow-hidden group">
                 <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-video flex items-center justify-center relative">
                    <img 
                      src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2000&auto=format&fit=crop" 
                      alt="AI Training Simulation" 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
                    <div className="relative z-20 flex flex-col items-center">
                       <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 cursor-pointer hover:scale-110 transition-all">
                          <Zap size={40} className="fill-current" />
                       </div>
                       <span className="mt-4 font-black text-white uppercase tracking-widest text-xs">Simulate in Real-Time</span>
                    </div>
                 </div>
              </div>
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

      {/* Product Proof Section */}
      <section className="py-32 bg-[#fafafa] dark:bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Lifelike Training Ground</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Revu isn't just about scoring; it's about providing a safe space to fail fast, learn, and then win in the real world.
              </p>
            </div>
          </div>

          <div className="grid gap-24">
            {/* Persona Builder UI */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <div className="mx-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">Persona Builder - High Net Worth Skeptic</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2">
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bbda38a5f452?q=80&w=2000&auto=format&fit=crop" 
                      alt="AI Persona Configuration screen" 
                      className="w-full rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
               </div>
               <div>
                  <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] rounded-2xl mb-6">
                    <Cpu size={24} />
                  </div>
                  <h3 className="text-3xl font-black mb-6">Unlimited Persona Combinations</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    Create the "Angry Tier 1 Customer" or the "Fortune 500 Procurement Lead." Define their budget constraints, personality traits (skeptical, friendly, logical), and the exact traps they should set for your team.
                  </p>
                  <blockquote className="border-l-4 border-[#0500e2] pl-6 italic text-slate-500 dark:text-slate-400">
                    "Set specific goals for the trainee: 'Get them to agree to a 15-minute demo despite the price objection.'"
                  </blockquote>
               </div>
            </div>

            {/* Analysis UI */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="lg:order-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <div className="mx-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback Loop - Objection Handling</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2">
                    <img 
                      src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2000&auto=format&fit=crop" 
                      alt="Post-roleplay analytics dashboard" 
                      className="w-full rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
               </div>
               <div className="lg:order-1">
                  <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl mb-6">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="text-3xl font-black mb-6">Instant Post-Session Debrief</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    Immediately after the call, Revu highlights how you handled every turn. It identifies missed empathy cues, pricing mishandlings, and provides a 'Re-do' suggestion for specific moments.
                  </p>
                  <blockquote className="border-l-4 border-emerald-500 pl-6 italic text-slate-500 dark:text-slate-400">
                    "The AI caught that I didn't acknowledge their budget concern before pivoting to features. Game changer for our junior reps."
                  </blockquote>
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
              <button id="cta-bottom-demo" className="bg-blue-700/50 text-white border border-blue-400/30 px-12 py-5 rounded-3xl text-xl font-bold hover:bg-blue-700/70 transition-all">
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
