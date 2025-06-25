import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-4">LegalMind AI</h1>
      <p className="text-lg text-center max-w-xl mb-6">
        Hukuk ve teknolojinin kesişim noktasında yer alan yeni nesil hukuk platformu.
      </p>

      <div className="flex gap-4 flex-wrap justify-center mb-6">
        <Link href="/contract">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition-all duration-300">
            Hemen Analiz Et
          </button>
        </Link>
        <Link href="/translation">
          <button className="bg-gray-200 px-6 py-2 rounded-xl shadow hover:bg-gray-300 transition-all duration-300">
            Hukuki Çeviri
          </button>
        </Link>
        <Link href="/blog">
          <button className="bg-gray-200 px-6 py-2 rounded-xl shadow hover:bg-gray-300 transition-all duration-300">
            Makaleler
          </button>
        </Link>
        <Link href="/about">
          <button className="bg-gray-200 px-6 py-2 rounded-xl shadow hover:bg-gray-300 transition-all duration-300">
            Hakkımızda
          </button>
        </Link>
      </div>

      <footer className="mt-10 text-sm text-gray-500">
        LegalMind AI © 2025 - Tüm hakları saklıdır.
      </footer>
    </main>
  );
}
