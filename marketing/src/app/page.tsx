import React from 'react';
import Link from 'next/link';

export default function LandingPageV1() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">REVU</div>
        <div className="flex gap-8 items-center font-medium">
          <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="https://app.revuqai.com/login" className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all">
            Sign In
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          AI-Powered Quality Assurance for <span className="text-blue-600">Modern Teams</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Automate transcript scoring, get actionable coaching insights, and track team performance with Gemini 3 Flash.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="https://app.revuqai.com/signup" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            Start Free Trial
          </Link>
          <Link href="#features" className="bg-slate-100 text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-200 transition-all">
            View Demo
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-sm text-slate-500">
          <div>© 2026 Revu AI. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/landing-v2" className="hover:text-blue-600 transition-colors">Try Landing V2 (Beta)</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
