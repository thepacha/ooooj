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
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `);
}
