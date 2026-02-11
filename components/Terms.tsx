
import React from 'react';
import { PublicNavigation } from './PublicNavigation';
import { ArrowLeft } from 'lucide-react';

interface TermsProps {
  onBack: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
}

export const Terms: React.FC<TermsProps> = ({ onBack, onLogin, onSignup, onPricing }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 animate-fade-in">
      <PublicNavigation 
        onLanding={onBack}
        onLogin={onLogin}
        onSignup={onSignup}
        onPricing={onPricing}
        activePage="landing" // Keep generic
      />

      <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
        <button 
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#0500e2] dark:hover:text-[#4b53fa] transition-colors font-bold text-sm"
        >
            <ArrowLeft size={16} /> Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Terms of Service</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-12">Latest update: {new Date().toLocaleDateString()}</p>

        <div className="space-y-12 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
                <p>
                    These Terms and Conditions ("Terms", "Terms and Conditions") govern your relationship with the RevuQA AI website and application (the "Service") operated by Mohamed Abdelmaguid ("us", "we", or "our").
                </p>
                <p className="mt-4">
                    Please read these Terms and Conditions carefully before using the Service. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
                </p>
                <p className="mt-4">
                    By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Subscriptions & Service Credits</h2>
                <p>
                    Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
                </p>
                <p className="mt-4">
                    <strong>Service Credits:</strong> Our Service operates on a usage-based credit system (e.g., analyzing a transcript consumes specific credits). Credits allocated via a monthly Subscription do not roll over to the next month. They reset at the beginning of each new Billing Cycle. Additional "Top-Up" credits purchased separately do not expire as long as your account remains active.
                </p>
                <p className="mt-4">
                    At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you turn off the auto-renewal function ("Auto Renewal") or unless we cancel it. You may cancel your Subscription renewal either through your online account management page or by contacting our customer support team.
                </p>
                <p className="mt-4">
                    A valid payment method, including credit card, is required to process the payment for your Subscription. By submitting such payment information, you automatically authorize us to charge all Subscription fees incurred through your account to any such payment instruments.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">AI Analysis & Accuracy Disclaimer</h2>
                <p>
                    RevuQA AI utilizes advanced artificial intelligence models (including Google Gemini) to analyze text and audio. While we strive for high accuracy, AI models can occasionally produce incorrect, misleading, or biased results ("hallucinations").
                </p>
                <p className="mt-4">
                    <strong>Human Review:</strong> The Service is designed to assist, not replace, human judgment. You agree that you are responsible for reviewing AI-generated scores, summaries, and coaching tips before making significant business decisions (such as hiring, firing, or disciplinary actions). We are not liable for actions taken based solely on AI analysis.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Data & Content</h2>
                <p>
                    You retain any and all of your rights to any Content (text transcripts, audio files) you submit, post or display on or through the Service and you are responsible for protecting those rights.
                </p>
                <p className="mt-4">
                    You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.
                </p>
                <p className="mt-4">
                    <strong>Compliance with Recording Laws:</strong> You acknowledge that you are solely responsible for complying with all applicable laws regarding the recording of communications (wiretapping laws) in your jurisdiction and the jurisdiction of your customers. You warrant that you have obtained all necessary consents from all parties involved in the audio files uploaded to the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Acceptable Use</h2>
                <p>
                    Our software is intended for business users only. By using our software, you represent and warrant that you are using it for business purposes only and not for personal, individual, or household use.
                </p>
                <p className="mt-4">
                    You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Analyze illegal content or hate speech.</li>
                    <li>Reverse engineer, decompile, disassemble, or derive the source code of the App.</li>
                    <li>Attempt to circumvent rate limiting or security features.</li>
                </ul>
                <p className="mt-4">
                    We reserve the right to terminate your use of the software and your account if we determine you are using the Service for prohibited purposes.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Refunds</h2>
                <p>
                    Except when required by law, paid Subscription fees are non-refundable. Customers based in the European Union have a right of withdrawal of 14 days starting from the date of purchase of digital goods, provided the service has not been fully performed.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Limitation Of Liability</h2>
                <p>
                    In no event shall Mohamed Abdelmaguid, nor his directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Changes</h2>
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
                <p className="mt-4">
                    By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
                <p>
                    If you have any questions about these Terms, please contact us at <a href="mailto:terms@revuqai.com" className="text-[#0500e2] hover:underline font-bold">support@revuqa.com</a>
                </p>
            </section>
        </div>
      </div>
    </div>
  );
};
