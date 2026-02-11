
import React from 'react';
import { PublicNavigation } from './PublicNavigation';
import { ArrowLeft } from 'lucide-react';

interface RefundPolicyProps {
  onBack: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBack, onLogin, onSignup, onPricing }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 animate-fade-in">
      <PublicNavigation 
        onLanding={onBack}
        onLogin={onLogin}
        onSignup={onSignup}
        onPricing={onPricing}
        activePage="landing" 
      />

      <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
        <button 
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors font-bold text-sm"
        >
            <ArrowLeft size={16} /> Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Refund Policy</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-12">Latest update: {new Date().toLocaleDateString()}</p>

        <div className="space-y-12 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7-Day Money-Back Guarantee</h2>
                <p>
                    We want you to be completely satisfied with RevuQA AI. Our policy is simple: if you are not satisfied with your subscription for any reason, you may request a <strong>full refund within 7 calendar days</strong> of your initial purchase.
                </p>
                <p className="mt-4">
                    This guarantee applies to all subscription plans (Starter, Pro, and Scale), whether billed monthly or annually. If you cancel your account within this 7-day window and request a refund, we will reverse the charge on your payment method.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">No Refunds After 7 Days</h2>
                <p>
                    After the initial 7-day period has passed, <strong>we do not offer refunds</strong> for any partial subscription periods, unused service credits, or accidentally renewed subscriptions.
                </p>
                <p className="mt-4">
                    You may cancel your subscription at any time. If you cancel after the 7-day window, your account will remain active and you will continue to have access to the Service until the end of your current billing cycle. You will not be charged again, but previous payments are non-refundable.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">How to Request a Refund</h2>
                <p>
                    To request a refund within the 7-day window, please contact our billing support team:
                </p>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mt-4 shadow-sm">
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">Email:</span> 
                            <a href="mailto:billing@revuqai.com" className="text-[#0500e2] hover:underline">billing@revuqai.com</a>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">Subject Line:</span> 
                            <span>"Refund Request"</span>
                        </li>
                        <li>
                            <span className="font-bold text-slate-900 dark:text-white">Include:</span> Your account email address and date of purchase.
                        </li>
                    </ul>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Processing Time</h2>
                <p>
                    Refund requests are typically reviewed and processed within 2-3 business days. Once processed, it may take 5-10 business days for the funds to appear on your bank statement, depending on your financial institution's processing times.
                </p>
            </section>
        </div>
      </div>
    </div>
  );
};
