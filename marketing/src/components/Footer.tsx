import React from 'react';
import Link from 'next/link';
import { RevuLogo } from './RevuLogo';

export const Footer = () => {
  return (
      <footer className="bg-[#f5f4f0] dark:bg-[#0a0a0a] pt-20 pb-10 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa] mb-6">
                        <RevuLogo className="h-6 w-auto" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
                        RevuQA AI helps you simulate realistic scenarios and train your team with advanced artificial intelligence.
                    </p>
                </div>
                
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Product</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Features</Link></li>
                        <li><Link href="/pricing" className="hover:text-[#0500e2] transition-colors">Pricing</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Security</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Roadmap</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Company</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">About Us</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Careers</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Blog</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Partners</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Resources</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Help Center</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">API Documentation</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Community</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Status</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Legal</h4>
                    <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Terms of Service</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/" className="hover:text-[#0500e2] transition-colors">Refund Policy</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} RevuQA AI app. All rights reserved.</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    All systems operational
                </div>
            </div>
        </div>
      </footer>
  );
};
