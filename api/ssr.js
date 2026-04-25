export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Revu | AI-Powered QA & Agent Coaching for Contact Centers</title>
        <meta name="description" content="Automate call QA scoring, agent coaching, and AI roleplay training for Arabic-English contact centers in MENA." />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Revu",
          "url": "https://revuqai.com"
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Can I change my plan later?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
              }
            },
            {
              "@type": "Question",
              "name": "What payment methods do you accept?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We accept all major credit cards, PayPal, and wire transfers for annual enterprise plans."
              }
            },
            {
              "@type": "Question",
              "name": "Is there a discount for non-profits?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we offer a 50% discount for registered non-profit organizations. Please contact our sales team for more information."
              }
            },
            {
              "@type": "Question",
              "name": "Do you offer refunds?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer a 30-day money-back guarantee for all our paid plans. If you are not satisfied, simply contact our support team."
              }
            }
          ]
        }
        </script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `);
}
