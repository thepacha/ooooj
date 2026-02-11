
import React from 'react';
import { PublicNavigation } from './PublicNavigation';
import { ArrowLeft } from 'lucide-react';

interface PrivacyProps {
  onBack: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
}

export const Privacy: React.FC<PrivacyProps> = ({ onBack, onLogin, onSignup, onPricing }) => {
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

        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-12">Latest update: {new Date().toLocaleDateString()}</p>

        <div className="space-y-12 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Owner and Data Controller</h2>
                <p>
                    RevuQA AI Inc.<br />
                    123 Innovation Drive<br />
                    Suite 400<br />
                    San Francisco, CA 94103, USA
                </p>
                <p className="mt-2">
                    <strong>Owner contact email:</strong> <a href="mailto:privacy@revuqai.com" className="text-[#0500e2] font-bold">privacy@revuqai.com</a>
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Types of Data Collected</h2>
                <p>
                    Among the types of Personal Data that this Application collects, by itself or through third parties, there are: Usage Data; email address; first name; last name; password; profile picture; Cookies; Audio Recordings; Transcripts; and Analysis Results.
                </p>
                <p className="mt-4">
                    Complete details on each type of Personal Data collected are provided in the dedicated sections of this privacy policy or by specific explanation texts displayed prior to the Data collection.
                    Personal Data may be freely provided by the User, or, in case of Usage Data, collected automatically when using this Application.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Mode and Place of Processing</h2>
                <p>
                    <strong>Methods of processing:</strong> The Owner takes appropriate security measures to prevent unauthorized access, disclosure, modification, or unauthorized destruction of the Data. The Data processing is carried out using computers and/or IT enabled tools, following organizational procedures and modes strictly related to the purposes indicated.
                </p>
                <p className="mt-4">
                    <strong>Place:</strong> The Data is processed at the Owner's operating offices and in any other places where the parties involved in the processing are located. Depending on the User's location, data transfers may involve transferring the User's Data to a country other than their own.
                </p>
                <p className="mt-4">
                    <strong>Retention time:</strong> Personal Data shall be processed and stored for as long as required by the purpose they have been collected for. Audio files and transcripts may be deleted by the User at any time via the application interface.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Detailed Information on the Processing of Personal Data</h2>
                <p className="mb-6">Personal Data is collected for the following purposes and using the following services:</p>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Artificial Intelligence & Analysis</h3>
                        <p className="mb-2">We use advanced AI models to process audio and text content provided by you for the purpose of quality assurance scoring and coaching.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Google Gemini (Google LLC):</strong> Used for natural language processing, audio transcription, and sentiment analysis. 
                                <br/><span className="text-sm text-slate-500">Personal Data processed: Audio Recordings; Transcripts; Usage Data. Place of processing: United States.</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hosting and Backend Infrastructure</h3>
                        <p className="mb-2">These services have the purpose of hosting Data and files that enable this Application to run and be distributed.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Supabase (Supabase, Inc.):</strong> Used for database hosting, authentication, and file storage.
                                <br/><span className="text-sm text-slate-500">Personal Data processed: email address; password; Usage Data; various types of Data. Place of processing: United States.</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Managing Contacts and Sending Messages</h3>
                        <p className="mb-2">This type of service makes it possible to manage a database of email contacts to communicate with the User (e.g. password resets, billing notifications).</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Brevo (Sendinblue SAS):</strong> Brevo is an email address management and message sending service.
                                <br/><span className="text-sm text-slate-500">Personal Data processed: email address; Usage Data. Place of processing: France (EU) – <a href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noreferrer" className="text-[#0500e2] hover:underline">Privacy Policy</a>.</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Analytics</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Google Analytics (Google LLC):</strong> Used to monitor and analyze web traffic.
                                <br/><span className="text-sm text-slate-500">Personal Data processed: Cookies; Usage Data. Place of processing: United States.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">The Rights of Users</h2>
                <p>
                    Users may exercise certain rights regarding their Data processed by the Owner. In particular, Users have the right to do the following:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                    <li>Withdraw their consent at any time.</li>
                    <li>Object to processing of their Data.</li>
                    <li>Access their Data.</li>
                    <li>Verify and seek rectification.</li>
                    <li>Restrict the processing of their Data.</li>
                    <li>Have their Personal Data deleted or otherwise removed.</li>
                    <li>Lodge a complaint with their competent data protection authority.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@revuqai.com" className="text-[#0500e2] hover:underline font-bold">privacy@revuqai.com</a>
                </p>
            </section>
        </div>
      </div>
    </div>
  );
};
