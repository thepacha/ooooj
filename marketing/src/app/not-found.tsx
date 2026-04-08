import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Could not find requested resource</p>
        <Link href="/" className="px-6 py-3 bg-[#0500e2] text-white rounded-full font-bold">
          Return Home
        </Link>
      </div>
    </div>
  );
}
