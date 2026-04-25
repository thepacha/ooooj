import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Revu | AI-Powered QA & Agent Coaching for Contact Centers",
  description: "Automate call QA scoring, agent coaching, and AI roleplay training for Arabic-English contact centers in MENA.",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Revu",
              "description": "AI-powered QA scoring and agent coaching for contact centers in MENA",
              "url": "https://revuqai.com",
              "applicationCategory": "BusinessApplication"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Revu",
              "url": "https://revuqai.com",
              "description": "AI-powered QA and agent coaching for MENA contact centers",
              "areaServed": ["UAE", "Saudi Arabia"]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Revu",
              "url": "https://revuqai.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://revuqai.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Revu AI QA",
              "description": "AI-powered QA scoring and agent coaching for contact centers",
              "category": "Quality Assurance Software",
              "brand": {
                "@type": "Brand",
                "name": "Revu"
              },
              "offers": {
                "@type": "Offer",
                "url": "https://revuqai.com/pricing",
                "priceCurrency": "USD",
                "price": "0",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
