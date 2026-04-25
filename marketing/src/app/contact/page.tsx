"use client";

import React, { useState } from 'react';
import { PublicNavigation } from '@/components/PublicNavigation';
import { Footer } from '@/components/Footer';
import { Mail, MapPin, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    topic: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      setErrorMessage(null);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', company: '', topic: '', message: '' });
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Submission failed");
        setStatus('error');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setErrorMessage(error.message || "Something went wrong");
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col font-sans selection:bg-[#0500e2] selection:text-white">
      <PublicNavigation />

      <div className="flex-1 w-full pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[800px] h-[800px] bg-[#0500e2]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative z-10">
          
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] dark:text-blue-400 font-semibold text-sm mb-6 w-fit border border-blue-100 dark:border-blue-800/30">
              <MessageSquare size={16} />
              We're here to help
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Let's build <br/><span className="text-[#0500e2]">something great.</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-lg leading-relaxed">
              Have questions about RevuQA, pricing, or need technical support? 
              Our team is ready to provide you with the answers you need to scale your QA processes.
            </p>

            <div className="space-y-8">
              <div className="group flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border dark:border-slate-800 flex items-center justify-center text-[#0500e2] group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#0500e2]/10 transition-all">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-older mb-1">Email Support</h3>
                  <a href="mailto:support@revuqai.com" className="text-xl font-semibold text-slate-900 dark:text-white hover:text-[#0500e2] transition-colors">
                    support@revuqai.com
                  </a>
                  <p className="text-sm text-slate-500 mt-1">We aim to respond within 24 hours.</p>
                </div>
              </div>

              <div className="group flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border dark:border-slate-800 flex items-center justify-center text-[#0500e2] group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#0500e2]/10 transition-all">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-older mb-1">Headquarters</h3>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    Remote Based
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Serving modern QA teams globally.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="w-full max-w-xl lg:ml-auto animate-in zoom-in-95 duration-500 delay-100">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-8 lg:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0500e2] to-sky-400" />
              
              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                  <p className="text-slate-500 mb-8">We've received your request and will get back to you shortly at {formData.email}.</p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="text-[#0500e2] font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-semibold text-slate-900 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text" 
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent transition-all placeholder:text-slate-400 disabled:opacity-50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-semibold text-slate-900 dark:text-slate-300">Work Email <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="email" 
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        placeholder="john@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent transition-all placeholder:text-slate-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="topic" className="text-sm font-semibold text-slate-900 dark:text-slate-300">Topic <span className="text-red-500">*</span></label>
                      <select
                        required
                        id="topic"
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent transition-all disabled:opacity-50 appearance-none"
                      >
                        <option value="" disabled>Select a topic</option>
                        <option value="sales">Sales</option>
                        <option value="support">Technical Support</option>
                        <option value="partnerships">Partnerships</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="company" className="text-sm font-semibold text-slate-900 dark:text-slate-300">Company Name <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text" 
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        placeholder="Acme Corp"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent transition-all placeholder:text-slate-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-sm font-semibold text-slate-900 dark:text-slate-300">How can we help? <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      disabled={status === 'loading'}
                      placeholder="Tell us about your needs..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0500e2] focus:border-transparent transition-all placeholder:text-slate-400 resize-none disabled:opacity-50"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="text-red-500 text-sm font-medium p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      {errorMessage || "Something went wrong. Please try again or email us directly at support@revuqai.com."}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="mt-2 w-full bg-[#0500e2] hover:bg-[#0400c0] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-[#0500e2]/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Message
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-slate-500">
                    By submitting this form, you agree to our <Link href="/privacy" className="underline hover:text-slate-900">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
