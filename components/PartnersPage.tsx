import React from 'react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Handshake } from 'lucide-react';

// Import Logos
import { TidioLogo } from './TidioLogo';
import { AssemblyAILogo } from './AssemblyAILogo';
import { AlgoliaLogo } from './AlgoliaLogo';
import { AiSdrLogoLight, AiSdrLogoDark } from './AiSdrLogo';
import { LiveChatLogo } from './LiveChatLogo';
import { MixpanelLogo } from './MixpanelLogo';
import { ApolloLogo } from './ApolloLogo';
import { LemlistLogo } from './LemlistLogo';
import { TrainualLogo } from './TrainualLogo';

interface PartnersPageProps {
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
  onBack: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
  onRefundClick: () => void;
}

export const PartnersPage: React.FC<PartnersPageProps> = ({ 
  onLogin, 
  onSignup, 
  onPricing, 
  onBack,
  onTermsClick,
  onPrivacyClick,
  onRefundClick
}) => {
  const { t, isRTL } = useLanguage();

  const partners = [
    { 
      name: 'ElevenLabs', 
      url: 'https://elevenlabs.io/startup-grants', 
      logo: (
        <>
          <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs" className="w-[150px] dark:hidden" />
          <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/cy7rxce8uki-IIElevenLabsGrants%201.webp" alt="ElevenLabs" className="w-[150px] hidden dark:block" />
        </>
      ),
      description: "The most realistic AI speech software."
    },
    { 
      name: 'Tidio', 
      url: 'https://affiliate.tidio.com/9xkyz0qoz9ls', 
      logo: (
        <>
          <TidioLogo className="w-[120px] h-auto dark:hidden" fill="#000B26" />
          <TidioLogo className="w-[120px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "Customer service platform that helps you grow your business."
    },
    { 
      name: 'AssemblyAI', 
      url: 'https://www.assemblyai.com/', 
      logo: (
        <>
          <AssemblyAILogo className="w-[140px] h-auto dark:hidden" fill="#09032F" />
          <AssemblyAILogo className="w-[140px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "Speech AI models to transcribe and understand speech."
    },
    { 
      name: 'Algolia', 
      url: 'https://www.algolia.com/', 
      logo: (
        <>
          <AlgoliaLogo className="w-[130px] h-auto dark:hidden" fill="#003dff" />
          <AlgoliaLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "The world's only end-to-end AI Search and Discovery platform."
    },
    { 
      name: 'AiSdr', 
      url: 'https://partner.aisdr.com/eaunie6ih0qb', 
      logo: (
        <>
          <AiSdrLogoLight className="w-[130px] h-auto dark:hidden" />
          <AiSdrLogoDark className="w-[130px] h-auto hidden dark:block" />
        </>
      ),
      description: "AI Sales Development Representative that books meetings for you."
    },
    { 
      name: 'LiveChat', 
      url: 'https://www.livechat.com/?a=vkKISurVg&utm_campaign=pp_livechat-default&utm_source=PP', 
      logo: (
        <>
          <LiveChatLogo className="w-[130px] h-auto dark:hidden" fill="#1B1B20" />
          <LiveChatLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "Complete customer service platform that delights your customers."
    },
    { 
      name: 'Mixpanel', 
      url: 'https://mixpanel.com/home/', 
      logo: (
        <>
          <MixpanelLogo className="w-[130px] h-auto dark:hidden" fill="#7856FF" />
          <MixpanelLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "Powerful product analytics to help you convert, engage, and retain users."
    },
    { 
      name: 'Apollo', 
      url: 'https://get.apollo.io/lu68l2625bfq', 
      logo: (
        <>
          <ApolloLogo className="w-[130px] h-auto dark:hidden" fill="#1B1B20" />
          <ApolloLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "The all-in-one go-to-market platform for your entire team."
    },
    { 
      name: 'Lemlist', 
      url: 'https://get.lemlist.com/om1pnwx0qp22', 
      logo: (
        <>
          <LemlistLogo className="w-[130px] h-auto dark:hidden" fill="#1D1D1B" />
          <LemlistLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "The only cold outreach tool that helps you reach the inbox."
    },
    { 
      name: 'Trainual', 
      url: 'https://start.trainual.com/5pc28cs7v3j9', 
      logo: (
        <>
          <TrainualLogo className="w-[130px] h-auto dark:hidden" fill="#5A26D8" />
          <TrainualLogo className="w-[130px] h-auto hidden dark:block" fill="white" />
        </>
      ),
      description: "The top-rated training manual software for growing businesses."
    },
  ];

  return (
    <div className={`min-h-screen bg-[#f8faff] dark:bg-[#020617] font-sans text-slate-900 dark:text-white overflow-x-hidden ${isRTL ? 'rtl' : ''}`}>
      
      {/* Navigation */}
      <PublicNavigation 
        onLogin={onLogin}
        onSignup={onSignup}
        onPricing={onPricing}
        onLanding={onBack}
        activePage="partners"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-8 px-6 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-full shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-[#0500e2]"></span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">Our Ecosystem</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a0f2c] dark:text-white tracking-tight mb-6 leading-[1.2]">
                Building the Future <br />
                <span className="text-[#0500e2]">Together</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-2xl mx-auto">
                We partner with world-class technology companies to deliver the best experience for our customers.
            </p>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-4 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {partners.map((partner, index) => (
                    <div 
                        key={index}
                        className="group bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div className="h-24 flex items-center justify-center mb-6 w-full">
                            <div className="transform group-hover:scale-105 transition-transform duration-300">
                                {partner.logo}
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{partner.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                            {partner.description}
                        </p>
                        
                        <a 
                            href={partner.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-3 px-6 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm hover:bg-[#0500e2] hover:text-white dark:hover:bg-[#0500e2] transition-colors flex items-center justify-center gap-2 group-hover:shadow-md"
                        >
                            Visit Website
                            <ArrowRight size={16} />
                        </a>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto bg-[#0500e2] rounded-[3rem] px-8 py-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
                      <Handshake size={32} className="text-white" />
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                      Become a Partner
                  </h2>
                  <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
                      Join our ecosystem and help us revolutionize the way businesses analyze customer interactions.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button 
                        onClick={() => window.location.href = 'mailto:partners@revuqai.com'}
                        className="px-10 py-4 bg-white text-[#0500e2] rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                      >
                          Contact Us
                      </button>
                  </div>
              </div>
          </div>
      </section>

      <Footer 
        onTermsClick={onTermsClick} 
        onPrivacyClick={onPrivacyClick} 
        onRefundClick={onRefundClick}
      />
    </div>
  );
};
