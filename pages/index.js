import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">LegalMind AI</h1>
        <div className="space-x-6">
          <Link href="/contract" className="hover:text-blue-700 font-medium">Sözleşme Analizi</Link>
          <Link href="/translation" className="hover:text-blue-700 font-medium">Hukuki Çeviri</Link>
          <Link href="/blog" className="hover:text-blue-700 font-medium">Makaleler</Link>
          <Link href="/about" className="hover:text-blue-700 font-medium">Hakkımızda</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-r from-blue-50 to-white">
        <h2 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-4">
          Hukuk ve Teknolojinin Kesişim Noktası
        </h2>
        <p className="text-lg md:text-xl max-w-xl text-gray-600 mb-8">
          LegalMind AI, sözleşme analizleri ve yapay zeka destekli hukuk hizmetleriyle yeni nesil hukuk platformudur.
        </p>

        <Link href="/contract">
          <button className="bg-gradient-to-r from-blue-600 to-blue-800 text-white text-lg font-semibold px-8 py-3 rounded-2xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
            Hemen Analiz Et
          </button>
        </Link>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 text-center text-sm text-gray-500 border-t">
        LegalMind AI © 2025 - Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
