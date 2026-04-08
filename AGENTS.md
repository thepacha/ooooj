# Future Development Rules

## Public-Facing Pages (Marketing, Landing, Blog, etc.)
- **SEO-Friendly Stack:** Use an SEO-friendly stack (Next.js with SSR/SSG or static HTML) for all marketing, landing, or public-facing pages.
- **No Pure CSR:** Do NOT use Vite + React (CSR) for any marketing or public pages. Ensure all important content is visible in the initial HTML.
- **Semantic HTML:** Use semantic HTML structure (`<h1>`, `<h2>`, `<p>`, `<section>`, etc.).
- **Metadata:** Include proper SEO metadata (title, description).
- **Crawlability:** Keep pages lightweight and crawlable by AI bots.
- **Vite + React Usage:** The React + Vite app should ONLY be used for the authenticated dashboard (app subdomain).
