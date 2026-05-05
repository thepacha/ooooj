import React from 'react';
import { PublicNavigation } from './PublicNavigation';
import { Footer } from './Footer';

interface BlogProps {
  onBack: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onPricing: () => void;
  onAbout: () => void;
  onPartners: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
  onRefundClick: () => void;
  onContactClick: () => void;
  onBlogClick: () => void;
  onCareersClick?: () => void;
  onProductClick?: () => void;
  onFaqsClick?: () => void;
}

const BLOG_POSTS = [
  {
    id: 1,
    title: 'The Future of QA in Contact Centers',
    excerpt: 'How AI is transforming the way we evaluate agent performance and ensure quality at scale.',
    date: 'April 20, 2026',
    readTime: '5 min read',
    category: 'Industry Trends'
  },
  {
    id: 2,
    title: '5 Ways to Improve First Call Resolution',
    excerpt: 'Actionable tips and strategies to help your support team solve customer issues on the very first interaction.',
    date: 'April 15, 2026',
    readTime: '4 min read',
    category: 'Best Practices'
  },
  {
    id: 3,
    title: 'Introducing Revu AI Roleplay Coaching',
    excerpt: 'Learn about our newest feature that allows agents to practice with AI before talking to real customers.',
    date: 'April 02, 2026',
    readTime: '3 min read',
    category: 'Product Updates'
  }
];

export function Blog({
  onBack,
  onLogin,
  onSignup,
  onPricing,
  onAbout,
  onPartners,
  onTermsClick,
  onPrivacyClick,
  onRefundClick,
  onContactClick,
  onBlogClick,
  onCareersClick,
  onProductClick,
  onFaqsClick
}: BlogProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <PublicNavigation 
        onLanding={onBack}
        onLogin={onLogin}
        onSignup={onSignup}
        onPricing={onPricing}
        onAbout={onAbout}
        onContact={onContactClick}
        onBlogClick={onBlogClick}
        onProductClick={onProductClick}
        activePage="blog"
      />
      
      <main className="flex-grow pt-32 pb-24 px-6 relative z-10 w-full max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
            The Revu AI Blog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Insights, strategies, and updates on AI-powered quality assurance and contact center performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {BLOG_POSTS.map((post) => (
            <article 
              key={post.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="p-8 flex flex-col flex-grow">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#0500e2]/10 dark:bg-[#4b53fa]/20 text-[#0500e2] dark:text-[#4b53fa] rounded-full text-xs font-semibold tracking-wide uppercase">
                    {post.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 hover:text-[#0500e2] dark:hover:text-[#4b53fa] cursor-pointer transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-500 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                  <time dateTime={post.date}>{post.date}</time>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer 
        onTermsClick={onTermsClick}
        onPrivacyClick={onPrivacyClick}
        onRefundClick={onRefundClick}
        onContactClick={onContactClick}
        onBlogClick={onBlogClick}
        onProductClick={onProductClick}
        onCareersClick={onCareersClick}
        onAboutClick={onAbout}
        onPartnersClick={onPartners}
        onPricingClick={onPricing}
        onHomeClick={onBack}
        onFaqsClick={onFaqsClick}
      />
    </div>
  );
}
