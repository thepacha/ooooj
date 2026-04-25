import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Revu AI - Quality Assurance & Coaching Insights',
  description: 'Revu AI automates transcript scoring and provides actionable coaching insights for modern support teams. Get started for free today.',
  keywords: ['AI QA', 'Quality Assurance', 'Transcript Scoring', 'Coaching Insights', 'Support Team Performance'],
  openGraph: {
    title: 'Revu AI - Quality Assurance & Coaching Insights',
    description: 'Revu AI automates transcript scoring and provides actionable coaching insights for modern support teams.',
    url: 'https://revuqai.com/landing-v2',
    siteName: 'Revu AI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function LandingPageV2() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">R</div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">REVU</span>
          </div>
          <div className="hidden md:flex gap-10 items-center font-semibold text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="https://app.revuqai.com/login" className="text-slate-900 hover:text-blue-600 transition-colors">Login</Link>
            <Link href="https://app.revuqai.com/signup" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-8 border border-blue-100">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Powered by Gemini 3 Flash
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.05]">
            Quality Assurance <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Automated by AI</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Stop manually reviewing transcripts. Revu AI analyzes every interaction, 
            scores them against your rubrics, and identifies coaching opportunities in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="https://app.revuqai.com/signup" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
              Start Your Free Trial
            </Link>
            <Link href="#demo" className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all">
              Watch Product Tour
            </Link>
          </div>
          
          {/* Dashboard Preview Placeholder */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl rounded-[3rem] -z-10"></div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden aspect-video flex items-center justify-center text-slate-300 font-mono text-sm">
              [ Interactive Dashboard Preview ]
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Everything you need to scale QA</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Powerful tools designed to help your team deliver consistent, high-quality support.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Automated Scoring',
                desc: 'Upload transcripts and get instant scores based on your custom quality rubrics.',
                icon: '⚡'
              },
              {
                title: 'Coaching Insights',
                desc: 'AI identifies specific areas for improvement and provides actionable feedback for agents.',
                icon: '💡'
              },
              {
                title: 'Trend Analysis',
                desc: 'Track performance over time across teams, agents, and specific quality metrics.',
                icon: '📈'
              }
            ].map((feature, i) => (
              <article key={i} className="p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:border-blue-200 transition-colors group">
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / CTA */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#1e293b,transparent)] opacity-50"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Ready to transform your quality assurance?</h2>
          <p className="text-xl text-slate-400 mb-12">Join hundreds of teams using Revu AI to deliver world-class customer experiences.</p>
          <Link href="https://app.revuqai.com/signup" className="inline-block bg-blue-600 text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20">
            Get Started for Free
          </Link>
          <p className="mt-6 text-slate-500 text-sm">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">R</div>
                <span className="text-xl font-bold tracking-tight text-slate-900">REVU</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">
                Empowering support teams with AI-driven quality assurance and actionable coaching insights.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500">
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/landing-v2" className="text-blue-600 font-semibold">Landing V2</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500">
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>© 2026 Revu AI. Built with Gemini 3 Flash.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-slate-900 transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
