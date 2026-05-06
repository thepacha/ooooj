
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, MessageCircle, HelpCircle, ShieldCheck, Zap, Globe, BarChart3 } from 'lucide-react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
        aria-expanded={isOpen}
      >
        <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-[#0500e2] dark:text-[#4b53fa]' : 'text-slate-900 dark:text-white group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa]'}`}>
          {question}
        </span>
        <div className={`flex-shrink-0 ml-4 p-2 rounded-full transition-all ${isOpen ? 'bg-[#0500e2] text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Faqs: React.FC<{ 
  onLogin: () => void; 
  onSignup: () => void; 
  onPricing: () => void; 
  onLanding: () => void;
  onAbout: () => void;
  onContact: () => void;
  onBlog: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  onRefund: () => void;
  onPartners: () => void;
  onProduct: () => void;
  onCareers: () => void;
  onFaqs?: () => void;
  onFeatures?: () => void;
}> = (props) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqData = [
    {
      category: "General",
      icon: <HelpCircle className="text-blue-500" />,
      questions: [
        {
          question: "What is Revu AI?",
          answer: "Revu AI is an advanced Quality Assurance and agent coaching platform designed for modern support teams. We use cutting-edge AI to automate transcript scoring, analyze customer sentiment, and provide actionable coaching insights to help your team deliver consistent, high-quality service."
        },
        {
          question: "How does it differ from traditional QA?",
          answer: "Traditional QA relies on manually reviewing 1-2% of calls. Revu AI analyzes 100% of your interactions instantly. It eliminates manual bias, provides broader coverage, and identifies coaching opportunities across your entire team in real-time."
        },
        {
          question: "Does Revu AI support Arabic language?",
          answer: "Yes! We are specialists in the MENA region. Revu AI supports various Arabic dialects as well as Modern Standard Arabic, ensuring high accuracy for companies operating across the Middle East."
        }
      ]
    },
    {
      category: "Technology",
      icon: <Zap className="text-amber-500" />,
      questions: [
        {
          question: "How accurate is the automated scoring?",
          answer: "Revu AI achieve over 95% alignment with human-scored rubrics. Our system is trained both on general communication principles and your specific business guidelines, allowing it to understand context, nuance, and intent far better than keyword-matching tools."
        },
        {
          question: "Can I use my own custom quality rubrics?",
          answer: "Absolutely. You can import your existing quality frameworks or build new ones within the platform. You define the criteria (e.g., Empathy, Resolution, Security Compliance), their weights, and specific scoring logic."
        },
        {
          question: "Which platforms do you integrate with?",
          answer: "We support integrations with major CRM and ticketing systems including Zendesk, Salesforce, Intercom, and more. You can also upload transcripts directly via CSV, JSON, or through our robust API."
        }
      ]
    },
    {
      category: "Security & Privacy",
      icon: <ShieldCheck className="text-emerald-500" />,
      questions: [
        {
          question: "How is my data protected?",
          answer: "Security is our top priority. We use enterprise-grade encryption (AES-256) for data at rest and TLS 1.2+ for data in transit. We are fully GDPR and SOC2 compliant, ensuring your customer data is handled with the highest level of care."
        },
        {
          question: "Who owns the data I upload?",
          answer: "You do. You retain 100% ownership of your data and transcripts. We do not use your proprietary customer data to train our foundational models for other customers."
        },
        {
          question: "Can we redact PII (Personally Identifiable Information)?",
          answer: "Yes, our automated PII redaction engine identifies and masks sensitive information like credit card numbers, addresses, and phone numbers before analysis begins."
        }
      ]
    },
    {
        category: "Pricing & Billing",
        icon: <BarChart3 className="text-purple-500" />,
        questions: [
          {
            question: "Is there a free trial?",
            answer: "Yes, we offer a 14-day free trial that includes full access to our platform features and enough credits to analyze your first batch of transcripts."
          },
          {
            question: "How is usage calculated?",
            answer: "Pricing is based on the volume of interactions analyzed per month. We have tiers for teams of all sizes, from startups to large enterprises processing millions of messages."
          },
          {
            question: "Can I change my plan later?",
            answer: "Of course. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
          }
        ]
      }
  ];

  const filteredFaqs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <PublicNavigation 
        user={null}
        activePage="landing"
        onLogin={props.onLogin}
        onSignup={props.onSignup}
        onPricing={props.onPricing}
        onLanding={props.onLanding}
        onAbout={props.onAbout}
        onContact={props.onContact}
        onBlogClick={props.onBlog}
        onProductClick={props.onProduct}
        onFeaturesClick={props.onFeatures}
      />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                Frequently Asked <span className="text-[#0500e2] dark:text-[#4b53fa]">Questions</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Everything you need to know about Revu AI. Can't find what you're looking for? 
                <button onClick={props.onContact} className="text-[#0500e2] dark:text-[#4b53fa] hover:underline ml-1 font-semibold">Contact our support team.</button>
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative max-w-xl mx-auto"
            >
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0500e2]/20 focus:border-[#0500e2] transition-all text-slate-900 dark:text-white outline-none"
              />
            </motion.div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-16">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, catIndex) => (
                <div key={catIndex}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                      {category.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {category.category}
                    </h2>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 px-8 shadow-sm border border-slate-100 dark:border-slate-800">
                    {category.questions.map((faq, index) => {
                      const globalIndex = catIndex * 100 + index;
                      return (
                        <FAQItem
                          key={index}
                          question={faq.question}
                          answer={faq.answer}
                          isOpen={openIndex === globalIndex}
                          onClick={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No questions found</h3>
                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search terms or contact us for help.</p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 bg-[#0500e2] rounded-[2rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/20"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Still have questions?</h2>
              <p className="text-lg text-blue-100 mb-10 leading-relaxed">
                We're here to help you revolutionize your quality assurance process. 
                Our experts are ready to answer any specific technical or business questions you might have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={props.onContact}
                  className="px-8 py-4 bg-white text-[#0500e2] rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl"
                >
                  Contact Support
                </button>
                <button 
                  onClick={props.onAbout}
                  className="px-8 py-4 bg-[#0500e2] border border-blue-400/30 text-white rounded-full font-bold text-lg hover:bg-blue-600 transition-all"
                >
                  Learn More
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer 
        onTermsClick={props.onTerms}
        onPrivacyClick={props.onPrivacy}
        onRefundClick={props.onRefund}
        onPartnersClick={props.onPartners}
        onAboutClick={props.onAbout}
        onContactClick={props.onContact}
        onBlogClick={props.onBlog}
        onHomeClick={props.onLanding}
        onPricingClick={props.onPricing}
        onProductClick={props.onProduct}
        onCareersClick={props.onCareers}
        onFaqsClick={props.onFaqs || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
        onFeaturesClick={props.onFeatures}
      />
    </div>
  );
};
